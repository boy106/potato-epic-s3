"use strict";
// W10c 搜打撤（SFE）POI 管线 v1 —— 方案 §五步 3/4。
// 职责：① 确定性落位规划（纯函数，headless 可断言：同 seed 落点哈希一致）；
//       ② 运行期落位执行（chunk 就绪后补容器/撤离平台/巢穴锚）；
//       ③ 战利品滚动与物资当量折算（规格 §3.2）。
// 依赖：SFE_MAP（pack2）；运行期另需 game/world/BID/makeStack（全部惰性访问）。
const SFE_POI = (() => {
  const M = self.SFE_MAP;
  const { TUNE, hash2, mulberry32 } = M;

  // ---------------------------------------------------------------- 数字 seed 派生（固定 seed：seedStr + mapVersion）
  const seedNum = () => hash2(0x9e3779b9, M.strHash(TUNE.seedStr), M.strHash(TUNE.mapVersion), 0x1234) | 0;

  // ---------------------------------------------------------------- 规划（纯函数）
  // plan = { spawn:[x,z], main:[..], minor:[..], extractAlways:[..], extractMain:[..], lairs:[..] }
  // 每个点：{ x, z, y?, name?, tier?, cell? } —— y 运行期用地表高度校验后回填。
  function computePlan(heightAt, opts = {}) {
    const seed = opts.seed ?? seedNum();
    const span = TUNE.chunkSpan;
    const plan = { seed, spawn: null, main: [], minor: [], extractAlways: [], extractMain: [], lairs: [] };

    // --- 主 POI：spacing 16 chunk 网格，格内确定性抖动 ---
    const pMain = M.POI.main;
    const cells = Math.ceil(span / pMain.spacing);
    const cand = [];
    for (let gz = 0; gz < cells; gz++)
      for (let gx = 0; gx < cells; gx++) {
        const r = mulberry32(hash2(seed, pMain.salt, gx, gz));
        const cx = Math.min(span - 1 - pMain.sep, gx * pMain.spacing + Math.floor(r() * (pMain.spacing - pMain.sep)) + pMain.edgeChunks);
        const cz = Math.min(span - 1 - pMain.sep, gz * pMain.spacing + Math.floor(r() * (pMain.spacing - pMain.sep)) + pMain.edgeChunks);
        const kind = r() < 0.72 ? "settlement" : "mine"; // 聚落区 / resource 区（规格 §6.2 地貌）
        cand.push({ cx, cz, kind, r: r(), name: kind === "mine" ? "矿场" : "聚落" });
      }
    // 落点校验（方案步 3）：land（h > 海平面+1）+ 主点间距 ≥ 200 方块；不合格按候选偏移顺延
    const SEA = 62;
    const MIN_DIST = 200;
    for (const c of cand) {
      if (plan.main.length >= pMain.wantMax) break;
      const baseX = c.cx * 16 + 8, baseZ = c.cz * 16 + 8;
      let placed = false;
      for (let a = 0; a < 8 && !placed; a++) {
        const r2 = mulberry32(hash2(seed, c.cx, c.cz, 0xa0 + a));
        const dx = Math.floor((r2() - 0.5) * 96), dz = Math.floor((r2() - 0.5) * 96);
        const x = clampChunk(baseX + dx, span * 16), z = clampChunk(baseZ + dz, span * 16);
        const h = heightAt(x, z);
        if (h == null || h <= SEA + 1 || h > 110) continue;
        if (plan.main.some((m) => Math.hypot(m.x - x, m.z - z) < MIN_DIST)) continue;
        const elite = pMain.elite[0] + Math.floor(r2() * (pMain.elite[1] - pMain.elite[0] + 1));
        const normal = pMain.normal[0] + Math.floor(r2() * (pMain.normal[1] - pMain.normal[0] + 1));
        plan.main.push({ x, z, y: h, kind: c.kind, name: c.name + (plan.main.length + 1), elite, normal, deep: c.kind === "mine" && M.POI_BUILD.deepPit });
        placed = true;
      }
    }

    // --- 次要散点：spacing 6 chunk 网格 + 频率抽稀（规格 §6.3 wantMax 10~15） ---
    const pMin = M.POI.minor;
    const cells2 = Math.ceil(span / pMin.spacing);
    for (let gz = 0; gz < cells2; gz++)
      for (let gx = 0; gx < cells2; gx++) {
        if (plan.minor.length >= 15) break;
        const r = mulberry32(hash2(seed, pMin.salt, gx, gz));
        if (r() > pMin.freq) continue;
        const cx = Math.min(span - 1 - 2, gx * pMin.spacing + Math.floor(r() * pMin.spacing));
        const cz = Math.min(span - 1 - 2, gz * pMin.spacing + Math.floor(r() * pMin.spacing));
        const x = clampChunk(cx * 16 + 4 + Math.floor(r() * 8), span * 16);
        const z = clampChunk(cz * 16 + 4 + Math.floor(r() * 8), span * 16);
        if (hLand(heightAt, x, z, SEA) && !nearAny(plan.main, x, z, 96) && !plan.minor.some((m) => Math.hypot(m.x - x, m.z - z) < 80))
          plan.minor.push({ x, z, y: heightAt(x, z), name: "散点", normal: 1 + Math.floor(r() * 2) });
      }

    // --- 撤离点：常开 3（三向均衡）+ 主点候选 3（每局随机 3 选 1，规格 §3.5） ---
    const anchor = (a, rSalt) => {
      const r = mulberry32(hash2(seed, M.EXTRACT.salt, rSalt, a.cx * 97 + a.cz));
      const j = M.EXTRACT.jitterChunks * 16;
      const x = clampChunk(a.cx * 16 + 8 + Math.floor((r() - 0.5) * j), span * 16);
      const z = clampChunk(a.cz * 16 + 8 + Math.floor((r() - 0.5) * j), span * 16);
      return { x, z, y: heightAt(x, z), name: a.name };
    };
    M.EXTRACT.always.forEach((a, i) => plan.extractAlways.push(anchor(a, 0x10 + i)));
    M.EXTRACT.mainCandidates.forEach((a, i) => plan.extractMain.push(anchor(a, 0x20 + i)));

    // --- AI 巢穴：spacing 11 chunk 网格（4~8 个，规格 §6.3 经由方案 §2.3） ---
    const pL = M.LAIR;
    const cells3 = Math.ceil(span / pL.spacing);
    for (let gz = 0; gz < cells3; gz++)
      for (let gx = 0; gx < cells3; gx++) {
        if (plan.lairs.length >= pL.wantMax) break;
        const r = mulberry32(hash2(seed, pL.salt, gx, gz));
        if (r() > (pL.freq ?? 0.5)) continue;
        const cx = Math.min(span - 1 - pL.edgeChunks, gx * pL.spacing + Math.floor(r() * pL.spacing));
        const cz = Math.min(span - 1 - pL.edgeChunks, gz * pL.spacing + Math.floor(r() * pL.spacing));
        const x = clampChunk(cx * 16 + 8, span * 16), z = clampChunk(cz * 16 + 8, span * 16);
        if (hLand(heightAt, x, z, SEA) && !nearAny(plan.main, x, z, 64))
          plan.lairs.push({ x, z, y: heightAt(x, z), name: "巢穴" });
      }

    // --- 出生点：地图中心向外螺旋找 land（worldgen spawn_target 思路的确定性简化） ---
    const c0 = (span * 16) / 2;
    for (let rad = 0; rad < 240 && !plan.spawn; rad += 16)
      for (let k = 0; k < 12; k++) {
        const ang = (k / 12) * Math.PI * 2;
        const x = Math.round(c0 + Math.cos(ang) * rad), z = Math.round(c0 + Math.sin(ang) * rad);
        const h = heightAt(x, z);
        if (h != null && h > SEA + 1 && h < 100) { plan.spawn = [x, h + 1, z]; break; }
      }
    if (!plan.spawn) plan.spawn = [c0, 80, c0];
    return plan;
  }
  const clampChunk = (v, max) => Math.max(24, Math.min(max - 24, v));
  const hLand = (heightAt, x, z, sea) => { const h = heightAt(x, z); return h != null && h > sea + 1 && h < 110; };
  const nearAny = (list, x, z, d) => list.some((m) => Math.hypot(m.x - x, m.z - z) < d);

  // ---------------------------------------------------------------- 战利品滚动（规格 §3.2 分层配表）
  function rollTable(tier, rng) {
    const table = M.LOOT[tier];
    if (!table) return null;
    let total = 0;
    for (const e of table) total += e.w;
    let s = rng() * total;
    for (const e of table) { s -= e.w; if (s < 0) return { id: e.id, n: e.n[0] + Math.floor(rng() * (e.n[1] - e.n[0] + 1)) }; }
    const e = table[0];
    return { id: e.id, n: e.n[0] };
  }
  function fillChest(game, x, y, z, tiers, seedSalt) {
    // tiers: [{tier:"T2", rolls:[min,max]}...]，从上到下逐格滚动；同 seed 同填充（规格 §2.2 容器单局刷新）
    const be = game.getBlockEntity(x, y, z, "chest");
    if (!be) return null;
    const rng = mulberry32(hash2(seedNum(), x, z, seedSalt));
    for (const { tier, rolls } of tiers) {
      const count = rolls[0] + Math.floor(rng() * (rolls[1] - rolls[0] + 1));
      for (let i = 0; i < count; i++) {
        const it = rollTable(tier, rng);
        if (!it) continue;
        let slot = Math.floor(rng() * 27), guard = 0;
        while (be.slots[slot] && guard++ < 40) slot = (slot + 1) % 27;
        if (!be.slots[slot]) be.slots[slot] = makeStack(it.id, it.n);
      }
    }
    return be;
  }

  // ---------------------------------------------------------------- 物资当量折算（规格 §3.2：变现 = 当量 × 50%）
  function valueOf(id) {
    if (M.GOODS_VALUE[id] != null) return M.GOODS_VALUE[id];
    if (M.MATERIAL_VALUE[id] != null) return M.MATERIAL_VALUE[id];
    return 0; // 未知物品不参与变现（防刷兜底）
  }
  function stackValue(stack) {
    if (!stack) return 0;
    const id = (typeof stack.id === "string" && isNaN(+stack.id)) ? stack.id : blockKeyOf(stack.id);
    return valueOf(id) * (stack.n || 1);
  }
  // 变现价 = 当量 × 50%，向下取整（规格 §3.2 示例：突击步枪 27 → 13）
  function sellValue(stack) {
    if (!stack) return 0;
    const id = (typeof stack.id === "string" && isNaN(+stack.id)) ? stack.id : blockKeyOf(stack.id);
    return Math.floor(valueOf(id) * (stack.n || 1) * M.TUNE.sellDiscount);
  }
  function blockKeyOf(bid) {
    try { const B = BLOCKS[bid]; return B ? B.key : null; } catch (e) { return null; }
  }

  // ---------------------------------------------------------------- 运行期落位（chunk 就绪后执行；方案步 3「落点校验」运行时侧）
  // pending: anchor -> state；每秒由 sfe_rules 调 tickPlacement。
  function tickPlacement(game, plan, state) {
    const w = game.world;
    if (!w) return;
    const span = TUNE.chunkSpan * 16;
    let budget = 2; // 每次最多落 2 个锚（帧预算意识）
    const tryOne = (a, kind) => {
      if (a.done || a.failed) return;
      if (!w.isLoaded(a.x, a.z)) return;
      const y = w.surfaceY(a.x, a.z, true);
      if (y <= 62) { a.failed = true; return; } // 水面/无地表 → 放弃（规划期已尽量选 land）
      a.y = y;
      try { buildAnchor(game, a, kind); } catch (e) { console.warn("sfe poi:", a.name, e && e.stack || e); a.failed = true; return; }
      a.done = true;
      state.placed++;
    };
    for (const m of plan.main) { if (budget <= 0) return; tryOne(m, "main"); if (m.done || m.failed) budget--; }
    for (const e of plan.extractAlways) { if (budget <= 0) return; tryOne(e, "extract"); if (e.done || e.failed) budget--; }
    for (const e of plan.extractMain) { if (budget <= 0) return; tryOne(e, "extractMain"); if (e.done || e.failed) budget--; }
    for (const m of plan.minor) { if (budget <= 0) return; tryOne(m, "minor"); if (m.done || m.failed) budget--; }
  }

  function buildAnchor(game, a, kind) {
    const w = game.world;
    // BID 为 blocks.js 顶层 const（全局词法绑定，不在 self 上）——必须裸引用
    const y = a.y + 1;
    if (kind === "main" || kind === "minor") {
      // 场地平整（规格 §6.3：POI 蓝图区程序化箱体）
      const R = kind === "main" ? M.POI_BUILD.platform : 4;
      const stone = BID.smooth_stone ?? BID.stone ?? 1;
      const air = 0;
      for (let dx = -R; dx <= R; dx++)
        for (let dz = -R; dz <= R; dz++) {
          const gx = a.x + dx, gz = a.z + dz;
          const top = w.surfaceY(gx, gz, true);
          for (let yy = top + 1; yy < top + 6; yy++) w.setBlock(gx, yy, gz, air, 0, 1);
          w.setBlock(gx, top, gz, stone, 0, 1);
        }
      // 地标柱
      const mk = BID[M.POI_BUILD.marker] ?? 0;
      if (mk) { w.setBlock(a.x, y, a.z, mk, 0, 1); w.setBlock(a.x, y + 1, a.z, mk, 0, 1); }
      // 容器：精英 + 常规（规格 §6.3 密度表）
      let salt = 1;
      const chestAt = (cx, cz, tiers) => {
        const cy = w.surfaceY(cx, cz, true) + 1;
        w.setBlock(cx, cy, cz, BID.chest, 0, 1);
        fillChest(game, cx, cy, cz, tiers, (hash2(a.x, a.z, cx, cz) ^ salt++) >>> 0);
      };
      if (kind === "main") {
        const eliteN = a.elite || 2, normalN = a.normal || 6;
        for (let i = 0; i < eliteN; i++) {
          const ang = (i / eliteN) * Math.PI * 2;
          chestAt(Math.round(a.x + Math.cos(ang) * (R - 2)), Math.round(a.z + Math.sin(ang) * (R - 2)), [{ tier: "T3", rolls: [2, 3] }, { tier: "T4", rolls: i === 0 && a.deep ? [1, 2] : [0, 0] }]);
        }
        for (let i = 0; i < normalN; i++) {
          const ang = ((i + 0.5) / normalN) * Math.PI * 2;
          const rr = R - 4 - ((i * 5) % (R - 5));
          chestAt(Math.round(a.x + Math.cos(ang) * rr), Math.round(a.z + Math.sin(ang) * rr), [{ tier: "T1", rolls: [2, 3] }, { tier: "T2", rolls: [0, 2] }]);
        }
        // 深挖精英坑（主 POI"深入险地"，规格 §6.3 / §3.2 T4 渠道）——带爬梯防困死
        if (a.deep) {
          const px = a.x + R - 3, pz = a.z, d = M.POI_BUILD.pitDepth;
          const ladder = BID.ladder ?? 0;
          for (let yy = y; yy > y - d; yy--) w.setBlock(px, yy, pz, 0, 0, 1);
          if (ladder) for (let yy = y; yy > y - d; yy--) w.setBlock(px, yy, pz, ladder, 4, 1);
          const py = y - d;
          w.setBlock(px, py, pz, BID.chest, 0, 1);
          fillChest(game, px, py, pz, [{ tier: "T4", rolls: [1, 2] }, { tier: "T3", rolls: [1, 2] }], hash2(a.x, a.z, 777, 1));
        }
      } else {
        const normalN = a.normal || 1;
        for (let i = 0; i < normalN; i++) {
          const ang = ((i + 0.5) / normalN) * Math.PI * 2;
          chestAt(Math.round(a.x + Math.cos(ang) * 3), Math.round(a.z + Math.sin(ang) * 3), [{ tier: "T0", rolls: [1, 2] }, { tier: "T1", rolls: [0, 1] }]);
        }
      }
    } else {
      // 撤离平台：7×7 平地 + 中央信标柱（无物资，规格 §6.3 撤离区不放物资）
      const stone = BID.smooth_stone ?? BID.stone ?? 1;
      const glow = BID.sea_lantern ?? BID.glowstone ?? 0;
      for (let dx = -3; dx <= 3; dx++)
        for (let dz = -3; dz <= 3; dz++) {
          const gx = a.x + dx, gz = a.z + dz;
          const top = w.surfaceY(gx, gz, true);
          for (let yy = top + 1; yy < top + 5; yy++) w.setBlock(gx, yy, gz, 0, 0, 1);
          w.setBlock(gx, top, gz, stone, 0, 1);
        }
      if (glow) { w.setBlock(a.x, a.y + 1, a.z, glow, 0, 1); w.setBlock(a.x, a.y + 2, a.z, glow, 0, 1); }
    }
  }

  return { seedNum, computePlan, rollTable, fillChest, valueOf, stackValue, sellValue, tickPlacement, buildAnchor };
})();
self.SFE_POI = SFE_POI;
//# sourceURL=js/sfe_poi.js
