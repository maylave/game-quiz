
from pydantic import BaseModel
from typing import Optional


class CreateUserRequest(BaseModel):
    username: str
    login: str
    password: str
    role: str = "student"


class UpdateUserRequest(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class CreateClassRequest(BaseModel):
    name: str
    teacher_id: Optional[str] = None  # Если None, назначаем текущего админа


class UpdateClassRequest(BaseModel):
    name: Optional[str] = None
    teacher_id: Optional[str] = None
