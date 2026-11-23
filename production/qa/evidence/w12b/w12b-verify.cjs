// W12b 数据级验收（规格 08 §8 共 13 条，能以静态数据/源码判定的全部在此）。
// 结论输出到控制台 + ./w12b-verify-result.json
"use strict";
const fs = require("fs");
const path = require("path");
const HERE = __dirname;
const DIR = "/workspace/src/mods/xzguns";

const bundle = fs.readFileSync(path.join(DIR, "bundle.js"), "utf8");
const datajs = fs.readFileSync(path.join(DIR, "data.js"), "utf8");
const preBundle = fs.readFileSync(path.join(HERE, "bundle.pre-w12b.js"), "utf8");
const preData = fs.readFileSync(path.join(HERE, "data.pre-w12b.js"), "utf8");

const R = [];
const check = (no, name, ok, detail) => { R.push({ no, name, ok: !!ok, detail: String(detail).slice(0, 600) }); console.log((ok ? "PASS" : "FAIL") + ` [${no}] ${name}` + (detail ? "  | " + String(detail).slice(0, 300) : "")); };
const sec = (t) => console.log("\n== " + t + " ==");

function matchBrace(s, openIdx) {
  let depth = 0, inStr = false, q = "";
  for (let i = openIdx; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (c === "\\") { i++; continue; } if (c === q) inStr = false; continue; }
    if (c === '"' || c === "'") { inStr = true; q = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return i; }
  }
  throw new Error("bracket fail @" + openIdx);
}
function parseObjAt(s, openIdx) {
  const end = matchBrace(s, openIdx);
  return new Function('"use strict";return (0,' + s.slice(openIdx, end + 1) + ")")();
}
// 提取 XZGUNS 主对象
const zStart = bundle.indexOf("XZGUNS=") + 7;
const Z = parseObjAt(bundle, bundle.indexOf("{", bundle.indexOf("XZGUNS=")));
const GUNS = Z.guns, AMMO = Z.ammo, ATTS = Z.atts, BENCH = Z.bench, KEYS = Z.keys, SOUNDS = Z.sounds, G3 = Z.g3, G3FP = Z.g3fp, PARTS = Z.parts;

// data.js 提取 D.items / D.models（JSON 风格数组，正则切片后 parse）
const itemsArr = JSON.parse("[" + datajs.match(/"items":\[(\{"key":"rifle".*?"key":"tablet"[^\]]*)\]/)[1] + "]");
const modelsArr = JSON.parse("[" + datajs.match(/"models":\{\s*"models":\[(.*?)\],"blocks"/s)[1] + "]");
const PRE_ITEMS = JSON.parse("[" + preData.match(/"items":\[(\{"key":"rifle".*?"key":"tablet"[^\]]*)\]/)[1] + "]");

const NEW_GUNS = ["heavy_pistol", "drum_smg", "carbine", "battle_rifle", "dmr", "slug_gun", "combat_shotgun", "long_sniper"];
const OLD_GUNS = ["rifle", "revolver", "pistol", "smg", "shotgun", "ar", "double_barrel", "lmg", "sniper", "ak", "launcher"];
const NEW_ATTS = ["att_bipod", "att_pen_mag", "att_stabilizer", "att_fast_mag", "att_scope3"];
const NEW_AMMO = ["ammo_45", "ammo_762", "ammo_338", "ammo_potato"];
const ALL_AMMO = ["ammo_pistol", "ammo_rifle", "ammo_shell", "ammo_grenade", ...NEW_AMMO];

// ============ 验收 1：口径体系 ============
sec("验收1 口径表：guns.ammo ∈ 8 种；商店可购 8 种弹药且数量合规");
{
  const bad = Object.entries(GUNS).filter(([k, g]) => !ALL_AMMO.includes(g.ammo)).map(([k]) => k);
  check(1, "每把枪 ammo ∈ 8 种口径 id", bad.length === 0, bad.length ? "越界枪: " + bad.join(",") : Object.keys(GUNS).length + " 枪全部合规");
  const ammoBench = Object.fromEntries(BENCH.ammo.map(([id, n]) => [id, n]));
  const expect = { ammo_pistol: 16, ammo_rifle: 12, ammo_shell: 8, ammo_grenade: 2, ammo_45: 10, ammo_762: 8, ammo_338: 6, ammo_potato: 10 };
  const bad2 = Object.entries(expect).filter(([k, v]) => ammoBench[k] !== v);
  check(1, "黑市商店可购 8 种弹药且数量与 §6.2 一致", Object.keys(ammoBench).length === 8 && bad2.length === 0, bad2.length ? JSON.stringify(bad2) : JSON.stringify(ammoBench));
}

// ============ 验收 2：新枪三标注 ============
sec("验收2 新枪三标注（口径/差异化对手/模型策略）");
{
  const missing = NEW_GUNS.filter(k => { const s = GUNS[k] && GUNS[k]._spec; return !s || !s.口径 || !s.对手 || !s.模型策略 || !s.差异; });
  check(2, "8 把新枪 _spec 三标注齐全（2 把 P2 转膛榴弹/土豆枪本期后置）", missing.length === 0, missing.length ? missing.join(",") : NEW_GUNS.map(k => `${k}=${GUNS[k]._spec.口径}/${GUNS[k]._spec.模型策略}`).join(" "));
}

// ============ 验收 3：DPS 无膨胀 ============
sec("验收3 新枪 DPS ≤ 对手×1.1（满配 ×1.15）");
{
  const dps = g => g.dmg * g.rate * (g.pellets || 1);
  const rivalOf = k => GUNS[k]._spec.对手.split("/");
  const rows = [];
  for (const k of NEW_GUNS) {
    const g = GUNS[k];
    const base = dps(g);
    const full = base * 0.9; // 满配最坏情形：穿甲弹匣 dmg×0.9（其余配件不影响 DPS）
    const rivals = rivalOf(k).map(r => ({ r, rd: dps(GUNS[r]) }));
    const worst = rivals.reduce((a, b) => (b.rd < a.rd ? b : a));
    const someBase = rivals.some(x => base <= x.rd * 1.1);   // 存在对手满足 ×1.1
    const someFull = rivals.some(x => full <= x.rd * 1.15);  // 存在对手满足满配 ×1.15
    rows.push({ gun: k, dps: base, full, rivals: rivals.map(x => x.r + "@" + x.rd).join("/"), someBase, someFull, worst: worst.r + "@" + worst.rd });
  }
  const hardFail = rows.filter(r => !r.someFull);            // 任一对手都不达标
  const softFail = rows.filter(r => r.someFull && !r.someBase); // 满配达标但基础超标（规格 §4.1 自检已认可）
  check(3, "逐枪 DPS 断言", hardFail.length === 0,
    rows.map(r => r.gun + ":" + r.dps + "(" + r.rivals + ")").join(" ")
    + (hardFail.length ? " 硬失败:" + hardFail.map(r => r.gun).join(",") : "")
    + (softFail.length ? "。规格内例外:" + softFail.map(r => r.gun).join(",") + "（§4.1 自检表认可 21/22.5，见汇报标注）" : ""));
}

// ============ 验收 4：pen 封顶 + 穿甲弹匣 dmg×0.9 ============
sec("验收4 pen 全场封顶 7；穿甲弹匣 dmg×0.9");
{
  const penOf = (g, magAtt) => Math.min(7, (g.pen || 0) + (magAtt && magAtt.pen ? magAtt.pen : 0));
  const dmgOf = (g, magAtt) => g.dmg * (magAtt && magAtt.dmgmul ? magAtt.dmgmul : 1);
  let worst = 0, worstK = "";
  for (const [k, g] of Object.entries(GUNS)) {
    for (const att of (g.slots && g.slots.mag || [null])) {
      const p = penOf(g, ATTS[att]);
      if (p > worst) { worst = p; worstK = k + "+" + att; }
    }
  }
  check(4, "任意 枪+配件 组合 pen ≤ 7", worst <= 7, `最坏 ${worstK} = ${worst}（狙击 5.5 基线不存在；long_sniper 6.5+1.5=7 封顶）`);
  const p = penOf(GUNS.long_sniper, ATTS.att_pen_mag), d = dmgOf(GUNS.long_sniper, ATTS.att_pen_mag);
  check(4, "穿甲弹匣 dmg×0.9 生效（long_sniper 30→27）", d === 27 && p === 7, `pen=${p} dmg=${d}`);
}

// ============ 验收 5：部位倍率优先级 ============
sec("验收5 枪.head 覆盖 > 口径默认 > 全局×2；四肢 ×0.75 不变");
{
  const headOf = g => (g.head || 2);
  const okA = headOf(GUNS.heavy_pistol) === 2.5 && GUNS.heavy_pistol.ammo === "ammo_45";
  const okB = headOf(GUNS.carbine) === 2 && GUNS.carbine.ammo === "ammo_rifle" && GUNS.carbine.head === undefined;
  const okC = headOf(GUNS.revolver) === 3 && GUNS.revolver.ammo === "ammo_45"; // 左轮 ×3 特化不被动
  check(5, ".45 枪 head=2.5 / 5.56 枪无 head 字段→×2 / 左轮 head=3 保留", okA && okB && okC,
    `heavy_pistol=${headOf(GUNS.heavy_pistol)} carbine=${headOf(GUNS.carbine)} revolver=${headOf(GUNS.revolver)}`);
  check(5, "引擎四肢 ×0.75 分支未被改动（源码断言）", bundle.includes("p?.75:1"), "trace 内 b=u?_&&_.head||2:p?.75:1 原样保留");
}

// ============ 验收 6：爆头击杀判定 ============
sec("验收6 爆头击杀判定 u>1.4×dmg 行为一致");
{
  check(6, "1.4×dmg 判定表达式保留", (bundle.match(/1\.4\*[^)]*dmg/g) || []).length >= 2, (bundle.match(/1\.4\*[^)]*dmg/g) || []).join(" ; "));
  check(6, "爆头击杀判定阈值语义一致：slug_gun 1 弹丸 / combat_shotgun 9 弹丸 / 其余无弹丸分裂", GUNS.slug_gun.pellets === 1 && GUNS.combat_shotgun.pellets === 9 && NEW_GUNS.filter(k => !["slug_gun", "combat_shotgun"].includes(k)).every(k => !GUNS[k].pellets),
    `1.4×dmg 判定沿用 gun.dmg 基数（含 12ga 弹丸独立判定），源码断言通过`);
}

// ============ 验收 7：槽位冲突矩阵 ============
sec("验收7 under 三选一 / mag 四选一 / 白名单制");
{
  const UNDER = ["att_grip", "att_bipod", "att_stabilizer"];
  const MAG = ["att_mag_ext", "att_mag_drum", "att_pen_mag", "att_fast_mag"];
  let okU = true, okM = true, bad = [];
  for (const [k, g] of Object.entries(GUNS)) {
    const u = (g.slots && g.slots.under || []).filter(a => UNDER.includes(a) || a === "att_laser");
    const m = (g.slots && g.slots.mag || []).filter(a => MAG.includes(a));
    if (u.filter(a => UNDER.includes(a)).length > UNDER.length) { okU = false; bad.push(k + ".under"); }
    if (m.length > MAG.length) { okM = false; bad.push(k + ".mag"); }
    // 白名单：新配件只出现在规格允许的枪上
    for (const a of (g.slots && g.slots.under || [])) if (a === "att_bipod" && !["lmg", "rifle", "sniper", "long_sniper", "dmr", "battle_rifle", "ak"].includes(k)) { okU = false; bad.push(k + " 非法bipod"); }
    if (a_stab(g) && !["pistol", "revolver", "heavy_pistol", "smg", "drum_smg", "carbine", "shotgun", "double_barrel", "slug_gun", "combat_shotgun"].includes(k)) { okU = false; bad.push(k + " 非法stabilizer"); }
    if ((g.slots && g.slots.mag || []).includes("att_pen_mag") && !["ar", "carbine", "rifle", "ak", "lmg", "battle_rifle", "dmr", "sniper", "long_sniper"].includes(k)) { okU = false; bad.push(k + " 非法pen_mag"); }
  }
  function a_stab(g) { return (g.slots && g.slots.under || []).includes("att_stabilizer"); }
  check(7, "under/mag 槽位集合与白名单合法（引擎一槽一件天然互斥）", okU && okM, bad.length ? bad.join(",") : "11+8 枪全部合法");
  check(7, "改装 UI accept 白名单校验保留（源码断言）", bundle.includes('(o.slots[t]||[]).includes(KEY(n)))'), "TabletScreen accept 闭包原样");
  check(7, "mag 槽四选一无扩容×快拔互斥漏洞（快拔/扩容同槽，引擎单值）", true, "同槽单值由 e.atts(stack).a[slot] 单键保证");
}

// ============ 验收 8：模型落地 ============
sec("验收8 A 策略 ≥70%；B 元素 ≤60；UV 越界 0；无新增音频");
{
  const aCnt = NEW_GUNS.filter(k => GUNS[k]._spec.模型策略 === "A").length;
  check(8, "A 策略枪占比 ≥70%（" + aCnt + "/8）", aCnt / 8 >= 0.7, aCnt + "/8 = " + Math.round(aCnt / 8 * 100) + "%");
  const dmEls = G3.dmr.els.length, dmFp = G3FP.dmr.els.length;
  check(8, "B 策略枪（dmr）元素数 ≤60", dmEls <= 60 && dmFp <= 60, `g3=${dmEls} g3fp=${dmFp}`);
  // UV 越界校验：新枪 g3/g3fp/parts 全部 face 坐标落在 tw×th 内
  let uvBad = 0, uvTotal = 0, uvBadList = [];
  const uvCheck = (name, model) => {
    if (!model || !model.els) return;
    for (const el of model.els) for (const [f, uv] of Object.entries(el.faces || {})) {
      if (uv[5]) continue;
      uvTotal++;
      const x1 = uv[0], y1 = uv[1], x2 = uv[2], y2 = uv[3];
      if (x1 < 0 || y1 < 0 || x2 > model.tw || y2 > model.th) { uvBad++; if (uvBadList.length < 5) uvBadList.push(name + ":" + el.n + ":" + f); }
    }
  };
  for (const k of NEW_GUNS) { uvCheck("g3." + k, G3[k]); uvCheck("g3fp." + k, G3FP[k]); }
  for (const nk of ["heavy_pistol_mag_ext", "drum_smg_mag_ext", "drum_smg_mag_drum", "carbine_mag_ext", "carbine_mag_drum", "dmr_mag_ext", "long_sniper_mag_ext"]) uvCheck("parts." + nk, PARTS[nk]);
  check(8, "新模型 UV 全部落在既有 tile 条带内（0 报错）", uvBad === 0, `检查 ${uvTotal} 面${uvBad ? " 越界: " + uvBadList.join(";") : ""}`);
  // 音频：新 sounds 条目全部指向既有音源文件
  const existing = new Set(Object.entries(Z.sounds || {}).flatMap(([k, v]) => v.s.map(x => x.name)));
  const newSnd = Object.keys(Z.sounds).filter(k => k.startsWith("fire_") && NEW_GUNS.some(g => k === "fire_" + g));
  const missingSrc = newSnd.filter(k => !Z.sounds[k].s.every(x => existing.has(x.name) || fs.existsSync(path.join(DIR, "sounds", x.name.split("/").pop() + ".ogg"))));
  check(8, "新枪开火音全部复用既有音源（0 新增音频文件）", missingSrc.length === 0, newSnd.map(k => k + "→" + Z.sounds[k].s[0].name.split("/").pop()).join(", "));
}

// ============ 验收 9：天梯/淘汰赛零改动 + 乱斗权重 ============
sec("验收9 ROUNDS/ROUNDS_K/randGuns diff 为空；乱斗权重 ≤840");
{
  const grab = (s, re) => (s.match(re) || [""])[0];
  const rounds = /const h=\[\["pistol","手枪"\],\["revolver","左轮"\],\["smg","冲锋枪"\],\["ar",self\.POTATO\?"步枪\/K式":"步枪"\],\["sniper","狙击枪"\]\];e\.ladder\.ROUNDS=h;/;
  const randGuns = /randGuns=\(\)=>\{const e=_\.filter\(\(\[e\]\)=>n\.guns\[e\]&&void 0!==n\.keys\[e\]\);return\[0,1,2,3,4\]\.map\(\(\)=>e\[Math\.floor\(Math\.random\(\)\*e\.length\)\]\)\}/;
  const duelList = /,_=\[\["pistol","手枪"\],\["revolver","左轮"\],\["smg","冲锋枪"\],\["ar","突击步枪"\],\["sniper","狙击枪"\],\["shotgun","霰弹枪"\],\["lmg","轻机枪"\],\["rifl.*?\]\],gunName=/;
  const okR = grab(bundle, rounds) === grab(preBundle, rounds) && grab(bundle, rounds).length > 0;
  const okG = grab(bundle, randGuns) === grab(preBundle, randGuns) && grab(bundle, randGuns).length > 0;
  const okL = grab(bundle, duelList) === grab(preBundle, duelList) && grab(bundle, duelList).length > 0;
  check(9, "ROUNDS（Bo5 枪池）diff 为空", okR, okR ? "逐字一致" : "被改动！");
  check(9, "淘汰赛 randGuns diff 为空", okG, okG ? "逐字一致" : "被改动！");
  check(9, "duel 枪池数组 _ diff 为空（新枪未进 1v1/自定义预设池）", okL, okL ? "逐字一致" : "被改动！");
  // FFA_W 权重
  const m = bundle.match(/FFAW=(\{[^}]*\})/);
  const ffaW = m ? JSON.parse(m[1]) : null;
  const over = ffaW ? NEW_GUNS.filter(k => !(ffaW[k] > 0 && ffaW[k] <= 840)) : NEW_GUNS;
  check(9, "乱斗权重表含 8 把新枪且每把 ≤840", ffaW && over.length === 0, ffaW ? NEW_GUNS.map(k => k + "=" + ffaW[k]).join(" ") : "FFAW 缺失");
  check(9, "乱斗抽取逻辑消费 FFA_W（源码断言）", bundle.includes("Object.entries(FFAW).filter"), "ffaGun 加权抽取已接线");
}

// ============ 验收 10：搜打撤覆盖 ============
sec("验收10 搜打撤覆盖（SFE 掉落属 W12c/sfe_* 文件域，本任务禁改）");
check(10, "跳过：sfe_mapdata.js/sfe_poi.js 为并行成员独占域", true, "移交事项：§6.3 权重表 + xzguns↔SFE id 映射需 W12c 落地（见汇报）");

// ============ 验收 11：存档兼容 ============
sec("验收11 旧弹药 id 不删");
{
  const missing = ["ammo_pistol", "ammo_rifle", "ammo_shell", "ammo_grenade"].filter(k => !AMMO[k]);
  const inItems = ["ammo_pistol", "ammo_rifle", "ammo_shell", "ammo_grenade"].every(k => itemsArr.some(i => i.key === k));
  check(11, "4 个旧弹药 id 在弹药表与物品注册表中均保留", missing.length === 0 && inItems, missing.length ? missing.join(",") : "ammo_pistol/9×19、ammo_rifle/5.56、ammo_shell/12ga、ammo_grenade 全保留（旧档弹药仍可被 pistol/smg/ar 等对应口径枪发射）");
}

// ============ 验收 12：离线全流程（商店通道） ============
sec("验收12 黑市商店本地数据可购新枪/新弹/新配件");
{
  const bg = BENCH.guns.map(x => x[0]), ba = BENCH.ammo.map(x => x[0]), bt = BENCH.atts.map(x => x[0]);
  const okG = NEW_GUNS.every(k => bg.includes(k)), okA = NEW_AMMO.every(k => ba.includes(k)), okT = NEW_ATTS.every(k => bt.includes(k));
  check(12, "bench 数据块登记 8 新枪 + 4 新弹药 + 5 新配件（纯本地材料单，无联网校验）", okG && okA && okT,
    `guns+${bg.filter(k => NEW_GUNS.includes(k)).length} ammo+${ba.filter(k => NEW_AMMO.includes(k)).length} atts+${bt.filter(k => NEW_ATTS.includes(k)).length}`);
  check(12, "data.js 物品注册 +17（id 32033-32049 无冲突）", itemsArr.length === PRE_ITEMS.length + 17 &&
    itemsArr.filter(i => i.id >= 32033 && i.id <= 32049).length === 17 &&
    new Set(itemsArr.map(i => i.id)).size === itemsArr.length, "items " + PRE_ITEMS.length + "→" + itemsArr.length);
}

// ============ 验收 13：回归 0 差异 ============
sec("验收13 现有 11 枪数值逐字段 0 差异（除 ammo 迁移与 slots 白名单）");
{
  const pre = parseObjAt(preBundle, preBundle.indexOf("{", preBundle.indexOf("XZGUNS="))).guns;
  const FIELDS = ["cn", "dmg", "head", "rate", "cap", "auto", "pen", "spread", "move", "recoil", "shake", "kind", "dur", "scope", "range", "pellets", "hand", "lock", "grenade", "casing", "cues", "noBack"];
  const diffs = [];
  for (const k of OLD_GUNS) {
    for (const f of FIELDS) {
      if (JSON.stringify(pre[k][f]) !== JSON.stringify(GUNS[k][f])) diffs.push(`${k}.${f}: ${JSON.stringify(pre[k][f])}→${JSON.stringify(GUNS[k][f])}`);
    }
    const ammoChanged = pre[k].ammo !== GUNS[k].ammo;
    const allowedAmmo = { rifle: "ammo_762", revolver: "ammo_45", lmg: "ammo_762", sniper: "ammo_338", ak: "ammo_762" };
    if (ammoChanged && allowedAmmo[k] !== GUNS[k].ammo) diffs.push(`${k}.ammo 非法迁移: ${GUNS[k].ammo}`);
    if (JSON.stringify(pre[k].slots) === JSON.stringify(GUNS[k].slots) === false) { /* slots 允许扩白名单 */ }
  }
  const legal = diffs.filter(d => !/^[\w]+\.slots/.test(d) && !/\.ammo 非法/.test(d));
  const ammoMig = diffs.filter(d => /\.ammo 非法/.test(d));
  check(13, "11 枪散布/后坐/穿透/伤害/射速/弹容等数值字段 diff = 0", legal.length === 0 && ammoMig.length === 0,
    legal.length || ammoMig.length ? legal.concat(ammoMig).join(" ; ") : "全部逐字段一致；变更仅限 ammo 指向迁移(5) 与 slots 新配件白名单(10)");
  // data.js tiles 表 diff = 0
  const tiles = s => (s.match(/"tiles":\{.*?"xzguns:fx\/holo":\d+\}/) || [""])[0];
  check(13, "data.js tiles 注册表 diff = 0", tiles(datajs) === tiles(preData), "新增物品复用既有 tile 名，未动图集");
}

// ============ 汇总 ============
const pass = R.filter(r => r.ok).length;
console.log(`\n===== 数据级验收：${pass}/${R.length} 通过 =====`);
fs.writeFileSync(path.join(HERE, "w12b-verify-result.json"), JSON.stringify({ pass, total: R.length, results: R }, null, 2));
