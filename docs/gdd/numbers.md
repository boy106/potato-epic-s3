# 数值总表（逆向基线）

> 置信度定义：**高** = 代码/数据逐字提取，可直接采信；**中** = 代码可读但调用链或服务端语义不完整；**低** = 仅文案描述、逻辑推断或存在冲突。
> 出处代号：`bundle` = `mods/xzguns/bundle.js`（min 单行，给出定位锚点文本）；`p4:potato` = `js/pack4.js` 解包出的 `js/potato.js`；其余同理。行号不适用（单行文件），用「关键词」定位。

## A. 天梯与段位

| # | 数值/规则 | 值 | 出处 | 置信度 |
|---|---|---|---|---|
| N-01 | 段位表 | 原木0 / 石头100 / 金300 / 钻石500 / 绿宝石650 / 红宝石800 / 土豆之神1000（发光） | bundle `n=[{n:"原木"...lo:1e3...glow}]` | 高 |
| N-02 | 起始分 | 100（「新玩家从石头 100 分起步」） | bundle `START:100` + p4:potato 文案 | 高 |
| N-03 | 段位名带名次 | score≥1000 显示「段位名 #名次」 | bundle `tierName` | 高 |
| N-04 | Elo 期望公式 | E=1/(1+10^((对手-我)/300)) | bundle `delta()` | 高 |
| N-05 | 段位增益 GAIN | [40,30,22,16,12,8,3]（原木→土豆之神） | bundle `t=[40,30,...]` | 高 |
| N-06 | 段位减损 LOSS | [4,10,12,13,12,11,6] | bundle `a=[4,10,...]` | 高 |
| N-07 | 局差系数 | ±(1+0.15×(局差-1))；表现系数 f=2(0.5−E)，胜×(1+0.6f) 负×(1−0.6f)，最低 ±1；平局 ±0.3×GAIN×f | bundle `delta()` | 高 |
| N-08 | 重复对手抑制 | 第 2~3 场 ×0.5；≥4 场 0 分 | bundle `s.repeat` 分支 | 中（计数来源在服务端） |
| N-09 | 定级放大 | placement ×1.5 | bundle `s.placement` | 中（客户端无调用点） |
| N-10 | 降级保护 | 输分将掉段且对手段位≥我段位 → 分数落回当前段位下限 | bundle `s.shield` 分支 | 高（实现），意图见 OQ-1 |
| N-11 | 分数下限 | 0 | bundle `max(0, e+u)` | 高 |
| N-12 | 人机加分上限线 | 800 分（Ct=800） | p4:potato `Ct=800` | 高 |
| N-13 | 人机难度系数 | 简单 ×10% / 普通 ×25% / 困难 ×50%（排位胜场折算） | p4:potato `Et={easy:10,normal:25,hard:50}` + UI 文案 | 高 |
| N-14 | 人机计分规则 | <800 才加；输不扣；乱斗不加；淘汰赛每赢一场都算 | UI 文案 + 结算逻辑 | 高 |
| N-15 | 排位资格门 | 登录 + 关注 UP 主（gate 可为 follow/triple/off，服务端下发） | p4:potato `rankGate/gateOf` | 高 |
| N-16 | 结果仲裁 | 对方离开 20s 后自动算分，最多 3 分钟 | p4:potato 结算文案 | 高 |
| N-17 | 不计分情形 | disputed（结果对不上）、void（房主中断） | p4:potato 结算文案 | 高 |
| N-18 | 封禁 | 分数异常增长 → 清零 + 1 小时禁联机 | p4:potato 结算文案 | 高 |
| N-19 | 表现加分 | 排位结算显示「其中表现加分 ±X（评分 Y）」 | p4:potato 结算文案 | 低（公式在服务端，未逆向） |
| N-20 | 匹配定位 | 同段位优先 · 平均 1 分钟内（文案） | p4:potato 排位页 | 低（服务端实现） |

## B. 对局结构

| # | 数值/规则 | 值 | 出处 | 置信度 |
|---|---|---|---|---|
| N-54 | Bo5 | 五局三胜，打满五局（1V1/2V2/淘汰赛每场） | p4:potato 文案 + `WIN()=floor(N/2)+1` | 高 |
| N-55 | 天梯每局枪序 | 手枪→左轮→冲锋枪→步枪→狙击枪（ar 局按 match id/日期哈希替换为 K 式或步枪） | bundle `ROUNDS` + `ROUNDS_K()` | 高 |
| N-56 | 阶段时长 | 准备 3s / 战斗 90s / 单局结算 3.5s | bundle `r=3e3,o=9e4,i=3500` + hostPhase | 高 |
| N-57 | 暂停 | 申请冷却 30s、单次 15s（推断） | bundle `G=3e4,q=15e3` | 中 |
| N-58 | 淘汰赛 | 8 人单败：八强→半决赛→决赛；每局随机枪（8 枪等权）；同轮出局按伤害排名 | p4:potato 模式卡文案 + bundle `randGuns` | 高 |
| N-59 | 2V2 | 两人一队（好友/随机）；队友无伤害；一方全倒局终；Bo5 打满 | p4:potato 模式卡文案 | 高 |
| N-60 | 自定义局 | 局数 3/5/7；枪=固定/每局随机/预设[3:手枪,步枪,狙击][5:手,左,冲,步,狙][7:+霰弹,栓动]；天空 clear/sunset/aurora/storm/data 随机；规则开关 仅爆头/伤害减半/一刀40（语义中置信） | bundle `customMatchOpts` | 高（参数）/中（规则开关语义） |
| N-61 | 乱斗 | 6 人；3 分钟（18e4ms）；目标 15 杀；重生 3s；重生随机枪权重：手枪1400/左轮2200/冲锋1700/步枪2000/K式2100/轻机3500/栓动2200/狙击2600/霰弹2600/双管2000 | bundle `F=18e4,E=15` + `M={...}` | 高 |
| N-90 | boot TIP | 五条规则提示（见 04 §3.7） | index.html | 高 |

## C. 战斗数值

| # | 数值/规则 | 值 | 出处 | 置信度 |
|---|---|---|---|---|
| N-30 | 手枪 | dmg4.5 rate4 cap12 pen1 spread[2,.3] recoil3 半自动 | bundle guns | 高 |
| N-31 | 左轮 | dmg8 head×3 rate2 cap6 pen1.5 spread[.35,.15] move5 recoil6.5 | bundle guns | 高 |
| N-32 | 冲锋枪 | dmg3 rate12 cap30 自动 pen0.8 spread[3,1] recoil1.2 | bundle guns | 高 |
| N-33 | 泵动霰弹 | 1.5×8弹丸 rate1 cap6 pen0.3 spread[6,5] recoil7 射程40 | bundle guns | 高 |
| N-34 | 双管霰弹 | 1.5×8 rate5 cap2 pen0.3 spread[7,6] recoil8 射程40 | bundle guns | 高 |
| N-35 | 栓动步枪 | dmg12 rate1 cap5 pen3 spread[.6,0] move6 recoil6 | bundle guns | 高 |
| N-36 | 突击步枪 | dmg4.5 rate9 cap30 自动 pen2 spread[.5,.1] move4 recoil0.9 | bundle guns | 高 |
| N-37 | K 式步枪（隐藏） | dmg5.25 rate8 cap30 自动 pen2.2 spread[.6,.15] move4.5 recoil1.25 | bundle guns | 高 |
| N-38 | 轻机枪 | dmg4.5 rate12 cap100 自动 pen2.5 spread[1.6,.6] move3.5 recoil1 | bundle guns | 高 |
| N-39 | 狙击步枪 | dmg24 rate0.7 cap10 pen5 spread[4,0] recoil9 自带8倍 | bundle guns | 高 |
| N-39b | 榴弹发射器 | dmg0 爆炸 cap1 pen0 spread[1,.5] | bundle guns | 高 |
| N-40 | 爆头倍率 | 默认 ×2（`gun.head||2`），左轮 ×3 | bundle trace | 高 |
| N-40b | 四肢倍率 | ×0.75；躯干 ×1 | bundle trace | 高 |
| N-42 | 爆头击杀判定 | 单发伤害 > 1.4×枪基础伤害 | bundle `u>1.4*l.dmg` | 高 |
| N-43 | 移动因子 | l=clamp((水平速度−0.05)/0.23,0,1)（POTATO）；非 POTATO 版 (v−0.04)/0.07 | bundle spreadNow | 高 |
| N-44 | 移动散布惩罚 | 有 move 的枪：散布 += move×(开镜?0.5:1)×l | bundle spreadNow | 高 |
| N-45 | 腾空惩罚 | 散布 += move×(开镜?0.5:1)×(1−l)，且总散布 ×2 | bundle spreadNow | 高 |
| N-45b | 无 move 枪移动惩罚 | 速度>0.05 时散布 ×1.5 | bundle spreadNow | 高 |
| N-46 | 穿透成本 | 易碎白名单 0.1；木质 0.5×硬度；其他 max(0.3,硬度)；不可破坏 ∞ | bundle costOf | 高 |
| N-47 | 配件效果 | 红点 zoom0.8 / 4倍 zoom0.25 / 8倍 zoom0.125；消音=静音；制退 recoil×0.75；握把 spread×0.75；激光 腰射×0.6；扩容 cap×1.5；弹鼓 cap×2.5 换弹×1.3 | bundle atts | 高 |
| N-48 | 开镜模式 | 混合 / 切换 / 按住（设置项 xzAds） | bundle 设置页 | 高 |
| N-49 | 移动端吸附 | 吸附保持条件 err<0.3rad、近/视野/全向三档、吸附时强制急停 halt 160~200ms | bundle aimbot/holdFire | 中（阈值可读，整体手感为服务端无关客户端逻辑） |
| N-51 | 商店·枪价（材料） | 手枪 铁4铜2红石1；左轮 铁5铜2金屑3；冲锋 铁8铜4红石2；霰弹 铁6木板2铜2；双管 铁6木板3铜1；栓动 铁8木板3铜2；突击 铁10铜4红石2金1；K式 铁10木板2铜4红石2；轻机 铁16铜6红石4金2；狙击 铁12铜4玻璃2红石2钻石1；榴弹 铁10铜4红石3 | bundle bench.guns | 高 |
| N-52 | 商店·子弹 | 手枪弹×16=铜1火药1；步枪弹×12=铜1火药2铁屑1；霰弹×8=纸2火药1铁屑2；榴弹×2=火药4铁1铜1 | bundle bench.ammo | 高 |
| N-53 | 商店·配件 | 红点 铁2玻璃1红石1；4倍 铁3玻璃2铜1；8倍 铁4玻璃3紫水晶2；消音 铁4羊毛2；制退 铁3；握把 铁2皮革1；激光 铁1红石2玻璃1；扩容 铁3铜1；弹鼓 铁6铜2 | bundle bench.atts | 高 |
| N-50 | 触控/键位 | 左键开火按住连发、右键开镜、R 换弹、F 检视 | mods/index.json usage + index.html TIP | 高 |

## D. 经济与解锁

| # | 数值/规则 | 值 | 出处 | 置信度 |
|---|---|---|---|---|
| N-62 | 币速率 | ranked 15/min；friend 9/min；range 3/min | bundle `RATE={ranked:15,friend:9,range:3}` | 高（默认值） |
| N-63 | 排位计费上限 | 单场 720s（12min） | bundle `matchTime` cap | 高 |
| N-64 | 击杀补时 | 仅 friend/range；间隔≤150s 补 min(60,gap)s；>150s 重置 | bundle `beat()` + BEAT_GAP:150/BEAT_MAX:60 | 高 |
| N-65 | 每日首胜 | +150（bundle FIRST_WIN:150）；签到页文案写 +50 | bundle / p4:potato 文案 | 高（代码）/冲突 → OQ-4 |
| N-66 | 连续签到 | 第1~6天 300/400/500/600/700/800；第7天起每天 1000；断签归 1 | bundle `STREAK=[300,...,1e3]` + signIn | 高 |
| N-67 | 活动签到币 | 每日 +30（CHECKIN:30） | bundle checkin() | 高 |
| N-68 | 每日上限 | 无（CAP=0） | bundle | 高 |
| N-69 | 枪皮升级价 | 1→2:100，2→3:250，3→4:500；满级 4 | bundle `PRICE=[0,100,250,500]` | 高 |
| N-70 | 刀涂装价 | 300/种 | bundle `PAINT_PRICE=300` + 报错文案 | 高 |
| N-71 | 皮肤等级 | LV1 无特效 / LV2 专属击杀反馈 / LV3 专属检视动作 / LV4 终结特效（全场可见） | bundle LEVELS | 高 |
| N-75 | 皮肤套装 | harvest ×8（免费）+ rank0~6:ar（赛季段位）+ core ×8（关注三连）=23 款 | bundle IDS/SETS | 高 |
| N-76 | 刀 | 匕首（初始）/折叠刀/爪刀/战斧/飞镖（后四者三连门） | bundle KNIVES/KNIFE_HOW | 高 |
| N-77 | 涂装 | 渐变/大马士革/表面淬火/星云/土豆金/企鹅冰 ×6 | bundle PAINTS | 高 |
| N-78 | 名牌框 | 「丰收」frame（活动第 9 天） | bundle reward/frame | 高 |
| N-79 | 沙盒材料商店 | 见 N-51~53 | bundle bench | 高 |
| N-84 | 丰收节窗口 | 2026-11-18 ~ 2027-01-01，9 天 | bundle EVENT | 高 |
| N-83 | 冬日足迹 | 开服签到，10 件装饰，累计制 | p4:checkin/cosmetics 文案 | 高（奖励清单）/中（N 值） |

## E. 元系统

| # | 数值/规则 | 值 | 出处 | 置信度 |
|---|---|---|---|---|
| N-85 | 赛季 | 「第一赛季」仅客户端文案；重置规则在服务端 | p4:potato | 低 |
| N-86 | 股东 | 关注后加入，送动态披风「烟花夜空」，退出保留 | p4:shareholders | 高 |
| N-87 | AI 伙伴 | V 键对话、主动说话 2 分钟限频、记忆可清 | p4:companion | 高 |
| N-88 | 约战 | 邀请码/房间码；房主权威结算；P2P+服务器 | p4:net/p2p/social | 高 |
| N-89 | 新手训练 | 约 2 分钟，9 步：移动/跳跃下蹲/滑铲/开火/开镜/换弹/爆头/急停/连杀 | p4:onboard | 高 |
| N-91 | 排行榜 | Top10 展示；空榜文案确认全服冷启动状态 | p4:potato | 高 |
| N-92 | 反作弊 | 分数异常 → 清零+1h 封禁 | p4:potato/anticheat | 高 |
