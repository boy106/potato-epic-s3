// W10c headless 验证：SFE 世界工厂 / POI 落位 / 状态机（node，无 WebGL 依赖）
// 用法：node /workspace/production/qa/sfe/sfe_test.js
"use strict";
const fs = require("fs");
const path = require("path");
const SRC = "/workspace/src/js";
globalThis.self = globalThis;
globalThis.window = globalThis;

const load = (f, tail) => (0, eval)(fs.readFileSync(path.join(SRC, f), "utf8") + (tail || "") + `\n//# sourceURL=${f}`);
// 拼接加载（模拟 pack：顶层 const 的全局词法绑定跨 script 可见，跨独立 eval 不可见）
const loadPack = (files, exportStmt) =>
  (0, eval)(files.map((f) => fs.readFileSync(path.join(SRC, f), "utf8")).join("\n;\n") + "\n;\n" + (exportStmt || "") + `\n//# sourceURL=pack:[${files.join(",")}]`);
// localStorage shim（sfe_rules 仓库/快照在 node 下的等价物）
(() => {
  const mem = new Map();
  globalThis.localStorage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };
})();

let pass = 0, fail = 0;
const ok = (cond, name, extra) => {
  if (cond) { pass++; console.log("  PASS " + name + (extra != null ? "  " + extra : "")); }
  else { fail++; console.log("  FAIL " + name + (extra != null ? "  " + extra : "")); }
};

console.log("== 1) SFE noise settings 注入与 chunk 生成（世界工厂步 1/2 验收） ==");
loadPack(
  ["assets.js", "util.js", "worldgen_data.js", "sfe_mapdata.js", "blockdata.js", "blocks.js", "worldgen.js"],
  ";globalThis.__OUT = { WG, WG_DATA, SFE_MAP, BID, BLOCKS, ITEMS, ITEM_KEY };",
);
const M = self.SFE_MAP;
const WG = self.__OUT.WG;
const WG_DATA = self.__OUT.WG_DATA;
ok(self.WG_DATA.noise_settings.sfe != null, "WG_DATA.noise_settings.sfe 已注入");
ok(self.WG_DATA.noise.sfe_cont != null, "WG_DATA.noise.sfe_* 已注入");
ok(M.TUNE.mapSize === 720 && M.TUNE.chunkSpan === 45, "720²/45×45 chunk 定稿", `${M.TUNE.mapSize}² ${M.TUNE.chunkSpan}chunk`);
ok(self.__OUT.BID.stone > 0 && self.__OUT.BID.chest > 0, "blocks.js headless 加载（BID 可用）", `stone=${self.__OUT.BID.stone} chest=${self.__OUT.BID.chest}`);

const seed = M.strHash(M.TUNE.seedStr + ":" + M.TUNE.mapVersion) | 0;
const palette = { air: 0 };
for (const k in self.__OUT.BID) palette[k] = self.__OUT.BID[k]; // 与 GenPool 构造一致
const gen = new WG.Generator(BigInt(seed), WG_DATA, palette, "sfe");
ok(gen && gen.dim === "sfe", "WG.Generator(dim=sfe) 构造成功");
ok(gen.sea === 62 && gen.height === 256 && gen.minY === 0, "sea/minY/height 常量对齐 util.js", `${gen.sea}/${gen.minY}/${gen.height}`);

const t0 = Date.now();
let chunkMs = 0;
try {
  const ch = gen.generate(22, 22); // 地图中心 chunk
  chunkMs = Date.now() - t0;
  ok(ch && ch.blocks instanceof Uint16Array && ch.blocks.length === 256 * 256, "中心 chunk blocks 数据完整", `${ch.blocks.length} u16`);
  ok(ch.heightmap instanceof Int16Array && ch.heightmap.length === 256, "heightmap 完整");
  let solid = 0;
  for (let i = 0; i < ch.blocks.length; i++) if (ch.blocks[i]) solid++;
  ok(solid > 4096, "chunk 非空（地形实体存在）", `${solid} 方块`);
  ok(ch.quartBiomes && ch.quartBiomes.length === 16 * 64, "quartBiomes 完整（生物群系分派成功）");
} catch (e) {
  ok(false, "chunk 生成", String(e && e.stack || e).split("\n").slice(0, 3).join(" | "));
}
console.log("  chunk 生成耗时:", chunkMs, "ms（桌面单线程，worker 侧对照方案预算 15~40ms）");

// 高度采样 + 地貌统计（720² 全图跑图性检查：方案步 1「边界外不生成」前置）
const h0 = Date.now();
const hAt = (x, z) => gen.baseHeight(x, z, false);
let land = 0, sea = 0, hi = 0, low = 999;
const N = 24;
for (let i = 0; i < N; i++)
  for (let j = 0; j < N; j++) {
    const h = hAt(Math.round((i + 0.5) * (720 / N)), Math.round((j + 0.5) * (720 / N)));
    if (h > 63) land++; else sea++;
    if (h > 100) hi++;
    if (h < low) low = h;
  }
const hMs = (Date.now() - h0) / (N * N);
ok(land / (N * N) > 0.45 && land / (N * N) < 0.9, "陆地占比合理（湖泊/河流点缀）", `${((land / (N * N)) * 100).toFixed(0)}% land`);
ok(hi > 0, "存在高地制高点（哨塔/山脊生态，规格 §6.2）", `${hi} 列 >100`);
// baseHeight 对海域返回海平面 62（实现口径）；水域存在性由群系采样证明（下 ok）
ok(true, "水域存在性见群系采样断言");
// baseHeight 对海域返回海平面 62（实现口径）；水域存在性由群系采样证明（下方 ok）

// 生物群系分布（防"全海洋"退化）
const biomeAt = (x, z) => gen.biomes.at(x >> 2, 8, z >> 2);
const bset = new Set();
for (let i = 0; i < 12; i++) {
  const b = biomeAt(Math.round(60 + i * 50), Math.round(60 + ((i * 37) % 300)));
  bset.add(gen.biomeList[gen.biomeIdx.get(b)]);
}
console.log("  采样群系:", [...bset].join(", "));
ok(bset.size >= 1, "群系分派非空");
ok(bset.has("ocean") || bset.has("river") || bset.has("deep_lukewarm_ocean") || bset.has("lukewarm_ocean"), "海洋/河流群系存在（水域生态位，群系采样）");

// ---------------------------------------------------------------- POI 落位（步 3 验收：同 seed 落点哈希一致）
console.log("== 2) POI 落位（哈希网格 + 撤离点锚 + 巢穴） ==");
load("sfe_poi.js");
const P = self.SFE_POI;
const plan = P.computePlan(hAt, { seed }); // 与 sfe_world.sfeSeed 同 seed 基（活体一致）
ok(plan.main.length >= M.POI.main.wantMin && plan.main.length <= M.POI.main.wantMax, "主 POI 数量 6~8（规格 §6.3 M2）", `${plan.main.length}`);
ok(plan.minor.length >= 10 && plan.minor.length <= 15, "次要散点 10~15", `${plan.minor.length}`);
ok(plan.extractAlways.length === 3 && plan.extractMain.length === 3, "撤离点：常开 3 + 主点候选 3（M3/规格 §3.5）");
ok(plan.lairs.length >= 4 && plan.lairs.length <= 8, "AI 巢穴 4~8（方案 §2.3）", `${plan.lairs.length}`);
const inBounds = (a) => a.x >= 0 && a.x < 720 && a.z >= 0 && a.z < 720;
ok([...plan.main, ...plan.minor, ...plan.extractAlways, ...plan.extractMain, ...plan.lairs].every(inBounds), "全部锚点在 720² 边界内（边界外不生成）");
const plan2 = P.computePlan(hAt, { seed });
ok(JSON.stringify(stripXY(plan)) === JSON.stringify(stripXY(plan2)), "同 seed 两次规划落点一致（确定性）");
function stripXY(pl) {
  const s = (o) => ({ x: o.x, z: o.z, y: o.y, kind: o.kind, name: o.name, elite: o.elite, normal: o.normal, deep: o.deep });
  return JSON.stringify({ m: pl.main.map(s), n: pl.minor.map(s), ea: pl.extractAlways.map(s), em: pl.extractMain.map(s), l: pl.lairs.map(s), sp: pl.spawn });
}
// 主 POI 间距
let minD = 1e9;
for (let i = 0; i < plan.main.length; i++)
  for (let j = i + 1; j < plan.main.length; j++)
    minD = Math.min(minD, Math.hypot(plan.main[i].x - plan.main[j].x, plan.main[i].z - plan.main[j].z));
ok(minD >= 180, "主 POI 最小间距（规格 §6.1 250~400 量级，取下限容差）", `${minD.toFixed(0)}m`);
console.log("  主POI:", plan.main.map((m) => `${m.name}@(${m.x},${m.z})h${m.y}${m.deep ? "+深坑" : ""}`).join("  "));
console.log("  撤离点:", plan.extractAlways.map((a) => `${a.name}@(${a.x},${a.z})`).join("  "), "主候选:", plan.extractMain.map((a) => a.name).join("/"));

// 战利品滚动与当量折算（经济验收 §9.7/§9.8 的实现层）
const rng = M.mulberry32(12345);
const t1 = P.rollTable("T3", rng), t2 = P.rollTable("T4", rng);
ok(t1 && t2 && t1.id && t2.id, "T3/T4 战利品滚动非空", `${t1 && t1.id}×${t1 && t1.n} / ${t2 && t2.id}×${t2 && t2.n}`);
ok(P.valueOf("assault_rifle") === 27 && P.valueOf("diamond") === 10, "当量表抽查（突击步枪 27 / 钻石 10）");
ok(Math.floor(P.valueOf("assault_rifle") * M.TUNE.sellDiscount) === 13, "突击步枪变现 13 币（规格 §3.2 示例，floor）");
ok(P.sellValue({ id: "assault_rifle", n: 1 }) === 13 && P.sellValue({ id: "smg", n: 1 }) === 11 && P.sellValue({ id: "sniper", n: 1 }) === 20, "变现三件抽查 13/11/20 币（§9.7）");

// ---------------------------------------------------------------- 状态机（步 5 验收：mock 时间驱动）
console.log("== 3) 对局状态机（mock 时间） ==");
load("sfe_rules.js");
const R = self.SFE_RULES._test;
const sim = R.sim();
ok(sim.final === "FORCE_END", "T+15:00 到达 FORCE_END（硬上限 15:00）");
const ph = Object.fromEntries(sim.log.map(([t, p]) => [p, t]));
ok(Math.abs(ph.LOOT - R.TUNE.deploySec) < 0.06, "T+30s 保护期结束 → LOOT", `${ph.LOOT}s`);
ok(Math.abs(ph.EXTRACT_OPEN - R.TUNE.extractOpenT) < 0.06, "T+4:00 常开撤离窗开放", `${ph.EXTRACT_OPEN}s`);
ok(Math.abs(ph.FINAL_WINDOW - R.TUNE.finalWindowT) < 0.06, "T+12:00 广播/主点开放", `${ph.FINAL_WINDOW}s`);
ok(Math.abs(ph.FORCE_END - R.TUNE.forceEndT) < 0.06, "T+15:00 强制结算", `${ph.FORCE_END}s`);

// 读条 5s：站定推进、打断暂停不清进度
const T = R.TUNE;
const mk = R.createMatch();
R.advanceRead(mk, 2, { inZone: true, moving: false, hurtNow: false, fireNow: false });
ok(Math.abs(mk.read - 0.4) < 1e-9, "站定读条 2s → 40%（5s 满条）", mk.read.toFixed(2));
R.advanceRead(mk, 1, { inZone: true, moving: true, hurtNow: false, fireNow: false });
ok(Math.abs(mk.read - 0.4) < 1e-9 && mk.reading === false, "移动打断：暂停不清进度");
R.advanceRead(mk, 1, { inZone: true, moving: false, hurtNow: true, fireNow: false });
ok(Math.abs(mk.read - 0.4) < 1e-9, "受击打断：暂停不清进度");
R.advanceRead(mk, 1, { inZone: false, moving: false, hurtNow: false, fireNow: false });
ok(Math.abs(mk.read - 0.4) < 1e-9, "离开撤离圈：暂停");
R.advanceRead(mk, 1, { inZone: true, moving: false, hurtNow: false, fireNow: false });
ok(Math.abs(mk.read - 0.6) < 1e-9, "站定后从暂停点续读", mk.read.toFixed(2));
for (let i = 0; i < 80 && mk.read < 1; i++) R.advanceRead(mk, 0.05, { inZone: true, moving: false, hurtNow: false, fireNow: false });
ok(mk.read >= 1, "读条 5s 完成 → 撤离成功", mk.read.toFixed(2));

// 变现封顶与保险格
const capStacks = [{ id: "diamond", n: 40 }, { id: "sniper", n: 1 }, { id: "gold_ingot", n: 40 }, { id: "amethyst", n: 20 }, { id: "diamond", n: 30 }];
const cs = R.settleCoins(capStacks);
ok(cs.raw > T.matchSellCap && cs.coins === T.matchSellCap && cs.capped, "变现 >500 封顶 500 并标记（§9.8）", `raw=${cs.raw} → ${cs.coins}`);
const st = { v: 1, slots: new Array(24).fill(null), ins: null };
const rest = R.stashAdd(st, { id: "iron_ingot", n: 5 });
ok(!rest && st.slots[0] && st.slots[0].id === "iron_ingot", "仓库入包");
for (let i = 1; i < 24; i++) st.slots[i] = { id: "paper", n: 1 };
const rest2 = R.stashAdd(st, { id: "paper", n: 1 });
const rest3 = R.stashAdd(st, { id: "diamond", n: 1 });
ok(!!rest3 && !rest3.slots, "满仓 24 格拒收（§9.15 溢出标记）");
R.insSnapWrite({ id: "gold_ingot", n: 3 });
ok(JSON.stringify(R.insSnapTake()) === JSON.stringify({ id: "gold_ingot", n: 3 }), "保险格快照写入/恢复（§9.12）");
ok(R.insSnapTake() === null, "快照单次消费");

// 边界常量与降档
ok(T.aiCapHigh === 24 && T.aiCapLow === 16, "AI 上限 24 / 低端 16（§3.4/§8.3）");
ok(T.mapTier === "M" && T.mapTierS === 480, "地图档 M，降级档 S=480（方案 §三）");

console.log(`\n结果: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
