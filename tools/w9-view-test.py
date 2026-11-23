#!/usr/bin/env python3
"""W9 真机视角异常诊断 · mock 验证
1) pageerror=0（WebGL2 环境错误豁免） 2) 设置页新增反转开关 DOM 正常
3) mock deviceorientation + _test 注入差分下，反转开关生效并持久化
运行前置：python3 -m http.server 8832（/workspace/src）
"""
import re
import sys
import time
from playwright.sync_api import sync_playwright

ARGS = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"]
URL = "http://localhost:8832/index.html"
EXEMPT = re.compile(r"WebGL|swiftshader|ANGLE|GPU|webgl", re.I)

R = []
def check(name, ok, detail=""):
    R.append({"name": name, "ok": bool(ok), "detail": str(detail)[:300]})
    print(("PASS " if ok else "FAIL ") + name + (("  | " + str(detail)[:200]) if detail else ""))

with sync_playwright() as p:
    browser = p.chromium.launch(args=ARGS)
    ctx = browser.new_context(
        viewport={"width": 844, "height": 390}, has_touch=True, is_mobile=True,
        user_agent="Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36",
    )
    page = ctx.new_page()
    page_errors = []
    page.on("pageerror", lambda e: None if EXEMPT.search(str(e)) else page_errors.append(str(e)))
    page.goto(URL, wait_until="load", timeout=90000)
    for _ in range(120):
        if page.evaluate("typeof self.Gyro !== 'undefined'"):
            break
        time.sleep(0.5)

    check("pageerror=0", len(page_errors) == 0, "; ".join(page_errors[:3]))
    check("Gyro API 含 getFlip/toggleFlip", page.evaluate("!!(self.Gyro && typeof Gyro.getFlip==='function' && typeof Gyro.toggleFlip==='function')"))
    check("TouchDevice 触屏", page.evaluate("TouchDevice.touch === true"))

    # ---- 设置页 DOM（stub game，同 W5b 模式）----
    dom = page.evaluate(r"""() => {
      localStorage.removeItem('potato-settings');
      const g = { state: "menu", settings: {}, saveSettings() { this.saved = true; try { localStorage.setItem('potato-settings', JSON.stringify(this.settings)); } catch (e) {} },
        ui: { open(){}, close(){}, screen: null, chat: [],
              message(t, c) { this.chat.push({ text: t, color: c }); },
              touch: { on: () => true }, w: 844, h: 390 } };
      window.__g = g;
      window.__scr = new PotatoSettings(g, null, "touch");
      __scr.layout();
      const pairs = [...__scr.el.querySelectorAll('.st-row')].map(r => [
        r.querySelector('.t') ? r.querySelector('.t').textContent : '',
        r.querySelector('.v') ? r.querySelector('.v').textContent : '',
        (r.querySelector('button') ? r.querySelector('button').disabled : null)]);
      return { pairs };
    }""")
    gy = [x for x in dom["pairs"] if "陀螺仪" in x[0] and "反转" in x[0]]
    check("两行反转开关渲染", len(gy) == 2 and gy[0][1] == "关" and gy[1][1] == "关", dom["pairs"])
    check("反转行可点（非 disabled）", all(x[2] is False for x in gy), gy)

    # ---- 开关逻辑与持久化（DOM 点击路径）----
    click_flip = lambda idx: page.evaluate(f"""() => {{
      const r = [...__scr.el.querySelectorAll('.st-row')].find(r => {{
        const t = r.querySelector('.t'); return t && t.textContent.includes('{"左右" if idx == 1 else "上下"}反转'); }});
      r.querySelector('button').dispatchEvent(new MouseEvent('click', {{bubbles: true}}));
      __scr.relabel();
    }}""")
    page.evaluate("window.__flipGame = window.__g; Gyro.toggleFlip(__g, 0)")  # noop 探活
    check("stub 默认 flip=0", page.evaluate("Gyro.getFlip(__g)===0"))
    click_flip(1)
    check("点击左右反转 → flip=1", page.evaluate("Gyro.getFlip(__g)===1"))
    check("localStorage 持久化 gyroFlip=1",
          page.evaluate("JSON.parse(localStorage.getItem('potato-settings')||'{}').gyroFlip") == 1)
    lbl = page.evaluate("() => [...__scr.el.querySelectorAll('.st-row')].map(r=>[r.querySelector('.t')?.textContent||'', r.querySelector('.v')?.textContent||''])")
    check("行值显示「开」（relabel 同步）", any("陀螺仪左右反转" in a and b == "开" for a, b in lbl), lbl)
    click_flip(1)
    check("再次点击恢复 0", page.evaluate("Gyro.getFlip(__g)===0"))
    click_flip(2)
    check("上下反转 → flip=2", page.evaluate("Gyro.getFlip(__g)===2"))

    # 对局锁定：stub matchOn 后重建屏幕，行 disabled；toggle 被拒
    lock = page.evaluate(r"""() => {
      self.XZ = { match: { on: () => true } };
      __scr = new PotatoSettings(__g, null, "touch");
      __scr.layout();
      const row = [...__scr.el.querySelectorAll('.st-row')].find(r => {
        const t = r.querySelector('.t'); return t && t.textContent.includes('左右反转'); });
      const before = Gyro.getFlip(__g);
      Gyro.toggleFlip(__g, 1);
      const after = Gyro.getFlip(__g);
      return { before, after, dis: row.querySelector('button').disabled };
    }""")
    check("对局锁定：行 disabled + toggle 被拒", lock["before"] == lock["after"] and lock["dis"] is True, lock)
    page.evaluate("delete self.XZ")

    # ---- 帧级写入验证（stub play 态 game 直喂 frameTick）----
    page.evaluate("""() => {
      const g = { state: 'play', settings: { gyroMode: 2 }, saveSettings(){},
        ui: { screen: null, w: 844, h: 390 }, mode: 'normal',
        player: { yaw: 0, pitch: 0, health: 20, deathTime: 0, inv: { sel: 0 } } };
      window.__pg = g;
      Gyro._test.reset(); Gyro._test.clearPerm();
      Gyro._test.state.lastGame = g;
    }""")
    page.evaluate("() => {}")
    page.evaluate("""() => {
      __pg.player.yaw = 0; Gyro._test.reset();
      Gyro._test.pushDelta(-10, 0);
      Gyro._test.frameTick(__pg);
    }""")
    yaw_def = page.evaluate("__pg.player.yaw")
    check("默认：右转手机(dy=-10°) → yaw 朝右转方向", yaw_def < 0, f"yaw={yaw_def}")
    page.evaluate("""() => {
      __pg.player.yaw = 0; Gyro._test.reset();
      __pg.settings.gyroFlip = 1;
      Gyro._test.pushDelta(-10, 0);
      Gyro._test.frameTick(__pg);
    }""")
    yaw_flip = page.evaluate("__pg.player.yaw")
    check("左右反转：方向相反", yaw_flip > 0, f"yaw={yaw_flip}")
    page.evaluate("""() => {
      __pg.player.pitch = 0; Gyro._test.reset();
      Gyro._test.state.q = [1, 0, 0, 0]; // 恒等姿态：设备右缘指向世界 +Z → pitchSign=+1
      __pg.settings.gyroFlip = 0;
      Gyro._test.pushDelta(0, 5);
      Gyro._test.frameTick(__pg);
    }""")
    pitch_def = page.evaluate("__pg.player.pitch")
    page.evaluate("""() => {
      __pg.player.pitch = 0; Gyro._test.reset();
      Gyro._test.state.q = [1, 0, 0, 0];
      __pg.settings.gyroFlip = 2;
      Gyro._test.pushDelta(0, 5);
      Gyro._test.frameTick(__pg);
    }""")
    pitch_flip = page.evaluate("__pg.player.pitch")
    check("上下反转：pitch 符号相反", pitch_def != 0 and (pitch_def > 0) != (pitch_flip > 0), f"def={pitch_def} flip={pitch_flip}")
    page.evaluate("""() => {
      __pg.settings.gyroFlip = 1;
      Gyro.resetDefaults(__pg);
    }""")
    check("恢复默认复位 flip=0", page.evaluate("__pg.settings.gyroFlip === 0"))

    # ---- mock deviceorientation 端到端（事件流 → onOrient → frameTick）----
    page.evaluate("""() => {
      __pg.player.yaw = 0; __pg.player.pitch = 0;
      __pg.settings.gyroFlip = 0;
      __pg.settings.gyroMode = 2; // resetDefaults 已把档位写 1（未开镜），端到端需"总是开启"
      Gyro._test.reset();
      window.__fire = (a,b,c) => { const ev = new Event('deviceorientation'); ev.alpha=a; ev.beta=b; ev.gamma=c; window.dispatchEvent(ev); };
    }""")
    page.evaluate("""() => {
      for (let i = 0; i <= 6; i++) __fire(100, 60, i * 2 - 2);
      Gyro._test.frameTick(__pg);
    }""")
    yaw_evt = page.evaluate("__pg.player.yaw")
    check("mock deviceorientation 端到端写入 yaw", yaw_evt != 0, f"yaw={yaw_evt}")
    check("无新增 pageerror（收尾）", len(page_errors) == 0, "; ".join(page_errors[:3]))

    browser.close()

npass = sum(1 for r in R if r["ok"]); nfail = len(R) - npass
print(f"\nRESULT: {npass} pass, {nfail} fail")
sys.exit(1 if nfail else 0)
