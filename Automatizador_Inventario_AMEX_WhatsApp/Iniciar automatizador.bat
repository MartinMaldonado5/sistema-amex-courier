@echo off
setlocal
cd /d "%~dp0"
title Automatizador de Inventario AMEX - localhost

where node >nul 2>&1
if errorlevel 1 (
  echo No se encontro Node.js.
  echo Instala Node.js 18 o superior y vuelve a iniciar este archivo.
  echo.
  pause
  exit /b 1
)

if not exist "processor\AmexInventoryProcessor\publish\win-x64\AmexInventoryProcessor.exe" (
  echo No se encontro el procesador C# de Excel.
  echo Vuelve a extraer el paquete completo o publica el procesador segun LEEME.txt.
  echo.
  pause
  exit /b 1
)

if not exist "assets\FUENTE_VACIA.xlsx" (
  echo No se encontro la plantilla interna assets\FUENTE_VACIA.xlsx.
  echo Vuelve a extraer el paquete completo.
  echo.
  pause
  exit /b 1
)

echo Iniciando el servidor local de Inventario AMEX...
echo Procesamiento local con C# y Open XML; no requiere Microsoft Excel.
echo La direccion de la aplicacion se mostrara aqui.
echo Para detener el servidor, cierra esta ventana.
echo.
if not exist "runs" mkdir "runs"
node server.js
if errorlevel 1 (
  echo.
  echo No se pudo iniciar el automatizador. Revisa el mensaje anterior.
  pause
)
endlocal
