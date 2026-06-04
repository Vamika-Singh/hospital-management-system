@echo off
title MediCare Hospital Server
color 0A

echo.
echo  ==========================================
echo   MediCare Hospital Management System
echo  ==========================================
echo.
echo  Starting server... Please wait.
echo.

cd /d "%~dp0backend"

npm run dev

echo.
echo  Server stopped. Press any key to exit.
pause >nul
