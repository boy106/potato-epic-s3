// js/skins_data.js — 皮肤预设数据（D-001 / W8，2026-11-22）
// 由 Skins.presets()（js/skins.js）动态 <script> 加载，期望定义 self.SKIN_PRESETS 数组；
// 加载失败静默降级为 []（onerror 路径）。
//
// 现状（W8 实测）：线上 CDN（bilibilitoy.com .../v56483/js/skins_data.js）同样 404，
// 即玩家一直运行在空预设状态——本文件提供与线上行为等价的最小合规版，
// 仅消除 404 报错，零行为变化。
//
// 后续填充真实预设时保持结构（消费侧 skins.js：presets().then(...)，元素含 name/skin 字段）：
//   self.SKIN_PRESETS = [{ name: "预设名", skin: "skinId" }, ...];
self.SKIN_PRESETS = [];

// ---------------------------------------------------------------- W12c（GDD-10 §1/§2）：近战（melee）皮肤槽 + 首版 5 款刀皮
// 槽位结构：与 GUN_CN 8 类枪并列的独立类别（key "melee"），排序置于 8 类枪之后；
// 首版覆盖 knife_combat 匕首（3 款）+ knife_butterfly 折叠刀（2 款），
// 爪刀/战斧/飞镖槽位预留（§6 开放项），内容后续批次上线。
// 贴图全部复用 mods/xzguns tiles.webp 既有 tile 索引（零新增资源、零扩格）：
// tile/glow 名与 bundle.js melee.paints/melee.glow 一一对应，数字索引在 mods/xzguns/data.js 注册进 ASSETS.tiles。
// 获取双轨（§4）：黑市 300 币（voucher 字段同时标记搜打撤凭证档位 t3/t4，兑换映射由 SFEEconomy 消费）。
self.SKIN_MELEE = {
  key: "melee",
  cn: "近战",
  how: "一种涂装 300 币；搜打撤 T3/T4 稀有凭证撤离后可免费兑换对应档位",
  knives: {
    knife_combat: {
      cn: "匕首",
      desc: "初始刀，人人都有",
      paints: [
        { key: "potatogold", name: "薯光 · 土豆金", tile: "xzgunsm:knife_combat_potatogold_0", glow: "xzgunsm:knife_combat_potatogold_glow_0", price: 300, voucher: "t3", desc: "通体暖金涂装，刃部金→古铜渐变，握把暗金缠纹；双轨共用的门面款" },
        { key: "nebula", name: "暗窖 · 星云", tile: "xzgunsm:knife_combat_nebula_0", glow: "xzgunsm:knife_combat_nebula_glow_0", price: 300, voucher: "t4", desc: "深紫蓝底星空粒子纹，刃脊一线银白；深夜地窖里捞出来的传说" },
        { key: "penguinice", name: "冰薯 · 企鹅冰", tile: "xzgunsm:knife_combat_penguinice_0", glow: "xzgunsm:knife_combat_penguinice_glow_0", price: 300, voucher: "t3", desc: "冰蓝白渐变，刃尖近白、柄部透青，高光冷冽；丰收节同源活动款" },
      ],
    },
    knife_butterfly: {
      cn: "折叠刀",
      desc: "关注 UP 主 + 三连解锁（涂装不并入三连）",
      paints: [
        { key: "damascus", name: "薯纹 · 大马士革", tile: "xzgunsm:knife_butterfly_damascus_0", glow: "xzgunsm:knife_butterfly_damascus_glow_0", price: 300, voucher: "t3", desc: "锻打水波钢纹（灰蓝底、明暗层叠），柄部乌木色；老铁匠铺传家的沉稳款" },
        { key: "fade", name: "丰收 · 极光渐变", tile: "xzgunsm:knife_butterfly_fade_0", glow: "xzgunsm:knife_butterfly_fade_glow_0", price: 300, voucher: "t4", desc: "金黄→橙红→深紫落日渐变（丰收节暖色带），刃身光带随检视角度流动" },
      ],
    },
    // 槽位预留（GDD-10 §6）：结构占位，paints 空数组
    knife_karambit: { cn: "爪刀", paints: [] },
    knife_axe: { cn: "战斧", paints: [] },
    knife_dart: { cn: "飞镖", paints: [] },
  },
};
