@echo off
chcp 65001 >nul
title 土豆史诗 - 本地启动器
cd /d "%~dp0"

echo ============================================================
echo   土豆史诗 · 本地启动器
echo ============================================================
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    python "启动游戏.py"
    goto :end
)

where py >nul 2>nul
if %errorlevel%==0 (
    py "启动游戏.py"
    goto :end
)

where node >nul 2>nul
if %errorlevel%==0 (
    echo 未找到 Python，使用 Node.js 启动...
    call "启动游戏.js"
    goto :end
)

echo 未找到 Python 或 Node.js。
echo 请先安装 Python 3: https://www.python.org/downloads/
echo 安装时记得勾选 "Add Python to PATH"。
echo.
pause

:end
