// W12b S3 枪械扩展实现脚本（GDD 08-weapon-expansion-spec.md）
// 用精确锚点对 src/mods/xzguns/bundle.js 与 data.js 做数据块插入/替换。
// 运行前自动备份原文件到本目录（bundle.pre-w12b.js / data.pre-w12b.js）。
// 幂等保护：检测到已含 w12b 标记时拒绝重复执行。
"use strict";
const fs = require("fs");
const path = require("path");
const HERE = __dirname;
const DIR = "/workspace/src/mods/xzguns";

function must1(s, needle, label) {
  const c = s.split(needle).length - 1;
  if (c !== 1) throw new Error(`锚点非唯一(${c}): ${label}`);
  return needle;
}
// 从 openIdx 处的 '{' 开始做括号配对（感知字符串），返回闭合 '}' 下标
function matchBrace(s, openIdx) {
  let depth = 0, inStr = false, q = "";
  for (let i = openIdx; i < s.length; i++) {
    const c = s[i];
    if (inStr) { if (c === "\\") { i++; continue; } if (c === q) inStr = false; continue; }
    if (c === '"' || c === "'") { inStr = true; q = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return i; }
  }
  throw new Error("括号配对失败 @" + openIdx);
}
// 在 [from,to] 范围内找 `key:{` 并返回 {start,end}（含整个对象字面量）
function findObj(s, from, to, key) {
  const pat = key + ":{";
  let i = s.indexOf(pat, from);
  if (i < 0 || i > to) throw new Error("找不到对象: " + key);
  const open = i + pat.length - 1;
  const end = matchBrace(s, open);
  return { start: i, end, lit: s.slice(i, end + 1) };
}
function parseLit(lit) {
  // 兼容两种输入：完整对象 "{k:v,...}" 与单条目 "key:{...}"（后者包一层解析后取内层值）
  if (lit.startsWith("{")) return new Function('"use strict";return (0,' + lit + ")")();
  const wrap = new Function('"use strict";return (0,{' + lit + "})")();
  return wrap[Object.keys(wrap)[0]];
}
function rep1(s, oldStr, newStr, label) {
  must1(s, oldStr, label);
  const out = s.replace(oldStr, () => newStr);
  console.log("  [ok] " + label);
  return out;
}

// ============================== 枪械定义 ==============================
const NEW_GUNS = {
  heavy_pistol: { base: "pistol", def: { cn: "重型手枪", ammo: "ammo_45", dmg: 6, head: 2.5, rate: 3.5, cap: 8, auto: false, pen: 1.2, spread: [1.5, .2], recoil: 4, kind: "mag", dur: 500, hand: true, lock: { bone: "slide", pos: [0, 0, 6] },
    slots: { optic: ["att_reddot"], muzzle: ["att_suppressor", "att_brake"], under: ["att_laser", "att_stabilizer"], mag: ["att_mag_ext", "att_fast_mag"] }, casing: .45 } },
  drum_smg: { base: "smg", def: { cn: "弹鼓冲锋枪", ammo: "ammo_pistol", dmg: 2.5, rate: 15, cap: 50, auto: true, pen: .8, spread: [3.5, 1.5], move: 3, recoil: .9, kind: "mag", dur: 900,
    slots: { optic: ["att_reddot", "att_scope3"], muzzle: ["att_suppressor", "att_brake"], under: ["att_grip", "att_stabilizer"], side: ["att_laser"], mag: ["att_mag_ext", "att_mag_drum", "att_fast_mag"] }, casing: .4 } },
  carbine: { base: "ar", def: { cn: "卡宾枪", ammo: "ammo_rifle", dmg: 4, rate: 10, cap: 25, auto: true, pen: 1.8, spread: [.7, .2], move: 3, recoil: .8, kind: "mag", dur: 900,
    slots: { optic: ["att_reddot", "att_scope4", "att_scope3"], muzzle: ["att_suppressor", "att_brake"], under: ["att_grip", "att_stabilizer"], side: ["att_laser"], mag: ["att_mag_ext", "att_mag_drum", "att_pen_mag", "att_fast_mag"] }, casing: .42 } },
  battle_rifle: { base: "ak", def: { cn: "重型战斗步枪", ammo: "ammo_762", dmg: 6, rate: 6, cap: 20, auto: true, pen: 3, spread: [.8, .15], move: 5, recoil: 2.2, kind: "mag", dur: 900,
    slots: { optic: ["att_reddot", "att_scope4", "att_scope3"], muzzle: ["att_suppressor", "att_brake"], under: ["att_bipod"], side: ["att_laser"], mag: ["att_mag_ext", "att_mag_drum", "att_pen_mag", "att_fast_mag"] }, casing: .45 } },
  dmr: { base: "rifle", def: { cn: "精确射手步枪", ammo: "ammo_762", dmg: 9, rate: 2.5, cap: 10, auto: false, pen: 3, spread: [.5, 0], move: 5, recoil: 5, kind: "mag", dur: 600, scope: 4,
    slots: { optic: ["att_reddot", "att_scope4", "att_scope8", "att_scope3"], muzzle: ["att_suppressor", "att_brake"], under: ["att_bipod"], side: ["att_laser"], mag: ["att_mag_ext", "att_pen_mag", "att_fast_mag"] }, casing: .8 } },
  slug_gun: { base: "shotgun", def: { cn: "独头弹霰弹枪", ammo: "ammo_shell", dmg: 14, pellets: 1, rate: 1.5, cap: 5, auto: false, pen: 1.5, spread: [3, .8], recoil: 8, shake: 2, kind: "round", dur: 500, range: 60,
    slots: { optic: ["att_reddot"], muzzle: ["att_brake"], under: ["att_stabilizer"], side: ["att_laser"] }, casing: .9 } },
  combat_shotgun: { base: "shotgun", def: { cn: "战斗霰弹", ammo: "ammo_shell", dmg: 1.2, pellets: 9, rate: 3, cap: 8, auto: false, pen: .3, spread: [5, 4], recoil: 6, shake: 1.8, kind: "mag", dur: 600, range: 40,
    slots: { optic: ["att_reddot"], muzzle: ["att_suppressor", "att_brake"], under: ["att_stabilizer"], side: ["att_laser"], mag: ["att_mag_ext", "att_fast_mag"] },
    cues: { reload: [[.58, "mag_out", .7], [1.38, "shell_insert", .8]], reload_empty: [[.58, "mag_out", .7], [1.38, "shell_insert", .8], [2.1, "charging_handle", .8]] }, casing: .9 } },
  long_sniper: { base: "sniper", def: { cn: "远程狙击步枪", ammo: "ammo_338", dmg: 30, rate: .55, cap: 5, auto: false, pen: 6.5, spread: [5, 0], move: 7, recoil: 11, shake: 2.2, kind: "mag", dur: 600, scope: 8,
    slots: { optic: ["att_reddot", "att_scope4", "att_scope8"], muzzle: ["att_suppressor", "att_brake"], under: ["att_bipod"], side: ["att_laser"], mag: ["att_mag_ext", "att_pen_mag", "att_fast_mag"] }, casing: 1.2 } },
};
const GUN_ORDER = ["heavy_pistol", "drum_smg", "carbine", "battle_rifle", "dmr", "slug_gun", "combat_shotgun", "long_sniper"];

// 差异化定位（规格 §4.2）
const SPEC_RIVAL = {
  heavy_pistol: "pistol/revolver", drum_smg: "smg", carbine: "ar", battle_rifle: "ar/ak",
  dmr: "rifle/sniper", slug_gun: "shotgun/double_barrel", combat_shotgun: "shotgun/double_barrel", long_sniper: "sniper",
};
const SPEC_WHY = {
  heavy_pistol: ".45 停止力补手枪单发与左轮容错之间的空档（head 2.5）",
  drum_smg: "50 发弹容+15 射速换低单发与差开镜精度，压制流",
  carbine: "射速+1 单发-0.5 pen-0.2 弹容-5，移动惩罚 3，机动射手流",
  battle_rifle: "7.62 全自动唯一枪，单发 6 + pen 3 打掩体消耗战，代价后坐 2.2",
  dmr: "半自动 2.5 发/s 补栓动与狙击之间节奏空档，镜内 0 散布，自带 4 倍镜",
  slug_gun: "12ga 中距精准形态：单弹丸 14 伤 range 60",
  combat_shotgun: "8 容+半自动 3 发/s 持续压制，单发弱于泵动",
  long_sniper: "极端化：30 伤/pen6.5/0.55 发/s/5 发弹容，自带 8 倍镜",
};

const NEW_ATTS = {
  att_bipod: { cn: "两脚架", slot: "under", bipod: true },
  att_pen_mag: { cn: "穿甲弹匣", slot: "mag", pen: 1.5, dmgmul: .9 },
  att_stabilizer: { cn: "枪托稳定器", slot: "under", air: 1.5 },
  att_fast_mag: { cn: "快拔弹匣", slot: "mag", slow: .8 },
  att_scope3: { cn: "轻量 3 倍镜", slot: "optic", zoom: .4, scope: 3 },
};
const ATT_ORDER = ["att_bipod", "att_pen_mag", "att_stabilizer", "att_fast_mag", "att_scope3"];

const NEW_AMMO = {
  ammo_45: { cn: ".45 重型手枪弹" },
  ammo_762: { cn: "7.62 全威力弹" },
  ammo_338: { cn: ".338 马格南狙击弹" },
  ammo_potato: { cn: "土豆动能弹" },
};
const AMMO_ORDER = ["ammo_45", "ammo_762", "ammo_338", "ammo_potato"];

// 口径迁移：只改 ammo 指向，枪数值不动（规格 §3.2-5）
const MIGRATE = [
  ["rifle:{cn:\"栓动步枪\",ammo:\"ammo_rifle\"", "rifle:{cn:\"栓动步枪\",ammo:\"ammo_762\"", "栓动步枪→7.62"],
  ["revolver:{cn:\"左轮手枪\",ammo:\"ammo_pistol\"", "revolver:{cn:\"左轮手枪\",ammo:\"ammo_45\"", "左轮→.45"],
  ["lmg:{cn:\"轻机枪\",ammo:\"ammo_rifle\"", "lmg:{cn:\"轻机枪\",ammo:\"ammo_762\"", "轻机枪→7.62"],
  ["sniper:{cn:\"狙击步枪\",ammo:\"ammo_rifle\"", "sniper:{cn:\"狙击步枪\",ammo:\"ammo_338\"", "狙击→.338"],
  ["ak:{cn:\"K 式突击步枪\",ammo:\"ammo_rifle\"", "ak:{cn:\"K 式突击步枪\",ammo:\"ammo_762\"", "K式→7.62"],
];

// 现有枪槽位白名单扩充（新配件挂枪，规格 §5.1；mag 槽 4 选 1 由同槽互斥天然成立）
const SLOT_EDITS = [
  // 栓动步枪：under +bipod；mag +pen/fast
  ["under:[\"att_grip\"],side:[\"att_laser\"],mag:[\"att_mag_ext\"]},cues:{fire:[[.44,\"bolt_back\"",
   "under:[\"att_grip\",\"att_bipod\"],side:[\"att_laser\"],mag:[\"att_mag_ext\",\"att_pen_mag\",\"att_fast_mag\"]},cues:{fire:[[.44,\"bolt_back\"", "rifle slots"],
  // 突击步枪：mag +pen/fast
  ["mag:[\"att_mag_ext\",\"att_mag_drum\"]},cues:{reload:[[.58,\"mag_out\",.7],[1.38,\"mag_in\",.8]],reload_empty:[[.58,\"mag_out\",.7],[1.38,\"mag_in\",.8],[2.07,\"slide_release\",.8]]}",
   "mag:[\"att_mag_ext\",\"att_mag_drum\",\"att_pen_mag\",\"att_fast_mag\"]},cues:{reload:[[.58,\"mag_out\",.7],[1.38,\"mag_in\",.8]],reload_empty:[[.58,\"mag_out\",.7],[1.38,\"mag_in\",.8],[2.07,\"slide_release\",.8]]}", "ar slots"],
  // 轻机枪：+under bipod；mag +pen/fast
  ["slots:{optic:[\"att_reddot\",\"att_scope4\"],muzzle:[\"att_suppressor\",\"att_brake\"],side:[\"att_laser\"],mag:[\"att_mag_ext\"]},cues:{reload:[[.45,\"break_open\"",
   "slots:{optic:[\"att_reddot\",\"att_scope4\"],muzzle:[\"att_suppressor\",\"att_brake\"],under:[\"att_bipod\"],side:[\"att_laser\"],mag:[\"att_mag_ext\",\"att_pen_mag\",\"att_fast_mag\"]},cues:{reload:[[.45,\"break_open\"", "lmg slots"],
  // 狙击：+under bipod；mag +pen/fast
  ["side:[\"att_laser\"],mag:[\"att_mag_ext\"]},cues:{fire:[[.56,\"bolt_back\"",
   "side:[\"att_laser\"],under:[\"att_bipod\"],mag:[\"att_mag_ext\",\"att_pen_mag\",\"att_fast_mag\"]},cues:{fire:[[.56,\"bolt_back\"", "sniper slots"],
  // K式：+under bipod；新增 mag 槽（pen/fast）
  ["slots:{optic:[\"att_reddot\",\"att_scope4\"],muzzle:[\"att_suppressor\",\"att_brake\"],under:[\"att_grip\"],side:[\"att_laser\"]},cues:{reload:[[.56,\"mag_out\",.75]",
   "slots:{optic:[\"att_reddot\",\"att_scope4\"],muzzle:[\"att_suppressor\",\"att_brake\"],under:[\"att_grip\",\"att_bipod\"],side:[\"att_laser\"],mag:[\"att_pen_mag\",\"att_fast_mag\"]},cues:{reload:[[.56,\"mag_out\",.75]", "ak slots"],
  // 半自动手枪：under +stabilizer；mag +fast
  ["under:[\"att_laser\"],mag:[\"att_mag_ext\"]},cues:{reload:[[.48,\"mag_out\"",
   "under:[\"att_laser\",\"att_stabilizer\"],mag:[\"att_mag_ext\",\"att_fast_mag\"]},cues:{reload:[[.48,\"mag_out\"", "pistol slots"],
  // 冲锋枪：under +stabilizer；mag +fast
  ["under:[\"att_grip\"],side:[\"att_laser\"],mag:[\"att_mag_ext\",\"att_mag_drum\"]},cues:{reload:[[.58,\"mag_out\",.7],[1.38,\"mag_in\",.8]],reload_empty:[[.58,\"mag_out\",.7],[1.38,\"mag_in\",.8],[2.1,\"charging_handle\",.8]]},casing:.4}",
   "under:[\"att_grip\",\"att_stabilizer\"],side:[\"att_laser\"],mag:[\"att_mag_ext\",\"att_mag_drum\",\"att_fast_mag\"]},cues:{reload:[[.58,\"mag_out\",.7],[1.38,\"mag_in\",.8]],reload_empty:[[.58,\"mag_out\",.7],[1.38,\"mag_in\",.8],[2.1,\"charging_handle\",.8]]},casing:.4}", "smg slots"],
  // 左轮：+under stabilizer
  ["hand:!0,slots:{optic:[\"att_reddot\"]},cues:{fire:[[.3,\"revolver_cock\"",
   "hand:!0,slots:{optic:[\"att_reddot\"],under:[\"att_stabilizer\"]},cues:{fire:[[.3,\"revolver_cock\"", "revolver slots"],
  // 双管：空槽 → stabilizer
  ["slots:{},cues:{reload:[[.18,\"break_open\"",
   "slots:{under:[\"att_stabilizer\"]},cues:{reload:[[.18,\"break_open\"", "double_barrel slots"],
  // 泵动霰弹：+under stabilizer
  ["slots:{optic:[\"att_reddot\"],muzzle:[\"att_brake\"],side:[\"att_laser\"]},cues:{fire:[[.4,\"pump_back\"",
   "slots:{optic:[\"att_reddot\"],muzzle:[\"att_brake\"],under:[\"att_stabilizer\"],side:[\"att_laser\"]},cues:{fire:[[.4,\"pump_back\"", "shotgun slots"],
];

// 新枪开火音效 → 复用现有音源（规格 §4.3：不新增音频文件）
const FIRE_SOUND = {
  heavy_pistol: "fire_revolver", drum_smg: "fire_smg", carbine: "fire_ar", battle_rifle: "fire_ar",
  dmr: "fire_rifle", slug_gun: "fire_shotgun", combat_shotgun: "fire_shotgun", long_sniper: "fire_sniper",
};

// 模型变体（策略 A 克隆 + 几何变换；策略 B dmr 为 rifle 精简子集）
// z 规则：正则→缩放系数；元素 f/t 的 z 分量按系数缩放（UV 不动，复用既有 tile 条带）
const MODEL_PLAN = {
  heavy_pistol: { base: "pistol", z: [["^slide_", 1.12]] },
  drum_smg: { base: "smg", z: [["^barrel_", 1.06], ["^hider_", 1.06], ["^stock_", 1.04]] },
  carbine: { base: "ar", z: [["^barrel_", .8], ["^hider_", .8], ["^handguard_", .85]] },
  battle_rifle: { base: "ak", z: [["^barrel_", 1.05], ["^brake_", 1.05]] },
  dmr: { base: "rifle", subset: /^(hider_1|barrel_|handguard_|rail_1|rail_teeth_[123]$|under_rail_1|upper_|lower_|guard_|grip_[123]$|tube_|stock_[1234]$|butt_1|sf_base_1|sf_post_1|sr_base_1|sr_ear_l_1|sr_ear_r_1|charge_1|trigger_|mag_body_|mag_base_1|mag_round_1|case_1|flash_a_|flash_tip_1|flash_disc_|flash_v_1|flash_h_1)/, z: [["^barrel_", 1.3], ["^hider_", 1.3]] },
  slug_gun: { base: "shotgun", z: [["^barrel_", 1.3], ["^tube_1", 1.25]] },
  combat_shotgun: { base: "shotgun", z: [["^tube_1", 1.15]] },
  long_sniper: { base: "sniper", z: [["^barrel_", 1.25], ["^brake_", 1.2]] },
};
// 需要克隆 parts（弹匣外观）的新枪：parts[新枪_mag_ext] ← parts[基枪_mag_ext]
const PARTS_PLAN = [
  ["heavy_pistol_mag_ext", "pistol_mag_ext"],
  ["drum_smg_mag_ext", "smg_mag_ext"], ["drum_smg_mag_drum", "smg_mag_drum"],
  ["carbine_mag_ext", "ar_mag_ext"], ["carbine_mag_drum", "ar_mag_drum"],
  ["dmr_mag_ext", "rifle_mag_ext"],
  ["long_sniper_mag_ext", "sniper_mag_ext"],
];

// 乱斗权重表：现有枪沿用 N-61 文档权重，新枪 ≤840（规格 §7.2）
const FFA_W = { pistol: 1400, revolver: 2200, smg: 1700, ar: 2e3, ak: 2100, lmg: 3500, rifle: 2200, sniper: 2600, shotgun: 2600, double_barrel: 2e3,
  heavy_pistol: 600, drum_smg: 500, carbine: 520, battle_rifle: 480, dmr: 420, slug_gun: 500, combat_shotgun: 520, long_sniper: 380 };

// data.js 新物品注册（id 接续 32032；tex/layers 复用既有图集 tile 名）
const ITEM_IDS = {
  ammo_45: 32033, ammo_762: 32034, ammo_338: 32035, ammo_potato: 32036,
  att_bipod: 32037, att_pen_mag: 32038, att_stabilizer: 32039, att_fast_mag: 32040, att_scope3: 32041,
  heavy_pistol: 32042, drum_smg: 32043, carbine: 32044, battle_rifle: 32045, dmr: 32046,
  slug_gun: 32047, combat_shotgun: 32048, long_sniper: 32049,
};
const ITEM_TEX = {
  ammo_45: "xzguns:item/ammo_pistol", ammo_762: "xzguns:item/ammo_rifle", ammo_338: "xzguns:item/ammo_rifle", ammo_potato: "xzguns:item/ammo_pistol",
  att_bipod: "xzguns:item/att_grip", att_pen_mag: "xzguns:item/att_mag_ext", att_stabilizer: "xzguns:item/att_grip", att_fast_mag: "xzguns:item/att_mag_ext", att_scope3: "xzguns:item/att_scope4",
  heavy_pistol: "xzguns:item/pistol", drum_smg: "xzguns:item/smg", carbine: "xzguns:item/ar", battle_rifle: "xzguns:item/ak",
  dmr: "xzguns:item/sniper", slug_gun: "xzguns:item/shotgun", combat_shotgun: "xzguns:item/shotgun", long_sniper: "xzguns:item/sniper",
};
const ITEM_CN = { ammo_45: ".45 重型手枪弹", ammo_762: "7.62 全威力弹", ammo_338: ".338 马格南狙击弹", ammo_potato: "土豆动能弹",
  att_bipod: "两脚架", att_pen_mag: "穿甲弹匣", att_stabilizer: "枪托稳定器", att_fast_mag: "快拔弹匣", att_scope3: "轻量 3 倍镜" };
Object.entries(NEW_GUNS).forEach(([k, v]) => { ITEM_CN[k] = v.def.cn; });
const GUN_DUR = {}; GUN_ORDER.forEach(k => { GUN_DUR[k] = NEW_GUNS[k].def.dur; });

// ============================== 主流程 ==============================
console.log("== W12b apply ==");
const bak = (f) => { const src = path.join(DIR, f), dst = path.join(HERE, f.replace(".js", ".pre-w12b.js")); if (!fs.existsSync(dst)) fs.copyFileSync(src, dst); };
bak("bundle.js"); bak("data.js");

let S = fs.readFileSync(path.join(DIR, "bundle.js"), "utf8");
if (S.includes("att_pen_mag:{cn:")) throw new Error("bundle.js 似乎已包含 W12b 改动，拒绝重复执行");
let D = fs.readFileSync(path.join(DIR, "data.js"), "utf8");
if (D.includes('"key":"ammo_45"')) throw new Error("data.js 似乎已包含 W12b 改动，拒绝重复执行");

// ---- 解析现有数据（用于克隆 cues 等） ----
const gunsObjStart = S.indexOf('guns:{') + 5;
const gunsObjEnd = matchBrace(S, gunsObjStart);
const GUNS = parseLit(S.slice(gunsObjStart, gunsObjEnd + 1));

// ---- 1. 口径迁移 ----
for (const [o, n, label] of MIGRATE) S = rep1(S, o, n, "迁移: " + label);

// ---- 2. 现有枪槽位白名单 ----
for (const [o, n, label] of SLOT_EDITS) S = rep1(S, o, n, "槽位: " + label);

// ---- 3. 枪械定义块：追加 8 把新枪 ----
const gunLits = GUN_ORDER.map(id => {
  const { base, def } = NEW_GUNS[id];
  const b = GUNS[base];
  const cues = def.cues || b.cues; // 未显式给 cues 则克隆基枪
  const d = Object.assign({}, b, def, { cues });
  // 规格三标注（口径 / 差异化对手 / 模型策略），引擎忽略未知字段，仅供验收断言
  d._spec = { 口径: d.ammo, 对手: SPEC_RIVAL[id], 差异: SPEC_WHY[id], 模型策略: MODEL_PLAN[id].subset ? "B" : "A" };
  if (!d.cues) throw new Error(id + " 缺 cues");
  return id + ":" + JSON.stringify(d);
}).join(",");
S = rep1(S, "casing:null}},ammo:{ammo_pistol:{cn:\"手枪弹\"", "casing:null}," + gunLits + "},ammo:{ammo_pistol:{cn:\"手枪弹\"", "guns+8 新枪");

// ---- 4. 弹药表：4 现有口径归位命名 + 4 新增 ----
const ammoLit = "ammo:{" +
  ["ammo_pistol:{cn:\"9×19 手枪弹\"}", "ammo_rifle:{cn:\"5.56 中间威力弹\"}", "ammo_shell:{cn:\"12ga 霰弹\"}", "ammo_grenade:{cn:\"榴弹\"}"]
    .concat(AMMO_ORDER.map(k => k + ":" + JSON.stringify(NEW_AMMO[k]))).join(",") + "}";
S = rep1(S, "ammo:{ammo_pistol:{cn:\"手枪弹\"},ammo_rifle:{cn:\"步枪弹\"},ammo_shell:{cn:\"霰弹\"},ammo_grenade:{cn:\"榴弹\"}}", ammoLit, "弹药表 8 口径");

// ---- 5. 配件表：+5 ----
const attLit = ATT_ORDER.map(k => k + ":" + JSON.stringify(NEW_ATTS[k])).join(",");
S = rep1(S, "att_mag_drum:{cn:\"弹鼓\",slot:\"mag\",cap:2.5,slow:1.3}}", "att_mag_drum:{cn:\"弹鼓\",slot:\"mag\",cap:2.5,slow:1.3}," + attLit + "}", "配件表 +5");

// ---- 6. 黑市商店价目 ----
const benchGuns = [
  ["heavy_pistol", 1, { iron_ingot: 5, copper_ingot: 3 }],
  ["drum_smg", 1, { iron_ingot: 10, copper_ingot: 5, redstone: 2 }],
  ["carbine", 1, { iron_ingot: 9, copper_ingot: 3, redstone: 2 }],
  ["battle_rifle", 1, { iron_ingot: 12, copper_ingot: 5, redstone: 2, gold_ingot: 1 }],
  ["dmr", 1, { iron_ingot: 11, "#planks": 3, copper_ingot: 3, redstone: 2 }],
  ["slug_gun", 1, { iron_ingot: 8, "#planks": 2, copper_ingot: 2 }],
  ["combat_shotgun", 1, { iron_ingot: 9, "#planks": 2, copper_ingot: 3, redstone: 1 }],
  ["long_sniper", 1, { iron_ingot: 14, copper_ingot: 4, glass: 3, redstone: 2, diamond: 1 }],
].map(x => JSON.stringify(x)).join(",");
S = rep1(S, "[\"launcher\",1,{iron_ingot:10,copper_ingot:4,redstone:3}]]", "[\"launcher\",1,{iron_ingot:10,copper_ingot:4,redstone:3}]," + benchGuns + "]", "商店·枪价目");

const benchAmmo = [
  ["ammo_45", 10, { copper_ingot: 1, gunpowder: 1, iron_nugget: 1 }],
  ["ammo_762", 8, { copper_ingot: 1, gunpowder: 2, iron_nugget: 2 }],
  ["ammo_338", 6, { copper_ingot: 2, gunpowder: 2, iron_nugget: 2 }],
  ["ammo_potato", 10, { potato: 2, gunpowder: 1 }],
].map(x => JSON.stringify(x)).join(",");
S = rep1(S, "[\"ammo_grenade\",2,{gunpowder:4,iron_ingot:1,copper_ingot:1}]]", "[\"ammo_grenade\",2,{gunpowder:4,iron_ingot:1,copper_ingot:1}]," + benchAmmo + "]", "商店·弹药价目");

const benchAtts = [
  ["att_bipod", 1, { iron_ingot: 4, "#planks": 2, copper_ingot: 1 }],
  ["att_pen_mag", 1, { iron_ingot: 4, copper_ingot: 2, diamond: 1 }],
  ["att_stabilizer", 1, { iron_ingot: 3, "#planks": 2, leather: 1 }],
  ["att_fast_mag", 1, { iron_ingot: 2, copper_ingot: 2 }],
  ["att_scope3", 1, { iron_ingot: 3, glass: 2, redstone: 1 }],
].map(x => JSON.stringify(x)).join(",");
S = rep1(S, "[\"att_mag_drum\",1,{iron_ingot:6,copper_ingot:2}]]", "[\"att_mag_drum\",1,{iron_ingot:6,copper_ingot:2}]," + benchAtts + "]", "商店·配件价目");

// ---- 7. keys 映射 ----
const keyLits = [...GUN_ORDER, ...AMMO_ORDER, ...ATT_ORDER].map(k => k + ":\"" + k + "\"").join(",");
S = rep1(S, "att_mag_drum:\"att_mag_drum\",tablet:\"tablet\"", "att_mag_drum:\"att_mag_drum\"," + keyLits + ",tablet:\"tablet\"", "keys 映射 +17");

// ---- 8. g3 第三人称模型克隆 ----
{
  const g3s = S.indexOf("{rifle:{els:"); // g3 块起点
  if (g3s < 0) throw new Error("找不到 g3 块");
  const g3e = matchBrace(S, g3s);
  const l = findObj(S, g3s, g3e, "launcher");
  const models = GUN_ORDER.map(id => {
    const plan = MODEL_PLAN[id];
    const src = findObj(S, g3s, g3e, plan.base);
    const obj = parseLit(S.slice(src.start, src.end + 1));
    obj.src = id + ".bbmodel";
    let els = obj.els;
    if (plan.subset) {
      els = els.filter(e => plan.subset.test(e.n));
      if (els.length > 60) throw new Error(id + " 子集元素数 " + els.length + " > 60（策略 B 上限）");
    }
    const zOf = n => { for (const [re, k] of plan.z) if (new RegExp(re).test(n)) return k; return 1; };
    els = els.map(e => {
      const k = zOf(e.n);
      if (k !== 1) { e = Object.assign({}, e); e.f = [e.f[0], e.f[1], +(e.f[2] * k).toFixed(3)]; e.t = [e.t[0], e.t[1], +(e.t[2] * k).toFixed(3)]; }
      return e;
    });
    obj.els = els;
    return id + ":" + JSON.stringify(obj);
  }).join(",");
  S = S.slice(0, l.end + 1) + "," + models + S.slice(l.end + 1);
  console.log("  [ok] g3 模型克隆 8 把");
  // 打印 dmr 元素数
  const dm = findObj(S, g3s, matchBrace(S, g3s), "dmr");
  const dmObj = parseLit(S.slice(dm.start, dm.end + 1));
  console.log("  [info] dmr els=" + dmObj.els.length + " bones=" + (dmObj.bones || []).length);
}

// ---- 9. g3fp 第一人称模型克隆 ----
{
  const fps = S.indexOf("g3fp:{") + 5;
  const fpe = matchBrace(S, fps);
  const l = findObj(S, fps, fpe, "launcher");
  const models = GUN_ORDER.map(id => {
    const plan = MODEL_PLAN[id];
    const src = findObj(S, fps, fpe, plan.base);
    const obj = parseLit(S.slice(src.start, src.end + 1));
    obj.src = id + "_fp.bbmodel";
    let els = obj.els;
    if (plan.subset) els = els.filter(e => plan.subset.test(e.n));
    const zOf = n => { for (const [re, k] of plan.z) if (new RegExp(re).test(n)) return k; return 1; };
    els = els.map(e => {
      const k = zOf(e.n);
      if (k !== 1) { e = Object.assign({}, e); e.f = [e.f[0], e.f[1], +(e.f[2] * k).toFixed(3)]; e.t = [e.t[0], e.t[1], +(e.t[2] * k).toFixed(3)]; }
      return e;
    });
    obj.els = els;
    return id + ":" + JSON.stringify(obj);
  }).join(",");
  S = S.slice(0, l.end + 1) + "," + models + S.slice(l.end + 1);
  console.log("  [ok] g3fp 模型克隆 8 把");
}

// ---- 10. parts 弹匣外观克隆 ----
{
  const anchor = "},keys:{rifle:\"rifle\"";
  if (S.split(anchor).length - 1 !== 1) throw new Error("parts/keys 边界锚点不唯一");
  const ps = S.indexOf("parts:{") + 6;
  const pe = matchBrace(S, ps);
  const lits = PARTS_PLAN.map(([nk, ok2]) => {
    const src = findObj(S, ps, pe, ok2);
    const obj = parseLit(S.slice(src.start, src.end + 1));
    obj.src = nk + ".bbmodel";
    return nk + ":" + JSON.stringify(obj);
  }).join(",");
  S = rep1(S, anchor, "}," + lits + ",keys:{rifle:\"rifle\"", "parts 弹匣外观 +7");
}

// ---- 11. sounds：新枪开火音映射（复用旧音源） ----
{
  const key0 = "workbench_use:{s:[{name:\"../../mods/xzguns/sounds/workbench_use\"";
  const ws = S.indexOf(key0);
  if (ws < 0) throw new Error("找不到 workbench_use 音效条目");
  const open = S.indexOf("{", ws + "workbench_use:".length);
  const end = matchBrace(S, open);
  const snd = GUN_ORDER.map(id => "fire_" + id + ":{s:[{name:\"../../mods/xzguns/sounds/" + FIRE_SOUND[id] + "\",volume:1,pitch:1,weight:1}]}").join(",");
  S = S.slice(0, end + 1) + "," + snd + S.slice(end + 1);
  console.log("  [ok] sounds 开火音映射 +8");
}

// ---- 12. 乱斗：加权抽取表 FFA_W + ffaGun 改加权 ----
{
  const ffaLit = JSON.stringify(FFA_W);
  S = rep1(S, "double_barrel:2e3},x=\"\\0me\"", "double_barrel:2e3},FFAW=" + ffaLit + ",x=\"\\0me\"", "乱斗权重表 FFA_W");
  S = rep1(S,
    "ffaGun=()=>{const e=_.filter(([e])=>n.guns[e]&&void 0!==n.keys[e]);return(e[Math.floor(Math.random()*e.length)]||[\"pistol\"])[0]}",
    "ffaGun=()=>{const e=Object.entries(FFAW).filter(([e])=>n.guns[e]&&void 0!==n.keys[e]);let t=0;for(const n of e)t+=n[1];let r=Math.random()*t;for(const n of e)if((r-=n[1])<=0)return n[0];return\"pistol\"}",
    "ffaGun 加权抽取");
}

// ---- 13. XZ API 挂钩 ----
// 13a. optic(): 枪自带 scope（dmr 4 倍 / long_sniper 8 倍）按倍率给 zoom（sniper scope:8 行为不变）
S = rep1(S,
  "n.optic=t=>{const r=n.attIn(t,\"optic\");if(r)return r;const o=a(t);return o&&o.scope?e.atts[e.keys.att_scope8]:null}",
  "n.optic=t=>{const r=n.attIn(t,\"optic\");if(r)return r;const o=a(t);return o&&o.scope?{zoom:o.scope>=8?.125:1/o.scope,scope:o.scope}:null}",
  "optic() 枪自带倍镜修正");
// 13b. spreadNow(): 腾空总散布系数可被 under 槽枪托稳定器（air 字段）改写，默认 2 不变
S = rep1(S, ",i*=2),i}", ",i*=(n.attIn(t,\"under\")&&n.attIn(t,\"under\").air||2)),i}", "spreadNow 腾空系数挂钩");
// 13c. penOf/dmgOf/steadyMult 助手
S = rep1(S,
  "n.slowOf=e=>{const t=n.attIn(e,\"mag\");return t&&t.slow?t.slow:1};",
  "n.slowOf=e=>{const t=n.attIn(e,\"mag\");return t&&t.slow?t.slow:1},n.penOf=e=>{const t=a(e);if(!t)return 0;const r=n.attIn(e,\"mag\");return Math.min(7,(t.pen||0)+(r&&r.pen?r.pen:0))},n.dmgOf=e=>{const t=a(e);if(!t)return 0;const r=n.attIn(e,\"mag\");return t.dmg*(r&&r.dmgmul?r.dmgmul:1)},n.steadyMult=(t,r)=>{const o=n.attIn(r,\"under\");return o&&o.bipod&&n.aimAmount&&n.aimAmount(t)>.6&&(!t||!t.vel||Math.hypot(t.vel[0],t.vel[2])<.05)?{s:.55,r:.8}:{s:1,r:1}};",
  "penOf/dmgOf/steadyMult 助手");
// 13d. fire(): 穿透/伤害走 penOf/dmgOf（穿甲弹匣），两脚架散布/后坐
S = rep1(S, "u=trace(r,o,d,f,s.pen,s.dmg,s.range||200,i)", "u=trace(r,o,d,f,e.penOf(i),e.dmgOf(i),s.range||200,i)", "fire→penOf/dmgOf");
S = rep1(S, "y=e.cheat&&e.cheat(r,\"nospread\")?0:e.spreadNow(o,i,f);", "y=e.cheat&&e.cheat(r,\"nospread\")?0:e.spreadNow(o,i,f)*e.steadyMult(o,i).s;", "fire→两脚架散布");
S = rep1(S, "e.kick(e.recoilOf(i)*(f?.6:1))", "e.kick(e.recoilOf(i)*(f?.6:1)*e.steadyMult(o,i).r)", "fire→两脚架后坐");

fs.writeFileSync(path.join(DIR, "bundle.js"), S);
console.log("bundle.js 写入完成，长度 " + S.length);

// ============================== data.js ==============================
let T = D;
{
  // items 追加（17 条）
  const items = [];
  for (const k of AMMO_ORDER) items.push({ key: k, id: ITEM_IDS[k], cn: ITEM_CN[k], stack: 64, tab: "xzguns", tex: ITEM_TEX[k] });
  for (const k of ATT_ORDER) items.push({ key: k, id: ITEM_IDS[k], cn: ITEM_CN[k], stack: 1, tab: "xzguns", tex: ITEM_TEX[k] });
  for (const k of GUN_ORDER) items.push({ key: k, id: ITEM_IDS[k], cn: ITEM_CN[k], stack: 1, tab: "xzguns", tex: ITEM_TEX[k], dur: GUN_DUR[k], ench: 14, rep: "iron_ingot" });
  const anchor = "\"key\":\"tablet\",\"id\":32023,\"cn\":\"黑市平板\",\"stack\":1,\"tab\":\"xzguns\",\"tex\":\"xzguns:item/tablet\"}]";
  if (T.split(anchor).length - 1 !== 1) throw new Error("data.js items 尾锚点不唯一");
  T = T.replace(anchor, "\"key\":\"tablet\",\"id\":32023,\"cn\":\"黑市平板\",\"stack\":1,\"tab\":\"xzguns\",\"tex\":\"xzguns:item/tablet\"}," +
    items.map(x => JSON.stringify(x)).join(",") + "]");
  console.log("  [ok] items +17");
}
{
  // models：models 数组追加 + items 映射追加（m 接续 32）
  const modelAnchor = "\"layers\":[\"xzguns:item/tablet\"]}],\"blocks\":{}";
  if (T.split(modelAnchor).length - 1 !== 1) throw new Error("data.js models 尾锚点不唯一");
  const keys = [...AMMO_ORDER, ...ATT_ORDER, ...GUN_ORDER];
  const modelLits = keys.map((k, i) => "{\"name\":\"xzguns:item/" + k + "\",\"ao\":true,\"gen\":true,\"light\":\"side\",\"display\":{},\"layers\":[\"" + ITEM_TEX[k] + "\"]}").join(",");
  const mapLits = keys.map((k, i) => "\"" + k + "\":{\"m\":" + (33 + i) + "}").join(",");
  T = T.replace(modelAnchor, "\"layers\":[\"xzguns:item/tablet\"]}," + modelLits + "],\"blocks\":{}");
  const mapAnchor = "\"tablet\":{\"m\":32}}},\"tags\":{";
  if (T.split(mapAnchor).length - 1 !== 1) throw new Error("data.js models.items 尾锚点不唯一");
  T = T.replace(mapAnchor, "\"tablet\":{\"m\":32}," + mapLits + "}},\"tags\":{");
  console.log("  [ok] models +17 / items 映射 +17");
}
{
  // tags：新枪进 xzguns:guns 与 enchantable/durability
  const gunKeys = GUN_ORDER.map(k => "\"" + k + "\"").join(",");
  const t1 = "\"xzguns:guns\":[\"rifle\",\"revolver\",\"pistol\",\"smg\",\"shotgun\",\"ar\",\"double_barrel\",\"lmg\",\"sniper\",\"ak\",\"launcher\"]";
  if (T.split(t1).length - 1 !== 1) throw new Error("tag xzguns:guns 锚点不唯一");
  T = T.replace(t1, "\"xzguns:guns\":[\"rifle\",\"revolver\",\"pistol\",\"smg\",\"shotgun\",\"ar\",\"double_barrel\",\"lmg\",\"sniper\",\"ak\",\"launcher\"," + gunKeys + "]");
  const t2 = "\"enchantable/durability\":[";
  if (T.split(t2).length - 1 !== 1) throw new Error("tag enchantable 锚点不唯一");
  T = T.replace(t2, "\"enchantable/durability\":[" + gunKeys + ",");
  console.log("  [ok] tags +2 组");
}
fs.writeFileSync(path.join(DIR, "data.js"), T);
console.log("data.js 写入完成，长度 " + T.length);
console.log("== 完成 ==");
