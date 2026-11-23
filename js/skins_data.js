// js/skins_data.js — 皮肤预设数据（D-001 / W8，2026-11-22）
self.SKIN_PRESETS = [];

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
        { key: "penguinice", name: "冰薯 · 企鹅冰", tile: "xzgunsm:knife_combat_penguinice_0", glow: "xzgunsm:knife_combat_penguinice_glow_0", price: 300, voucher: "t3", desc: "冰蓝白渐变，刃尖近白、柄部透青，高光冷冽；丰收节同源活动款" }
      ]
    },
    knife_butterfly: {
      cn: "折叠刀",
      desc: "关注 UP 主 + 三连解锁（涂装不并入三连）",
      paints: [
        { key: "damascus", name: "薯纹 · 大马士革", tile: "xzgunsm:knife_butterfly_damascus_0", glow: "xzgunsm:knife_butterfly_damascus_glow_0", price: 300, voucher: "t3", desc: "锻打水波钢纹（灰蓝底、明暗层叠），柄部乌木色；老铁匠铺传家的沉稳款" },
        { key: "fade", name: "丰收 · 极光渐变", tile: "xzgunsm:knife_butterfly_fade_0", glow: "xzgunsm:knife_butterfly_fade_glow_0", price: 300, voucher: "t4", desc: "金黄→橙红→深紫落日渐变（丰收节暖色带），刃身光带随检视角度流动" }
      ]
    },
    knife_karambit: { cn: "爪刀", paints: [] },
    knife_axe: { cn: "战斧", paints: [] },
    knife_dart: { cn: "飞镖", paints: [] }
  }
};
