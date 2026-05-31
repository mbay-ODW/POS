FROM python:3.12.1-slim

WORKDIR /app

# Build deps for bcrypt, cffi, Pillow, etc.
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ \
    python3-dev \
    libffi-dev \
    libusb-1.0-0 \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create a directory for logs
RUN mkdir /Logs

# Expose the desired port
EXPOSE 3000

# Define the entry point and command to run your application
CMD ["gunicorn","--worker-class","eventlet","--workers","1","--bind","0.0.0.0:3000","wsgi:app"]
