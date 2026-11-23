# W12b · S3 枪械扩展实现 · 改动清单与验收证据

日期：2026-11-22　执行：工程实现成员（W12b）
规格依据：docs/gdd/08-weapon-expansion-spec.md（219 行，最终权威）
文件域：仅 src/mods/xzguns/bundle.js、data.js（未碰 sfe_*、tools/、pack-order.json、build.mjs；未 commit）

## 1. 改动清单

### bundle.js（1,338,653 → 约 1.88MB；脚本化精确锚点插入，见 w12b-apply.cjs）

| 数据块 | 改动 |
|---|---|
| guns | +8 新枪定义（含 `_spec` 三标注元数据）；5 枪口径迁移（左轮→ammo_45、栓动/K式/轻机→ammo_762、狙击→ammo_338，枪数值零改动）；10 把现有枪 slots 白名单扩充新配件 |
| ammo | 4 现有口径归位命名（9×19 手枪弹 / 5.56 中间威力弹 / 12ga 霰弹 / 榴弹）+ 4 新增（ammo_45 / ammo_762 / ammo_338 / ammo_potato） |
| atts | +5 配件：att_bipod(under,bipod) / att_pen_mag(mag,pen1.5+dmg×0.9) / att_stabilizer(under,air1.5) / att_fast_mag(mag,slow0.8) / att_scope3(optic,zoom.4,scope3) |
| bench | 商店价目 +8 枪（§6.1 材料单）+4 弹（§6.2）+5 配件（§5.1） |
| keys | +17 条 id→模型 key 映射 |
| g3 / g3fp | +8 组第三人称/第一人称模型（策略 A 克隆基枪元素做几何变换 7 把；策略 B dmr=rifle 元素子集 45 els+枪管拉长；UV/贴图零新增） |
| parts | +7 弹匣外观克隆（新枪 _mag_ext/_mag_drum） |
| sounds | +8 条 fire_<新枪> 映射，全部复用既有音源文件（0 新增音频） |
| 乱斗 | 新增 FFA_W 权重表（现有枪按 N-61 文档权重，新枪 380~600 ≤840）；ffaGun 由均匀抽取改为按 FFA_W 加权抽取 |
| XZ API | +penOf/dmgOf/steadyMult 助手；fire() 改走 penOf/dmgOf 并接入两脚架乘子；spreadNow 腾空系数改为可读 under 槽 air 字段（默认 2 不变）；optic() 尊重枪自带 scope 倍率（sniper 行为不变） |

### data.js（132,429 → 136,708）
- items +17（id 32033~32049：4 弹 + 5 配件 + 8 枪，无 id 冲突）；tex 全部复用既有图集 tile 名
- models 数组 +17、models.items 映射 +17（m=33~49）
- tags：新枪加入 xzguns:guns 与 enchantable/durability

## 2. 13 条验收情况（详见 w12b-verify-result.json / w12b-smoke-result.json）

| # | 结论 | 说明 |
|---|---|---|
| 1 | ✅ | 19 枪 ammo∈8 口径；商店 8 弹数量与 §6.2 逐项一致 |
| 2 | ✅ | 8 新枪 `_spec` 三标注齐全；2 把 P2（转膛榴弹/土豆枪）按任务指示后置 |
| 3 | ⚠️ 7/8 | heavy_pistol 21>18×1.1、dmr 22.5>16.8×1.1 —— **规格 §4.1 数值表与 §8.3 ×1.1 规则自相矛盾**（§4.1 自检行明确写"21 ✔ / 22.5 ✔"）。按任务指示照 §4.1 数值实现，未擅改；其余 6 把含满配 ×1.15 全过 |
| 4 | ✅ | 全组合 pen ≤7（long_sniper+穿甲=7 封顶）；dmg×0.9 实测 30→27 |
| 5 | ✅ | .45 head2.5 / 5.56 无 head→2 / 左轮 3 保留；四肢 ×0.75 分支未动 |
| 6 | ✅ | 1.4×dmg 判定表达式原样；12ga 弹丸独立判定沿用 |
| 7 | ✅ | under/mag 白名单全枚举合法；UI accept 闭包未动；非白名单挂载被拒（运行时复算验证） |
| 8 | ✅ | A 策略 7/8=88%≥70%；dmr 45 els≤60；6628 面 UV 越界 0 报错；0 新增音频 |
| 9 | ✅ | ROUNDS/ROUNDS_K/randGuns/枪池数组 `_` 与改前逐字 diff 为空；FFA_W 新枪 380~600 ≤840 |
| 10 | ⏭ 移交 | sfe_mapdata/sfe_poi 属 W12c 文件域（禁改）。§6.3 搜刮权重表 + xzguns↔SFE id 映射需 W12c 落地 |
| 11 | ✅ | 旧 4 弹 id 与物品注册全保留，旧档弹药仍可发射 |
| 12 | ✅ | 商店材料单（本地）三通道齐备；运行时 ITEMS 注册与购买数据可达（浏览器实测） |
| 13 | ✅ | 11 现有枪数值字段 diff=0（变更仅 ammo 迁移与 slots 白名单）；data.js tiles 表 diff=0 |

合计：12 ✅ + 1 ⚠️（规格矛盾，已标注）+ 1 移交。

## 3. 新枪清单（8 把）

heavy_pistol 重型手枪(.45, A)、drum_smg 弹鼓冲锋枪(9×19, A)、carbine 卡宾枪(5.56, A)、battle_rifle 重型战斗步枪(7.62, A)、dmr 精确射手步枪(7.62, B)、slug_gun 独头弹霰弹枪(12ga, A)、combat_shotgun 战斗霰弹(12ga, A)、long_sniper 远程狙击步枪(.338, A)

## 4. 遗留风险与发现

1. **规格矛盾**（验收 3）：§4.1 数值表与 §8.3 ×1.1 规则冲突（heavy_pistol/DMR 超标但自检标 ✔）。已照表实现，建议策划复核——若按 ×1.1 收紧，DMR dmg 9→7.5、heavy_pistol dmg 6→5.5 即可。
2. **乱斗权重表发现**：bundle 旧常量 `M={pistol:1400,...}` 实为机器人换弹时长表（1301210 处 `M[k]||1800`），numbers.md N-61 将其误标为"重生发枪权重"；旧 ffaGun 实际是均匀抽取。本次按 N-61 落地真权重表 FFA_W 并登记新枪——**现有 8 枪的乱斗出场分布从"均匀"变为 N-61 文档权重**（相对比例=pistol:1400…lmg:3500），属行为修正而非数值回归，建议公告知会。
3. **乱斗/淘汰赛边界**：`_` 数组同时被 ffaGun 与 randGuns（AI 淘汰赛）消费，为守住验收 9"枪池数组 diff 为空"，新枪仅进 FFA_W 不进 `_`；副作用：自定义局选枪列表（消费 duelGuns=`_`，UI 在 potato.js=引擎域）暂不可选新枪，需二期在引擎侧放开。
4. SFE 搜打撤掉落（§6.3）与 id 映射移交 W12c。
5. 转膛榴弹发射器 / 土豆动能步枪（P2）未实现；ammo_potato 已上架商店但暂无枪可发射（土豆枪 P2 接入即用）。
6. dmr/long_sniper 自带倍镜走 optic() 合成对象（同参数等价于 att_scope4/8），如后续给枪自带倍镜加独立 reticle 需扩展该分支。
