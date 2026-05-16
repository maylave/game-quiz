# routers/auth.py
from fastapi import APIRouter, HTTPException
from schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from crud import create_user, verify_user  # <--- Импорт из нового файла
from dependencies import jwt_handler

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(user_data: RegisterRequest):
    result = create_user(
        username=user_data.name,
        login=user_data.login,
        password=user_data.code,
        role=user_data.role
    )

    if not result:
        raise HTTPException(status_code=409, detail="Логин уже занят")

    token = jwt_handler.create_token(result)

    return {
        "status": "success",
        "message": "Пользователь создан",
        "user": result,
        "token": token
    }


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest):
    user = verify_user(credentials.login, credentials.code)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный логин или код")

    token = jwt_handler.create_token(user)
    return {"status": "success", "token": token, "user": user}
