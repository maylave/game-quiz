@echo off
chcp 65001 >nul
title 🚀 Game Quiz Dev

echo ========================================
echo 🚀 Запуск разработки: Game Quiz
echo ========================================

:: ==========================================
:: 1. Запуск Nginx (выберите ОДИН вариант ниже)
:: ==========================================

:: --- ВАРИАНТ А: Nginx через Docker (если установлен) ---
echo [0/3] Запуск Nginx (Docker)...
docker start nginx 2>nul || docker run -d --name nginx -p 80:80 -v "%~dp0nginx/conf.d:/etc/nginx/conf.d" -v "%~dp0frontend/dist:/usr/share/nginx/html:ro" nginx
if %errorlevel% neq 0 echo ⚠️ Docker не запущен или ошибка с контейнером

:: --- ВАРИАНТ Б: Локальный Nginx (распакован в C:\nginx) ---
:: echo [0/3] Запуск Nginx (локально)...
:: cd /d "C:\nginx"
:: start "Nginx" nginx.exe
:: cd /d "%~dp0"

:: ==========================================
:: 2. Запуск фронтенда (Vue)
:: ==========================================
echo [1/3] Запуск фронтенда...
start "Frontend" powershell -NoExit -Command "cd '%~dp0frontend'; npm run dev"

timeout /t 2 /nobreak >nul

:: ==========================================
:: 3. Запуск бэкенда (FastAPI)
:: ==========================================
echo [2/3] Запуск бэкенда...
start "Backend" powershell -NoExit -Command "cd '%~dp0api'; uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

:: ==========================================
:: Итог
:: ==========================================
echo.
echo ✅ Все процессы запущены!
echo 🌐 Доступ через Nginx: http://localhost
echo 📚 Swagger API: http://localhost/api/docs
echo 💡 Чтобы остановить:
echo    • Docker: docker stop nginx
echo    • Локально: cd C:\nginx ^& nginx -s stop
echo    • Или просто закройте окна терминалов.
pause