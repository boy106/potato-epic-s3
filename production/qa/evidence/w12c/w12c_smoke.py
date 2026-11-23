#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# W12c 冒烟：小地图（底图/小窗/大图/扫描/脏区/性能）+ SFEEconomy + 刀皮数据槽位。
# 证据落盘 /workspace/production/qa/evidence/w12c/。
import json
import os
import time

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8861/index.html"
HERE = os.path.dirname(os.path.abspath(__file__))
EVID = HERE  # 脚本即位于 evidence/w12c/，证据就地落盘
os.makedirs(EVID, exist_ok=True)
FAKE_GL = open(os.path.normpath(os.path.join(HERE, "..", "..", "sfe", "fake_gl.js")), encoding="utf8").read()

page_errors = []
console_errors = []

INJECT = """async () => {
  for (const f of ['js/skins_data.js', 'js/sfe_economy.js', 'js/sfe_minimap.js']) {
    const txt = await (await fetch(f)).text();
    const s = document.createElement('script');
    s.textContent = txt + '\\n//# sourceURL=' + f;
    document.head.appendChild(s);
  }
  return { eco: typeof self.SFEEconomy !== 'undefined', mm: typeof self.SFE_MINIMAP !== 'undefined',
           meleeCatalog: !!self.SKIN_MELEE };
}"""

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path="/usr/bin/chromium",
        args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--no-sandbox"])
    page = browser.new_page(viewport={"width": 1280, "height": 720})
    page.add_init_script(FAKE_GL)
    page.on("pageerror", lambda e: page_errors.append(str(e)[:400]))
    page.on("console", lambda m: console_errors.append(m.text[:300]) if m.type == "error" else None)
    page.goto(BASE, wait_until="load", timeout=30000)
    page.wait_for_timeout(10000)

    inj = page.evaluate(INJECT)
    print("inject:", inj)

    # ---------------- 经济：纯逻辑（无登录环境，黑市走临时 stub，测后删除） ----------------
    eco = page.evaluate("""() => {
      const E = self.SFEEconomy, out = {};
      // onLoot 记账 + 凭证权重（rng 注入）
      const a = E.onLoot('settlement_elite', 'diamond', 2, () => 0);        // 命中凭证
      const b = E.onLoot('minor', 'iron_ingot', 3, () => 0);                // 非 T3/T4 层不给凭证
      const c = E.onLoot('deep_pit', 'sniper', 1, () => 0.999);             // 未命中
      const d = E.onLoot('mine_elite', 'diamond', 1, () => 0);              // T3 矿场
      out.loot = { a, b, c, d, ledgerN: E.state.ledger.length, lootCount: E.state.lootCount,
                   carried: E.state.vouchersCarried.length };
      // onExtract：撤出（凭证入仓可兑换） / 死亡（全损） / 不可变现
      const loadout = [
        { id: 'assault_rifle', n: 1 }, { id: 'knife_paint_voucher_t3', n: 1 },
        { id: 'knife_paint_voucher_t4', n: 1 }, { id: 'diamond', n: 3 },
      ];
      out.extractWin = E.onExtract(loadout, 'extract');
      out.extractWin.stashT3 = E.stashVoucherCount('knife_paint_voucher_t3');
      out.extractWin.stashT4 = E.stashVoucherCount('knife_paint_voucher_t4');
      out.extractDeath = E.onExtract(loadout, 'death');
      out.sellVoucherT3 = E.sellValue({ id: 'knife_paint_voucher_t3', n: 5 });
      out.valueOfThroughPoi = self.SFE_POI.valueOf('knife_paint_voucher_t3');
      // 兑换映射（GDD-10 §4.2）
      out.mapT3 = E.paintsForVoucher('knife_paint_voucher_t3');
      out.mapT4 = E.paintsForVoucher('knife_paint_voucher_t4');
      out.mapWrong = (() => { try { E.redeemVoucher('knife_paint_voucher_t3', 'knife_butterfly', 'fade'); return 'no-throw'; } catch (e) { return e.message; } })();
      // 黑市 300 币保底轨 + 兑换（临时 stub 商店，仅自测，用后恢复原状）
      const KNIVES = ['knife_combat', 'knife_butterfly'];
      const PAINTS = ['fade', 'damascus', 'nebula', 'potatogold', 'penguinice'];
      const v = { coins: 1000, kown: ['knife_butterfly'], kp: {}, kn: null, gate: 'off' };
      const stubShop = {
        v, rules: {
          KNIVES, PAINTS, PAINT_PRICE: 300, earn: (st, n) => (st.coins += n, n),
          knivesOwned: (st) => ['knife_combat'].concat(st.kown || []),
          paintsOwned: (st, k) => (st.kp && st.kp[k]) || [],
          buyPaint: (st, k, p) => { st.coins -= 300; (st.kp[k] = st.kp[k] || []).push(p); return { cost: 300 }; },
        },
        paint: async (k, p) => stubShop.rules.buyPaint(v, k, p),
      };
      self.XZ = self.XZ || {};
      out.origShopExisted = !!self.XZ.skins;
      out.origShopSaved = self.XZ.skins ? Object.keys(self.XZ.skins).length : 0;
      self.XZ.__w12c_orig = self.XZ.skins || null;
      self.XZ.skins = stubShop;
      out.buyCoinsBefore = v.coins;
      return out;
    }""")
    eco_buy = page.evaluate("""async () => {
      const E = self.SFEEconomy, v = self.XZ.skins.v, out = {};
      await E.marketBuy('knife_combat', 'potatogold');   // 黑市 300 币保底轨
      out.coinsAfterBuy = v.coins;
      out.kpCombat = v.kp.knife_combat;
      out.redeem1 = E.redeemVoucher('knife_paint_voucher_t3', 'knife_combat', 'penguinice');   // 三选一
      E._test.stashAddVoucher('knife_paint_voucher_t4', 1);   // 补货（测试用，模拟多局掉落）
      E._test.stashAddVoucher('knife_paint_voucher_t3', 1);
      out.redeem2 = E.redeemVoucher('knife_paint_voucher_t4', 'knife_combat', 'nebula');       // 二选一（K2 为匕首星云）
      out.redeemDup = E.redeemVoucher('knife_paint_voucher_t4', 'knife_butterfly', 'fade');    // 二选一（K5 折叠刀渐变）
      E._test.stashAddVoucher('knife_paint_voucher_t4', 1);   // 再补一张 t4：验证集齐折算 50 币
      out.redeemAll = (() => { try { return E.redeemVoucher('knife_paint_voucher_t4', 'knife_butterfly', 'fade'); } catch (e) { return { err: e.message, stashT4: E.stashVoucherCount('knife_paint_voucher_t4') }; } })();
      out.kpButterfly = v.kp.knife_butterfly;
      // 集齐折算 50 币：补齐 t3 映射最后一款（damascus 在折叠刀上）后兑换
      v.kp.knife_butterfly.push('damascus');
      E._test.stashAddVoucher('knife_paint_voucher_t3', 1);
      out.coinsBeforeConvert = v.coins;
      out.redeemT3All = E.redeemVoucher('knife_paint_voucher_t3', 'knife_combat', 'potatogold');
      out.coinsAfterConvert = v.coins;
      return out;
    }""")
    eco_stub_deleted = page.evaluate("""() => { self.XZ.skins = self.XZ.__w12c_orig || undefined; delete self.XZ.__w12c_orig; return { restored: !!self.XZ.skins, isOrig: self.XZ.skins !== undefined }; }""")
    print("eco:", json.dumps(eco, ensure_ascii=False)[:1500])
    print("eco_buy:", json.dumps(eco_buy, ensure_ascii=False))
    print("stub deleted:", eco_stub_deleted)

    # ---------------- 皮肤槽位与 tile 索引 ----------------
    skins = page.evaluate("""() => {
      const slots = Skins.slots();
      const melee = Skins.meleeSlot();
      const paints = [];
      for (const k of melee.knives) for (const p of k.paints) paints.push({ knife: k.key, paint: p.key, name: p.name, tile: p.tile, tileIndex: p.tileIndex, voucher: p.voucher, price: p.price });
      return { slotN: slots.length, kinds: slots.map(s => s.kind + ':' + s.key), meleeKey: melee.key, paintN: paints.length, paints,
               assetsTilesReady: !!self.ASSETS && !!ASSETS.tiles };
    }""")
    print("skins:", json.dumps(skins, ensure_ascii=False))

    # ---------------- 进对局（小地图活体） ----------------
    page.evaluate("""() => {
      const g = window.game;
      if (g.state === 'play' || g.state === 'loading') g.startTitle();
      g.ui.open(new self.LobbyScreen(g));
    }""")
    page.wait_for_timeout(2000)
    page.evaluate("() => { document.querySelector('[data-a=\"sfe\"]').click(); }")
    page.wait_for_timeout(1000)
    page.evaluate("() => { document.getElementById('sfe-bare').click(); }")
    for _ in range(16):
        page.wait_for_timeout(2500)
        st = page.evaluate("() => window.game ? window.game.state : null")
        if st == "play":
            break
    live = page.evaluate("""() => {
      const g = window.game, R = self.SFE_RULES, MM = self.SFE_MINIMAP;
      return { state: g.state, sfe: !!(g.worldMeta && g.worldMeta.sfe), matchId: g.worldMeta && g.worldMeta.id,
               mmOn: MM.on(g), baseStarted: !!MM.state.base, cursor: MM.state.base ? MM.state.base.cursor : null,
               phase: R.match.phase, t: Math.round(R.match.t) };
    }""")
    print("live:", live)

    # 等底图渲染完成（2025 chunk / 4 per frame；headless 帧率低，放宽到 45s）
    base_done = None
    for _ in range(30):
        page.wait_for_timeout(1500)
        base_done = page.evaluate("""() => {
          const MM = self.SFE_MINIMAP, b = MM.state.base;
          return { cursor: b ? b.cursor : null, done: b ? b.done : null,
                   doneAt: b && b.done ? Math.round(b.doneAt) : null, matchT: self.SFE_RULES.match ? Math.round(self.SFE_RULES.match.t) : null };
        }""")
        if base_done.get("done"):
            break
    print("base:", base_done)
    page.screenshot(path=os.path.join(EVID, "w12c_deploy_minimap.png"))

    # 小窗内容断言：底图像素非全透明（地形读数）+ 撤离点标记层
    win = page.evaluate("""() => {
      const g = window.game, MM = self.SFE_MINIMAP, b = MM.state.base;
      const d = b.ctx.getImageData(0, 0, 360, 360).data;
      let opaque = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i] === 255) opaque++;
      return { opaquePx: opaque, totalPx: 360 * 360, stats: MM.stats() };
    }""")
    print("win:", win)

    # 情报扫描（方案 B）：注入临时假 AI（≤48 格）→ 手动扫描 → 快照；冷却 45s；二次扫描被拒
    scan = page.evaluate("""() => {
      const g = window.game, R = self.SFE_RULES, MM = self.SFE_MINIMAP, p = g.player;
      const fakes = [];
      for (let i = 0; i < 3; i++) {
        const e = { pos: [p.pos[0] + 10 + i * 3, p.pos[1], p.pos[2] + 8 + i], health: 1, dead: false, sfe: true };
        R.state.ai.push(e); fakes.push(e);
      }
      const farFake = { pos: [p.pos[0] + 120, p.pos[1], p.pos[2] + 120], health: 1, dead: false };
      R.state.ai.push(farFake); fakes.push(farFake);
      const r1 = MM.doScan(g, R.match, false);
      const snap1 = MM.state.scan.snapPts.slice();
      const cd = MM.state.scan.cd;
      const r2 = MM.doScan(g, R.match, false);   // 冷却期应被拒
      // 枪声脉冲（被动）
      MM.reportShot(p.pos[0] + 30, p.pos[2] + 18);
      const shotsN = MM.state.shots.length;
      for (const f of fakes) { f.dead = true; }
      R.state.ai = R.state.ai.filter(e => !fakes.includes(e));
      return { r1, snap1, cd, r2Accepted: r2, shotsN, freeScanUsed: MM.state.scan.free };
    }""")
    print("scan:", scan)
    page.screenshot(path=os.path.join(EVID, "w12c_scan_pulse.png"))

    # 按住大图：0.5× 默认档 → 截图；1× 档 → 截图；期间移动/开火不受阻塞（输入路径不拦截）
    page.evaluate("() => { self.SFE_RULES.state.mapHold = true; }")
    page.wait_for_timeout(1200)
    big05 = page.evaluate("""() => {
      const g = window.game, MM = self.SFE_MINIMAP;
      const t0 = performance.now();
      g.ui.drawHUD();
      const ms = Math.round((performance.now() - t0) * 1000) / 1000;
      return { zoom: MM.TUNE.bigScale[MM.state.zoomIdx], hudMs: ms };
    }""")
    page.screenshot(path=os.path.join(EVID, "w12c_bigmap_05x.png"))
    page.evaluate("() => { self.SFE_MINIMAP.state.zoomIdx = 1; }")
    page.wait_for_timeout(800)
    big1x = page.evaluate("""() => {
      const g = window.game, MM = self.SFE_MINIMAP;
      const t0 = performance.now();
      g.ui.drawHUD();
      const ms = Math.round((performance.now() - t0) * 1000) / 1000;
      return { zoom: MM.TUNE.bigScale[MM.state.zoomIdx], hudMs: ms };
    }""")
    page.screenshot(path=os.path.join(EVID, "w12c_bigmap_1x.png"))
    page.evaluate("() => { self.SFE_RULES.state.mapHold = false; self.SFE_MINIMAP.state.zoomIdx = 0; }")

    # 脏区（验收 09-3）：放/挖方块 → 底图对应像素 ≤2s 反映（两个互不干扰的坐标）
    dirty = page.evaluate("""() => new Promise((res) => {
      const g = window.game, MM = self.SFE_MINIMAP, b = MM.state.base, w = g.world;
      const p = g.player;
      const even = (v) => { let b = Math.floor(v) + 2; return b - (b & 1); };  // 底图像素采样偶数坐标方块
      const putAt = [even(p.pos[0]), even(p.pos[2])];
      const digAt = [even(p.pos[0]) + 4, even(p.pos[2])];
      const pix = (xz) => [Math.floor(xz[0] / 2), Math.floor(xz[1] / 2)];
      const [ppx, ppz] = pix(putAt), [dpx, dpz] = pix(digAt);
      const rd = (px, pz) => Array.from(b.ctx.getImageData(px, pz, 1, 1).data);
      const putBefore = rd(ppx, ppz), digBefore = rd(dpx, dpz);
      const yPut = w.surfaceY(putAt[0], putAt[1], true);
      const yDig = w.surfaceY(digAt[0], digAt[1], true);
      w.setBlock(putAt[0], yPut + 1, putAt[1], BID.stone, 0, 1);   // 放：石头
      w.setBlock(digAt[0], yDig, digAt[1], 0, 0, 1);                    // 挖：露 dirt
      const marked = MM.state.dirty.size;
      setTimeout(() => {
        const afterPut = rd(ppx, ppz), afterDig = rd(dpx, dpz);
        res({ putBefore, afterPut, changedPut: JSON.stringify(putBefore) !== JSON.stringify(afterPut),
              digBefore, afterDig, changedDig: JSON.stringify(digBefore) !== JSON.stringify(afterDig),
              dirtyMarked: marked });
      }, 1300);
    })""")
    print("dirty:", dirty)

    # 开关（验收 09-1 设置可关）
    toggle = page.evaluate("""() => {
      const g = window.game, MM = self.SFE_MINIMAP;
      MM.setEnabled(g, false);
      const off = MM.on(g);
      MM.setEnabled(g, true);
      const on = MM.on(g);
      return { off, on };
    }""")
    print("toggle:", toggle)

    # 稳态性能（底图渲染完成后重置打点，纯小窗态采样 3s）
    page.wait_for_timeout(500)
    perf = page.evaluate("""() => new Promise((res) => {
      const MM = self.SFE_MINIMAP;
      MM._test.resetStats();
      setTimeout(() => {
        const s = MM.stats();
        res({ n: s.n, lastMs: Math.round(s.last * 1000) / 1000, maxMs: Math.round(s.max * 1000) / 1000,
              avgMs: s.n ? Math.round((s.sum / s.n) * 1000) / 1000 : null });
      }, 3000);
    })""")
    print("perf:", perf)

    # 撤离 → 结算 → 释放断言
    page.evaluate("""() => {
      const g = window.game, R = self.SFE_RULES, plan = R.state.plan, T = self.SFE_MAP.TUNE;
      R.match.t = T.extractOpenT + 0.2;
      const a = plan.extractAlways.find(x => x.done) || plan.extractAlways[0];
      const p = g.player;
      p.pos = [a.x + 0.5, a.y + 2, a.z + 0.5];
      p.prev = [...p.pos];
    }""")
    released = None
    for _ in range(12):
        page.wait_for_timeout(1500)
        released = page.evaluate("""() => {
          const MM = self.SFE_MINIMAP, g = window.game, R = self.SFE_RULES;
          return { settle: !!(R.match && R.match.settle), baseReleased: !MM.state.base, domGone: !document.getElementById('sfe-scan') };
        }""")
        if released.get("settle") and released.get("baseReleased"):
            break
    print("release:", released)
    page.screenshot(path=os.path.join(EVID, "w12c_settle.png"))

    result = {
        "inject": inj, "eco": eco, "eco_buy": eco_buy, "eco_stub_deleted": eco_stub_deleted,
        "skins": skins, "live": live, "base": base_done, "win": win, "scan": scan,
        "big05": big05, "big1x": big1x, "dirty": dirty, "toggle": toggle,
        "perf": perf, "release": released,
        "pageErrors": page_errors, "consoleErrors": console_errors[:20],
    }
    with open(os.path.join(EVID, "w12c_smoke_result.json"), "w", encoding="utf8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    browser.close()
print("DONE")
