from datetime import datetime, timedelta
from app.models import UserProgress


def schedule_next(progress: UserProgress, is_correct: bool) -> UserProgress:
    """
    SM-2-like SRS scheduling.

    Wrong answer: next_review_at = now + 3 minutes, interval_days = 0, repetitions = 0
    Correct answer: SM-2 formula
    """
    now = datetime.utcnow()

    if not is_correct:
        progress.wrong_count += 1
        progress.repetitions = 0
        progress.interval_days = 0
        progress.ease_factor = max(1.3, progress.ease_factor - 0.2)
        progress.next_review_at = now + timedelta(minutes=3)
        progress.last_reviewed_at = now
        return progress

    # Correct answer
    progress.correct_count += 1
    progress.repetitions += 1

    if progress.repetitions == 1:
        new_interval = 1
    elif progress.repetitions == 2:
        new_interval = 3
    else:
        new_interval = round(progress.interval_days * progress.ease_factor)
        # Cap progression: 1, 3, 7, 14, 30, 60, ...
        if new_interval < 1:
            new_interval = 1

    # Clamp intervals to reasonable values
    new_interval = min(new_interval, 180)

    progress.interval_days = new_interval
    progress.ease_factor = min(2.5, progress.ease_factor + 0.1)
    progress.next_review_at = now + timedelta(days=new_interval)
    progress.last_reviewed_at = now

    return progress
