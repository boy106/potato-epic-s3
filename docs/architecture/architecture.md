# 架构基线 / Architecture Baseline — 土豆史诗（POTATO EPIC）

> W3「架构基线逆向」产物。作者：程基岩（技术负责人）。数据来源：对
> `/workspace/src/`（103 个格式化模块 + index.html + tools/build.mjs）的静态只读分析。
> 上游输入：`docs/architecture/module-map.md`（W0 产物，本文件不重复其模块清单，
> 只在其上做架构抽象）。
> 方法与限制：变量名已压缩，无法恢复原始命名；以下所有结论均为结构级推断，
> 引用证据时给出 `模块:行为`，不做臆测。**本文档基于静态阅读，未运行任何线上请求。**

- 游戏版本标记：`GAME_BUILD = "2026.11.14a"`（telemetry.js）
- 运行形态：浏览器端 WebGL2 体素射击，自研引擎，**零 import/export，全局变量耦合**
- 平台：B 站 Toy（App 内 iframe / 网页），后端 `https://xz.honghemc.cn:8443`

---

## 一、架构分层视图

### 1.1 分层总图

```
┌─────────────────────────────────────────────────────────────────┐
│ L7 平台特化层（potato.js ~562KB 巨石 + 外部 XZ 脚本[不在源码树]）    │
│    大厅 LobbyScreen / 天梯 UI / 对局 HUD / 签到 / 股东 / 分享      │
├─────────────────────────────────────────────────────────────────┤
│ L6 平台服务层（toy / account / telemetry / cloudsave / social /   │
│    news / checkin / shareholders / live / minigame / anticheat）  │
├─────────────────────────────────────────────────────────────────┤
│ L5 网络层（net.js NetClient+RoomService / p2p.js / netconfig.js） │
├─────────────────────────────────────────────────────────────────┤
│ L4 玩法系统层（redstone / enchant / effects / equip / vehicles /  │
│    raids / specials / workstations / merchant / cmdrun / cmdblock│
│    potato.js 之外的第一赛季射击玩法主要在 potato.js 内实现）        │
├─────────────────────────────────────────────────────────────────┤
│ L3 实体与 AI 层（entity / mobs2 / mobs_animals / mobs_water /     │
│    mobs_hostile / nether_mobs / village_mobs / vmobs / spawning /│
│    mobitems / itemuse / entitydata / emodel / etex）              │
├─────────────────────────────────────────────────────────────────┤
│ L2 世界与生成层（world / blocks / terrain2 / worldgen / features /│
│    trees / structgen / structtypes / structures / anvil / nbt）   │
│    + Worker：gen_worker.js(地形生成池) / chunk_worker.js(生成+网格)│
├─────────────────────────────────────────────────────────────────┤
│ L1 渲染层（render / render2 / shaders / mesher / models / vmodels │
│    / draw2 / blockents / decor / panorama / audio / subtitles）   │
├─────────────────────────────────────────────────────────────────┤
│ L0 UI/输入/核心框架层（ui / screens / game / controls / touch /   │
│    mobile / onboard / perf / main / util / save / extras）        │
├─────────────────────────────────────────────────────────────────┤
│ L-1 数据基础层（blockdata 685KB / itemdata / recipedata /         │
│    worldgen_data / assets / assets_i1 / assets_i2 / emoji / texts │
│    / mods / mods_data / modapi / integrity / mods_ui / mods_code）│
└─────────────────────────────────────────────────────────────────┘
```

层间依赖方向：向下单向为主；唯一系统性**穿透所有层**的模块是 `game.js`
（出边 43，横向依赖几乎所有系统）与 `net.js`（出边 39）。这是全局变量耦合
架构的必然结果：没有依赖注入，集成点只能长成巨石。

**注意一个 module-map 的偏差修正**：pack4 中的 `beacon.js` 经核实是
**游戏内信标方块**（BEACON_POWERS/BEACON_BASE/光柱渲染），不是网络信标；
它属于 L4 玩法层，与网络无关。

### 1.2 启动链（boot sequence）

1. `index.html` 按固定顺序注入 103 个 `<script>`（或 dist 下的 pack1→4）。
   **顺序不可变**（后文 §3.1）。
2. `integrity.js` 最先加载：注册脚本收集器（含 MutationObserver 防动态注入），
   `window.load + 15s` 后做 SHA-256 摘要上报（前 8 字节 hex）。
3. `main.js` 末尾 `window.addEventListener("load")`：`new Game()` →
   `game.init()` → 失败则显示 `#err` 兼容提示（要求 WebGL2/硬件加速）。
4. `game.js init()`（game.js:158）：初始化 renderer/pacer/ui/settings/
   chunkWorker（`file:` 协议下禁用 worker）；非 POTATO 环境尝试建 GenPool。
5. `telemetry.js` 通过 `Game.prototype.init` 包装（telemetry.js:359）在 init
   完成后挂 Telemetry/Crumbs/Instances/SensorProbe。
6. `potato.js` 在加载期把 `TitleScreen` **替换**为 `LobbyScreen`
   （potato.js:1908：`self.LobbyScreen = LobbyScreen; TitleScreen = LobbyScreen`），
   并挂 `self.POTATO` 门面。**即：启动链没有条件分支——只要加载了 potato.js，
   标题画面就是 B 站大厅。**

### 1.3 一帧的生命周期（frame → tick → render）

主循环由 `FramePacer`（perf.js）驱动：

- `FramePacer.schedule()`：vsync 时走 `requestAnimationFrame`，否则用
  `MessageChannel` 宏任务自旋；自动测刷新率（rafD 间隔的 P20）。
- **AFK/挂后台降载**：无输入 60s 限 30fps、600s 限 10fps（`afk` getter）；
  暂停菜单（单人）也限 30fps；`cappedFrame` 会被遥测排除出帧率样本。
- `run()` → `frame(dt)` → `PerfMon.frame(dt, cpuMs, chunkMs, game)` →
  `DynRes.frame()`（动态分辨率，±0.1 步进，0.5 下限，含 trial 回退机制）。

`Game.prototype.frame`（game.js:1011）与 `Game.prototype.tick`（game.js:1176）
分离：frame 是状态机 + 分帧任务调度，tick 是 20Hz 固定逻辑（`tickCount`）。

一帧（play 状态）顺序：

```
Game.frame(dt)
 ├─ net.drainChunks(budgetMs)     ← net.js 包装：把区块报文处理限流到帧预算
 ├─ state==="loading" → updateChunks(30) + 进度计算 + watchdog
 ├─ state==="play"
 │   ├─ updateChunks(chunkBudget())   ← pacer.budget()：目标帧时-实测耗时×backoff
 │   ├─ autosave（45s 间隔；saveQ 分帧：每帧 ≤1.5ms 编码脏区块）
 │   └─ → Game.tick()（20Hz）
 │        ├─ readInput → player.tick → tickPlayerBody
 │        ├─ net ? netInteraction + netTick        ← 服务器权威分支
 │        │     (p2pHost.tick 在 Game.tick 外层包装中调用)
 │        ├─ p2pGuest ? p2pGuest.tick
 │        ├─ tickPortals / spawners / entities(可见性门控)
 │        ├─ blockEntities / randomTick / etc.
 │        └─ guard(name, fn)：每项子系统有 try/catch + 错误聚合
 └─ Game.render → Renderer（chunk 管线 / 实体 / 天空 / UI canvas / HUD）
```

`guard()` 是游戏自研的**子系统隔离**机制：单个子系统抛错被捕获并聚合计数
（进 Telemetry.error / errLog），不拖垮整帧。这是该代码库最重要的健壮性设计。

### 1.4 区块生成流（worker 通信）

两条 worker 通道，均在 terrain2.js：

**A. GenPool（gen_worker.js，1~3 个，按硬件：`genWorkerCount()`）**
- 角色：纯地形生成（worldgen 2.0）。`file:` 协议、worker 报错 6 次以上、
  生成失败会自动降级 `GenPool.inline = true`（主线程内联生成）。
- 复用主线程同一批全局脚本（importScripts assets/util/worldgen*/blockdata/modapi）。

**B. ChunkWorker（chunk_worker.js，单实例，磁盘直载）**
- 角色：区块生成状态机 + **光照 + 网格化（mesh）**。
- 协议（terrain2.js ChunkWorker ↔ chunk_worker.js）：
  - 主→worker：`reset{epoch,seed,dim,minY,structures}`、`have{keys,biomes}`、
    `skip{keys,stages}`（毒区块黑名单）、`opts{fastLeaves}`、`center{cx,cz,R}`、
    `mesh{ids,metas,lights,tints,tints2,biomes}`（六个 Transferable）、`ping`、
    `unloaded{keys,ask}`。
  - worker→主：`ready`、`final{epoch,cx,cz,sec,biome,sx,nb}`（含周边 9 区块
    biome，Transferable）、`mesh{id,...顶点数据}`、`held{keys,ask}`。
  - **epoch 世代机制**：每 reset 一次 epoch++，旧世代消息全部丢弃——
    避免换世界/换维度时的串档。
  - **健壮性**：心跳 ping、20s 无响应判 stuck（记录毒区块+重启），重启 3 次后
    放弃 worker 改主线程生成（`fail()`）。毒区块 `poison Map` 防止重复卡死。

### 1.5 存档流

三层存储（save.js）：`IndexedDB(主) → localStorage(降级) → memory`，
DB.open 有 8s 超时与自动修复（版本升级重试 ≤4 次）。

写入链：

```
Game.autosaveStart()                    ← play 状态每 45s（ potato 对局中跳过）
  → saveQ 分帧编码脏区块（每帧 ≤1.5ms） → saveWorld(!0)
      → DB.putChunks(store, [key, encodeChunk(chunk)])
        ├─ CloudSave 拦截：DB.putChunks 被包装（cloudsave.js:94），
        │  把 key 记入 dirty 集合（localStorage 持久化 mcjs-cloud-dirty-*）
        └─ Instances.stale ? 丢弃（防多标签页互相覆盖）
云同步（CloudSave.sync）：退出到标题 / 每 10min / 页面关闭时增量推
  → 自定义二进制格式 OMCC（12 字节头 + meta JSON + [2B keylen|key|4B len|chunk]×n）
  → POST /api/cloud/push（前缀 "OPMCT"+token 的裸 token 鉴权，见网络文档）
  → 4MB 批次循环直到推完；冲突返回 {conflict} 触发 CloudConflictScreen
```

**存档格式**：`encodeChunk` 产 `{b:Uint16 方块, m:Uint16 meta, w?:Uint32 waterlogged}`
三段拼接（12 字节长度头）——与 p2p 的 `p2pPackChunk` 完全同构（p2p.js 直接复用），
即 **区块线格式 = 存档线格式 = p2p 区块线格式**，一处格式演进三处同变，属强耦合点。

### 1.6 UI 层

- `ui.js`：Font/图标/ContainerScreen 体系/输入框，canvas 2D 绘制，**不持有游戏状态**
  （screen 通过 game 引用读状态）。
- `screens.js`：全部菜单屏（标题/世界列表/创建/加载等）。
- `controls.js + touch.js + mobile.js`：键位映射（KEY_DEFAULT/KEY_CN）+ 触控 +
  手机布局；`onboard.js` 首启引导（含 FPS_TEST_V 设备分级）。
- **potato.js 大厅是 HTML/DOM 层**（`#lobby` 容器 + CSS 注入），与 canvas UI
  并存；`UI.prototype.open` 被 potato 多次包装做 screen 替换（Wardrobe→
  PotatoWardrobe 等）。DOM 大厅与 canvas 游戏通过 `game.lobby.moveTo` 相机
  联动——这是 MVP 向 hybrid UI 的罕见组合，维护成本高。

---

## 二、关键耦合点与脆弱点

### 2.1 全局变量依赖热点（对抗性维护的最痛处）

| 热点 | 证据 | 后果 |
|---|---|---|
| blocks.js（97 全局，被 70 模块依赖） | module-map §4.1 | 任何方块语义变更牵动全库；重命名风险为零容忍 |
| game.js（43 出边） | game.js 是状态机+主循环+网络钩子+指令钩子的合体 | 无法局部重构；一切新玩法最终都在 game.js 或 potato.js 落地 |
| monkey-patch 链 | net.js 末尾 ~20 个 IIFE 逐层包 `NetClient.prototype.onMessage`；telemetry/cloudsave/p2p/potato 全部用 wrap-patch | **onMessage 语义 = 6 层包装叠加**，调用顺序=加载顺序，任何 pack 顺序错误都会静默改变行为 |
| p2p.js 直接改 DB/World/Game 原型 | p2p.js:1224-1395 | 存档 API（DB.putChunks 等）被运行时替换；`p2p~` 前缀世界 ID 是隐式协议 |
| `self.XZ` 外部依赖 | potato.js 引用 ladderStart/match/tourStart/pmPartyCreate/guestFetch/pmTop，**源码树中无定义** | 天梯核心逻辑在宿主注入的外部脚本里（见 network-protocols.md §6），源码不完整——这是最大的知识缺口 |

### 2.2 单文件巨模块

- **potato.js ~562KB（9604 行）**：Lobby/对局/枪械/皮肤/签到/股东/分享全在里面。
  是第一赛季玩法的真正主体，却同时是 monkey-patch 的最大来源——它 patch 了
  UI.open/UI.message/Player.tick/Player.hurt/PauseScreen/TitleScreen 等。
  **任何对 game.js 的语义修改都可能被 potato.js 的 patch 覆盖或放大。**
- game.js 218KB / entity.js 97KB / net.js 150KB：均为"集成巨石"。
- 数据巨石（blockdata 685KB / entitydata 198KB / itemdata 150KB）：纯数据，
  风险低，但拖累加载（dist pack1 首屏）。

### 2.3 worker 共享脚本

gen_worker/chunk_worker 经 importScripts 复用主线程全局脚本 →
**worker 侧与主线程必须同步升级**；mods 通过 `?mods=a,b` query 传入 worker
（chunk_worker.js:4）。任何 mod 更新都要保证主线程与 worker 的脚本版本一致，
否则区块语义分裂（这是 mod 系统限制"客人没有模组"的根因之一）。

### 2.4 其他脆弱点

- **NET_DELAY=110ms 快照插值**（net.js:4198）：基于 snaps 缓冲的 1.5×snapGap
  外推，实体移动观感对网络抖动敏感。
- **帧预算联动**：chunkBudget ↔ drainChunks ↔ meshResQ 三处共享 pacer 状态，
  调整任意一处都可能引发加载卡顿回归。
- **`game` 全局单例**：`window.game`（main.js:427），p2p/cloudsave/telemetry
  的包装代码直接引用 `game`——加载顺序依赖 + 测试不可隔离。
- **AntiCheat 的 scan** 依赖原型链特征（`/^__sw/i`、`SW\.hacks` 正则），
  对混淆后的第三方脚本脆弱，且为纯客户端检测（见 §四）。

---

## 三、反作弊边界（anticheat.js + integrity.js + telemetry.js）

### 3.1 覆盖面

**anticheat.js（纯客户端 + 房主校验）**
- 本地自检 `scan()`（5s 轮询）：原型链搜 `/^__sw/i` 属性标记、`tick` 源码含
  `SW\.hacks`、player 上有自有 `creative` 属性、`breakSpeed` 自有属性、
  DOM 中 `.sw-root/.sw-panel` 面板 → 结果经 `net.send({t:"flag"})` /
  `p2pGuest.send` 上报 + Telemetry.event("ac")。
- P2P 房主侧裁决 `p2pHit`：距离（近战 3+目标宽/2+2.2，矛 4.5，远程 80）、
  频率（>20 hits/1s）、攻速修正伤害上限公式（含 UNDEAD/ARTHROPOD 加成、
  mace 坠落加成），超限则 flag + clamp 伤害。
- `p2pState`：移动校验——生存飞行（flying 且无 elytra/无水/无可攀）连 3 次
  flag；4s 窗口内垂直爬升 >4 格 flag（有 solid/fluid/special 方块支撑则豁免）。
- ** rooms（NetClient）模式下没有移动/伤害校验**：`t.net` 只接收 flag 自报，
  服务器权威，客户端 anticheat 仅在 P2P 中当裁判。

**integrity.js**：收集 document.scripts + MutationObserver 动态脚本 +
performance resource entries，对 index.html（去掉 Toy head 注入）与全部
相对路径 .js 做 SHA-256 前 8 字节摘要 → `hello` 报文 `ic` 字段随
NetClient/P2P 握手上报（不阻断执行）。**注意：摘要按文件路径而非全文件清单
聚合，且拆分/重建后哈希必然变化——所以 ic 是"环境指纹"而非"白名单校验"**。

**telemetry.js**：错误聚合（page/promise/reportError，按消息去重 ≤50 种）、
卡顿记录（>100ms 帧，≤100 条，含 cpu/chunk/ents/dim/screen）、RTT（10s 一次
`{t:"ping"}`）、行为计数（screen 打开/命令/死亡原因/world 操作）。

### 3.2 明显盲区（按风险排序）

1. **rooms 模式下伤害/移动完全信任客户端**（客户端发 `tick{pos,keys}`，
   服务器转发）——除非服务端（未开源）有校验，否则瞬移/加速/改包不可检测。
   anticheat 的 hit 校验只存在于 P2P 房主端。
2. **物品栏完全客户端预测**：NetClient.predict 本地先行，服务器只收
   `click{changed[]}` diff——恶意客户端可直接发送任意 changed 列表
   （创造模式甚至每 tick 发整栏 `creative`）。
3. **自检可被针对性绕过**：scan 特征固定（`__sw` 前缀、SW.hacks 正则），
   改名即可绕过；scan 本身可被 `Function.prototype.toString` hook 欺骗。
4. **ic 指纹无服务端基线**：拆包/重建后哈希即变，未见服务端比对逻辑
   （客户端侧无从证实，标记为知识缺口）。
5. **token 走 POST body（`_t`），无签名报文**：改包工具重放 `attack`/
   `place` 无非对称保护。
6. **telemetry 可关闭**（settings.telemetry=false），检测数据可被关掉。

---

## 四、性能预算（perf.js + telemetry.js 的自我口径）

### 4.1 游戏自己定的预算

| 预算项 | 值 | 出处 |
|---|---|---|
| 区块处理帧预算 | `(target − rest − 0.15×target) × backoff`，clamp 0.5~12ms | perf.js FramePacer.budget() |
| 超预算回退 | backoff ×0.7（下限 0.25），恢复 +0.01/帧 | perf.js run() |
| 动态分辨率 | 触发：均值 >1.12×target 或 miss>15%；恢复：均值 ≤1.05×target 且 miss<5%；步进 0.1，下限 0.5，试验回退（trial>0.93×before 判 CPU 瓶颈，60s 不再降） | perf.js DynRes |
| AFK 限帧 | 60s 无输入→30fps；600s→10fps；暂停菜单 30fps | perf.js limit getter |
| 自动存档分帧 | 每帧编码 ≤1.5ms | game.js autosaveStep |
| 网络区块处理 | drainChunks 每帧 ≤budget（loading 时 max(6, budget)，队列>300 时 ×2） | net.js drainChunks |
| 画质预设 | low: RD6/0.75x/无云/fast；medium: RD8/1x/fast；high: RD12/fancy；ultra: RD16/fancy/无 DynRes | perf.js PRESETS |
| 设备分级 | GPU 名正则（swiftshader→low；nvidia/apple M→high）+ cores/mem | perf.js detectPreset |
| 生成线程数 | ≤4 线程或 <4GB→1；≥12 线程且 ≥8GB→3；否则 2 | perf.js genWorkerCount |

### 4.2 监控口径（telemetry 采集，分钟粒度）

每分钟一个 `point()`：fps、p50/p95/p99 帧时（201 桶直方图）、cpu/chunk/render
均值、GPU 均值（EXT_disjoint_timer_query_webgl2，F3+L 开启）、
heap（performance.memory）、实体/区块数、rd/dyn/res/preset 设置快照。
异常：>100ms 帧记 stall（含 screen 名与维度）；错误按消息聚合。
会话包（≤12 万字节）每 5 分钟或 pagehide 发 `/api/telemetry`。
RTT：net 下每 10s ping/pong，报 p50/p95/max。

### 4.3 调试命令（8812 冒烟发现的"长时间测试"）

- `F3+L`：10 秒性能报告（PerfMon.record → 剪贴板/控制台）。
- `Game.prototype.longRun(minutes=60)`（perf.js:700）：创造模式限定，
  **自动飞行向前、每 180s 循环开/关工作台与暂停菜单、RD +4 再还原**，
  每秒记一行（fps/p99/max/entities/mobs/pending/chunks/heapMB/meshMB/
  resScale/backoff…），结束自动下载 CSV——这是官方的长时间稳定性
  冒烟工具，回归测试可直接调用（需创造模式 + `game.longRun(60)`）。
- `e.longRunStop()` 可中途终止；`t.longRunRows` 保留数据。

---

## 五、数据流补充：Mod 系统与平台层

- **Mod**：`mods.js`（装载器）→ `modapi.js`（42KB 门面，0 顶层导出、16 依赖，
  是给 mod 用的 API 面）→ `mods_ui/mods_code`（收尾）。mod 数据进 worker
  （§2.3）。联机时 rooms 房主世界可带 mod，p2p 客人不装（welcome 报文带
  mods 名单提示"模组只在房主那边生效"）。
- **平台层依赖方向**：toy.js（postMessage RPC to parent，带 mock 面板）→
  account.js（token 账号，`_t` POST 参数）→ telemetry/news/checkin/
  shareholders（全部走 RoomService.base() 同一后端）。B 站身份流：
  Toy.profile() → POST /api/account/bili {openId,nickname,avatar} → token。
- **Live**：服务端下发配置开关（`Live.get("client.telemetry")`、
  `client.announceMin`），相当于远程 feature flag。

---

## 六、与 W5b 并行的写入边界

本文件与 network-protocols.md、adr.md 均为 W3 新增文件；未改动
`/workspace/src/` 任何字节，未改动 module-map.md。W5b 更新 module-map 时，
本文件的分层图引用的模块清单以 module-map 最新版为准。

## 七、待确认知识缺口

1. **self.XZ 的实现与部署位置**（天梯/对局/组队核心，源码树缺失）——
   需要主理人确认是否能把宿主注入脚本纳入还原范围。
2. **服务端（rooms/pm）实现**：`netconfig.js` 只有地址；proxy 提示语
   （DirectConnectScreen："先启动 multiplayer/proxy 的联机中转
   （node src/proxy.js）"）表明存在配套服务端仓库，未在本次还原范围内。
   本文档对服务端行为的全部描述均标注为客户端侧推断。
3. `integrity` 上报在服务端的比对策略（是否封禁、基线如何更新）未知。
