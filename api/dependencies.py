from fastapi import Header, HTTPException, Depends
from typing import Optional
from config import settings
from utils.jwt_handler import JWTHandler

# Инициализируем обработчик один раз
jwt_handler = JWTHandler(secret_key=settings.SECRET_KEY)


def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Не передан токен")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Неверный формат токена")

    user_data = jwt_handler.verify_token(token)
    if not user_data:
        raise HTTPException(
            status_code=401, detail="Токен невалиден или истек")

    return user_data
