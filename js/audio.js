/* Merienda Rush! — sound effects made with the Web Audio API (no audio files). */
var MR = window.MR = window.MR || {};

MR.Audio = (function () {
  var ctx = null, master = null, muted = false;
  var noise = null, sizzleGain = null, sizzleOn = false;
  var radioTimer = 0, radioStep = 0;

  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function noiseBuffer() {
    if (noise) return noise;
    var len = ctx.sampleRate * 1.5;
    noise = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = noise.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noise;
  }

  // one oscillator note with a quick envelope
  function tone(freq, dur, type, vol, delay, slideTo) {
    if (!ensure() || muted) return;
    var t = ctx.currentTime + (delay || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  // short filtered noise burst
  function burst(dur, vol, filterType, freq, delay) {
    if (!ensure() || muted) return;
    var t = ctx.currentTime + (delay || 0);
    var s = ctx.createBufferSource(); s.buffer = noiseBuffer();
    var f = ctx.createBiquadFilter(); f.type = filterType || 'highpass'; f.frequency.value = freq || 1200;
    var g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  // continuous frying sound; level 0 = silent
  function sizzle(level) {
    if (!ctx) { if (level <= 0) return; if (!ensure()) return; }
    if (!sizzleGain) {
      var s = ctx.createBufferSource(); s.buffer = noiseBuffer(); s.loop = true;
      var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
      var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 9000;
      sizzleGain = ctx.createGain(); sizzleGain.gain.value = 0;
      s.connect(hp); hp.connect(lp); lp.connect(sizzleGain); sizzleGain.connect(master);
      s.start();
    }
    var target = muted ? 0 : Math.min(0.09, level * 0.03);
    // a little crackle wobble
    if (target > 0) target *= 0.75 + Math.random() * 0.5;
    sizzleGain.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
    sizzleOn = level > 0;
    if (sizzleOn && !muted && Math.random() < 0.08 * level) burst(0.04, 0.06, 'bandpass', 3000 + Math.random() * 3000);
  }

  // a soft looping OPM-ish melody while the radio upgrade is owned
  var MELODY = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1047, 988, 784, 659, 587];
  function radio(dt, on) {
    if (!on || muted || !ctx) return;
    radioTimer -= dt;
    if (radioTimer <= 0) {
      radioTimer = 0.42;
      var f = MELODY[radioStep % MELODY.length];
      tone(f, 0.35, 'triangle', 0.025);
      if (radioStep % 4 === 0) tone(f / 2, 0.6, 'sine', 0.02);
      radioStep++;
    }
  }

  return {
    unlock: ensure,
    setMuted: function (m) {
      muted = m;
      if (master) master.gain.setTargetAtTime(m ? 0 : 0.55, ctx.currentTime, 0.02);
    },
    isMuted: function () { return muted; },
    sizzle: sizzle,
    radio: radio,
    pick: function () { tone(660, 0.08, 'triangle', 0.15); },
    drop: function () { tone(330, 0.1, 'triangle', 0.18, 0, 220); },
    plop: function () { tone(180, 0.12, 'sine', 0.25, 0, 90); burst(0.15, 0.12, 'highpass', 2500); },
    sparkle: function () { tone(1046, 0.1, 'sine', 0.12); tone(1318, 0.12, 'sine', 0.1, 0.06); tone(1568, 0.16, 'sine', 0.08, 0.12); },
    pour: function () { burst(0.35, 0.1, 'bandpass', 900); },
    ching: function () { tone(1568, 0.12, 'square', 0.07); tone(2093, 0.35, 'triangle', 0.12, 0.07); },
    happy: function () { tone(523, 0.1, 'triangle', 0.14); tone(659, 0.1, 'triangle', 0.14, 0.08); tone(784, 0.16, 'triangle', 0.14, 0.16); },
    angry: function () { tone(220, 0.25, 'sawtooth', 0.09, 0, 140); tone(160, 0.35, 'sawtooth', 0.08, 0.18, 100); },
    wrong: function () { tone(300, 0.12, 'square', 0.08); tone(240, 0.18, 'square', 0.08, 0.1); },
    warn: function () { tone(880, 0.06, 'square', 0.05); },
    burn: function () { burst(0.5, 0.18, 'lowpass', 900); tone(140, 0.3, 'sawtooth', 0.06, 0, 70); },
    trash: function () { burst(0.18, 0.18, 'lowpass', 600); tone(120, 0.12, 'sine', 0.2); },
    nope: function () { tone(200, 0.1, 'sine', 0.12, 0, 160); },
    click: function () { tone(880, 0.05, 'triangle', 0.1); },
    buy: function () { tone(784, 0.08, 'square', 0.06); tone(1175, 0.2, 'triangle', 0.12, 0.08); tone(1568, 0.25, 'triangle', 0.1, 0.16); },
    star: function (i) { tone(784 * Math.pow(1.26, i), 0.3, 'triangle', 0.14); },
    jeep: function () { tone(392, 0.14, 'square', 0.035); tone(392, 0.2, 'square', 0.035, 0.2); },
    start: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.18, 'triangle', 0.13, i * 0.1); }); },
    end: function () { [784, 659, 523, 659, 784].forEach(function (f, i) { tone(f, 0.2, 'triangle', 0.12, i * 0.12); }); },
    fail: function () { [392, 349, 311, 262].forEach(function (f, i) { tone(f, 0.3, 'triangle', 0.12, i * 0.18); }); },
    tick: function () { tone(1200, 0.04, 'square', 0.04); }
  };
})();
