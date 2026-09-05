# ===================================================
# Hestia Smart Home OS - All-in-One Dockerfile
# Combines React Frontend (compiled) + FastAPI Backend
# ===================================================

# Stage 1: Build Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Production Application
FROM python:3.13-slim
WORKDIR /app

# Install curl for healthcheck and minimal build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./backend

# Copy compiled frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create persistent storage directories
RUN mkdir -p /app/data /app/uploads

ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL="sqlite:////app/data/hestia.db"
ENV UPLOAD_DIR="/app/uploads"
ENV FRONTEND_DIST_DIR="/app/frontend/dist"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

WORKDIR /app/backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
