@echo off
title 流浪猫狗档案管理系统
echo ============================================
echo   流浪猫狗档案管理系统 - 启动中...
echo ============================================
echo.

cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel% neq 0 (
    where python3 >nul 2>nul
    if %errorlevel% neq 0 (
        echo [错误] 未检测到 Python，请先安装 Python 3
        echo 下载地址: https://www.python.org/downloads/
        echo.
        pause
        exit /b 1
    )
    set PYTHON=python3
) else (
    set PYTHON=python
)

echo [1/2] 正在启动本地服务器 (端口 8080)...
start "" "http://localhost:8080"
%PYTHON% -m http.server 8080

echo.
echo 服务器已停止运行。
pause
