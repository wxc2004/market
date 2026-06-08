@echo off
chcp 65001 >nul
title SkillMarket 一键安装

echo ============================================
echo   SkillMarket v1.3.37 - Windows 一键安装
echo ============================================
echo.

:: Check if skillmarket.exe exists
if not exist "%~dp0dist\skillmarket.exe" (
    echo [错误] 未找到 dist\skillmarket.exe
    echo 请先运行: npm run build ^&^& node scripts/build-exe.mjs
    echo.
    pause
    exit /b 1
)

echo [1/4] 正在检查管理员权限...
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 建议以管理员身份运行以获得更好的兼容性
    echo        按任意键继续, 或关闭窗口后右键选择"以管理员身份运行"
    pause >nul
)

echo [2/4] 正在安装 SkillMarket...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1" -DesktopShortcut
if %errorlevel% neq 0 (
    echo [错误] 安装失败
    pause
    exit /b 1
)

echo [3/4] 安装完成!
echo [4/4] 正在启动 GUI...
echo.

:: Launch GUI
start http://localhost:18770
start "SkillMarket GUI" "%~dp0dist\skillmarket.exe" gui

echo.
echo ============================================
echo   SkillMarket 已安装!
echo   用法:
echo     skm ls          列出技能
echo     skm gui         启动 Web 界面
echo     skm --help      查看所有命令
echo ============================================
echo.
pause
