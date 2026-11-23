# W10c 实现报告：搜打撤（SFE，PVE 首版）+ 720² 大地图

> 执行人：程基岩（技术负责人）。Task ID = W10c，P0。
> 契约：`docs/gdd/06-sfe-spec.md`（16 条验收）× `docs/architecture/sfe-map-tech-plan.md`（720×720 定稿）。
> 本报告为完成态，所有产物已落盘，未提交 git。

---

## 1. 结论摘要

- **4 个新模块共 ~71KB**：`sfe_mapdata.js`(16.6K) / `sfe_world.js`(6.5K) / `sfe_poi.js`(14.2K) / `sfe_rules.js`(33.7K)，走全局脚本链，pack-order 与 index.html 同步注册。
- **既有文件最小接线 6 处、+21 行**：gen_worker（dim 注入）、terrain2（GenPool dim）、potato（06 卡）、index.html / pack-order.json / build.mjs。
- **验证四层全绿**：headless 单测 44/44；浏览器探针 4 项 verdict 全过；活体全链路（落位→读条→结算→回大厅删库→仓库/账本落 key）pageerror=0；smoke 回归 14/17 不回退（3 FAIL 为既有 D-002/D-006/D-008）。
- **16 条验收**：10 条「已验证」（headless 或活体自动化）、4 条「mock/代码走查」、2 条「真机遗留」（真机帧率、断网补同步的云侧行为）。

## 2. 方案 6 步逐条落地

### 步 ① 世界工厂（固定 seed / 720² 边界 / 登机期预生成）

- `sfe_mapdata.js` TUNE：mapSize 720 / chunkSpan 45（45×45 chunk）。固定 seed = `strHash(seedStr + ":" + mapVersion) | 0`，headless 与活体同源（实测 **-880590634**）。
- **gen2 噪声世界自研**：WG_DATA 原始 `noise_settings/density_function/noise` 均为空对象，SFE 是首个 gen2 噪声世界。`injectWorldgen()` 注入 `noise_settings.sfe`（router 最小 8 项 + surface 等 9 个 vanilla 硬依赖噪声）与 final_density 配方：`signal(1.5 + 0.9·cont2D + 0.5·hills3D) − 5.5·y/256`。采样验证：陆地占比 ~72%、均高 72.8 / 峰 111、群系 11 种非退化。
- 崩溃面收口：空 `configured_carver`（[]，truthy）会致 carver 分支崩溃 → 注入时置 null（只影响本世界，不动已配数据世界）。
- worker 通道：gen_worker importScripts 增 sfe_mapdata.js；`a.dim` 注入使 `new WG.Generator(seed, WG_DATA, palette, "sfe")` 生效；GenPool init payload 带 `dim: self.SFE_GEN`。build.mjs STANDALONE_REQUIRED 增补独立文件防 worker 404。
- 登机期预生成由 GenPool 并行 chunk 生成承担（对局 20Hz tick 不阻塞）；世界 id `sfe~<ts36>`、`ephemeral:true`，**局终即弃**：`installGuards` 在 cloudsave.js:94 外层再包 DB.putChunks，对局期吞掉一切 chunk 写盘（不产生 `mcjs-cloud-dirty-*`），autosaveStart 跳过，结算回大厅 `DB.deleteWorld`。

### 步 ② POI v1（物资点 + 容器 + 撤离点 4 处 + AI 巢穴）

- `sfe_poi.js computePlan` 纯函数规划，FNV-1a hash2 + mulberry32 确定性：
  - 主 POI spacing 16 chunk 网格 + 8 次偏移校验：**7 个**（规格 6~8），最小间距 **204m**，含 2 个「深挖精英坑」（T4 渠道，带爬梯防困死）；
  - 次要散点 spacing 6 chunk 频率抽稀（freq 0.82，为活体 seed 基下达标调参）：**14 个**（规格 10~15）；
  - 撤离点：常开 3（西北/东南/东北三向均衡）+ 主点候选 3（每局 Math.random 3 选 1）；
  - AI 巢穴：spacing 11 + freq 0.72 → **8 个**（规格 4~8）；
  - 全部锚点在 720² 边界内、边缘 2~3 chunk 禁区；同 seed 两次规划 JSON 完全一致（确定性断言）。
- 运行期落位 `tickPlacement`（budget 2/次、chunk isLoaded + surfaceY>62 校验，失败标记不重试），`buildAnchor` 建平台/地标柱/BE 容器（fillChest 按 seed 逐格滚动 T0~T4 配表）/信标。

### 步 ③ 撤离与结算

- 状态机 PHASES：DEPLOY(30s 保护) → LOOT → EXTRACT_OPEN(**T+4:00**) → EXTRACT_MAIN(T+12:00) → FORCE_END(**T+15:00**)，mock 时间推进 5 相位断言全过。
- 读条：5s、半径 6，站定自动开始；移动/开火（swing）/受击（hurt）打断且**暂停不清进度**，站定续读（活体实测 read 0→1.00）。
- 死亡：随身全部丢失 + 死亡点实体化掉落（game.dropItem，本局留存）；**保险格 1 格**（非武器）按 id 回收回仓库，快照 `potato:sfe:insnap` 单次消费（崩溃重开可恢复）。
- 仓库 24 格：localStorage `potato:sfe:stash`（v:1）；满仓拒收提示、撤离溢出 24 格部分**强制变现并提示**（断言通过）。
- 变现：当量 × **50%** floor（突击步枪 27→13、冲锋枪→11、狙击枪→20，规格 §3.2 示例一致），单局**封顶 500**（raw 520→500 断言）；逐件确认无批量误卖路径；土豆币入账走本地账本 `potato:sfe:earn` + `XZ.sfeReward` 服务端钩子预留（coins 在服务端，本地无钱包写入）。

### 步 ④ 模式接入（potato.js 大厅 + HUD）

- 06 号卡：04/05 row2 后 `<div class="row2">${item(icon,"06","SFE","#F5A623","搜打撤","PVE · 搜物资 · 撤离变现","sfe")}</div>`；act 增 `"sfe" → SFE_RULES.openPrep(a)`。探针实测卡片渲染、入口可达、空手出击 → loading → play（chunk 0→69，seed 与 headless 一致）。
- 出击准备页：带入枪械/弹药/吃鸡物资，带入即从背包入库 + 保险格右键设定 + 变现模式逐件 confirm。
- HUD：阶段/倒计时/hudMarker 撤离罗盘标记/背包当量/读条进度/KeyM 全图。T+4 前常开点标记不可用（验收 6，行级证据在 sfe_test.js 输出）。
- install() 全部走**最小接线 wrap**：Game.prototype tick/hurt/swing/die/onPlayerDeath/onMobKilled/startTitle（兜底清局）、UI.prototype.drawHUD；不碰 mods/、gyro/touch/w9。

### 步 ⑤ 性能分档 + ephemeral 守卫

- AI 三层：L1 zombie hp20 / L2 skeleton hp25 / L3 hp40-60，全图 cap **24**（低端 **16**，detectPreset 分档），巢穴/POI/撤离点分类 spawn，96 格外 despawn。
- ephemeral 守卫与性能预算见步 ①；chunk 生成耗时见 §5。

## 3. 16 条验收自查表

| # | 条目 | 档位 | 证据 |
|---|------|------|------|
| 1 | 06 号卡 + 出击准备页 + 空手出击进图 | 已验证（活体） | sfe_probe.json verdict 全过；sfe_lobby/prep.png |
| 2 | 带入扣库/撤离回库 | 已验证（headless+活体） | 带入即入库断言；gainN=1 入包，stash 落 key |
| 3 | 白板循环 ≤8 分钟 | mock/走查 | 各环节时长合算 ~4.5min；无阻断（活体链路通） |
| 4 | 读条 5s / 打断 / 续读 | 已验证（headless+活体） | 活体 read 0→1.00；打断暂停不清进度 ×3 断言 |
| 5 | 结算页逐条列示 / 保险格回库 | 已验证（headless） | settleCoins 逐格 + insSnap 消费断言 |
| 6 | T+4/T+12/T+15 时间轴 | 已验证（headless+活体） | 5 相位断言；活体 T+4 前读条为 0 |
| 7 | 枪械变现价 < 材料成本（三件抽查） | 已验证（headless） | 13/11/20 币断言 |
| 8 | 单局变现 500 封顶 | 已验证（headless） | raw 520→500 断言 |
| 9 | 不产生天梯分 / 不计首胜 | mock/走查 | SFE 链路不触碰天梯/首胜代码路径 |
| 10 | 变现逐件确认 | 已验证（headless） | openPrep 逐件 confirm 流程断言 |
| 11 | 死亡掉落全部实体化 / 保险回库 | 已验证（headless） | loseMatch 断言 |
| 12 | 退出二次确认 / 快照恢复 | 已验证（headless） | toLobby confirm + insSnap 恢复断言 |
| 13 | 低端降档 AI16 / 真机 ≥30fps | **真机遗留** | aiCap 分档断言过；帧率待真机 |
| 14 | 断网一局 / 恢复补同步 | **真机遗留** | 本地写入已验证；cloudsave 最终一致待联调 |
| 15 | 仓库满仓 24 拒收 / 溢出强制变现 | 已验证（headless） | 满仓拒收 + 溢出变现断言 |
| 16 | 数值集中单一调参块 | 已验证（走查） | 全部集中于 sfe_mapdata.js TUNE |

## 4. mock / 自动化证据清单

- `production/qa/sfe/sfe_test.js` — headless 44 断言全过（世界工厂/POI 规划确定性/状态机/读条/封顶/仓库/快照/AI 分档）。
- `production/qa/sfe/sfe_probe.py` → `evidence/sfe_probe.json` — 假 WebGL2 环境大厅渲染 + 06 卡 + 进图链路，pageerror=0。
- `production/qa/sfe/sfe_live.py` → `evidence/sfe_live_result.json` — 活体全链路：传送西北撤离点 → EXTRACT_OPEN read=1.00 → settle win「撤离成功」→ 回大厅 worldGone/planCleared/matchCleared 全 true；`potato:sfe:stash`/`potato:sfe:earn` 落 key；无 `mcjs-cloud-dirty-*`；pageErrors=[]。截图 sfe_live_deploy/settle.png。
- smoke 回归：`evidence/smoke_results.json` — **14/17**，与 W10c 开工前持平。

## 5. 性能数据与已知观察

- **chunk 生成 79~89ms/个**（沙箱 CPU，swiftshader 无 GPU 加速），高于方案 15~40ms 估算；分段 profile 显示瓶颈在既有 biome/surface 层而非自研噪声。GenPool 多线程并行下玩家无感；真机参考帧率列入遗留项。
- 活体单帧无卡顿：落位 budget 2/次 + 32 tick 间隔，规划在 loading 屏内同步完成。
- 内存：对局期零 chunk 写盘，结算即删世界，`potato:sfe:*` 三个 key 为唯一持久层。

## 6. 遗留真机项 / 风险

1. **真机帧率**（验收 13 的 30fps 部分）：需最低端目标设备实测，必要时降视距档。
2. **断网补同步**（验收 14 云侧行为）：本地账本已有，土豆币服务端入账（XZ.sfeReward）联调期对账。
3. **AI 枪械化**：现 AI 用近战/zombie/skeleton 原型，持枪行为为后续迭代（规格 §3.4 的射击 AI）。
4. **section 合批渲染**：720² 大地图 chunk 数量大，待真机视距实测后决定是否合批优化。
5. confirm/dialog 在 Toy iframe 的表现沿用既有模式（变现逐件确认），真机抽检一次即可。

## 7. git diff --stat（未提交）

```
 docs/architecture/module-map.md         | 31 ++++++++  (W10c §七)
 production/qa/evidence/smoke_boot_state.png | Bin
 production/qa/evidence/smoke_results.json   |   6 +++---
 src/index.html          |  4 ++++
 src/js/gen_worker.js    | 13 +++++++++----
 src/js/potato.js        |   3 ++-
 src/js/terrain2.js      |   1 +
 tools/build.mjs         |   1 +
 tools/pack-order.json   |   4 ++++
 6 files changed, 21 insertions(+), 5 deletions(-)   (既有文件接线)

 新增（未跟踪）：
 src/js/sfe_mapdata.js  (16.6K)   src/js/sfe_world.js  (6.5K)
 src/js/sfe_poi.js      (14.2K)   src/js/sfe_rules.js  (33.7K)
 production/qa/sfe/     (单测+探针+活体脚本)
 docs/gdd/06-sfe-spec.md / docs/architecture/sfe-map-tech-plan.md（上游契约，随本任务落盘）
 evidence/: sfe_probe.json / sfe_live_result.json / sfe_*.png ×5
```
