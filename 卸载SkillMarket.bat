@echo off
chcp 65001 >nul
title 卸载 SkillMarket

echo ============================================
echo   卸载 SkillMarket
echo ============================================
echo.

set /p confirm="确定要卸载 SkillMarket 吗? (y/N): "
if /i not "%confirm%"=="y" (
    echo 已取消.
    pause
    exit /b 0
)

echo 正在卸载...
powershell -ExecutionPolicy Bypass -Command "& '%~dp0scripts\install.ps1' -Uninstall"

echo.
pause
