FROM python:3.12

ENV PYTHONPATH=/
WORKDIR /app

COPY app .
COPY requirements.txt .
COPY .env .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "main.py"]
