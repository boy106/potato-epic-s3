#!/bin/bash
# 土豆史诗 · 一键启动器（macOS / Linux）
# 双击或在终端运行: bash 启动游戏.sh

cd "$(dirname "$0")"

echo "============================================================"
echo "  土豆史诗 · 本地启动器"
echo "============================================================"

if command -v python3 >/dev/null 2>&1; then
    exec python3 "启动游戏.py"
elif command -v node >/dev/null 2>&1; then
    exec node "启动游戏.js"
else
    echo "未找到 python3 或 node，请先安装其一。"
    read -r -p "按回车退出..."
    exit 1
fi
