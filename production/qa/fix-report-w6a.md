# W6a 缺陷修复报告 —— D-003 / D-004 / D-010

- 执行：程基岩（engineering-lead-1）· Task ID = W6a · 优先级 P0
- 日期：2026-11-21
- 基线提交：6dbf129；并行 W7（反作弊）在同一工作区提交 7cc43c8（其改动面 `net.js`/`anticheat.js`/`tests/` 我全程未触碰）
- 验证环境：沙箱无 WebGL2（恰为 D-003/D-004 的天然复现环境）；chromium `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --no-sandbox`

## 1. 改动清单

允许改动面内共 3 个文件（`git diff --stat`）：

```
 src/index.html  | 57 +++++++++++++++++++++++++++++++++++++++++++++++++++++++--
 src/js/main.js  | 17 +++++++++++------
 tools/build.mjs | 34 ++++++++++++++++++++++++++++++++++
 3 files changed, 100 insertions(+), 8 deletions(-)
```

- `src/index.html`：D-003 面板样式、D-004 失败终态 CSS + `self.BOOT_FAIL` 接线、D-010 占位节点与运行时同步
- `src/js/main.js`：D-004 最小接线（init 的 catch 路径改调 `self.BOOT_FAIL(e)`，保留旧 `#err` 文本路径为兜底）。**boot 失败逻辑在独立模块 main.js 内，此为任务书允许的「失败终态所必需的最小 JS 接线」**，共 +17/-6 行，仅 catch 块
- `tools/build.mjs`：D-010 版本单源改造（提取 GAME_BUILD + 生成 dist/index.html）
- `dist/`：构建产物（W7 提交后已不入库），已用改造后的 build.mjs 重新生成，未手工编辑

## 2. 逐缺陷修复说明

### D-003（P2）启动失败错误提示被遮挡

- `#err` 由裸文本改为**失败面板**：`z-index: 99`（压过 `#boot` 的 9）、深底 `rgba(14,16,20,.92)` + 橙左边条 `#FF5A1F`（复用 boot 视觉 token）
- 新增行动入口 `<button id="err-retry">重试</button>`，点击 `location.reload()`；样式对齐现有按钮语言（橙底深字 + 橙色辉光）
- 失败时 boot 装饰层（logo/环/HUD/角标/tip）淡出隐藏，面板不再与任何元素重叠
- 实测对比度（WCAG 公式，getComputedStyle 实算）：标题 6.11:1、错误信息 12.11:1、提示文案 10.71:1、重试按钮 6.15:1 —— **全部 ≥ 4.5:1**

### D-004（P2）失败后假进度条爬到 98% 无终态

- boot 加载条脚本（index.html 内联）新增 `failed` 终态标志与 `self.BOOT_FAIL(err)`：
  - 加载条**冻结**在失败时刻的宽度（draw 循环停走，实测 4 秒宽度不变：74.4% → 74.4%）
  - 文案切**「启动失败」终态**，不再出现「正在准备贴图」类假进行时
  - `#bootbar` 切 `.fail` 错误样式（实色橙条），`#boot` 加 `.fail` 隐藏装饰层
- `main.js` 的 init catch（Renderer 构造抛错的路径）改调 `self.BOOT_FAIL(e)` —— 唯一的 JS 接线点

### D-010（P3）展示版本与 GAME_BUILD 不一致（单源方案）

- **唯一事实源**：`src/js/telemetry.js` 的 `GAME_BUILD = "2026.11.14a"`
- `src/index.html`：原写死的 `BUILD 2026.11` 改为占位节点 `<span id="build-number">BUILD</span>`（默认通用 `BUILD` 字样，脚本加载失败时不展示伪造版本，符合 versioning.md §4.3）
- **构建时填充**：`tools/build.mjs` 从 `js/telemetry.js` 提取 `GAME_BUILD`（正则 + 格式门控 `YYYY.MM.DD[a-z]`，提取失败即构建失败），生成 `dist/index.html`：
  - 占位节点填充为 `BUILD 2026.11.14a`
  - 103 个模块 `<script src>` 标签区块替换为 pack1→4 loader 标签（区块与 `pack-order.json` 不一致时拒绝生成，防 pack 顺序漂移）
- **运行时同步**：index.html 内联脚本在 `GAME_BUILD` 定义后把占位节点同步为 `BUILD ${GAME_BUILD}`（双保险：即使发布包未重建，展示版本也跟随事实源）
- 效果：**改一处 `GAME_BUILD` → 重建即全包一致；未重建时运行时同步兜底；均失败时显示通用 `BUILD`，永不撒谎**

## 3. 验证证据

### 3.1 W6a 专项断言（/tmp/w6a_verify.py，构建于 8815）—— 16/16 PASS

证据：`evidence/fix-w6a-evidence.json`、截图 `evidence/fix-w6a-err-panel.png`（修复后）、`evidence/fix-w6a-before-broken.png`（修复前对照）

| 断言 | 结果 |
|---|---|
| D-003 #err 失败态可见 / z-index 99 生效 / 与 logo 无几何重叠 | PASS ×3 |
| D-003 含「重试」按钮 / 对比度 ≥ 4.5:1（最低 6.11）/ 文案含根因 WebGL2 | PASS ×3 |
| D-004 加载条冻结（4s 不变）/ 文案「启动失败」终态 / boot.fail + tip 隐藏 / 无假进行时 | PASS ×4 |
| D-010 build-number == `BUILD ${GAME_BUILD}`（2026.11.14a）/ 终态不被版本同步破坏 | PASS ×2 |
| GYRO Gyro 模块加载、API 面完整（groupVisible/uiPickMode/_test 钩子）、设置组注入路径可调用 | PASS ×2 |
| 网络/控制台无 W6a 新引入错误；基线已知 404（D-001/D-006）保持原样未扩大 | PASS ×2 |

陀螺仪说明：沙箱无法进入设置页（boot 失败），采用 DOM/API 级断言（Gyro 模块与设置组注入路径完好、无抛错）；完整设置页渲染回归由 W5b 套件（`tools/w5b-gyro-test.py`）覆盖，本次未触碰 `gyro.js`/`touch.js`/`potato.js`，无回归风险面。

### 3.2 smoke 回归（smoke_run.py）—— 无回退，D-003 对应用例转 PASS

A/B 对照（同一套件、同参数，仅差 W6a 三文件改动）：

| 构建 | 分数 | 差异用例 |
|---|---|---|
| 基线（6dbf129 原样构建，8817） | **12/17** | S-10 FAIL（D-003 遮挡实锤复现） |
| 基线 + W6a 改动（8815） | **13/17** | S-10 **FAIL→PASS**（D-003 修复） |

- 两个构建共同 FAIL：S-05（D-001）、S-06（D-006）、S-07（D-002）、S-16（D-008）—— 均为台账既有缺陷，**零回退**
- S-09（加载有明确终态）两构建均 PASS；D-004 修复后由 W6a 专项断言覆盖（终态文案 + 冻结），smoke 的 S-09 语义（可见错误提示）本就包含该路径
- 证据：`evidence/fix-w6a-smoke-baseline.json`（12/17）、`evidence/fix-w6a-smoke-results.json`（13/17）、`evidence/fix-w6a-smoke-boot-state.png`

### 3.3 build.mjs 重建产物一致性

- pack1/2/3 与改动前 dist **逐字节一致**（cmp 校验）；pack4 仅含 `main.js`（我的 D-004 接线）预期差异，其余 29 个 entry 不变
- 新 `dist/index.html` 与旧版 diff 仅含 D-003/D-004/D-010 的预期改动区块，无其他漂移
- 版本填充实证：`dist/index.html` 内 `build-number">BUILD 2026.11.14a`

## 4. 关键决策与备注

1. **失败终态放 index.html 内联、main.js 只做 3 行调用**：失败视觉（面板/冻结/淡出）与 boot 加载条闭包同源，避免跨模块新协议；main.js 保留旧文本路径兜底（`BOOT_FAIL` 未定义时行为不劣于修复前）。
2. **S-10 兼容**：smoke 用 getBoundingClientRect 判几何重叠，`opacity:0` 仍有盒 → 采用 `display:none` 淡出装饰层，几何与视觉同时清场。
3. **版本双保险（构建填充 + 运行时同步）**：versioning.md §4 目标方案 3 是运行时更新；任务书要求 build.mjs 填充。两者叠加覆盖「未重建」「脚本失败」等边界，且互不冲突（值同源恒等）。
4. **并行协作观察**：验证期间 W7 在同一工作区提交了 `net.js`/`anticheat.js`（7cc43c8）。我的 smoke/断言验证全部基于「基线 src + 仅 W6a 三文件」的独立构建树（/tmp/w6a-src → 8815），保证归因干净；W7 文件未被我触碰。

## 5. 待用户审批项

- 提交本改动（工作区未 commit，遵守「无指令不提交」铁律）
- 若采纳，建议发布门控复核 versioning.md §4「过渡期门控」可转为常规检查（单源已落地）

## 6. 产物路径汇总

- 改动：`src/index.html`、`src/js/main.js`、`tools/build.mjs`
- 报告：`production/qa/fix-report-w6a.md`（本文件）
- 证据：`production/qa/evidence/fix-w6a-{err-panel,before-broken,smoke-boot-state}.png`、`fix-w6a-{evidence,smoke-results,smoke-baseline}.json`
- 验证脚本（临时）：`/tmp/w6a_verify.py`（如需入库可移至 tools/）
