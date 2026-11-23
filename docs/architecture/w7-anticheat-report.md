# W7 实现报告：rooms 通道反作弊轻量版（客户端自检 + 报文签名）

> Task ID = W7 · P1 · 用户拍板"轻量版先行"。作者：程基岩。
> 基线 6dbf129，未提交（待审批）。**全程未向 `xz.honghemc.cn:8443` 发任何真实请求。**

## 〇、边界声明（先读这里）

**本方案是客户端自检层，只防"老实人 bug"，不防刻意绕过客户端的作弊器。**

- 防得住：客户端状态损坏导致的坏坐标/坏物品栈误发、网络错序、脚本误注入产生的畸形报文——这些是误报与崩溃源头。
- 防不住：作弊器直接构造合法形状的报文（伪造 tick 位置、伪造 click 物品栈）——rooms 模式服务端完全信任客户端，**真正权威校验必须在服务端**，即 ADR-002 完整版（服务端移植校验公式），本期明确不做。
- 签名同理：密钥在客户端内存里，签名可被逆向提取，故它**不是安全边界**，而是（a）传输损坏检测、（b）ADR-002 服务端校验的协议占位与灰度开关。

## 一、校验公式移植说明（p2p 房主端 → rooms 自检层）

p2p 房主端校验（`AntiCheat.p2pHit/p2pState`，p2p.js:446/524 挂载）在 rooms 通道没有对等的权威执行点（rooms 服务器不可改），因此移植为**双向自检**，挂在 `net.js` 的出站漏斗与入站 `move` 分支：

| p2p 房主端公式 | rooms 移植版 | 位置 | 阈值（防误报优先） |
|---|---|---|---|
| `p2pState` 瞬移/飞行：升高 4 格、生存飞行 3 帧 | 出站 `tick` 位移：单次 > 64 格拦下（下一 tick 基线重置放行，防卡死）；服务端 `pos`（tpok 路径）重置基线 | `roomOut`（anticheat.js） | 64 格/tick ≫ 鞘翅 ~3.5 格/tick |
| `p2pHit` 攻击距离：reach 3~4.5+缓冲 | 出站 `dig`/`place`：目标距玩家 > 12 格拦下 | `roomOut` | 正常 reach 5，余量 7 |
| `p2pHit` 频率：>20 hits/s 拦 | 出站 `attack`/`interact`：>25 次/s 拦 | `roomOut` | 对齐 p2p 口径放宽 25% |
| `p2pState` 坐标有限性 | 出站 tick/dig/place 坐标 NaN/Infinity 拦；入站远端 `move` NaN 丢弃该帧 | `roomOut`/`roomIn` | 硬损坏直接拦 |
| `click.changed` 伪造物品转移（协议风险 #3） | 出站 `click`：slot 0..128、栈 count 0..64 有限数校验 | `roomOut` | maxStack 64 上界 |
| （p2p 无对应） | 出站 `chat` >256 字符拦；入站远端玩家 `move`：瞬时 >24 格/100ms 标记"瞬移"、持续 >60 格/秒标记"超速"（只标记+上报，**不丢帧**防幽灵玩家） | `roomOut`/`roomIn` | 60 格/s ≫ 鞘翅俯冲 ~34 |
| `p2pFlag` 上报 | `roomFlag`：UI 提示 30s 限流 + Telemetry `("ac", {where:"room", why, n, b})` 按 why 类别 10s 限流 | anticheat.js | 对齐 anticheat.js 现有口径 |

**丢弃策略**：出站校验失败 = 拦下不发（服务端权威，丢 1 帧 tick 无害）；入站校验失败 = 仅 NaN 坐标丢帧，有限值异常只标记（远端位置本就服务端权威，丢帧只会造成幽灵玩家，不阻止作弊者打服务端）。全部自检逻辑 try/catch 包裹，任何异常一律放行——**自检永不炸对局**。

## 二、签名格式定义与兼容性策略

### 格式

对关键状态/交互报文附加可选字段 `_sig`（下划线前缀，现有协议 55 个报文类型零占用）：

```
_sig = base36(seq) + "." + base36(FNV-1a32(JSON(payload) + "|" + sessionKey + "|" + seq))
sessionKey：每 NetClient 连接 crypto.getRandomValues 生成 96bit hex
seq：连接内单调递增
```

覆盖集合（`AntiCheat.SIGN_SET`，14 类）：`tick dig place use attack swing interact click drop held craft trade button release`。**握手 `hello` 明确不签**（服务端对握手校验最严格，零风险原则）。

### 兼容性三保险

1. **可选式附加**：`_sig` 是 JSON 对象的额外字段，老服务端忽略未知字段不报错（协议逆向结论：服务端按 `t` 分支取字段，未见严格 schema 校验——此推断已写入 network-protocols.md，属 90% 还原度的推断部分）。
2. **自动熔断**：收到 `error` 或 `kick` 报文即本会话关闭签名（`roomSignOff`），Telemetry 记 `why:"sign-off"`。若线上出现服务端严格校验导致的拒绝，最坏影响 = 签名自动关闭，对局恢复正常。
3. **异常穿透**：签名生成任何异常均静默放行原报文（try/catch）。

## 三、mock 验证证据

`tests/w7-anticheat-mock.test.mjs`（Node vm 沙箱 + 注入假时钟 + mock Telemetry；`node tests/w7-anticheat-mock.test.mjs` 可复跑）：

| 验证项 | 结果 |
|---|---|
| 伪造瞬移（100 格/tick） | ✅ 拦截，且下一 tick 基线重置放行 |
| NaN 坐标 tick / dig / place | ✅ 拦截 |
| 超距 dig（>12 格，含 minY 偏移换算正例） | ✅ 拦截 / 正常 reach 放行 |
| click 超量栈（c=1e9） | ✅ 拦截；正常栈放行 |
| 超长聊天（300 字） | ✅ 拦截 |
| 交互过频（第 26 次/秒） | ✅ 拦截 |
| 服务端 tp 后（`roomReset`）大位移 | ✅ 放行（防误报） |
| 入站远端瞬移 50 格/50ms、超速 1000 格/s | ✅ 标记 + Telemetry 上报（`where:"room"`），帧照常应用 |
| 入站 tp 标志传送、怪物大位移 | ✅ 不误报 |
| 正常流 100 tick 步行 + dig/click/use 混合 | ✅ 110 报文全放行，零标记零 UI 干扰 |
| 签名：格式、会话密钥隔离、篡改可区分（复算口径演示）、熔断后无 `_sig`、`hello`/`ping` 不签 | ✅ 全通过 |
| **拦截合计** | **7 类作弊面全部拦截，误报 0** |
| 遥测事件 | 11 条（每类异常首报一次，按类 10s 限流） |

### 微基准（对齐陀螺仪 0.1ms/帧纪律，20000 次采样）

| 函数 | p95 | 说明 |
|---|---|---|
| `roomOut`（tick 路径） | **0.97µs** | 预算 100µs，余量 100× |
| `roomSign`（FNV-1a 全报文） | **2.16µs** | |
| `roomIn`（远端 move 路径） | **1.51µs** | |

### 页面冒烟（8816 本地静态服务 + Chromium headless）

- 页面加载成功（标题"土豆史诗"），`AntiCheat` 五个 rooms API 全部存活，`SIGN_SET.size=14`。
- 真实页面环境出站漏斗探针：正常 tick 放行 / 瞬移拦下 / 签名生成 ✅。
- pageerror = 0；console error 2 条均为资源 404：`/favicon.ico`（浏览器默认请求）与 `/js/skins_data.js`（**基线既有缺口**：git 历史从未包含该文件，skins.js 第 12 行懒加载引用——源码树还原时即缺失，与 W7 无关，移交 W6a 复核）。
- WebGL2 在 headless 环境不可用 → 启动画面提示，属约定豁免项。

## 四、改动清单与 git diff --stat

```
 src/js/anticheat.js | 155 ++++++++++++++++++++++++++++++++++++++++++++++++++++
 src/js/net.js       |  14 ++++-
 2 files changed, 167 insertions(+), 2 deletions(-)
```

（并行 W6a 分身的 src/index.html、tools/build.mjs、src/js/main.js、dist/* 改动与本任务写入面隔离，本报告不含。新增 `tests/w7-anticheat-mock.test.mjs`。）

**net.js 四个挂钩**（均为 `"undefined" != typeof AntiCheat` 运行时守卫，加载顺序 net.js:525 → anticheat.js:546 已确认）：
1. `send(t)`：出站漏斗——`roomOut` 自检（失败拦截不发）→ `roomSign` 附加签名；
2. `onMessage` `case "move"`：`roomIn` 远端合理性检查（false 则丢弃该帧）；
3. `case "pos"`：`roomReset`（服务端权威传送后基线重置）；
4. `case "kick"` / `case "error"`：`roomSignOff` 签名熔断。

**p2p.js / entity.js 零改动决策**：rooms 自检层挂载点（`NetClient.send` 漏斗 + `onMessage`）与实体层无关；p2p 通道已有房主端权威校验，轻量版范围不扩散——缩小审查面。

## 五、给 ADR-002 完整版（服务端移植）的接口建议

1. **`_sig` 即服务端校验入口**：服务端按连接记住握手时下发的会话密钥（建议改为 hello 握手交换服务端挑战值 → HMAC-SHA256，替换客户端可逆的 FNV-1a），对 `SIGN_SET` 报文复算；签名缺失/不匹配的账号进观察名单而非直接踢（先观测误报率）。
2. **服务端复用同一阈值表**：本报告 §一 的阈值（64 格/tick、12 格 reach、25 次/s、栈 0..64、256 字符）直接服务端化；服务端还有客户端没有的视角——全房间交叉比对（A 声称打中 B，B 未必在 A 附近）。
3. **遥测口径已就位**：客户端 `Telemetry.event("ac", {where:"room", why, n, b})` 与未来服务端日志按 `why` 类别对齐，可直接做 A/B（签名开/关）对比。
4. **天梯（XZ/potato 通道）仍是盲区**：XZ 为外部注入脚本（逆向完成度 ~15%），本自检层只覆盖 rooms 通道；天梯权威校验需 XZ 脚本抓取/还原后另立 ADR。

## 六、待审批项

- [ ] 改动提交（anticheat.js +155 / net.js +14 / tests/ 新增）
- [ ] 上线灰度建议：先在 1% 对局开签名（观察 `sign-off` 遥测确认服务端容忍度），再全量
- [ ] `skins_data.js` 缺失是否由 W6a 补齐（懒加载 404，不影响主流程）
