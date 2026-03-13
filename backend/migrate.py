#!/usr/bin/env python3
"""
Migration script: reads spanish_words.sql (SQLite INSERT format)
and bulk-inserts into PostgreSQL words table.
"""
import asyncio
import re
import os
import sys

import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://spanishflow:spanishflow_pass@localhost:5432/spanishflow",
)
# Convert SQLAlchemy URL to asyncpg format
PG_URL = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

SQL_FILE = os.environ.get(
    "SQL_FILE",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "spanish_words.sql"),
)


def parse_inserts(sql_content: str):
    """Parse INSERT statements from SQLite dump."""
    pattern = re.compile(
        r"INSERT INTO \w+ \(rank, word_en, word_es, gender\) VALUES \((\d+), '(.*?)', '(.*?)', '(.*?)'\);",
        re.IGNORECASE,
    )
    rows = []
    for match in pattern.finditer(sql_content):
        rank = int(match.group(1))
        word_en = match.group(2).replace("''", "'")
        word_es = match.group(3).replace("''", "'")
        gender = match.group(4).replace("''", "'")
        # Normalize gender to simple form
        if gender.startswith("masculine"):
            gender = "masculine"
        elif gender.startswith("feminine"):
            gender = "feminine"
        rows.append((rank, word_en, word_es, gender))
    return rows


async def main():
    if not os.path.exists(SQL_FILE):
        print(f"SQL file not found: {SQL_FILE}")
        sys.exit(1)

    with open(SQL_FILE, "r", encoding="utf-8") as f:
        sql_content = f.read()

    rows = parse_inserts(sql_content)
    print(f"Parsed {len(rows)} words from SQL file")

    if not rows:
        print("No rows found. Check the SQL file format.")
        sys.exit(1)

    conn = await asyncpg.connect(PG_URL)
    try:
        # Create table if not exists
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS words (
                id SERIAL PRIMARY KEY,
                rank INTEGER UNIQUE NOT NULL,
                word_en TEXT NOT NULL,
                word_es TEXT NOT NULL,
                gender TEXT
            )
        """)

        # Check existing count
        existing = await conn.fetchval("SELECT COUNT(*) FROM words")
        if existing > 0:
            print(f"Words table already has {existing} rows. Skipping migration.")
            return

        # Batch insert
        await conn.executemany(
            "INSERT INTO words (rank, word_en, word_es, gender) VALUES ($1, $2, $3, $4) ON CONFLICT (rank) DO NOTHING",
            rows,
        )
        count = await conn.fetchval("SELECT COUNT(*) FROM words")
        print(f"Successfully inserted {count} words into PostgreSQL")

        # Reset user progress (one-time reset)
        try:
            await conn.execute("DELETE FROM user_progress")
            print("User progress reset successfully")
        except Exception as e:
            print(f"Note: Could not reset user_progress: {e}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
