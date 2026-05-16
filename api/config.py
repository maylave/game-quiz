import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    APP_NAME: str = "Quiz Master API"
    SECRET_KEY: str = os.getenv(
        "key_jwt", "super_secret_key_change_me_in_prod")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/quiz.db")

    # Извлекаем чистый путь для SQLite
    DB_PATH: str = DATABASE_URL.replace("sqlite:///", "")


settings = Settings()
