FROM python:3.10-slim
COPY . /app
RUN pip install --upgrade pip
WORKDIR /app
RUN pip install -r requirements.txt
RUN mkdir /Logs
ENTRYPOINT ["python"]
CMD ["server.py"]