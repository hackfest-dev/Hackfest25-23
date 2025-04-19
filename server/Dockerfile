# Base image
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libtesseract-dev \
    libpq-dev \
    build-essential \
    gcc \
    g++ \
    python3-dev \
    libffi-dev \
    libatlas-base-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY server/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

RUN python -m spacy download en_core_web_lg

COPY server/ .

ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV OLLAMA_HOST=http://host.docker.internal:11434

EXPOSE 5000

# CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
CMD ["python", "app.py"]
