from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional


from schemas.auth import RegisterRequest

from crud import create_user as crud_create_user

from dependencies import get_current_user
from crud_classes import (
    create_class,
    delete_class,
    update_class,
    get_all_classes,
    get_class_by_id
)
from crud import (
    delete_user,
    update_user,
    get_all_users,
    set_user_role
)
from schemas.user import (
    CreateUserRequest,
    UpdateUserRequest,
    CreateClassRequest,
    UpdateClassRequest
)

router = APIRouter(prefix="/admin")


def require_admin(current_user: dict = Depends(get_current_user)):
    """Проверяет, что текущий пользователь - администратор"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403, detail="Доступ запрещен. Требуются права администратора.")
    return current_user


# (/admin/users)


@router.post("/users/create")
def admin_create_user(
    data: CreateUserRequest,
    admin: dict = Depends(require_admin)
):
    """Админ создает нового пользователя"""
    try:
        new_user = crud_create_user(
            username=data.username,
            login=data.login,
            password=data.password,
            role=data.role
        )
        return {"status": "success", "user": new_user}
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Ошибка сервера: {str(e)}")


@router.get("/users/list")
def admin_get_all_users(admin: dict = Depends(require_admin)):
    """Получить список всех пользователей"""
    users = get_all_users()
    return {"users": users}


@router.delete("/users/{user_id}")
def admin_delete_user(user_id: str, admin: dict = Depends(require_admin)):
    """Удалить пользователя по ID"""
    success = delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {"status": "deleted"}


@router.put("/users/{user_id}")
def admin_update_user(user_id: str, data: UpdateUserRequest, admin: dict = Depends(require_admin)):
    """Редактировать данные пользователя"""
    try:
        updated_user = update_user(
            user_id=user_id,
            username=data.username,
            role=data.role
        )
        return {"status": "updated", "user": updated_user}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/users/{user_id}/set-role")
def admin_set_role(user_id: str, new_role: str, admin: dict = Depends(require_admin)):
    """Быстрая смена роли"""
    try:
        updated_user = set_user_role(user_id, new_role)
        return {"status": "role_updated", "user": updated_user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# (/admin/classes)


@router.post("/classes/create")
def admin_create_class(data: CreateClassRequest, admin: dict = Depends(require_admin)):
    """Создать новый класс"""
    try:

        teacher_id = data.teacher_id or admin['id']

        new_class = create_class(name=data.name, teacher_id=teacher_id)
        return {"status": "success", "class": new_class}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/classes/list")
def admin_get_classes(admin: dict = Depends(require_admin)):
    """Список всех классов"""
    classes = get_all_classes()
    return {"classes": classes}


@router.get("/classes/{class_id}")
def admin_get_class(class_id: str, admin: dict = Depends(require_admin)):
    """Информация о конкретном классе + студенты"""
    class_data = get_class_by_id(class_id)
    if not class_data:
        raise HTTPException(status_code=404, detail="Класс не найден")
    return {"class": class_data}


@router.put("/classes/{class_id}")
def admin_update_class(class_id: str, data: UpdateClassRequest, admin: dict = Depends(require_admin)):
    """Редактировать класс"""
    try:
        updated_class = update_class(
            class_id=class_id,
            name=data.name,
            teacher_id=data.teacher_id
        )
        if not updated_class:
            raise HTTPException(status_code=404, detail="Класс не найден")
        return {"status": "updated", "class": updated_class}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/classes/{class_id}")
def admin_delete_class(class_id: str, admin: dict = Depends(require_admin)):
    """Удалить класс"""
    success = delete_class(class_id)
    if not success:
        raise HTTPException(status_code=404, detail="Класс не найден")
    return {"status": "deleted"}
