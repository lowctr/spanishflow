FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY backend/migrate.py .
COPY spanish_words.sql .
ENV SQL_FILE=/app/spanish_words.sql
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
