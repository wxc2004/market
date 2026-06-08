@echo off
chcp 65001 >nul
title SkillMarket Desktop

:: 切换到项目目录
cd /d "%~dp0.."

:: 隐藏控制台窗口，后台启动 Electron
start "" /B powershell -WindowStyle Hidden -Command "npx electron electron/main.mjs" 2>nul

:: 检查是否启动成功（服务器端口 18770）
timeout /t 3 /nobreak >nul
netstat -an | findstr "18770" >nul
if %errorlevel% neq 0 (
    :: 隐藏式启动失败，换前台方式再试
    start "SkillMarket Desktop" npx electron electron/main.mjs
)
