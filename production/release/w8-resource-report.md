# W8 资源补源与 XZ 引擎溯源报告

- 执行人：主理人游承峰（直营），2026-11-22
- 触发：用户提供线上游玩地址 `https://www.bilibili.com/toy/potatoepic`
- 关联缺陷：D-001 / D-005 / 新增 D-011；关联待决策：VSTATES 数据表、SKIN_PRESETS 数据、D-002/D-006 线上同样缺失

## 一、CDN 拓扑实测

| 层 | URL | 说明 |
|---|---|---|
| 平台入口 | `https://www.bilibili.com/toy/potatoepic` | 平台壳页（perf 探针 + toy-host.js SDK），重定向到真实游戏 |
| 游戏静态根 | `https://www.bilibilitoy.com/toy/potatoepic/57267118414848-v56483/` | **真实资源根**，结构与离线包一致（pack1-4 + mods/） |

**版本一致性**：线上 pack4 与离线包 pack4 字节数完全一致（1,022,567B），`GAME_BUILD` 均为 `2026.11.14a`——离线 zip 即当前线上版本的完整快照，所有拉取均为精准同版本修复。

## 二、资源补源结果（D-005 ✅ / D-011 ✅）

| 资源 | 线上状态 | 处置 | 落位 |
|---|---|---|---|
| `potato/logo.svg` | 200，9,397B | 拉回原件 | `src/potato/logo.svg` |
| `potato/bg.jpg` | 200，146,103B | 拉回原件 | `src/potato/bg.jpg` |
| `potato/tiers/0-6.webp` | 200 ×7（15-30KB） | 拉回原件（文件名为**数字下标**，对应 7 段位：原木→土豆之神） | `src/potato/tiers/` |
| `js/sound_events.js` | 200，30B | 拉回原件（`window.SOUND_EVENTS={}`） | `src/js/sound_events.js` |
| `js/skins_data.js` | **404（线上也缺）** | 按消费侧最小合规重建：`self.SKIN_PRESETS=[]` | `src/js/skins_data.js` |
| `js/sounds.js` | **404（线上也缺）** | 最小合规重建：`window.SOUNDS={events:{},files:null}`（仅 file: 协议消费） | `src/js/sounds.js` |
| `js/vstates_data.js` | **404（线上也缺）** | 最小合规重建：`self.VSTATES={}`（见第四节风险说明） | `src/js/vstates_data.js` |

段位图标文件名考证：`potato.js` 的 `timg(t)` 直接拼接下标；段位 k 值（`oak_log/stone/gold_block/diamond_block/emerald_block/redstone_block/potato`）为**显示名/颜色**来源（`mods/xzguns/bundle.js` @1,194,584 的 TIERS 数组），不是文件名。

## 三、build.mjs 打包链路根治（防复发门）

W8 前的 dist 只含 pack1-4 + mods/（5 个独立 js、potato/ 全缺）。增强后的 build.mjs：

1. **静态资源复制**：独立 js 显式契约清单（5 个原始 + 4 个新增）+ `mods/`、`potato/` 目录整拷；
2. **完整性自检门（fail-fast）**：构建尾部扫描 index.html 与 pack 内的全部 `js/*.js`（不在 pack-order 内者）与静态 `potato/*` 引用，dist 中缺失即构建失败。**实弹验证**：临时删除 skins_data.js 后重建，门正确拦截（exit 1）并列出全部缺失。
3. 自检门首跑即抓出 D-011 三个文件缺口——门的价值当场兑现。

**验证**：dist 重建后专项探测**零 404**（全部资源可达）；smoke 回归 **14/17 PASS**（13→14，potato 相关用例转 PASS），剩余 3 FAIL 均为范围外既有缺陷（D-002 铜门贴图 / D-006 favicon / D-008 残留地址——前两者实测**线上同样 404**，属线上级缺口，需程序化重建，列入待决策）。

## 四、XZ 引擎架构勘误（修正 W3 结论）

**W3 原结论**：「`self.XZ` 对局引擎在源码树中只被引用、无定义——属宿主注入外部脚本，无法逆向。」

**W8 勘误**：XZ 引擎**就在 `mods/xzguns/bundle.js` 内**（1.33MB），是 xzguns mod 的运行时骨架：

1. bundle.js 首行定义 `self.XZGUNS = { guns: {...11 枪全数值...} }`；
2. 随后模块执行 `self.XZ = { R: self.XZGUNS }` 完成初始化（bundle.js @1,058,589）；
3. bundle 内 15 处 `const e = self.XZ; if (!e ...) return` 模块持续往 XZ 挂载：`g3` 渲染扩展、`state()`、`Grenade`、**`ladder`（天梯：TIERS/tierOf/tierIx/delta 公式）**、`fb` 击杀反馈、`skinUtil`、`tierCanvas` 等；
4. 主游戏 `potato.js` 的 142 处 `XZ.*` 调用消费的正是这套对象。

**修正意义**：天梯公式层与裁决层的"黑箱"范围大幅缩小——匹配/结算的服务端交互仍在后端（`xz.honghemc.cn:8443`），但客户端引擎本体已可完整静态逆向。ADR-002（排位权威服务器）的接口设计可直接引用 bundle 内 `delta()` 公式与 `ladder` 接口签名，不再需要"运行时 dump"步骤。

## 五、遗留待决策（移交主理人）

| # | 事项 | 说明 | 建议 |
|---|---|---|---|
| 1 | VSTATES 完整数据表 | 空表版使开房间流程走通，但熔炉等特殊方块状态映射缺失；线上现状是该功能直接报错 | 中期从代码反推重建数据表 |
| 2 | SKIN_PRESETS 真实预设 | 空数组 = 功能上线以来从未有数据；消费字段 name/skin | 与皮肤系统规划一并决策 |
| 3 | D-002 铜门贴图 ×4 | 线上同样 404，需程序化生成（可从现有铜系贴图着色派生） | 下一修复批次 |
| 4 | D-006 favicon | 线上同样 404；可由 logo.svg 转 ico | 低成本顺手做 |
| 5 | D-008 残留地址 127.0.0.1:8842 | 代码级修改（W6b 批次） | 下一修复批次 |

## 六、G2 发布门复评建议

W8 修复后，W4 上线清单中「静态资源完整性」与「mod 清单核对」两项由 FAIL 转达标（build.mjs 自检门常态化拦截）。当前 build 判定建议由 **NO-GO 上调为 CONCERNS**：剩余阻塞项为 D-008（残留开发机地址，代码级）与 D-002（视觉瑕疵），均已有明确修复路径。
