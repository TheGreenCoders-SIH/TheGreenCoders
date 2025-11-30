#!/bin/bash

echo "Starting GreenCoders SIH Web App..."
echo ""

echo "[1/2] Starting FastAPI Backend..."
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

sleep 3

echo "[2/2] Starting React Frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  GreenCoders App Started!"
echo "========================================"
echo "  Frontend: http://localhost:5173"
echo "  Backend API: http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
