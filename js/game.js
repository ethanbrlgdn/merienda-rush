/* Merienda Rush! — game state, rules, input and the main loop. */
var MR = window.MR = window.MR || {};

MR.Game = (function () {
  var W = MR.W, H = MR.H, A = MR.Art, AU = MR.Audio;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  MR.reduced = reduced;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function inRect(x, y, r) { return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h; }

  // =====================================================================
  //  SAVE DATA (localStorage)
  // =====================================================================
  var SAVE_KEY = 'meriendaRush.v1';
  var S = { wallet: 0, up: {}, days: {}, muted: false, seenHow: false };
  MR.UPGRADES.forEach(function (u) { S.up[u.id] = 0; });

  function load() {
    try {
      var raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      var d = JSON.parse(raw);
      if (!d || typeof d !== 'object') return;
      S.wallet = Math.max(0, +d.wallet || 0);
      for (var k in S.up) if (d.up && d.up[k]) S.up[k] = Math.max(0, +d.up[k] || 0);
      if (d.days && typeof d.days === 'object') S.days = d.days;
      S.muted = !!d.muted;
      S.seenHow = !!d.seenHow;
    } catch (e) { /* private mode or blocked storage: play without saving */ }
  }
  function save() {
    try { window.localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {}
  }
  function resetSave() {
    S.wallet = 0; S.days = {}; S.seenHow = false;
    for (var k in S.up) S.up[k] = 0;
    save();
  }
  function dayUnlocked(n) { return n === 1 || !!(S.days[n - 1] && S.days[n - 1].stars > 0); }

  // upgrade effects
  function speedMul() { return 1 - 0.15 * S.up.speed; }
  function kawaliSlots() { return 3 + S.up.slots; }
  function golden() { return MR.GOLDEN + 2 * S.up.pan; }
  function patienceMul() { return 1 + 0.15 * S.up.radio; }
  function tipMul() { return 1 + 0.1 * (S.up.flags + S.up.plants + S.up.parol); }

  // =====================================================================
  //  LAYOUT (logical 1280x720)
  // =====================================================================
  var TRAYS = [], ST = {}, ST_LIST = [];
  var TRASH = { x: 1068, y: 614, w: 202, h: 98 };
  var SPOTS = { 2: [450, 830], 3: [300, 640, 980], 4: [255, 500, 745, 990] };

  function buildLayout() {
    TRAYS = MR.TRAYS.map(function (t, i) {
      return { id: t.id, item: t.item, label: t.label, day: t.day, x: 8 + i * 116, y: 338, w: 106, h: 106 };
    });
    MR.SAUCE_TRAYS.forEach(function (t, i) {
      TRAYS.push({ id: t.id, item: t.item, label: t.label, day: t.day, x: 826 + i * 79, y: 588, w: 73, h: 124, bottle: true });
    });
    ST = {
      board:  { id: 'board',  label: 'Sangkalan',         x: 10,   y: 456, w: 292, h: 256, n: 3, day: 1 },
      kawali: { id: 'kawali', label: 'Kawali',            x: 312,  y: 456, w: 330, h: 256, day: 1, cx: 477, cy: 590 },
      sugar:  { id: 'sugar',  label: 'Asukal / Karamelo', x: 652,  y: 456, w: 164, h: 124, n: 2, day: 1 },
      skewer: { id: 'skewer', label: 'Stick',             x: 652,  y: 588, w: 164, h: 124, n: 2, day: 1 },
      cups:   { id: 'cups',   label: 'Baso + Sauce',      x: 826,  y: 456, w: 232, h: 124, n: 2, day: 3 },
      drinks: { id: 'drinks', label: 'Palamig',           x: 1068, y: 456, w: 202, h: 150, n: 2, day: 4 }
    };
    ST_LIST = [ST.board, ST.kawali, ST.sugar, ST.skewer, ST.cups, ST.drinks];
  }

  function kawaliPositions(n) {
    if (n <= 3) return [[-66, -26], [66, -26], [0, 46]];
    if (n === 4) return [[-66, -32], [66, -32], [-66, 44], [66, 44]];
    return [[-84, -30], [0, -46], [84, -30], [-46, 46], [46, 46]];
  }

  function layoutSlots() {
    ST_LIST.forEach(function (st) {
      var i;
      if (st.id === 'kawali') {
        var pos = kawaliPositions(kawaliSlots()), sz = pos.length > 4 ? 84 : 92;
        st.slots = pos.map(function (p) { return { x: st.cx + p[0] - sz / 2, y: st.cy + p[1] - sz / 2, w: sz, h: sz, item: null }; });
      } else {
        var sw = (st.w - 20) / st.n;
        st.slots = [];
        for (i = 0; i < st.n; i++) st.slots.push({ x: st.x + 10 + i * sw, y: st.y + 28, w: sw, h: st.h - 34, item: null });
      }
    });
  }

  // =====================================================================
  //  GAME STATE
  // =====================================================================
  var G = {
    mode: 'menu',          // menu | intro | play | ending | results
    paused: false, day: 1, t: 0,
    timeLeft: 0, coins: 0, tips: 0, served: 0, lost: 0, burnt: 0, hearts: MR.HEARTS,
    customers: [], spotTaken: [], spawnT: 0, nextId: 1, lastType: '',
    held: null, pointer: { x: 640, y: 400 },
    floats: [], parts: [],
    jeep: { active: false, x: -300, dir: 1, wait: 2 },
    endT: 0, lastTick: 0
  };
  function day() { return MR.DAYS[G.day - 1]; }
  function stationOpen(st) { return st.day <= G.day; }

  function addFloat(txt, x, y, color, size) {
    G.floats.push({ text: txt, x: x, y: y, color: color || '#fff', size: size || 24, t: 0 });
  }
  function addPart(type, x, y, n) {
    if (reduced && type !== 'coin') n = Math.min(n || 1, 2);
    for (var i = 0; i < (n || 1); i++) {
      G.parts.push({
        type: type, x: x + rand(-14, 14), y: y + rand(-8, 8),
        vx: type === 'spark' ? rand(-90, 90) : rand(-10, 10),
        vy: type === 'spark' ? rand(-120, -20) : rand(-50, -25),
        t: 0, life: type === 'smoke' ? 1.6 : type === 'coin' ? 0.7 : 0.9,
        sx: x, sy: y
      });
    }
  }

  // =====================================================================
  //  KAWALI
  // =====================================================================
  function fryState(it) {
    if (it.t < it.cook) return 'raw';
    if (it.t < it.cook + golden()) return 'done';
    return 'burnt';
  }
  function fryingCount() {
    var n = 0;
    ST.kawali.slots.forEach(function (s) { if (s.item && !s.item.lifted && fryState(s.item) !== 'burnt') n++; });
    return n;
  }

  // What would `kind` become if dropped onto slot content `it` in station `st`? (null = not allowed)
  function accept(st, it, kind) {
    if (st.id === 'board') {
      if (!it) return MR.BOARD_START[kind] ? { kind: kind } : null;
      return combo(st.id, it.kind, kind);
    }
    if (st.id === 'kawali') {
      if (it || !MR.FRY[kind]) return null;
      return { kind: kind, base: MR.FRY[kind].base, t: 0, cook: MR.FRY[kind].cook * speedMul() };
    }
    if (!it) {
      var step = MR.STEP[st.id];
      return step && step[kind] ? { kind: step[kind] } : null;
    }
    return combo(st.id, it.kind, kind);
  }
  function combo(stId, a, b) {
    var key = a + '+' + b, list = MR.STATION_COMBOS[stId];
    return list && list.indexOf(key) >= 0 ? { kind: MR.COMBOS[key] } : null;
  }

  // best slot in `st` for the held item (prefers the slot under the finger, then combos, then empty)
  function findSlot(st, h, pref) {
    if (!stationOpen(st)) return -1;
    var skip = (h.from.type === 'slot' && h.from.st === st.id) ? h.from.i : -1;
    function ok(i) { return i !== skip && accept(st, st.slots[i].item, h.kind); }
    if (pref >= 0 && ok(pref)) return pref;
    var i;
    for (i = 0; i < st.slots.length; i++) if (st.slots[i].item && ok(i)) return i;
    for (i = 0; i < st.slots.length; i++) if (!st.slots[i].item && ok(i)) return i;
    return -1;
  }

  // =====================================================================
  //  CUSTOMERS
  // =====================================================================
  function foodLabel(o) { return MR.FOODS[o.food].name; }

  function makeOrder() {
    var D = day();
    var menu = Object.keys(MR.FOODS).filter(function (f) { return MR.FOODS[f].day <= G.day; });
    // the newest food shows up more on the day it is introduced
    var weighted = [];
    menu.forEach(function (f) { weighted.push(f); if (MR.FOODS[f].day === G.day && G.day > 1) weighted.push(f, f); });
    var n = Math.random() < D.multi ? 2 : 1, items = [];
    for (var k = 0; k < n; k++) {
      var f = pick(weighted), o = { food: f, kind: f, done: false };
      if (MR.FOODS[f].sauce) { o.sauce = pick(['sweet', 'spicy', 'vinegar']); o.kind = f + '_' + o.sauce; }
      items.push(o);
    }
    return items;
  }

  function orderLine(type, order) {
    if (Math.random() < 0.25) return pick(MR.LINES.special[type]);
    if (order.length > 1) return pick(MR.LINES.order2).replace('{f}', foodLabel(order[0])).replace('{g}', foodLabel(order[1]));
    var o = order[0];
    if (o.sauce && Math.random() < 0.6) return o.food === 'fishball' ? 'Fishball, ' + MR.SAUCES[o.sauce].label.toLowerCase() + ' po!' : 'Kikiam, ' + MR.SAUCES[o.sauce].label.toLowerCase() + ' po!';
    return pick(MR.LINES.order).replace('{f}', foodLabel(o));
  }

  function spawnCustomer() {
    var D = day(), spots = SPOTS[D.spots], free = [];
    for (var i = 0; i < spots.length; i++) if (!G.spotTaken[i]) free.push(i);
    if (!free.length) return false;
    var si = pick(free);
    var types = Object.keys(MR.CUSTOMERS).filter(function (t) { return t !== G.lastType; });
    var type = pick(types); G.lastType = type;
    var order = makeOrder();
    var extra = 0; order.forEach(function (o) { extra += MR.FOODS[o.food].extra; });
    var maxP = (D.patience + extra) * MR.CUSTOMERS[type].patience * patienceMul();
    var fromLeft = spots[si] < W / 2;
    var cu = {
      id: G.nextId++, type: type, spot: si,
      x: fromLeft ? -90 : W + 90, y: 200, tx: spots[si],
      state: 'walk', walkT: Math.random() * 3, order: order,
      p: maxP, maxP: maxP, mood: 'happy',
      line: orderLine(type, order), lineT: 0, dir: 0
    };
    G.spotTaken[si] = cu.id;
    G.customers.push(cu);
    return true;
  }

  function leave(cu, happy, line) {
    cu.state = 'leave';
    cu.mood = happy ? 'joy' : 'angry';
    cu.line = line || pick(happy ? MR.LINES.happy : MR.LINES.leave);
    cu.lineT = 0;
    cu.dir = cu.x < W / 2 ? -1 : 1;
    if (G.spotTaken[cu.spot] === cu.id) G.spotTaken[cu.spot] = 0;
  }

  function updateCustomers(dt) {
    for (var i = G.customers.length - 1; i >= 0; i--) {
      var cu = G.customers[i], sp = MR.CUSTOMERS[cu.type].speed;
      cu.lineT += dt;
      if (cu.state === 'walk') {
        cu.walkT += dt;
        var d = cu.tx - cu.x, step = sp * dt;
        if (Math.abs(d) <= step) { cu.x = cu.tx; cu.state = 'wait'; }
        else cu.x += step * (d > 0 ? 1 : -1);
        cu.y = 200 - (reduced ? 0 : Math.abs(Math.sin(cu.walkT * 9)) * 6);
      } else if (cu.state === 'wait') {
        if (G.mode === 'play') cu.p -= dt;
        cu.y = 200 + (reduced ? 0 : Math.sin(G.t * 2 + cu.id) * 1.5);
        var f = cu.p / cu.maxP;
        var mood = f > 0.55 ? 'happy' : f > 0.25 ? 'meh' : 'angry';
        if (mood !== cu.mood) {
          cu.mood = mood;
          if (mood === 'meh') { cu.line = pick(MR.LINES.impatient); cu.lineT = 0; }
          if (mood === 'angry') { cu.line = pick(MR.LINES.angry); cu.lineT = 0; AU.wrong(); }
        }
        if (cu.p <= 0 && G.mode === 'play') {
          leave(cu, false);
          G.hearts--; G.lost++;
          AU.angry();
          addFloat('−♥', cu.x, 150, '#ff5a6a', 34);
          if (G.hearts <= 0) endDay();
        }
      } else {
        cu.walkT += dt;
        cu.x += cu.dir * sp * 1.25 * dt;
        cu.y = 200 - (reduced ? 0 : Math.abs(Math.sin(cu.walkT * 9)) * 6);
        if (cu.x < -140 || cu.x > W + 140) G.customers.splice(i, 1);
      }
    }
  }

  function serve(cu, kind) {
    var idx = -1;
    for (var i = 0; i < cu.order.length; i++) if (!cu.order[i].done && cu.order[i].kind === kind) { idx = i; break; }
    if (idx < 0) {
      cu.p -= cu.maxP * 0.12;
      cu.line = pick(MR.LINES.wrong); cu.lineT = 0;
      AU.wrong();
      addFloat('Mali!', cu.x, 150, '#ff6b5a', 26);
      return false;
    }
    cu.order[idx].done = true;
    var all = cu.order.every(function (o) { return o.done; });
    if (!all) {
      cu.line = 'Salamat! ’Yung isa pa po!'; cu.lineT = 0;
      AU.drop();
      return true;
    }
    var price = 0; cu.order.forEach(function (o) { price += MR.FOODS[o.food].price; });
    var frac = Math.max(0, cu.p / cu.maxP);
    var tip = Math.round(price * 0.5 * frac * tipMul());
    G.coins += price + tip; G.tips += tip; G.served++;
    addFloat('+₱' + price, cu.x, 140, '#ffe14d', 32);
    if (tip > 0) addFloat('tip +₱' + tip, cu.x, 176, '#9cff8a', 22);
    addPart('coin', cu.x, 200, 5);
    AU.ching(); AU.happy();
    leave(cu, true);
    return true;
  }

  // =====================================================================
  //  PICK UP & DROP
  // =====================================================================
  function trayAt(x, y) {
    for (var i = 0; i < TRAYS.length; i++) if (inRect(x, y, TRAYS[i])) return TRAYS[i];
    return null;
  }
  function slotAt(x, y) {
    for (var i = 0; i < ST_LIST.length; i++) {
      var st = ST_LIST[i];
      if (!inRect(x, y, st)) continue;
      var best = -1, bd = 1e9;
      for (var j = 0; j < st.slots.length; j++) {
        var s = st.slots[j];
        if (st.id === 'kawali') {
          var dx = x - (s.x + s.w / 2), dy = y - (s.y + s.h / 2), dd = dx * dx + dy * dy;
          if (dd < bd && dd < 70 * 70) { bd = dd; best = j; }
        } else if (inRect(x, y, s)) best = j;
      }
      return { st: st, i: best };
    }
    return null;
  }
  function customerAt(x, y) {
    for (var i = 0; i < G.customers.length; i++) {
      var cu = G.customers[i];
      if (cu.state === 'wait' && x > cu.x - 100 && x < cu.x + 100 && y > 44 && y < 300) return cu;
    }
    return null;
  }

  function pickAt(x, y) {
    var tr = trayAt(x, y);
    if (tr) {
      if (tr.day > G.day) { addFloat('Bukas sa Araw ' + tr.day, x, y - 30, '#fff', 20); AU.nope(); return null; }
      AU.pick();
      return { kind: tr.item, from: { type: 'tray', id: tr.id } };
    }
    var hit = slotAt(x, y);
    if (hit && hit.i >= 0 && stationOpen(hit.st)) {
      var s = hit.st.slots[hit.i], it = s.item;
      if (!it) return null;
      var kind = it.kind, base;
      if (hit.st.id === 'kawali') {
        var fs = fryState(it);
        if (fs === 'raw') { addFloat('Hindi pa luto!', x, y - 40, '#fff', 20); AU.nope(); return null; }
        base = it.base;
        kind = fs === 'burnt' ? 'burnt' : it.base + '_fried';
      }
      it.lifted = true;
      AU.pick();
      return { kind: kind, base: base, from: { type: 'slot', st: hit.st.id, i: hit.i } };
    }
    return null;
  }

  function consumeHeld() {
    var h = G.held;
    if (h && h.from.type === 'slot') ST[h.from.st].slots[h.from.i].item = null;
    G.held = null;
  }
  function cancelHeld() {
    var h = G.held;
    if (h && h.from.type === 'slot') {
      var it = ST[h.from.st].slots[h.from.i].item;
      if (it) it.lifted = false;
    }
    G.held = null;
  }
  function hintFor(kind) {
    return MR.HINTS[kind] || (MR.FINAL[kind] ? 'Ihain sa customer!' : '');
  }

  function dropAt(x, y) {
    var h = G.held;
    if (!h) return;
    // trash
    if (inRect(x, y, TRASH)) {
      var cost = h.kind === 'burnt' ? MR.BURN_COST : (h.from.type === 'slot' ? MR.TRASH_COST : 0);
      consumeHeld();
      AU.trash();
      if (cost) { G.coins = Math.max(0, G.coins - cost); addFloat('−₱' + cost, TRASH.x + 100, TRASH.y - 10, '#ff8a7a', 26); }
      return;
    }
    // customer
    var cu = customerAt(x, y);
    if (cu) {
      if (!MR.FINAL[h.kind]) {
        addFloat(h.kind === 'burnt' ? 'Sunog ’yan!' : 'Hindi pa tapos!', x, y - 30, '#fff', 20);
        AU.nope(); cancelHeld(); return;
      }
      if (serve(cu, h.kind)) consumeHeld(); else cancelHeld();
      return;
    }
    // station
    var hit = slotAt(x, y);
    if (hit) {
      var st = hit.st;
      if (!stationOpen(st)) { addFloat('Bukas sa Araw ' + st.day, x, y - 30, '#fff', 20); AU.nope(); cancelHeld(); return; }
      var i = findSlot(st, h, hit.i);
      if (i < 0) {
        if (!(h.from.type === 'slot' && h.from.st === st.id)) {
          addFloat(hintFor(h.kind) || 'Hindi puwede dito', x, y - 36, '#fff', 19);
          AU.nope();
        }
        cancelHeld(); return;
      }
      var slot = st.slots[i];
      var res = accept(st, slot.item, h.kind);
      var heldKind = h.kind;
      consumeHeld();
      slot.item = res;
      var cx = slot.x + slot.w / 2, cy = slot.y + slot.h / 2;
      if (st.id === 'kawali') { AU.plop(); addPart('steam', cx, cy, 4); }
      else if (st.id === 'drinks') { AU.pour(); if (res.kind === 'palamig') { AU.sparkle(); addPart('spark', cx, cy, 6); } }
      else if (MR.FINAL[res.kind] || st.id === 'sugar' || st.id === 'skewer') { AU.sparkle(); addPart('spark', cx, cy, 7); }
      else if (heldKind.indexOf('sauce_') === 0) { AU.pour(); AU.sparkle(); addPart('spark', cx, cy, 5); }
      else AU.drop();
      return;
    }
    // nowhere useful: put it back
    var tr = trayAt(x, y);
    if (!tr && y > 330) { var hint = hintFor(h.kind); if (hint) addFloat(hint, x, y - 30, '#fff', 19); }
    cancelHeld();
  }

  // valid targets for highlighting while holding something
  function canDropOn(st, h) { return findSlot(st, h, -1) >= 0; }
  function customerWants(cu, kind) {
    if (cu.state !== 'wait') return false;
    for (var i = 0; i < cu.order.length; i++) if (!cu.order[i].done && cu.order[i].kind === kind) return true;
    return false;
  }

  // =====================================================================
  //  DAY FLOW
  // =====================================================================
  function prepareDay(n) {
    G.day = n;
    G.mode = 'intro';
    G.paused = false;
    G.customers = []; G.spotTaken = []; G.floats = []; G.parts = [];
    G.held = null;
    layoutSlots();
  }
  function beginDay() {
    var D = day();
    G.mode = 'play';
    G.paused = false;
    G.timeLeft = D.time;
    G.coins = 0; G.tips = 0; G.served = 0; G.lost = 0; G.burnt = 0;
    G.hearts = MR.HEARTS;
    G.customers = []; G.spotTaken = []; G.floats = []; G.parts = [];
    G.held = null; G.spawnT = 1.2; G.lastTick = 0;
    layoutSlots();
    AU.unlock(); AU.start();
  }
  function endDay() {
    if (G.mode !== 'play') return;
    G.mode = 'ending';
    G.endT = 1.6;
    cancelHeld();
    var closing = G.hearts > 0;
    G.customers.forEach(function (cu) {
      if (cu.state !== 'leave') leave(cu, false, closing ? 'Sarado na pala!' : 'Hay naku...');
      if (closing) cu.mood = 'meh';
    });
    AU.sizzle(0);
    if (closing) AU.end(); else AU.fail();
  }
  function finishDay() {
    G.mode = 'results';
    var D = day(), failed = G.hearts <= 0;
    var coins = Math.max(0, Math.round(G.coins));
    var stars = 0;
    if (!failed) MR.STAR_STEPS.forEach(function (m) { if (coins >= D.goal * m) stars++; });
    S.wallet += coins;
    var rec = S.days[G.day] || { stars: 0, best: 0 };
    var newBest = coins > rec.best;
    rec.best = Math.max(rec.best, coins);
    rec.stars = Math.max(rec.stars, stars);
    S.days[G.day] = rec;
    save();
    MR.UI.results({
      day: G.day, coins: coins, tips: G.tips, served: G.served, lost: G.lost, burnt: G.burnt,
      stars: stars, failed: failed, newBest: newBest && coins > 0, goal: D.goal, best: rec.best
    });
  }

  function update(dt) {
    if (G.paused) { AU.sizzle(0); return; }
    G.t += dt;
    var J = G.jeep;
    if (J.active) {
      J.x += J.dir * 190 * dt;
      if (J.x < -280 || J.x > W + 280) { J.active = false; J.wait = rand(9, 17); }
    } else {
      J.wait -= dt;
      if (J.wait <= 0) {
        J.active = true; J.dir = Math.random() < 0.5 ? 1 : -1; J.x = J.dir > 0 ? -260 : W + 260;
        if (G.mode === 'play' && Math.random() < 0.6) AU.jeep();
      }
    }
    // particles & floating text
    for (var i = G.parts.length - 1; i >= 0; i--) {
      var p = G.parts[i]; p.t += dt;
      if (p.t >= p.life) { G.parts.splice(i, 1); continue; }
      if (p.type !== 'coin') { p.x += p.vx * dt; p.y += p.vy * dt; if (p.type === 'spark') p.vy += 260 * dt; }
    }
    for (i = G.floats.length - 1; i >= 0; i--) { G.floats[i].t += dt; if (G.floats[i].t > 1.3) G.floats.splice(i, 1); }

    if (G.mode === 'play') {
      var D = day();
      G.timeLeft -= dt;
      var sec = Math.ceil(G.timeLeft);
      if (sec <= 10 && sec > 0 && sec !== G.lastTick) { G.lastTick = sec; AU.tick(); }
      if (G.timeLeft <= 0) { G.timeLeft = 0; endDay(); }
      else {
        G.spawnT -= dt;
        if (G.spawnT <= 0) G.spawnT = (G.timeLeft > 7 && spawnCustomer()) ? rand(D.spawn[0], D.spawn[1]) : 0.6;
        updateKawali(dt);
      }
      updateCustomers(dt);
    } else if (G.mode === 'ending') {
      updateCustomers(dt);
      G.endT -= dt;
      if (G.endT <= 0) finishDay();
    }
    AU.sizzle(G.mode === 'play' ? fryingCount() : 0);
    AU.radio(dt, S.up.radio > 0 && G.mode === 'play');
  }

  function updateKawali(dt) {
    ST.kawali.slots.forEach(function (s) {
      var it = s.item;
      if (!it || it.lifted) return;
      var prev = fryState(it);
      it.t += dt;
      var now = fryState(it);
      var cx = s.x + s.w / 2, cy = s.y + s.h / 2;
      if (now === 'raw' && Math.random() < dt * 5) addPart('steam', cx, cy - 10, 1);
      if (prev === 'raw' && now === 'done') { AU.sparkle(); addPart('spark', cx, cy, 6); }
      if (now === 'done') {
        var left = it.cook + golden() - it.t;
        if (left < 1.6) { var b = Math.floor(left * 4); if (b !== it.warnB) { it.warnB = b; if (b % 2 === 0) AU.warn(); } }
      }
      if (prev !== 'burnt' && now === 'burnt') {
        AU.burn(); G.burnt++;
        addFloat('Sunog!', cx, cy - 44, '#e0e0e0', 24);
        addPart('smoke', cx, cy, 6);
      }
      if (now === 'burnt' && Math.random() < dt * 4) addPart('smoke', cx, cy - 6, 1);
    });
  }

  // =====================================================================
  //  RENDER
  // =====================================================================
  var canvas, ctx, scale = 1, topCache = null, botCache = null;

  function buildCaches() {
    var k = scale;
    topCache = document.createElement('canvas');
    topCache.width = Math.max(1, Math.round(W * k)); topCache.height = Math.max(1, Math.round(272 * k));
    var c = topCache.getContext('2d'); c.scale(k, k); A.paintTop(c);
    botCache = document.createElement('canvas');
    botCache.width = Math.max(1, Math.round(W * k)); botCache.height = Math.max(1, Math.round(448 * k));
    c = botCache.getContext('2d'); c.scale(k, k); c.translate(0, -272); A.paintCounter(c);
  }

  function render() {
    var c = ctx, t = G.t, h = G.mode === 'play' ? G.held : null;
    c.setTransform(scale, 0, 0, scale, 0, 0);
    c.drawImage(topCache, 0, 0, W, 272);
    A.drawLights(c, t, reduced);
    if (S.up.flags) A.drawFlags(c, t, reduced);
    if (S.up.parol) A.drawParol(c, t, reduced);
    if (G.jeep.active) A.drawJeep(c, G.jeep.x, G.jeep.dir);
    var i, cu;
    for (i = 0; i < G.customers.length; i++) A.drawCustomer(c, G.customers[i], t, reduced);
    c.drawImage(botCache, 0, 272, W, 448);
    for (i = 0; i < G.customers.length; i++) A.drawHands(c, G.customers[i]);
    A.drawSign(c);
    if (S.up.plants) A.drawPlants(c);
    if (S.up.radio) A.drawRadio(c, t, reduced);
    for (i = 0; i < G.customers.length; i++) {
      cu = G.customers[i];
      if (cu.state === 'walk') continue;
      A.drawBubble(c, cu, t, h && MR.FINAL[h.kind] && customerWants(cu, h.kind));
    }

    // trays
    for (i = 0; i < TRAYS.length; i++) A.drawTray(c, TRAYS[i], TRAYS[i].day > G.day, false, t);
    // stations
    var fc = G.mode === 'play' ? fryingCount() : 0;
    ST_LIST.forEach(function (st) {
      A.drawStationBase(c, st, t, fc);
      st.slots.forEach(function (s) {
        var it = s.item;
        if (!it) return;
        var cx = s.x + s.w / 2, cy = s.y + s.h / 2;
        c.globalAlpha = it.lifted ? 0.3 : 1;
        if (st.id === 'kawali') {
          var fs = fryState(it);
          var doneness = Math.min(1, it.t / it.cook);
          A.drawFry(c, it.base, doneness, fs === 'burnt', cx, cy, 0.95);
          if (!it.lifted && fs !== 'burnt') {
            var left = it.cook + golden() - it.t;
            var blink = fs === 'done' && left < 1.6 && (reduced || Math.floor(t * 8) % 2 === 0);
            A.cookRing(c, cx, cy, fs, fs === 'raw' ? it.t / it.cook : left / golden(), blink);
          }
        } else {
          var sc = st.id === 'board' ? 1 : (s.w < 80 ? 0.82 : 0.9);
          A.drawItem(c, it.kind, cx, cy + 4, sc);
        }
        c.globalAlpha = 1;
      });
      if (!stationOpen(st)) A.lockedOverlay(c, st, st.day);
      else if (h && canDropOn(st, h)) A.highlight(c, st, t);
    });
    A.drawTrash(c, TRASH, !!h, t);
    if (h && (h.kind === 'burnt' || !MR.FINAL[h.kind])) { if (h.kind === 'burnt') A.highlight(c, TRASH, t); }

    // particles
    G.parts.forEach(function (p) {
      var k = p.t / p.life;
      if (p.type === 'steam' || p.type === 'smoke') {
        c.globalAlpha = (1 - k) * (p.type === 'smoke' ? 0.55 : 0.4);
        c.fillStyle = p.type === 'smoke' ? '#555' : '#fff';
        A.circ(c, p.x, p.y, 6 + k * 14); c.fill();
      } else if (p.type === 'spark') {
        c.globalAlpha = 1 - k; c.fillStyle = '#fff3a0';
        A.star5(c, p.x, p.y, 7, 3, k * 4); c.fill();
      } else if (p.type === 'coin') {
        var e = k * k, px = p.sx + (110 - p.sx) * e, py = p.sy + (24 - p.sy) * e - Math.sin(k * Math.PI) * 60;
        c.globalAlpha = 1; c.fillStyle = '#ffd23f'; c.strokeStyle = '#b8860b'; c.lineWidth = 2;
        A.circ(c, px, py, 9); c.fill(); c.stroke();
      }
      c.globalAlpha = 1;
    });
    // floating text
    G.floats.forEach(function (f) {
      var k = f.t / 1.3;
      c.globalAlpha = Math.max(0, 1 - k * k);
      A.outlined(c, f.text, f.x, f.y - k * 46, f.size, f.color, '#3b2414');
      c.globalAlpha = 1;
    });
    // held item follows the finger / mouse
    if (h) {
      var hx = G.pointer.x, hy = G.pointer.y - 6;
      c.fillStyle = 'rgba(0,0,0,0.22)'; A.ell(c, hx + 6, hy + 30, 30, 9); c.fill();
      A.drawItem(c, h.kind, hx, hy, 1.08, h.base);
      var hint = hintFor(h.kind);
      if (hint) A.pill(c, hint, Math.min(W - 120, Math.max(120, hx)), Math.min(H - 16, hy + 52), 15, 'rgba(59,36,20,0.88)', '#fff6dc');
    }
  }

  // =====================================================================
  //  INPUT
  // =====================================================================
  function toLogical(e) {
    var r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }
  function onDown(e) {
    AU.unlock();
    if (G.mode !== 'play' || G.paused) return;
    e.preventDefault();
    var p = toLogical(e);
    G.pointer = p;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    if (G.held) {
      // tapping another tray while holding a tray item just swaps it
      var tr = trayAt(p.x, p.y);
      if (tr && G.held.from.type === 'tray' && tr.day <= G.day && tr.id !== G.held.from.id) {
        G.held = null;
      } else {
        dropAt(p.x, p.y);
        return;
      }
    }
    var src = pickAt(p.x, p.y);
    if (src) { src.down = { x: p.x, y: p.y }; src.pressed = true; src.dragging = false; G.held = src; }
  }
  function onMove(e) {
    var p = toLogical(e);
    G.pointer = p;
    var h = G.held;
    if (h && h.pressed && !h.dragging) {
      var dx = p.x - h.down.x, dy = p.y - h.down.y;
      if (dx * dx + dy * dy > 16 * 16) h.dragging = true;
    }
    if (G.mode === 'play' && e.pointerType === 'mouse') {
      canvas.style.cursor = h ? 'grabbing' : ((trayAt(p.x, p.y) || (slotAt(p.x, p.y) && slotAt(p.x, p.y).i >= 0)) ? 'pointer' : 'default');
    }
  }
  function onUp(e) {
    var h = G.held;
    if (!h || !h.pressed) return;
    var p = toLogical(e);
    G.pointer = p;
    h.pressed = false;
    if (h.dragging) dropAt(p.x, p.y);   // drag & drop; a plain tap keeps it in hand for tap-to-place
  }
  function onCancel() {
    if (G.held && G.held.pressed) cancelHeld();
  }

  // =====================================================================
  //  LOOP, RESIZE, PUBLIC API
  // =====================================================================
  var last = 0;
  function frame(now) {
    var dt = Math.min(0.05, ((now - last) / 1000) || 0);
    last = now;
    update(dt);
    render();
    MR.UI.hud(G, S, day());
    window.requestAnimationFrame(frame);
  }

  function resize() {
    var stage = document.getElementById('stage');
    var vw = window.innerWidth, vh = window.innerHeight;
    var w = Math.min(vw, vh * 16 / 9), hgt = w * 9 / 16;
    stage.style.width = Math.floor(w) + 'px';
    stage.style.height = Math.floor(hgt) + 'px';
    document.documentElement.style.setProperty('--u', (w / W).toFixed(4));
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(hgt * dpr));
    scale = canvas.width / W;
    buildCaches();
  }

  function init() {
    load();
    AU.setMuted(S.muted);
    buildLayout();
    layoutSlots();
    canvas = document.getElementById('cv');
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && G.mode === 'play' && !G.paused) MR.UI.pause();
    });
    MR.UI.init();
    window.requestAnimationFrame(function (n) { last = n; frame(n); });
  }

  return {
    init: init, G: G, S: S, save: save, resetSave: resetSave, dayUnlocked: dayUnlocked,
    prepareDay: prepareDay, beginDay: beginDay,
    setPaused: function (p) { if (G.mode === 'play') { G.paused = p; if (p) cancelHeld(); } },
    toMenu: function () { G.mode = 'menu'; G.paused = false; G.customers = []; G.spotTaken = []; G.held = null; G.floats = []; G.parts = []; AU.sizzle(0); },
    relayout: layoutSlots,
    // exposed for the automated smoke test
    _test: { pickAt: pickAt, dropAt: dropAt, update: update, ST: function () { return ST; }, TRAYS: function () { return TRAYS; }, TRASH: TRASH, spawnCustomer: spawnCustomer, fryState: fryState, golden: golden, render: render }
  };
})();
