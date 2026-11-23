# 土豆史诗 POTATO EPIC · 视觉与 UX 诊断报告（W1b）

- 审计人：林绘澄（美术与视觉表现）
- 日期：2026-11-21 · 对象：`土豆史诗-离线版` build（无源码，静态分析 + 运行时截图）
- 证据：`/workspace/production/qa/evidence/ux-*.png`（boot 加载态、桌面错误态 1280、移动端错误态 390）
- 关联缺陷：D-003（WebGL2 错误提示不可读）——本报告扩展为全量状态可读性审计

---

## 1. 视觉系统一致性审计

### 1.1 配色体系

**已建立的核心 token（boot/lobby 两处独立定义，基本对齐）：**

| Token | boot（index.html） | lobby（pack4.js `ensureCss`） | 评价 |
|---|---|---|---|
| 强调橙 | `--or: #FF5A1F` | `--or: #FF5A1F` | ✅ 一致 |
| 底色 | `#0E0F12` | 深色面板 `rgba(14,16,20,.86)` 等 | ✅ 同族 |
| 纸白 | 文字 `#F2EFE9` | 面板 `--paper: #F4F1EA` | ⚠️ 两个近似但不相等的"白" |
| 墨色 | logo 飞行终点 `#111111` | `--ink: #111` | ✅ 一致 |
| 间距单位 | `--u: min(1vw, 1.78vh)` | `--u: min(--pvw, --pvh*1.78)` | ✅ 同一公式，两处实现 |

**发现的不一致（按严重度排序）：**

1. **橙色第三变体**：除 `#FF5A1F` 外，代码中存在 `#FF6A1A`（`st-row.big` 背景、触控示意图 `tpPic`）与 `#FF6E37`（`lb-bug:hover`）。三者肉眼近不可分，但语义上应统一为主橙 + 一个 hover 变亮 token。
2. **语义色碎片化严重**：pack4.js 全文出现 **578 个不同 hex 色值**。同类语义色各自为政：
   - 金黄/警示：`#FFD24A`(#57) `#FFB020`(#16) `#E8B830`(#14) `#FFAA00`(#16) `#F2B705`(#10) `#FFC94A`(#11) `#F2C94C`(#8) `#FFD36B`(#9) `#FFD54A`(#6) —— **9 个金色**
   - 危险红：`#E8423F` `#E0303A` `#FF5555` `#FF6060` `#FF8080` `#FF7A6B` —— 6+ 个红
   - 成功绿：`#19C79A` `#55FF55` `#80FF80` `#3DDC84` `#2FE07E` `#6FF0A0` `#7CFFB2` `#1E9E57` —— 8 个绿
   - `ui.message()`（toast 类）直接以调用参数传色（如 `#7CFFB2`），语义色完全未 token 化。
3. **双"白"并行**：`#F2EFE9`（HUD 文字）与 `#F4F1EA`（纸面）混用，另 `#FFFFFF` 出现 142 次。建议收敛为 cream / paper / pure-white 三档并写明各自用途。
4. **灰色阶梯未定义**：`#A0A0A0`(92次)、`#8A877F`、`#6A665E`、`#6B675F`、`#A9A59C`、`#8E8A82`、`#555`、`#707070`、`#909090`、`#AAAAAA`… 深浅文字灰至少 10 种，应收敛为 3–4 阶（参考对比度见 §2）。

### 1.2 字体与排版层级

- boot HUD 数字用 `"Bahnschrift","DIN Alternate","Arial Narrow"`，中文用 `"PingFang SC","Microsoft YaHei","Noto Sans SC"`，lobby 同栈 —— **体系成立**。
- **例外：`#err` 用 `font: 18px sans-serif`**，脱离全部字体栈与字号体系，且无 `--u` 缩放（见 §2）。
- 层级靠 `font-weight: 900` + `--u` 倍数（3.6/3.3/2.4/1.5/1.05…）实现，规律清晰；但 900/800/700 三档与字号倍数没有成文的 type scale，属隐性规范。

### 1.3 装饰语言

- **角标（.cn 四角）**：仅 boot 使用；lobby 用 `.cut` 切角（clip-path 八角形）替代。两种"军事工业"手法并存但分属不同场景（全屏 vs 卡片），可接受，建议在美术圣经中成文。
- **分段式进度条**：boot 的 `repeating-linear-gradient` 橙色分段 + `#bootbar` 边框，是全游戏进度条的视觉母题 ✅。
- **硬阴影（drop-shadow 偏移式）**：`--u*.55 --u*.55 0 rgba(17,17,17,.92)`，lobby 卡片统一使用，hover 时变橙阴影 —— 语言统一 ✅。
- **3D 倾斜**：logo `rotateY(13deg)`、菜单 `rotateY(-12deg)` 成对出现，属有意设计 ✅。

### 1.4 间距

- 全部走 `--u` 倍数，无魔法像素（lobby 个别 `right: 38%`、`bottom: 6%` 为布局定位，可接受）。**间距纪律良好**。

### 一致性总评

**核心 token（橙/墨/纸/暗底/`--u`）纪律优秀，但语义色与灰阶完全失控**（578 色、9 金 8 绿 6 红），是当前最大的技术债。无源码下建议先建立"设计 token 白名单"文档，逐次替换高频色。

---

## 2. 状态可读性专项（D-003 及同类）

### 2.1 D-003 根因（已复现，见 evidence/ux-error-state-1280.png）

```
main.js（打包于 pack4.js）：
  catch(e) → document.getElementById("err").style.display="block" …
index.html:
  #err { position:absolute; …; }          ← 未设 z-index（computed: auto → 0）
  #boot { … z-index: 9; 背景色 #0E0F12 不透明 }
```

- `#err`（z-index auto）与 `#boot`（z-index:9）为同级绝对定位元素 → **错误文案渲染在 boot 层之下**，白字压在近白 logo（`#F2EFE9`）上，实测对比度 **1.15:1**（WCAG AAA 要求 7:1，最低 4.5:1）。
- 失败后 boot 进度条**继续假爬升至 98%**（`85+14*(1-e^(-t/4000))` 的指数曲线不受失败影响），文案仍显示"正在准备贴图"——**界面在向用户撒谎**。
- `#err` 无背景面板、无图标、无重试/刷新按钮、无 `role="alert"`；字体 `18px sans-serif` 脱离体系；桌面端 `top:30%` 恰好横穿 logo 大字区（截图证实"启动失败：WebGL2 不可用"半没入 logo）。
- 移动端（390×844，见 evidence/ux-error-mobile-390.png）：竖屏旋转逻辑下错误文案第三行"硬件加速"与 logo 顶部重叠；且 boot 底部 TIP 与左下 HUD 文字互相叠压（"仅在 B站 Toy 平台发布"被 TIP 覆盖）。

**修复方向（供程基岩参考，均不动逻辑核心）：**
1. `#err` 加 `z-index: 99` + 半透明深底面板（复用 `rgba(14,16,20,.9)` + 橙左边条语言）——纯 CSS。
2. 失败时调用既有 `BOOT_HELD` 通道冻结进度条并改写 `#boottext` 为"启动失败"——需动 JS 一行级。
3. `#err` 内容改为结构化面板：橙标"ERROR"+ 标题"启动失败：WebGL2 不可用" + 副文案 + 「刷新重试」按钮（`location.reload()`）——需动 DOM。

### 2.2 全量状态清单

| 状态 | 位置 | 层级 | 可读性 | 文案质量 | 判定 |
|---|---|---|---|---|---|
| 加载态（boot） | index.html `#boot` | z-9 ✅ | 80% 白 10.8:1、HUD 55% 白 5.6:1 ✅ | "正在加载资源/准备就绪"+TIP 轮播，好 | ✅ 良好 |
| 假进度风险 | 同上 | — | — | 脚本全下后从 85% 指数爬升，正常时被"准备就绪"遮蔽；**失败时暴露为撒谎进度** | ⚠️ 仅在错误路径有问题 |
| 错误态（启动失败） | `#err` | **z-auto，被 z-9 boot 覆盖** | 压 logo 处 1.15:1 ❌ | 技术向但可理解；无行动入口 | ❌ **D-003，P1** |
| 空态（联机房间） | pack4 `say()` | 随面板 | ✅ | "还没有配置联机服务器地址（js/netconfig.js）"——对玩家暴露内部文件名 | ⚠️ 文案应去技术化 |
| 空态（云存档） | canvas `Font.center` | 画布层 | `#A0A0A0` on 暗 ≈7.3:1 ✅ | "云端还没有存档：登录后玩单人世界…" ✅ 优秀（说清了后果与出路） | ✅ |
| 网络错误 | P2P `lost()` | toast/面板 | ✅ | "没连上房主（网络不通：可以换个网络再试…）"——给了行动建议 ✅ | ✅ 优秀范本 |
| 签到错误态 | Checkin `err` | 面板 | ✅ | 有"重试"按钮 ✅（全游戏唯一带重试的错误态，应推广） | ✅ |
| 禁用态 | `.pzm-btns button[disabled]` | — | opacity .45 + `cursor: default` | 无禁用原因提示 | ⚠️ 可接受，建议加 `aria-disabled` |
| toast（跑马灯） | share `sh-toast` | z-5 | `#F2EFE9` on `#111` ✅ | 3.2s 自动消失、`pointer-events:none`、无 aria-live | ⚠️ 屏幕阅读器不可感知 |
| TIP 轮播 | `#boottip` | z-9 内 | 75% 白 ✅ | 好 | ✅（移动端与 HUD 叠压除外） |

**同类问题汇总（D-003 家族）：** 全游戏**没有任何一处 `role="alert"` / `aria-live`**；错误态行动入口（重试）只在签到一处存在；错误/提示 toast 与系统弹层无统一 z-index 规范（现有值：1/2/3/4/5/6/7/9/60/99 零散分布，建议成文：HUD 10 / 面板 40 / toast 60 / 致命错误 99）。

### 2.3 陀螺仪新功能的状态规范建议（不实现，给规范）

新设置组「陀螺仪」三档开关 + 双灵敏度滑条，iOS 权限流：

1. **权限请求弹窗**：iOS `DeviceOrientationEvent.requestPermission()` 必须由用户手势触发 → 弹自定义确认面板（非系统样式），使用现有 `blk cut` 纸面卡 + 橙 CTA 语言；按钮文案给出后果（"允许使用陀螺仪瞄准（仅用于瞄准，不收集其他数据）"）；代码中已有 3s 超时回退（`wait(3e3)→"slow"`），超时态文案需区分"未响应/已拒绝"。
2. **权限拒绝 toast**：复用 `ui.message()`，但**禁止内联色值**——新增语义 token `--ok/--warn/--err`；文案给出出路："未获得体感权限：可到 设置→Safari→网站设置 中重新开启"；toast 至少停留至用户可读（建议 4s+，与现有 4s 对齐）；加 `role="status"`。
3. **桌面端隐藏态**：非触屏/无陀螺仪设备上整组**不渲染**（而非 `display:none` 留空行），与现有 `touchAuto`/设备检测（`Potato.setDevice`、`touchOn()`）同一判定源，避免两套检测打架；若日后需要"为什么没有这项"的入口，用灰置 + "此设备不支持"副文案，不要直接消失。
4. **滑条**：沿用 `pz-fov` 的 `accent-color:#FF5A1F` + 右侧数值回显模式；双滑条需各自可聚焦、可键盘操作（←→ 步进），默认值标注"（默认）"。

---

## 3. 可访问性现状速览

详见 `accessibility-matrix.md`。当前判定：**介于 Basic 与 Standard 之间，多数项达 Basic、少数项（字幕开关、触控方案、aria-checked）触及 Standard 边缘**；无色彩替代、无键盘操作、阻断缩放，故不足 Standard 整级。

---

## 4. 改进建议（按优先级）

| # | 建议 | 严重度 | 改动量级 |
|---|---|---|---|
| 1 | **D-003**：`#err` 加 z-index:99 + 深底面板 + 重试按钮；失败时冻结假进度条 | P1 | 纯 CSS + 1 行 JS + 小 DOM |
| 2 | 建立**语义色 token 表**（`--ok/--warn/--err/--gold` + 4 阶灰），先覆盖 toast/message 与 9 个金色 | P2 | 文档先行；替换需动 DOM/逻辑，可增量 |
| 3 | 错误态行动入口标准化：所有 `lost()/say()/err` 路径配"重试/返回"按钮（对齐签到页范式） | P2 | 需动 DOM/逻辑 |
| 4 | 弹层 z-index 规范成文（HUD 10 / 面板 40 / toast 60 / 致命 99），收敛现有 10 档散值 | P2 | 纯 CSS |
| 5 | 全局 `@media (prefers-reduced-motion: reduce)`：停 btScan/btSpin/bugNudge 及 lbUp/lbR 入场动画（现有 noAnim 仅覆盖新闻页） | P2 | 纯 CSS |
| 6 | lobby 菜单卡片补 `role="button"`/`tabindex="0"`/Enter 触发；`#err` 加 `role="alert"`；toast 加 `role="status"` | P3 | 需动 DOM |
| 7 | viewport 移除 `maximum-scale=1, user-scalable=no`（游戏内已 `touch-action:none`，不必再禁缩放） | P3 | 纯 HTML 一处 |
| 8 | 空态文案去技术化：去掉"（js/netconfig.js）"类内部路径，改为"在设置中填写联机地址" | P3 | 需动 DOM（文案） |
| 9 | 移动端 boot 底部 TIP 与左下 HUD 叠压：TIP 上移或 HUD bl 在窄屏隐藏 | P3 | 纯 CSS |
| 10 | 双"白"收敛：`#F2EFE9`（屏上文字）与 `#F4F1EA`（纸面板）各自用途写入美术圣经 | P4 | 文档 |

## 附：证据清单

- `evidence/ux-boot-loading-1280.png` — 正常加载态（token 母题完整）
- `evidence/ux-error-state-1280.png` — D-003：错误文案压 logo、假进度 98%
- `evidence/ux-error-mobile-390.png` — 移动端错误态 + 底部文字叠压
