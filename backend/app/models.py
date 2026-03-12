from sqlalchemy import (
    BigInteger, Boolean, Column, Date, DateTime, Float, Integer,
    String, Text, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True)  # Telegram user ID
    username = Column(String(255), nullable=True)
    first_name = Column(String(255), nullable=True)
    daily_goal = Column(Integer, default=10)
    streak = Column(Integer, default=0)
    last_activity_date = Column(Date, nullable=True)
    xp = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    progress = relationship("UserProgress", back_populates="user", cascade="all, delete-orphan")


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rank = Column(Integer, unique=True, nullable=False)
    word_en = Column(Text, nullable=False)
    word_es = Column(Text, nullable=False)
    gender = Column(Text, nullable=True)

    progress = relationship("UserProgress", back_populates="word", cascade="all, delete-orphan")


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    word_id = Column(Integer, ForeignKey("words.id", ondelete="CASCADE"), nullable=False)
    stage = Column(Integer, default=0)
    ease_factor = Column(Float, default=2.5)
    interval_days = Column(Integer, default=0)
    repetitions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    wrong_count = Column(Integer, default=0)
    next_review_at = Column(DateTime, nullable=True)
    last_reviewed_at = Column(DateTime, nullable=True)
    is_learned = Column(Boolean, default=False)

    __table_args__ = (UniqueConstraint("user_id", "word_id", name="uq_user_word"),)

    user = relationship("User", back_populates="progress")
    word = relationship("Word", back_populates="progress")
