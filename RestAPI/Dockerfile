FROM python:3.12.1-slim

# Create the app directory and set it as the working directory
WORKDIR /app

# Copy only the requirements file initially
COPY requirements.txt .

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create a directory for logs
RUN mkdir /Logs

# Expose the desired port
EXPOSE 3000

# Define the entry point and command to run your application
CMD ["gunicorn","--worker-class","eventlet","--workers","1","--bind","0.0.0.0:3000","wsgi:app"]
