from __future__ import annotations

import json
import math
import random
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
    1: "Salı",
    2: "Çarşamba",
    3: "Perşembe",
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


def split_blocks(hours: int, days: list[int] | None = None, hours_per_day: int | None = None) -> list[int]:
    if days and hours_per_day and hours > len(days) * 2:
        blocks: list[int] = []
        remaining = hours
        slots = len(days)
        while slots > 0 and remaining > 0:
            length = min(hours_per_day, math.ceil(remaining / slots))
            blocks.append(length)
            remaining -= length
            slots -= 1
        if remaining > 0:
            blocks.extend(split_blocks(remaining))
        return blocks
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
                distribution_errors.append(f"{cls} {subj}: birden fazla öğretmen atanmış.")
                continue
            assignment_by_class_subject[key] = (tid, wh)

    for cls in classes:
        total = 0
        for lesson in class_plan.get(cls) or []:
            subj = str(lesson.get("subj") or "")
            wh = int(lesson.get("wh") or 0)
            total += wh
            if (cls, subj) not in assignment_by_class_subject:
                distribution_errors.append(f"{cls} {subj}: ders dağıtımında öğretmen yok.")
        expected = len(days) * hours_per_day
        if total != expected:
            distribution_errors.append(f"{cls}: ders planı {total}/{expected} saat.")

    if distribution_errors:
        return {
            "ok": False,
            "status": "invalid_distribution",
            "error": "Ders dağıtımı OR-Tools'a gönderilmeden önce düzeltilmeli.",
            "issues": distribution_errors,
        }

    hard_errors = build_hard_impossibility_errors(teachers, class_plan, teacher_unavailable, days, hours_per_day)
    if hard_errors:
        return {
            "ok": False,
            "status": "hard_impossible",
            "error": "Bu veriyle programın oturması imkansız görünüyor.",
            "issues": hard_errors,
        }

    blocks: list[Block] = []
    for cls in classes:
        for lesson in class_plan.get(cls) or []:
            subj = str(lesson.get("subj"))
            wh = int(lesson.get("wh") or 0)
            tid, assigned_wh = assignment_by_class_subject[(cls, subj)]
            for length in split_blocks(assigned_wh or wh, days, hours_per_day):
                blocks.append(Block(len(blocks), cls, subj, tid, length))

    strict = solve_blocks_with_model(
        blocks,
        teachers,
        teacher_by_id,
        teacher_unavailable,
        days,
        hours_per_day,
        payload,
        relax_unavailable=False,
    )
    if strict.get("ok"):
        return strict

    relaxed = solve_blocks_with_model(
        blocks,
        teachers,
        teacher_by_id,
        teacher_unavailable,
        days,
        hours_per_day,
        with_time_limit(payload, 10),
        relax_unavailable=True,
        relax_scope="edge",
    )
    if relaxed.get("ok"):
        adjustments = relaxed.get("adjustments") or []
        if adjustments:
            return {
                "ok": False,
                "status": "needs_openings",
                "error": "Program, önce sabah veya çıkıştaki kırmızı saatler açılırsa oturabiliyor.",
                "issues": [adjustment_to_hint_text(item) for item in adjustments],
                "adjustments": adjustments,
            }
        return relaxed

    relaxed = solve_blocks_with_model(
        blocks,
        teachers,
        teacher_by_id,
        teacher_unavailable,
        days,
        hours_per_day,
        with_time_limit(payload, 10),
        relax_unavailable=True,
        relax_scope="all",
    )
    if relaxed.get("ok"):
        adjustments = relaxed.get("adjustments") or []
        if adjustments:
            return {
                "ok": False,
                "status": "needs_openings",
                "error": "Program, aşağıdaki kırmızı saatler açılırsa oturabiliyor.",
                "issues": [adjustment_to_hint_text(item) for item in adjustments],
                "adjustments": adjustments,
            }
        return relaxed

    return {
        "ok": False,
        "status": strict.get("status"),
        "error": "OR-Tools bu dağıtım için uygun program bulamadı." if strict.get("status") != "INFEASIBLE" else "Bu veriyle program matematiksel olarak imkansız görünüyor.",
        "issues": strict.get("issues") or build_infeasible_hints(teachers, teacher_unavailable, days, hours_per_day),
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
    relax_scope: str = "all",
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
                if blocked_hours and relax_scope == "edge":
                    if is_full_day_blocked(teacher_unavailable, block.teacher_id, day, hours_per_day):
                        continue
                    if not all(is_edge_hour(hour, hours_per_day) for hour in blocked_hours):
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
                no_candidate.append(f"{block.cls} {block.subj} için {name} öğretmenin {openings[0]} saatlerini açın.")
            else:
                no_candidate.append(f"{block.cls} {block.subj}: {name} öğretmen için uygun blok yok; ders dağıtımını azaltın veya öğretmeni değiştirin.")
        else:
            model.AddExactlyOne(var for var, _, _ in candidates)
            var_by_block[block.index] = candidates

    if no_candidate:
        return {
            "ok": False,
            "status": "no_candidate",
            "error": "Bazı bloklar için hiç uygun saat yok.",
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
    solver.parameters.max_time_in_seconds = float(payload.get("timeLimitSeconds") or 75)
    solver.parameters.num_search_workers = int(payload.get("workers") or 8)
    solver.parameters.random_seed = int(payload.get("seed") or 1)

    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        if status == cp_model.UNKNOWN:
            return {
                "ok": False,
                "status": solver.StatusName(status),
                "error": "OR-Tools 20 saniye içinde programı oturtamadı. Aşağıdaki boş saatleri açmak programı rahatlatabilir.",
                "issues": build_infeasible_hints(teachers, teacher_unavailable, days, hours_per_day),
            }
        return {
            "ok": False,
            "status": solver.StatusName(status),
            "error": "OR-Tools bu dağıtım için uygun program bulamadı.",
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


def is_full_day_blocked(unavailable: dict[str, Any], tid: int, day: int, hours_per_day: int) -> bool:
    return all(is_teacher_unavailable(unavailable, tid, day, hour) for hour in range(hours_per_day))


def is_edge_hour(hour: int, hours_per_day: int) -> bool:
    edge_size = min(3, max(1, hours_per_day // 2))
    return hour < edge_size or hour >= hours_per_day - edge_size


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
        item["text"] = f"{item['teacher']} öğretmenin {day_name(item['day'])} {compact_hours_label(hours)} saatleri açıldı."
        result.append(item)
    result.sort(key=lambda item: (str(item["teacher"]), int(item["day"])))
    return result


def adjustment_to_hint_text(item: dict[str, Any]) -> str:
    return f"{item['teacher']} öğretmenin {day_name(item['day'])} {compact_hours_label(item['hours'])} saatlerini açın."


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
            errors.append(f"{teacher.get('name', tid)} öğretmenin en az {needed} saatini açın; {assigned} saat dersi var ama uygun kapasite {capacity} saat.")
    return errors


def build_hard_impossibility_errors(
    teachers: list[dict[str, Any]],
    class_plan: dict[str, Any],
    unavailable: dict[str, Any],
    days: list[int],
    hours_per_day: int,
) -> list[str]:
    errors: list[str] = []
    expected = len(days) * hours_per_day
    for cls, plan in class_plan.items():
        total = sum(int(lesson.get("wh") or 0) for lesson in (plan or []))
        if total != expected:
            errors.append(f"{cls}: ders planı {total}/{expected} saat.")
        for lesson in plan or []:
            subj = str(lesson.get("subj") or "")
            wh = int(lesson.get("wh") or 0)
            blocks = split_blocks(wh, days, hours_per_day)
            if len(blocks) > len(days):
                errors.append(f"{cls} {subj}: {wh} saat {len(blocks)} parçaya bölünüyor ama haftada {len(days)} gün var; aynı ders aynı gün ikinci kez gelemeyeceği için imkansız.")
            if any(length > hours_per_day for length in blocks):
                errors.append(f"{cls} {subj}: blok uzunluğu günlük ders saatini aşıyor.")

    errors.extend(teacher_capacity_errors(teachers, unavailable, days, hours_per_day))
    for teacher in teachers:
        tid = int(teacher.get("id"))
        name = teacher.get("name", tid)
        for assignment in teacher.get("assignments") or []:
            cls = assignment.get("cls")
            subj = assignment.get("subj")
            for length in split_blocks(int(assignment.get("wh") or 0), days, hours_per_day):
                if not has_any_candidate_slot_for_block(unavailable, tid, days, hours_per_day, length):
                    errors.append(f"{name}: {cls} {subj} için {length} saatlik blok yerleşemiyor; uygun saatlerinde ardışık {length} saat yok.")
    return list(dict.fromkeys(errors))[:20]


def has_any_candidate_slot_for_block(
    unavailable: dict[str, Any],
    tid: int,
    days: list[int],
    hours_per_day: int,
    length: int,
) -> bool:
    for day in days:
        for start in range(0, hours_per_day - length + 1):
            if not blocked_hours_for_block(unavailable, tid, day, start, length):
                return True
    return False


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
    return [f"{name} öğretmenin ders yükü {load} saat; bu öğretmenin ders dağıtımını azaltmayı deneyin." for load, name in heavy[:8]]


def build_block_opening_hints(
    teachers: list[dict[str, Any]],
    unavailable: dict[str, Any],
    days: list[int],
    hours_per_day: int,
) -> list[str]:
    candidates: list[tuple[int, str, str]] = []
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
            candidates.extend(opening_hint_candidates_for_day(name, day, hours, hours_per_day))
    random.shuffle(candidates)
    candidates.sort(reverse=True, key=lambda item: item[0] + random.randint(0, 9))
    picked: list[str] = []
    seen_teacher_types: dict[str, int] = {}
    for _, text, teacher_type in candidates:
        if seen_teacher_types.get(teacher_type, 0) >= 2:
            continue
        picked.append(text)
        seen_teacher_types[teacher_type] = seen_teacher_types.get(teacher_type, 0) + 1
        if len(picked) >= 8:
            return picked
    for _, text, _ in candidates:
        if text not in picked:
            picked.append(text)
        if len(picked) >= 8:
            break
    return picked


def opening_hint_candidates_for_day(
    name: str,
    day: int,
    hours: list[int],
    hours_per_day: int,
) -> list[tuple[int, str, str]]:
    teacher_type = teacher_hint_type(name)
    candidates: list[tuple[int, str, str]] = []
    first_edge = [h for h in range(min(3, hours_per_day)) if h in hours]
    last_edge_start = max(0, hours_per_day - 3)
    last_edge = [h for h in range(last_edge_start, hours_per_day) if h in hours]
    if 2 <= len(first_edge) <= 3:
        candidates.append((72 + len(first_edge), f"{name} öğretmenin {day_name(day)} {compact_hours_label(first_edge)} saatlerini açın.", teacher_type))
    if 2 <= len(last_edge) <= 3:
        candidates.append((70 + len(last_edge), f"{name} öğretmenin {day_name(day)} {compact_hours_label(last_edge)} saatlerini açın.", teacher_type))
    chunks = blocked_hour_chunks(hours)
    for chunk in chunks:
        if len(chunk) <= 3:
            score = 48 + len(chunk) * 4 if all(is_edge_hour(hour, hours_per_day) for hour in chunk) else len(chunk) * 12
            candidates.append((score, f"{name} öğretmenin {day_name(day)} {compact_hours_label(chunk)} saatlerini açın.", teacher_type))
            continue
        for size in (2, 3):
            possible = [chunk[i : i + size] for i in range(0, len(chunk) - size + 1)]
            random.shuffle(possible)
            for part in possible[:2]:
                score = 42 + size if all(is_edge_hour(hour, hours_per_day) for hour in part) else 24 + size
                candidates.append((score, f"{name} öğretmenin {day_name(day)} {compact_hours_label(part)} saatlerini açın.", teacher_type))
    if len(hours) >= hours_per_day:
        candidates.append((8, f"{name} öğretmenin {day_name(day)} boş gününü açın.", teacher_type))
    if len(hours) > 3:
        sample_size = 2 if random.random() < 0.55 else 3
        possible = [hours[i : i + sample_size] for i in range(0, len(hours) - sample_size + 1)]
        random.shuffle(possible)
        for chunk in possible[:2]:
            candidates.append((24, f"{name} öğretmenin {day_name(day)} {compact_hours_label(chunk)} saatlerini açın.", teacher_type))
    return candidates


def blocked_hour_chunks(hours: list[int]) -> list[list[int]]:
    chunks: list[list[int]] = []
    current: list[int] = []
    for hour in sorted(set(hours)):
        if current and hour != current[-1] + 1:
            chunks.append(current)
            current = []
        current.append(hour)
    if current:
        chunks.append(current)
    return chunks


def teacher_hint_type(name: str) -> str:
    cleaned = str(name)
    parts = cleaned.split(".", 1)
    if parts[0].strip().isdigit() and len(parts) > 1:
        cleaned = parts[1].strip()
    return cleaned.replace(" öğretmeni", "").replace("Öğretmeni", "").strip().lower()


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
    top_pool = ranked[: max(limit, min(len(ranked), limit * 3))]
    random.shuffle(top_pool)
    return [f"{day_name(day)} {compact_hours_label(sorted(set(hours)))}" for day, hours in top_pool[:limit]]


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
    return DAYS.get(day, f"{day}. gün")


def class_sort_key(cls: str) -> tuple[int, str]:
    parts = str(cls).split("-", 1)
    try:
        grade = int(parts[0])
    except ValueError:
        grade = 0
    section = parts[1] if len(parts) > 1 else str(cls)
    return grade, section


if FastAPI is not None:
    app = FastAPI(title="Okul Ders Programı OR-Tools Solver")
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

    @app.get("/")
    def home() -> dict[str, Any]:
        return {"status": "API çalışıyor", "service": "ders-programi-solver"}

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

