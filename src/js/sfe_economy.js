"use strict";
// W12c 搜打撤（SFE）经济本体 —— GDD-10 §4（刀皮双轨）+ 08 号 §6.3 掉落权重节。
// 职责：① onLoot 搜刮记账 + T3/T4 刀皮凭证掉落（08 权重表语境，w2 追加进对应 POI 层池）；
//       ② onExtract 撤离结算（凭证撤出可兑换 / 死亡全损 / 凭证不可变现）；
//       ③ redeemVoucher 凭证兑换（t3→K1/K3/K4 三选一、t4→K2/K5 二选一；集齐折算 50 币）；
//       ④ marketBuy 黑市 300 币保底轨（只读调用 mods/xzguns bundle.js 现有购买 API）。
// 防御（任务面）：本体自带输入校验与 try/catch；W12a 在 sfe_rules.js 预留调用，本模块不接线。
const SFE_ECONOMY = (() => {
  const M = self.SFE_MAP;
  const P = self.SFE_POI;

  // ================================================================ 调参常量块（GDD-10 §4.2 全部新增数值）
  const TUNE = {
    voucherT3: "knife_paint_voucher_t3",
    voucherT4: "knife_paint_voucher_t4",
    voucherWeight: 2,        // §4.2：T3 表 / T4 表各追加 w2（对照表头权重 3~18 量级，稀有但可遇）
    // 08 号 §6.3 各 T3/T4 POI 行权重合计（凭证池分母 = 行合计 + voucherWeight）：
    // 聚落精英箱 T3 = 12+4+3+2+2+4+3 = 30；矿场精英箱 T3 = 6+4+4 = 14；深挖精英坑 T4 = 10+8+3+3+2+2 = 28
    poolW08: { settlement_elite: 30, mine_elite: 14, deep_pit: 28 },
    redeemCoin: 50,          // §4.2 防刷③：重复集齐按 50 币折算（变现折扣锚，不产生套利）
    matchSellCap: 500,       // 单局变现封顶（沿用 SFE_MAP.TUNE.matchSellCap 主锚）
    stashKey: "potato:sfe:stash",   // 与 sfe_rules 仓库同 schema（v:1, slots[]）
    grantsKey: "potato:sfe:vgrants",// 凭证兑换落地账本（供存档域对账/补偿）
  };
  // POI 类型 → 凭证层（08 §6.3：散点铺轻弹 / 聚落铺霰弹 / 矿场铺 7.62 / T3 精英 / T4 深坑 / 撤离点与巢穴不放凭证）
  const TIER_OF = {
    minor: null, settlement: null, mine: null, lair: null, extract: null,
    settlement_elite: 3, mine_elite: 3, deep_pit: 4,
    // 容错别名
    main_elite: 3, elite: 3, t3: 3, t4: 4, pit: 4, deep: 4,
  };

  // ================================================================ 运行时状态（一局一清）
  const st = { ledger: [], lootCount: 0, vouchersCarried: [], lastExtractSig: null };

  const isVoucher = (id) => id === TUNE.voucherT3 || id === TUNE.voucherT4;
  const tierOfVoucher = (id) => (id === TUNE.voucherT4 ? 4 : 3);

  // ================================================================ onLoot：搜刮记账 + 凭证掉落
  // poiType：见 TIER_OF；itemId/count 为本次搜刮物品（记账用）；rng 可注入（自测/确定性）
  function rollVoucher(poiType, rng) {
    const tier = TIER_OF[poiType] ?? null;
    if (tier !== 3 && tier !== 4) return null;
    const pool = (TUNE.poolW08[poiType] ?? (tier === 3 ? 30 : 28)) + TUNE.voucherWeight;
    const r = (rng || Math.random)() * pool;
    return r < TUNE.voucherWeight ? { id: tier === 3 ? TUNE.voucherT3 : TUNE.voucherT4, n: 1 } : null;
  }
  function onLoot(poiType, itemId, count, rng) {
    try {
      const pt = String(poiType == null ? "" : poiType);
      const id = String(itemId == null ? "" : itemId);
      const n = Math.max(0, Math.floor(+count || 0));
      const tier = TIER_OF[pt] ?? null;
      st.ledger.push({ poiType: pt, itemId: id, count: n, at: Date.now() });
      if (st.ledger.length > 64) st.ledger.shift();
      st.lootCount += n;
      const voucher = n > 0 ? rollVoucher(pt, rng) : null;
      if (voucher) st.vouchersCarried.push({ ...voucher, poiType: pt });
      return { ok: true, tier, itemId: id, count: n, voucher, lootCount: st.lootCount };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  }

  // ================================================================ onExtract：撤离结算
  // loadout：随身 stacks（{id, n} 或实体 stack）；verdict："extract"/"win"（成功）| 其他 = 死亡/全损
  // 凭证：不可变现（sellValue 恒 0 + GOODS_VALUE 无此项双保险）；撤出 → 入仓库可兑换；死亡 → 全损
  function onExtract(loadout, verdict) {
    try {
      const win = verdict === "extract" || verdict === "win" || verdict === "success" || verdict === true;
      const stacks = Array.isArray(loadout) ? loadout.filter(Boolean) : [];
      const kept = [], lost = [], vouchers = [];
      let coinsRaw = 0;
      for (const s of stacks) {
        const id = typeof s.id === "string" ? s.id : blockKeyOf(s.id);
        const n = Math.max(1, Math.floor(+s.n || 1));
        if (isVoucher(id)) {
          if (win) {
            vouchers.push({ id, n, tier: tierOfVoucher(id) });
          } else {
            lost.push({ id, n, value: 0 });  // 死亡全损
          }
          continue;
        }
        const v = P ? P.sellValue(s) : 0;
        coinsRaw += v;
        (win ? kept : lost).push({ id, n, value: v });
      }
      // 撤出兑换凭证：入仓库（同一 loadout 签名只入一次，防 W12a 通用入仓路径双记）
      if (win && vouchers.length) {
        const sig = stacks.map((s) => (typeof s.id === "string" ? s.id : String(s.id)) + "x" + (s.n || 1)).join("|") + "#w";
        if (st.lastExtractSig !== sig) {
          st.lastExtractSig = sig;
          for (const v of vouchers) stashAddVoucher(v.id, v.n);
        }
      }
      const coins = win ? Math.min(coinsRaw, TUNE.matchSellCap) : 0;
      const out = {
        win, coins, coinsRaw,
        capped: win && coinsRaw > TUNE.matchSellCap,
        kept, lost, vouchers,
        voucherRedeemable: win ? vouchers.map((v) => v.id) : [],
      };
      st.ledger.length = 0;         // 一局一清
      st.vouchersCarried.length = 0;
      return out;
    } catch (e) {
      return { win: false, coins: 0, coinsRaw: 0, capped: false, kept: [], lost: [], vouchers: [], error: String(e && e.message || e) };
    }
  }
  function blockKeyOf(bid) {
    try { const B = BLOCKS[bid]; return B ? B.key : null; } catch (e) { return null; }
  }
  // 防刷显式面：凭证变现价恒 0（即使未来有人往 GOODS_VALUE 里塞了 id 也拦住）
  function sellValue(stack) {
    if (!stack) return 0;
    const id = typeof stack.id === "string" ? stack.id : blockKeyOf(stack.id);
    if (isVoucher(id)) return 0;
    return P ? P.sellValue(stack) : 0;
  }

  // ================================================================ 仓库凭证（与 sfe_rules 同 schema，独立读写，防刷幂等）
  function stashLoad() {
    try {
      const s = JSON.parse(localStorage.getItem(TUNE.stashKey) || "null");
      if (s && s.v === 1 && Array.isArray(s.slots)) return s;
    } catch (e) {}
    return { v: 1, slots: new Array((M.TUNE && M.TUNE.stashSlots) || 24).fill(null), ins: null };
  }
  function stashSave(s) {
    try { localStorage.setItem(TUNE.stashKey, JSON.stringify(s)); } catch (e) {}
  }
  function stashVoucherCount(voucherId) {
    const stash = stashLoad();
    return stash.slots.reduce((a, s) => a + (s && s.id === voucherId ? (s.n || 1) : 0), 0);
  }
  function stashAddVoucher(voucherId, n) {
    const stash = stashLoad();
    let rest = n;
    for (const s of stash.slots) {                    // 先并栈
      if (rest <= 0) break;
      if (s && s.id === voucherId) { const take = Math.min(64 - (s.n || 1), rest); s.n = (s.n || 1) + take; rest -= take; }
    }
    for (let i = 0; i < stash.slots.length && rest > 0; i++) {
      if (!stash.slots[i]) { stash.slots[i] = { id: voucherId, n: Math.min(64, rest) }; rest -= Math.min(64, rest); }
    }
    stashSave(stash);
    return rest <= 0;
  }
  function stashConsume(voucherId, n = 1) {
    const stash = stashLoad();
    let need = n;
    for (let i = stash.slots.length - 1; i >= 0 && need > 0; i--) {
      const s = stash.slots[i];
      if (s && s.id === voucherId) {
        const take = Math.min(s.n || 1, need);
        s.n = (s.n || 1) - take;
        need -= take;
        if ((s.n || 0) <= 0) stash.slots[i] = null;
      }
    }
    if (need === 0) stashSave(stash);
    return need === 0;
  }

  // ================================================================ 凭证目录（GDD-10 §2 ↔ §4.2 兑换映射）
  function meleeCatalog() { return self.SKIN_MELEE || null; }
  // voucher_t3 → K1/K3/K4 三选一；voucher_t4 → K2/K5 二选一（由 skins_data.js 的 voucher 字段驱动）
  function paintsForVoucher(voucherId) {
    const cat = meleeCatalog();
    if (!cat) return [];
    const tier = tierOfVoucher(voucherId) === 4 ? "t4" : "t3";
    const out = [];
    for (const k in cat.knives)
      for (const p of cat.knives[k].paints || [])
        if (p.voucher === tier) out.push({ knife: k, paint: p.key, name: p.name });
    return out;
  }
  function grantsLoad() {
    try { return JSON.parse(localStorage.getItem(TUNE.grantsKey) || "[]") || []; } catch (e) { return []; }
  }
  function grantsPush(entry) {
    try {
      const g = grantsLoad();
      g.push(entry);
      localStorage.setItem(TUNE.grantsKey, JSON.stringify(g.slice(-128)));
    } catch (e) {}
  }

  // ================================================================ 黑市 300 币保底轨 + 凭证兑换
  function shop() {
    const s = self.XZ && self.XZ.skins;
    return s && s.rules ? s : null;
  }
  // 保底轨：只读调用 bundle.js 现有 300 币购买 API（服务端扣币入 kp；需登录）。零新购买面。
  async function marketBuy(knifeKey, paintKey) {
    const s = shop();
    if (!s) throw new Error("皮肤商店未就绪（xzguns 未加载）");
    const r = s.rules;
    if (!r.KNIVES.includes(knifeKey)) throw new Error("没有这把刀");
    if (!r.PAINTS.includes(paintKey)) throw new Error("没有这种涂装");
    return s.paint(knifeKey, paintKey);   // 现有 300 币通道（PAINT_PRICE 不变）
  }
  // 兑换：消耗仓库 1 张凭证 → 映射内三/二选一涂装入 kp；集齐则折算 50 币。
  // 无服务端授予接口（遗留）：写本地 kp 视图 + grants 账本，供存档域对账补偿。
  function redeemVoucher(voucherId, knifeKey, paintKey) {
    if (!isVoucher(voucherId)) throw new Error("不是刀皮凭证");
    const mapping = paintsForVoucher(voucherId);
    if (!mapping.some((m) => m.knife === knifeKey && m.paint === paintKey))
      throw new Error("该凭证不能兑换这个涂装（" + (tierOfVoucher(voucherId) === 4 ? "T4" : "T3") + " 档位不符）");
    if (!stashConsume(voucherId, 1)) throw new Error("仓库里没有" + (tierOfVoucher(voucherId) === 4 ? "T4" : "T3") + "凭证");
    const s = shop();
    const r = s && s.rules;
    const v = s && s.v;
    if (!r || !v) {
      // 商店未就绪（未登录/未加载）：凭证已消耗，落地账本留待补偿
      grantsPush({ voucher: voucherId, knife: knifeKey, paint: paintKey, at: Date.now(), deferred: true });
      return { ok: true, deferred: true, knife: knifeKey, paint: paintKey };
    }
    if (!r.PAINTS.includes(paintKey) || !r.KNIVES.includes(knifeKey)) throw new Error("涂装/刀具数据不存在");
    // 集齐判定：映射内全部涂装已拥有 → 折算 50 币（§4.2 防刷③）
    const ownedAll = mapping.every((m) => ((v.kp && v.kp[m.knife]) || []).includes(m.paint));
    if (ownedAll) {
      let coins = TUNE.redeemCoin;
      try { if (r.earn) coins = r.earn(v, TUNE.redeemCoin, Date.now()) || TUNE.redeemCoin; else v.coins = (v.coins || 0) + TUNE.redeemCoin; }
      catch (e) { v.coins = (v.coins || 0) + TUNE.redeemCoin; }
      grantsPush({ voucher: voucherId, coins: TUNE.redeemCoin, at: Date.now(), converted: true });
      return { ok: true, convertedCoins: coins, knife: knifeKey, paint: paintKey };
    }
    // 刀本体须已解锁（涂装不并入三连；对齐 bundle buyPaint 语义）
    let gate = null;
    try { gate = knivesGateOf(v); } catch (e) {}
    if (!r.knivesOwned(v, gate || undefined).includes(knifeKey)) throw new Error("还没有解锁这把刀");
    if (!((v.kp[knifeKey] || []).includes(paintKey))) (v.kp[knifeKey] || (v.kp[knifeKey] = [])).push(paintKey);
    grantsPush({ voucher: voucherId, knife: knifeKey, paint: paintKey, at: Date.now() });
    return { ok: true, granted: { knife: knifeKey, paint: paintKey }, knife: knifeKey, paint: paintKey };
  }
  function knivesGateOf(v) {
    // v 即服务端账号视图（含 gate/follow/triple/all 字段时可直接作 gate opts）
    return v && (v.gate != null || v.all != null) ? v : undefined;
  }

  function reset() {
    st.ledger.length = 0;
    st.vouchersCarried.length = 0;
    st.lootCount = 0;
    st.lastExtractSig = null;
  }

  // ================================================================ 自测钩子（纯逻辑，可注入 rng / 假仓库）
  const _test = {
    TUNE, isVoucher, tierOfVoucher, rollVoucher, paintsForVoucher, stashLoad, stashSave,
    stashVoucherCount, stashAddVoucher, stashConsume,
  };

  return {
    TUNE, onLoot, onExtract, sellValue, isVoucher,
    redeemVoucher, marketBuy, paintsForVoucher, stashVoucherCount,
    reset, state: st, _test,
  };
})();
self.SFEEconomy = SFE_ECONOMY;
//# sourceURL=js/sfe_economy.js
