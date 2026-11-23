# 土豆史诗 POTATO EPIC · 可访问性分级与特性矩阵（W1b）

- 审计人：林绘澄 · 日期：2026-11-21
- 分级定义：
  - **Basic**：不阻碍游玩——核心信息可读、错误态有出路、不依赖单一感官
  - **Standard**：覆盖常见障碍——对比度达标、动效可关、字幕、触控可调、基础语义标记
  - **Comprehensive**：完整合规——全键盘操作、屏幕阅读器、色彩替代、系统偏好全响应
- 依据：index.html + pack4.js（ui/screens/onboard/touch/mobile/subtitles 相关）静态分析；无源码，浏览器沙箱无法进入对局内，HUD 对局内项标注为「推断」。

## 当前判定：**Basic（部分项达 Standard 边缘，整体不足 Standard）**

## 特性矩阵

| 特性 | 需要 | 现状 | 证据 | 评级 |
|---|---|---|---|---|
| **对比度** | Standard | boot 正文 10.8:1、HUD 5.6:1、空态灰 7.3:1 ✅；但错误态压 logo 处 **1.15:1** ❌；白字在橙 CTA 上 3.12:1（大字可过 AA-large，小字不过） | 计算 + evidence/ux-error-state-1280.png | ⚠️ 差一步到 Standard |
| **字幕** | Standard | 设置项 `subtitles`（开/关）存在并入账号同步；对局内渲染在 canvas（无法进入对局验证字号/背景） | pack4 ACCOUNT_SETTINGS、applyActions | ✅ 基本具备（待对局内复核） |
| **动效可关闭** | Standard | 仅新闻页 noAnim 尊重 `prefers-reduced-motion`；boot 扫描线/旋转环/HUD 闪烁、lobby 全套入场动画**不响应** | pack4 noAnim vs index.html 动画 | ❌ 缺失 |
| **色彩替代（色盲模式）** | Standard | 无任何色盲选项；语义靠色相区分（金/红/绿/蓝紫分类标签 `#2EA6F0/#19C79A/#8F6BF2/#FFB020`），但主要交互仍有文字+序号冗余，实际风险中等 | 代码无「色盲」字样 | ❌ 缺失（风险中） |
| **字号/文本缩放** | Standard | 全部 `--u`（视口比例）单位，随屏幕缩放 ✅；但用户无法单独调大，且 UI 走 canvas 的部分不可缩放 | ensureCss | ⚠️ 部分 |
| **触控适配** | Standard | touch.js/mobile.js 内建：二/三/四指布局方案带示意图、触控设置页、`touch-action: manipulation`、`viewport-fit=cover` | pack4 ot[]/tpPic | ✅ 达 Standard |
| **输入重映射** | Standard | 键位设置 `keys` 在账号设置同步列表中（对局外无法验证 UI） | ACCOUNT_SETTINGS | ✅ 基本具备 |
| **屏幕阅读器/语义标记** | Standard | 无 `role`/`aria-label`/`tabindex`/`:focus-visible`（仅 2 处 `aria-checked`）；lobby 为 `div`+click，键盘完全不可达；`viewport user-scalable=no` | grep 全量 | ❌ 缺失 |
| **错误态出路** | Basic | 签到页有「重试」✅；启动失败 `#err` 无出路且被遮挡（D-003）❌；网络错误文案带建议 ✅ | ux-audit §2.2 | ⚠️ 不齐 |
| **时间可调** | Basic | toast 4s 固定（share toast 3.2s）；无暂停选项；TIP 2.6s 轮播为非关键信息 | 代码 | ⚠️ 可接受 |
| **前庭安全（大面积动效）** | Comprehensive | boot 有全屏扫描线 + 旋转环，不受 reduced-motion 控制 | index.html | ❌ 缺失 |

## 升级路线

- **守住 Basic（1 项）**：修复 D-003 错误态（z-index + 面板 + 重试按钮）。
- **达到 Standard（3 项）**：
  1. 全局 `prefers-reduced-motion` 支持停用装饰动画（纯 CSS）；
  2. lobby 交互卡片补 `role="button"` + `tabindex` + Enter/Space（需动 DOM）；
  3. 移除 `user-scalable=no` + 修正橙底白字小字号对比度（纯 CSS）。
- **迈向 Comprehensive（后续）**：色盲模式（先给"分段条/序号"式色彩冗余审计，再定调色板）、canvas UI 的字号缩放选项、完整 aria 地标与焦点管理、`aria-live` 错误播报。

## 给 UX 规格（文策渊）的引用约定

UX 规格中涉及状态提示、陀螺仪权限弹窗/拒绝 toast、桌面隐藏态的条目，须引用本矩阵分级：目标 **Standard**；权限弹窗须满足「键盘可达 + role="alertdialog" + 不依赖色相传达拒绝态」。
