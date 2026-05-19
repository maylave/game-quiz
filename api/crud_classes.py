import secrets
from typing import List, Dict, Optional
from database import get_db_connection
import sqlite3


def generate_access_code(length: int = 6) -> str:
    """Генерирует случайный код доступа (буквы и цифры)"""
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    return ''.join(secrets.choice(chars) for _ in range(length))


def create_class(name: str, teacher_id: str) -> Dict:
    """Создает новый класс и возвращает его данные + код доступа"""
    conn = get_db_connection()
    try:
        class_id = secrets.token_hex(8)
        access_code = generate_access_code()

        # Проверка уникальности кода (редко, но бывает)
        while conn.execute("SELECT 1 FROM classes WHERE access_code = ?", (access_code,)).fetchone():
            access_code = generate_access_code()

        conn.execute(
            "INSERT INTO classes (id, name, access_code, teacher_id) VALUES (?, ?, ?, ?)",
            (class_id, name, access_code, teacher_id)
        )
        conn.commit()

        return {
            "id": class_id,
            "name": name,
            "access_code": access_code,
            "teacher_id": teacher_id
        }
    except sqlite3.IntegrityError:
        raise Exception("Ошибка при создании класса")
    finally:
        conn.close()


def join_class(user_id: str, access_code: str) -> Dict:
    """Студент входит в класс по коду"""
    conn = get_db_connection()
    try:
        # Ищем класс по коду
        class_row = conn.execute(
            "SELECT id, name FROM classes WHERE access_code = ?",
            (access_code.upper(),)  # Приводим к верхнему регистру для удобства
        ).fetchone()

        if not class_row:
            return {"error": "Неверный код доступа"}

        class_id = class_row["id"]

        # Проверяем, не состоит ли уже студент в этом классе
        if conn.execute(
            "SELECT 1 FROM class_members WHERE class_id = ? AND user_id = ?",
            (class_id, user_id)
        ).fetchone():
            return {"error": "Вы уже состоите в этом классе"}

        # Добавляем студента
        conn.execute(
            "INSERT INTO class_members (class_id, user_id) VALUES (?, ?)",
            (class_id, user_id)
        )
        conn.commit()

        return {
            "id": class_id,
            "name": class_row["name"],
            "message": "Успешно присоединились к классу"
        }
    except sqlite3.IntegrityError:
        return {"error": "Ошибка базы данных"}
    finally:
        conn.close()


def get_teacher_classes(teacher_id: str) -> List[Dict]:
    """Получает список классов, созданных преподавателем"""
    conn = get_db_connection()
    try:
        rows = conn.execute(
            "SELECT id, name, access_code, created_at FROM classes WHERE teacher_id = ? ORDER BY created_at DESC",
            (teacher_id,)
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_student_classes(user_id: str) -> List[Dict]:
    """Получает список классов, в которых состоит студент"""
    conn = get_db_connection()
    try:
        rows = conn.execute(
            """
            SELECT c.id, c.name, c.access_code, u.username as teacher_name 
            FROM classes c
            JOIN class_members cm ON c.id = cm.class_id
            JOIN users u ON c.teacher_id = u.id
            WHERE cm.user_id = ?
            ORDER BY c.created_at DESC
            """,
            (user_id,)
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_class_students(class_id: str) -> List[Dict]:
    """Получает список студентов в классе (для преподавателя)"""
    conn = get_db_connection()
    try:
        rows = conn.execute(
            """
            SELECT u.id, u.username, u.login, cm.joined_at
            FROM users u
            JOIN class_members cm ON u.id = cm.user_id
            WHERE cm.class_id = ?
            ORDER BY u.username ASC
            """,
            (class_id,)
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_all_classes() -> List[Dict]:
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM classes").fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_class_by_id(class_id: str) -> Dict:
    conn = get_db_connection()
    # Получаем класс и список студентов одним запросом (или двумя)
    class_row = conn.execute(
        "SELECT * FROM classes WHERE id=?", (class_id,)).fetchone()
    if not class_row:
        conn.close()
        return None

    students = conn.execute("""
        SELECT u.id, u.username, u.login 
        FROM users u 
        JOIN class_members cm ON u.id = cm.user_id 
        WHERE cm.class_id=?
    """, (class_id,)).fetchall()

    conn.close()
    result = dict(class_row)
    result['students'] = [dict(s) for s in students]
    return result


def update_class(class_id: str, name: str = None, teacher_id: str = None) -> Dict:
    conn = get_db_connection()
    if name:
        conn.execute("UPDATE classes SET name=? WHERE id=?", (name, class_id))
    if teacher_id:
        conn.execute("UPDATE classes SET teacher_id=? WHERE id=?",
                     (teacher_id, class_id))
    conn.commit()
    row = conn.execute("SELECT * FROM classes WHERE id=?",
                       (class_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def delete_class(class_id: str) -> bool:
    conn = get_db_connection()
    cur = conn.execute("DELETE FROM classes WHERE id=?", (class_id,))
    conn.commit()
    conn.close()
    return cur.rowcount > 0
