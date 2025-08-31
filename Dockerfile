# 1) Base Python image
FROM python:3.11-slim

# 2) Faster/smaller builds
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# 3) OS deps used by some wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl && \
    rm -rf /var/lib/apt/lists/*

# 4) Start in /app and install deps
WORKDIR /app
COPY requirements.txt ./
RUN pip install --upgrade pip && pip install -r requirements.txt

# 5) Copy your whole repo in
COPY . /app

# 6) Switch into the Backend folder (capital B)
WORKDIR /app/Backend

# 7) Expose and run
EXPOSE 8000
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
