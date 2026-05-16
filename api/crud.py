import secrets
import hashlib
from typing import Optional, Dict
from database import get_db_connection
import sqlite3


def hash_password(password: str, salt: str) -> str:
    """Хеширует пароль с использованием соли"""
    # Для продакшена рекомендую библиотеку bcrypt
    # pip install bcrypt
    # import bcrypt
    # hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    # Текущая реализация на SHA-256
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()


def create_user(username: str, login: str, password: str, role: str = "student") -> Optional[Dict]:
    """Регистрирует нового пользователя"""
    conn = get_db_connection()
    try:
        user_id = secrets.token_hex(8)
        salt = secrets.token_hex(16)
        pwd_hash = hash_password(password, salt)

        conn.execute(
            "INSERT INTO users (id, username, login, password_hash, salt, role) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, username, login, pwd_hash, salt, role)
        )
        conn.commit()

        return {
            "id": user_id,
            "username": username,
            "login": login,
            "role": role
        }
    except sqlite3.IntegrityError:
        return None  # Логин уже занят
    finally:
        conn.close()


def verify_user(login: str, password: str) -> Optional[Dict]:
    """Проверяет учетные данные"""
    conn = get_db_connection()
    try:
        row = conn.execute(
            "SELECT id, username, login, password_hash, salt, role FROM users WHERE login = ?",
            (login,)
        ).fetchone()

        if not row:
            return None

        # Проверяем хеш
        if hash_password(password, row["salt"]) == row["password_hash"]:
            return {
                "id": row["id"],
                "username": row["username"],
                "login": row["login"],
                "role": row["role"]
            }
        return None
    finally:
        conn.close()
