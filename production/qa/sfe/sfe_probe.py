#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# W10c SFE 浏览器探针：pageerror=0 / 大厅 06 号卡渲染 / 模式入口可达 / worldgen worker 探针
# 用法：python3 production/qa/sfe/sfe_probe.py [BASE_URL]  （默认 http://127.0.0.1:8834/index.html）
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8834/index.html"
EVID = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "evidence"))
os.makedirs(EVID, exist_ok=True)

page_errors, console_errors = [], []
with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/usr/bin/chromium",
        args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
    )
    page = browser.new_page(viewport={"width": 1280, "height": 720})
    # 沙箱无 WebGL2（smoke 既知环境限制）。注入最小假 gl 上下文（Proxy），
    # 让启动链走到大厅 DOM；渲染帧错误会被 game frame() 的 try/catch 吞掉。
    page.add_init_script("""
      (() => {
        const REAL_GET = HTMLCanvasElement.prototype.getContext;
        const glHandler = {
          get(target, prop) {
            if (typeof prop === 'string' && /^[A-Z_0-9]+$/.test(prop)) return 1; // 常量
            if (prop === 'canvas') return target.__canvas;
            return target[prop] !== undefined ? target[prop] : target.__noop;
          },
          set(target, prop, v) { target[prop] = v; return true; },
        };
        const makeGL = (canvas) => {
          const noop = (() => {
            const f = function () { return undefined; };
            return new Proxy(f, {
              apply(t, self, args) {
                const name = f.__name || '';
                if (/Parameter$/.test(name)) return true;         // getShaderParameter / getProgramParameter
                if (/InfoLog$/.test(name)) return '';
                if (name === 'getSupportedExtensions') return [];
                if (name === 'getExtension' || name === 'getActiveUniform' || name === 'getActiveAttrib') return null;
                if (name === 'getError') return 0;
                if (/^(create|gen)/.test(name)) return {};
                return {};
              },
            });
          });
          const mk = (name) => { const f = noop(); f.__name = name; return f; };
          const t = { __canvas: canvas };
          return new Proxy(t, {
            get(target, prop) {
              if (typeof prop === 'string' && /^[A-Z_][A-Z_0-9]*$/.test(prop)) return 1;
              if (prop === 'canvas') return canvas;
              if (prop === 'getShaderPrecisionFormat') return () => ({ rangeMin: 127, rangeMax: 127, precision: 23 });
              if (prop === 'getActiveUniform' || prop === 'getActiveAttrib') return () => ({ name: 'u_mock', type: 5126, size: 1 });
              if (prop === 'getShaderParameter' || prop === 'getProgramParameter' || prop === 'getSyncParameter') return () => true;
              if (prop === 'getShaderInfoLog' || prop === 'getProgramInfoLog') return () => '';
              if (prop === 'getSupportedExtensions') return () => [];
              if (prop === 'getExtension') return () => null;
              if (prop === 'getError') return () => 0;
              if (prop === 'getAttribLocation' || prop === 'getUniformLocation') return () => ({});
              if (/^(create|gen)/.test(prop)) return () => ({});
              if (prop === 'getProgram' || prop === 'getShader') return () => ({});
              if (typeof prop === 'string') {
                if (!target['__f_' + prop]) { const f = function(){ return undefined; }; target['__f_' + prop] = f; }
                return target['__f_' + prop];
              }
              return undefined;
            },
            set(target, prop, v) { target[prop] = v; return true; },
          });
        };
        HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
          if (type === 'webgl2' || type === 'webgl') {
            this.__fakeGL = this.__fakeGL || makeGL(this);
            return this.__fakeGL;
          }
          return REAL_GET.call(this, type, ...rest);
        };
      })();
    """)
    page.on("pageerror", lambda e: page_errors.append(str(e)[:300]))
    page.on("console", lambda m: console_errors.append({"type": m.type, "text": m.text[:300]}) if m.type == "error" else None)
    page.goto(BASE, wait_until="load", timeout=30000)
    page.wait_for_timeout(12000)  # boot + 大厅

    dom = page.evaluate("""() => {
      const g = id => document.getElementById(id);
      const q = s => document.querySelector(s);
      const sfeCard = q('[data-a="sfe"]');
      const lobby = g('lobby');
      const r = el => el ? el.getBoundingClientRect() : null;
      return {
        gameState: window.game ? window.game.state : null,
        dataA: [...document.querySelectorAll('[data-a]')].map(e => e.getAttribute('data-a')).slice(0, 40),
        lobbyLen: (document.getElementById('lobby') || { innerHTML: '' }).innerHTML.length,
        hasWebGL2: (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch (e) { return false; } })(),
        lobbyVisible: !!(lobby && getComputedStyle(lobby).display !== 'none'),
        sfeCardExists: !!sfeCard,
        sfeCardText: sfeCard ? sfeCard.textContent.replace(/\\s+/g, ' ').slice(0, 80) : null,
        sfeCardColor: sfeCard ? (sfeCard.querySelector('i') ? sfeCard.querySelector('i').style.background : sfeCard.style.getPropertyValue('--c')) : null,
        sfeGlobals: ['SFE_MAP','SFE_POI','SFE_WORLD','SFE_RULES'].filter(k => k in window),
        sfeTuneSize: window.SFE_MAP && window.SFE_MAP.TUNE ? window.SFE_MAP.TUNE.mapSize : null,
        wgSfe: window.WG_DATA && window.WG_DATA.noise_settings ? !!window.WG_DATA.noise_settings.sfe : null,
      };
    }""")
    page.screenshot(path=os.path.join(EVID, "sfe_lobby.png"))

    # 绕过首启分流（协议/玩家类型/教学），直接渲染大厅
    page.evaluate("""() => {
      const g = window.game;
      if (!g) return;
      if (g.state === 'play' || g.state === 'loading') g.startTitle();
      g.ui.open(new self.LobbyScreen(g));
    }""")
    page.wait_for_timeout(2500)
    dom2 = page.evaluate("""() => {
      const card = document.querySelector('[data-a="sfe"]');
      return {
        gameState: window.game ? window.game.state : null,
        sfeCardExists: !!card,
        sfeCardText: card ? card.textContent.replace(/\\s+/g, ' ').slice(0, 80) : null,
        sfeCardColor: card ? (card.style.getPropertyValue('--c') || null) : null,
      };
    }""")
    dom.update(dom2)
    page.screenshot(path=os.path.join(EVID, "sfe_lobby.png"))

    # 入口可达：点击 06 号卡 → 出击准备页
    entry = None
    if dom.get("sfeCardExists"):
        page.click('[data-a="sfe"]')
        page.wait_for_timeout(1200)
        entry = page.evaluate("""() => ({
          sfeRootLen: (document.getElementById('sfe-root')||document.querySelector('.sfe-root')||{innerHTML:''}).innerHTML.length,
          rootTag: document.querySelector('.sfe-root') ? document.querySelector('.sfe-root').tagName : null,
          prepVisible: !!document.querySelector('.sfe-root .sfe-card'),
          prepTitle: (document.querySelector('.sfe-root .sfe-card h2') || {}).textContent || null,
          bareBtn: !!document.getElementById('sfe-bare'),
          goBtn: !!document.getElementById('sfe-go'),
          cancelBtn: !!document.getElementById('sfe-cancel'),
        })""")
        page.screenshot(path=os.path.join(EVID, "sfe_prep.png"))
        # 阶段 2：空手出击 → 世界工厂链路（假 gl 环境，能到 loading/play 即算通）
        page.evaluate("() => { const b = document.getElementById('sfe-bare'); b && b.click(); }")
        phase2 = {"state_samples": []}
        import time as _t
        for _ in range(10):
            page.wait_for_timeout(2500)
            st = page.evaluate("""() => ({
              state: window.game ? window.game.state : null,
              sfe: window.game && window.game.worldMeta ? !!window.game.worldMeta.sfe : null,
              seed: window.game && window.game.worldMeta ? window.game.worldMeta.seed : null,
              gen: window.game && window.game.worldMeta ? window.game.worldMeta.gen : null,
              chunks: window.game && window.game.world ? window.game.world.chunks.size : null,
              genPoolDim: window.SFE_GEN || null,
              errVisible: (document.getElementById('err')||{style:{}}).style ? (document.getElementById('err').style.display === 'block' || false) : null,
            })""")
            phase2["state_samples"].append(st)
            if st.get("state") == "play" or st.get("errVisible"):
                break
        page.screenshot(path=os.path.join(EVID, "sfe_deploy.png"))
        result_extra = phase2

    result = {
        "base": BASE,
        "dom": dom,
        "entry": entry,
        "phase2": phase2,
        "pageErrors": page_errors,
        "consoleErrors": console_errors[:20],
        "verdict": {
            "pageerror_zero": len(page_errors) == 0,
            "sfe_card": bool(dom.get("sfeCardExists")),
            "entry_reachable": bool(entry and entry.get("prepVisible")),
            "sfe_modules_loaded": len(dom.get("sfeGlobals") or []) == 4,
        },
    }
    with open(os.path.join(EVID, "sfe_probe.json"), "w", encoding="utf8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    browser.close()
