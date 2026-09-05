FROM python:3.13-slim

WORKDIR /app

# Install curl for healthcheck and minimal build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure storage directories exist
RUN mkdir -p /app/data /app/uploads

ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL="sqlite:////app/data/hestia.db"
ENV UPLOAD_DIR="/app/uploads"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
