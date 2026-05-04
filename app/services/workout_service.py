from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy.exc import IntegrityError

from app.models.exercise import Exercise
from app.models.exercise_execution import ExerciseExecution
from app.models.exercise_muscle_group import ExerciseMuscleGroup
from app.models.muscle_group import MuscleGroup
from app.models.workout_session import WorkoutSession
from app.models.workout_set import WorkoutSet


def _get_or_create_muscle_group(db, name):
    muscle_group = db.query(MuscleGroup).filter(MuscleGroup.name == name).first()
    if muscle_group:
        return muscle_group

    muscle_group = MuscleGroup(name=name)
    db.add(muscle_group)
    db.flush()
    return muscle_group


def _get_exercise_or_raise(db, exercise_id):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise ValueError("Exercício não encontrado")
    return exercise


def list_exercises(db):
    rows = (
        db.query(Exercise, MuscleGroup)
        .outerjoin(ExerciseMuscleGroup, ExerciseMuscleGroup.exercise_id == Exercise.id)
        .outerjoin(MuscleGroup, MuscleGroup.id == ExerciseMuscleGroup.muscle_group_id)
        .order_by(Exercise.name.asc(), MuscleGroup.name.asc())
        .all()
    )

    grouped = {}
    for exercise, muscle_group in rows:
        if exercise.id not in grouped:
            grouped[exercise.id] = {
                "exercise": exercise,
                "muscle_groups": [],
            }
        if muscle_group:
            grouped[exercise.id]["muscle_groups"].append(muscle_group.name)

    return list(grouped.values())


def create_exercise(db, name, muscle_groups):
    normalized_name = name.strip()
    if not normalized_name:
        raise ValueError("name é obrigatório")

    exercise = Exercise(name=normalized_name)

    try:
        db.add(exercise)
        db.flush()
    except IntegrityError:
        db.rollback()
        raise ValueError("Já existe um exercício com esse nome") from None

    seen = set()
    normalized_groups = []
    for group_name in muscle_groups:
        normalized_group = group_name.strip()
        if normalized_group and normalized_group.lower() not in seen:
            normalized_groups.append(normalized_group)
            seen.add(normalized_group.lower())

    if not normalized_groups:
        raise ValueError("muscle_groups deve conter ao menos um grupo muscular")

    for group_name in normalized_groups:
        muscle_group = _get_or_create_muscle_group(db, group_name)
        db.add(
            ExerciseMuscleGroup(
                exercise_id=exercise.id,
                muscle_group_id=muscle_group.id,
            )
        )

    db.commit()
    db.refresh(exercise)
    return {
        "exercise": exercise,
        "muscle_groups": normalized_groups,
    }


def create_workout_session(db, user_id, created_at, exercises):
    if not exercises:
        raise ValueError("exercises deve conter ao menos uma execução")

    session = WorkoutSession(user_id=user_id, created_at=created_at)
    db.add(session)
    db.flush()

    for execution_index, execution_payload in enumerate(exercises, start=1):
        exercise = _get_exercise_or_raise(db, execution_payload["exercise_id"])
        sets_payload = execution_payload["sets"]

        if not sets_payload:
            raise ValueError("Cada execução deve conter ao menos uma série")

        execution = ExerciseExecution(
            workout_session_id=session.id,
            exercise_id=exercise.id,
            execution_order=execution_index,
        )
        db.add(execution)
        db.flush()

        for set_index, set_payload in enumerate(sets_payload, start=1):
            db.add(
                WorkoutSet(
                    exercise_execution_id=execution.id,
                    reps=set_payload["reps"],
                    weight=set_payload["weight"],
                    set_order=set_index,
                )
            )

    db.commit()
    return session


def list_workout_sessions_by_date(db, user_id, target_date: date):
    start_at = datetime.combine(target_date, time.min, tzinfo=timezone.utc)
    end_at = start_at + timedelta(days=1)

    session_rows = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.user_id == user_id)
        .filter(WorkoutSession.created_at >= start_at)
        .filter(WorkoutSession.created_at < end_at)
        .order_by(WorkoutSession.created_at.desc())
        .all()
    )

    if not session_rows:
        return []

    session_ids = [session.id for session in session_rows]

    execution_rows = (
        db.query(ExerciseExecution, Exercise)
        .join(Exercise, Exercise.id == ExerciseExecution.exercise_id)
        .filter(ExerciseExecution.workout_session_id.in_(session_ids))
        .order_by(
            ExerciseExecution.workout_session_id.asc(),
            ExerciseExecution.execution_order.asc(),
        )
        .all()
    )

    execution_ids = [execution.id for execution, _exercise in execution_rows]

    set_rows = []
    if execution_ids:
        set_rows = (
            db.query(WorkoutSet)
            .filter(WorkoutSet.exercise_execution_id.in_(execution_ids))
            .order_by(
                WorkoutSet.exercise_execution_id.asc(),
                WorkoutSet.set_order.asc(),
            )
            .all()
        )

    exercise_ids = list({exercise.id for _execution, exercise in execution_rows})
    muscle_rows = []
    if exercise_ids:
        muscle_rows = (
            db.query(ExerciseMuscleGroup, MuscleGroup)
            .join(MuscleGroup, MuscleGroup.id == ExerciseMuscleGroup.muscle_group_id)
            .filter(ExerciseMuscleGroup.exercise_id.in_(exercise_ids))
            .order_by(ExerciseMuscleGroup.exercise_id.asc(), MuscleGroup.name.asc())
            .all()
        )

    muscle_map = {}
    for relation, muscle_group in muscle_rows:
        muscle_map.setdefault(relation.exercise_id, []).append(muscle_group.name)

    sets_map = {}
    for workout_set in set_rows:
        sets_map.setdefault(workout_set.exercise_execution_id, []).append(workout_set)

    execution_map = {}
    for execution, exercise in execution_rows:
        execution_map.setdefault(execution.workout_session_id, []).append(
            {
                "execution": execution,
                "exercise": exercise,
                "muscle_groups": muscle_map.get(exercise.id, []),
                "sets": sets_map.get(execution.id, []),
            }
        )

    result = []
    for session in session_rows:
        result.append(
            {
                "session": session,
                "executions": execution_map.get(session.id, []),
            }
        )

    return result


def get_workout_session_by_id(db, user_id, workout_session_id):
    session = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.id == workout_session_id)
        .filter(WorkoutSession.user_id == user_id)
        .first()
    )

    if not session:
        raise ValueError("Sessão de treino não encontrada")

    rows = list_workout_sessions_by_date(db, user_id, session.created_at.date())
    for row in rows:
        if row["session"].id == workout_session_id:
            return row

    raise ValueError("Sessão de treino não encontrada")
