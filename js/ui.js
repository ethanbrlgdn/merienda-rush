/* Merienda Rush! — menus, HUD and screens (HTML overlays on top of the canvas). */
var MR = window.MR = window.MR || {};

MR.RECIPES = {
  bananacue: [{ i: ['saba', 'sugar'], t: 'Sangkalan' }, { i: ['bcue_raw'], t: 'Kawali' }, { i: ['bcue_fried'], t: 'Stick' }, { i: ['bananacue'], t: 'Ihain!' }],
  turon:     [{ i: ['saba', 'langka', 'wrapper'], t: 'Sangkalan' }, { i: ['turon_raw'], t: 'Kawali' }, { i: ['turon_fried'], t: 'Karamelo' }, { i: ['turon'], t: 'Ihain!' }],
  maruya:    [{ i: ['saba', 'batter'], t: 'Sangkalan' }, { i: ['maruya_raw'], t: 'Kawali' }, { i: ['maruya_fried'], t: 'Asukal' }, { i: ['maruya'], t: 'Ihain!' }],
  kamotecue: [{ i: ['kamote', 'sugar'], t: 'Sangkalan' }, { i: ['kcue_raw'], t: 'Kawali' }, { i: ['kcue_fried'], t: 'Stick' }, { i: ['kamotecue'], t: 'Ihain!' }],
  fishball:  [{ i: ['fishball_raw'], t: 'Kawali' }, { i: ['fishball_fried'], t: 'Baso' }, { i: ['sauce_sweet', 'sauce_spicy', 'sauce_vinegar'], t: 'Sauce na gusto nila' }, { i: ['fishball_spicy'], t: 'Ihain!' }],
  kikiam:    [{ i: ['kikiam_raw'], t: 'Kawali' }, { i: ['kikiam_fried'], t: 'Baso' }, { i: ['sauce_sweet', 'sauce_spicy', 'sauce_vinegar'], t: 'Sauce na gusto nila' }, { i: ['kikiam_vinegar'], t: 'Ihain!' }],
  palamig:   [{ i: ['jug'], t: 'Baso ng Palamig' }, { i: ['sagogulaman'], t: "Sago't gulaman" }, { i: ['ice'], t: 'Yelo' }, { i: ['palamig'], t: 'Ihain!' }]
};

MR.UI = (function () {
  var Game, AU = MR.Audio;
  var SCREENS = ['scrTitle', 'scrHow', 'scrDays', 'scrIntro', 'scrPause', 'scrResults', 'scrShop'];
  var current = null, shopBack = 'scrTitle', howBack = 'scrTitle';
  var last = {};

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function peso(n) { return '₱' + Math.round(n); }

  // a little canvas icon of any food/ingredient
  function icon(kind, px) {
    var c = document.createElement('canvas');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = px * dpr; c.height = px * dpr;
    c.style.width = px + 'px'; c.style.height = px + 'px';
    c.className = 'ic';
    c.setAttribute('aria-hidden', 'true');
    var x = c.getContext('2d');
    if (x) { x.scale(dpr, dpr); MR.Art.drawItem(x, kind, px / 2, px / 2 + 2, px / 84); }
    return c;
  }

  function recipeStrip(food) {
    var wrap = el('div', 'recipe');
    MR.RECIPES[food].forEach(function (step, i) {
      if (i) wrap.appendChild(el('span', 'arrow', '→'));
      var s = el('div', 'step');
      var icons = el('div', 'icons');
      step.i.forEach(function (k) { icons.appendChild(icon(k, 46)); });
      s.appendChild(icons);
      s.appendChild(el('div', 'lbl', step.t));
      wrap.appendChild(s);
    });
    return wrap;
  }

  function show(id) {
    SCREENS.forEach(function (s) { $(s).hidden = s !== id; });
    current = id;
    var g = Game.G;
    $('hud').hidden = !(g.mode === 'play' || g.mode === 'ending' || id === 'scrPause');
    if (id) {
      var scr = $(id);
      var focusable = scr.querySelector('[data-autofocus]') || scr.querySelector('button');
      if (focusable) setTimeout(function () { try { focusable.focus({ preventScroll: true }); } catch (e) {} }, 30);
      scr.scrollTop = 0;
    }
  }

  function syncMute() {
    var m = AU.isMuted();
    ['btnMute', 'btnMuteTitle'].forEach(function (id) {
      var b = $(id); if (!b) return;
      b.setAttribute('aria-pressed', m ? 'true' : 'false');
      b.setAttribute('aria-label', m ? 'Unmute sound' : 'Mute sound');
      b.classList.toggle('muted', m);
    });
  }
  function toggleMute() {
    var S = Game.S;
    S.muted = !S.muted;
    AU.setMuted(S.muted);
    Game.save();
    syncMute();
    if (!S.muted) AU.click();
  }

  // ---------- title ----------
  function showTitle() {
    Game.toMenu();
    var S = Game.S, stars = 0;
    for (var k in S.days) stars += S.days[k].stars || 0;
    $('titleWallet').textContent = peso(S.wallet);
    $('titleStars').textContent = stars + ' / ' + MR.DAYS.length * 3;
    show('scrTitle');
  }

  // ---------- how to play ----------
  function buildHow() {
    var box = $('howRecipes');
    box.innerHTML = '';
    Object.keys(MR.RECIPES).forEach(function (f) {
      var card = el('div', 'rcard');
      var head = el('div', 'rhead');
      head.appendChild(icon(f === 'fishball' ? 'fishball_spicy' : f === 'kikiam' ? 'kikiam_vinegar' : f, 40));
      head.appendChild(el('strong', null, MR.FOODS[f].name));
      head.appendChild(el('span', 'tag', peso(MR.FOODS[f].price) + ' · Araw ' + MR.FOODS[f].day));
      card.appendChild(head);
      card.appendChild(recipeStrip(f));
      box.appendChild(card);
    });
  }
  function showHow(back) {
    howBack = back || 'scrTitle';
    if (!$('howRecipes').childNodes.length) buildHow();
    Game.S.seenHow = true; Game.save();
    show('scrHow');
  }

  // ---------- day select ----------
  function showDays() {
    Game.toMenu();
    var S = Game.S, grid = $('dayGrid');
    grid.innerHTML = '';
    $('daysWallet').textContent = peso(S.wallet);
    MR.DAYS.forEach(function (D, i) {
      var n = i + 1, open = Game.dayUnlocked(n), rec = S.days[n] || { stars: 0, best: 0 };
      var b = el('button', 'daycard' + (open ? '' : ' locked'));
      b.type = 'button';
      b.disabled = !open;
      var stars = '';
      for (var s = 0; s < 3; s++) stars += '<span class="st' + (s < rec.stars ? ' on' : '') + '">★</span>';
      b.innerHTML = '<span class="dnum">Araw ' + n + '</span>' +
        '<span class="dname">' + D.name + '</span>' +
        '<span class="dstars" aria-label="' + rec.stars + ' of 3 stars">' + stars + '</span>' +
        '<span class="dgoal">Goal ' + peso(D.goal) + (rec.best ? ' · Best ' + peso(rec.best) : '') + '</span>' +
        (open ? '' : '<span class="dlock">🔒 Tapusin ang Araw ' + (n - 1) + '</span>');
      var newFoods = Object.keys(MR.FOODS).filter(function (f) { return MR.FOODS[f].day === n; });
      if (newFoods.length && open) {
        var nf = el('span', 'dnew');
        nf.appendChild(el('span', null, 'Bago:'));
        newFoods.forEach(function (f) { nf.appendChild(icon(f === 'fishball' ? 'fishball_sweet' : f === 'kikiam' ? 'kikiam_spicy' : f, 30)); });
        b.appendChild(nf);
      }
      if (open) b.addEventListener('click', function () { AU.click(); showIntro(n); });
      grid.appendChild(b);
    });
    show('scrDays');
  }

  // ---------- day intro ----------
  function showIntro(n) {
    Game.prepareDay(n);
    var D = MR.DAYS[n - 1];
    $('introTitle').textContent = 'Araw ' + n + ': ' + D.name;
    $('introGoal').textContent = peso(D.goal);
    $('introTime').textContent = Math.floor(D.time / 60) + ':' + ('0' + D.time % 60).slice(-2);
    $('introStars').textContent = MR.STAR_STEPS.map(function (m) { return peso(D.goal * m); }).join(' / ');
    var box = $('introNew');
    box.innerHTML = '';
    var foods = Object.keys(MR.FOODS).filter(function (f) { return MR.FOODS[f].day === n; });
    if (!foods.length) {
      box.appendChild(el('p', 'muted', 'Walang bagong pagkain ngayon — mas maraming customer at mas mahirap na order!'));
    } else {
      box.appendChild(el('h3', null, n === 1 ? 'Ang menu mo:' : 'Bagong pagkain!'));
      foods.forEach(function (f) {
        var card = el('div', 'rcard');
        var head = el('div', 'rhead');
        head.appendChild(el('strong', null, MR.FOODS[f].name));
        head.appendChild(el('span', 'tag', peso(MR.FOODS[f].price)));
        card.appendChild(head);
        card.appendChild(recipeStrip(f));
        box.appendChild(card);
      });
    }
    show('scrIntro');
  }

  // ---------- pause ----------
  function pause() {
    if (Game.G.mode !== 'play' || Game.G.paused) return;
    Game.setPaused(true);
    AU.sizzle(0);
    show('scrPause');
  }
  function resume() {
    Game.setPaused(false);
    show(null);
  }

  // ---------- results ----------
  function results(r) {
    var D = MR.DAYS[r.day - 1];
    $('resTitle').textContent = r.failed ? 'Sarado na ang tindahan!' : (r.stars ? 'Tapos ang Araw ' + r.day + '!' : 'Kulang pa sa goal...');
    $('resSub').textContent = r.failed ? 'Umalis ang 3 galit na customer. Subukan ulit!' : (r.stars ? D.name + ' — ang galing mo!' : 'Abutin ang ' + peso(r.goal) + ' para pumasa.');
    var stars = $('resStars').children;
    for (var i = 0; i < 3; i++) stars[i].classList.remove('on');
    $('resStars').setAttribute('aria-label', r.stars + ' of 3 stars');
    for (i = 0; i < r.stars; i++) {
      (function (k) {
        setTimeout(function () { stars[k].classList.add('on'); AU.star(k); }, 400 + k * 380);
      })(i);
    }
    $('resCoins').textContent = peso(r.coins);
    $('resTips').textContent = peso(r.tips);
    $('resServed').textContent = r.served;
    $('resLost').textContent = r.lost;
    $('resBurnt').textContent = r.burnt;
    $('resBest').textContent = peso(r.best) + (r.newBest ? '  — Bagong record!' : '');
    $('resWallet').textContent = peso(Game.S.wallet);
    var next = r.day < MR.DAYS.length && Game.dayUnlocked(r.day + 1);
    $('btnNext').hidden = !next;
    $('btnNext').onclick = function () { AU.click(); showIntro(r.day + 1); };
    $('btnRetry').onclick = function () { AU.click(); showIntro(r.day); };
    $('btnResShop').onclick = function () { AU.click(); showShop('scrResults'); };
    $('resAllDone').hidden = !(r.day === MR.DAYS.length && r.stars > 0);
    show('scrResults');
  }

  // ---------- shop ----------
  function showShop(back) {
    shopBack = back || 'scrTitle';
    var S = Game.S, list = $('shopList');
    $('shopWallet').textContent = peso(S.wallet);
    list.innerHTML = '';
    MR.UPGRADES.forEach(function (u) {
      var lvl = S.up[u.id] || 0, max = u.costs.length, maxed = lvl >= max, cost = maxed ? 0 : u.costs[lvl];
      var card = el('div', 'ucard' + (maxed ? ' maxed' : ''));
      var pips = '';
      for (var i = 0; i < max; i++) pips += '<span class="pip' + (i < lvl ? ' on' : '') + '"></span>';
      card.innerHTML = '<div class="uinfo"><strong>' + u.name + '</strong><span>' + u.desc + '</span>' +
        '<span class="pips" aria-label="Level ' + lvl + ' of ' + max + '">' + pips + '</span></div>';
      var b = el('button', 'btn ' + (maxed ? 'ghost' : 'buy'));
      b.type = 'button';
      if (maxed) { b.textContent = u.deco ? 'Nakalagay na' : 'MAX'; b.disabled = true; }
      else {
        b.textContent = 'Bilhin ' + peso(cost);
        b.disabled = S.wallet < cost;
        b.setAttribute('aria-label', 'Buy ' + u.name + ' for ' + cost + ' pesos');
        b.addEventListener('click', function () {
          if (S.wallet < cost) return;
          S.wallet -= cost;
          S.up[u.id] = lvl + 1;
          Game.save();
          AU.buy();
          if (u.id === 'slots' && Game.G.mode !== 'play') Game.relayout();
          showShop(shopBack);
          var again = $('shopList').children[MR.UPGRADES.indexOf(u)];
          if (again) { var bb = again.querySelector('button'); if (bb && !bb.disabled) bb.focus(); }
        });
      }
      card.appendChild(b);
      list.appendChild(card);
    });
    show('scrShop');
  }

  // ---------- HUD (updated every frame, only touches the DOM when values change) ----------
  function setText(id, v) { if (last[id] !== v) { last[id] = v; $(id).textContent = v; } }
  function hud(G, S, D) {
    if (G.mode !== 'play' && G.mode !== 'ending') return;
    setText('hudCoins', String(Math.round(G.coins)));
    var tl = Math.max(0, Math.ceil(G.timeLeft));
    setText('hudTime', Math.floor(tl / 60) + ':' + ('0' + tl % 60).slice(-2));
    if (last.low !== (tl <= 10)) { last.low = tl <= 10; $('hudTimeBox').classList.toggle('low', tl <= 10); }
    var hearts = '';
    for (var i = 0; i < MR.HEARTS; i++) hearts += i < G.hearts ? '♥' : '♡';
    setText('hudHearts', hearts);
    if (last.heartsN !== G.hearts) { last.heartsN = G.hearts; $('hudHearts').setAttribute('aria-label', G.hearts + ' hearts left'); }
    setText('hudDay', 'Araw ' + G.day);
    setText('hudGoal', 'Goal ' + peso(D.goal));
    var top = D.goal * MR.STAR_STEPS[2];
    var pct = Math.min(100, G.coins / top * 100).toFixed(1);
    if (last.pct !== pct) { last.pct = pct; $('hudFill').style.width = pct + '%'; }
    var earned = 0;
    MR.STAR_STEPS.forEach(function (m) { if (G.coins >= D.goal * m) earned++; });
    if (last.earned !== earned) {
      last.earned = earned;
      var mk = $('hudBar').querySelectorAll('.mk');
      for (i = 0; i < mk.length; i++) mk[i].classList.toggle('on', i < earned);
    }
  }

  function placeMarkers() {
    var mk = $('hudBar').querySelectorAll('.mk');
    for (var i = 0; i < mk.length; i++) mk[i].style.left = (MR.STAR_STEPS[i] / MR.STAR_STEPS[2] * 100) + '%';
  }

  function init() {
    Game = MR.Game;
    placeMarkers();
    syncMute();
    function on(id, fn) { $(id).addEventListener('click', function (e) { AU.unlock(); AU.click(); fn(e); }); }
    on('btnPlay', function () { if (!Game.S.seenHow) showHow('scrDays'); else showDays(); });
    on('btnHow', function () { showHow('scrTitle'); });
    on('btnShop', function () { showShop('scrTitle'); });
    on('btnHowBack', function () {
      if (howBack === 'scrPause') show('scrPause');
      else if (howBack === 'scrDays') showDays();
      else showTitle();
    });
    on('btnDaysBack', showTitle);
    on('btnDaysShop', function () { showShop('scrDays'); });
    on('btnDaysHow', function () { showHow('scrDays'); });
    on('btnIntroBack', showDays);
    on('btnStart', function () { show(null); Game.beginDay(); });
    on('btnResume', resume);
    on('btnRestart', function () { var n = Game.G.day; Game.setPaused(false); Game.toMenu(); showIntro(n); });
    on('btnQuit', function () { showDays(); });
    on('btnPauseHow', function () { showHow('scrPause'); });
    on('btnResDays', showDays);
    on('btnShopBack', function () {
      if (shopBack === 'scrDays') showDays();
      else if (shopBack === 'scrResults') show('scrResults');
      else showTitle();
    });
    on('btnReset', function () {
      if (window.confirm('Burahin ang lahat ng progress, coins at upgrades?')) { Game.resetSave(); Game.relayout(); showTitle(); }
    });
    $('btnPause').addEventListener('click', function () { AU.click(); pause(); });
    $('btnMute').addEventListener('click', toggleMute);
    $('btnMuteTitle').addEventListener('click', toggleMute);

    document.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k === 'p' || k === 'P' || k === 'Escape') {
        if (Game.G.mode === 'play') { e.preventDefault(); if (Game.G.paused) resume(); else pause(); return; }
        if (k === 'Escape') {
          if (current === 'scrHow') $('btnHowBack').click();
          else if (current === 'scrDays') showTitle();
          else if (current === 'scrShop') $('btnShopBack').click();
          else if (current === 'scrIntro') showDays();
        }
      }
      if ((k === 'm' || k === 'M') && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) toggleMute();
    });
    showTitle();
  }

  return { init: init, hud: hud, results: results, pause: pause, show: show, icon: icon };
})();
