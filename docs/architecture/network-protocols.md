# 网络协议逆向 / Network Protocol Reverse-Engineering — 土豆史诗（POTATO EPIC）

> W3 产物。作者：程基岩。**纯静态分析，未向 `xz.honghemc.cn:8443` 发任何请求。**
> 依据：net.js(4650 行) / p2p.js(1699 行) / netconfig.js / account.js / cloudsave.js /
> social.js / telemetry.js / toy.js / potato.js（天梯 UI 侧）。

## 〇、先说结论（管理层摘要）

游戏有**三条独立网络通道 + 一个外部黑盒**：

| 通道 | 端点 | 传输 | 用途 | 逆向完成度 |
|---|---|---|---|---|
| rooms（NetClient） | `NET_CONFIG.rooms` → `wss://xz.honghemc.cn:8443/ws` | WebSocket（JSON 文本 + 二进制区块帧） | 多人房间（服务器权威世界） | **报文 ~90%**（客户端侧全部可读）；服务端行为为推断 |
| p2p（LocalHost/LocalGuest） | `NET_CONFIG.rooms` → `wss://…/p2p`（信令）+ WebRTC DataChannel | WS 信令 + RTCDataChannel（JSON + 二进制分帧） | 4 人本地房间（房主权威） | **~95%**（双方代码都在客户端） |
| HTTP REST（RoomService/Account/CloudSave/Telemetry） | `https://xz.honghemc.cn:8443` | fetch/XHR | 房间管理/账号/云存档/遥测/天梯查询 | **~85%**（客户端请求全可读） |
| **XZ 对局引擎（天梯/匹配/对局）** | `NET_CONFIG.pm` = `https://xz.honghemc.cn:8443/potato` | 未知（脚本不在源码树） | 1V1/2V2/淘汰赛/约战/枪械战斗 | **~15%——仅知 UI 挂钩与入口函数名，核心是外部注入脚本 `self.XZ`** |

## 一、连接拓扑

```
                      ┌────────────────────────────┐
                      │  xz.honghemc.cn:8443        │
   WebSocket /ws ────►│  rooms 中转(→真正的房间服务) │  服务器权威：世界/方块/实体/容器
   WebSocket /p2p ───►│  p2p 信令服务器（仅信令+ICE）│  不碰游戏内容，只转发 SDP/ICE
   HTTP REST ────────►│  /api/*（rooms/account/     │
                      │  cloud/telemetry/ladder）    │
                      │  /potato（pm，对局管理？）   │  ← XZ 外部脚本使用，接口未知
                      └────────────────────────────┘
   WebRTC P2P DataChannel ─────────────────────────►  房主浏览器 ↔ 客人浏览器
                                        （房主=权威主机）
```

- `RoomService.base()`：`?rooms=` 参数 > `NET_CONFIG.rooms`；localhost/127./
  `*.localhost|*.test` 且无 `?rooms=` 时返回空串 → 全部联机功能静默关闭
  （netconfig.js + RoomService.base，net.js:2030）。
- 房间服务地址可被 URL 参数覆盖，便于私有部署/调试。
- `DirectConnectScreen`：直连任意 WS 中转（默认 `ws://host:8780`），
  提示语证实存在服务端仓库 `multiplayer/proxy`（`node src/proxy.js`）。

## 二、报文格式

### 2.1 通用约定

- 所有 JSON 报文统一 `{ t: <类型字符串>, ...payload }`；一帧一消息。
- 区块类大报文走 **二进制**（自定义 pack），其余走 JSON 文本。
- 分片：`p2pSendList`/`sendSnapshot` 在消息超过 `maxSize()-256` 时递归二分
  （`{t:"E",list,more:1}` 标记续包）；DataChannel 帧级分片用 `p2pFrame(type,id,payload)`：
  `[1B type][4B LE reqId][payload]`，type=2 分片时再加 `[1B last?]`。

### 2.2 rooms 通道（NetClient，net.js）

**握手（C→S，onopen）**
```json
{ t:"hello", name, version:1, proto:1, room:<code>, key:<localStorage mcjs-room-key>,
  token:<Account.token 当有房间时>, rd:<渲染距离 2..32>, ic:<integrity 摘要|null> }
```
- `key`：本地生成的 32 hex 房主凭据（`RoomService.key()`，localStorage 持久），
  服务端用它识别"创建者"，REST 管理接口同样带它 → **房主权=本地密钥持有**。
- `ic`：integrity 指纹（见 architecture.md §三）。
- 握手前 `Integrity.reportWithin(4000)`，超时字段为空。

**S→C 世界初始化序列**（onMessage 分支顺序即状态机）
1. `states{list:[vanilla 状态串]}` → 客户端建 stateMap（vanilla→自家 BID 映射，
   waterlogged/lectern 副表）。
2. `biomes{list}` → biome 索引。
3. `login{eid,dim,minY,mode}` → enterWorld：新建 World(remote/gen2)、LoadingScreen。
4. 随后二进制区块帧（§2.4）+ `pos/abilities/mode/time/rain/chat/players/...`。

**客户端周期报文**：`tick{pos:[x,y+minY,z,yaw,pitch,onGround,collidedH], keys{f,b,l,r,j,s,sp}}`
（有载具时改 `vmove/paddles`）；`settings{rd}`（变更后 1s 防抖）；
`ping{i}`（遥测 RTT，S 回 `pong{i}`）。

**交互报文（C→S 全集）**：`dig{status:0/1/2,x,y+minY,z,face}`、`place{x,y,z,face,cx,cy,cz,hand?}`、
`use{hand?,yaw,pitch}`、`release`、`swing{hand?}`、`attack{id}`、`interact{id,x,y,z,sneak}`、
`drop{all}`、`chat{text}`、`click{id,slot,button,mode,changed:[[slot,stack]...],carried}`、
`craft{win,id,all}`、`trade{i}`、`button{id,b}`、`rename{name}`、`sign{x,y,z,front,lines}`、
`wclose{id}`、`held{slot}`、`creative{slot,item}`、`tpok{id}`。

**S→C 游戏事件（全集，onMessage 原型链 6 层包装后的并集）**：
`states/biomes/login/respawn/pos/abilities/mode/time/rain/chat/unload/signs/block(s)/
players/spawn/move/head/pass/vmove/remove/anim/hurt/open/win/wslot/cursor/wclose/prop/
trades/pinv/held/effect/uneffect/health/xp/death/equip/meta/collect/status/kick/live/
notice/queue/room/error/sound/wev/signedit/attr/vel/map/be/boom/ghost/recipes/names/
announce/pong`。

- `room{...}`：进房确认 `{name,code,isOwner,players,sponsorText,sponsorSeconds,...}`。
- `notice/queue`：房间启动排队提示（服务器冷启动队列）。
- `names{map,colors}`：显示名别名/染色（Cosmetics 前缀在这层注入）。
- `kick{reason}` → fail("被服务器断开")。

### 2.3 p2p 通道（p2p.js）

**信令 WS（双端→信令服务器）**
- 房主：`{t:"host", code, token, name, ic}` → 回 `{t:"hosted", ice:[...], sponsorText?}` /
  `{t:"error",reason}`；事件：`peer{id,name}`、`signal{from,data}`、`gone{id}`；
  房主回 `{t:"signal",to,data}`、`{t:"leave",id}`。
- 客人：`{t:"join",code,token,name,ic}` → 回 `{t:"joined",host,ice}`（然后等
  `signal`）/ `{t:"closed"}` / `{t:"error"}`；客人回 `{t:"signal",data}`。
- 加入歧义消解：MultiplayerScreen.submit 先查 `GET /api/p2p/has?code=` 判断
  邀请码属于 p2p 房还是 rooms 房。
- ICE：服务器下发 iceServers；`iceTransportPolicy: relay` 可强制 TURN
  （`P2PLink.make` 的 `relayOnly`）。

**DataChannel（"game"，ordered）消息（JSON）**
- 客人→房主：`state{pos,yaw,pitch,sneak,swing,held,heldx,off,offx,armor,armx,
  mode,dead,flying,swim,look}`（每 2 tick）、`pstate{...整存档快照}`（每 200 tick /
  离开时）、`b{list:[[x,y,z,bid,meta,wl]...]}`、`be{k,data}`、`drop{stack,pos,vel}`、
  `pickup{id}`、`hit{id,dmg,kb,kind}`、`chat{text}`、`mark{pos}`、`hurt{dmg,kind,from,name}`、
  `flag{what}`。
- 房主→客人：`wkeys{list}`/`wbes{list}`（welcome 预热）、`welcome{name,seed,gen,flat,
  structures,mode,difficulty,hardcore,time,weather,rain,spawn,near,host,saved,players,mods,
  sponsor}`、`E{list:[[id,type,x,y,z,yaw,extra]...]}`（实体快照，超限分片 more:1）、
  `B{list}`（方块广播）、`be`、`env{time,weather,rain,difficulty}`（每 40 tick）、
  `chat`、`mark`、`give{stack}`、`xp{n}`、`kicked{reason}`、`closed`。
- 区块请求：客人 `chunk{id,cx,cz}` → 房主二进制 `p2pFrames(1, id, p2pPackChunk(chunk))`
  （同存档线格式：`[4B lenB][4B lenM][4B lenW][b(U16)][m(U16)][w?(U32)]`），
  >maxSize 时 type=2 分片；客人 20s 超时放弃。
- 权威规则：客人 `dropItem` 直接转 `drop` 给房主落地；客人不能用命令、不能
  换维度；敌对 AI 由房主以最近玩家为目标 tick（p2p.js tickEntity 包装）。

### 2.4 rooms 二进制区块帧（onBinary）

```
[1B kind=1(新块)/2(光照更新)]
[4B LE cx][4B LE cz][1B sectionCount]
每 section:
  [2B LE paletteLen] [paletteLen × 2B LE vanillaStateIndex]
  [body: paletteLen≤256 ? 4096B 索引 : 8192B LE U16 索引]
  [1B flags: bit0=有 blocklight 2048B nibble, bit1=有 skylight 2048B nibble]
  [flags 对应的 light 数据]
(kind=1 时末尾追加 [256B biome 索引表 → biomes 列表])
```
客户端按 stateMap 把 vanilla 状态索引映射回自家 `(BID<<8)|meta`。

### 2.5 REST API（客户端侧全集）

| 端点 | 方法 | 鉴权 | 用途 |
|---|---|---|---|
| `GET /api/public` | GET | 无 | 公开房间列表 + capacity + maintenance |
| `GET /api/capacity` | GET | 无 | 可建房间大小档位 |
| `POST /api/rooms` | POST | body.key | 创建房间（name/owner/key/gamemode/difficulty/pvp/seed/size）|
| `POST /api/rooms/<code>/world?key=` | POST(XHR 上传) | key | 上传存档（RoomExport 打包，≤100MB）|
| `GET /api/rooms?key=` | GET | key | 我的房间列表 |
| `POST /api/rooms/<code>/delete` | POST | key | 删除房间 |
| `GET /api/rooms/<code>[?key=]` | GET | 房主带 key | 房间详情（players/bans/mutes/members/sizes）|
| `POST /api/rooms/<code>/manage` | POST | key | kick/ban/mute/unmute/member/guestMode/size |
| `POST /api/rooms/<code>/report` | POST | key | 举报（cheat/abuse/grief/other + 300 字）|
| `GET /api/p2p/has?code=` | GET | 无 | 邀请码归属判定（p2p/rooms）|
| `GET /api/announce?after=` | GET | 无 | 全服公告轮询（social.js 每 5min）|
| `POST /api/account/bili` / `code` | POST | — | B站 openId 登录 / 识别码登录 → `{token,account}` |
| `POST /api/account/me|update|logout|reset-code|delete` | POST | `_t` | 账号 CRUD |
| `GET /api/gate` | GET | 无 | 关注/三连门控配置（视频列表+权重）|
| `GET /api/account/unlocks` | POST | `_t` | 关注/三连解锁状态 |
| `POST /api/account/admin/room|freeze|unfreeze` / `GET /api/account/admin/frozen` | POST/GET | `_t`(super) | 管理员：关停房间/冻结账号+IP 封禁 |
| `POST /api/cloud/push` | POST(raw binary) | `OPMCT<token>` 前缀 | 云存档推送（OMCC 打包，6MB/批，rev 乐观并发）|
| `POST /api/cloud/<wid>` | POST | body `_t` | 云存档拉取（`since: rev` 增量）|
| `POST /api/cloud/<wid>/delete|touch` | POST | `_t` | 删除/保活 |
| `POST /api/telemetry` | POST | 无 | 遥测会话包（sendBeacon/fetch）|
| `POST /api/feedback` | POST | 无 | 反馈（附截图 jpeg ≤900KB）|
| `GET /api/ladder/me` / `top` | GET | `_t` | 天梯个人记录 / Top 榜（potato.js）|

序列化：除 cloud push（自定义 OMCC 二进制）与 telemetry（JSON 文本）外，
全部 JSON；房间上传为 RoomExport 自定义包（export.js）。

## 三、状态机

### 3.1 rooms 生命周期

```
TitleScreen → MultiplayerScreen
  ├─ joinRoom(code) → NetClient(WS /ws) → hello
  │    ├─ states→biomes→login → state:"loading"（区块下载+进度）
  │    ├─ login 完成 → state:"play"（netTick 分支）
  │    ├─ room{} 报文 → 房间上下文（邀请码/房主/赞助横幅）
  │    └─ respawn{} → 维度切换（enterWorld 复用）
  ├─ 断线：onerror/onclose → fail() → ConfirmScreen → 回标题（无自动重连）
  └─ kick{} → fail(reason)
服务器侧推断：房间冷启动会下发 notice/queue（排队）；state running/stopped。
```

### 3.2 p2p 生命周期

```
LocalHost: connecting →(hosted)→ open →(peer arrives)→ 为每个 peer:
  RTCPeerConnection offer → signal 交换 → DataChannel open → welcome{...} → joined
  断链判定：connectionState failed/closed/disconnected → dropPeer（踢离线 30s 超时）
LocalGuest: connecting →(joined)→ 建 answer → DC open → welcome → onWelcome
  (本地构造 p2p~<code> 世界元数据，不落盘) → joined
  断链 → lost() → ConfirmScreen 回标题
房间关闭：房主 close() 广播 {t:"closed"} → 客人 lost("房主关闭了房间")
```

### 3.3 对局（XZ，黑盒）

客户端可见的对局状态面（potato.js PotatoPause.fillMatch）：
`XZ.match.state() → {ph: prep|end|其他, paused, w, l, i, n, gun}`——
即 **Bo5（w:l 比分 + 第 i/n 局）+ prep 准备阶段 + 每局枪械**。
对局期间 `PauseScreen.pauses=false`（游戏不暂停），离开=认输。
匹配入口：`XZ.ladderStart(g,{team:{party:<T+5位组队码>}|{ai:{...}}})`、
`XZ.tourStart/aiTourStart`。**状态机主体在服务端/XZ 脚本，客户端无定义。**

## 四、鉴权与会话

- **三层凭据**：
  1. `Account.token`（POST body `_t` 字段，登录获得，localStorage `mcjs-account` 持久）——
     账号/云存档/天梯/管理接口。401 即清 token。
  2. `RoomService.key()`（32 hex 本地密钥）——房间创建者凭据。
  3. WS 握手 `hello.token` / `host/join.token`——把账号身份带进实时通道。
- **匿名可用**：未登录可玩（名字本地生成 SteveNNN），天梯排位需登录
  （potGuest 可经 `XZ.guestFetch` 拉游客天梯记录）。
- **云存档鉴权是裸 token 前缀**：`"OPMCT" + Account.token` 拼进二进制 body——
  token 即密码，无签名/时效。
- **无 refresh token**：token 长期有效（401 清除重登）。
- Toy 侧身份与游戏账号解耦：`Toy.profile()` 仅用于一键注册（openId→bili 账号）。

## 五、断线重连

**结论：没有自动重连。**
- rooms：onclose/onerror 一律 `fail()` → 弹窗 → 回标题（extras.js 里的
  `ReconnectScreen` 存在于 extras 模块，但在 net.js/p2p.js 主路径中未被引用，
  疑似为旧机制残留——标记为待验证）。
- p2p：DataChannel disconnected/failed → dropPeer/lost，同样不恢复。
  客人世界是内存态（`p2p~` 不写 DB），断了即丢进度，房主存档含客人
  `pstate`（worldMeta.guests）以续命。
- 重连性最好的是 rooms：房间在世界持久化在服务端，重新 joinRoom 即续玩；
  客人背包由服务器保留。
- 遥测侧 `netfail` 事件 + RTT p50/p95/max 是断连率的主要观测口径。

## 六、XZ 对局引擎：逆向边界声明

以下为**源码树中可证实的全部事实**：
1. `self.XZ` 在 103 个模块中**只被引用、从未被定义**——它是宿主环境
   （Toy 容器或单独 `<script>`）注入的外部脚本。index.html 未引用它。
2. 客户端调用的 XZ API 面：`ladder/match/tourStart/aiTourStart/ladderStart/
   customMatchOpts/pmPartyCreate/pmTop/pmOn/guestFetch/freeHere/skins/logged/
   acctName/isGuest`。
3. 服务端 REST：`/api/ladder/me`、`/api/ladder/top`（走 Account.api，即
   rooms base）。`NET_CONFIG.pm = https://xz.honghemc.cn:8443/potato` 与
   `pmOn/pmTop/pmPartyCreate` 的 `pm` 前缀对应，推断 pm 服务挂在 `/potato`
   路径下（NET_CONFIG.pm 是 XZ 脚本自行使用的 base，客户端其余代码未引用它）。
4. 天梯数值常量（客户端 UI 侧）：起步 100 分（石头段位）、人机加分上限 800
   （`Ct`）、人机加分系数 easy/normal/hard = 10%/25%/50%、段位表在
   `XZ.ladder.TIERS`（UI 读取，数值未在源码树内）。
5. 对局规则文案（potato.js At 数组）：1V1/2V2 Bo5 打满、8 人单败淘汰
   每场先胜 3 局、每局随机枪、同轮出局按伤害排名。

**因此 network-protocols.md 对对局协议（匹配报文、对局同步、Elo 结算）
不做任何臆测描述；补全此块需要：宿主注入脚本的抓取/还原，或服务端仓库。**

## 七、协议风险清单（与 ADR-002 衔接）

1. 权威模型三通道三标准：rooms=服务器权威（但输入/容器预测在客户端）、
   p2p=房主权威+AntiCheat 校验、对局=未知。**天梯排位（有 Elo/段位）跑在
   未知权威上**——反作弊覆盖面最弱的组合（见 architecture.md §三盲区 1）。
2. 鉴权凭据 `_t` 明文走 body + 云存档裸 token 前缀：抓包即接管账号。
3. 无消息级完整性保护：JSON 报文可被任意客户端构造（`click.changed`
   即可伪造物品转移）。
4. 断线不重连 + rooms 冷启动排队（notice/queue）：弱网体验差，是掉线
   率告警（telemetry netfail）的直接来源。
