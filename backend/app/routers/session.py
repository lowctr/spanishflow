import random
from datetime import datetime, date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, text

from app.database import get_db
from app.models import User, Word, UserProgress
from app.schemas import (
    DailySessionOut, WordWithProgress, AnswerIn, AnswerOut,
    ArenaWordOut,
)
from app.srs import schedule_next
from app.config import settings

router = APIRouter(prefix="/session", tags=["session"])


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Extract user from Authorization: Bearer <initData> header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization")

    init_data = authorization.removeprefix("Bearer ").strip()

    # Dev mode
    if not settings.BOT_TOKEN or init_data == "dev_mode":
        user_id = 12345
    else:
        from urllib.parse import parse_qs
        import hashlib, hmac, json
        from urllib.parse import unquote

        parsed = parse_qs(init_data, keep_blank_values=True)
        received_hash = parsed.get("hash", [None])[0]
        if not received_hash:
            raise HTTPException(status_code=401, detail="Invalid token")

        data_check_parts = []
        for key, values in sorted(parsed.items()):
            if key == "hash":
                continue
            data_check_parts.append(f"{key}={values[0]}")
        data_check_string = "\n".join(data_check_parts)

        secret_key = hmac.new(
            b"WebAppData",
            settings.BOT_TOKEN.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        expected_hash = hmac.new(
            secret_key,
            data_check_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_hash, received_hash):
            raise HTTPException(status_code=401, detail="Invalid initData signature")

        user_json = parsed.get("user", [None])[0]
        if not user_json:
            raise HTTPException(status_code=401, detail="No user in token")

        tg_user = json.loads(unquote(user_json))
        user_id = int(tg_user["id"])

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found. Please authenticate first.")
    return user


async def get_distractors(db: AsyncSession, word_id: int, count: int = 3):
    """Get random word_en AND word_es distractors excluding the current word."""
    result = await db.execute(
        select(Word.word_en, Word.word_es)
        .where(Word.id != word_id)
        .order_by(func.random())
        .limit(count)
    )
    rows = result.fetchall()
    en_distractors = [r[0] for r in rows]
    es_distractors = [r[1] for r in rows]
    return en_distractors, es_distractors


async def build_word_with_progress(
    db: AsyncSession,
    word: Word,
    progress: Optional[UserProgress],
) -> WordWithProgress:
    stage = progress.stage if progress else 0
    en_distractors, es_distractors = await get_distractors(db, word.id, 3)
    return WordWithProgress(
        id=word.id,
        word_en=word.word_en,
        word_es=word.word_es,
        gender=word.gender,
        stage=stage,
        distractors=en_distractors,
        es_distractors=es_distractors,
    )


@router.get("/daily", response_model=DailySessionOut)
async def get_daily_session(
    extra: int = 0,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.utcnow()
    today = date.today()

    # Count words learned today (last_reviewed_at today AND is_learned became true or stage advanced today)
    completed_today_result = await db.execute(
        select(func.count(UserProgress.id))
        .where(
            and_(
                UserProgress.user_id == user.id,
                UserProgress.is_learned == True,
                func.date(UserProgress.last_reviewed_at) == today,
            )
        )
    )
    completed_today = completed_today_result.scalar() or 0

    # Review words: user has progress, next_review_at <= now
    review_result = await db.execute(
        select(UserProgress, Word)
        .join(Word, UserProgress.word_id == Word.id)
        .where(
            and_(
                UserProgress.user_id == user.id,
                UserProgress.next_review_at <= now,
                UserProgress.is_learned == False,
            )
        )
        .order_by(UserProgress.next_review_at)
        .limit(user.daily_goal * 2)
    )
    review_rows = review_result.fetchall()

    review_words = []
    for progress, word in review_rows:
        ww = await build_word_with_progress(db, word, progress)
        review_words.append(ww)

    # New words: words user has never seen (no progress record)
    # How many new words do we need? extra param adds bonus words on top
    new_needed = max(0, user.daily_goal - len(review_words)) + extra

    # Get IDs of words that already have progress for this user
    existing_ids_result = await db.execute(
        select(UserProgress.word_id).where(UserProgress.user_id == user.id)
    )
    existing_ids = {row[0] for row in existing_ids_result.fetchall()}

    new_words = []
    if new_needed > 0:
        new_words_result = await db.execute(
            select(Word)
            .where(Word.id.notin_(existing_ids) if existing_ids else text("1=1"))
            .order_by(Word.rank)
            .limit(new_needed)
        )
        new_word_rows = new_words_result.fetchall()
        for (word,) in new_word_rows:
            ww = await build_word_with_progress(db, word, None)
            new_words.append(ww)

    return DailySessionOut(
        new_words=new_words,
        review_words=review_words,
        daily_goal=user.daily_goal,
        completed_today=completed_today,
    )


@router.post("/answer", response_model=AnswerOut)
async def submit_answer(
    body: AnswerIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    now = datetime.utcnow()
    today = date.today()

    # Get or create progress
    result = await db.execute(
        select(UserProgress).where(
            and_(
                UserProgress.user_id == user.id,
                UserProgress.word_id == body.word_id,
            )
        )
    )
    progress = result.scalar_one_or_none()

    if progress is None:
        progress = UserProgress(
            user_id=user.id,
            word_id=body.word_id,
            stage=0,
        )
        db.add(progress)
        await db.flush()

    # Advance stage on correct answer
    xp_gained = 0
    if body.is_correct:
        xp_gained = 10
        # Advance stage only if answering current stage
        if body.stage >= progress.stage:
            progress.stage = min(body.stage + 1, 4)

        # Check if learned (completed all 4 stages)
        if progress.stage >= 4:
            progress.is_learned = True
            schedule_next(progress, is_correct=True)
        else:
            # Schedule next review for stage completion
            progress.next_review_at = now + timedelta(minutes=10)
            progress.last_reviewed_at = now
            progress.correct_count += 1
    else:
        # Wrong answer
        schedule_next(progress, is_correct=False)

    # Award XP
    if xp_gained > 0:
        user.xp += xp_gained

    # Update streak
    new_streak = user.streak
    if user.last_activity_date != today:
        yesterday = today - timedelta(days=1)
        if user.last_activity_date == yesterday:
            user.streak += 1
        elif user.last_activity_date != today:
            # Streak broken (unless it was already set today)
            user.streak = 1
        user.last_activity_date = today
        new_streak = user.streak

    await db.commit()
    await db.refresh(progress)
    await db.refresh(user)

    return AnswerOut(
        next_review_at=progress.next_review_at,
        is_learned=progress.is_learned,
        xp_gained=xp_gained,
        new_streak=new_streak,
        new_xp=user.xp,
    )


@router.get("/arena", response_model=List[ArenaWordOut])
async def get_arena_words(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Returns 20 random learned words (or stage>=2) for Arena mode."""
    result = await db.execute(
        select(UserProgress, Word)
        .join(Word, UserProgress.word_id == Word.id)
        .where(
            and_(
                UserProgress.user_id == user.id,
                or_(
                    UserProgress.is_learned == True,
                    UserProgress.stage >= 2,
                ),
            )
        )
        .order_by(func.random())
        .limit(20)
    )
    rows = result.fetchall()

    if not rows:
        return []

    arena_words = []
    for progress, word in rows:
        en_distractors, es_distractors = await get_distractors(db, word.id, 3)
        arena_words.append(ArenaWordOut(
            id=word.id,
            word_en=word.word_en,
            word_es=word.word_es,
            gender=word.gender,
            distractors=en_distractors,
            es_distractors=es_distractors,
        ))

    return arena_words


@router.get("/review", response_model=List[WordWithProgress])
async def get_review_session(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """SRS review of learned words that are due."""
    now = datetime.utcnow()
    result = await db.execute(
        select(UserProgress, Word)
        .join(Word, UserProgress.word_id == Word.id)
        .where(
            and_(
                UserProgress.user_id == user.id,
                UserProgress.is_learned == True,
                UserProgress.next_review_at <= now,
            )
        )
        .order_by(UserProgress.next_review_at)
        .limit(30)
    )
    rows = result.fetchall()

    # If nothing due, return 10 most recently learned words for practice
    if not rows:
        result = await db.execute(
            select(UserProgress, Word)
            .join(Word, UserProgress.word_id == Word.id)
            .where(
                and_(
                    UserProgress.user_id == user.id,
                    UserProgress.is_learned == True,
                )
            )
            .order_by(UserProgress.last_reviewed_at.desc())
            .limit(10)
        )
        rows = result.fetchall()

    review_words = []
    for progress, word in rows:
        ww = await build_word_with_progress(db, word, progress)
        review_words.append(ww)
    return review_words
