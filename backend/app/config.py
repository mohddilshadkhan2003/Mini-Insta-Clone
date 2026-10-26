import os
from dotenv import load_dotenv

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "Mini Insta Clone")
APP_ENV = os.getenv("APP_ENV", "development")
APP_PORT = int(os.getenv("APP_PORT", "8000"))
JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-key")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
DATABASE_PATH = os.getenv("DATABASE_PATH", "./app/mini_insta.db")
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
