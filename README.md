# Redactedly

## Required

- Ollama preinstalled with llama3.2:latest model

## Build

``` bash
docker-compose up --build
```

curl -X POST -F "files=@Profile.pdf" -F "method=obfuscate"  http://localhost:5000/redact --output out.zip