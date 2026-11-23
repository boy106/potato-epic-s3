"use strict";
// W12c 搜打撤（SFE）小地图 + 情报扫描 —— GDD-09（09-sfe-minimap-spec.md）实现。
// 职责：① 720²→360² 底图 DEPLOY 段分帧预渲染（对局内复用、跨局不缓存、≤2MB）；
//       ② 右上角 64² 常驻小窗（1px=1 方块，地形/POI/撤离点三态/自身朝向箭头）；
//       ③ 按住大图增强（0.5× 全览 / 1× 1px=1 方块可拖动，覆盖 sfe_rules 简版全图）；
//       ④ 威胁信息方案 B：主动扫描（45s 冷却 / 48 格 / 快照脉冲 5s）+ 被动枪声脉冲 2s；
//       ⑤ 挖/放方块 chunk 级脏区 ≤2 块/帧局部重绘（≤2s 可见）。
// 边界（GDD-09 §6）：不复用沙盒 Minimap（POTATO 禁用）、不做路标、不旋转地图；
// 开关独立 settings.sfe_minimap（默认开）；全部新增数值集中于下方 TUNE 块（验收 §7.7）。
const SFE_MINIMAP = (() => {
  const M = self.SFE_MAP;
  const T = M.TUNE;

  // ================================================================ 调参常量块（GDD-09 §2/§3/§4/§5 全部新增数值）
  const TUNE = {
    // 底图（§3.1/§3.3）
    basemapRes: 360,           // 720² / 2，每 2×2 方块采样 1 像素
    blocksPerPx: 2,
    chunkPx: 8,                // 每 chunk（16 方块）在底图上的像素边长
    chunksPerFrame: 4,         // 分帧渲染每帧 chunk 数（4×2025 ≈ 506 帧 ≈ 8~17s）
    renderBudgetMs: 4,         // 分帧渲染每帧预算（仅 DEPLOY 段）
    // 小窗（§2.1）
    winSize: 64,               // CSS px
    winSizeLow: 48,            // 低端机降档
    winMargin: 4,
    // 地形配色分带（sampler 侧近似 surface_rule；海平面 62 与 util.js 一致）
    seaLevel: 62,
    landSandMax: 65,           // 海滩砂带
    landStoneMin: 88,
    landSnowMin: 97,
    // 大图（§2.2）
    bigScale: [0.5, 1],        // 两档：0.5× 全览 / 1× 1px=1 方块
    bigViewRatio: 0.66,
    // 情报扫描方案 B（§4.2）
    scanRadius: 48,            // 方块
    scanAnimSec: 1,            // 扫描扩散环动画
    snapshotSec: 5,            // 快照脉冲时长（低端 4）
    snapshotSecLow: 4,
    scanCd: 45,                // 冷却
    freeScanAt: 2,             // DEPLOY 段免费教学扫描时刻（对局秒）
    shotPulseSec: 2,           // 枪声声源脉冲
    shotPulseMax: 8,           // 同屏枪声环上限
    // 脏区（§3.2）
    dirtyPerFrame: 2,          // 每帧最多重绘 2 个脏 chunk
    // 绘制（§5）
    colMain: "#F5A623", colMinor: "#7f8aa0",
    colExtractOpen: "#19C79A", colExtractClosed: "#4a5568", colExtractMain: "#FFD24A",
    colSelf: "#FFFFFF", colThreat: "#FF5050",
    scanKey: "KeyN",           // SFE 对局内 N 键优先（路标不进 SFE）
  };
  // 枪声事件名匹配（xzguns 开火 fire_/dry_fire + 弩/射手类 shoot）
  const SHOT_RE = /^(xzguns:)?(fire_|dry_fire)/;

  // ================================================================ 运行时状态
  const st = {
    matchId: null,
    base: null,           // {cv, ctx, img, cursor, doneAt, sampler, done, startT}
    dirty: new Set(),     // "cx,cz"
    scan: { cd: 0, animAt: -1, snapAt: -1, snapPts: [], free: false },
    shots: [],            // {x, z, at(对局秒)}
    zoomIdx: 0, panX: 0, panY: 0,
    dom: null, lastDomAt: 0, lastDomCd: -1,
    lastNow: 0, lastGame: null,
    ptr: null, prevHold: false,
    stats: { n: 0, last: 0, max: 0, sum: 0 },  // 小窗态绘制耗时打点（ms）
  };

  const lowTier = () => {
    try { return self.SFE_WORLD && SFE_WORLD.state.preset === "low"; } catch (e) { return false; }
  };
  const snapshotSec = () => (lowTier() ? TUNE.snapshotSecLow : TUNE.snapshotSec);
  const winSize = () => (lowTier() ? TUNE.winSizeLow : TUNE.winSize);
  const clampV = (v, a, b) => Math.max(a, Math.min(b, v));

  // ================================================================ 底图（§3：heightAt 采样 + MAP_PAL 调色，分帧推进）
  function makeSampler() {
    const seed = self.SFE_POI.seedNum();
    const palette = { air: 0 };
    for (const k in BID) palette[k] = BID[k];
    const gen = new WG.Generator(BigInt(seed), self.WG_DATA, palette, "sfe");
    return (x, z) => gen.baseHeight(x, z, false);
  }

  function ensureBase(g) {
    if (st.base) return st.base;
    const cv = document.createElement("canvas");
    cv.width = cv.height = TUNE.basemapRes;
    const ctx = cv.getContext("2d");
    st.base = {
      cv, ctx, img: ctx.createImageData(TUNE.basemapRes, TUNE.basemapRes),
      cursor: 0, done: false, doneAt: -1, startT: performance.now(), sampler: makeSampler(),
    };
    return st.base;
  }

  // sampler 高度 → 伪地表块 + 明暗档（对照 F1：MAP_PAL[4*f+g]，g: 0 暗 / 1 常 / 2 亮）
  // 调色兜底：本构建 ENTITY_DATA.extra 为空 → MAP_PAL/mapcolors 退化（F1 同样受影响），
  // 按 BLOCKS key 走内建色表保证地形可读；线上若 mappalette 有数据则自动优先 MAP_PAL（规格路径）。
  const BUILTIN_COLORS = {
    grass_block: [125, 160, 88], dirt: [134, 96, 67], stone: [125, 125, 125],
    smooth_stone: [130, 130, 130], sand: [219, 207, 163], gravel: [136, 126, 126],
    snow_block: [240, 246, 246], water: [60, 90, 160], sandstone: [216, 203, 155],
  };
  const shadeMul = [0.82, 1, 1.12];
  function builtinColor(blockId, shade) {
    try {
      const k = BLOCKS[blockId] && BLOCKS[blockId].key;
      const c = k && BUILTIN_COLORS[k];
      if (!c) return null;
      const m = shadeMul[shade] ?? 1;
      return [Math.min(255, Math.round(c[0] * m)), Math.min(255, Math.round(c[1] * m)), Math.min(255, Math.round(c[2] * m)), 255];
    } catch (e) { return null; }
  }
  function palColor(blockId, shade) {
    try {
      const f = mapColorOf(blockId, 0);
      const c = MAP_PAL[4 * f + shade];
      if (c && (c[3] || c[0] || c[1] || c[2])) return c;
    } catch (e) {}
    return builtinColor(blockId, shade) || [110, 140, 90, 255];
  }
  function colorFor(h, dw) {
    if (h <= TUNE.seaLevel) return palColor(BID.water ?? 7, 1);
    const id = h >= TUNE.landSnowMin ? (BID.snow_block ?? BID.stone ?? 1)
      : h >= TUNE.landStoneMin ? (BID.stone ?? 1)
      : h <= TUNE.landSandMax ? (BID.sand ?? 1)
      : (BID.grass_block ?? 1);
    return palColor(id, dw > 0 ? 2 : dw < 0 ? 0 : 1);
  }

  function stepRender() {
    const b = st.base;
    if (!b || b.done) return;
    const t0 = performance.now();
    const span = T.chunkSpan, W = TUNE.basemapRes, d = b.img.data;
    let done = 0;
    while (done < TUNE.chunksPerFrame && b.cursor < span * span && performance.now() - t0 < TUNE.renderBudgetMs) {
      const cx = b.cursor % span, cz = (b.cursor / span) | 0;
      const px0 = cx * TUNE.chunkPx, pz0 = cz * TUNE.chunkPx;
      for (let j = 0; j < TUNE.chunkPx; j++) {
        let prevH = 0;
        for (let i = 0; i < TUNE.chunkPx; i++) {
          const x = (px0 + i) * TUNE.blocksPerPx, z = (pz0 + j) * TUNE.blocksPerPx;
          const h = b.sampler(x, z);
          const c = colorFor(h, i === 0 ? 0 : h - prevH);
          const o = 4 * ((pz0 + j) * W + (px0 + i));
          d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = c[3] ?? 255;
          prevH = h;
        }
      }
      b.ctx.putImageData(b.img, 0, 0, px0, pz0, TUNE.chunkPx, TUNE.chunkPx);
      b.cursor++; done++;
    }
    if (b.cursor >= span * span) {
      b.done = true;
      b.doneAt = performance.now() - b.startT;
      b.sampler = null;   // 渲染完成即弃采样器（bhCache 释放）
      b.img = null;       // ImageData 释放（脏区走 getImageData 路径）
    }
  }

  // ---- 脏区（§3.2：chunk 为脏粒度，≤2 块/帧，真实地表块覆盖） ----
  function markDirty(x, z) {
    const span = T.chunkSpan;
    const cx = Math.floor(x / 16), cz = Math.floor(z / 16);
    if (cx >= 0 && cz >= 0 && cx < span && cz < span) st.dirty.add(cx + "," + cz);
  }
  function refreshDirty(g) {
    const b = st.base, w = g.world;
    if (!b || !w || !st.dirty.size) return;
    let n = 0;
    for (const key of [...st.dirty]) {
      if (n >= TUNE.dirtyPerFrame) break;
      st.dirty.delete(key);
      const parts = key.split(",");
      const cx = +parts[0], cz = +parts[1];
      if (!w.isLoaded(cx * 16, cz * 16)) continue;
      const px0 = cx * TUNE.chunkPx, pz0 = cz * TUNE.chunkPx;
      let img;
      try { img = b.ctx.getImageData(px0, pz0, TUNE.chunkPx, TUNE.chunkPx); } catch (e) { continue; }
      const d = img.data;
      for (let j = 0; j < TUNE.chunkPx; j++)
        for (let i = 0; i < TUNE.chunkPx; i++) {
          const x = (px0 + i) * TUNE.blocksPerPx, z = (pz0 + j) * TUNE.blocksPerPx;
          let u = 0, o = 4 * (j * TUNE.chunkPx + i);
          try { u = w.surfaceY(x, z, true); } catch (e) { continue; }
          if (u == null || u <= TUNE.seaLevel) {
            const c = palColor(BID.water ?? 7, 1);
            d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
            continue;
          }
          let mid = 0;
          try { mid = w.getBlock(x, u, z); } catch (e) {}
          const c = palColor(mid, 1);
          d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
        }
      b.ctx.putImageData(img, px0, pz0);
      n++;
    }
  }

  // ================================================================ 情报扫描方案 B（§4.2）
  function doScan(g, m, free) {
    if (!free && st.scan.cd > 0) return !1;
    const p = g.player;
    if (!p) return !1;
    const R = self.SFE_RULES;
    const pts = [];
    for (const e of (R && R.state.ai) || []) {
      try {
        if (!e || e.dead) continue;
        if (Math.hypot(e.pos[0] - p.pos[0], e.pos[2] - p.pos[2]) <= TUNE.scanRadius)
          pts.push([Math.round(e.pos[0]), Math.round(e.pos[2])]);
      } catch (x) {}
    }
    if (pts.length > 24) pts.length = 24;   // 脉冲点硬上限（§5）
    st.scan.snapPts = pts;
    st.scan.snapAt = m.t;
    st.scan.animAt = m.t;
    if (!free) st.scan.cd = TUNE.scanCd;
    g.ui && g.ui.message("扫描完成：" + pts.length + " 个信号（情报 " + snapshotSec() + " 秒内有效）", "#FFD24A");
    return !0;
  }
  // 被动枪声脉冲（§4.2：仅声源标记不显示单位点；本机开火不报）
  function reportShot(x, z) {
    const R = self.SFE_RULES, g = st.lastGame;
    if (!R || !R.match || R.match.settle) return;
    if (g && g.player && Math.hypot(x - g.player.pos[0], z - g.player.pos[2]) < 3) return;
    st.shots.push({ x, z, at: R.match.t });
    if (st.shots.length > TUNE.shotPulseMax) st.shots.shift();
  }

  // ================================================================ 标记层投影（小窗/大图共用）
  // 撤离点三态（对照 sfe_rules.activeExtracts + 06 §9.6 时间轴）：closed / open / main
  function extractState(a, m, plan) {
    const main = plan.extractMain[m.mainPick];
    if (m.phase === "EXTRACT_OPEN") return plan.extractAlways.indexOf(a) >= 0 ? "open" : "closed";
    if (m.phase === "FINAL_WINDOW" || m.phase === "FORCE_END") return a === main ? "main" : "closed";
    return "closed";
  }
  const extractColor = (s) => (s === "main" ? TUNE.colExtractMain : s === "open" ? TUNE.colExtractOpen : TUNE.colExtractClosed);
  const threatAlpha = (age, sec) => Math.max(0, 1 - age / sec);

  function dotAt(ctx, sx, sy, c, r) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, 7);
    ctx.fill();
  }
  function selfArrow(ctx, sx, sy, yaw, r) {
    ctx.fillStyle = TUNE.colSelf;
    ctx.beginPath();
    ctx.moveTo(sx - r * Math.sin(yaw), sy - r * Math.cos(yaw));
    ctx.lineTo(sx + r * 0.6 * Math.cos(yaw) + r * 0.5 * Math.sin(yaw), sy - r * 0.6 * Math.sin(yaw) + r * 0.5 * Math.cos(yaw));
    ctx.lineTo(sx - r * 0.6 * Math.cos(yaw) + r * 0.5 * Math.sin(yaw), sy + r * 0.6 * Math.sin(yaw) + r * 0.5 * Math.cos(yaw));
    ctx.fill();
  }
  // 威胁层（快照脉冲 + 枪声环 + 扫描动画环）；proj(bx, bz) → [sx, sy]
  function threatDraw(ctx, proj, m, p) {
    const sc = st.scan;
    // 扫描扩散动画（1s 一圈）
    if (sc.animAt >= 0) {
      const age = m.t - sc.animAt;
      if (age >= 0 && age <= TUNE.scanAnimSec) {
        const [cx, cy] = proj(p.pos[0], p.pos[2]);
        ctx.strokeStyle = "rgba(255,210,74," + threatAlpha(age, TUNE.scanAnimSec).toFixed(2) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, (age / TUNE.scanAnimSec) * TUNE.scanRadius * (proj.k || 1), 0, 7);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
    }
    // 快照脉冲（5s，扫描完成瞬间位置，不实时追踪）
    if (sc.snapAt >= 0) {
      const age = m.t - sc.snapAt;
      if (age >= 0 && age <= snapshotSec()) {
        const a = threatAlpha(age, snapshotSec()).toFixed(2);
        ctx.globalAlpha = +a;
        for (const pt of sc.snapPts) {
          const [sx, sy] = proj(pt[0], pt[1]);
          dotAt(ctx, sx, sy, TUNE.colThreat, 3);
        }
        ctx.globalAlpha = 1;
      }
    }
    // 枪声环（2s，扩散渐隐）
    st.shots = st.shots.filter((s) => m.t - s.at <= TUNE.shotPulseSec);
    for (const s of st.shots) {
      const age = m.t - s.at;
      const [sx, sy] = proj(s.x, s.z);
      ctx.strokeStyle = "rgba(255,80,80," + threatAlpha(age, TUNE.shotPulseSec).toFixed(2) + ")";
      ctx.beginPath();
      ctx.arc(sx, sy, 2 + (age / TUNE.shotPulseSec) * 10 * (proj.k || 1), 0, 7);
      ctx.stroke();
    }
  }

  // ================================================================ 常驻小窗（§2.1）
  function drawWin(ui, g, m, plan) {
    const t0 = performance.now();
    const ctx = ui.ctx, b = st.base, p = g.player;
    const size = winSize(), half = size / 2;
    const safe = ui.safe ? ui.safe() : { l: 0, t: 0 };
    const x = ui.w - TUNE.winMargin - size - (safe.r || 0), y = TUNE.winMargin + (safe.t || 0);
    // 边框底 + 未渲染区暗色蒙层（§2.1 蒙层：非黑块）
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(x - 1, y - 1, size + 2, size + 2);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x, y, size, size);
    if (b) {
      // 1px = 1 方块：视窗 64 方块；底图 2 方块/px → 源矩形 32²
      const sx = clampV(p.pos[0] / TUNE.blocksPerPx - half / TUNE.blocksPerPx, 0, TUNE.basemapRes - size / TUNE.blocksPerPx);
      const sy = clampV(p.pos[2] / TUNE.blocksPerPx - half / TUNE.blocksPerPx, 0, TUNE.basemapRes - size / TUNE.blocksPerPx);
      ctx.imageSmoothingEnabled = !1;
      ctx.drawImage(b.cv, sx, sy, size / TUNE.blocksPerPx, size / TUNE.blocksPerPx, x, y, size, size);
      const bx0 = p.pos[0] - half, bz0 = p.pos[2] - half;
      const proj = (bx, bz) => [x + (bx - bx0), y + (bz - bz0)];
      const inWin = (bx, bz) => bx >= bx0 && bx < bx0 + size && bz >= bz0 && bz < bz0 + size;
      // L2 目标点：主 POI 金 / 散点灰 / 撤离点三态（全图已知信息，非威胁情报）
      for (const a of plan.main) if (!a.failed && inWin(a.x, a.z)) dotAt(ctx, proj(a.x, a.z)[0], proj(a.x, a.z)[1], TUNE.colMain, 3);
      for (const a of plan.minor) if (!a.failed && inWin(a.x, a.z)) dotAt(ctx, proj(a.x, a.z)[0], proj(a.x, a.z)[1], TUNE.colMinor, 2);
      const exs = plan.extractAlways.concat([plan.extractMain[m.mainPick]]).filter(Boolean);
      for (const a of exs) if (!a.failed && inWin(a.x, a.z)) dotAt(ctx, proj(a.x, a.z)[0], proj(a.x, a.z)[1], extractColor(extractState(a, m, plan)), 3.5);
      // L4 威胁层（方案 B：只有扫描快照/枪声脉冲，无 AI 实时点）
      threatDraw(ctx, proj, m, p);
      // L3 自身：白色朝向箭头（F1 yaw 三角逻辑）
      selfArrow(ctx, x + half, y + half, p.yaw, 5);
    }
    Font.draw(ctx, Math.floor(p.pos[0]) + ", " + Math.floor(p.pos[2]), x, y + size + 3, "#E0E0E0", !1);
    const ms = performance.now() - t0;
    const S = st.stats;
    S.n++; S.last = ms; S.sum += ms;
    if (ms > S.max) S.max = ms;
  }

  // ================================================================ 按住大图（§2.2 增强：底图 + 两档缩放 + 撤离点名称 + 威胁层）
  function phaseStatus(m) {
    return { DEPLOY: "着陆保护期", LOOT: "撤离点未开放", EXTRACT_OPEN: "常开点已开放", FINAL_WINDOW: "仅主撤离点开放", FORCE_END: "强制结算" }[m.phase] || "";
  }
  function drawBig(ui, g, m, plan) {
    const ctx = ui.ctx, b = st.base, p = g.player;
    const span = T.chunkSpan * 16;
    const S = Math.min(ui.w, ui.h) * TUNE.bigViewRatio;
    const x0 = Math.round((ui.w - S) / 2), y0 = Math.round((ui.h - S) / 2);
    ctx.fillStyle = "rgba(8,10,14,.86)";
    ctx.fillRect(0, 0, ui.w, ui.h);
    const z = TUNE.bigScale[st.zoomIdx];
    let Cx, Cz, k, sRect = null;
    if (z === 1) {           // 1×：1 屏幕px = 1 方块，拖动平移
      k = 1;
      Cx = clampV(p.pos[0] + st.panX, S / 2, span - S / 2);
      Cz = clampV(p.pos[2] + st.panY, S / 2, span - S / 2);
      sRect = [(Cx - S / 2) / TUNE.blocksPerPx, (Cz - S / 2) / TUNE.blocksPerPx, S / TUNE.blocksPerPx, S / TUNE.blocksPerPx];
    } else {                 // 0.5×：全览 360px（默认档）
      k = S / span;
      Cx = Cz = span / 2;
    }
    ctx.imageSmoothingEnabled = z !== 1;
    if (sRect) ctx.drawImage(b.cv, sRect[0], sRect[1], sRect[2], sRect[3], x0, y0, S, S);
    else ctx.drawImage(b.cv, x0, y0, S, S);
    ctx.strokeStyle = "#2c3444";
    ctx.strokeRect(x0 + 0.5, y0 + 0.5, S, S);
    const proj = (bx, bz) => [x0 + S / 2 + (bx - Cx) * k, y0 + S / 2 + (bz - Cz) * k];
    proj.k = k;
    const inView = (bx, bz) => bx >= Cx - S / (2 * k) - 4 && bx <= Cx + S / (2 * k) + 4 && bz >= Cz - S / (2 * k) - 4 && bz <= Cz + S / (2 * k) + 4;
    for (const a of plan.main) if (!a.failed && inView(a.x, a.z)) { const q = proj(a.x, a.z); dotAt(ctx, q[0], q[1], TUNE.colMain, 4); }
    for (const a of plan.minor) if (!a.failed && inView(a.x, a.z)) { const q = proj(a.x, a.z); dotAt(ctx, q[0], q[1], TUNE.colMinor, 2.5); }
    const exs = plan.extractAlways.concat([plan.extractMain[m.mainPick]]).filter(Boolean);
    for (const a of exs) {
      if (a.failed || !inView(a.x, a.z)) continue;
      const q = proj(a.x, a.z);
      dotAt(ctx, q[0], q[1], extractColor(extractState(a, m, plan)), 5);
      Font.draw(ctx, a.name + (extractState(a, m, plan) === "closed" ? "（未开放）" : ""), q[0] + 6, q[1] - 4, extractColor(extractState(a, m, plan)), !1);
    }
    threatDraw(ctx, proj, m, p);
    selfArrow(ctx, proj(p.pos[0], p.pos[2])[0], proj(p.pos[0], p.pos[2])[1], p.yaw, 6);
    Font.draw(ctx, "搜打撤 · 全图（按住查看）· " + phaseStatus(m), x0 + 6, y0 - 20, "#8b94a6", !1);
    Font.draw(ctx, "点击切换 " + z + "×/1×（1× 可拖动）", x0 + 6, y0 + S + 4, "#5f6a80", !1);
  }

  // ================================================================ 扫描按钮 DOM（罗盘旁常显冷却）
  function ensureDom(g, enabled) {
    const R = self.SFE_RULES;
    const need = !!(enabled && R && R.match && !R.match.settle);
    if (!need) {
      if (st.dom) { st.dom.remove(); st.dom = null; }
      st.lastDomCd = -1;
      return;
    }
    if (!st.dom) {
      const b = document.createElement("button");
      b.id = "sfe-scan";
      b.style.cssText = "position:fixed;z-index:56;pointer-events:auto;padding:3px 8px;border-radius:8px;border:1px solid #2c3444;background:rgba(22,26,34,.8);color:#eee;font-size:12px;right:" + TUNE.winMargin + "px;";
      b.addEventListener("click", () => {
        const R2 = self.SFE_RULES;
        if (R2 && R2.match && st.lastGame) doScan(st.lastGame, R2.match, !1);
      });
      document.body.appendChild(b);
      st.dom = b;
    }
    const top = TUNE.winMargin + winSize() + 14;
    if (st.dom.style.top !== top + "px") st.dom.style.top = top + "px";
    const now = performance.now();
    const cd = Math.ceil(st.scan.cd);
    if (now - st.lastDomAt > 250 || cd !== st.lastDomCd) {
      st.lastDomAt = now;
      st.lastDomCd = cd;
      st.dom.textContent = cd > 0 ? "扫描（" + cd + "s）" : "扫描（" + TUNE.scanKey.replace("Key", "") + "）";
      st.dom.style.opacity = cd > 0 ? "0.6" : "1";
    }
  }

  // ================================================================ 安装（HUD 包装 + setBlock 脏区 + 枪声 + N 键 + 大图输入）
  let installed = false;
  function install() {
    if (installed || typeof Game === "undefined") return;
    installed = true;
    if (typeof UI !== "undefined" && UI.prototype.drawHUD && !UI.prototype.drawHUD.__sfeMinimap) {
      const hudOrig = UI.prototype.drawHUD;
      UI.prototype.drawHUD = function () {
        hudOrig.call(this);
        try { draw(this); } catch (e) {}
      };
      UI.prototype.drawHUD.__sfeMinimap = true;
    }
    if (typeof World !== "undefined" && World.prototype.setBlock && !World.prototype.setBlock.__sfeMinimap) {
      const sbOrig = World.prototype.setBlock;
      World.prototype.setBlock = function (x, y, z) {
        try { if (st.base && typeof x === "number") markDirty(x, z); } catch (e) {}
        return sbOrig.apply(this, arguments);
      };
      World.prototype.setBlock.__sfeMinimap = true;
    }
    if (typeof Sound !== "undefined" && !Sound.__sfeShot) {
      const evOrig = Sound.ev;
      Sound.ev = function (name, pos) {
        try {
          if (typeof name === "string" && SHOT_RE.test(name) && pos && pos.length >= 3) reportShot(pos[0], pos[2]);
        } catch (e) {}
        return evOrig.apply(this, arguments);
      };
      Sound.__sfeShot = true;
    }
    addEventListener("keydown", (ev) => {
      if (ev.code !== TUNE.scanKey) return;
      const R = self.SFE_RULES;
      if (!R || !R.match || R.match.settle) return;
      const t = ev.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (st.lastGame) doScan(st.lastGame, R.match, !1);
    });
    // 大图输入：点击切换缩放档；1× 拖动平移；滚轮换档（不阻塞移动/开火输入）
    const bigOpen = () => {
      const R = self.SFE_RULES, g = st.lastGame;
      return !!(g && R && R.state.mapHold && st.base && R.match && !R.match.settle && g.worldMeta && g.worldMeta.sfe);
    };
    addEventListener("pointerdown", (ev) => {
      if (!bigOpen() || !ev.target || ev.target.tagName !== "CANVAS") return;
      st.ptr = { x: ev.clientX, y: ev.clientY, t: performance.now(), moved: 0 };
    });
    addEventListener("pointermove", (ev) => {
      if (!st.ptr) return;
      const dx = ev.clientX - st.ptr.x, dy = ev.clientY - st.ptr.y;
      st.ptr.moved += Math.abs(dx) + Math.abs(dy);
      st.ptr.x = ev.clientX; st.ptr.y = ev.clientY;
      if (TUNE.bigScale[st.zoomIdx] === 1) { st.panX -= dx; st.panY -= dy; }
    });
    addEventListener("pointerup", () => {
      if (!st.ptr) return;
      const click = performance.now() - st.ptr.t < 300 && st.ptr.moved < 8;
      st.ptr = null;
      if (click) { st.zoomIdx = (st.zoomIdx + 1) % TUNE.bigScale.length; st.panX = st.panY = 0; }
    });
  }

  // ================================================================ 帧入口
  function resetMatch(mid) {
    st.matchId = mid;
    st.base = null;
    st.dirty.clear();
    st.scan = { cd: 0, animAt: -1, snapAt: -1, snapPts: [], free: false };
    st.shots.length = 0;
    st.zoomIdx = 0; st.panX = st.panY = 0;
    st.stats = { n: 0, last: 0, max: 0, sum: 0 };
  }
  function release() {
    st.base = null;      // §3.2 跨局不缓存：结算即弃
    st.dirty.clear();
    st.shots.length = 0;
    if (st.dom) { st.dom.remove(); st.dom = null; }
    st.lastDomCd = -1;
  }
  function draw(ui) {
    const g = ui.game;
    const R = self.SFE_RULES;
    const wm = g && g.worldMeta;
    const m = R && R.match;
    const active = !!(wm && wm.sfe && m && !m.settle);
    if (!active) { release(); return; }
    if (g.state !== "play" || !R.state.plan || !g.player) return;
    const now = performance.now();
    const dt = st.lastNow ? Math.min(0.1, (now - st.lastNow) / 1000) : 0;
    st.lastNow = now;
    st.lastGame = g;
    if (st.matchId !== wm.id) resetMatch(wm.id);
    // 免费教学扫描（DEPLOY 段首次落地，一次）
    if (m.phase === "DEPLOY" && !st.scan.free && m.t >= TUNE.freeScanAt) {
      st.scan.free = true;
      doScan(g, m, !0);
    }
    st.scan.cd = Math.max(0, st.scan.cd - dt);
    ensureBase(g);
    stepRender();
    refreshDirty(g);
    const enabled = !(g.settings && g.settings.sfe_minimap === false);
    ensureDom(g, enabled);
    if (R.state.mapHold) {
      if (!st.prevHold) { st.panX = st.panY = 0; }
      if (st.base) drawBig(ui, g, m, R.state.plan);   // 先画大图（全屏蒙层在下）
    }
    if (enabled) drawWin(ui, g, m, R.state.plan);     // 小窗常驻最上层
    st.prevHold = !!R.state.mapHold;
  }

  // ================================================================ 自测钩子（headless 可断言）
  const _test = {
    TUNE, colorFor, palColor, extractState, extractColor, SHOT_RE,
    markDirty, doScan, reportShot, state: st,
    resetStats: () => { st.stats = { n: 0, last: 0, max: 0, sum: 0 }; },
  };

  install();

  return {
    TUNE, state: st, doScan, reportShot, on: (g) => !(g.settings && g.settings.sfe_minimap === false),
    setEnabled: (g, on) => {
      if (!g.settings) g.settings = {};
      if (on) delete g.settings.sfe_minimap; else g.settings.sfe_minimap = false;
      try { g.saveSettings && g.saveSettings(); } catch (e) {}
    },
    stats: () => st.stats,
    release, install,
    _test,
  };
})();
self.SFE_MINIMAP = SFE_MINIMAP;
//# sourceURL=js/sfe_minimap.js
