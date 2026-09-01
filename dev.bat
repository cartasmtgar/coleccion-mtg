@echo off
title Coleccion MTG - Dev Server
cd /d "%~dp0"
echo ========================================
echo  Coleccion MTG - Servidor Desarrollo
echo  URL: http://localhost:5173
echo ========================================
echo.
echo Iniciando servidor...
echo Cerrar esta ventana o presionar Ctrl+C para detener.
echo.
REM Abre el navegador automaticamente en 3 segundos
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:5173"
powershell -ExecutionPolicy Bypass -Command "npm run dev"
pause
