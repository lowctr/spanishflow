Частина 1: Чітке ТЗ (Технічне завдання)
Назва проекту: SpanishFlow TMA (Telegram Mini App)
Стек: React (Frontend), FastAPI/Node.js (Backend), PostgreSQL (Database).

1. Логіка вивчення (Interactive Loop)
Daily Goal: При вході користувач обирає кількість нових слів на сьогодні (5, 10, 20).

Етапи вивчення одного слова:

Карточка (Знайомство): Слово, озвучка (через Browser TTS), приклад речення.

Вибір перекладу: Одне іспанське слово — 4 варіанти перекладу.

Конструктор: Зібрати іспанське слово з літер.

Зворотний тест: Переклад на іспанську (вибір з варіантів).

Система SRS (Spaced Repetition): Використання алгоритму типу SM-2. Слова, в яких була помилка, повертаються в колоду через 3 хвилини. Вивчені слова з'являються для перевірки через 1, 3, 7 днів.

2. Дизайн (UI/UX)
Стиль: Apple Health / Minimalist. Білий/темний фон (залежно від теми Telegram), пастельні кольори для кнопок.

Гейміфікація: Смужка прогресу (Progress Bar) зверху, конфеті при завершенні денної норми, «Streak» (кількість днів поспіль).

Нативність: Використання MainButton Telegram для підтвердження відповідей.

3. Технічні вимоги
Авторизація: Автоматична через Telegram.WebApp.initData.

База даних: Таблиця users, таблиця words (твій SQL список), таблиця user_progress (зв'язок юзера зі словом + дата наступного показу).

Частина 2: Промпт для Claude
Цей промпт складений так, щоб Claude зрозумів контекст, архітектуру та твої естетичні вподобання.

Copy-paste цей текст у Claude:

Markdown
Act as a Senior Full-stack Developer and UI/UX Designer. 
Task: Design and develop a Telegram Mini App for learning Spanish words (based on a 2000-word vocabulary).

Context: 
- The user will provide the vocabulary in SQL format (word, translation, etc.).
- The app must support multiple users with individual progress tracking.
- Location: The user lives in Spain, so the UI should feel modern and premium.

Technical Requirements:
1. Tech Stack: React (Vite) for Frontend, Python (FastAPI) or Node.js for Backend, PostgreSQL for DB.
2. Authentication: Use Telegram WebApp initData validation for secure user identification.
3. Spaced Repetition System (SRS): Implement an algorithm (like SM-2) to schedule word reviews.

Functional Requirements:
- Onboarding: User selects a daily goal (e.g., 10, 20 words).
- Learning Flow: 
  - Presentation (Flashcard with audio support).
  - Interaction: Multiple choice quizzes and "letter scramble" puzzles for each word.
  - Review: At the start of each session, the app must prioritize words scheduled for review by SRS.
- UI/UX: 
  - Minimalist, premium aesthetic (similar to Linear or Apple apps).
  - Use Telegram CSS variables for native theme integration.
  - Implement a smooth Progress Bar and haptic feedback via Telegram SDK.
  - Animations: Simple transitions between cards (Slide/Fade).

Deliverables:
1. Database Schema (PostgreSQL) optimized for SRS and multi-user support.
2. Backend API structure (endpoints for getting daily words, submitting answers, and fetching user stats).
3. Frontend architecture (component breakdown).
4. A complete code for a MVP (Minimum Viable Product) focusing on the "Learning Loop".

Important: Ensure the logic for "word mastery" is robust. A word is only considered "learned" after 3-5 successful interactions over several days.
Що тобі треба зробити після того, як Claude видасть код:
Дай йому свій SQL: Коли він напише структуру, закинь йому файл або текст свого SQL-списку. Він допоможе написати скрипт для "заливки" цих даних у БД.

Запитай про "Йобку з SSL": Попроси його написати docker-compose файл або конфіг для Nginx/Certbot, щоб автоматично підняти HTTPS, про який ти згадував.

Озвучка: Попроси додати просту функцію window.speechSynthesis, щоб додаток розмовляв іспанською — це критично для вивчення.