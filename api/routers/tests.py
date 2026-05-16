import os
import json
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from dependencies import get_current_user

router = APIRouter(prefix="/tests", tags=["Tests"])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Поднимаемся на уровень вверх, так как роутер лежит в папке routers
FILE_PATH = os.path.join(os.path.dirname(BASE_DIR), "tests.json")


@router.get("/")
def get_tests():
    if not os.path.exists(FILE_PATH):
        return []
    try:
        with open(FILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


@router.post("/")
def save_tests(tests: List[dict], current_user: dict = Depends(get_current_user)):
    # Здесь можно добавить проверку роли: if current_user['role'] != 'admin': ...
    try:
        with open(FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(tests, f, ensure_ascii=False, indent=2)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
