from fastapi import FastAPI, Depends  # <--- ДОБАВЬ Depends СЮДА
from fastapi.middleware.cors import CORSMiddleware
from config import settings

# Импорт роутеров

from routers import auth, classes, tests, admin

# Импорт зависимости для проверки пользователя
from dependencies import get_current_user

app = FastAPI(title=settings.APP_NAME)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(auth.router)
app.include_router(classes.router)
app.include_router(tests.router)
app.include_router(admin.router, )
# Эндпоинт для проверки текущего пользователя


@app.get("/user/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
