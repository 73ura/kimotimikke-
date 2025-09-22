FROM python:3.11-slim
WORKDIR /app
ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    postgresql-client \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
COPY requirements-dev.txt /app/requirements-dev.txt

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

RUN pip install --no-cache-dir -r /app/requirements.txt \
    && pip install --no-cache-dir -r /app/requirements-dev.txt || true

COPY wait-for-db.sh /app/wait-for-db.sh
COPY start.sh /app/start.sh
RUN chmod +x /app/wait-for-db.sh /app/start.sh

COPY app/ /app/app/
COPY seed_db.py /app/seed_db.py
COPY alembic.ini /app/alembic.ini
COPY migrations/ /app/migrations/

# Cloud Run用の起動スクリプト（マイグレーション含む）
CMD ["/app/start.sh"]