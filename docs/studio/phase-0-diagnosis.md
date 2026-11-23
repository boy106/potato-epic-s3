# 土豆史诗 · Phase 0 阶段诊断报告

> 主理人：游承峰（Yoan Summit） · 游戏开发工作室
> 诊断日期：2026-11-21
> 诊断对象：`土豆史诗-离线版.zip`（用户上传的 build 产物）
> 阶段判定：**Phase 6 打磨（已上线运营中）**，工程层需并行补一条基线回填支线

---

## 1. 一句话结论

这不是原型，也不是"准备做"。这是一个**已经在跑第一赛季的线上产品**。产品层该走 Phase 6 打磨（含 Phase 7 发布工程），但工程层存在严重倒挂：**产物在跑，资产为零**——没有源码、没有设计文档、没有测试、没有发布流程。因此正确姿势不是回到 Phase 1 重写 GDD，也不是直接开新功能，而是以 Phase 6 为主轴、并行回填工程基线。

## 2. 项目识别

| 维度 | 实测证据 |
|---|---|
| 产品名称 | 土豆史诗 / POTATO EPIC |
| 类型 | 浏览器端体素射击（voxel shooter），自研引擎 |
| 技术栈 | 原生 HTML5 + WebGL2 + JS，无 Unity/Godot/Phaser/Babylon/Three 依赖 |
| 发布平台 | B站 Toy 平台独占（index.html 明示"仅在 B站 Toy 平台发布"） |
| 构建版本 | `BUILD = "2026.11.14a"` |
| 核心循环 | 天梯 1V1 / 2V2（第一赛季 · 五局三胜 · 打满五局）、淘汰赛、乱斗、人机对战、靶场教学 |
| 元系统 | 段位分、涂装/皮肤/名牌框、每日签到、好友约战邀请码、创建房间/队伍、股东名单、反馈入口 |
| 后端 | 自建服务 `https://xz.honghemc.cn:8443`（rooms / pm），含 telemetry、anticheat、cloudsave、live ops、p2p |
| 工程规模 | 102 个 JS 模块（pack1=15 / pack2=53 / pack3=5 / pack4=29），4 个 pack 共约 4MB 压缩代码 |
| 资源 | 118 个音频文件（ogg + m4a 双格式）、tiles.webp 贴图集 |
| Mod 系统 | 自研 modapi + 2 个官方 mod（xzguns 现代枪械 10 把枪、xzrange 靶场地图） |
| 视觉完成度 | 分段式进度条、角标装饰、TIP 轮播、logo 飞入大厅形变动画——非占位图 |
| 迭代活跃度 | 代码注释含 `user 11-16` 至 `user 11-20` 的反馈记录，每日迭代 |

### 模块分布（pack 内）

- **pack1**（15）：integrity、mods、assets、assets_i1/i2、emoji、texts、util、worldgen_data、worldgen、blockdata、itemdata、recipedata、modapi、mods_data
- **pack2**（53）：blocks、world、mesher、models、vmodels、render、render2、shaders、audio、subtitles、entity、mobs2、ui、save、game、terrain2、features、trees、structures 系列、nbt、anvil、export、screens、commands、controls、dims、nether_mobs、village_mobs、merchant、effects、enchant、workstations、equip、vehicles、redstone、itemuse、entitydata、etex、emodel、vmobs、mobs_animals/water/hostile、mobitems、spawning、draw2、blockents、decor、items3
- **pack3**（5）：specials、raids、cmdrun、mods_ui、mods_code
- **pack4**（29）：main、touch、perf、netconfig、net、beacon、cmdblock、telemetry、toy、account、capes、skins、cloudsave、social、mobile、onboard、jing_tex、companion、extras、cosmetics、news、checkin、shareholders、live、minigame、anticheat、p2p、panorama、potato

其中 `potato.js` 单模块约 430KB（压缩后），是大厅/主玩法核心。

## 3. 为什么是这个阶段

- **不是 Phase 1-2（概念/系统设计）**：核心循环、模式矩阵、元系统、赛季结构全部已落地并有线上玩家，回头重写概念文档是浪费。
- **不是 Phase 3（技术搭建）**：引擎、渲染、网络、反作弊、云存档均已实现。
- **不是 Phase 4-5（预制作/制作）**：功能广度已超垂直切片，处于内容充实后的状态。
- **是 Phase 6（打磨）**：代码注释显示开发重心已转为"加载动画丝滑度""界面衔接""反馈响应"等体验细节，这是典型的打磨期特征。
- **触及 Phase 7（发布）**：已有 BUILD 版本号、赛季、热更新式迭代，但发布工程不成体系（见缺口 4）。

## 4. 已实测缺陷（3 分钟黑盒烟雾测试发现）

以下缺陷由主理人在无头浏览器（Chromium + SwiftShader）实际运行 build 发现，均可复现：

| 编号 | 严重度 | 缺陷 | 证据 | 影响 |
|---|---|---|---|---|
| D-001 | P1 | `js/skins_data.js` 404，build 漏打包 | 网络面板 404；pack4 内 `t.src="js/skins_data.js"`，但 zip 中无此文件，4 个 pack 也均未内含该模块 | 皮肤预设静默降级为空数组，玩家看不到皮肤选项，无报错提示 |
| D-002 | P2 | 4 个铜门贴图缺失 | 控制台 warning：`missing tile i_waxed_copper_door`、`i_waxed_oxidized_copper_door`、`i_waxed_exposed_copper_door`、`i_waxed_weathered_copper_door` | 对应方块渲染回退到 white 贴图，视觉错误 |
| D-003 | P2 | WebGL2 不可用时错误提示被 logo 遮挡 | 截图：报错文案"WebGL2 不可用 / 请使用最新版 Chrome..."以低对比度灰字渲染在巨大 logo 后方，几乎不可读 | 玩家在不支持的设备上不知道为何打不开，直接流失 |

> 这三个问题的共同点：**都应该被一条最基础的 CI 烟雾测试拦下**。它们的存在本身就是"没有回归网"的直接证据。

## 5. 三个硬缺口（按阻塞度排序）

### 缺口 1 · 没有源码，只有压缩产物（硬阻塞）

`pack1-4` 全部是单行 min 代码，每模块头部带 `// min`。无法做代码级修复、测试注入、CI、带符号的性能剖析。任何改动只能改压缩产物，不可维护。

**缓解**：已验证打包格式为 `(function(L){...})([["js/模块名.js","<代码>"],...])`，且每模块尾部带 `//# sourceURL=js/模块名.js` 精确路径；`integrity.js` 仅上报哈希不阻断执行。因此可**还原为 102 个独立模块的源码树**（保序拆分 + 外部 script 加载 + prettier 格式化 + 依赖图）。代价：变量名已压缩，只能做到结构级可维护，无法恢复原始命名。→ 由 W0 承担。

### 缺口 2 · 没有回归网

102 个模块中排位、联机、存档、反作弊互相咬合，无任何自动化测试。线上有玩家，盲改风险不对称。

**缓解**：先建黑盒烟雾测试（30 条）+ 缺陷分级清单，再动代码。→ 由 W1 承担。

### 缺口 3 · 设计基线缺失

天梯分公式、伤害倍率（爆头 ×2 / 四肢 ×0.75）、五局三胜规则、解锁门槛、经济数值全散落在代码字符串中，无人能说清"改这个会破坏什么平衡"。

**缓解**：从 build 逆向出"现状即规格"的 GDD 与数值表，并标注哪些是设计意图、哪些是偶然长成。→ 由 W2 承担。

### 缺口 4 · 发布工程不成体系

版本号 `2026.11.14a` 无规范文档，无补丁说明模板、无热修/回滚流程、无本地化覆盖说明。

**缓解**：由 W4 承担。

## 6. 风险登记

| 风险 | 等级 | 缓解 |
|---|---|---|
| 还原后的源码树与线上 build 行为不一致 | 高 | W0 完成后必须过冒烟验证（能启动、进大厅、单机可玩）才允许后续改动 |
| 变量名压缩导致逆向出的数值语义误判 | 中 | W2 所有数值结论标注"代码出处 + 推断置信度"，不确定项进待决策清单而非臆断 |
| 无源码情况下性能剖析无符号 | 中 | 依赖 sourceURL 模块名 + 黑盒帧率/内存测量，定位到模块级即可 |
| 线上玩家存在，改动可能炸服 | 高 | 铁律：回归网建成前不碰排位数值与匹配逻辑 |
| 后端服务（xz.honghemc.cn:8443）不在本次交付范围内 | 中 | 网络协议只做逆向文档，不做服务端改动 |

## 7. 决策记录（用户已拍板）

| 决策项 | 结果 |
|---|---|
| 本轮主轴 | 打磨 + 基线回填 |
| 源码状态 | 只有 build 产物，无原始仓库 |
| 评审强度 | lean（仅设 2 道质量门：设计评审、发布检查） |

## 8. 阶段判定结论

> **当前应走 Phase 6 打磨**，以第一赛季线上反馈为准修体验硬伤、稳性能、建回归网；并行开一条基线回填支线（W0-W4）把工程地基补上。不回炉概念，不盲目扩张新内容。

下一步见 `docs/studio/plan-s1.md`。
