@echo off
echo ===================================================
echo   Starting CupPredict 2026: FIFA World Cup Simulator
echo ===================================================
echo.
echo 1. Opening your web browser at http://localhost:8000...
start http://localhost:8000
echo.
echo 2. Starting local FastAPI web server...
echo    (Press CTRL+C in this window to stop the server)
echo.
call .\venv\Scripts\activate.bat
uvicorn api.main:app --host 127.0.0.1 --port 8000
pause
