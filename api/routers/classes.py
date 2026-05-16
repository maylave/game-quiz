from fastapi import APIRouter, HTTPException, Depends
from typing import List
from pydantic import BaseModel
from dependencies import get_current_user
from crud_classes import (
    create_class,
    join_class,
    get_teacher_classes,
    get_student_classes,
    get_class_students
)

router = APIRouter(prefix="/classes", tags=["Classes"])

# --- Модели запросов ---


class CreateClassRequest(BaseModel):
    name: str


class JoinClassRequest(BaseModel):
    code: str

# --- Эндпоинты ---


@router.post("/create")
def api_create_class(data: CreateClassRequest, current_user: dict = Depends(get_current_user)):
    """Преподаватель создает класс"""
    if current_user.get('role') not in ['teacher', 'admin']:
        raise HTTPException(
            status_code=403, detail="Только преподаватели могут создавать классы")

    try:
        new_class = create_class(name=data.name, teacher_id=current_user['id'])
        return {"status": "success", "class": new_class}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/join")
def api_join_class(data: JoinClassRequest, current_user: dict = Depends(get_current_user)):
    """Студент входит в класс по коду"""
    if current_user.get('role') != 'student':
        raise HTTPException(
            status_code=403, detail="Только студенты могут вступать в классы")

    result = join_class(user_id=current_user['id'], access_code=data.code)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return {"status": "success", "class": result}


@router.get("/my")
def api_get_my_classes(current_user: dict = Depends(get_current_user)):
    """Получает мои классы (зависит от роли)"""
    role = current_user.get('role')
    user_id = current_user['id']

    if role in ['teacher', 'admin']:
        classes = get_teacher_classes(user_id)
    else:
        classes = get_student_classes(user_id)

    return {"classes": classes}


@router.get("/{class_id}/students")
def api_get_class_students(class_id: str, current_user: dict = Depends(get_current_user)):
    """Преподаватель видит список студентов в своем классе"""
    if current_user.get('role') not in ['teacher', 'admin']:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    # Тут можно добавить проверку, что этот учитель действительно владелец класса
    students = get_class_students(class_id)
    return {"students": students}
