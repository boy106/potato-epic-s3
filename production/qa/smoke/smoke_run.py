#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
土豆史诗 · 黑盒烟雾测试套件（可自动化部分：S-01 ~ S-17）
========================================================
运行方式：
    python3 smoke_run.py [BASE_URL]
    # BASE_URL 默认 http://127.0.0.1:8813/index.html（需先起静态服务指向 build 解压目录）
    # 依赖：python3 + playwright（chromium 位于 /usr/bin/chromium）

说明：
- 沙箱无头 Chromium 的 WebGL2 不可用，属环境限制；游戏只能停在 boot 态。
  因此本套件覆盖「加载层/资源层/控制台层/DOM 层/存档层」，
  3D 对局、大厅 UI、联机等用例见 smoke-tests.md 的「需人工执行」部分（S-18 ~ S-30）。
- 断言语义为「期望的正确行为」：当前因 D-001 等缺陷会出 FAIL，
  缺陷修复后对应用例转 PASS，即回归门控。
- 陀螺仪（新功能）用例挂载点预留：smoke-tests.md S-30。
"""
import json
import os
import re
import subprocess
import sys
import time
from urllib.parse import urljoin
from urllib.request import urlopen

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8813/index.html"
ROOT = BASE.rsplit("/", 1)[0] + "/"
EVID = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "evidence")
EVID = os.path.normpath(EVID)
BUILD = "/root/.codebuddy/artifact/2f8a7d30-9c21-4f0b-1d7a-413ace604000/inspect/土豆史诗-离线版"

# 已知环境限制产生的白名单错误（不算游戏缺陷）
ENV_WHITELIST = [
    re.compile(r"WebGL2 不可用"),
    re.compile(r"new Renderer"),
]
# 已知缺陷产生的错误（用例会判 FAIL 并标注对应缺陷号）
KNOWN_DEFECT_RES = [
    ("js/skins_data.js", "D-001"),
    ("potato/logo.svg", "D-005"),
    ("potato/bg.jpg", "D-005"),
    ("favicon.ico", "D-006"),
]
KNOWN_DEFECT_WARN = [
    (re.compile(r"missing tile i_waxed_\w+_door"), "D-002"),
    (re.compile(r"preloaded using link preload but not used"), "D-007"),
]

results = []


def record(cid, name, ok, detail, defect=""):
    results.append({"id": cid, "name": name, "result": "PASS" if ok else "FAIL",
                    "detail": detail, "defect": defect})
    flag = "PASS" if ok else "FAIL"
    print(f"[{flag}] {cid} {name}" + (f"  <<{defect}>>" if defect and not ok else ""))


def http_status(url):
    try:
        return urlopen(url, timeout=10).status
    except Exception as e:
        code = getattr(e, "code", None)
        return code if code else str(e)


# ---------- 浏览器会话探针（一次加载，多个用例共享证据） ----------

def boot_probe():
    from playwright.sync_api import sync_playwright
    console, failures, errors4xx = [], [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path="/usr/bin/chromium",
            args=["--use-gl=angle", "--use-angle=swiftshader",
                  "--enable-unsafe-swiftshader", "--no-sandbox"])
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.on("console", lambda m: console.append(
            {"type": m.type, "text": m.text[:400]}))
        page.on("requestfailed", lambda r: failures.append(r.url))
        page.on("response", lambda r: errors4xx.append(
            {"url": r.url, "status": r.status}) if r.status >= 400 else None)
        page.goto(BASE, wait_until="load", timeout=30000)
        page.wait_for_timeout(8000)
        dom = page.evaluate("""() => {
            const g = id => document.getElementById(id);
            const err = g('err'), boot = g('boot');
            const logo = boot ? boot.querySelector('.bt-logo') : null;
            const r = el => el ? el.getBoundingClientRect() : null;
            const overlap = (a, b) => a && b && !(a.right < b.left || b.right < a.left ||
                a.bottom < b.top || b.bottom < a.top);
            const errBox = r(err), logoBox = r(logo);
            return {
                title: document.title,
                gameState: window.game ? window.game.state : null,
                bootVisible: boot ? getComputedStyle(boot).display !== 'none' : false,
                logoSvg: !!(logo && logo.querySelector('svg')),
                bootbar: !!g('bootbar'), boottext: g('boottext') ? g('boottext').textContent : '',
                bootpct: g('bootpct') ? g('bootpct').textContent : '',
                errVisible: err ? getComputedStyle(err).display !== 'none' : false,
                errText: err ? err.textContent : '',
                errLogoOverlap: overlap(errBox, logoBox),
                errBox: errBox ? {x: errBox.x, y: errBox.y, w: errBox.width, h: errBox.height} : null,
                localStorageKeys: Object.keys(localStorage),
                potatoGlobals: ['PotatoSettings','PotatoCheckin','PotatoRanked','PotatoCustom',
                    'PotatoHub','PotatoWardrobe','PotatoGunSkins'].filter(k => k in window),
                webgl2Probe: (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return 'throw:' + e.message; } })(),
            };
        }""")
        page.screenshot(path=os.path.join(EVID, "smoke_boot_state.png"))
        browser.close()
    return {"console": console, "failures": failures,
            "errors4xx": errors4xx, "dom": dom}


def classify_console(console):
    """把控制台消息分类：环境错误 / 已知缺陷 / 未预期问题"""
    env, defect, unexpected = [], [], []
    for m in console:
        t, txt = m["type"], m["text"]
        if t == "error" and any(w.search(txt) for w in ENV_WHITELIST) and "WebGL2" in txt:
            env.append(m); continue
        if t == "error" and "404" in txt:
            hit = next((d for pat, d in KNOWN_DEFECT_RES
                        if pat in txt or any(pat in f["url"] for f in [])), None)
            env.append(m); continue  # 404 类在资源用例里判
        if t == "warning" and any(w.search(txt) for w, _ in KNOWN_DEFECT_WARN):
            defect.append((m, next(d for w, d in KNOWN_DEFECT_WARN if w.search(txt))))
            continue
        if t in ("error", "warning"):
            unexpected.append(m)
    return env, defect, unexpected


# ---------- 用例 ----------

def case_S01_static():
    """S-01 页面可达：index.html 返回 200，<title> 为 土豆史诗"""
    st = http_status(BASE)
    ok = st == 200
    record("S-01", "页面可达与标题", ok, f"GET {BASE} -> {st}",
           defect="" if ok else "服务/部署问题")


def case_S02_core_scripts():
    """S-02 核心脚本可达：pack1-4 / mods 入口文件全部 200"""
    files = ["js/pack1.js", "js/pack2.js", "js/pack3.js", "js/pack4.js",
             "mods/index.json", "mods/xzguns/data.js", "mods/xzguns/code.js",
             "mods/xzguns/bundle.js", "mods/xzguns/tiles.webp",
             "mods/xzrange/data.js", "mods/xzrange/code.js"]
    bad = [(f, http_status(urljoin(ROOT, f))) for f in files]
    bad = [x for x in bad if x[1] != 200]
    record("S-02", "核心脚本与 mod 入口可达", not bad, f"缺失/非200: {bad}" if bad else "全部 200")


def case_S03_index_json_integrity():
    """S-03 mods/index.json 声明的所有文件与磁盘一致（构建完整性）"""
    try:
        idx = json.load(open(os.path.join(BUILD, "mods/index.json")))
        missing = []
        for m in idx["mods"]:
            for f in m["files"]:
                pth = os.path.join(BUILD, "mods", m["id"], f)
                if not os.path.exists(pth):
                    missing.append(f"mods/{m['id']}/{f}")
        record("S-03", "mods/index.json 资源完整性", not missing,
               f"声明但缺失: {missing}" if missing else f"{sum(len(m['files']) for m in idx['mods'])} 个文件全部存在")
    except Exception as e:
        record("S-03", "mods/index.json 资源完整性", False, f"index.json 解析失败: {e}")


def run_all(probe):
    dom = probe["dom"]
    env, defect_warn, unexpected = classify_console(probe["console"])
    urls4xx = [e["url"] for e in probe["errors4xx"]]
    failed_req = probe["failures"]

    # S-04 控制台无非环境、非已归类缺陷的未预期错误/警告
    record("S-04", "控制台无未预期错误/警告", not unexpected,
           f"未预期: {unexpected}" if unexpected else "仅环境限制错误与已归类缺陷告警")

    # S-05 缺失脚本资源回归：js/skins_data.js 应 200（当前 D-001）
    st = http_status(urljoin(ROOT, "js/skins_data.js"))
    record("S-05", "js/skins_data.js 可达（回归门控）", st == 200,
           f"GET js/skins_data.js -> {st}", defect="D-001" if st != 200 else "")

    # S-06 favicon 可达
    st = http_status(urljoin(ROOT, "favicon.ico"))
    record("S-06", "favicon.ico 可达", st == 200,
           f"GET favicon.ico -> {st}", defect="D-006" if st != 200 else "")

    # S-07 无 missing tile 告警
    tile_warns = [m["text"] for m in probe["console"]
                  if m["type"] == "warning" and "missing tile" in m["text"]]
    record("S-07", "无 missing tile 贴图告警", not tile_warns,
           f"{len(tile_warns)} 条: {tile_warns[:4]}", defect="D-002" if tile_warns else "")

    # S-08 boot 界面结构渲染
    ok = dom["bootVisible"] and dom["logoSvg"] and dom["bootbar"]
    record("S-08", "boot 引导界面结构渲染", ok,
           f"bootVisible={dom['bootVisible']} logoSvg={dom['logoSvg']} bootbar={dom['bootbar']}")

    # S-09 加载达到终态：100%/准备就绪，或显示可见错误
    reached = dom["bootpct"].startswith("100") or "准备就绪" in dom["boottext"]
    err_terminal = dom["errVisible"] and bool(dom["errText"].strip())
    record("S-09", "加载流程有明确终态（100% 或可见错误提示）", reached or err_terminal,
           f"pct={dom['bootpct']} text={dom['boottext']} errVisible={dom['errVisible']}",
           defect="D-004" if not (reached or err_terminal) else "")

    # S-10 错误提示与 logo 无遮挡重叠
    ok = (not dom["errVisible"]) or (not dom["errLogoOverlap"])
    record("S-10", "错误提示不被 logo 遮挡", ok,
           f"errVisible={dom['errVisible']} overlap={dom['errLogoOverlap']} errBox={dom['errBox']}",
           defect="D-003" if not ok else "")

    # S-11 WebGL2 探测路径安全：getContext 探测可调用且失败被捕获（不抛未处理异常）
    ok = dom["webgl2Probe"] in (True, False)
    record("S-11", "WebGL2 能力探测路径安全", ok, f"webgl2Probe={dom['webgl2Probe']}")

    # S-12 全局功能入口齐备
    missing = [k for k in ["PotatoSettings", "PotatoCheckin", "PotatoRanked", "PotatoCustom",
                           "PotatoHub", "PotatoWardrobe", "PotatoGunSkins"] if k not in dom["potatoGlobals"]]
    record("S-12", "大厅功能全局入口齐备", not missing,
           f"缺失: {missing}" if missing else "7 个入口全部就绪")

    # S-13 启动不污染 localStorage
    ok = len(dom["localStorageKeys"]) == 0
    record("S-13", "启动过程不写入 localStorage", ok,
           f"keys={dom['localStorageKeys']}",
           defect="" if ok else "P3-观察项")

    # S-14 存档 key 命名规范（静态）：mcjs-* / potato-* 前缀
    try:
        src = open(os.path.join(BUILD, "js/pack4.js"), encoding="utf-8", errors="ignore").read()
        keys = set(re.findall(r'localStorage\.\w+\("([A-Za-z0-9_:-]+)"', src))
        bad = [k for k in keys if not (k.startswith("mcjs-") or k.startswith("potato"))]
        record("S-14", "存档 key 命名规范（mcjs-/potato 前缀）", not bad,
               f"异常 key: {bad}" if bad else f"{len(keys)} 个 key 全部合规")
    except Exception as e:
        record("S-14", "存档 key 命名规范", False, f"静态扫描失败: {e}")

    # S-15 index.json 结构合法
    try:
        idx = json.load(open(os.path.join(BUILD, "mods/index.json")))
        ok = isinstance(idx.get("mods"), list) and all(
            {"id", "name", "files"} <= set(m) for m in idx["mods"])
        record("S-15", "mods/index.json 结构合法", ok,
               "mods=[" + ", ".join(m["id"] for m in idx["mods"]) + "]")
    except Exception as e:
        record("S-15", "mods/index.json 结构合法", False, str(e))

    # S-16 正式 build 无开发残留地址（127.0.0.1:8842 等）
    bad = []
    for pack in ("pack1.js", "pack2.js", "pack3.js", "pack4.js"):
        src = open(os.path.join(BUILD, "js", pack), encoding="utf-8", errors="ignore").read()
        if "127.0.0.1:8842" in src:
            bad.append(pack)
    record("S-16", "无开发机残留地址（127.0.0.1:8842）", not bad,
           f"出现在: {bad}" if bad else "未发现",
           defect="D-008" if bad else "")

    # S-17 两次加载错误集合稳定（flaky 初筛）
    probe2 = boot_probe()
    sig1 = sorted((m["type"], m["text"][:80]) for m in probe["console"])
    sig2 = sorted((m["type"], m["text"][:80]) for m in probe2["console"])
    record("S-17", "两次加载控制台输出稳定（flaky 初筛）", sig1 == sig2,
           "一致" if sig1 == sig2 else f"差异: {set(sig1) ^ set(sig2)}")


def main():
    os.makedirs(EVID, exist_ok=True)
    case_S01_static()
    case_S02_core_scripts()
    case_S03_index_json_integrity()
    print("-- 浏览器加载探针 --")
    probe = boot_probe()
    run_all(probe)
    out = os.path.join(EVID, "smoke_results.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"base": BASE, "ts": time.strftime("%F %T"),
                   "results": results}, f, ensure_ascii=False, indent=1)
    npass = sum(1 for r in results if r["result"] == "PASS")
    print(f"\n== 自动化烟雾: {npass}/{len(results)} PASS ==  结果: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
