
import os
import subprocess

from dotenv import load_dotenv
from sqlalchemy import URL

load_dotenv(override=True)

db_url = URL.create(
    "mysql+pymysql",
    username=os.getenv("MYSQL_USER"),
    password=os.getenv("MYSQL_PASSWORD"),
    host=os.getenv("MYSQL_HOST"),
    port=int(os.getenv("MYSQL_PORT", "3306")),
    database=os.getenv("MLFLOW_DB"),
)

backend_uri = db_url.render_as_string(hide_password=False)

subprocess.run([
    "mlflow",
    "ui",
    "--backend-store-uri", backend_uri,
    "--host", "127.0.0.1",
    "--port", "5000",
], check=True)
