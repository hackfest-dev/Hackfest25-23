# Base image
FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev 

COPY server/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY server/ .

ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV OLLAMA_HOST=http://host.docker.internal:11434

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]
