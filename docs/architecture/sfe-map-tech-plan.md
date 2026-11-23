# W10b 搜打撤大地图技术方案（sfe-map-tech-plan）

> 作者：程基岩（技术负责人）。任务：Task ID = W10b，P0。
> 方法：对 `/workspace/src/` 的**静态只读分析**（未改动 src 任何字节，未发任何线上请求）。
> 上游对接：W10a《搜打撤交互规格与数值》（`docs/gdd/06-sfe-spec.md`，本文引用为"W10a 对接点"）。
> 下游：W10c《搜打撤实现》按 §5 路线图执行。
> 结论口径：所有数据均给出来源 `模块:行为`，估算值明确标注"估算"。

---

## 一、现状盘点（搜打撤地图的参照物与可复用资产）

### 1.1 对局竞技场现状——"大"的参照物

对局世界不是噪声地形，而是**超平坦 + 手工搭建**，全在 potato.js 内：

| 对象 | 尺寸（方块） | 面积 | 证据 |
|---|---|---|---|
| 天梯竞技场（xzduel /"天梯竞技场"） | 43 × 27（x −21..21，z −13..13） | ≈1,161 m² | potato.js:6989 `arena:{x0:-21,x1:21,z0:-13,z1:13}` |
| 射靶场 range | 111 × 201（x −55..55，z −169..31） | ≈22,311 m² | potato.js:6988 |
| 竞技场手工装饰（体育馆场景） | 约 97 × 79（x −48..48，z −64..14） | ≈7,663 m² | potato.js:152 `buildScene()`，四角 chunk `isLoaded` 门控（potato.js:154-161） |

生成方式（potato.js:7014-7038）：monkey-patch `World.prototype.generateFlat`，在超平坦层上按边界矩形铺 `smooth_stone`（y=3）+ `gray_concrete`（y=2），biome 强制 PLAINS；配套：对局世界强制 `sky=4`（potato.js:7004-7007）、时间锁正午、禁雨（potato.js:7040-7057）。**没有地形、树、结构、矿洞——现状对局与 worldgen 管线零交互。** 结论：搜打撤大地图不是"把竞技场放大"，而是首次在对局内接入 L2 世界生成层，这是本方案的核心判断。

### 1.2 现有 worldgen 管线能直接复用什么

| 资产 | 状态 | 复用方式 |
|---|---|---|
| 噪声地形（overworld spawn_target/temperature/humidity） | 完整，Minecraft 式 6 通道噪声（worldgen.js:2564-2574） | 直接复用；建议给 SFE 专用 noise settings 子集以控成本（§2.4） |
| 树/植被 features | 完整，逐 chunk Xoroshiro 种子化（features.js:17 WRand，features.js:325 setSeed）——**同 seed 确定性** | 直接复用 |
| 结构 structgen | 完整 `random_spread` 网格落位：spacing/separation/salt（structgen.js:304-306、330-344）——**这就是现成的确定性 POI 落位器** | 直接复用，自定义 placement 表 |
| 结构蓝图数据 structures_data/structtypes | 完整（vanilla 结构格式） | 新增 SFE 蓝图按同格式扩展 |
| 出生点选择 | `spawn_target` 环境匹配（worldgen.js:2564） | 可用于"进图落点"选取 |
| 矿洞/湖泊等 | 随 noise settings 走 | 可关可开 |

### 1.3 chunk 流式加载与视距的现有参数（基线）

- **区块**：16×16×HEIGHT；默认 `HEIGHT=256, SEA=62, MIN_Y=0`（util.js:4-12；384/-64 仅在特定条件启用）。
- **视距**：`viewDist() = settings.renderDist`（game.js:140），画质预设 RD6/8/12/16（perf.js PRESETS，见 architecture.md §4.1）。
- **加载半径**：请求半径 `rd+1`，圆形裁剪 `(rd+1.5)²`，按距离**由近到远**排序生成（game.js updateChunksIn，game.js:705-730）。
- **首屏**：loading 状态只加载 `min(3, rd)` 半径（game.js:710-711），即半径 3 圆 ≈ 37 区块；其余进入 play 后流式补。
- **网格化**：需 3×3 邻居齐备才 mesh（game.js:737-747）；ChunkWorker 在飞 mesh 上限 **64**（game.js:752-754）。
- **卸载**：`(rd+2.5)²` 外丢弃渲染、回收 chunk（game.js:770-780）；**关键复用点**：已修改区块卸载时 `savedChunks.set(key, encodeChunk(chunk))` 保留在**内存** map（game.js:772-775），重进时恢复——大图内"逛过的区域改动不丢、未逛区域不驻留"机制现成。
- **帧预算**：chunk 处理预算 = pacer.budget()（clamp 0.5~12ms），超时 backoff ×0.7（perf.js）。
- **fog**：`far = max(256, 16×rd×1.6+64, cloudRange+160)`（render.js:1505），fog 与 rd 联动。
- **draw call 结构**：逐 chunk-section 逐 pass（不透明 + 半透明各一次 drawElements，render.js:630-650 secDraw）→ draw calls ≈ 可见 section 数 × 2。
- **worker 通道**：GenPool 1~3 个（按核数/内存，perf.js genWorkerCount），失败自动 inline 主线程降级（terrain2.js:349-528）；ChunkWorker 单实例带 epoch 世代 + 毒区块 + 20s stuck 重启（terrain2.js:636-885）。**worker 经 importScripts 复用主线程全局脚本**——新增地图数据必须主线程/worker 同步（architecture.md §2.3）。

---

## 二、大地图方案

### 2.1 目标尺寸（三档）

一 chunk = 16×16 = 256 m²。参照物：竞技场 1,161 m²、靶场 22,311 m²。

| 档 | 边长 | 面积 | chunk 数（含边界） | 相对竞技场 | 相对靶场 | 估算内存（驻留 chunk 数据+mesh，rd=8 时） | 估算全图预生成时间（3 worker 桌面） |
|---|---|---|---|---|---|---|---|
| 保守 S | 480×480（30×30 chunk） | ≈23 万 m² | 900 | ×200 | ×10 | 40~80 MB | 15~40 s（不必全预生成，流式即可） |
| **推荐 M** | **720×720（45×45 chunk）** | **≈51.8 万 m²** | **2,025** | **×446** | **×23** | **60~110 MB** | **35~90 s（分帧/登机期预生成）** |
| 激进 L | 1024×1024（64×64 chunk） | ≈105 万 m² | 4,096 | ×903 | ×47 | 100~200 MB | 70~180 s |

> 估算依据：单噪声 chunk 打包后驻留约 40~80 KB（world.js packFrom 调色板 section：每 section 4096B 索引 + ≤512B 调色板，surface 约 6~10 个非空 section）+ mesh 顶点 10~40 KB。内存为 rd 视距内驻留 + 已访问改动 chunk（savedChunks）之和，非全图驻留。生成时间为 worker 吞吐估算（每 chunk 全管线 15~40 ms 桌面级），**首屏不依赖全图生成**（见 §2.5）。
> **推荐档理由**：720² 在 rd=8 下玩家 45s 内跑不到边界（按 4.3 m/s 疾跑），单局 15~25 min 的经典搜打撤密度足够；POI 网格 8×8 个仍从容；内存增量对 4GB 机可控。激进档的 chunk 生成积压在低端机会压垮 loading 体验，留作后续赛季。

### 2.2 生成策略与 seed 决策

**结论：固定 seed（版本内同 seed 同图），不用对局随机 seed。**

理由：
1. **PVE 首版公平与学习曲线**：搜打撤的核心乐趣是地图知识（物资点在哪、撤离路线）。随机 seed 会把 PVE 做成纯运气局，与"经典搜打撤"认知冲突。
2. **测试可复现**：固定 seed 使性能基线（首屏时间/内存/帧率）与 bug 报告可精确复现——对 W10c 验收和 telemetry 回归都是刚需。
3. **省掉一张同步成本**：多人生成路径（p2p/rooms）不需要分发 seed；固定 seed 编译进版本即可。
4. **确定性资产依赖**：§2.3 的 POI 网格落位与 seed 绑定（salt 校验同 seed 才稳定）。
5. 换图手段已有：**赛季/版本号切换 seed**（`mapVersion` 进 seed 派生），比随机化可控得多。

落地：SFE 世界用独立 `noise settings`（复用 overworld 数据裁剪 features/structures 子集，§2.4），seed = `hash("sfe-v1", 地图版本)`，走 `Game.createWorld` 现有流程（meta 标记 `mode:"sfe"`）。

### 2.3 POI 落位方案：哈希网格（复用 structgen）+ 手工蓝图混合

**三层结构，全部确定性（同 seed 同落点）：**

1. **物资点（高频，程序化）**：复用 structgen 的 `random_spread`（spacing/separation/salt，structgen.js:330-344）。推荐 spacing = 24 chunk（384 m）、separation = 8 chunk，即推荐档地图上约 9~12 个物资群；每个落点内用 Xoroshiro（features.js 同款）从 W10a 物资表抽容物品级，写入容器 blockents。**不要为物资点做手工蓝图**——数量多，程序化箱体即可。
2. **撤离点（低频，手工蓝图 + 网格锚定）**：4~6 个，位置由**固定哈希锚**（seed + 固定常数 salt，偏移格子中心 ≤ 半格 jitter）落位，放置 W10a 审定的手工蓝图（structures_data 同格式新增），落位前用地形高度/水面校验（复用 worldgen heightmap 查询），不合格按网格顺延。
3. **AI 巢穴（中频，手工骨架 + 程序填充）**：4~8 个，同撤离点网格锚定法；巢内刷怪用现有 spawners/guard 体系（game.js tick 的 spawners 已有可见性门控），激活半径圈定，避免全图 AI 常驻。

**为什么混合**：纯哈希网格对物资点足够且零美术成本；撤离点/巢穴是玩法锚点，需要规格侧（W10a）逐个审定结构，手工蓝图保证体验下限；网格锚定保证"同 seed 同位置"，同时避免手工坐标硬编码破坏 seed 可替换性。

### 2.4 视距与性能（移动端预算下的取舍）

- **视距**：SFE 不上调全局 rd，沿用设备分档（low RD6 / medium RD8 / high RD12，perf.js PRESETS）；大地图体感靠 fog 与地标补偿，不靠拉视距。对局竞技场现状用的超平坦反而更需要远视距，SFE 是自然地形，fog 前（`fogNear`~`fogFar` 联动 rd，render.js:1865-1869）会天然遮蔽远处。
- **draw call 控制**：现状逐 section 双 pass（render.js:630-650），rd=8 视距内可见 section 约 200~400 → draw calls 400~800，主流手机可用但偏紧。SFE 三板斧：① 地形起伏大、山体自然遮挡（frustum+距离剔除已有）；② DynRes 保持开启（下限 0.5）；③ **SFE noise settings 砍半透明面来源**（少水/少玻璃型植被）降低 translucent pass 占比。首版不做 section 合批（收益大但改动 render.js 风险高，列入风险表监控）。
- **生成侧**：SFE 专用 noise settings 裁剪——overworld 完整管线含结构引用查找（需周边 chunk biome，9 区块协议，architecture.md §1.4）与大量 features；SFE 首版建议：保留地形/树/常规矿洞，砍掉村庄/遗迹等重型结构（改由 §2.3 POI 承担玩法密度），features 集合减半。这一刀预计把单 chunk 生成成本降 30~50%（估算，需 W10c 实测标定）。
- **chunk 积压**：沿用 chunkBudget backoff + mesh 在飞 64 上限 + 毒区块跳过；loading 阶段维持 `min(3, rd)` 首屏圈，**余下预生成挪进"登机/匹配等待期"**（对局制天然有等待 UI，此时无帧率压力，`updateChunks(30)` 全速跑）。

### 2.5 局终即弃：临时存档与清理策略

**结论：对局全程不落盘，仅结算时写一条摘要记录。**

- **不落盘的依据**：① potato 对局中已跳过 autosave（game.js autosave 链，architecture.md §1.5）；② 未修改 chunk 卸载时本就不进 savedChunks（game.js:772-775 只存 modified）——SFE 挂掉/撤离后世界直接释放，改动随对象 GC，无需清理动作。
- **必须加一道闸**：cloudsave.js:94 全局包装 `DB.putChunks`，任何 DB 写入都会进云端 dirty 集合并被 sync 推走。SFE 世界 meta 加 `ephemeral:true`，cloudsave 包装层遇 meta.ephemeral 直接放行为 no-op；`DB.putWorld` 同理（对局制已有先例：potato.js:7004-7007 在 createWorld 期间改 putWorld）。**这是唯一"不落盘"的薄弱点，必须显式封堵。**
- **结算落盘**：只写结算摘要（带出物资清单/击杀/存活时长），复用现有账号/云存档通道，粒度 KB 级；chunk 级数据一律丢弃。
- **内存释放**：局终 `world` 引用置空 + `renderer.dropChunk` 全量 + ChunkWorker `reset`（epoch++ 自带旧世代丢弃，terrain2.js:771-781）。W10c 验收项：连续 10 局 heap 无增长趋势（用现成 `longRun` 口径，perf.js:700）。

---

## 三、性能预算表（分设备档）

口径沿用 perf.js/telemetry.js（PerfMon F3+L、分钟 point()、>100ms stall）。

| 指标 | 低端安卓（≤4 核或 <4GB，GenPool=1，RD6，DynRes 开） | 主流手机（8 核 8GB，RD8~12） | 桌面（RD12~16） |
|---|---|---|---|
| 首屏（半径 3 圈 ≈37 chunk + 3×3 mesh） | ≤ 10 s | ≤ 6 s | ≤ 3 s |
| 登机期预生成（推荐档，目标覆盖出生区 ±16 chunk） | ≤ 40 s（可后台继续流式） | ≤ 25 s | ≤ 12 s |
| 稳态帧率（play，无 AI 战斗峰值） | ≥ 25 fps（DynRes 兜底） | ≥ 45 fps | ≥ 60 fps |
| 战斗峰值帧（巢穴 8~12 AI + 枪械特效） | ≥ 20 fps，stall(>100ms) ≤ 2 次/min | ≥ 30 fps | ≥ 60 fps |
| 内存增量上限（对局全程 vs 进图前） | ≤ 180 MB | ≤ 300 MB | ≤ 450 MB |
| chunk 积压策略 | genQueue>300 时 backoff 加速收敛；毒区块即跳；允许视距内未成 mesh 的 chunk 晚 1~2 帧出现 | 同左，mesh 在飞 ≤64 照常 | 不设额外限制 |
| 超标动作 | **地图减档 M→S** + RD 锁 6 + fog 收紧 30% | RD 锁 8 | 无 |

> 首屏不承诺"全图就绪"，承诺"出生点 ±48 m 可玩 + 边走边补"；这是流式架构（§1.3）的既定行为，不加码。

---

## 四、风险与降级（Top 3）

| # | 风险 | 触发信号 | 降级方案 |
|---|---|---|---|
| 1 | **完整 overworld 管线单 chunk 生成成本超预算**（结构查找需 9 区块 biome 协议 + features 全集，低端机 GenPool 仅 1 线程，首屏/预生成超时） | 首屏 >10 s；登机期预生成完成率 <60%；chunkMs 长期贴 12ms 上限 | ① §2.4 noise settings 砍 features/结构集；② 仍超 → **超平坦基底 + 手工地景蓝图**混合（竞技场已验证 generateFlat 注入路径，potato.js:7014，把"平地"换成噪声投影表）；③ 终极 → 地图减档 S（900 chunk） |
| 2 | **内存超限**：大图内逛区域改动必须驻留（savedChunks），物资容器/巢穴改动累积 + 低端机 4GB 上限 | telemetry heap 曲线持续爬升；DynRes 频繁触底 0.5 | ① 战利品改动下沉到 blockents 级而非整 chunk 编码（blockents 系统已有，容器开箱只落容器状态）；② **地图减档 M→S**（内存近似线性于已访问面积）；③ rd 降档 |
| 3 | **移动端 draw call/overdraw 超预算**（逐 section 双 pass，rd=8 约 400~800 draw calls + 自然地形遮挡差于人工场馆） | GPU 耗时占比高、DynRes <0.7、stall 集中在 render | ① **视距减半**（RD8→RD4~6）+ fog 收紧，代价最小；② translucent pass 削减（§2.4）；③ 再不行锁 S 档小图。section 合批留作二期优化，首版不动 render.js |

次级风险（记录在案）：worker 与主线程脚本版本不一致导致 chunk 语义分裂（新增 sfe_mapdata.js 必须**同时**进主线程加载链与 gen_worker/chunk_worker importScripts，architecture.md §2.3）；cloudsave/p2p 生命周期串档（世界 meta 唯一前缀 `sfe~`，不复用 p2p~，epoch 机制已兜底换世界）。

---

## 五、给 W10c 的实现路线图（6 步，每步有验收）

| 步 | 内容 | 验证标准 | 与 W10a 对接点 |
|---|---|---|---|
| 1 | **SFE 世界工厂**：`createWorld(mode:"sfe")` 分支——固定 seed、独立 noise settings、meta.ephemeral、cloudsave/putWorld 闸门、局终释放 | 能进/出对局；全程 IndexedDB/云无 chunk 写入；连开 3 局 heap 回落 | 对局入口/结算 UI 的模式标识 |
| 2 | **边界与尺寸**：世界边界（推荐档 720²）+ 玩家位置 clamp + 边界视觉墙/fog | 边界外不可达；边界处无 chunk 生成请求 | 地图形状与边界表现规格 |
| 3 | **POI 管线 v1**：random_spread 物资群 + 容器 blockents 落品 + 落点校验 | 同 seed 两台设备落点哈希一致（落点坐标列表 diff = 0） | 物资表、箱型、品质分布（W10a §物资） |
| 4 | **撤离点与巢穴**：网格锚定蓝图 + spawner 激活半径 | AI 仅在巢穴半径内活动；撤离点蓝图完整放置 | 撤离点数量/位置约束、巢穴密度（W10a §撤离/§AI） |
| 5 | **撤离与结算**：撤离判定、死亡掉落回收、结算摘要落盘、世界释放 | 连续 10 局：无落盘泄漏、heap 无增长趋势、结算数据完整 | 死亡掉落规则、结算字段（W10a §掉落/§结算） |
| 6 | **性能分档落地**：设备档 → rd/地图档映射、登机期预生成调度、budget 标定 | 三档设备指标达 §3 预算表；F3+L 报告归档为基线 | 无（纯技术） |

**对接点清单（需 W10a 给输入的时机）**：步 3 前要物资表终稿；步 4 前要撤离点/巢穴规格；步 5 前要掉落与结算规则。步 1/2/6 无阻塞依赖。

---

## 六、改动面预估（只列不动）

### 新增模块（建议 4 个，全部走全局脚本链）

| 模块 | 职责 | 体量预估 |
|---|---|---|
| `sfe_world.js` | 世界工厂/生命周期/边界/结算释放 | 小 |
| `sfe_poi.js` | random_spread 落位 + 网格锚定 + 落点校验 | 小 |
| `sfe_mapdata.js` | POI placement 表、撤离点/巢穴蓝图引用、seed 派生常量；**必须可被 worker importScripts** | 中（数据为主） |
| `sfe_rules.js` | 撤离判定/死亡掉落/结算摘要（挂 game.tick guard） | 中 |

### 改动的现有模块（清单，W10c 执行时再动）

| 模块 | 改动点 | 风险 |
|---|---|---|
| game.js | createWorld 分支、边界 clamp、sfe tick guard 挂载 | 高（43 出边巨石，改动最小化，全部走独立 sfe_* 模块承接） |
| potato.js | 大厅入口/对局 UI/结算屏 | 高（monkey-patch 之源，只加不改已有 patch） |
| world.js | 世界边界查询/玩家 clamp 钩子 | 中 |
| terrain2.js | SFE noise settings 注入、gen2 中心调度复用 | 中 |
| gen_worker.js / chunk_worker.js | importScripts 增加 sfe_mapdata.js | **中高**——主线程与 worker 必须同版本，pack 顺序不可变 |
| cloudsave.js | putChunks/putWorld 的 ephemeral 守卫 | 中（包装链第 N 层，注意顺序） |
| onboard.js / perf.js | SFE 设备分档映射（rd/地图档） | 低 |
| blockents.js | 容器战利品落品（复用为主） | 低 |

### worker 侧影响评估

- GenPool 与 ChunkWorker 经 importScripts 复用主线程脚本：`sfe_mapdata.js` 是唯一必须进 worker 的新文件；POI 落位若只在主线程做（chunk 生成后主线程补箱体）可**完全绕开 worker 改动**——推荐 W10c 优先走这条路（步 3 落点由主线程 blockents 写入），worker 侧仅剩 noise settings 数据同源要求，风险面缩小一个量级。
- epoch 机制天然支持"局终 reset"（terrain2.js:771-781），无需新增世代协议。

---

## 附：本方案的证据清单（主要出处）

- 竞技场边界/超平坦注入/时间锁：potato.js:6987-7057；手工场景：potato.js:152-299
- 区块加载/卸载/预算：game.js:693-790（updateChunksIn）、game.js:140（viewDist）
- 视距预设与设备分档：perf.js PRESETS/genWorkerCount/detectPreset（architecture.md §4.1 引）
- fog/draw call：render.js:1505（far）、render.js:630-650（secDraw）、render.js:1865-1869（fogNear/Far）
- 噪声与出生点：worldgen.js:656、2564-2574；区块高度：util.js:4-12
- 结构网格落位：structgen.js:304-306、330-370；features 确定性：features.js:17、325
- GenPool/epoch/毒区块：terrain2.js:349-528、636-885；chunk 内存：world.js:183-230
- 云存档拦截点：cloudsave.js:94；存档链：architecture.md §1.5
