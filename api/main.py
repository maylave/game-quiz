from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from pydantic import BaseModel
from typing import List, Optional

# Опишите структуру одного теста
class Question(BaseModel):
    text: str
    options: List[str]

class TestItem(BaseModel):
    title: str
    description: Optional[str] = ""
    questions: List[Question]

app = FastAPI()

# Разрешаем запросы с твоего фронтенда (любой порт)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

FILE_PATH = "tests.json"

@app.get("/tests")
def get_tests():
    if not os.path.exists(FILE_PATH):
        return []
    with open(FILE_PATH, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except:
            return []

# api/main.py

@app.post("/tests")
def save_test(test: TestItem):
    # 1. Читаем текущие тесты
    existing_tests = []
    if os.path.exists(FILE_PATH):
        with open(FILE_PATH, "r", encoding="utf-8") as f:
            try:
                existing_tests = json.load(f)
            except:
                existing_tests = []
    
    # 2. Добавляем новый
    existing_tests.append(test.dict()) # или test.model_dump() для Pydantic v2
    
    # 3. Сохраняем обратно
    with open(FILE_PATH, "w", encoding="utf-8") as f:
        json.dump(existing_tests, f, ensure_ascii=False, indent=2)
        
    return {"status": "ok", "message": "Test added"}