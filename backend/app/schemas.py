from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, date


class UserOut(BaseModel):
    id: int
    username: Optional[str]
    first_name: Optional[str]
    daily_goal: int
    streak: int
    xp: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class WordWithProgress(BaseModel):
    id: int
    word_en: str
    word_es: str
    gender: Optional[str]
    stage: int
    distractors: List[str]      # word_en values (for listening test)
    es_distractors: List[str]   # word_es values (for multiple choice en→es)

    class Config:
        from_attributes = True


class DailySessionOut(BaseModel):
    new_words: List[WordWithProgress]
    review_words: List[WordWithProgress]
    daily_goal: int
    completed_today: int


class AnswerIn(BaseModel):
    word_id: int
    exercise_type: str  # flashcard, multiple_choice, scramble, listening
    is_correct: bool
    stage: int


class AnswerOut(BaseModel):
    next_review_at: Optional[datetime]
    is_learned: bool
    xp_gained: int
    new_streak: int
    new_xp: int


class ArenaWordOut(BaseModel):
    id: int
    word_en: str
    word_es: str
    gender: Optional[str]
    distractors: List[str]      # word_en values
    es_distractors: List[str]   # word_es values

    class Config:
        from_attributes = True


class StatsOut(BaseModel):
    streak: int
    xp: int
    total_learned: int
    total_words: int
    words_in_progress: int
    daily_goal: int
    completed_today: int


class TelegramAuthIn(BaseModel):
    init_data: str
    daily_goal: Optional[int] = None
