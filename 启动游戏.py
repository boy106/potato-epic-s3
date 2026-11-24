#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""土豆史诗 · 一键启动器

双击本文件即可启动游戏（自动开静态服务器 + 打开浏览器）。
需要 Python 3（Windows 用户若没有，改用「启动游戏.bat」）。
"""

import http.server
import socketserver
import socket
import webbrowser
import threading
import os
import sys

# 扫描优先端口；被占用则自动往后找
PORTS = [8080, 8081, 8082, 8888, 9000, 9123]

# 网关屏蔽外部浏览器自动打开时，仍允许手动输入地址
os.chdir(os.path.dirname(os.path.abspath(__file__)))


def pick_port():
    for p in PORTS:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", p))
                return p
            except OSError:
                continue
    # 全占用则让系统随机分配
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # 静默访问日志，保持窗口干净
        pass


def main():
    port = pick_port()
    url = f"http://127.0.0.1:{port}/index.html"

    print("=" * 56)
    print("  土豆史诗 · 本地启动器")
    print("=" * 56)
    print(f"  游戏地址: {url}")
    print("  浏览器会自动打开；若没弹出来，手动复制上面地址到浏览器")
    print("  关闭游戏: 回到这个窗口按 Ctrl+C，或直接关掉窗口")
    print("=" * 56)

    handler = lambda *a, **kw: QuietHandler(*a, directory=os.getcwd(), **kw)
    httpd = socketserver.TCPServer(("127.0.0.1", port), handler)
    httpd.allow_reuse_address = True

    threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已关闭。")
        httpd.shutdown()


if __name__ == "__main__":
    main()
