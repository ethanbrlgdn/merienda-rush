/* Merienda Rush! — everything is drawn in code on the canvas (no image files). */
var MR = window.MR = window.MR || {};

MR.Art = (function () {
  var W = MR.W, PI = Math.PI, TAU = PI * 2;
  var FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  var INK = '#3b2414';

  // ---------- helpers ----------
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); }
  function ell(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
  function hex(h) { h = h.replace('#', ''); return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function mix(a, b, t) {
    var A = hex(a), B = hex(b);
    t = Math.max(0, Math.min(1, t));
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  function fillStroke(c, fill, stroke, lw) {
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2.5; c.stroke(); }
  }
  function text(c, s, x, y, size, color, align, maxW, weight) {
    var sz = size;
    c.font = (weight || 'bold') + ' ' + sz + 'px ' + FONT;
    if (maxW) {
      while (sz > 9 && c.measureText(s).width > maxW) { sz -= 1; c.font = (weight || 'bold') + ' ' + sz + 'px ' + FONT; }
    }
    c.textAlign = align || 'center';
    c.textBaseline = 'middle';
    c.fillStyle = color || INK;
    c.fillText(s, x, y);
  }
  function outlined(c, s, x, y, size, color, line, maxW) {
    c.font = 'bold ' + size + 'px ' + FONT;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = Math.max(3, size / 5);
    c.strokeStyle = line || INK;
    c.strokeText(s, x, y, maxW);
    c.fillStyle = color;
    c.fillText(s, x, y, maxW);
  }
  function pill(c, s, x, y, size, bg, fg, maxW) {
    c.font = 'bold ' + size + 'px ' + FONT;
    var w = Math.min(maxW || 999, c.measureText(s).width) + size * 1.2, h = size * 1.7;
    rr(c, x - w / 2, y - h / 2, w, h, h / 2);
    c.fillStyle = bg; c.fill();
    text(c, s, x, y + 1, size, fg, 'center', maxW);
  }

  // =====================================================================
  //  FOOD & INGREDIENTS
  // =====================================================================
  // fryable shapes: raw colour -> golden colour; burnt is dark
  var FRYC = {
    turon:    ['#f4e6c8', '#d98e2b'],
    maruya:   ['#f3df9f', '#d9952f'],
    bcue:     ['#f3d55e', '#b8641f'],
    kcue:     ['#eaa45c', '#b5561f'],
    fishball: ['#efe8da', '#d6a04a'],
    kikiam:   ['#d7a888', '#8e4f2b']
  };

  // draws the outline path(s) for a fried shape; fn is called after each piece
  function fryShape(c, base, each) {
    var i;
    switch (base) {
      case 'turon':
        c.save(); c.rotate(-0.22); rr(c, -34, -12, 68, 24, 11); each(); c.restore(); break;
      case 'maruya':
        for (i = -1; i <= 1; i++) { ell(c, i * 13, -6, 9, 21, i * 0.35); each(); }
        ell(c, 0, 10, 25, 12, 0); each(); break;
      case 'bcue':
        ell(c, 0, -13, 25, 11, -0.12); each();
        ell(c, 0, 12, 25, 11, 0.12); each(); break;
      case 'kcue':
        for (i = -1; i <= 1; i++) { rr(c, -17 + (i === 0 ? 3 : 0), i * 19 - 9, 34, 18, 7); each(); }
        break;
      case 'fishball':
        [[-13, 7], [13, 7], [0, -10]].forEach(function (p) { circ(c, p[0], p[1], 11); each(); }); break;
      case 'kikiam':
        [[-15, 6, -0.5], [2, -6, 0.15], [16, 8, 0.6]].forEach(function (p) {
          c.save(); c.translate(p[0], p[1]); c.rotate(p[2]); rr(c, -7, -15, 14, 30, 7); each(); c.restore();
        }); break;
    }
  }

  function drawFry(c, base, done, burnt, x, y, s, opt) {
    opt = opt || {};
    var cols = FRYC[base] || FRYC.turon;
    var col = burnt ? '#2e1d12' : mix(cols[0], cols[1], done);
    c.save(); c.translate(x, y); c.scale(s, s);
    if (opt.stick) {
      c.strokeStyle = '#caa06a'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, -38); c.lineTo(0, 40); c.stroke();
    }
    fryShape(c, base, function () {
      c.fillStyle = col; c.fill();
      if (opt.glaze) { c.fillStyle = 'rgba(176,82,10,0.45)'; c.fill(); }
      c.strokeStyle = burnt ? '#120a05' : 'rgba(90,48,18,0.6)'; c.lineWidth = 2.5; c.stroke();
    });
    // details
    if (!burnt && base === 'turon') {
      c.save(); c.rotate(-0.22); c.strokeStyle = 'rgba(120,70,20,0.35)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-12, -11); c.lineTo(-4, 11); c.moveTo(8, -11); c.lineTo(16, 11); c.stroke(); c.restore();
    }
    if (!burnt && opt.glaze) {
      c.strokeStyle = 'rgba(255,255,230,0.75)'; c.lineWidth = 2.5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-18, -8); c.quadraticCurveTo(-4, -14, 12, -12); c.stroke();
    }
    if (!burnt && (opt.sugar || opt.brown)) {
      c.fillStyle = opt.sugar ? '#ffffff' : '#7a3f12';
      for (var i = 0; i < 16; i++) {
        var a = i * 2.39, r = 4 + (i * 7) % 20;
        c.fillRect(Math.cos(a) * r - 1.2, Math.sin(a) * r * 0.7 - 1.2, 2.6, 2.6);
      }
    }
    if (burnt) {
      c.fillStyle = 'rgba(255,90,20,0.5)';
      c.fillRect(-6, -2, 3, 3); c.fillRect(8, 5, 3, 3);
    }
    if (opt.stick) {
      c.strokeStyle = '#caa06a'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, -38); c.lineTo(0, -28); c.stroke();
    }
    c.restore();
  }

  function banana(c, peel, edge, rot, dx, dy) {
    c.save(); c.translate(dx || 0, dy || 0); c.rotate(rot || 0);
    c.beginPath();
    c.moveTo(-29, 0);
    c.quadraticCurveTo(0, -27, 29, 0);
    c.quadraticCurveTo(31, 6, 26, 7);
    c.quadraticCurveTo(0, -5, -26, 7);
    c.quadraticCurveTo(-31, 6, -29, 0);
    c.closePath();
    fillStroke(c, peel, edge, 2.5);
    c.fillStyle = '#4a3018';
    circ(c, -28, 2, 2.6); c.fill(); circ(c, 28, 2, 2.6); c.fill();
    c.restore();
  }

  function bowl(c, body, rim, top, bottom) {
    c.beginPath();
    c.moveTo(-32, -4);
    c.quadraticCurveTo(-30, 24, 0, 24);
    c.quadraticCurveTo(30, 24, 32, -4);
    c.closePath();
    fillStroke(c, body, bottom, 2.5);
    ell(c, 0, -4, 32, 9);
    fillStroke(c, top, rim, 2.5);
  }

  function paperCup(c) {
    c.beginPath();
    c.moveTo(-23, -10); c.lineTo(23, -10); c.lineTo(17, 28); c.lineTo(-17, 28); c.closePath();
    fillStroke(c, '#fffaf0', '#bfb293', 2.5);
    c.fillStyle = '#e04a3a';
    c.beginPath(); c.moveTo(-21, 2); c.lineTo(21, 2); c.lineTo(20, 9); c.lineTo(-20, 9); c.closePath(); c.fill();
  }
  var SAUCE_COL = { sweet: '#8a4416', spicy: '#d8301f', vinegar: 'rgba(240,235,200,0.85)' };

  function cupFood(c, base, sauce) {
    // food peeking over the cup
    var col = FRYC[base][1];
    c.save();
    if (base === 'fishball') {
      [[-10, -14], [10, -14], [0, -22]].forEach(function (p) { circ(c, p[0], p[1], 9); fillStroke(c, col, 'rgba(90,48,18,0.6)', 2); });
    } else {
      [[-9, -16, -0.4], [9, -16, 0.4], [0, -22, 0]].forEach(function (p) {
        c.save(); c.translate(p[0], p[1]); c.rotate(p[2]); rr(c, -5, -11, 10, 22, 5); fillStroke(c, col, 'rgba(70,35,12,0.6)', 2); c.restore();
      });
    }
    c.restore();
    paperCup(c);
    if (sauce) {
      c.fillStyle = SAUCE_COL[sauce];
      c.beginPath();
      c.moveTo(-18, -12); c.quadraticCurveTo(-8, -24, 2, -14); c.quadraticCurveTo(10, -26, 19, -12);
      c.quadraticCurveTo(16, 0, 12, -4); c.quadraticCurveTo(4, -8, -6, -4); c.quadraticCurveTo(-14, 2, -18, -12);
      c.fill();
      if (sauce === 'spicy') { c.fillStyle = '#8f0f0a'; c.fillRect(-6, -16, 4, 3); c.fillRect(8, -14, 4, 3); }
      if (sauce === 'vinegar') { c.fillStyle = '#ffffff'; c.fillRect(-8, -14, 4, 4); c.fillStyle = '#3c9a3c'; c.fillRect(6, -16, 3, 3); c.fillStyle = '#d8301f'; c.fillRect(0, -10, 3, 3); }
    }
  }

  function plasticCup(c, level, sago, ice, straw) {
    if (straw) {
      c.save(); c.strokeStyle = '#e63946'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(6, 10); c.lineTo(14, -40); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.setLineDash([4, 4]);
      c.beginPath(); c.moveTo(6, 10); c.lineTo(14, -40); c.stroke(); c.setLineDash([]); c.restore();
    }
    // liquid
    if (level) {
      c.save();
      c.beginPath(); c.moveTo(-20, -28); c.lineTo(20, -28); c.lineTo(15, 28); c.lineTo(-15, 28); c.closePath(); c.clip();
      c.fillStyle = '#9a3a1c'; c.fillRect(-25, -14, 50, 50);
      c.fillStyle = 'rgba(255,190,120,0.25)'; c.fillRect(-25, -14, 50, 5);
      if (sago) {
        c.fillStyle = 'rgba(245,245,235,0.9)';
        [[-8, 18], [0, 22], [8, 17], [-4, 10], [6, 8], [-10, 4]].forEach(function (p) { circ(c, p[0], p[1], 3.4); c.fill(); });
        c.fillStyle = '#3fae49'; c.fillRect(-12, 12, 7, 7); c.fillRect(4, 1, 7, 7);
        c.fillStyle = '#e0504a'; c.fillRect(-2, 14, 7, 7);
      }
      if (ice) {
        c.fillStyle = 'rgba(225,245,255,0.85)'; c.strokeStyle = 'rgba(140,190,220,0.9)'; c.lineWidth = 1.5;
        [[-14, -16, 0.3], [-1, -19, -0.2], [9, -14, 0.5]].forEach(function (p) {
          c.save(); c.translate(p[0], p[1]); c.rotate(p[2]); c.fillRect(-6, -6, 12, 12); c.strokeRect(-6, -6, 12, 12); c.restore();
        });
      }
      c.restore();
    }
    c.beginPath(); c.moveTo(-21, -29); c.lineTo(21, -29); c.lineTo(15, 29); c.lineTo(-15, 29); c.closePath();
    c.fillStyle = 'rgba(225,242,255,0.35)'; c.fill();
    c.strokeStyle = '#8fb0c6'; c.lineWidth = 2.5; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-14, -22); c.lineTo(-10, 20); c.stroke();
  }

  function bottle(c, liquid, sauce) {
    rr(c, -15, -12, 30, 40, 7); fillStroke(c, liquid, '#4a3020', 2.5);
    rr(c, -6, -30, 12, 20, 3); fillStroke(c, liquid, '#4a3020', 2.5);
    rr(c, -8, -36, 16, 8, 2); fillStroke(c, '#f4f4f4', '#4a3020', 2);
    rr(c, -12, 0, 24, 14, 3); fillStroke(c, '#fff8e8', null);
    if (sauce === 'spicy') { c.fillStyle = '#d8301f'; ell(c, 0, 7, 7, 3, 0.4); c.fill(); }
    if (sauce === 'sweet') { c.fillStyle = '#8a4416'; circ(c, 0, 7, 4); c.fill(); }
    if (sauce === 'vinegar') { c.fillStyle = '#3c9a3c'; c.fillRect(-5, 5, 4, 4); c.fillStyle = '#d8301f'; c.fillRect(2, 5, 4, 4); }
  }

  // draws any item kind centred at x,y; s = scale (1 ~ 70px wide)
  function drawItem(c, kind, x, y, s, base) {
    s = s || 1;
    var fry = MR.FRY[kind];
    if (fry) { drawFry(c, fry.base, 0, false, x, y, s, { brown: kind === 'bcue_raw' || kind === 'kcue_raw' }); return; }
    if (/_fried$/.test(kind)) { drawFry(c, kind.replace('_fried', ''), 1, false, x, y, s); return; }
    switch (kind) {
      case 'turon': drawFry(c, 'turon', 1, false, x, y, s, { glaze: true }); return;
      case 'maruya': drawFry(c, 'maruya', 1, false, x, y, s, { sugar: true }); return;
      case 'bananacue': drawFry(c, 'bcue', 1, false, x, y, s, { glaze: true, stick: true }); return;
      case 'kamotecue': drawFry(c, 'kcue', 1, false, x, y, s, { glaze: true, stick: true }); return;
      case 'burnt': drawFry(c, base || 'turon', 1, true, x, y, s); return;
    }
    c.save(); c.translate(x, y); c.scale(s, s);
    var m;
    if ((m = /^(fishball|kikiam)_(cup|sweet|spicy|vinegar)$/.exec(kind))) {
      cupFood(c, m[1], m[2] === 'cup' ? null : m[2]);
      c.restore(); return;
    }
    switch (kind) {
      case 'saba':
        banana(c, '#f4d34a', '#9a7a1c', -0.15, 0, -6);
        banana(c, '#e8cf47', '#9a7a1c', 0.1, 2, 10);
        break;
      case 'saba_langka':
        banana(c, '#f6e7b0', '#bba05a', 0, 0, 2);
        c.save(); c.rotate(0.15); rr(c, -22, -10, 44, 10, 5); fillStroke(c, '#ffb92e', '#c98a12', 2); c.restore();
        break;
      case 'langka':
        [[-16, 4, -0.5], [0, -4, 0], [16, 4, 0.5]].forEach(function (p) {
          c.save(); c.translate(p[0], p[1]); c.rotate(p[2]);
          ell(c, 0, 0, 9, 20); fillStroke(c, '#ffbf3b', '#c98a12', 2.5);
          c.strokeStyle = 'rgba(255,240,180,0.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-3, -12); c.lineTo(-3, 10); c.stroke();
          c.restore();
        });
        break;
      case 'wrapper':
        for (var i = 2; i >= 0; i--) {
          c.save(); c.translate(i * 3, i * 3); c.rotate(PI / 4 + i * 0.05);
          rr(c, -20, -20, 40, 40, 3); fillStroke(c, '#f8eed8', '#cdb68a', 2); c.restore();
        }
        break;
      case 'batter':
        bowl(c, '#5fa3c7', '#3f7fa3', '#f6e6b0', '#3f7fa3');
        c.fillStyle = 'rgba(255,255,255,0.6)'; ell(c, -8, -6, 10, 3); c.fill();
        break;
      case 'sugar':
        bowl(c, '#c96b3c', '#8c4220', '#a8642a', '#8c4220');
        c.fillStyle = '#7a3f12';
        for (i = 0; i < 12; i++) c.fillRect(-20 + (i * 13) % 40, -8 + (i * 5) % 7, 3, 3);
        break;
      case 'kamote':
        c.rotate(-0.2);
        ell(c, 0, 0, 31, 15); fillStroke(c, '#a2425a', '#6d2537', 2.5);
        c.strokeStyle = '#6d2537'; c.lineWidth = 2; c.beginPath(); c.moveTo(30, 0); c.lineTo(38, 3); c.moveTo(-30, 0); c.lineTo(-37, -2); c.stroke();
        c.fillStyle = 'rgba(255,200,210,0.45)'; circ(c, -8, -4, 3); c.fill(); circ(c, 10, 3, 2.5); c.fill();
        break;
      case 'jug':
        rr(c, -22, -26, 44, 54, 9); fillStroke(c, 'rgba(225,242,255,0.6)', '#7f9fb5', 2.5);
        c.save(); rr(c, -22, -26, 44, 54, 9); c.clip(); c.fillStyle = '#9a3a1c'; c.fillRect(-24, -8, 48, 40); c.restore();
        c.strokeStyle = '#7f9fb5'; c.lineWidth = 5; c.beginPath(); c.arc(24, 0, 12, -PI / 2, PI / 2); c.stroke();
        rr(c, -24, -32, 48, 8, 3); fillStroke(c, '#f2b134', '#9a6a10', 2);
        break;
      case 'sagogulaman':
        bowl(c, '#e6d5f0', '#a48bb7', '#f7f2e4', '#a48bb7');
        c.fillStyle = '#3fae49'; c.fillRect(-18, -12, 9, 9); c.fillRect(8, -11, 9, 9);
        c.fillStyle = '#e0504a'; c.fillRect(-4, -14, 9, 9);
        c.fillStyle = 'rgba(255,255,250,0.95)'; c.strokeStyle = '#c9c2a8'; c.lineWidth = 1;
        [[-22, -4], [-12, -2], [0, -4], [12, -2], [22, -5], [-6, -9], [18, -9]].forEach(function (p) { circ(c, p[0], p[1], 3.5); c.fill(); c.stroke(); });
        break;
      case 'ice':
        c.beginPath(); c.moveTo(-28, -10); c.lineTo(28, -10); c.lineTo(22, 26); c.lineTo(-22, 26); c.closePath();
        fillStroke(c, '#a9b7c2', '#66737d', 2.5);
        c.strokeStyle = '#66737d'; c.lineWidth = 2; c.beginPath(); c.moveTo(-24, 4); c.lineTo(24, 4); c.stroke();
        c.fillStyle = '#e3f6ff'; c.strokeStyle = '#8fc7e0'; c.lineWidth = 2;
        [[-14, -14, 0.2], [2, -18, -0.3], [16, -13, 0.4]].forEach(function (p) {
          c.save(); c.translate(p[0], p[1]); c.rotate(p[2]); rr(c, -8, -8, 16, 16, 3); c.fill(); c.stroke(); c.restore();
        });
        break;
      case 'sauce_sweet': bottle(c, '#8a4416', 'sweet'); break;
      case 'sauce_spicy': bottle(c, '#d8301f', 'spicy'); break;
      case 'sauce_vinegar': bottle(c, 'rgba(236,240,214,0.95)', 'vinegar'); break;
      case 'drink1': plasticCup(c, 1, false, false, false); break;
      case 'drink2': plasticCup(c, 1, true, false, false); break;
      case 'palamig': plasticCup(c, 1, true, true, true); break;
      default:
        circ(c, 0, 0, 16); fillStroke(c, '#ccc', '#888');
    }
    c.restore();
  }

  // =====================================================================
  //  BACKGROUND (static parts are painted once into a cache)
  // =====================================================================
  var BUILDINGS = [
    { x: -10, w: 226, h: 150, col: '#efdcb0', roof: '#b5452e', sign: 'SARI-SARI STORE', sc: '#d83a2e', st: '#fff', kind: 'store' },
    { x: 216, w: 196, h: 178, col: '#a6d49f', roof: '#6b7b8c', sign: 'LOAD DITO', sc: '#ffe04d', st: '#c0392b', kind: 'house' },
    { x: 412, w: 218, h: 140, col: '#93c8ea', roof: '#4d6a87', sign: 'BARBERSHOP', sc: '#1f5fa8', st: '#fff', kind: 'shop' },
    { x: 630, w: 240, h: 162, col: '#f3b36b', roof: '#8b3a1f', sign: 'TINDAHAN NI ALING ROSA', sc: '#fff3c2', st: '#a0331f', kind: 'store' },
    { x: 870, w: 200, h: 132, col: '#dca7cc', roof: '#5b4a6b', sign: 'VULCANIZING', sc: '#333', st: '#ffd84a', kind: 'shop' },
    { x: 1070, w: 222, h: 172, col: '#ece3d1', roof: '#a8472b', sign: 'KARINDERYA', sc: '#e8742a', st: '#fff', kind: 'house' }
  ];
  var GROUND = 214;

  function coconut(c, x, h, lean) {
    c.strokeStyle = '#7a5a3a'; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, GROUND); c.quadraticCurveTo(x + lean * 0.3, GROUND - h * 0.6, x + lean, GROUND - h); c.stroke();
    var tx = x + lean, ty = GROUND - h;
    c.strokeStyle = '#3f8f3a'; c.lineWidth = 7;
    for (var i = 0; i < 7; i++) {
      var a = -PI + i * (PI / 6);
      c.beginPath(); c.moveTo(tx, ty);
      c.quadraticCurveTo(tx + Math.cos(a) * 40, ty + Math.sin(a) * 30 - 10, tx + Math.cos(a) * 62, ty + Math.sin(a) * 26 + 22);
      c.stroke();
    }
    c.fillStyle = '#6b4a22'; circ(c, tx - 5, ty + 6, 6); c.fill(); circ(c, tx + 6, ty + 7, 6); c.fill();
  }

  function building(c, b) {
    var top = GROUND - b.h;
    c.fillStyle = b.col; c.fillRect(b.x, top, b.w, b.h);
    c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(b.x + b.w - 10, top, 10, b.h);
    // corrugated roof
    c.fillStyle = b.roof; c.fillRect(b.x - 8, top - 14, b.w + 16, 16);
    c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 2;
    for (var rx = b.x - 4; rx < b.x + b.w + 8; rx += 9) { c.beginPath(); c.moveTo(rx, top - 14); c.lineTo(rx, top + 2); c.stroke(); }
    // sign board
    var sw = b.w - 34, sx = b.x + 17, sy = top + 12;
    rr(c, sx, sy, sw, 30, 4); fillStroke(c, b.sc, 'rgba(0,0,0,0.35)', 2);
    text(c, b.sign, sx + sw / 2, sy + 16, 17, b.st, 'center', sw - 12);
    // windows / store front
    if (b.kind === 'store') {
      var wx = b.x + 24, wy = top + 56, ww = b.w - 48, wh = GROUND - wy - 18;
      c.fillStyle = '#4a3326'; c.fillRect(wx, wy, ww, wh);
      // goods on shelves
      var cols = ['#e63946', '#ffd23f', '#3fae49', '#4d9de0', '#ff8c42', '#ffffff'];
      for (var sy2 = wy + 10; sy2 < wy + wh - 6; sy2 += 22) {
        c.fillStyle = '#7a5640'; c.fillRect(wx + 4, sy2 + 14, ww - 8, 3);
        for (var gx = wx + 10, k = 0; gx < wx + ww - 10; gx += 13, k++) {
          c.fillStyle = cols[(k + sy2) % cols.length]; c.fillRect(gx, sy2 + 2, 8, 12);
        }
      }
      // grille
      c.strokeStyle = 'rgba(40,40,40,0.75)'; c.lineWidth = 2;
      for (gx = wx + 8; gx < wx + ww; gx += 14) { c.beginPath(); c.moveTo(gx, wy); c.lineTo(gx, wy + wh); c.stroke(); }
      c.fillStyle = '#c4a27a'; c.fillRect(wx - 6, wy + wh, ww + 12, 8);
    } else {
      for (var row = 0; row < 2; row++) {
        for (var col = 0; col < 3; col++) {
          var wx2 = b.x + 22 + col * ((b.w - 44) / 3), wy2 = top + 58 + row * 52;
          if (wy2 + 34 > GROUND - 6) continue;
          var w2 = (b.w - 44) / 3 - 14;
          c.fillStyle = '#5c7891'; c.fillRect(wx2, wy2, w2, 34);
          c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2;
          for (var j = 6; j < 34; j += 7) { c.beginPath(); c.moveTo(wx2 + 2, wy2 + j); c.lineTo(wx2 + w2 - 2, wy2 + j); c.stroke(); }
          c.strokeStyle = 'rgba(0,0,0,0.3)'; c.strokeRect(wx2, wy2, w2, 34);
        }
      }
    }
  }

  function paintTop(c) {
    var g = c.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, '#ff9a5c'); g.addColorStop(0.5, '#ffc67a'); g.addColorStop(1, '#ffe2a6');
    c.fillStyle = g; c.fillRect(0, 0, W, 272);
    // sun
    var sg = c.createRadialGradient(960, 92, 10, 960, 92, 120);
    sg.addColorStop(0, 'rgba(255,250,215,1)'); sg.addColorStop(0.3, 'rgba(255,236,170,0.8)'); sg.addColorStop(1, 'rgba(255,220,150,0)');
    c.fillStyle = sg; c.fillRect(820, -40, 280, 260);
    // clouds
    c.fillStyle = 'rgba(255,255,255,0.75)';
    [[180, 70], [560, 52], [1180, 66]].forEach(function (p) {
      ell(c, p[0], p[1], 46, 16); c.fill(); ell(c, p[0] + 34, p[1] - 8, 30, 16); c.fill(); ell(c, p[0] - 30, p[1] + 2, 26, 12); c.fill();
    });
    coconut(c, 405, 190, 18);
    coconut(c, 1060, 200, -22);
    BUILDINGS.forEach(function (b) { building(c, b); });
    // poles + tangled wires
    [[418, 40], [1066, 34]].forEach(function (p) {
      c.fillStyle = '#9a9a9a'; c.fillRect(p[0] - 5, p[1], 10, GROUND - p[1]);
      c.fillStyle = '#7a7a7a'; c.fillRect(p[0] - 30, p[1] + 10, 60, 6);
    });
    c.strokeStyle = 'rgba(30,30,30,0.7)'; c.lineWidth = 1.5;
    [[-10, 60, 418, 52, 30], [418, 52, 1066, 46, 46], [418, 56, 1066, 48, 60], [1066, 46, 1300, 60, 24], [418, 50, 700, 90, 10], [-10, 70, 418, 56, 44]].forEach(function (w) {
      c.beginPath(); c.moveTo(w[0], w[1]); c.quadraticCurveTo((w[0] + w[2]) / 2, Math.max(w[1], w[3]) + w[4], w[2], w[3]); c.stroke();
    });
    // road + sidewalk
    c.fillStyle = '#56565e'; c.fillRect(0, GROUND, W, 44);
    c.fillStyle = '#f2f2f2';
    for (var x = 10; x < W; x += 80) c.fillRect(x, GROUND + 21, 44, 4);
    c.fillStyle = '#cdbca2'; c.fillRect(0, GROUND + 44, W, 20);
    c.fillStyle = '#a99a82'; c.fillRect(0, GROUND + 44, W, 4);
    // bamboo posts framing our stall
    [[0, 16], [W - 16, 16]].forEach(function (p) {
      c.fillStyle = '#c9a25a'; c.fillRect(p[0], 0, p[1], 272);
      c.fillStyle = '#8f6f32';
      for (var y = 40; y < 272; y += 60) c.fillRect(p[0], y, p[1], 5);
    });
  }

  // ledge (serving counter edge) + the wooden work counter
  function paintCounter(c) {
    var y0 = 272;
    var g = c.createLinearGradient(0, y0, 0, 330);
    g.addColorStop(0, '#f0bf82'); g.addColorStop(1, '#d99b5a');
    c.fillStyle = g; c.fillRect(0, y0, W, 58);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, y0, W, 4);
    c.strokeStyle = 'rgba(120,70,30,0.35)'; c.lineWidth = 2;
    for (var x = 120; x < W; x += 210) { c.beginPath(); c.moveTo(x, y0 + 4); c.lineTo(x, 320); c.stroke(); }
    c.fillStyle = '#8b5a2b'; c.fillRect(0, 318, W, 12);
    // work counter planks
    c.fillStyle = '#b8773f'; c.fillRect(0, 330, W, 390);
    for (var py = 330, i = 0; py < 720; py += 66, i++) {
      c.fillStyle = i % 2 ? 'rgba(255,220,170,0.07)' : 'rgba(80,40,10,0.06)';
      c.fillRect(0, py, W, 66);
      c.fillStyle = 'rgba(70,35,10,0.35)'; c.fillRect(0, py, W, 2);
      c.strokeStyle = 'rgba(90,50,20,0.18)'; c.lineWidth = 2;
      for (var gx = (i * 97) % 180; gx < W; gx += 180) {
        c.beginPath(); c.moveTo(gx, py + 20); c.bezierCurveTo(gx + 40, py + 10, gx + 80, py + 34, gx + 140, py + 24); c.stroke();
      }
    }
  }

  // ---------- dynamic background bits ----------
  var BULBS = ['#ff5a5a', '#ffd84a', '#5ad1ff', '#7dff7a', '#ff9df0'];
  function drawLights(c, t, reduced) {
    c.strokeStyle = '#2b2b2b'; c.lineWidth = 2;
    for (var seg = 0; seg < 2; seg++) {
      var x0 = seg * 640;
      c.beginPath();
      for (var x = 0; x <= 640; x += 16) {
        var y = 52 + Math.sin(PI * x / 640) * 30;
        if (x === 0) c.moveTo(x0 + x, y); else c.lineTo(x0 + x, y);
      }
      c.stroke();
      for (var bx = 20, k = 0; bx < 640; bx += 40, k++) {
        var by = 52 + Math.sin(PI * bx / 640) * 30 + 8;
        var on = reduced ? 1 : 0.65 + 0.35 * Math.sin(t * 3 + k * 1.7 + seg);
        var col = BULBS[(k + seg * 2) % BULBS.length];
        c.globalAlpha = 0.25 * on; c.fillStyle = col; circ(c, x0 + bx, by, 13); c.fill();
        c.globalAlpha = 0.6 + 0.4 * on; circ(c, x0 + bx, by, 5.5); c.fill();
        c.globalAlpha = 1;
      }
    }
  }

  function drawFlags(c, t, reduced) {
    var cols = ['#e63946', '#ffd23f', '#3a86ff', '#ffffff', '#3fae49'];
    c.strokeStyle = '#5a3a1a'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(16, 98); c.quadraticCurveTo(640, 128, W - 16, 98); c.stroke();
    for (var x = 30, k = 0; x < W - 20; x += 34, k++) {
      var u = x / W, y = 98 + 4 * 30 * u * (1 - u) * 1.0;
      var sway = reduced ? 0 : Math.sin(t * 2.2 + k) * 3;
      c.fillStyle = cols[k % cols.length];
      c.beginPath(); c.moveTo(x - 11, y); c.lineTo(x + 11, y); c.lineTo(x + sway, y + 22); c.closePath(); c.fill();
    }
  }

  function star5(c, x, y, R, r, rot) {
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = rot - PI / 2 + i * PI / 5, rad = i % 2 ? r : R;
      c.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
    }
    c.closePath();
  }

  function drawParol(c, t, reduced) {
    [[150, 0], [1130, 1]].forEach(function (p) {
      var x = p[0], y = 116, sw = reduced ? 0 : Math.sin(t * 1.5 + p[1] * 2) * 0.06;
      c.save(); c.translate(x, 40); c.rotate(sw); c.translate(-x, -40);
      c.strokeStyle = '#3a2a1a'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, 40); c.lineTo(x, y - 28); c.stroke();
      var gl = c.createRadialGradient(x, y, 4, x, y, 50);
      gl.addColorStop(0, 'rgba(255,230,120,0.55)'); gl.addColorStop(1, 'rgba(255,230,120,0)');
      c.fillStyle = gl; circ(c, x, y, 50); c.fill();
      star5(c, x, y, 28, 12, 0); fillStroke(c, '#ffcf3f', '#c0392b', 2.5);
      circ(c, x, y, 7); fillStroke(c, '#e63946', null);
      c.strokeStyle = '#e63946'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(x - 8, y + 22); c.lineTo(x - 12, y + 52); c.moveTo(x + 8, y + 22); c.lineTo(x + 12, y + 52); c.stroke();
      c.restore();
    });
  }

  function drawJeep(c, x, dir) {
    c.save(); c.translate(x, 0); if (dir < 0) c.scale(-1, 1);
    var y = 0;
    // roof + route sign
    rr(c, -152, y + 146, 286, 14, 5); fillStroke(c, '#e9ecef', '#7d858c', 2);
    rr(c, 76, y + 130, 80, 18, 4); fillStroke(c, '#ffffff', '#555', 2);
    c.save(); if (dir < 0) { c.translate(116, 0); c.scale(-1, 1); c.translate(-116, 0); }
    text(c, 'BAYAN', 116, y + 140, 12, '#c0392b');
    c.restore();
    // cabin
    rr(c, -160, y + 158, 284, 66, 9); fillStroke(c, '#d3dbe2', '#7d858c', 2.5);
    c.fillStyle = '#e63946'; c.fillRect(-158, y + 206, 280, 6);
    c.fillStyle = '#ffd23f'; c.fillRect(-158, y + 212, 280, 4);
    c.fillStyle = '#3a86ff'; c.fillRect(-158, y + 216, 280, 3);
    // windows with passengers
    for (var i = 0; i < 6; i++) {
      var wx = -150 + i * 44;
      rr(c, wx, y + 166, 36, 26, 4); fillStroke(c, '#2b3440', null);
      if (i % 2 === 0 || i === 3) {
        c.fillStyle = ['#e8b98f', '#a8683e', '#f0c39b'][i % 3];
        circ(c, wx + 18, y + 184, 8); c.fill();
        c.fillStyle = '#1d1a1a'; c.beginPath(); c.arc(wx + 18, y + 182, 8, PI, 0); c.fill();
      }
    }
    // hood + windshield
    c.beginPath(); c.moveTo(124, y + 160); c.lineTo(142, y + 160); c.lineTo(152, y + 186); c.lineTo(124, y + 186); c.closePath();
    fillStroke(c, 'rgba(159,211,255,0.8)', '#7d858c', 2);
    rr(c, 122, y + 186, 46, 38, 6); fillStroke(c, '#d3dbe2', '#7d858c', 2.5);
    c.fillStyle = '#bfc5ca'; c.fillRect(164, y + 196, 8, 26);
    c.fillStyle = '#fff6a0'; circ(c, 166, y + 200, 4.5); c.fill();
    // little hood flags
    c.strokeStyle = '#777'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(140, y + 186); c.lineTo(140, y + 168); c.moveTo(156, y + 186); c.lineTo(156, y + 170); c.stroke();
    c.fillStyle = '#e63946'; c.fillRect(140, y + 168, 9, 6); c.fillStyle = '#3a86ff'; c.fillRect(156, y + 170, 9, 6);
    // side text
    c.save(); if (dir < 0) { c.translate(-20, 0); c.scale(-1, 1); c.translate(20, 0); }
    text(c, 'BIYAHENG BARANGAY', -20, y + 199, 11, '#1d3557');
    c.restore();
    // wheels
    [-108, 96].forEach(function (wx) {
      circ(c, wx, y + 228, 17); fillStroke(c, '#222', null);
      circ(c, wx, y + 228, 7); fillStroke(c, '#c7cdd2', null);
    });
    c.restore();
  }

  function drawSign(c) {
    c.save(); c.translate(76, 250); c.rotate(-0.06);
    c.strokeStyle = '#8b6a3a'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 20); c.lineTo(0, 64); c.stroke();
    c.beginPath();
    c.moveTo(-60, -50); c.lineTo(58, -54); c.lineTo(62, 30); c.lineTo(-57, 34); c.closePath();
    fillStroke(c, '#c8955a', '#8a6236', 3);
    c.strokeStyle = 'rgba(110,70,30,0.25)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-50, -10); c.lineTo(52, -12); c.stroke();
    text(c, 'TURON', 0, -26, 28, '#2b1a10');
    text(c, '15 PESOS', 0, 10, 21, '#b3261e');
    c.restore();
  }

  function drawRadio(c, t, reduced) {
    var x = 1206, y = 250;
    c.strokeStyle = '#555'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + 30, y - 24); c.lineTo(x + 46, y - 58); c.stroke();
    rr(c, x - 48, y - 26, 96, 52, 9); fillStroke(c, '#d8432f', '#7a2216', 3);
    circ(c, x - 20, y, 16); fillStroke(c, '#3a2a20', '#222', 2);
    c.fillStyle = '#7a6a60';
    for (var i = -2; i <= 2; i++) for (var j = -2; j <= 2; j++) if (i * i + j * j < 6) c.fillRect(x - 21 + i * 5, y - 1 + j * 5, 2, 2);
    rr(c, x + 4, y - 16, 36, 14, 3); fillStroke(c, '#ffe8a3', '#7a2216', 2);
    circ(c, x + 14, y + 12, 5); fillStroke(c, '#eee', '#555', 1.5);
    circ(c, x + 32, y + 12, 5); fillStroke(c, '#eee', '#555', 1.5);
    // floating notes
    for (var n = 0; n < 3; n++) {
      var p = reduced ? 0.4 + n * 0.2 : ((t * 0.5 + n / 3) % 1);
      var nx = x - 30 + n * 22 + Math.sin(p * 6 + n) * 8, ny = y - 40 - p * 60;
      c.globalAlpha = reduced ? 0.8 : 1 - p;
      text(c, n % 2 ? '♫' : '♪', nx, ny, 22, '#5a2a8a');
      c.globalAlpha = 1;
    }
  }

  function drawPlants(c) {
    [[176, 0], [1112, 1]].forEach(function (p) {
      var x = p[0], y = 288;
      c.fillStyle = '#3f9a43';
      [[-14, -26, -0.6], [0, -34, 0], [14, -26, 0.6], [-6, -18, -0.3], [7, -18, 0.3]].forEach(function (l) {
        c.save(); c.translate(x + l[0] * 0.5, y - 10); c.rotate(l[2]); ell(c, 0, l[1] / 2 - 2, 7, 18); c.fill(); c.restore();
      });
      if (p[1]) { c.fillStyle = '#ff6fa3'; circ(c, x - 6, y - 40, 5); c.fill(); circ(c, x + 8, y - 34, 5); c.fill(); }
      c.beginPath(); c.moveTo(x - 20, y - 12); c.lineTo(x + 20, y - 12); c.lineTo(x + 15, y + 22); c.lineTo(x - 15, y + 22); c.closePath();
      fillStroke(c, '#c8643a', '#7f3a1c', 2.5);
    });
  }

  // =====================================================================
  //  CUSTOMERS
  // =====================================================================
  var LOOK = {
    student: { skin: '#e8b98f', shirt: '#ffffff', hair: '#1d1a1a' },
    driver:  { skin: '#b87a4b', shirt: '#f5f5ee', hair: '#1d1a1a' },
    tita:    { skin: '#f0c39b', shirt: '#ff7eb6', hair: '#3b2216' },
    worker:  { skin: '#a8683e', shirt: '#7f8c8d', hair: '#1d1a1a' },
    lola:    { skin: '#e5b58f', shirt: '#b9a5e0', hair: '#dcdcdc' }
  };

  function face(c, mood, type, t, reduced) {
    var ink = '#2a1a10';
    // eyes
    c.fillStyle = ink; c.strokeStyle = ink; c.lineWidth = 3; c.lineCap = 'round';
    if (mood === 'joy') {
      c.beginPath(); c.arc(-12, -2, 5, PI * 1.1, PI * 1.9); c.stroke();
      c.beginPath(); c.arc(12, -2, 5, PI * 1.1, PI * 1.9); c.stroke();
    } else {
      circ(c, -12, -3, 3.6); c.fill(); circ(c, 12, -3, 3.6); c.fill();
      c.fillStyle = '#fff'; circ(c, -11, -4.5, 1.2); c.fill(); circ(c, 13, -4.5, 1.2); c.fill();
    }
    // brows
    c.strokeStyle = type === 'lola' ? '#8a8a8a' : ink; c.lineWidth = 3;
    c.beginPath();
    if (mood === 'angry') { c.moveTo(-19, -15); c.lineTo(-6, -9); c.moveTo(19, -15); c.lineTo(6, -9); }
    else if (mood === 'meh') { c.moveTo(-18, -12); c.lineTo(-6, -14); c.moveTo(18, -12); c.lineTo(6, -14); }
    else { c.moveTo(-18, -13); c.quadraticCurveTo(-12, -17, -6, -13); c.moveTo(18, -13); c.quadraticCurveTo(12, -17, 6, -13); }
    c.stroke();
    // cheeks
    c.fillStyle = 'rgba(255,110,110,0.28)'; ell(c, -20, 8, 6, 4); c.fill(); ell(c, 20, 8, 6, 4); c.fill();
    // mouth
    c.strokeStyle = type === 'tita' ? '#c0233a' : ink; c.lineWidth = 3;
    if (mood === 'joy') {
      c.beginPath(); c.moveTo(-10, 8); c.quadraticCurveTo(0, 24, 10, 8); c.closePath();
      c.fillStyle = '#8b2b2b'; c.fill(); c.stroke();
    } else if (mood === 'happy') {
      c.beginPath(); c.arc(0, 6, 9, PI * 0.15, PI * 0.85); c.stroke();
    } else if (mood === 'meh') {
      c.beginPath(); c.moveTo(-8, 15); c.quadraticCurveTo(0, 12, 8, 15); c.stroke();
      // sweat drop
      c.fillStyle = '#6cc4ff';
      c.beginPath(); c.moveTo(27, -20); c.quadraticCurveTo(33, -9, 27, -6); c.quadraticCurveTo(21, -9, 27, -20); c.fill();
    } else {
      c.beginPath(); c.arc(0, 22, 9, PI * 1.15, PI * 1.85); c.stroke();
    }
  }

  function drawCustomer(c, cu, t, reduced) {
    var L = LOOK[cu.type];
    var x = cu.x, y = cu.y;
    c.save(); c.translate(x, y);
    var lean = cu.state === 'wait' ? 0 : (reduced ? 0 : Math.sin(cu.walkT * 10) * 0.04);
    c.rotate(lean);
    // body
    var shirt = L.shirt;
    if (cu.type === 'driver') {
      rr(c, -54, 34, 108, 120, 30); fillStroke(c, L.skin, 'rgba(60,30,10,0.5)', 2.5);
      rr(c, -34, 36, 68, 120, 12); fillStroke(c, shirt, '#b9b9ad', 2);
    } else {
      rr(c, -54, 34, 108, 120, 30); fillStroke(c, shirt, 'rgba(60,30,10,0.45)', 2.5);
    }
    if (cu.type === 'student') {
      c.fillStyle = '#ffffff'; c.strokeStyle = '#bbb'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(-16, 34); c.lineTo(0, 50); c.lineTo(-4, 34); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(16, 34); c.lineTo(0, 50); c.lineTo(4, 34); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#1f4fa3'; c.beginPath(); c.moveTo(-7, 48); c.lineTo(7, 48); c.lineTo(0, 70); c.closePath(); c.fill();
      c.fillStyle = '#2b3a67'; c.fillRect(-46, 38, 9, 40); c.fillRect(37, 38, 9, 40);
    }
    if (cu.type === 'tita') {
      var fl = ['#fff', '#ffe066', '#fff'];
      for (var i = 0; i < 7; i++) { c.fillStyle = fl[i % 3]; circ(c, -38 + (i * 23) % 76, 50 + (i * 13) % 30, 5); c.fill(); }
    }
    if (cu.type === 'worker') {
      rr(c, -50, 36, 34, 90, 10); fillStroke(c, '#ff8a1e', '#b85a10', 2);
      rr(c, 16, 36, 34, 90, 10); fillStroke(c, '#ff8a1e', '#b85a10', 2);
      c.fillStyle = '#f4f4a0'; c.fillRect(-50, 60, 34, 6); c.fillRect(16, 60, 34, 6);
    }
    if (cu.type === 'lola') {
      c.fillStyle = '#ffffff'; ell(c, -10, 38, 14, 7, 0.3); c.fill(); ell(c, 10, 38, 14, 7, -0.3); c.fill();
    }
    if (cu.type === 'driver') {
      // bimpo towel over the shoulder
      c.save(); c.rotate(-0.15); rr(c, 14, 26, 26, 60, 6); fillStroke(c, '#ffffff', '#a8b8c8', 2);
      c.fillStyle = '#3a86ff'; c.fillRect(14, 70, 26, 5); c.restore();
    }
    // neck + head
    c.fillStyle = L.skin; c.fillRect(-10, 22, 20, 16);
    circ(c, 0, 0, 34); fillStroke(c, L.skin, 'rgba(60,30,10,0.45)', 2.5);
    // ears
    circ(c, -33, 2, 7); fillStroke(c, L.skin, 'rgba(60,30,10,0.45)', 2); circ(c, 33, 2, 7); fillStroke(c, L.skin, 'rgba(60,30,10,0.45)', 2);
    // hair & hats
    c.fillStyle = L.hair;
    switch (cu.type) {
      case 'student':
        c.beginPath(); c.arc(0, -4, 35, PI * 1.02, PI * 1.98); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(-30, -14); c.quadraticCurveTo(-10, -2, 8, -16); c.quadraticCurveTo(22, -6, 32, -16); c.lineTo(30, -24); c.lineTo(-30, -24); c.fill();
        break;
      case 'driver':
        c.fillStyle = '#c0392b'; c.beginPath(); c.arc(0, -10, 34, PI, 0); c.closePath(); c.fill();
        rr(c, 10, -16, 40, 9, 4); c.fill();
        c.fillStyle = '#ffffff'; circ(c, 0, -30, 5); c.fill();
        c.fillStyle = '#2a1a10'; rr(c, -12, 9, 24, 5, 2); c.fill();
        break;
      case 'tita':
        for (i = 0; i < 9; i++) { var a = PI + i * (PI / 8); circ(c, Math.cos(a) * 32, Math.sin(a) * 26 - 6, 11); c.fill(); }
        c.fillStyle = '#ffd23f'; circ(c, -34, 12, 3.5); c.fill(); circ(c, 34, 12, 3.5); c.fill();
        break;
      case 'worker':
        c.fillStyle = '#f5c518'; c.beginPath(); c.arc(0, -10, 36, PI, 0); c.closePath(); c.fill();
        c.strokeStyle = '#b8920c'; c.lineWidth = 2; c.stroke();
        rr(c, -44, -14, 88, 9, 4); c.fill(); c.stroke();
        c.fillStyle = 'rgba(40,25,15,0.35)';
        for (i = 0; i < 10; i++) c.fillRect(-14 + (i * 7) % 28, 16 + (i * 3) % 9, 2, 2);
        break;
      case 'lola':
        c.beginPath(); c.arc(0, -6, 35, PI * 1.02, PI * 1.98); c.closePath(); c.fill();
        circ(c, 0, -40, 13); c.fill();
        c.strokeStyle = '#9a9a9a'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -40, 7, 0, PI); c.stroke();
        break;
    }
    face(c, cu.mood, cu.type, t, reduced);
    if (cu.type === 'lola') {
      c.strokeStyle = '#555'; c.lineWidth = 2;
      circ(c, -12, -3, 9); c.stroke(); circ(c, 12, -3, 9); c.stroke();
      c.beginPath(); c.moveTo(-3, -3); c.lineTo(3, -3); c.stroke();
    }
    if (cu.mood === 'angry') {
      c.fillStyle = 'rgba(255,60,40,0.18)'; circ(c, 0, 0, 34); c.fill();
      c.strokeStyle = '#e02020'; c.lineWidth = 3;
      var ax = 26, ay = -30;
      c.beginPath();
      c.moveTo(ax - 7, ay - 2); c.quadraticCurveTo(ax - 2, ay - 2, ax - 2, ay - 7);
      c.moveTo(ax + 7, ay - 2); c.quadraticCurveTo(ax + 2, ay - 2, ax + 2, ay - 7);
      c.moveTo(ax - 7, ay + 2); c.quadraticCurveTo(ax - 2, ay + 2, ax - 2, ay + 7);
      c.moveTo(ax + 7, ay + 2); c.quadraticCurveTo(ax + 2, ay + 2, ax + 2, ay + 7);
      c.stroke();
    }
    if (cu.type === 'tita') {
      // pamaypay (hand fan), waves faster when impatient
      var speed = cu.mood === 'happy' || cu.mood === 'joy' ? 4 : 12;
      var fa = reduced ? 0 : Math.sin(t * speed) * 0.35;
      c.save(); c.translate(-44, 26); c.rotate(-0.5 + fa);
      c.fillStyle = L.skin; circ(c, 0, 8, 7); c.fill();
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 30, -PI * 0.9, -PI * 0.1); c.closePath();
      fillStroke(c, '#f6d365', '#b5651d', 2);
      c.strokeStyle = '#e63946'; c.lineWidth = 2;
      for (i = 1; i < 6; i++) { var fa2 = -PI * 0.9 + i * (PI * 0.8 / 6); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(fa2) * 29, Math.sin(fa2) * 29); c.stroke(); }
      c.restore();
    }
    c.restore();
  }

  // hands resting on the ledge (drawn after the ledge)
  function drawHands(c, cu) {
    if (cu.state !== 'wait') return;
    var L = LOOK[cu.type];
    [-40, 40].forEach(function (dx) {
      ell(c, cu.x + dx, 280, 13, 9); fillStroke(c, L.skin, 'rgba(60,30,10,0.5)', 2);
    });
  }

  function drawBubble(c, cu, t, hl) {
    var bw = 212, bh = 106, bx = cu.x - bw / 2, by = 50;
    if (cu.state === 'leave') {
      if (cu.lineT > 1.6) return;
      bh = 40; by = 112;
    }
    c.save();
    if (hl) { c.shadowColor = '#ffe14d'; c.shadowBlur = 22; }
    rr(c, bx, by, bw, bh, 16);
    c.fillStyle = '#ffffff'; c.fill();
    c.shadowBlur = 0;
    c.lineWidth = hl ? 5 : 3; c.strokeStyle = hl ? '#ffb400' : INK; c.stroke();
    // tail
    c.beginPath(); c.moveTo(cu.x - 12, by + bh - 1); c.lineTo(cu.x, by + bh + 12); c.lineTo(cu.x + 10, by + bh - 1); c.closePath();
    c.fillStyle = '#ffffff'; c.fill();
    c.beginPath(); c.moveTo(cu.x - 12, by + bh); c.lineTo(cu.x, by + bh + 12); c.lineTo(cu.x + 10, by + bh);
    c.lineWidth = hl ? 5 : 3; c.strokeStyle = hl ? '#ffb400' : INK; c.stroke();
    var lineCol = cu.mood === 'angry' ? '#c0392b' : cu.mood === 'joy' ? '#1e8e3e' : INK;
    if (cu.state === 'leave') {
      text(c, cu.line, cu.x, by + bh / 2 + 1, 16, lineCol, 'center', bw - 18);
      c.restore(); return;
    }
    text(c, cu.line, cu.x, by + 18, 15, lineCol, 'center', bw - 18);
    // order icons
    var n = cu.order.length, gap = 82;
    for (var i = 0; i < n; i++) {
      var o = cu.order[i];
      var ix = cu.x + (i - (n - 1) / 2) * gap, iy = by + 52;
      c.globalAlpha = o.done ? 0.35 : 1;
      drawItem(c, o.kind, ix, iy, 0.58);
      c.globalAlpha = 1;
      if (o.sauce) pill(c, MR.SAUCES[o.sauce].label, ix + 24, iy + 14, 11, o.sauce === 'spicy' ? '#d8301f' : o.sauce === 'sweet' ? '#8a4416' : '#5f7a3a', '#fff');
      if (o.done) {
        circ(c, ix + 18, iy - 14, 11); fillStroke(c, '#2fbf5b', '#fff', 2.5);
        c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(ix + 12, iy - 14); c.lineTo(ix + 17, iy - 9); c.lineTo(ix + 24, iy - 19); c.stroke();
      }
    }
    // patience meter
    var f = Math.max(0, cu.p / cu.maxP);
    var col = f > 0.55 ? '#2fbf5b' : f > 0.25 ? '#f5b800' : '#e63946';
    rr(c, bx + 16, by + bh - 17, bw - 32, 10, 5); c.fillStyle = '#ece4d8'; c.fill();
    if (f > 0) { rr(c, bx + 16, by + bh - 17, (bw - 32) * f, 10, 5); c.fillStyle = col; c.fill(); }
    c.restore();
  }

  // =====================================================================
  //  STATIONS & TRAYS
  // =====================================================================
  function padlock(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = '#f4e4c8'; c.lineWidth = 5; c.beginPath(); c.arc(0, -8, 10, PI, 0); c.stroke();
    rr(c, -15, -8, 30, 24, 5); fillStroke(c, '#f4e4c8', null);
    c.fillStyle = '#5a3a1a'; circ(c, 0, 2, 4); c.fill(); c.fillRect(-1.5, 2, 3, 8);
    c.restore();
  }

  function lockedOverlay(c, r, day, round) {
    if (round) { circ(c, r.x + r.w / 2, r.y + r.h / 2 - 6, 46); } else { rr(c, r.x, r.y, r.w, r.h, 14); }
    c.fillStyle = 'rgba(40,24,12,0.62)'; c.fill();
    padlock(c, r.x + r.w / 2, r.y + r.h / 2 - 12, 1);
    text(c, 'Araw ' + day, r.x + r.w / 2, r.y + r.h / 2 + 18, 14, '#f4e4c8');
  }

  function highlight(c, r, t, round) {
    var a = 0.55 + 0.45 * Math.sin(t * 7);
    c.save(); c.globalAlpha = a; c.strokeStyle = '#ffe14d'; c.lineWidth = 5;
    c.shadowColor = '#ffe14d'; c.shadowBlur = 12;
    if (round) circ(c, r.x + r.w / 2, r.y + r.h / 2 - 6, 50); else rr(c, r.x + 2, r.y + 2, r.w - 4, r.h - 4, 14);
    c.stroke(); c.restore();
  }

  function drawTray(c, tr, locked, hlOn, t) {
    var cx = tr.x + tr.w / 2, cy = tr.y + tr.h / 2;
    if (tr.bottle) {
      rr(c, tr.x, tr.y, tr.w, tr.h, 12); c.fillStyle = 'rgba(70,40,20,0.22)'; c.fill();
      drawItem(c, tr.item, cx, cy - 8, 1.05);
      pill(c, tr.label, cx, tr.y + tr.h - 14, 12, '#fff4dc', '#5a3418', tr.w - 10);
      if (locked) lockedOverlay(c, tr, tr.day);
      return;
    }
    // bilao (woven bamboo tray)
    circ(c, cx, cy - 6, 46); fillStroke(c, '#dcb67c', '#a57a45', 4);
    c.save(); circ(c, cx, cy - 6, 44); c.clip();
    c.strokeStyle = 'rgba(140,95,45,0.28)'; c.lineWidth = 2;
    for (var k = -50; k <= 50; k += 8) {
      c.beginPath(); c.moveTo(cx + k, cy - 56); c.lineTo(cx + k + 30, cy + 44); c.stroke();
      c.beginPath(); c.moveTo(cx + k, cy - 56); c.lineTo(cx + k - 30, cy + 44); c.stroke();
    }
    c.restore();
    drawItem(c, tr.item, cx, cy - 8, 0.95);
    pill(c, tr.label, cx, tr.y + tr.h - 9, 13, '#fff4dc', '#5a3418', tr.w - 14);
    if (locked) lockedOverlay(c, tr, tr.day, true);
  }

  function drawPanel(c, st, t) {
    rr(c, st.x, st.y, st.w, st.h, 14);
    c.fillStyle = 'rgba(70,38,16,0.26)'; c.fill();
    c.strokeStyle = 'rgba(255,225,180,0.25)'; c.lineWidth = 2; c.stroke();
  }

  function slotMark(c, s) {
    c.save(); c.setLineDash([6, 6]); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
    ell(c, s.x + s.w / 2, s.y + s.h / 2, Math.min(s.w, s.h) / 2 - 8, Math.min(s.w, s.h) / 2 - 14); c.stroke();
    c.restore();
  }

  function drawStationBase(c, st, t, fryCount) {
    var i;
    drawPanel(c, st, t);
    if (st.id === 'board') {
      rr(c, st.x + 10, st.y + 32, st.w - 20, st.h - 42, 20); fillStroke(c, '#ebc893', '#b48a52', 3);
      c.strokeStyle = 'rgba(160,110,60,0.25)'; c.lineWidth = 2;
      for (i = 0; i < 6; i++) { c.beginPath(); c.moveTo(st.x + 24, st.y + 52 + i * 30); c.bezierCurveTo(st.x + 100, st.y + 44 + i * 30, st.x + 180, st.y + 62 + i * 30, st.x + st.w - 24, st.y + 50 + i * 30); c.stroke(); }
    } else if (st.id === 'kawali') {
      var cx = st.cx, cy = st.cy;
      // stove + flames
      rr(c, st.x + 30, cy + 70, st.w - 60, 46, 8); fillStroke(c, '#3b3b42', '#222', 2);
      for (i = 0; i < 7; i++) {
        var fx = cx - 90 + i * 30, fh = 14 + (fryCount ? 8 : 0) + Math.sin(t * 18 + i * 2) * 4;
        c.fillStyle = '#ff9f1c'; c.beginPath(); c.moveTo(fx - 7, cy + 92); c.quadraticCurveTo(fx, cy + 92 - fh * 2, fx + 7, cy + 92); c.fill();
        c.fillStyle = '#4cc9f0'; c.beginPath(); c.moveTo(fx - 4, cy + 92); c.quadraticCurveTo(fx, cy + 92 - fh, fx + 4, cy + 92); c.fill();
      }
      // handles
      c.strokeStyle = '#26262b'; c.lineWidth = 9;
      c.beginPath(); c.arc(cx - 150, cy - 4, 14, PI * 0.5, PI * 1.5); c.stroke();
      c.beginPath(); c.arc(cx + 150, cy - 4, 14, -PI * 0.5, PI * 0.5); c.stroke();
      ell(c, cx, cy, 148, 104); fillStroke(c, '#2f2f36', '#17171b', 4);
      var og = c.createRadialGradient(cx - 30, cy - 30, 10, cx, cy, 130);
      og.addColorStop(0, '#f2c25a'); og.addColorStop(1, '#a8701f');
      ell(c, cx, cy, 132, 90); c.fillStyle = og; c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)';
      for (i = 0; i < (fryCount ? 14 : 4); i++) {
        var bx = cx + Math.cos(i * 2.3 + t * (fryCount ? 2 : 0.4)) * (30 + (i * 17) % 90);
        var by = cy + Math.sin(i * 1.7 + t * (fryCount ? 2.6 : 0.4)) * (20 + (i * 11) % 60);
        circ(c, bx, by, 2 + (i % 3)); c.fill();
      }
    } else if (st.id === 'sugar') {
      ell(c, st.x + st.w / 2, st.y + 74, st.w / 2 - 12, 40); fillStroke(c, '#4a4a52', '#222', 3);
      ell(c, st.x + st.w / 2, st.y + 74, st.w / 2 - 22, 31); c.fillStyle = '#c67a1f'; c.fill();
      c.fillStyle = 'rgba(255,230,160,0.5)'; ell(c, st.x + st.w / 2 - 20, st.y + 64, 16, 5); c.fill();
    } else if (st.id === 'skewer') {
      rr(c, st.x + 10, st.y + 32, st.w - 20, st.h - 40, 12); fillStroke(c, '#f6ead2', '#c9b48e', 2);
      c.strokeStyle = '#caa06a'; c.lineWidth = 3;
      for (i = 0; i < 4; i++) { c.beginPath(); c.moveTo(st.x + st.w - 26 + i * 4, st.y + 10); c.lineTo(st.x + st.w - 30 + i * 3, st.y + 30); c.stroke(); }
    } else if (st.id === 'cups' || st.id === 'drinks') {
      rr(c, st.x + 10, st.y + 32, st.w - 20, st.h - 40, 12); fillStroke(c, st.id === 'cups' ? '#f6ead2' : '#ffe0b8', '#c9b48e', 2);
    }
    if (st.slots) {
      for (i = 0; i < st.slots.length; i++) if (!st.slots[i].item) slotMark(c, st.slots[i]);
    }
    c.font = 'bold 13px ' + FONT;
    var lw = c.measureText(st.label).width + 15.6;
    pill(c, st.label, st.x + 10 + lw / 2, st.y + 15, 13, '#fff4dc', '#5a3418');
  }

  function drawTrash(c, r, hlOn, t) {
    drawPanel(c, r, t);
    var cx = r.x + r.w / 2, y = r.y + 14;
    var open = hlOn ? -0.5 : 0;
    c.beginPath(); c.moveTo(cx - 30, y + 18); c.lineTo(cx + 30, y + 18); c.lineTo(cx + 24, y + 76); c.lineTo(cx - 24, y + 76); c.closePath();
    fillStroke(c, '#3f8f4a', '#22552a', 3);
    c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(cx - 12, y + 26); c.lineTo(cx - 10, y + 68); c.moveTo(cx + 12, y + 26); c.lineTo(cx + 10, y + 68); c.stroke();
    c.save(); c.translate(cx - 34, y + 16); c.rotate(open);
    rr(c, 0, -8, 68, 10, 4); fillStroke(c, '#2f6f3a', '#1d4424', 2.5);
    rr(c, 26, -14, 16, 7, 3); fillStroke(c, '#2f6f3a', '#1d4424', 2);
    c.restore();
    pill(c, 'Basura', r.x + r.w - 46, r.y + r.h - 18, 13, '#fff4dc', '#5a3418');
  }

  // cook-progress ring around a kawali slot
  function cookRing(c, x, y, state, frac, blink) {
    c.save(); c.lineWidth = 6; c.lineCap = 'round';
    c.strokeStyle = 'rgba(0,0,0,0.25)'; circ(c, x, y, 40); c.stroke();
    var col = state === 'raw' ? '#ffffff' : (blink ? '#ff3b3b' : '#3ddc84');
    c.strokeStyle = col;
    c.beginPath(); c.arc(x, y, 40, -PI / 2, -PI / 2 + TAU * Math.max(0.001, frac)); c.stroke();
    if (state === 'done') {
      circ(c, x + 30, y - 30, 11); fillStroke(c, blink ? '#ff3b3b' : '#2fbf5b', '#fff', 2.5);
      text(c, blink ? '!' : '✓', x + 30, y - 29, 14, '#fff');
    }
    c.restore();
  }

  return {
    rr: rr, circ: circ, ell: ell, text: text, outlined: outlined, pill: pill, star5: star5,
    drawItem: drawItem, drawFry: drawFry,
    paintTop: paintTop, paintCounter: paintCounter,
    drawLights: drawLights, drawFlags: drawFlags, drawParol: drawParol, drawJeep: drawJeep,
    drawSign: drawSign, drawRadio: drawRadio, drawPlants: drawPlants,
    drawCustomer: drawCustomer, drawHands: drawHands, drawBubble: drawBubble,
    drawTray: drawTray, drawStationBase: drawStationBase, drawTrash: drawTrash,
    lockedOverlay: lockedOverlay, highlight: highlight, cookRing: cookRing, FONT: FONT
  };
})();
