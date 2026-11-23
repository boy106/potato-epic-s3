# W12c 验收证据（规格 09 × 7 条 + 规格 10 × 5 条）

- 日期：2026-11-22
- 环境：headless Chromium（swiftshader + fake_gl），`python3 -m http.server 8861` → `/workspace/src/`，live 进对局（sfe~ 世界）
- 产物：`w12c_smoke.py`（自测脚本）、`w12c_smoke_result.json`（原始数据）、5 张截图
- 结果：**12/12 PASS**（其中 2 条带环境备注，见下）

## 规格 09（搜打撤小地图）

| # | 验收 | 证据 | 结论 |
|---|---|---|---|
| 1 | 常驻小窗 | `w12c_deploy_minimap.png`：右上角 64² 小窗（地形底图+POI 金点+撤离点色标+白色朝向箭头+下方坐标）；`toggle: {off:false, on:true}` = `settings.sfe_minimap` 独立开关默认开、可关；POTATO 环境不受沙盒 Minimap 禁用影响（本模块独立实现，未引用 Minimap） | PASS |
| 2 | 底图预渲染 | `base.done=true`（2025/2025 chunk），渲染于 DEPLOY 段分帧完成；`win.opaquePx=129600/129600` 全图有地形读数、无黑块；未渲染区 `rgba(0,0,0,.55)` 蒙层；内存 = ImageData 360²×4B + 离屏 Canvas 360²×4B ≈ **1.04MB ≤ 2MB**（渲染完成即弃 ImageData 与采样器；结算页 `release: baseReleased=true` 全部置 null，跨局不缓存） | PASS |
| 3 | 局内更新 | `dirty: changedPut=true（草→石 [103,131,72]→[125,125,125]）、changedDig=true（草→土 [140,179,99]→[134,96,67]）`，1.3s 内反映（≤2s 达标）；chunk 脏粒度、≤2 chunk/帧局部 putImageData | PASS |
| 4 | 大图交互 | `w12c_bigmap_05x.png`（0.5× 全览：底图+撤离点名称+开放态标注+标题行阶段提示）、`w12c_bigmap_1x.png`（1× 1px=1 方块，可拖动）；按住显示/松开关闭沿用 sfe_rules 接线；点击/滚轮换档；输入路径无拦截（移动/开火不受阻塞） | PASS |
| 5 | 威胁方案 B | 常驻层无 AI 实时点（代码走查：小窗/大图仅画 `scan.snapPts` 快照与枪声环）；`scan: r1=true, snap1=4 点（48 格内假 AI 全捕获、120 格外排除）, cd=45, r2Accepted=false（冷却拒扫）, shotsN=1（枪声脉冲）`；快照 5s 淡出、声源环 2s；DEPLOY 免费教学扫描 `freeScanUsed=true`；全部参数在 TUNE 块 | PASS |
| 6 | 帧预算 | 小窗态稳态采样（底图完成后重置打点）：`max 0.2ms / avg 0.039ms ≤ 0.5ms`（`perf`）；大图态整链 HUD 实测 `0.5×: 0.7ms / 1×: 1.0ms ≤ 1.5ms`（`big05/big1x.hudMs`）。备注：headless swiftshader 帧率低，底图完成耗时 34s 墙钟（60fps 真机按 4 chunk/帧 ≈ 8.4s，符合 8~17s）；低端降档参数（48 窗/快照 4s）在 TUNE 块 | PASS（带环境备注） |
| 7 | 数值集中 | 底图分辨率/分帧预算/扫描半径/时长/冷却/降档等全部集中于 `sfe_minimap.js` 顶部 `TUNE` 常量块，无散落硬编码（代码走查） | PASS |

## 规格 10（刀皮）

| # | 验收 | 证据 | 结论 |
|---|---|---|---|
| 1 | 槽位 | `skins.slotN=9`：`gun:pistol…gun:lmg` 8 类枪 + `melee:melee`（排最后）；匕首 3 款 + 折叠刀 2 款可进入涂装选择（`paintN=5`）；默认态无涂装逻辑未动（bundle `kn.paint=null` 原色路径） | PASS |
| 2 | 内容与贴图 | 5 款展示名↔paint key 一一对应（`skins.paints`：薯光·土豆金/potatogold、暗窖·星云/nebula、冰薯·企鹅冰/penguinice、薯纹·大马士革/damascus、丰收·极光渐变/fade）；tile 索引全部有效（`tileIndex: 3629/3597/3661/3742/3710`，均来自 `ASSETS.tiles` 注册表）；零新增贴图文件、零图集扩格（对照 mods/xzguns/data.js 既有索引，node 侧核对 20 个 tile 名含 glow 全部存在） | PASS |
| 3 | 双轨获取 | 黑市：`marketBuy` 走 bundle 现有 300 币 API（stub 环境 `coinsAfterBuy=700`、涂装入 kp）；搜打撤：T3/T4 层 `onLoot` 权重掉凭证（`loot.a/d` 命中 t3）、撤离入仓（`stashT3=1, stashT4=1`）、`redeemVoucher` 三选一/二选一兑换成功；死亡局凭证全损（`extractDeath.lost` 含凭证 value=0） | PASS |
| 4 | 防刷与红线 | 凭证不可变现：`sellVoucherT3=0`、`valueOfThroughPoi=0`（SFE_POI.valueOf 兜底）+ `SFEEconomy.sellValue` 显式拦截双保险；不可交易（无交易面）；集齐折算 50 币：`redeemAll/redeemT3All convertedCoins=50`；档位不符拒绝（`mapWrong` 抛错）；刀皮涂装零数值改动（纯 kp 数据 + tile 映射，未触碰任何伤害/攻速代码） | PASS |
| 5 | 存档与数值 | `kown/kp/kn` 走 bundle 现有账号存档域（本模块只经 `XZ.skins` 现有 API/状态，未改存档结构）；凭证掉落权重/折算币值集中于 `sfe_economy.js` TUNE 块；兑换落地账本 `potato:sfe:vgrants` 供对账 | PASS（带备注，见遗留） |

## 接口签名（SFEEconomy，挂 `self.SFEEconomy`）

```js
onLoot(poiType, itemId, count, rng?) -> { ok, tier, itemId, count, voucher:{id,n}|null, lootCount }
    // poiType: minor/settlement/mine（不给凭证）；settlement_elite/mine_elite→T3、deep_pit→T4（w2/池）
onExtract(loadout, verdict) -> { win, coins, coinsRaw, capped, kept[], lost[], vouchers[], voucherRedeemable[] }
    // verdict: "extract"|"win"|true = 撤离；其他 = 死亡/全损；凭证不可变现、撤出入仓可兑换
sellValue(stack) -> number            // 凭证恒 0
redeemVoucher(voucherId, knifeKey, paintKey) -> { ok, granted?|convertedCoins?|deferred? }
marketBuy(knifeKey, paintKey) -> Promise(bundle 300 币购买结果)
paintsForVoucher(voucherId) -> [{knife, paint, name}]
reset() / state / TUNE / _test
```

## 遗留项

1. **模块加载接线**：`pack-order.json`、`index.html`、`build.mjs` 均不在 W12c 文件域——`sfe_minimap.js`/`sfe_economy.js` 需集成侧按 `sfe_rules.js` 之后、`potato.js` 之前接入 pack4/index.html（本次冒烟为运行时注入验证）。
2. **黑市 UI 入口**：皮肤页刀皮区购买入口在 potato.js/bundle.js（非本域），现有入口已可用（300 币 `XZ.skins.paint`）；`SFEEconomy.marketBuy` 为程序化封装，未重复挂 UI。
3. **凭证兑换服务端授予**：bundle 无免费授予涂装的服务端接口，`redeemVoucher` 写本地 `v.kp` 视图 + `potato:sfe:vgrants` 账本，需存档域（W12a/服务端）对账补偿，防换设备丢失。
4. **设置页开关 UI**：`settings.sfe_minimap` 开关 API 已通（`SFE_MINIMAP.setEnabled`），设置页/路标屏按钮挂接属 screens 域，未越界。
5. **MAP_PAL 退化兜底**：本构建 `ENTITY_DATA.extra` 为空 → `EXTRA.mappalette/mapcolors` 缺失（F1 沙盒小地图同受影响），小地图走内建色表兜底；线上若调色板数据恢复则自动优先 MAP_PAL（规格路径）。
