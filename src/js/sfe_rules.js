"use strict";
// W10c 搜打撤（SFE）规则模块 —— 方案 §五步 5/3 + 规格实现主体。
// 职责：① 对局总状态机（LOBBY→PREP→DEPLOY→LOOT→EXTRACT_OPEN→FINAL_WINDOW→FORCE_END，规格 §2.6）；
//       ② 撤离读条（5s / 半径 6 / 移动·开火·受击打断不清进度）、死亡掉落（随身全部 + 保险格 1 格）；
//       ③ 结算（带出变现封顶 500）与仓库（localStorage potato:sfe:stash，24 格）；
//       ④ AI 遭遇战调度（三层 20/25/40-60，全图上限 24/16，按设备档）；
//       ⑤ HUD（撤离倒计时 / 罗盘标记 / 背包当量 / 读条 / 全图）。
// 全部新增数值引用 SFE_MAP.TUNE（调参常量块，规格 §9.16）。
const SFE_RULES = (() => {
  const M = self.SFE_MAP;
  const T = M.TUNE;
  const TICK_DT = 1 / 20; // Game.tick 固定 20Hz

  // ================================================================ 纯逻辑核心（mock 可驱动；_test 与运行时共用同一实现）
  const PHASES = ["DEPLOY", "LOOT", "EXTRACT_OPEN", "FINAL_WINDOW", "FORCE_END"];
  const createMatch = () => ({
    phase: "DEPLOY",
    t: 0,
    read: 0,              // 撤离读条进度 0~1（打断不清进度）
    reading: false,
    broadcast: {},        // 阶段广播去重
    hitT: -1,             // 最近一次受击（游戏内秒）
    fireT: -1,
    mainPick: -1,         // 主撤离点候选下标（每局随机 3 选 1）
    kills: 0,
    settle: null,         // {win, title, gain, loss, coinsRaw, coinsCapped, capped, insUsed, overflow}
  });
  const phaseAt = (m, t) =>
    t >= T.forceEndT ? "FORCE_END" : t >= T.finalWindowT ? "FINAL_WINDOW" : t >= T.extractOpenT ? "EXTRACT_OPEN" : t >= T.deploySec ? "LOOT" : "DEPLOY";

  // 撤离读条推进：inZone 且站定且 (未受击/开火近 1 tick) → +dt/5；打断仅暂停（规格 §2.4）
  const advanceRead = (m, dt, cond) => {
    const blocked = !cond.inZone || cond.moving || cond.hurtNow || cond.fireNow;
    if (blocked) { m.reading = false; return false; }
    m.reading = true;
    m.read += dt / T.readSec;
    if (m.read >= 1) { m.read = 1; return true; }
    return false;
  };

  // 结算折算：带出清单 → 变现合计（逐格 floor(当量×50%)，封顶 500）；仓库满仓溢出强制变现（规格 §9.15）
  const settleCoins = (stacks) => {
    let raw = 0;
    const gain = [];
    for (const s of stacks) {
      if (!s) continue;
      const v = SFE_POI.sellValue(s);
      raw += v;
      gain.push({ id: typeof s.id === "string" ? s.id : stackName(s), n: s.n || 1, value: v, key: typeof s.id === "string" ? s.id : null });
    }
    const capped = raw > T.matchSellCap;
    return { gain, raw, coins: Math.min(raw, T.matchSellCap), capped };
  };

  // ================================================================ 仓库（规格 §5.1：potato:sfe:stash，v:1，24 格）
  const LS_STASH = "potato:sfe:stash";
  const LS_INSNAP = "potato:sfe:insnap";
  const LS_EARN = "potato:sfe:earn";
  const stashLoad = () => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_STASH) || "null");
      if (s && s.v === 1 && Array.isArray(s.slots)) return s;
    } catch (e) {}
    return { v: 1, slots: new Array(T.stashSlots).fill(null), ins: null };
  };
  const stashSave = (s) => {
    try { localStorage.setItem(LS_STASH, JSON.stringify(s)); } catch (e) {}
  };
  const stackEq = (a, b) => a && b && a.id === b.id && !(a.meta || b.meta);
  const stashAdd = (stash, stack) => {
    // 同 id 合并（上限 64）→ 空格；返回剩余（满仓拒收，规格 §9.15）
    let rest = { ...stack };
    for (const s of stash.slots) {
      if (!rest.n) break;
      if (stackEq(s, rest)) {
        const take = Math.min(64 - (s.n || 1), rest.n);
        s.n = (s.n || 1) + take;
        rest.n -= take;
      }
    }
    if (rest.n > 0)
      for (let i = 0; i < stash.slots.length; i++) {
        if (!stash.slots[i]) { stash.slots[i] = { ...rest }; rest.n = 0; break; }
      }
    return rest.n > 0 ? rest : null;
  };
  const insSnapWrite = (stack) => {
    try {
      stack ? localStorage.setItem(LS_INSNAP, JSON.stringify(stack)) : localStorage.removeItem(LS_INSNAP);
    } catch (e) {}
  };
  const insSnapTake = () => {
    try {
      const s = JSON.parse(localStorage.getItem(LS_INSNAP) || "null");
      localStorage.removeItem(LS_INSNAP);
      return s;
    } catch (e) { return null; }
  };
  // 变现账本（土豆币需后端入账：XZ.sfeReward 钩子，未接入时仅本地累计——报告遗留项）
  const earnBook = (n) => {
    try {
      const v = (parseInt(localStorage.getItem(LS_EARN) || "0", 10) || 0) + n;
      localStorage.setItem(LS_EARN, String(v));
    } catch (e) {}
  };
  const creditCoins = (n) => {
    earnBook(n);
    try { self.XZ && XZ.sfeReward && XZ.sfeReward(n); } catch (e) {}
    return n;
  };
  const WEAPON_RE = /rifle|smg|sniper|pistol|revolver|shotgun|lmg|launcher|bolt|double_barrel/;
  const isWeapon = (id) => WEAPON_RE.test(String(id || ""));

  // ================================================================ 运行时状态
  const state = {
    match: null,          // createMatch 产物 + 运行期字段
    prevPos: null,        // 站定判定
    lastTickNo: -1,
    plan: null,
    mapHold: false,       // 全图按钮按住
    ai: [],
    aiTimer: 0,
    uiRoot: null,
  };
  const matchOn = (g) => !!(g && g.worldMeta && g.worldMeta.sfe && state.match && !state.match.settle);
  const invStacks = (p) => (p && p.inv ? p.inv.slots.filter(Boolean) : []);

  // ================================================================ DOM UI（出击准备 / 结算 / 仓库；独立于 potato #lobby）
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const stackName = (s) => {
    const key = typeof s.id === "string" ? s.id : (BLOCKS && BLOCKS[s.id] ? BLOCKS[s.id].name || BLOCKS[s.id].key : String(s.id));
    return key;
  };
  const uiRoot = () => {
    if (!state.uiRoot) {
      state.uiRoot = el("div", "sfe-root");
      state.uiRoot.style.cssText = "position:fixed;inset:0;z-index:60;pointer-events:none;font-family:system-ui,sans-serif;color:#eee;";
      document.body.appendChild(state.uiRoot);
    }
    return state.uiRoot;
  };
  const openOverlay = (html) => {
    const r = uiRoot();
    r.style.pointerEvents = "auto";
    const ov = el("div", "sfe-ov", `<style>
      .sfe-ov{position:absolute;inset:0;background:rgba(10,12,16,.78);display:flex;align-items:center;justify-content:center;}
      .sfe-card{width:min(560px,92vw);max-height:86vh;overflow:auto;background:#161a22;border:1px solid #2c3444;border-radius:14px;padding:18px;}
      .sfe-card h2{margin:0 0 4px;font-size:20px;} .sfe-card h2.win{color:#19C79A} .sfe-card h2.lose{color:#FF6060}
      .sfe-card small{color:#8b94a6}
      .sfe-list{margin:10px 0;font-size:13px;line-height:1.7}
      .sfe-list .lost{color:#FF6060;text-decoration:line-through}
      .sfe-row{display:flex;justify-content:space-between;gap:8px}
      .sfe-btns{display:flex;gap:10px;margin-top:14px}
      .sfe-btns button{flex:1;padding:10px;border-radius:10px;border:1px solid #2c3444;background:#1d2430;color:#eee;font-size:14px;cursor:pointer}
      .sfe-btns button.go{background:#F5A623;color:#141414;font-weight:700;border-color:#F5A623}
      .sfe-grid{display:grid;grid-template-columns:repeat(8,1fr);gap:6px;margin:10px 0}
      .sfe-grid .sl{position:relative;aspect-ratio:1;background:#0f1218;border:1px solid #2c3444;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;padding:2px;text-align:center;cursor:pointer}
      .sfe-grid .sl.sel{outline:2px solid #F5A623}
      .sfe-grid .sl.ins{outline:2px solid #19C79A}
      .sfe-tip{font-size:12px;color:#8b94a6;margin:6px 0}
      .sfe-cap{color:#F5A623;font-weight:700}
    </style>` + html);
    r.innerHTML = "";
    r.appendChild(ov);
    return ov;
  };
  const closeOverlay = () => {
    const r = state.uiRoot;
    if (r) { r.innerHTML = ""; r.style.pointerEvents = "none"; }
  };

  // ---- 出击准备页（06 卡 → 带入选择 + 空手出击 + 仓库变现；保险格标记，规格 §2.1/§4.2/§5.2） ----
  let prepSel = null; // {carry:[stack...], insIdx:-1}
  function openPrep(game) {
    const stash = stashLoad();
    prepSel = { carry: [], insIdx: -1 };
    const ov = openOverlay(`<div class="sfe-card">
      <h2>出击准备</h2><small>搜物资 · 打遭遇战 · 活着撤离。白板空手进图是合法策略。</small>
      <div class="sfe-tip">仓库（点选带入，背包 12 格上限；长按/右键标记保险格）<button id="sfe-sellmode" style="float:right;padding:2px 8px;border-radius:6px;border:1px solid #2c3444;background:#1d2430;color:#eee;font-size:12px;cursor:pointer;">变现模式：关</button></div>
      <div class="sfe-grid" id="sfe-stash"></div>
      <div class="sfe-tip">随身：<b id="sfe-carry-n">0</b>/12 · 保险格：<b id="sfe-ins-n">未设置</b>（免费 1 格，不可放武器；死亡时该格返回仓库）</div>
      <div class="sfe-btns">
        <button id="sfe-bare">空手出击</button>
        <button id="sfe-go" class="go">出击</button>
        <button id="sfe-cancel">返回大厅</button>
      </div></div>`);
    const grid = ov.querySelector("#sfe-stash");
    const sellBtn = ov.querySelector("#sfe-sellmode");
    let sellMode = false;
    sellBtn.onclick = () => { sellMode = !sellMode; sellBtn.textContent = "变现模式：" + (sellMode ? "开" : "关"); render(); };
    const render = () => {
      grid.innerHTML = "";
      stash.slots.forEach((s, i) => {
        if (!s) return;
        const sell = Math.floor(SFE_POI.valueOf(s.id) * (s.n || 1) * T.sellDiscount);
        const b = el("div", "sl", esc(stackName(s)) + "<br>×" + (s.n || 1) + (sellMode && sell ? `<br><span style="color:#F5A623">${sell}币</span>` : ""));
        const ci = prepSel.carry.indexOf(s);
        if (ci >= 0) b.classList.add("sel");
        if (prepSel.insIdx === ci) b.classList.add("ins");
        b.onclick = () => {
          if (sellMode) {
            // 逐件确认变现（规格 §5.2：无批量误卖路径）
            if (confirm(`变现 ${stackName(s)} ×${s.n || 1} → ${sell} 土豆币？`)) {
              creditCoins(sell);
              stash.slots[i] = null;
              stashSave(stash);
            }
          } else {
            const k = prepSel.carry.indexOf(s);
            if (k >= 0) {
              prepSel.carry.splice(k, 1);
              if (prepSel.insIdx === k) prepSel.insIdx = -1;
              else if (prepSel.insIdx > k) prepSel.insIdx--;
            } else if (prepSel.carry.length < 12) prepSel.carry.push(s);
          }
          render();
        };
        b.oncontextmenu = (ev) => {
          ev.preventDefault();
          if (sellMode) return;
          const k = prepSel.carry.indexOf(s);
          if (k >= 0 && !isWeapon(s.id)) { prepSel.insIdx = k; render(); }
        };
        grid.appendChild(b);
      });
      ov.querySelector("#sfe-carry-n").textContent = prepSel.carry.length;
      ov.querySelector("#sfe-ins-n").textContent = prepSel.insIdx >= 0 ? stackName(prepSel.carry[prepSel.insIdx]) : "未设置";
    };
    render();
    ov.querySelector("#sfe-bare").onclick = () => beginDeploy(game, prepSel, stash);
    ov.querySelector("#sfe-go").onclick = () => beginDeploy(game, prepSel, stash);
    ov.querySelector("#sfe-cancel").onclick = () => { closeOverlay(); toLobby(game, true); };
  }

  // ---- 进图（带入即入库：仓库扣除 → 局内随身，规格 §2.1 防刷根基） ----
  async function beginDeploy(game, sel, stash) {
    closeOverlay();
    // 二次确认（取消 = 留在大厅并清局）
    if (sel.carry.length) {
      const ok = confirm("确认携带 " + sel.carry.length + " 格物资出击？（死亡将损失随身全部，保险格除外）");
      if (!ok) { toLobby(game, true); return; }
    }
    const insStack = sel.insIdx >= 0 ? sel.carry[sel.insIdx] : null;
    const res = await SFE_WORLD.start(game); // 世界工厂（含登机期预生成）
    state.plan = res.plan;
    // 带入：从仓库扣除，写入玩家随身
    const p = game.player;
    for (const s of sel.carry) {
      const slotIdx = stash.slots.indexOf(s);
      if (slotIdx >= 0) stash.slots[slotIdx] = null;
      if (p) p.inv.add(makeStack(s.id, s.n));
    }
    stashSave(stash);
    // 保险格快照（规格 §8.1：进图时即写，崩溃可恢复）
    insSnapWrite(insStack ? { id: insStack.id, n: insStack.n } : null);
    // 主撤离点每局随机 3 选 1（规格 §3.5）
    const m = createMatch();
    m.mainPick = Math.floor(Math.random() * T.mainCandidates);
    m.insId = insStack ? insStack.id : null;
    state.match = m;
    state.prevPos = null;
    state.ai = [];
    game.ui && game.ui.message("搜打撤：着陆成功 · " + T.deploySec + " 秒保护期 · 搜集物资，活着撤离", "#F5A623");
    ensureMatchDom(game);
  }

  // ================================================================ 状态机推进（Game.tick 包装，20Hz）
  function tick(game) {
    const wm = game.worldMeta;
    if (!wm || !wm.sfe) return;
    const m = state.match;
    if (!m) return;
    if (game.state !== "play") return; // loading 段只预生成（登机期）
    if (m.settle) return;

    const p = game.player;
    m.t += TICK_DT;
    const ph = phaseAt(m, m.t);
    if (ph !== m.phase) {
      m.phase = ph;
      if (ph === "LOOT") game.ui && game.ui.message("搜打撤：保护期结束 · 搜集物资", "#FFFFFF");
      if (ph === "EXTRACT_OPEN") game.ui && game.ui.message("搜打撤：常开撤离点开放（地图罗盘已亮起）", "#19C79A");
      if (ph === "FINAL_WINDOW") game.ui && game.ui.message("【全图广播】撤离通道即将关闭 · 仅主撤离点开放", "#FF6060");
    }

    // POI 落位（chunk 就绪后补建，帧预算节流）
    if ((game.tickCount & 31) === 0 && state.plan)
      SFE_POI.tickPlacement(game, state.plan, state.placeTracker || (state.placeTracker = { placed: 0 }));

    // AI 调度（每秒；DEPLOY 段不索敌 = 不生成）
    if (m.t >= T.deploySec && ++state.aiTimer >= T.aiTickEvery / 20) { state.aiTimer = 0; aiTick(game, m); }

    // 撤离判定
    if (p && !p.deathTime) {
      const pts = activeExtracts(m, state.plan);
      const zone = pts.find((a) => a.done && Math.hypot(p.pos[0] - a.x, p.pos[2] - a.z) <= T.extractRadius && Math.abs(p.pos[1] - a.y) < 8);
      const moving = state.prevPos ? Math.hypot(p.pos[0] - state.prevPos[0], p.pos[2] - state.prevPos[2]) > 0.02 : true;
      state.prevPos = [...p.pos];
      const done = advanceRead(m, TICK_DT, {
        inZone: !!zone,
        moving,
        hurtNow: m.t - m.hitT < TICK_DT * 2,
        fireNow: m.t - m.fireT < TICK_DT * 2,
      });
      if (done) return extractWin(game, m);
      m.readZone = zone || null;
    } else {
      m.reading = false;
      m.readZone = null;
    }

    // T+15:00 硬结算（读条中 = 成功，其余 = 阵亡，规格 §3.5）
    if (m.phase === "FORCE_END") {
      if (m.read >= 1) extractWin(game, m);
      else forceDeath(game, m, "超时：撤离通道已关闭");
    }
  }

  const activeExtracts = (m, plan) => {
    if (!plan) return [];
    if (m.phase === "EXTRACT_OPEN") return plan.extractAlways;
    if (m.phase === "FINAL_WINDOW" || m.phase === "FORCE_END")
      return [plan.extractMain[m.mainPick]].filter(Boolean);
    return [];
  };

  // ================================================================ 撤离成功（带出 → 仓库 → 结算，规格 §2.5/§5）
  function extractWin(game, m) {
    if (m.settle) return;
    const p = game.player;
    const stacks = p ? invStacks(p) : [];
    // 跨成员钩子（W12c SFEEconomy，任务书约定签名）：撤离结算 · alive
    try {
      self.SFEEconomy && self.SFEEconomy.onExtract(
        stacks.map((s) => ({ id: stackName(s), n: s.n || 1 })),
        "alive",
      );
    } catch (e) {}
    const calc = settleCoins(stacks);
    // 入仓库：24 格容量，溢出强制变现并提示（规格 §9.15）
    const stash = stashLoad();
    let overflowValue = 0, overflowN = 0;
    for (const s of stacks) {
      const rest = stashAdd(stash, s);
      if (rest) { overflowValue += SFE_POI.sellValue(rest); overflowN += rest.n; }
    }
    stashSave(stash);
    if (p) p.inv.slots.fill(null);
    const coinsRaw = calc.raw + overflowValue;
    const coins = Math.min(coinsRaw, T.matchSellCap);
    creditCoins(Math.round(coins));
    m.settle = {
      win: true,
      title: m.phase === "FORCE_END" ? "紧急撤离" : "撤离成功",
      gain: calc.gain,
      loss: [],
      coinsRaw,
      coins,
      capped: coinsRaw > T.matchSellCap,
      overflowN,
      insUsed: false,
      usedSec: Math.round(m.t),
      kills: m.kills,
    };
    finishMatch(game, m);
  }

  // ================================================================ 死亡/超时/主动退出（随身全部丢失，保险格保留，规格 §4）
  function loseMatch(game, m, title, dropAt) {
    if (m.settle) return;
    const p = game.player;
    const loss = [];
    let insStack = null;
    if (p) {
      // 保险格回收（非武器，规格 §4.2；按 id+数量识别，首版语义）
      for (let i = 0; i < p.inv.slots.length; i++) {
        const s = p.inv.slots[i];
        if (s && m.insId && typeof s.id === "string" && s.id === m.insId && !isWeapon(s.id)) { insStack = s; p.inv.slots[i] = null; break; }
      }
      for (const s of p.inv.slots) {
        if (!s) continue;
        const nm = typeof s.id === "string" ? s.id : (BLOCKS && BLOCKS[s.id] ? BLOCKS[s.id].key : String(s.id));
        loss.push({ id: nm, n: s.n || 1, value: SFE_POI.sellValue(s) });
        // 死亡掉落实体化（规格 §4.1，本局内留存，不可回收 §4.4）
        if (dropAt) game.dropItem(p.pos[0], p.pos[1] + 1, p.pos[2], s, [0.5 * (Math.random() - 0.5), 0.3, 0.5 * (Math.random() - 0.5)]);
      }
      p.inv.slots.fill(null);
    }
    if (insStack) { const stash = stashLoad(); stashAdd(stash, { id: insStack.id, n: insStack.n }); stashSave(stash); }
    // 跨成员钩子（W12c SFEEconomy）：撤离结算 · dead（loss = 携带损失清单）
    try {
      self.SFEEconomy && self.SFEEconomy.onExtract(
        loss.map((g) => ({ id: g.id, n: g.n })),
        "dead",
      );
    } catch (e) {}
    insSnapTake(); // 快照消费（正常路径已回收）
    const insName = insStack ? stackName(insStack) : null;
    m.settle = {
      win: false,
      title,
      gain: [],
      loss,
      coinsRaw: 0,
      coins: 0,
      capped: false,
      insName,
      usedSec: Math.round(m.t),
      kills: m.kills,
    };
    finishMatch(game, m, 3000); // 死亡镜头 3s 后进结算页（规格 §7.4）
  }
  const forceDeath = (game, m, why) => { m.reading = false; loseMatch(game, m, why, true); };

  function onPlayerDeath(game, cause) {
    const m = state.match;
    if (!m || m.settle) return;
    m.kills = m.kills;
    game.ui && game.ui.message("你阵亡了", "#FF6060");
    loseMatch(game, m, "阵亡", true); // 走自管掉落，替代 vanilla onPlayerDeath（死亡屏由结算页代替）
  }

  function finishMatch(game, m, delay = 0) {
    removeMatchDom();
    const show = () => showSettle(game, m);
    delay ? setTimeout(show, delay) : show();
  }

  // ---- 结算页（规格 §7.3：成功逐条清单/变现总值；死亡损失清单红色划线 + 保险格提示） ----
  function showSettle(game, m) {
    const s = m.settle;
    if (!s) return;
    const list = (arr, cls) => arr.map((g) => `<div class="sfe-row ${cls || ""}"><span>${esc(g.id)} ×${g.n}</span><span>${g.value ? g.value + " 当量" : ""}</span></div>`).join("") || "<div><small>（无）</small></div>";
    const html = `<div class="sfe-card">
      <h2 class="${s.win ? "win" : "lose"}">${esc(s.title)}</h2>
      <small>局用时 ${(s.usedSec / 60) | 0} 分 ${s.usedSec % 60} 秒 · 击杀 ${s.kills}</small>
      ${s.win ? `<div class="sfe-tip">带出物资（变现单价 = 当量 × 50%）</div><div class="sfe-list">${list(s.gain)}</div>
        <div class="sfe-row"><b>变现总值</b><b>${s.coins} 土豆币${s.capped ? ' <span class="sfe-cap">（已按单局上限 ' + T.matchSellCap + " 封顶）</span>" : ""}</b></div>
        ${s.overflowN ? `<div class="sfe-tip"><span class="sfe-cap">仓库已满：超出 ${s.overflowN} 件强制变现并计入上值</span></div>` : ""}
        <div class="sfe-tip">物品已入仓库，可在出击准备页留存或逐件变现。</div>` : `
        <div class="sfe-tip">损失物资</div><div class="sfe-list">${list(s.loss, "lost")}</div>
        ${s.insName ? `<div class="sfe-row"><b style="color:#19C79A">保险格已保留</b><span>${esc(s.insName)}</span></div>` : "<div class='sfe-tip'>本局未设置保险格</div>"}
        <div class="sfe-tip">带出 0 · 死亡掉落已实体化于死亡点（本局不可回收）。</div>`}
      <div class="sfe-btns">
        <button id="sfe-again" class="go">再出击</button>
        <button id="sfe-lobby">回大厅</button>
      </div></div>`;
    const ov = openOverlay(html);
    ov.querySelector("#sfe-again").onclick = () => { toLobby(game, true); openPrep(game); };
    ov.querySelector("#sfe-lobby").onclick = () => { closeOverlay(); toLobby(game); };
  }

  // ---- 回大厅（世界删除 + 全局释放；规格 §2.0 总循环回 LOBBY） ----
  async function toLobby(game, silent) {
    const m = state.match;
    const hadActive = m && !m.settle;
    if (hadActive) { // 主动退出：二次确认（规格 §8.1，视同死亡、保险格保留、不实体化掉落物）
      const ok = silent || confirm("退出将损失随身全部物资（保险格保留）。确认退出？");
      if (!ok) return;
      loseMatch(game, m, "主动退出", false);
    }
    state.match = null;
    state.plan = null;
    state.placeTracker = null;
    closeOverlay();
    removeMatchDom();
    for (const e of state.ai) { try { e.dead = true; e.deathTime = 25; } catch (x) {} }
    state.ai = [];
    await SFE_WORLD.end(game);
    if (game.state === "play" || game.state === "loading" || game.state === "title") {
      game.startTitle();
      try { game.ui && game.ui.open(new LobbyScreen(game)); } catch (e) {}
    }
  }

  // ================================================================ AI 遭遇战（规格 §3.4 分层；方案 §五步 4 巢穴激活半径）
  function aiTick(game, m) {
    if (!game.world) return;
    const p = game.player;
    if (!p) return;
    // 回收远离玩家/死亡的个体
    state.ai = state.ai.filter((e) => {
      try {
        if (!e || e.dead || e.health <= 0) return false;
        if (Math.hypot(e.pos[0] - p.pos[0], e.pos[2] - p.pos[2]) > T.aiDespawnRadius) { e.dead = true; e.deathTime = 25; return false; }
        return true;
      } catch (x) { return false; }
    });
    const cap = SFE_WORLD.aiCap();
    if (state.ai.length >= cap || !state.plan) return;
    const candidates = [];
    const aliveNear = (x, z, r) => state.ai.some((e) => Math.hypot(e.pos[0] - x, e.pos[2] - z) < r);
    const push = (a, kind) => {
      if (!a || a.failed || !a.done) return;
      const d = Math.hypot(a.x - p.pos[0], a.z - p.pos[2]);
      if (d > T.aiSpawnRadius || d < 12) return;
      if (aliveNear(a.x, a.z, 20)) return;
      candidates.push({ a, kind, d });
    };
    state.plan.lairs.forEach((a) => push(a, "lair"));
    state.plan.main.forEach((a) => push(a, "poiMain"));
    state.plan.minor.forEach((a) => push(a, "poiMinor"));
    state.plan.extractAlways.forEach((a) => push(a, "extract"));
    candidates.sort((x, y) => x.d - y.d);
    const c = candidates[0];
    if (!c) return;
    const hpL3 = () => T.hpL3min + Math.floor(Math.random() * (T.hpL3max - T.hpL3min + 1));
    const spawn = (type, hp, n, r = 6) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        if (state.ai.length >= cap) break;
        const ang = Math.random() * Math.PI * 2, rr = 2 + Math.random() * r;
        const x = c.a.x + Math.cos(ang) * rr, z = c.a.z + Math.sin(ang) * rr;
        if (!game.world.isLoaded(Math.floor(x), Math.floor(z))) continue;
        const y = game.world.surfaceY(Math.floor(x), Math.floor(z), true) + 1;
        if (y <= 63) continue;
        const e = createMob(game, type, x, y, z);
        e.health = e.maxHealth = hp;
        e.persistent = true;
        e.sfe = true;
        game.entities.push(e);
        state.ai.push(e);
        out.push(e);
      }
      return out;
    };
    switch (c.kind) {
      case "lair": spawn("skeleton", T.hpL2, 2); spawn("zombie", T.hpL1, 1); break;
      case "poiMain": spawn("skeleton", hpL3(), 2); spawn("zombie", T.hpL2, 1); break;
      case "poiMinor": spawn("zombie", T.hpL1, 1 + (Math.random() < 0.5 ? 1 : 0)); break;
      case "extract": spawn("zombie", T.hpL1, 1); break;
    }
  }

  // ================================================================ HUD（规格 §7.2；drawHUD 包装，extras 同款挂点）
  const fmt = (sec) => `${(Math.max(0, sec) / 60) | 0}:${String(Math.max(0, Math.floor(Math.max(0, sec)) % 60)).padStart(2, "0")}`;
  let matchDom = null;
  const ensureMatchDom = (game) => {
    if (matchDom) return;
    matchDom = el("div", "sfe-hud");
    matchDom.style.cssText = "position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:55;pointer-events:none;text-align:center;";
    matchDom.innerHTML = `<div id="sfe-timer" style="font:700 20px/1.2 ui-monospace,monospace;color:#eee;text-shadow:0 1px 3px #000;"></div>
      <div id="sfe-phase" style="font:12px/1.4 system-ui;color:#aab;text-shadow:0 1px 2px #000;"></div>
      <button id="sfe-map" style="pointer-events:auto;margin-top:4px;padding:3px 10px;border-radius:8px;border:1px solid #2c3444;background:rgba(22,26,34,.8);color:#eee;font-size:12px;">全图(按住)</button>`;
    uiRoot().appendChild(matchDom);
    const btn = matchDom.querySelector("#sfe-map");
    btn.addEventListener("pointerdown", () => (state.mapHold = true));
    addEventListener("pointerup", () => (state.mapHold = false));
    addEventListener("keydown", (ev) => { if (ev.code === "KeyM") state.mapHold = true; });
    addEventListener("keyup", (ev) => { if (ev.code === "KeyM") state.mapHold = false; });
  };
  const removeMatchDom = () => { if (matchDom) { matchDom.remove(); matchDom = null; } };

  function drawHUD(ui) {
    const g = ui.game;
    const m = state.match;
    if (!g || !g.worldMeta || !g.worldMeta.sfe || !m || m.settle || g.state !== "play") return;
    const ctx = ui.ctx;
    if (!ctx) return;
    // 顶部计时 + 阶段
    const td = matchDom && matchDom.querySelector("#sfe-timer"), pd = matchDom && matchDom.querySelector("#sfe-phase");
    if (td) {
      const final = m.phase === "FINAL_WINDOW" || m.phase === "FORCE_END";
      td.textContent = final ? "撤离关闭 " + fmt(T.forceEndT - m.t) : fmt(m.t);
      td.style.color = final ? "#FF6060" : "#eee";
      pd.textContent = { DEPLOY: "着陆保护期", LOOT: "搜物资 · 打遭遇战", EXTRACT_OPEN: "常开撤离点开放", FINAL_WINDOW: "仅主撤离点开放", FORCE_END: "强制结算" }[m.phase] || "";
    }
    // 撤离罗盘标记（常开点 3 菱形 + 主点 1 星标；未开放不显示，规格 §9.6）
    if (self.hudMarker && state.plan) {
      for (const a of activeExtracts(m, state.plan)) {
        if (!a.done) continue;
        if (Math.hypot(a.x - g.player.pos[0], a.z - g.player.pos[2]) > 4)
          hudMarker(ui, [a.x, a.y, a.z], a.name, m.phase === "FINAL_WINDOW" ? "#FFD24A" : "#19C79A", !0);
      }
    }
    // 背包当量（贪心决策核心信息，规格 §7.2）
    if (g.player) {
      let v = 0;
      for (const s of g.player.inv.slots) if (s) v += SFE_POI.sellValue(s);
      Font.draw(ctx, `背包当量 ≈ ${Math.round(v)} 币`, ui.w - 10 - 130 * 2, ui.h - 64, "#F5A623", !1);
    }
    // 撤离读条（下方进度条 + 提示，规格 §7.2/§7.3）
    if (m.read > 0) {
      const w = Math.min(320, ui.w * 0.5), x = (ui.w - w) / 2, y = ui.h - 96;
      ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(x - 4, y - 20, w + 8, 34);
      ctx.fillStyle = "#19C79A"; ctx.fillRect(x, y - 8, w * m.read, 10);
      Font.draw(ctx, m.reading ? "保持不动 · 撤离中" : "撤离暂停（移动/开火/受击会打断）", x, y + 4, m.reading ? "#19C79A" : "#FFD24A", !1);
    }
    // 全图（按住查看：POI/撤离点/自身标记；不做常驻小地图，规格 §7.2）
    if (state.mapHold && state.plan) drawFullMap(ui, m);
  }

  function drawFullMap(ui, m) {
    const g = ui.game, ctx = ui.ctx, plan = state.plan;
    const span = T.chunkSpan * 16;
    const S = Math.min(ui.w, ui.h) * 0.66, x0 = (ui.w - S) / 2, y0 = (ui.h - S) / 2;
    const px = (x) => x0 + (x / span) * S, pz = (z) => y0 + (z / span) * S;
    ctx.fillStyle = "rgba(8,10,14,.86)"; ctx.fillRect(x0 - 8, y0 - 8, S + 16, S + 16);
    ctx.strokeStyle = "#2c3444"; ctx.strokeRect(x0, y0, S, S);
    const dot = (x, z, c, r = 4) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(px(x), pz(z), r, 0, 7); ctx.fill(); };
    plan.main.forEach((a) => !a.failed && dot(a.x, a.z, "#F5A623"));
    plan.minor.forEach((a) => !a.failed && dot(a.x, a.z, "#7f8aa0", 2.5));
    const act = new Set(activeExtracts(m, plan));
    plan.extractAlways.forEach((a) => !a.failed && dot(a.x, a.z, act.has(a) ? "#19C79A" : "#4a5568", 5));
    const mp = plan.extractMain[m.mainPick];
    if (mp && !mp.failed) dot(mp.x, mp.z, act.has(mp) ? "#FFD24A" : "#4a5568", 6);
    if (g.player) dot(g.player.pos[0], g.player.pos[2], "#FFFFFF", 3);
    Font.draw(ctx, "搜打撤 · 全图（按住查看）", x0 + 6, y0 - 6 - 14, "#8b94a6", !1);
  }

  // ================================================================ 全局包装（最小接线：全部 wrap，不改 game.js/potato.js 内部）
  let installed = false;
  function install() {
    if (installed || typeof Game === "undefined") return;
    installed = true;
    // 跨成员钩子（W12c SFEEconomy，任务书约定签名）：战利品生成 · onLoot(poiType, itemId, count)
    // poiType = 战利品层位 tier（T0~T4，SFE_MAP.LOOT 分层）；rollTable 为 SFE_POI 公开接口，运行时包装不改其文件
    if (self.SFE_POI && SFE_POI.rollTable && !SFE_POI.rollTable.__sfeEco) {
      const rollOrig = SFE_POI.rollTable;
      SFE_POI.rollTable = function (tier, rng) {
        const it = rollOrig.call(this, tier, rng);
        if (it) { try { self.SFEEconomy && self.SFEEconomy.onLoot(tier, it.id, it.n); } catch (e) {} }
        return it;
      };
      SFE_POI.rollTable.__sfeEco = true;
    }
    const tickOrig = Game.prototype.tick;
    Game.prototype.tick = function () {
      const r = tickOrig.apply(this, arguments);
      try { tick(this); } catch (e) { typeof errLog === "function" && errLog(e, "sfe tick"); }
      return r;
    };
    const hurtOrig = Player.prototype.hurt;
    Player.prototype.hurt = function (src, dmg) {
      const g = this.game;
      if (matchOn(g) && this === g.player) {
        const m = state.match;
        if (m.phase === "DEPLOY") return !1; // DEPLOY 无敌（规格 §2.6）
        m.hitT = m.t; // 受击打断撤离读条（规格 §2.4）
      }
      return hurtOrig.call(this, src, dmg);
    };
    const attackOrig = Player.prototype.swing;
    Player.prototype.swing = function (...a) {
      const g = this.game;
      if (matchOn(g) && this === g.player) {
        const m = state.match;
        if (m.phase === "DEPLOY") return !1; // DEPLOY 禁开火
        m.fireT = m.t; // 开火打断（swing 为 melee/攻击公共入口；xzguns 若走独立路径由移动/受击兜底——报告注明）
      }
      return attackOrig.apply(this, a);
    };
    const killOrig = Game.prototype.onMobKilled;
    Game.prototype.onMobKilled = function (mob, cause) {
      try {
        const m = state.match;
        if (m && !m.settle && cause && (cause.attacker === this.player || cause.player)) m.kills++;
      } catch (e) {}
      return killOrig.call(this, mob, cause);
    };
    const dieOrig = Player.prototype.die;
    Player.prototype.die = function (cause) {
      return dieOrig.call(this, cause); // vanilla：deathTime + onPlayerDeath（SFE 分支由 onPlayerDeath 包装接管）
    };
    const opdOrig = Game.prototype.onPlayerDeath;
    Game.prototype.onPlayerDeath = function (cause) {
      if (matchOn(this)) return onPlayerDeath(this, cause); // SFE 自管结算（vanilla 死亡屏被结算页代替）
      return opdOrig.call(this, cause);
    };
    if (typeof UI !== "undefined" && UI.prototype.drawHUD && !UI.prototype.drawHUD.__sfe) {
      const hudOrig = UI.prototype.drawHUD;
      UI.prototype.drawHUD = function () {
        hudOrig.call(this);
        try { drawHUD(this); } catch (e) {}
      };
      UI.prototype.drawHUD.__sfe = true;
    }
    // 主动退出/切世界兜底：离开 SFE 世界而未结算 → 视同死亡（规格 §8.1，保险格保留，不实体化掉落物）
    const stOrig = Game.prototype.startTitle;
    Game.prototype.startTitle = function () {
      if (matchOn(this)) {
        const m = state.match;
        loseMatch(this, m, "主动退出", false);
        state.match = null;
        removeMatchDom();
        for (const e of state.ai) { try { e.dead = true; e.deathTime = 25; } catch (x) {} }
        state.ai = [];
        SFE_WORLD.end(this); // 异步清库，不阻塞返回大厅
      }
      return stOrig.call(this);
    };
  }

  // ================================================================ mock 驱动测试钩子（纯逻辑复用，无 DOM/WebGL 依赖）
  const _test = {
    createMatch, phaseAt, advanceRead, settleCoins, stashAdd, stashLoad, stashSave, insSnapWrite, insSnapTake,
    TUNE: T, creditCoins, earnBook, valueOf: SFE_POI.valueOf,
    sim: (opts = {}) => {
      const m = createMatch();
      m.mainPick = 0;
      const log = [];
      let last = null;
      const step = 0.05;
      for (let i = 0; i * step <= T.forceEndT + 0.01; i++) {
        const t = i * step;
        const ph = phaseAt(m, t);
        if (ph !== m.phase) { m.phase = ph; log.push([t, ph]); }
        last = ph;
        m.t = t;
      }
      return { log, final: last, m };
    },
  };

  install();

  return {
    TUNE: T, state, matchOn, openPrep, toLobby, tick, drawHUD, install,
    get match() { return state.match; },
    _test,
  };
})();
self.SFE_RULES = SFE_RULES;
//# sourceURL=js/sfe_rules.js
