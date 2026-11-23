#!/usr/bin/env node
/**
 * 土豆史诗 / POTATO EPIC — pack 重建脚本（W0 还原配套）
 *
 * 用法：
 *   node tools/build.mjs [--src ./src] [--out ./dist]
 *
 * 作用：把 src/js/ 下的模块按 tools/pack-order.json 的原始加载顺序
 * 重新打包回 4 个 pack 文件（pack1.js ~ pack4.js），格式与原始
 * build 产物中的内联 loader 完全兼容：
 *
 *   (function(L){for(var i=0;i<L.length;i++){var s=document.createElement("script");
 *    s.text=L[i][1];document.head.appendChild(s);}})([["js/模块名.js","<代码>"],...]);
 *
 * 注意：
 * - 模块间靠全局变量耦合，pack 顺序与 pack 内顺序必须严格保持
 *   （pack1 → pack2 → pack3 → pack4）。
 * - src/js/*.js 是 prettier 格式化过的版本；打回 pack 后与原始
 *   pack 行为等价（已做 transform-aware AST 等价校验），但字节
 *   不与原始 build 产物逐一相同。
 * - 每个 entry 会自动补回 `//# sourceURL=js/xxx.js` 尾注，保证
 *   devtools 里堆栈与原始版本一致。原始 pack 内的 `// min\n`
 *   头标记不再补回（内容已格式化，标记无意义，仅影响字节）。
 *
 * D-010 版本单源（production/release/versioning.md §4）：
 * - GAME_BUILD（src/js/telemetry.js）是唯一事实源，构建时提取并校验
 *   格式（YYYY.MM.DD[a-z]），提取失败即构建失败；
 * - dist/index.html 由 src/index.html 生成：build-number 占位节点填充
 *   为 `BUILD ${GAME_BUILD}`，模块 script 标签按 pack-order.json 替换
 *   为 4 个 pack loader 标签。改一处 GAME_BUILD，重建即全局一致。
 *
 * W8 静态资源复制与完整性自检（根治 D-001/D-005 类「打包漏收」）：
 * - 独立 js（pack 之外的 worker/数据文件）与 mods/、potato/ 目录整拷进 dist；
 * - 构建尾部扫描产物引用（js/*.js、potato/*），凡不在 pack-order 内的 js
 *   引用与静态 potato 路径必须能在 dist 找到对应文件，缺失即构建失败
 *   （fail-fast：skins_data.js 404、potato/ 目录缺失这类事故从此在构建期拦截）。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, def) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : def;
};
const SRC = path.resolve(here, '..', arg('--src', 'src'));
const OUT = path.resolve(here, '..', arg('--out', 'dist'));
const orderFile = path.join(here, 'pack-order.json');

const { packs } = JSON.parse(fs.readFileSync(orderFile, 'utf8'));
const LOADER =
  '(function(L){for(var i=0;i<L.length;i++){var s=document.createElement("script");s.text=L[i][1];document.head.appendChild(s);}})(';

fs.mkdirSync(path.join(OUT, 'js'), { recursive: true });
let total = 0;
for (const [packName, modulePaths] of Object.entries(packs)) {
  const entries = [];
  for (const p of modulePaths) {
    const file = path.join(SRC, p);
    if (!fs.existsSync(file)) {
      console.error(`[build] 缺少模块文件: ${file}`);
      process.exit(1);
    }
    let code = fs.readFileSync(file, 'utf8');
    const surl = `//# sourceURL=${p}`;
    if (!code.includes(surl)) code = code.replace(/\s*$/, '') + '\n' + surl + '\n';
    entries.push([p, code]);
  }
  const blob = LOADER + JSON.stringify(entries) + ');';
  // 与原始 build 布局一致：pack 位于 js/ 下（index.html 以 js/packN.js 引用）
  fs.writeFileSync(path.join(OUT, 'js', packName), blob);
  total += entries.length;
  console.log(`[build] ${packName}: ${entries.length} 模块, ${(blob.length / 1024).toFixed(1)} KB`);
}

// ---- D-010: 版本单源（production/release/versioning.md §4）----
const telSrc = fs.readFileSync(path.join(SRC, 'js', 'telemetry.js'), 'utf8');
const mBuild = telSrc.match(/GAME_BUILD\s*=\s*"(\d{4}\.\d{2}\.\d{2}[a-z])"/);
if (!mBuild) {
  console.error('[build] 无法从 js/telemetry.js 提取合法 GAME_BUILD（须为 YYYY.MM.DD[a-z]，见 versioning.md）');
  process.exit(1);
}
const gameBuild = mBuild[1];

const PLACEHOLDER = '<span id="build-number">BUILD</span>';
const packNames = Object.keys(packs);
const packTags = packNames.map((n) => `<script src="js/${n}"></script>`).join('\n');
const moduleTags = packNames.flatMap((n) => packs[n]).map((p) => `<script src="${p}"></script>`).join('\n');
let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
if (!html.includes(PLACEHOLDER)) {
  console.error('[build] src/index.html 缺少 build-number 占位节点：<span id="build-number">BUILD</span>');
  process.exit(1);
}
if (!html.includes(moduleTags)) {
  console.error('[build] src/index.html 的模块 <script src> 区块与 tools/pack-order.json 顺序不一致，拒绝生成（防 pack 顺序漂移）');
  process.exit(1);
}
html = html.replace(PLACEHOLDER, `<span id="build-number">BUILD ${gameBuild}</span>`).replace(moduleTags, packTags);
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log(`[build] index.html: BUILD ${gameBuild}（单源填充自 js/telemetry.js）`);

// ---- W8: 静态资源复制（独立 js + mods/ + potato/）----
const copyTree = (rel) => {
  const from = path.join(SRC, rel);
  if (!fs.existsSync(from)) return false;
  fs.cpSync(from, path.join(OUT, rel), { recursive: true });
  return true;
};
const copyFile = (rel) => {
  const from = path.join(SRC, rel);
  if (!fs.existsSync(from)) return false;
  fs.mkdirSync(path.dirname(path.join(OUT, rel)), { recursive: true });
  fs.copyFileSync(from, path.join(OUT, rel));
  return true;
};
const packed = new Set(Object.values(packs).flat());
const COPY_TREES = ['mods', 'potato'];
// 独立 js 显式契约：以原始 build 为准（W8）。这些文件既打进 pack（主线程用），
// 又必须以独立文件存在于 dist（Web Worker 入口 new Worker / importScripts 用）——
// 按「不在 pack 内」过滤会漏掉这类双重身份文件。
const STANDALONE_REQUIRED = [
  'js/blockdata.js',
  'js/worldgen_data.js',
  'js/sfe_mapdata.js', // W10c：gen_worker importScripts 依赖（与 gen_worker/chunk_worker 同款双重身份）
  'js/modapi.js',
  'js/gen_worker.js',
  'js/chunk_worker.js',
  'js/skins_data.js',
];
const standaloneJs = [
  ...STANDALONE_REQUIRED,
  ...fs
    .readdirSync(path.join(SRC, 'js'))
    .filter((f) => f.endsWith('.js') && !packed.has(`js/${f}`) && !f.startsWith('pack'))
    .map((f) => `js/${f}`),
].filter((v, i, a) => a.indexOf(v) === i);
const copiedJs = standaloneJs.filter((f) => copyFile(f));
const copiedTrees = COPY_TREES.filter((t) => copyTree(t));
console.log(
  `[build] 静态资源: js 独立文件 ${copiedJs.length} 个（${copiedJs.join(', ') || '无'}），目录 ${copiedTrees.join(', ') || '无'}`
);

// ---- W8: 打包完整性自检（fail-fast）----
const packOrderAll = new Set(Object.values(packs).flat());
const refText =
  html +
  Object.keys(packs)
    .map((n) => fs.readFileSync(path.join(OUT, 'js', n), 'utf8'))
    .join('');
const missing = [];
for (const m of refText.matchAll(/js\/[a-zA-Z0-9_./-]+\.js/g)) {
  const rel = m[0];
  if (packOrderAll.has(rel)) continue; // 已打进 pack
  if (!fs.existsSync(path.join(OUT, rel))) missing.push(rel);
}
const dynamicPatterns = [];
for (const m of refText.matchAll(/potato\/[a-zA-Z0-9_./-]+\.(?:svg|jpg|png|webp)/g)) {
  const rel = m[0];
  if (!fs.existsSync(path.join(OUT, rel))) missing.push(rel);
}
for (const m of refText.matchAll(/potato\/[a-zA-Z0-9_]+\/"/g)) {
  dynamicPatterns.push(m[0].slice(0, -1) + '<动态拼接>');
}
if (missing.length) {
  console.error('[build][自检失败] 产物引用了不存在的静态资源（D-001/D-005 防复发门）：');
  for (const rel of [...new Set(missing)]) console.error('  缺失: ' + rel);
  process.exit(1);
}
if (dynamicPatterns.length) {
  console.log(
    `[build][自检] 动态拼接路径需人工核对目录完整性: ${[...new Set(dynamicPatterns)].join(', ')}`
  );
}

console.log(`[build] 完成: ${total} 模块 → ${OUT}`);
