#!/usr/bin/env python3
"""首轮黑盒探测：加载页面，收集控制台消息、网络 404、截图、DOM/存档状态。"""
import json, sys, time
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8813/index.html"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/workspace/production/qa/evidence"

console_msgs, failures, responses = [], [], []

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/usr/bin/chromium",
        args=["--use-gl=angle", "--use-angle=swiftshader",
              "--enable-unsafe-swiftshader", "--no-sandbox"])
    page = browser.new_page(viewport={"width": 1280, "height": 720})

    page.on("console", lambda m: console_msgs.append(
        {"type": m.type, "text": m.text[:500], "loc": f"{m.location.get('url','')}:{m.location.get('lineNumber','')}"}))
    page.on("requestfailed", lambda r: failures.append(
        {"url": r.url, "err": r.failure}))
    page.on("response", lambda r: responses.append(
        {"url": r.url, "status": r.status}) if r.status >= 400 else None)
    page.on("pageerror", lambda e: console_msgs.append(
        {"type": "pageerror", "text": str(e)[:500], "loc": ""}))

    page.goto(URL, wait_until="load", timeout=30000)
    page.wait_for_timeout(8000)  # 等 boot 流程充分暴露问题

    state = page.evaluate("""() => ({
        title: document.title,
        gameDefined: typeof window.game !== 'undefined',
        gameState: window.game ? window.game.state : null,
        errText: (document.getElementById('err')||{}).textContent || '',
        errDisplay: (document.getElementById('err')||{}).style ? getComputedStyle(document.getElementById('err')).display : '',
        bootDisplay: getComputedStyle(document.getElementById('boot')).display,
        bootHeld: window.BOOT_HELD === true,
        bootText: (document.getElementById('boottext')||{}).textContent,
        bootPct: (document.getElementById('bootpct')||{}).textContent,
        lobbyExists: !!document.getElementById('lobby'),
        canvasCount: document.querySelectorAll('canvas').length,
        localStorageKeys: Object.keys(localStorage),
        potatoGlobals: Object.keys(window).filter(k => /SKIN|POTATO|MODS/i.test(k)),
        webgl2: !!document.createElement('canvas').getContext('webgl2'),
    })""")

    page.screenshot(path=f"{OUT}/probe1_boot_webgl2_err.png", full_page=True)
    browser.close()

report = {"url": URL, "state": state,
          "console": console_msgs, "http_fail": failures, "http_4xx": responses}
print(json.dumps(report, ensure_ascii=False, indent=1))
with open(f"{OUT}/probe1_result.json", "w") as f:
    json.dump(report, f, ensure_ascii=False, indent=1)
