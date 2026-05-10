# api/database.py
import sqlite3
import os

DATABASE_PATH = "./data/tests.db"


def get_db():
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # dict-like доступ
    conn.execute("PRAGMA foreign_keys = ON")  # Включаем CASCADE
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id            TEXT PRIMARY KEY,
            username      TEXT UNIQUE NOT NULL,
            login				 TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role          TEXT DEFAULT 'student',
            created_at    TEXT DEFAULT (datetime('now'))
        );

       
        CREATE TABLE IF NOT EXISTS results (
            id          TEXT PRIMARY KEY,
            user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            test_id     TEXT NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
            score       REAL NOT NULL,
            score_count INTEGER NOT NULL,
            total       INTEGER NOT NULL,
            finished_at TEXT DEFAULT (datetime('now'))
        );
    """)
    conn.commit()
    conn.close()
