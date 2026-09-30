@echo off
title Sistema AMEX Courier - Entorno Local Completo (Web + Worker)
cd /d "%~dp0"

echo ===================================================
echo     INICIANDO SISTEMA AMEX COURIER (LOCAL)
echo ===================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se encontro Node.js en el sistema.
  pause
  exit /b 1
)

echo 1. Iniciando Worker en segundo plano (Modulo 13)...
start "AMEX Worker - Modulo 13" cmd /k "title AMEX Worker Modulo 13 && node worker/worker.js"

echo 2. Iniciando Servidor Web Next.js (localhost:3000)...
start "AMEX Web Dev - localhost:3000" cmd /k "title AMEX Next.js Dev && npm run dev"

echo.
echo ===================================================
echo   Entorno iniciado:
echo   - Web App: http://localhost:3000
echo   - Worker Modulo 13: Activo escuchando tareas
echo ===================================================
echo.
timeout /t 3 >nul
