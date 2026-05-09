# start-dev.ps1 - Запуск разработки (Frontend + Backend)
# Запуск: правой кнопкой по файлу -> "Run with PowerShell" или в терминале: .\start-dev.ps1

# Настройки цветов для удобства
$ColorFront = "Cyan"
$ColorBack = "Green"
$ColorInfo = "Yellow"

Write-Host "`n🚀 Запуск разработки: Game Quiz" -ForegroundColor $ColorInfo
Write-Host "=========================================" -ForegroundColor $ColorInfo

# 1. Запуск Frontend (Vue) в отдельном процессе
$FrontPath = Join-Path $PSScriptRoot "frontend"
Write-Host "`n[1/2] Запуск фронтенда в: $FrontPath" -ForegroundColor $ColorFront

$FrontProcess = Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$FrontPath'; npm run dev" -PassThru

# Небольшая пауза, чтобы фронт успел инициализироваться
Start-Sleep -Seconds 2

# 2. Запуск Backend (FastAPI/Uvicorn) в отдельном процессе
$BackPath = Join-Path $PSScriptRoot "api"
Write-Host "`n[2/2] Запуск бэкенда в: $BackPath" -ForegroundColor $ColorBack

$BackProcess = Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$BackPath'; uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -PassThru

# Итоговое сообщение
Write-Host "`n✅ Оба процесса запущены!" -ForegroundColor $ColorInfo
Write-Host "   🌐 Frontend: http://localhost:5173 (Vite)" -ForegroundColor $ColorFront
Write-Host "   🔗 Backend:  http://localhost:8000/docs" -ForegroundColor $ColorBack
Write-Host "`n💡 Чтобы остановить: закройте окна терминалов или нажмите Ctrl+C в каждом." -ForegroundColor $ColorInfo