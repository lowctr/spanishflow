---
name: SpanishFlow project context
description: Core decisions, stack, DB structure and feature scope for SpanishFlow TMA
type: project
---

## Project
Telegram Mini App for learning Spanish. 2000 words vocabulary.

## Stack
- Frontend: React + Vite
- Backend: FastAPI (Python)
- DB: PostgreSQL
- Deploy: Railway.app or Render.com (auto HTTPS)

## DB Structure (spanish_words.sql)
SQLite origin, migrated to PostgreSQL.
Columns: id, rank (frequency 1-2000), word_en, word_es, gender (masculine/feminine)
NO categories, NO example sentences, NO audio files.

## Learning Loop (per new word)
1. FlashCard — word_es + word_en + gender + browser TTS
2. MultipleChoice — EN→ES, 4 options (3 random distractors from DB)
3. LetterScramble — assemble word_es from shuffled letters
4. ListeningTest — TTS plays word_es, user picks correct EN translation

## Review Module — "Arena" (creative, gamified)
- Speed round: 60s countdown
- 3 lives (hearts)
- Combo multiplier for consecutive correct answers
- Random mix of all exercise types
- Haptic feedback via Telegram SDK
- XP/score system

## SRS
- SM-2-like algorithm
- Wrong answer → repeat in 3 minutes
- Learned words → review after 1, 3, 7, 14, 30 days
- Word considered "learned" after completing all 4 stages correctly

## Key decisions
- No LLM integration
- Distractors for MC generated from DB (random words)
- No categories (use rank order: most frequent first)
- TTS via window.speechSynthesis (Spanish voice)
- Telegram CSS variables for native theme
- Haptic feedback via Telegram SDK
- No offline mode needed
