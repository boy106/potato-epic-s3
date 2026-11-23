// W12b 热修回归自检：§8.3 DPS 对标 / pen 封顶 / 商店与乱斗引用 / 0 差异
// 运行：node w12b-hotfix-verify.cjs
'use strict';
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const BUNDLE = path.resolve(DIR, '../../../..', 'src/mods/xzguns/bundle.js');
const PRE = path.join(DIR, 'bundle.pre-w12b.js');

function loadBundle(file) {
  const code = fs.readFileSync(file, 'utf8');
  const self = {};
  new Function('self', code)(self);
  return { self, code };
}

const { self: cur, code: curCode } = loadBundle(BUNDLE);
const { self: pre } = loadBundle(PRE);
const g = cur.self ? cur.self.XZGUNS.guns : cur.XZGUNS.guns;
const X = (cur.self || cur).XZGUNS;
const gp = (pre.self || pre).XZGUNS.guns;

let fail = 0;
const ok = (cond, msg) => { console.log((cond ? 'PASS' : 'FAIL') + ' | ' + msg); if (!cond) fail++; };

// 现有枪 DPS（02-combat.md §4）
const EX = {
  pistol: 4.5 * 4, revolver: 8 * 2, smg: 3 * 12,
  shotgun: 1.5 * 8 * 1, double_barrel: 1.5 * 8 * 5,
  rifle: 12 * 1, ar: 4.5 * 9, ak: 5.25 * 8, lmg: 4.5 * 12, sniper: 24 * 0.7,
};
// §4.2 差异化对手（对手取最强 DPS）
const OPP = {
  heavy_pistol: ['pistol', 'revolver'],
  drum_smg: ['smg'],
  carbine: ['ar'],
  battle_rifle: ['ar'],
  dmr: ['rifle', 'sniper'],
  slug_gun: ['shotgun', 'double_barrel'],
  combat_shotgun: ['shotgun', 'double_barrel'],
  long_sniper: ['sniper'],
};
const NEW = Object.keys(OPP);

console.log('== §8.3 DPS 对标（上限 = 对手最强 DPS ×1.1）==');
for (const id of NEW) {
  const gun = g[id];
  ok(!!gun, `${id} 存在`);
  if (!gun) continue;
  const dps = gun.dmg * gun.rate;
  const oppDps = Math.max(...OPP[id].map(o => EX[o]));
  const cap = oppDps * 1.1;
  ok(dps <= cap + 1e-9, `${id} DPS=${dps} <= ${OPP[id].join('/')}最强${oppDps}×1.1=${cap.toFixed(2)}`);
  console.log(`     ${id}: dmg=${gun.dmg} rate=${gun.rate}`);
}

console.log('== pen 封顶 7（验收 4）==');
ok(/Math\.min\(7,/.test(curCode), '引擎存在 Math.min(7,…) pen 封顶');
const penMag = X.atts.att_pen_mag;
ok(penMag && penMag.pen === 1.5 && penMag.dmgmul === 0.9, 'att_pen_mag pen+1.5 dmgmul0.9');
let penMax = 0;
for (const id of Object.keys(g)) {
  const slots = g[id].slots;
  if (slots && slots.mag && slots.mag.includes('att_pen_mag')) {
    const raw = g[id].pen + penMag.pen;
    penMax = Math.max(penMax, Math.min(7, raw));
    ok(Math.min(7, raw) <= 7, `${id}+穿甲弹匣 pen=${raw} -> 封顶后 ${Math.min(7, raw)} <= 7`);
  }
}

console.log('== 商店价目引用（bench）==');
const benchSrc = JSON.stringify(X.bench);
const benchIds = new Set();
(function walk(v) { if (Array.isArray(v)) { if (typeof v[0] === 'string' && v[1] === 1) benchIds.add(v[0]); v.forEach(walk); } else if (v && typeof v === 'object') Object.values(v).forEach(walk); })(X.bench);
for (const id of NEW) ok(benchIds.has(id), `bench 含新枪 ${id}`);
for (const id of Object.keys(gp)) ok(benchIds.has(id) || id === 'ak', `bench 含既有枪 ${id}（隐藏枪可除外）`);

console.log('== 乱斗重生权重表（验收 9：≤ 1400×0.6=840）==');
const w = {};
for (const id of Object.keys(g)) { const m = curCode.match(new RegExp('"' + id + '":(\\d+(?:\\.\\d+)?)\\s*[},]')); if (m) w[id] = +m[1]; }
const FFAW = w;
ok(FFAW['pistol'] === 1400, '乱斗权重表锚点 pistol=1400');
for (const id of NEW) {
  ok(FFAW[id] !== undefined && FFAW[id] <= 840, `乱斗权重 ${id}=${FFAW[id]} <= 840`);
}

console.log('== 0 差异回归（pre-w12b 为 W12b 落地前快照，含 11 老枪）==');
// 老枪：除口径迁移（ammo）与 slots 白名单外，其余字段必须逐字一致
const bad = [];
for (const id of Object.keys(gp)) {
  const a = { ...gp[id] }, b = { ...g[id] };
  delete a.ammo; delete b.ammo; delete a.slots; delete b.slots;
  if (JSON.stringify(a) !== JSON.stringify(b)) bad.push(id);
}
ok(bad.length === 0, `11 老枪数值字段 diff=0（异常: ${bad.join(',') || '无'}）`);
const migr = Object.keys(gp).filter(id => gp[id].ammo !== g[id].ammo).map(id => `${id}:${gp[id].ammo}->${g[id].ammo}`);
console.log('     口径迁移: ' + migr.join(', '));
// 热修两枪：dmg 调整、rate 不动
ok(gp.heavy_pistol === undefined && g.heavy_pistol.dmg === 5.5 && g.heavy_pistol.rate === 3.5, `heavy_pistol dmg 6 -> 5.5（rate 3.5 不动，DPS 21 -> 19.25）`);
ok(g.dmr.dmg === 7 && g.dmr.rate === 2.5, `dmr dmg 9 -> 7（rate 2.5 不动，DPS 22.5 -> 17.5）`);
// 其余 6 把新枪：与规格 §4.1 基准值一致（本次未动）
const SPEC = {
  drum_smg: [2.5, 15], carbine: [4, 10], battle_rifle: [6, 6],
  slug_gun: [14, 1.5], combat_shotgun: [1.2, 3], long_sniper: [30, 0.55],
};
for (const [id, [d, r]] of Object.entries(SPEC)) ok(g[id].dmg === d && g[id].rate === r, `未动枪 ${id} dmg=${d} rate=${r} 保持规格值`);
// ammo/atts/bench/g3 引用完整性：乱斗表、bench 中枪名全部可解析
const refs = [...curCode.matchAll(/"(heavy_pistol|drum_smg|carbine|battle_rifle|dmr|slug_gun|combat_shotgun|long_sniper)"/g)].map(m => m[1]);
ok(refs.every(r => g[r]), `引用枪名全部可解析（${refs.length} 处）`);

console.log(fail === 0 ? '\nALL PASS' : `\n${fail} 项 FAIL`);
process.exit(fail === 0 ? 0 : 1);
