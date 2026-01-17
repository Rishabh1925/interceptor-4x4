# Interceptor Backend - Production Docker Image with Agentic System
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install minimal system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy backend requirements
COPY backend-files/requirements.txt .

# Install Python dependencies (split for better caching and error handling)
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch CPU version first
RUN pip install --no-cache-dir torch==2.1.0 torchvision==0.16.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu

# Install other dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY backend-files/ ./backend-files/

# Create necessary directories
RUN mkdir -p models temp uploads

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV HOST=0.0.0.0
ENV HF_REPO=Pran-ay-22077/interceptor-models

# Download models during build (optional - can also download at runtime)
RUN python backend-files/model_downloader.py || echo "Models will be downloaded at runtime"

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start the agentic server
CMD ["python", "backend-files/start_server.py"]
