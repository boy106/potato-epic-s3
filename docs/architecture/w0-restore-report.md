# W0「源码树还原」报告 — 土豆史诗 / POTATO EPIC

执行人：程基岩（技术负责人） · 状态：✅ 完成 · 日期：2026-11-21

---

## 0. 变量名限制声明（必读）

**所有拆出的模块代码经历过 minify（terser 级压缩），局部变量/参数名已被压缩为
`t/e/o/r/s/n` 等单字符名，且不可能恢复原始命名。** 本次还原是
**结构级可维护**（正确的模块边界、真实文件路径、保留语义的格式化、可读的控制
流与数据结构），**不是命名级还原**。后续改动请在理解模块边界的前提下进行，
不要指望从变量名推断语义；跨模块语义请对照 `module-map.md` 的全局依赖表。

## 1. 方法

1. **解析**：4 个 pack 均为 `(function(L){…})([[path, code], …])` 结构，
   用 Node 对外层数组做 `JSON.parse` 精确反转义（手工正则替换会有
   `\"`/`\\`/`\n`/unicode 转义歧义，不用）。解析结果：pack1=15、pack2=53、
   pack3=5、pack4=29，共 **102 模块**，与 pack 内声明顺序一致。
2. **提取**：写入 `/workspace/src/js/`（保留原始路径名）。处理约定：
   - 保留每个模块尾部的 `//# sourceURL=js/xxx.js`（devtools 堆栈映射与原始
     build 一致，且冒烟已验证生效，见 §6）；
   - 去除 `// min\n` 头标记（格式化后语义失真，仅影响字节，不影响行为）；
   - `js/chunk_worker.js` 不在任何 pack 内（磁盘独立 worker），从 build 原样
     取回并同样格式化（共 103 个文件）。
3. **格式化**：prettier 3.10.1（parser: babel, printWidth 100），102+1 文件
   全部格式化成功，无解析失败回退。

## 2. 等价性验证（三层）

| 层级 | 方法 | 结果 |
|------|------|------|
| L1 | acorn 严格 AST 全等对比（忽略位置信息） | 74/103 完全一致；28 个存在 prettier 安全变换差异 |
| L2 | esbuild minify 规范形对比（minify 含 identifier 重命名） | 100/103 字节全等；3 个差异均为美观性（hex 字面量大小写、重命名偏移——esbuild 按源字符频率取名，prettier 空白改变频率） |
| L3 | **变换感知 AST 对比**：仅放行三类可证明安全的变换（① 对象键去引号 `{\"key\":x}`≡`{key:x}`；② 同操作数 `&&`/`\|\|` 链的结合律重括号——求值顺序、短路、返回值全等；③ 字面量 raw 大小写——值相同） | **103/103 等价** ✅ |

结论：**每个模块与 pack 原始代码语义全等**，102 个模块全部成功拆出。

## 3. 冲突取舍记录

名字同时出现在 pack 模块与磁盘独立文件的 5 个文件：

| 文件 | pack 内 | 磁盘独立 | 结论/取舍 |
|------|--------|---------|----------|
| js/blockdata.js | 549,526B（`self.BLOCK_DATA=…`） | 549,498B | 内容一致，磁盘版仅 CRLF 换行。**取 pack 内拆出版** |
| js/worldgen_data.js | 26,668B | 26,634B | 内容一致（尾随换行差异）。取 pack 版 |
| js/modapi.js | 23,643B | 23,616B | 内容一致（`// min` 头差异）。取 pack 版 |
| js/gen_worker.js | 3,135B | 3,104B | 内容一致。取 pack 版。注意：它同时是 `terrain2.js` 以 `new Worker(\"js/gen_worker.js\")` 直载的 worker 入口 |
| js/chunk_worker.js | **不在 pack 内** | 6,133B | 仅磁盘版（chunk 网格化 worker），原样放回 |

worker 运行时依赖已核实：`terrain2.js` 生成 `js/gen_worker.js`/`js/chunk_worker.js`
两个 Worker，worker 内 `importScripts(\"assets.js\",\"util.js\",\"worldgen_data.js\",
\"worldgen.js\",\"blockdata.js\",\"modapi.js\", …mods)`。**拆分后这批文件全部
真实落盘，worker 反而比原始 build 更可能成功**（原始离线 build 缺
assets/util/worldgen 磁盘文件，worker 会失败并走 `GenPool.inline` 页内回退；
这是原始 build 的既定容错路径，非 bug）。

## 4. 交付物清单

| 路径 | 说明 |
|------|------|
| `/workspace/src/js/*.js` | 102 个 pack 模块 + chunk_worker.js，prettier 格式化 |
| `/workspace/src/index.html` | 原 index.html 仅把 4 个 pack loader 替换为 102 个按序 `<script src>`（附注释），头部 perf 脚本/boot splash/样式/mods preload 原样保留 |
| `/workspace/src/mods/` | 原样同步（index.json + xzguns + xzrange 含音频/webp 资产） |
| `/workspace/docs/architecture/module-map.md` | 模块清单（按 pack + 加载顺序）、体量 Top20、全局依赖枢纽、分层画像 |
| `/workspace/tools/build.mjs` | 按 `tools/pack-order.json` 顺序重建 4 个 pack（loader 格式与原始逐字节兼容，输出到 `<out>/js/`） |
| `/workspace/docs/architecture/w0-smoke.png` | 冒烟截图（boot 界面 + WebGL2 降级提示） |

## 5. 重建验证（build.mjs round-trip）

`node tools/build.mjs` 产出 `dist/js/pack1~4.js`：
- 4 个 pack 模块名顺序与原始 pack **全等**；
- loader 前缀 `(function(L){…})([[\"js/…\"…` 与原始格式一致；
- **端到端冒烟**：dist + 原始 index.html 起服务加载，19 个关键全局变量
  探测结果与原始 build 完全一致（见 §6），注入 script 数 117 = 原始 build
  的 117。

## 6. 冒烟验证（Playwright，端口 8812）

方法：`http` 静态服务 + Chromium（Playwright 1.58.1 / SwiftShader 软渲染）。
断言基线按任务要求：脚本无 JS pageerror、DOM 正常，WebGL2 报错属环境限制豁免。

### 还原树 src/ vs 原始 build 对照（同环境 A/B）

| 指标 | 原始 build | 还原树 src/ | 重建 dist/ |
|------|-----------|------------|-----------|
| pageerror（硬性 JS 错误） | **0** | **0** ✅ | **0** ✅ |
| 关键全局存在性（Integrity/Mods/ASSETS/WG/BLOCKS/ITEMS/BID/ITEM_KEY/game/PotatoMod 等 19 项） | 全部一致 | **完全相同** ✅ | 完全相同 ✅ |
| game.state | boot | boot | boot |
| #err 内容 | 启动失败：WebGL2 不可用（游戏自身优雅降级） | 同左 ✅ | 同左 |
| 唯一 404 | /js/skins_data.js | 同左（**原始 build 亦缺此文件**，动态 fetch 有容错，非回归） | 同左 |
| 执行深度 | 栈顶 `new Renderer (js/render.js)` `← Game.init ← main.js` | 相同调用链 ✅ | 相同 ✅ |
| devtools 堆栈 | minified 列号 `render.js:2:12657` | **可读行列** `render.js:195:19`（sourceURL+格式化收益） | 同左 |

解释：19 项全局全部就位 + 调用链推进到 `Renderer` 构造 = **102 个模块按原序
全部执行成功**（Renderer 在 pack4 的 main.js 之后才被构造）。WebGL2 不可用
阻止进入 3D 对局是沙箱环境限制，与还原无关（两棵树报错逐字一致）。

## 7. 后续注意事项（Handoff）

1. **顺序即契约**：任何模块增删必须同步 `tools/pack-order.json`，pack1→4 与
   pack 内顺序不可乱（全局变量耦合，无 import/export 兜底）。
2. **`integrity.js`** 会把脚本哈希上报 telemetry（不阻断）。拆分/重建后哈希
   必然与原始 build 不同，线上看板可能出现完整性告警波动——预期行为，需要
   在遥测侧白名单或忽略。
3. **skins_data.js 404**：原始 build 就缺，属已知缺口；后续若要做皮肤热更，
   顺手补上即可。
4. **worker 与主线程共享脚本**：改动 `assets/util/worldgen*/blockdata/modapi`
   时记得 worker 侧 `importScripts` 同样受影响（同一文件两处消费）。
5. **变量名已压缩**（§0），重命名重构收益有限；建议改动以「新增代码 + 调用
   既有全局」为主，跨模块调用对照 module-map.md。
6. 性能基线：正式性能分析（W 后续阶段）需在真机 WebGL2 环境做，本沙箱只能
   验证加载链。
