from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from typing import Any

try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
except Exception:  # FastAPI is only needed when running the HTTP service.
    FastAPI = None
    BaseModel = object

from ortools.sat.python import cp_model


def split_blocks(hours: int) -> list[int]:
    blocks: list[int] = []
    while hours >= 2:
        blocks.append(2)
        hours -= 2
    if hours == 1:
        blocks.append(1)
    return blocks


@dataclass(frozen=True)
class Block:
    index: int
    cls: str
    subj: str
    teacher_id: int
    length: int


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
                distribution_errors.append(f"{cls} {subj}: birden fazla ogretmen atanmis.")
                continue
            assignment_by_class_subject[key] = (tid, wh)

    for cls in classes:
        total = 0
        for lesson in class_plan.get(cls) or []:
            subj = str(lesson.get("subj") or "")
            wh = int(lesson.get("wh") or 0)
            total += wh
            if (cls, subj) not in assignment_by_class_subject:
                distribution_errors.append(f"{cls} {subj}: ders dagitiminda ogretmen yok.")
        if total != len(days) * hours_per_day:
            distribution_errors.append(f"{cls}: ders plani {total}/{len(days) * hours_per_day} saat.")

    capacity_errors = teacher_capacity_errors(teachers, teacher_unavailable, days, hours_per_day)
    if distribution_errors or capacity_errors:
        return {
            "ok": False,
            "status": "invalid_distribution",
            "error": "Ders dagitimi OR-Tools'a gonderilmeden once duzeltilmeli.",
            "issues": distribution_errors + capacity_errors,
        }

    blocks: list[Block] = []
    for cls in classes:
        for lesson in class_plan.get(cls) or []:
            subj = str(lesson.get("subj"))
            wh = int(lesson.get("wh") or 0)
            tid, assigned_wh = assignment_by_class_subject[(cls, subj)]
            for length in split_blocks(assigned_wh or wh):
                blocks.append(Block(len(blocks), cls, subj, tid, length))

    model = cp_model.CpModel()
    var_by_block: dict[int, list[tuple[Any, int, int]]] = {}
    class_slot_vars: dict[tuple[str, int, int], list[Any]] = {}
    teacher_slot_vars: dict[tuple[int, int, int], list[Any]] = {}
    subject_day_vars: dict[tuple[str, str, int], list[Any]] = {}
    no_candidate: list[str] = []

    for block in blocks:
        candidates: list[tuple[Any, int, int]] = []
        for day in days:
            for start in range(0, hours_per_day - block.length + 1):
                if teacher_blocked(teacher_unavailable, block.teacher_id, day, start, block.length):
                    continue
                var = model.NewBoolVar(f"b{block.index}_d{day}_h{start}")
                candidates.append((var, day, start))
                subject_day_vars.setdefault((block.cls, block.subj, day), []).append(var)
                for offset in range(block.length):
                    hour = start + offset
                    class_slot_vars.setdefault((block.cls, day, hour), []).append(var)
                    teacher_slot_vars.setdefault((block.teacher_id, day, hour), []).append(var)
        if not candidates:
            teacher = teacher_by_id.get(block.teacher_id, {})
            no_candidate.append(f"{block.cls} {block.subj}: {teacher.get('name', block.teacher_id)} icin uygun blok yok.")
        else:
            model.AddExactlyOne(var for var, _, _ in candidates)
            var_by_block[block.index] = candidates

    if no_candidate:
        return {
            "ok": False,
            "status": "no_candidate",
            "error": "Bazi bloklar icin hic uygun saat yok.",
            "issues": no_candidate,
        }

    for vars_ in class_slot_vars.values():
        model.AddAtMostOne(vars_)
    for vars_ in teacher_slot_vars.values():
        model.AddAtMostOne(vars_)
    for vars_ in subject_day_vars.values():
        model.AddAtMostOne(vars_)

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = float(payload.get("timeLimitSeconds") or 20)
    solver.parameters.num_search_workers = int(payload.get("workers") or 8)
    solver.parameters.random_seed = int(payload.get("seed") or 1)

    status = solver.Solve(model)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "ok": False,
            "status": solver.StatusName(status),
            "error": "OR-Tools bu dagitim icin uygun program bulamadi.",
            "issues": build_infeasible_hints(teachers, teacher_unavailable, days, hours_per_day),
        }

    schedule: dict[str, dict[str, str]] = {}
    for block in blocks:
        for var, day, start in var_by_block[block.index]:
            if solver.BooleanValue(var):
                for offset in range(block.length):
                    schedule[f"{block.teacher_id}_{day}_{start + offset}"] = {
                        "cls": block.cls,
                        "subj": block.subj,
                    }
                break

    return {
        "ok": True,
        "status": solver.StatusName(status),
        "schedule": schedule,
        "stats": {
            "blocks": len(blocks),
            "slots": len(schedule),
            "wallTime": solver.WallTime(),
        },
    }


def teacher_blocked(unavailable: dict[str, Any], tid: int, day: int, start: int, length: int) -> bool:
    blocked = unavailable.get(str(tid)) or unavailable.get(tid) or {}
    for offset in range(length):
        if blocked.get(f"{day}_{start + offset}"):
            return True
    return False


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
            errors.append(f"{teacher.get('name', tid)}: {assigned} saat yuk var ama kapasite {capacity} saat.")
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
    heavy = sorted(
        (
            (sum(int(a.get("wh") or 0) for a in t.get("assignments") or []), t.get("name", t.get("id")))
            for t in teachers
        ),
        reverse=True,
    )
    return [f"En yuksek ders yuku: {name} {load} saat." for load, name in heavy[:8]]


def class_sort_key(cls: str) -> tuple[int, str]:
    parts = str(cls).split("-", 1)
    try:
        grade = int(parts[0])
    except ValueError:
        grade = 0
    section = parts[1] if len(parts) > 1 else str(cls)
    return grade, section


if FastAPI is not None:
    app = FastAPI(title="Okul Ders Programi OR-Tools Solver")
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
