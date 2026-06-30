from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from typing import Any

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
except Exception:
    FastAPI = None
    BaseModel = object

from ortools.sat.python import cp_model


DAYS = {
    0: "Pazartesi",
    1: "SalÄ±",
    2: "Ã‡arÅŸamba",
    3: "PerÅŸembe",
    4: "Cuma",
    5: "Cumartesi",
    6: "Pazar",
}


@dataclass(frozen=True)
class Block:
    index: int
    cls: str
    subj: str
    teacher_id: int
    length: int


def split_blocks(hours: int) -> list[int]:
    blocks: list[int] = []
    while hours >= 2:
        blocks.append(2)
        hours -= 2
    if hours == 1:
        blocks.append(1)
    return blocks


def solve_program(payload: dict[str, Any]) -> dict[str, Any]:
    program = payload.get("programData") or payload
    teachers = program.get("teachers") or []
    class_plan = program.get("classPlan") or {}
    settings = program.get("settings") or {}
    teacher_unavailable = program.get("teacherUnavailable") or {}

    days = list(settings.get("days") or [0, 1, 2, 3, 4])
    hours_per_day = int(settings.get("hoursPerDay") or 7)
    classes = sorted(class_plan.keys(), key=class_sort_key)

    teacher_by_id = {int(t["id"]): t for t in teachers if "id" in t}
    assignment_by_class_subject: dict[tuple[str, str], tuple[int, int]] = {}
    distribution_errors: list[str] = []

    for teacher in teachers:
        tid = int(teacher.get("id"))
        for assignment in teacher.get("assignments") or []:
            cls = assignment.get("cls")
            subj = assignment.get("subj")
            if not cls or not subj:
                continue
            wh = int(assignment.get("wh") or 0)
            key = (str(cls), str(subj))
            if key in assignment_by_class_subject:
                distribution_errors.append(f"{cls} {subj}: birden fazla Ã¶ÄŸretmen atanmÄ±ÅŸ.")
                continue
            assignment_by_class_subject[key] = (tid, wh)

    for cls in classes:
        total = 0
        for lesson in class_plan.get(cls) or []:
            subj = str(lesson.get("subj") or "")
            wh = int(lesson.get("wh") or 0)
            total += wh
            if (cls, subj) not in assignment_by_class_subject:
                distribution_errors.append(f"{cls} {subj}: ders daÄŸÄ±tÄ±mÄ±nda Ã¶ÄŸretmen yok.")
        expected = len(days) * hours_per_day
        if total != expected:
            distribution_errors.append(f"{cls}: ders planÄ± {total}/{expected} saat.")

    if distribution_errors:
        return {
            "ok": False,
            "status": "invalid_distribution",
            "error": "Ders daÄŸÄ±tÄ±mÄ± OR-Tools'a gÃ¶nderilmeden Ã¶nce dÃ¼zeltilmeli.",
            "issues": distribution_errors,
        }

    blocks: list[Block] = []
    for cls in classes:
        for lesson in class_plan.get(cls) or []:
            subj = str(lesson.get("subj"))
            wh = int(lesson.get("wh") or 0)
            tid, assigned_wh = assignment_by_class_subject[(cls, subj)]
            for length in split_blocks(assigned_wh or wh):
                blocks.append(Block(len(blocks), cls, subj, tid, length))

    strict = solve_blocks_with_model(
        blocks,
        teachers,
        teacher_by_id,
        teacher_unavailable,
        days,
        hours_per_day,
        with_time_limit(payload, float(payload.get("timeLimitSeconds") or 4)),
        relax_unavailable=False,
    )
    if strict.get("ok"):
        return strict

    day_opened = solve_by_opening_free_days_in_order(
        blocks,
        teachers,
        teacher_by_id,
        teacher_unavailable,
        days,
        hours_per_day,
        payload,
    )
    if day_opened.get("ok"):
        return day_opened
    return {
        "ok": False,
        "status": day_opened.get("status") or strict.get("status"),
        "error": "OR-Tools bu dağıtım için uygun program bulamadı.",
        "issues": day_opened.get("issues") or strict.get("issues") or build_infeasible_hints(teachers, teacher_unavailable, days, hours_per_day),
    }


def solve_by_opening_free_days_in_order(
    blocks: list[Block],
    teachers: list[dict[str, Any]],
    teacher_by_id: dict[int, dict[str, Any]],
    teacher_unavailable: dict[str, Any],
    days: list[int],
    hours_per_day: int,
    payload: dict[str, Any],
) -> dict[str, Any]:
    attempted: list[str] = []
    max_attempts = int(payload.get("maxFreeDayAttempts") or 6)
    attempt_seconds = float(payload.get("freeDayAttemptSeconds") or 1.2)
    attempts = 0
    for teacher in teachers:
        tid = int(teacher.get("id"))
        blocked_days = full_or_heavy_blocked_days(teacher_unavailable, tid, days, hours_per_day)
        for day, hours in blocked_days:
            if attempts >= max_attempts:
                return {
                    "ok": False,
                    "status": "free_day_attempt_limit",
                    "issues": attempted[:8] or build_infeasible_hints(teachers, teacher_unavailable, days, hours_per_day),
                }
            attempts += 1
            modified = copy_unavailable(teacher_unavailable)
            for hour in hours:
                modified.setdefault(str(tid), {}).pop(f"{day}_{hour}", None)
                if tid in modified:
                    modified[tid].pop(f"{day}_{hour}", None)
            result = solve_blocks_with_model(
                blocks,
                teachers,
                teacher_by_id,
                modified,
                days,
                hours_per_day,
                with_time_limit(payload, attempt_seconds),
                relax_unavailable=False,
            )
            label = f"{teacher.get('name', tid)} Ã¶ÄŸretmenin {day_name(day)} {compact_hours_label(hours)} saatleri"
            attempted.append(f"{label} aÃ§Ä±ldÄ± ama program oturmadÄ±.")
            if result.get("ok"):
                result["adjustments"] = [{
                    "teacherId": tid,
                    "teacher": teacher.get("name", tid),
                    "day": day,
                    "hours": hours,
                    "text": f"{label} aÃ§Ä±ldÄ±.",
                }]
                result.setdefault("stats", {})["openedFreeDaySequentially"] = True
                return result
    return {
        "ok": False,
        "status": "free_day_opening_failed",
        "issues": attempted[:8] or build_infeasible_hints(teachers, teacher_unavailable, days, hours_per_day),
    }


def solve_blocks_with_model(
    blocks: list[Block],
    teachers: list[dict[str, Any]],
    teacher_by_id: dict[int, dict[str, Any]],
    teacher_unavailable: dict[str, Any],
    days: list[int],
    hours_per_day: int,
    payload: dict[str, Any],
    relax_unavailable: bool,
) -> dict[str, Any]:
    model = cp_model.CpModel()
    var_by_block: dict[int, list[tuple[Any, int, int]]] = {}
    class_slot_vars: dict[tuple[str, int, int], list[Any]] = {}
    teacher_slot_vars: dict[tuple[int, int, int], list[Any]] = {}
    subject_day_vars: dict[tuple[str, str, int], list[Any]] = {}
    penalty_terms: list[Any] = []
    no_candidate: list[str] = []
    candidate_meta: dict[Any, tuple[Block, int, int]] = {}

    for block in blocks:
        candidates: list[tuple[Any, int, int]] = []
        for day in days:
            for start in range(0, hours_per_day - block.length + 1):
                blocked_hours = blocked_hours_for_block(teacher_unavailable, block.teacher_id, day, start, block.length)
                if blocked_hours and not relax_unavailable:
                    continue
                var = model.NewBoolVar(f"b{block.index}_d{day}_h{start}")
                candidates.append((var, day, start))
                candidate_meta[var] = (block, day, start)
                if blocked_hours:
                    for _ in blocked_hours:
                        penalty_terms.append(var)
                subject_day_vars.setdefault((block.cls, block.subj, day), []).append(var)
                for offset in range(block.length):
                    hour = start + offset
                    class_slot_vars.setdefault((block.cls, day, hour), []).append(var)
                    teacher_slot_vars.setdefault((block.teacher_id, day, hour), []).append(var)
        if not candidates:
            teacher = teacher_by_id.get(block.teacher_id, {})
            name = teacher.get("name", block.teacher_id)
            openings = teacher_opening_hints(block.teacher_id, teacher_unavailable, days, hours_per_day, limit=1)
            if openings:
                no_candidate.append(f"{block.cls} {block.subj} iÃ§in {name} Ã¶ÄŸretmenin {openings[0]} saatlerini aÃ§Ä±n.")
            else:
                no_candidate.append(f"{block.cls} {block.subj}: {name} Ã¶ÄŸretmen iÃ§in uygun blok yok; ders daÄŸÄ±tÄ±mÄ±nÄ± azaltÄ±n veya Ã¶ÄŸretmeni deÄŸiÅŸtirin.")
        else:
            model.AddExactlyOne(var for var, _, _ in candidates)
            var_by_block[block.index] = candidates

    if no_candidate:
        return {
            "ok": False,
            "status": "no_candidate",
            "error": "BazÄ± bloklar iÃ§in hiÃ§ uygun saat yok.",
            "issues": no_candidate,
        }

    for vars_ in class_slot_vars.values():
        model.AddAtMostOne(vars_)
    for vars_ in teacher_slot_vars.values():
        model.AddAtMostOne(vars_)
    for vars_ in subject_day_vars.values():
        model.AddAtMostOne(vars_)
    if relax_unavailable and penalty_terms:
        model.Minimize(sum(penalty_terms))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(payload.get("timeLimitSeconds") or 20)
    solver.parameters.num_search_workers = int(payload.get("workers") or 8)
    solver.parameters.random_seed = int(payload.get("seed") or 1)

    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "ok": False,
            "status": solver.StatusName(status),
            "error": "OR-Tools bu daÄŸÄ±tÄ±m iÃ§in uygun program bulamadÄ±.",
            "issues": build_infeasible_hints(teachers, teacher_unavailable, days, hours_per_day),
        }

    schedule: dict[str, dict[str, str]] = {}
    adjustment_slots: dict[tuple[int, int, int], dict[str, Any]] = {}
    for block in blocks:
        for var, day, start in var_by_block[block.index]:
            if not solver.BooleanValue(var):
                continue
            for offset in range(block.length):
                hour = start + offset
                schedule[f"{block.teacher_id}_{day}_{hour}"] = {"cls": block.cls, "subj": block.subj}
                if is_teacher_unavailable(teacher_unavailable, block.teacher_id, day, hour):
                    teacher = teacher_by_id.get(block.teacher_id, {})
                    adjustment_slots[(block.teacher_id, day, hour)] = {
                        "teacherId": block.teacher_id,
                        "teacher": teacher.get("name", block.teacher_id),
                        "day": day,
                        "hour": hour,
                    }
            break

    adjustments = summarize_adjustments(adjustment_slots)
    return {
        "ok": True,
        "status": solver.StatusName(status),
        "schedule": schedule,
        "adjustments": adjustments,
        "stats": {
            "blocks": len(blocks),
            "slots": len(schedule),
            "wallTime": solver.WallTime(),
            "relaxedUnavailable": bool(adjustments),
        },
    }


def copy_unavailable(unavailable: dict[str, Any]) -> dict[str, Any]:
    copied: dict[str, Any] = {}
    for tid, blocked in (unavailable or {}).items():
      copied[tid] = dict(blocked or {})
    return copied


def with_time_limit(payload: dict[str, Any], seconds: float) -> dict[str, Any]:
    cloned = dict(payload)
    cloned["timeLimitSeconds"] = max(0.5, float(seconds))
    return cloned


def full_or_heavy_blocked_days(
    unavailable: dict[str, Any],
    tid: int,
    days: list[int],
    hours_per_day: int,
) -> list[tuple[int, list[int]]]:
    blocked = unavailable.get(str(tid)) or unavailable.get(tid) or {}
    day_hours: list[tuple[int, list[int]]] = []
    for day in days:
        hours = [h for h in range(hours_per_day) if blocked.get(f"{day}_{h}")]
        if hours:
            day_hours.append((day, hours))
    full_days = [(day, hours) for day, hours in day_hours if len(hours) >= hours_per_day]
    if full_days:
        return full_days
    return sorted(day_hours, key=lambda item: len(item[1]), reverse=True)[:1]


def blocked_hours_for_block(unavailable: dict[str, Any], tid: int, day: int, start: int, length: int) -> list[int]:
    return [start + offset for offset in range(length) if is_teacher_unavailable(unavailable, tid, day, start + offset)]


def is_teacher_unavailable(unavailable: dict[str, Any], tid: int, day: int, hour: int) -> bool:
    blocked = unavailable.get(str(tid)) or unavailable.get(tid) or {}
    return bool(blocked.get(f"{day}_{hour}"))


def summarize_adjustments(slots: dict[tuple[int, int, int], dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[int, int], dict[str, Any]] = {}
    for item in slots.values():
        key = (int(item["teacherId"]), int(item["day"]))
        grouped.setdefault(
            key,
            {
                "teacherId": item["teacherId"],
                "teacher": item["teacher"],
                "day": item["day"],
                "hours": [],
            },
        )
        grouped[key]["hours"].append(int(item["hour"]))
    result = []
    for item in grouped.values():
        hours = sorted(set(item["hours"]))
        item["hours"] = hours
        item["text"] = f"{item['teacher']} Ã¶ÄŸretmenin {day_name(item['day'])} {compact_hours_label(hours)} saatleri aÃ§Ä±ldÄ±."
        result.append(item)
    result.sort(key=lambda item: (str(item["teacher"]), int(item["day"])))
    return result


def teacher_capacity_errors(
    teachers: list[dict[str, Any]],
    unavailable: dict[str, Any],
    days: list[int],
    hours_per_day: int,
) -> list[str]:
    errors: list[str] = []
    total_slots = len(days) * hours_per_day
    for teacher in teachers:
        tid = int(teacher.get("id"))
        assigned = sum(int(a.get("wh") or 0) for a in teacher.get("assignments") or [])
        blocked = unavailable.get(str(tid)) or unavailable.get(tid) or {}
        capacity = total_slots - len(blocked)
        if assigned > capacity:
            needed = assigned - capacity
            errors.append(f"{teacher.get('name', tid)} Ã¶ÄŸretmenin en az {needed} saatini aÃ§Ä±n; {assigned} saat dersi var ama uygun kapasite {capacity} saat.")
    return errors


def build_infeasible_hints(
    teachers: list[dict[str, Any]],
    unavailable: dict[str, Any],
    days: list[int],
    hours_per_day: int,
) -> list[str]:
    errors = teacher_capacity_errors(teachers, unavailable, days, hours_per_day)
    if errors:
        return errors
    opening_hints = build_block_opening_hints(teachers, unavailable, days, hours_per_day)
    if opening_hints:
        return opening_hints
    heavy = sorted(
        (
            (sum(int(a.get("wh") or 0) for a in t.get("assignments") or []), t.get("name", t.get("id")))
            for t in teachers
        ),
        reverse=True,
    )
    return [f"{name} Ã¶ÄŸretmenin ders yÃ¼kÃ¼ {load} saat; bu Ã¶ÄŸretmenin ders daÄŸÄ±tÄ±mÄ±nÄ± azaltmayÄ± deneyin." for load, name in heavy[:8]]


def build_block_opening_hints(
    teachers: list[dict[str, Any]],
    unavailable: dict[str, Any],
    days: list[int],
    hours_per_day: int,
) -> list[str]:
    candidates: list[tuple[int, str]] = []
    for teacher in teachers:
        tid = int(teacher.get("id"))
        name = str(teacher.get("name") or tid)
        blocked = unavailable.get(str(tid)) or unavailable.get(tid) or {}
        if not blocked:
            continue
        day_counts: dict[int, list[int]] = {}
        for key in blocked:
            try:
                day_raw, hour_raw = str(key).split("_", 1)
                day = int(day_raw)
                hour = int(hour_raw)
            except ValueError:
                continue
            if day in days and 0 <= hour < hours_per_day:
                day_counts.setdefault(day, []).append(hour)
        for day, hours in day_counts.items():
            hours = sorted(set(hours))
            full_day_bonus = 20 if len(hours) >= hours_per_day else 0
            edge_bonus = 8 if all(h < 3 for h in hours) or all(h >= max(0, hours_per_day - 3) for h in hours) else 0
            score = len(hours) * 10 + full_day_bonus + edge_bonus
            candidates.append((score, f"{name} Ã¶ÄŸretmenin {day_name(day)} {compact_hours_label(hours)} saatlerini aÃ§Ä±n."))
    candidates.sort(reverse=True, key=lambda item: item[0])
    return [text for _, text in candidates[:8]]


def teacher_opening_hints(
    tid: int,
    unavailable: dict[str, Any],
    days: list[int],
    hours_per_day: int,
    limit: int = 3,
) -> list[str]:
    blocked = unavailable.get(str(tid)) or unavailable.get(tid) or {}
    by_day: dict[int, list[int]] = {}
    for key in blocked:
        try:
            day_raw, hour_raw = str(key).split("_", 1)
            day = int(day_raw)
            hour = int(hour_raw)
        except ValueError:
            continue
        if day in days and 0 <= hour < hours_per_day:
            by_day.setdefault(day, []).append(hour)
    ranked = sorted(by_day.items(), key=lambda item: len(item[1]), reverse=True)
    return [f"{day_name(day)} {compact_hours_label(sorted(set(hours)))}" for day, hours in ranked[:limit]]


def compact_hours_label(hours: list[int]) -> str:
    display = sorted({h + 1 for h in hours})
    if not display:
        return ""
    ranges: list[str] = []
    start = prev = display[0]
    for hour in display[1:]:
        if hour == prev + 1:
            prev = hour
            continue
        ranges.append(f"{start}-{prev}" if start != prev else f"{start}")
        start = prev = hour
    ranges.append(f"{start}-{prev}" if start != prev else f"{start}")
    return ", ".join(ranges) + "."


def day_name(day: int) -> str:
    return DAYS.get(day, f"{day}. gÃ¼n")


def class_sort_key(cls: str) -> tuple[int, str]:
    parts = str(cls).split("-", 1)
    try:
        grade = int(parts[0])
    except ValueError:
        grade = 0
    section = parts[1] if len(parts) > 1 else str(cls)
    return grade, section


if FastAPI is not None:
    app = FastAPI(title="Okul Ders ProgramÄ± OR-Tools Solver")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["POST", "GET", "OPTIONS"],
        allow_headers=["*"],
    )

    class SolveRequest(BaseModel):
        programData: dict[str, Any] | None = None
        timeLimitSeconds: int | None = None
        workers: int | None = None
        seed: int | None = None

    @app.get("/health")
    def health() -> dict[str, Any]:
        return {"ok": True}

    @app.post("/solve")
    def solve(request: SolveRequest) -> dict[str, Any]:
        return solve_program(request.model_dump())


def main() -> None:
    payload = json.load(sys.stdin)
    print(json.dumps(solve_program(payload), ensure_ascii=False))


if __name__ == "__main__":
    main()

