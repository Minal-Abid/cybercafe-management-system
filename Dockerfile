# Dockerfile
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# system deps for some packages (psycopg2 etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# copy requirements first for better layer caching
COPY requirements.txt .

RUN python -m pip install --upgrade pip
RUN pip install -r requirements.txt

# copy app
COPY . .

# expose default port; platforms set $PORT
EXPOSE 8000

# run; use ${PORT:-8000} so host-provided PORT works
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
