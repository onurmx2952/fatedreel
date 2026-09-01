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

    requested_limit = float(payload.get("timeLimitSeconds") or 18)
    quick_limit = max(3, min(5, requested_limit * 0.3))
    polish_limit = max(3, min(5, requested_limit * 0.3))
    strict_limit = max(4, min(7, requested_limit * 0.4))
    edge_relax_limit = max(2, min(3, requested_limit * 0.15))
    full_relax_limit = max(3, min(5, requested_limit * 0.25))
    seed = int(payload.get("seed") or 1)
    for ratio in (0.55, 0.45, 0.35, 0.25):
        preferred_free_days = build_preferred_free_days(
            teachers,
            teacher_unavailable,
            days,
            hours_per_day,
            seed,
            ratio,
        )
        if not preferred_free_days:
            continue
        strict = solve_blocks_with_model(
            blocks,
            teachers,
            teacher_by_id,
            teacher_unavailable,
            days,
            hours_per_day,
            with_time_limit(payload, quick_limit),
            relax_unavailable=False,
            free_day_mode="none",
            optimize_quality=False,
            preferred_free_days=preferred_free_days,
        )
        if strict.get("ok"):
            polished = solve_blocks_with_model(
                blocks,
                teachers,
                teacher_by_id,
                teacher_unavailable,
                days,
                hours_per_day,
                with_time_limit(payload, polish_limit),
                relax_unavailable=False,
                free_day_mode="none",
                optimize_quality=True,
                compact_days=False,
                solution_hint=strict.get("placements") or {},
                preferred_free_days=preferred_free_days,
            )
            if polished.get("ok"):
                return polished
            return strict

    strict = solve_blocks_with_model(
        blocks,
        teachers,
        teacher_by_id,
        teacher_unavailable,
        days,
        hours_per_day,
        with_time_limit(payload, strict_limit),
        relax_unavailable=False,
        free_day_mode="none",
        optimize_quality=False,
    )
    if strict.get("ok"):
        return strict

    if strict.get("status") == "UNKNOWN":
        return strict

    relaxed = solve_blocks_with_model(
        blocks,
        teachers,
        teacher_by_id,
        teacher_unavailable,
        days,
        hours_per_day,
        with_time_limit(payload, edge_relax_limit),
        relax_unavailable=True,
        relax_scope="edge",
        free_day_mode="none",
    )
    if relaxed.get("ok"):
        return relaxed

    relaxed = solve_blocks_with_model(
        blocks,
        teachers,
        teacher_by_id,
        teacher_unavailable,
        days,
        hours_per_day,
        with_time_limit(payload, full_relax_limit),
        relax_unavailable=True,
        relax_scope="all",
        free_day_mode="none",
    )
    if relaxed.get("ok"):
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
    free_day_mode: str = "none",
    optimize_quality: bool = True,
    compact_days: bool = False,
    solution_hint: dict[str, Any] | None = None,
    preferred_free_days: dict[int, set[int]] | None = None,
) -> dict[str, Any]:
    model = cp_model.CpModel()
    var_by_block: dict[int, list[tuple[Any, int, int]]] = {}
    class_slot_vars: dict[tuple[str, int, int], list[Any]] = {}
    teacher_slot_vars: dict[tuple[int, int, int], list[Any]] = {}
    subject_day_vars: dict[tuple[str, str, int], list[Any]] = {}
    penalty_terms: list[Any] = []
    full_day_break_terms: list[Any] = []
    full_day_relaxed_vars: dict[tuple[int, int], list[Any]] = {}
    quality_gap_terms: list[Any] = []
    quality_busy_day_terms: list[Any] = []
    no_candidate: list[str] = []
    candidate_meta: dict[Any, tuple[Block, int, int]] = {}

    for block in blocks:
        candidates: list[tuple[Any, int, int]] = []
        for day in days:
            if preferred_free_days and day in preferred_free_days.get(block.teacher_id, set()):
                continue
            for start in range(0, hours_per_day - block.length + 1):
                blocked_hours = blocked_hours_for_block(teacher_unavailable, block.teacher_id, day, start, block.length)
                if blocked_hours and not relax_unavailable:
                    continue
                full_day_blocked = bool(blocked_hours) and is_full_day_blocked(teacher_unavailable, block.teacher_id, day, hours_per_day)
                if full_day_blocked and (not relax_unavailable or relax_scope != "all"):
                    continue
                if blocked_hours and relax_scope == "edge":
                    if not all(is_edge_hour(hour, hours_per_day) for hour in blocked_hours):
                        continue
                var = model.NewBoolVar(f"b{block.index}_d{day}_h{start}")
                candidates.append((var, day, start))
                candidate_meta[var] = (block, day, start)
                if solution_hint:
                    hinted = solution_hint.get(str(block.index)) or solution_hint.get(block.index)
                    if hinted and len(hinted) >= 2:
                        model.AddHint(var, int(hinted[0]) == day and int(hinted[1]) == start)
                if blocked_hours:
                    for _ in range(len(blocked_hours)):
                        penalty_terms.append(var)
                    if full_day_blocked:
                        full_day_relaxed_vars.setdefault((block.teacher_id, day), []).append(var)
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

    if optimize_quality:
        quality_gap_terms, quality_busy_day_terms = build_teacher_quality_terms(
            model,
            teacher_slot_vars,
            teachers,
            days,
            hours_per_day,
            compact_days,
        )

    free_day_vars: list[Any] = []
    free_day_teacher_vars: list[Any] = []
    if free_day_mode in {"require", "maximize"}:
        load_by_teacher = teacher_assignment_loads(teachers)
        for teacher in teachers:
            tid = int(teacher.get("id"))
            load = load_by_teacher.get(tid, 0)
            if load <= 0:
                continue
            day_free_vars: list[Any] = []
            for day in days:
                day_slot_vars: list[Any] = []
                for hour in range(hours_per_day):
                    day_slot_vars.extend(teacher_slot_vars.get((tid, day, hour), []))
                busy = model.NewBoolVar(f"t{tid}_d{day}_busy")
                if day_slot_vars:
                    model.AddMaxEquality(busy, day_slot_vars)
                else:
                    model.Add(busy == 0)
                free = model.NewBoolVar(f"t{tid}_d{day}_free")
                model.Add(busy + free == 1)
                day_free_vars.append(free)
                free_day_vars.append(free)
            if not day_free_vars:
                continue
            has_free_day = model.NewBoolVar(f"t{tid}_has_free_day")
            model.AddMaxEquality(has_free_day, day_free_vars)
            free_day_teacher_vars.append(has_free_day)
            if free_day_mode == "require" and load <= (len(days) - 1) * hours_per_day:
                model.Add(has_free_day == 1)

    for (tid, day), vars_ in full_day_relaxed_vars.items():
        opened = model.NewBoolVar(f"t{tid}_d{day}_full_day_opened")
        model.AddMaxEquality(opened, vars_)
        full_day_break_terms.append(opened)

    quality_score = sum(quality_gap_terms) * 1000 + sum(quality_busy_day_terms) * 250
    if relax_unavailable and penalty_terms:
        model.Minimize(
            sum(full_day_break_terms) * 1000000
            + sum(penalty_terms) * 100000
            + quality_score
        )
    elif free_day_mode in {"require", "maximize"} and free_day_teacher_vars:
        model.Maximize(sum(free_day_teacher_vars) * 1000 + sum(free_day_vars) - quality_score)
    elif quality_gap_terms or quality_busy_day_terms:
        model.Minimize(quality_score)

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
                "error": "OR-Tools bu denemede programı oturtamadı. Aşağıdaki boş saatleri açmak programı rahatlatabilir.",
                "issues": build_infeasible_hints(teachers, teacher_unavailable, days, hours_per_day),
            }
        return {
            "ok": False,
            "status": solver.StatusName(status),
            "error": "OR-Tools bu dağıtım için uygun program bulamadı.",
            "issues": build_infeasible_hints(teachers, teacher_unavailable, days, hours_per_day),
        }

    schedule: dict[str, dict[str, str]] = {}
    placements: dict[str, list[int]] = {}
    adjustment_slots: dict[tuple[int, int, int], dict[str, Any]] = {}
    for block in blocks:
        for var, day, start in var_by_block[block.index]:
            if not solver.BooleanValue(var):
                continue
            placements[str(block.index)] = [day, start]
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
                        "fullDay": is_full_day_blocked(teacher_unavailable, block.teacher_id, day, hours_per_day),
                        "hoursPerDay": hours_per_day,
                    }
            break

    adjustments = summarize_adjustments(adjustment_slots)
    free_day_stats = count_free_day_teachers(schedule, teachers, days, hours_per_day)
    return {
        "ok": True,
        "status": solver.StatusName(status),
        "schedule": schedule,
        "placements": placements,
        "adjustments": adjustments,
        "stats": {
            "blocks": len(blocks),
            "slots": len(schedule),
            "wallTime": solver.WallTime(),
            "relaxedUnavailable": bool(adjustments),
            "freeDayMode": free_day_mode,
            "freeDayTeachers": free_day_stats["freeDayTeachers"],
            "targetFreeDayTeachers": free_day_stats["targetFreeDayTeachers"],
            "totalFreeDays": free_day_stats["totalFreeDays"],
        },
    }


def teacher_assignment_loads(teachers: list[dict[str, Any]]) -> dict[int, int]:
    loads: dict[int, int] = {}
    for teacher in teachers:
        tid = int(teacher.get("id"))
        loads[tid] = sum(int(a.get("wh") or 0) for a in teacher.get("assignments") or [])
    return loads


def count_free_day_teachers(
    schedule: dict[str, dict[str, str]],
    teachers: list[dict[str, Any]],
    days: list[int],
    hours_per_day: int,
) -> dict[str, int]:
    loads = teacher_assignment_loads(teachers)
    busy_by_teacher_day: set[tuple[int, int]] = set()
    for key in schedule:
        parts = str(key).split("_")
        if len(parts) < 3:
            continue
        try:
            tid = int(parts[0])
            day = int(parts[1])
        except ValueError:
            continue
        busy_by_teacher_day.add((tid, day))

    target = 0
    with_free_day = 0
    total_free_days = 0
    for teacher in teachers:
        tid = int(teacher.get("id"))
        if loads.get(tid, 0) <= 0:
            continue
        target += 1
        teacher_free_days = sum(1 for day in days if (tid, day) not in busy_by_teacher_day)
        total_free_days += teacher_free_days
        if teacher_free_days > 0:
            with_free_day += 1
    return {"freeDayTeachers": with_free_day, "targetFreeDayTeachers": target, "totalFreeDays": total_free_days}


def build_preferred_free_days(
    teachers: list[dict[str, Any]],
    unavailable: dict[str, Any],
    days: list[int],
    hours_per_day: int,
    seed: int,
    ratio: float = 0.55,
) -> dict[int, set[int]]:
    rng = random.Random(seed)
    loads = teacher_assignment_loads(teachers)
    day_pressure = {day: 0 for day in days}
    result: dict[int, set[int]] = {}
    eligible_teachers = []
    for teacher in teachers:
        tid = int(teacher.get("id"))
        load = loads.get(tid, 0)
        if load <= 0 or load > (len(days) - 1) * hours_per_day:
            continue
        blocked = unavailable.get(str(tid)) or unavailable.get(tid) or {}
        has_full_blocked_day = any(
            all(blocked.get(f"{day}_{hour}") for hour in range(hours_per_day))
            for day in days
        )
        if has_full_blocked_day:
            continue
        eligible_teachers.append((load, rng.random(), teacher))

    eligible_teachers.sort()
    target_count = max(0, min(len(eligible_teachers), math.ceil(len(eligible_teachers) * ratio)))
    ordered_teachers = [teacher for _, _, teacher in eligible_teachers[:target_count]]

    for teacher in ordered_teachers:
        tid = int(teacher.get("id"))
        load = loads.get(tid, 0)
        blocked = unavailable.get(str(tid)) or unavailable.get(tid) or {}

        day_scores: list[tuple[int, int, float, int]] = []
        for day in days:
            blocked_count = sum(1 for hour in range(hours_per_day) if blocked.get(f"{day}_{hour}"))
            day_scores.append((day_pressure.get(day, 0), -blocked_count, rng.random(), day))
        day_scores.sort()
        chosen_day = day_scores[0][3]
        result[tid] = {chosen_day}
        day_pressure[chosen_day] = day_pressure.get(chosen_day, 0) + 1

    return result


def build_teacher_quality_terms(
    model: Any,
    teacher_slot_vars: dict[tuple[int, int, int], list[Any]],
    teachers: list[dict[str, Any]],
    days: list[int],
    hours_per_day: int,
    enforce_compact_days: bool = False,
) -> tuple[list[Any], list[Any]]:
    gap_terms: list[Any] = []
    busy_day_terms: list[Any] = []
    loads = teacher_assignment_loads(teachers)

    for teacher in teachers:
        tid = int(teacher.get("id"))
        if loads.get(tid, 0) <= 0:
            continue
        teacher_busy_days: list[Any] = []
        for day in days:
            busy_slots: list[Any] = []
            for hour in range(hours_per_day):
                slot_vars = teacher_slot_vars.get((tid, day, hour), [])
                busy = model.NewBoolVar(f"t{tid}_d{day}_h{hour}_busy")
                if slot_vars:
                    model.AddMaxEquality(busy, slot_vars)
                else:
                    model.Add(busy == 0)
                busy_slots.append(busy)

            day_busy = model.NewBoolVar(f"t{tid}_d{day}_busy_quality")
            model.AddMaxEquality(day_busy, busy_slots)
            busy_day_terms.append(day_busy)
            teacher_busy_days.append(day_busy)

            for hour in range(1, hours_per_day - 1):
                earlier = model.NewBoolVar(f"t{tid}_d{day}_h{hour}_earlier")
                later = model.NewBoolVar(f"t{tid}_d{day}_h{hour}_later")
                gap = model.NewBoolVar(f"t{tid}_d{day}_h{hour}_gap")
                model.AddMaxEquality(earlier, busy_slots[:hour])
                model.AddMaxEquality(later, busy_slots[hour + 1 :])
                model.Add(gap >= earlier + later - busy_slots[hour] - 1)
                model.Add(gap <= earlier)
                model.Add(gap <= later)
                model.Add(gap <= 1 - busy_slots[hour])
                gap_terms.append(gap)

        if enforce_compact_days and teacher_busy_days:
            preferred = preferred_teacher_busy_days(loads.get(tid, 0), len(days), hours_per_day)
            if preferred < len(days):
                model.Add(sum(teacher_busy_days) <= preferred)

    return gap_terms, busy_day_terms


def preferred_teacher_busy_days(load: int, day_count: int, hours_per_day: int) -> int:
    if load <= 0:
        return 0
    practical_daily_load = max(1, hours_per_day - 1)
    return min(day_count, max(2, math.ceil(load / practical_daily_load)))


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
                "fullDay": False,
                "hoursPerDay": item.get("hoursPerDay"),
            },
        )
        grouped[key]["hours"].append(int(item["hour"]))
        if item.get("fullDay"):
            grouped[key]["fullDay"] = True
        if item.get("hoursPerDay"):
            grouped[key]["hoursPerDay"] = item.get("hoursPerDay")
    result = []
    for item in grouped.values():
        hours = sorted(set(item["hours"]))
        if item.get("fullDay"):
            hours = list(range(int(item.get("hoursPerDay") or (max(hours) + 1 if hours else 0))))
        item["hours"] = hours
        item["text"] = (
            f"{item['teacher']} öğretmenin {day_name(item['day'])} boş günü açıldı."
            if item.get("fullDay")
            else f"{item['teacher']} öğretmenin {day_name(item['day'])} {compact_hours_label(hours)} saatleri açıldı."
        )
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

    for teacher in teachers:
        tid = int(teacher.get("id"))
        name = teacher.get("name", tid)
        assigned = sum(int(a.get("wh") or 0) for a in teacher.get("assignments") or [])
        if assigned > expected:
            errors.append(f"{name}: {assigned} saat dersi var ama haftada en fazla {expected} saat derse girebilir.")
        for assignment in teacher.get("assignments") or []:
            for length in split_blocks(int(assignment.get("wh") or 0), days, hours_per_day):
                if length > hours_per_day:
                    errors.append(f"{name}: {length} saatlik ders bloğu günlük ders saatini aşıyor.")
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

