import sqlite3
import os
from config import settings


def get_db_connection():
    db_dir = os.path.dirname(settings.DB_PATH)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(settings.DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.executescript("""
            -- Таблица пользователей (без изменений)
            CREATE TABLE IF NOT EXISTS users (
                id            TEXT PRIMARY KEY,
                username      TEXT NOT NULL,
                login         TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt          TEXT NOT NULL,
                role          TEXT DEFAULT 'student',
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- НОВАЯ ТАБЛИЦА: Классы/Группы
            CREATE TABLE IF NOT EXISTS classes (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,          -- Например "9А" или "Python Basic"
                access_code TEXT UNIQUE NOT NULL,   -- Код для входа студентов (например, "ABCD12")
                teacher_id  TEXT NOT NULL REFERENCES users(id),
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- НОВАЯ ТАБЛИЦА: Участники класса (Студенты)
            CREATE TABLE IF NOT EXISTS class_members (
                class_id    TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
                user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (class_id, user_id)
            );

            -- Таблица тестов (можно добавить class_id, если тест привязан к конкретному классу)
            CREATE TABLE IF NOT EXISTS tests (
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL,
                description TEXT,
                teacher_id  TEXT REFERENCES users(id), -- Кто создал тест
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            -- Таблица результатов
            CREATE TABLE IF NOT EXISTS results (
                id          TEXT PRIMARY KEY,
                user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                test_id     TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
                class_id    TEXT REFERENCES classes(id), -- В каком классе сдан тест
                score       REAL NOT NULL,
                total       INTEGER NOT NULL,
                finished_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
    finally:
        conn.close()


init_db()
