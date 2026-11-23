#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# W10c SFE 活体验证阶段 3：POI 落位 / 容器 / 撤离读条 / 结算 / 仓库 / 不落盘守卫
# 前置：8834 服务 dist；假 gl 注入与探针同款。
import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8834/index.html"
EVID = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "evidence"))
os.makedirs(EVID, exist_ok=True)

FAKE_GL = open(os.path.join(os.path.dirname(__file__), "fake_gl.js"), encoding="utf8").read()
page_errors = []
with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/usr/bin/chromium",
        args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"],
    )
    page = browser.new_page(viewport={"width": 1280, "height": 720})
    page.add_init_script(FAKE_GL)
    page.on("pageerror", lambda e: page_errors.append(str(e)[:300]))
    page.goto(BASE, wait_until="load", timeout=30000)
    page.wait_for_timeout(10000)
    # 进大厅 → 06 卡 → 空手出击
    page.evaluate("""() => {
      const g = window.game;
      if (g.state === 'play' || g.state === 'loading') g.startTitle();
      g.ui.open(new self.LobbyScreen(g));
    }""")
    page.wait_for_timeout(2000)
    page.evaluate("() => { document.querySelector('[data-a=\"sfe\"]').click(); }")
    page.wait_for_timeout(1000)
    page.evaluate("() => { document.getElementById('sfe-bare').click(); }")
    for _ in range(12):
        page.wait_for_timeout(2500)
        st = page.evaluate("() => window.game ? window.game.state : null")
        if st == "play":
            break
    live = page.evaluate("""() => {
      const g = window.game, R = self.SFE_RULES, m = R && R.match;
      const plan = R && R.state && R.state.plan;
      return {
        state: g.state,
        sfeWorld: !!(g.worldMeta && g.worldMeta.sfe),
        phase: m ? m.phase : null, t: m ? Math.round(m.t * 10) / 10 : null,
        mainPick: m ? m.mainPick : null,
        mainPOIs: plan ? plan.main.length : null, minorPOIs: plan ? plan.minor.length : null,
        placedDone: plan ? plan.main.filter(a => a.done).length : null,
        placedFailed: plan ? plan.main.filter(a => a.failed).length : null,
        extractAlways: plan ? plan.extractAlways.length : null,
        lairs: plan ? plan.lairs.length : null,
        blockEnts: g.blockEntities ? g.blockEntities.size : null,
        playerPos: g.player ? g.player.pos.map(v => Math.round(v)) : null,
        aiCount: R && R.state && R.state.ai ? R.state.ai.length : null,
        lsKeys: Object.keys(localStorage),
      };
    }""")
    page.screenshot(path=os.path.join(EVID, "sfe_live_deploy.png"))

    # 快进到常开撤离窗（T+4:00），再传送 → 站定读条 5s → 撤离成功结算
    tp = page.evaluate("""() => {
      const g = window.game, R = self.SFE_RULES, plan = R.state.plan, T = self.SFE_MAP.TUNE;
      R.match.t = T.extractOpenT + 0.2; // 快进：下一 tick 进入 EXTRACT_OPEN（T+4 前常开点不可用 = 验收 6）
      const a = plan.extractAlways.find(x => x.done) || plan.extractAlways[0];
      const p = g.player;
      p.pos = [a.x + 0.5, a.y + 2, a.z + 0.5];
      p.prev = [...p.pos];
      return { tp: [a.x, a.y, a.z], name: a.name, phase: R.match.phase, t: Math.round(R.match.t) };
    }""")
    # 站定等待读条完成（5s + 余量）
    for _ in range(10):
        page.wait_for_timeout(1500)
        s2 = page.evaluate("""() => {
          const g = window.game, R = self.SFE_RULES, m = R.match;
          const plan = R.state && R.state.plan;
          return { phase: m ? m.phase : null, read: m ? Math.round(m.read * 100) / 100 : null,
                   settle: m && m.settle ? { win: m.settle.win, title: m.settle.title, coins: m.settle.coins, gainN: (m.settle.gain||[]).length } : null,
                   placedDone: plan ? plan.extractAlways.filter(a => a.done).length : null,
                   blockEnts: g.blockEntities ? g.blockEntities.size : null,
                   worldGone: !g.worldMeta || !g.worldMeta.sfe || !!g.worldMeta.sfeDone,
                   overlay: !!document.querySelector('.sfe-root .sfe-card') };
        }""")
        if s2.get("settle") or s2.get("overlay"):
            break
    page.screenshot(path=os.path.join(EVID, "sfe_live_settle.png"))
    # 点"回大厅" → SFE_WORLD.end 置 sfeDone + DB.deleteWorld（局终即弃，方案 §2.5）
    afterExit = page.evaluate("""() => new Promise((res) => {
      const g = window.game, R = self.SFE_RULES;
      const btn = document.querySelector('#sfe-lobby');
      if (!btn) { res({ clicked: false }); return; }
      btn.click();
      setTimeout(() => res({ clicked: true, worldGone: !g.worldMeta || !g.worldMeta.sfe || !!g.worldMeta.sfeDone,
                             planCleared: !(R.state && R.state.plan), matchCleared: !R.state.match }), 1200);
    })""")
    final_ls = page.evaluate("() => Object.keys(localStorage)")
    result = {"teleport": tp, "afterRead": s2, "afterExit": afterExit, "lsAfter": final_ls, "live": live, "pageErrors": page_errors}
    with open(os.path.join(EVID, "sfe_live_result.json"), "w", encoding="utf8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    browser.close()
