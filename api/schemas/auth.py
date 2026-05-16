from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    login: str
    code: str


class RegisterRequest(BaseModel):
    name: str
    login: str
    code: str
    role: str = "student"


class TokenResponse(BaseModel):
    status: str
    token: str
    user: dict
    message: Optional[str] = None
