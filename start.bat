@echo off
echo Starting GreenCoders SIH Web App...
echo.

echo [1/2] Starting FastAPI Backend...
cd backend
start "FastAPI Backend" cmd /k "venv\Scripts\activate && uvicorn main:app --reload --port 8000"
cd ..

timeout /t 3

echo [2/2] Starting React Frontend...
start "React Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   GreenCoders App Started!
echo ========================================
echo   Frontend: http://localhost:5173
echo   Backend API: http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Press any key to stop all servers...
pause > nul

echo Stopping servers...
taskkill /FI "WINDOWTITLE eq FastAPI Backend*" /F
taskkill /FI "WINDOWTITLE eq React Frontend*" /F
