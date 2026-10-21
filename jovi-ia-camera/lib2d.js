// THE 2D LIBRARY — the illustrated world (campus, Bia, photos), the JOVI camera UI and labels, shared as
// globalThis.L2 with film.js. Every drawing is a pure function of t; every time comes from score.js.
(function () {
  const U = globalThis.U, G = globalThis.G, Ch = globalThis.Ch, UI = globalThis.UI, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { T, BEAT, ev } = S;
  const { clamp, lerp, ease, pulse } = U;
  const W = G.W, H = G.H, SAFE = G.SAFE;

  // ---------- palette: dark, white, luminous blue; the phone in its real plum finish ----------
  const C = {
    night: '#07090F', panel: '#111622', line: '#232A3B', white: '#F4F6FA', muted: '#9AA4B8',
    blue: '#3DA5FF', blue2: '#7CC6FF', glow: 'rgba(61,165,255,', plum0: '#250B19', plum1: '#5A2341', plum2: '#3A1429', metal: '#C9B6C2',
  };
  UI.setTheme({ accent: C.blue, accent2: C.blue2, ok: C.blue, ink: C.white, muted: C.muted, app: C.night, card: C.panel, line: C.line, font: 'Inter' });
  const BIA = { hairStyle: 'curly', hair: '#24140D', skin: '#B57A55', outfit: 'tee', shirt: '#F3F5FA', bottoms: 'pants', shorts: '#26324D' };
  globalThis.CAST = { bia: BIA };

  let VO = null, SUBS = [];
  const mouthAt = (t, fallback) => { const mo = Subs.mouth(VO, t, 'bia'); return mo.talking && mo.open > 0.02 ? mo : fallback; };
  const voLine = (id) => { const i = S.vo.findIndex((l) => l.id === id); return VO && VO.lines[i]; };

  // ---------- helpers ----------
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, k) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * clamp(k))).join(',')})`; };
  const rr = (ctx, x, y, w, h, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); };
  const glowRR = (ctx, x, y, w, h, r, a, blur = 24) => {
    ctx.save(); ctx.shadowColor = C.glow + a + ')'; ctx.shadowBlur = blur; ctx.strokeStyle = C.glow + Math.min(1, a + 0.2) + ')'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke(); ctx.restore();
  };
  const fade = (t, t0, t1, d = 0.25) => clamp((t - t0) / d) * (1 - clamp((t - t1) / d));

  // ---------- the world: a sunny campus seen against the light ----------
  // e = how well exposed the picture is (0: sky blown out, 1: balanced). Draws in the box (x, y, w, h).
  function scenery(ctx, x, y, w, h, e, sunX, sunY, kind = 'campus') {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, mix('#FFFFFF', '#3F8DDB', e)); g.addColorStop(1, mix('#FFFBEF', '#C6E6FF', e));
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    if (e > 0.05) {
      ctx.save(); ctx.globalAlpha = 0.85 * e; ctx.fillStyle = '#FFFFFF';
      for (const [cx, cy, s] of [[0.72, 0.14, 1], [0.9, 0.24, 0.7], [0.15, 0.08, 0.6]]) {
        for (const [dx, dy, r] of [[0, 0, 0.07], [0.06, 0.01, 0.055], [-0.06, 0.015, 0.05], [0.02, -0.03, 0.05]]) { ctx.beginPath(); ctx.ellipse(x + (cx + dx * s) * w, y + (cy + dy * s) * h, r * s * w, r * s * w * 0.7, 0, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore();
    }
    const gy = y + h * 0.62;
    if (kind === 'campus') {
      const bc = mix('#F3F3F1', '#6F80A8', e), wc = mix('#FFFFFF', '#B9D3F5', e);
      for (const [bx, bw, bh] of [[0.0, 0.22, 0.2], [0.2, 0.3, 0.3], [0.52, 0.2, 0.22], [0.74, 0.3, 0.27]]) {
        ctx.fillStyle = bc; ctx.fillRect(x + bx * w, gy - bh * h, bw * w, bh * h + 2);
        ctx.fillStyle = wc;
        for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
          const wx = x + (bx + 0.02 + c * bw / 6) * w, wy = gy - bh * h + 0.025 * h + r * 0.045 * h;
          if (wy < gy - 0.03 * h) ctx.fillRect(wx, wy, bw * w / 10, 0.022 * h);
        }
      }
      const tc = mix('#ECEFE6', '#3E8E5E', e);
      ctx.fillStyle = tc;
      for (const [tx, tr] of [[0.08, 0.08], [0.33, 0.1], [0.6, 0.07], [0.88, 0.09]]) { ctx.beginPath(); ctx.arc(x + tx * w, gy - tr * w * 0.6, tr * w, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = mix('#F4F1E6', '#86A867', e); ctx.fillRect(x, gy, w, y + h - gy);
      ctx.fillStyle = mix('#F6F4EE', '#C9CDD6', e); ctx.fillRect(x, gy + 0.05 * h, w, 0.06 * h);
    } else { // a running track in a park
      const tc = mix('#ECEFE6', '#3E8E5E', e);
      ctx.fillStyle = tc;
      for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(x + (i / 8) * w, gy - 0.03 * h, 0.09 * w, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = mix('#F4F1E6', '#7FA35F', e); ctx.fillRect(x, gy - 0.01 * h, w, 0.08 * h);
      ctx.fillStyle = mix('#F6E9E4', '#C65A43', e); ctx.fillRect(x, gy + 0.07 * h, w, y + h - gy);
      ctx.strokeStyle = mix('#FFFFFF', '#F3E9E4', e); ctx.lineWidth = Math.max(2, w * 0.008);
      for (let i = 1; i < 5; i++) { const ly = gy + 0.07 * h + i * 0.065 * h; ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + w, ly + i * 0.01 * h); ctx.stroke(); }
    }
    // the sun and its glare (huge when the shot is blown out)
    const gr = lerp(0.95, 0.42, e) * w;
    const sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, gr);
    sg.addColorStop(0, 'rgba(255,253,240,1)'); sg.addColorStop(0.25, `rgba(255,246,210,${lerp(0.95, 0.6, e)})`); sg.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = sg; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#FFFBEA'; ctx.beginPath(); ctx.arc(sunX, sunY, 0.075 * w, 0, Math.PI * 2); ctx.fill();
  }

  // Bia herself; `bright` < 1 darkens her like a backlit face (only inside photos)
  function bia(ctx, o, bright = 1, sat = 1) {
    if (bright < 0.999 || sat < 0.999) ctx.filter = `brightness(${bright.toFixed(3)}) saturate(${sat.toFixed(3)})`;
    Ch.person(ctx, { pose: 'stand', style: BIA, seed: 300, shadow: false, ...o });
    ctx.filter = 'none';
  }

  // a photo (portrait 3:4) drawn in the box (x, y, w, h): kind 'sun' (selfie against the sun) or 'run'
  // e: exposure / sharpness quality 0..1. Inside, the design is 600×800 units.
  function photo(ctx, x, y, w, h, kind, e, t, o = {}) {
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, o.r ?? 0); ctx.clip();
    ctx.translate(x, y); ctx.scale(w / 600, h / 800);
    if (kind === 'sun') {
      scenery(ctx, 0, 0, 600, 800, e, 190, 250, 'campus');
      const sway = o.live ? Math.sin(t * 1.3) * 6 : 0;
      bia(ctx, { x: 330 + sway, y: 1012, s: 1.6, eyes: o.eyes || (e > 0.8 ? 'happy' : 'normal'), mouth: o.mouth || (e > 0.8 ? 'grin' : 'flat'), brows: o.brows || 'neutral', look: -0.05, lookY: 0.05 }, lerp(0.26, 1.03, e), lerp(0.5, 1.05, e));
      // the glare spills over her edges when blown out
      const bl = ctx.createRadialGradient(190, 250, 0, 190, 250, lerp(560, 220, e));
      bl.addColorStop(0, `rgba(255,252,236,${lerp(0.75, 0.18, e)})`); bl.addColorStop(1, 'rgba(255,252,236,0)');
      ctx.fillStyle = bl; ctx.fillRect(0, 0, 600, 800);
      if (e < 0.5) { ctx.fillStyle = `rgba(255,255,255,${0.14 * (1 - e * 2)})`; ctx.fillRect(0, 0, 600, 800); }
    } else {
      const shake = (1 - e) * 2;
      if (shake > 0.05) ctx.filter = `blur(${shake.toFixed(2)}px)`;
      scenery(ctx, 0, 0, 600, 800, 0.55 + 0.45 * e, 520, 150, 'track');
      ctx.filter = 'none';
      const ph = o.live ? (t * 1.6) % 1 : 0.3;
      const bx = o.live ? 300 + Math.sin(t * 0.9) * 40 : 300;
      if (e < 0.98) {
        const b = (1 - e) * 9;
        ctx.save(); ctx.filter = `blur(${b.toFixed(2)}px)`;
        for (const [dx, a] of [[-70, 0.22], [-40, 0.35], [-18, 0.55]]) { ctx.globalAlpha = a * (1 - e); bia(ctx, { x: bx + dx * (1 - e), y: 760, s: 1.08, pose: 'walk', walk: ph, eyes: 'normal', mouth: 'open', legBend: 0.3 }); }
        ctx.restore();
        ctx.save(); ctx.filter = `blur(${(b * 0.6).toFixed(2)}px)`; ctx.globalAlpha = 0.6 + 0.4 * e;
        bia(ctx, { x: bx, y: 760, s: 1.08, pose: 'walk', walk: ph, eyes: 'normal', mouth: 'open', legBend: 0.3 });
        ctx.restore();
      }
      if (e > 0.02) {
        ctx.save(); ctx.globalAlpha = e;
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
        for (const [ly, lx, ll] of [[420, 60, 120], [500, 30, 150], [580, 70, 100], [470, 470, 100], [560, 450, 120]]) { ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx + ll, ly); ctx.stroke(); }
        bia(ctx, { x: bx, y: 760, s: 1.08, pose: 'walk', walk: ph, eyes: 'happy', mouth: 'grin', legBend: 0.3 });
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // ---------- the JOVI phone ----------
  const PH_RATIO = 0.47;
  function phoneBack(ctx, cx, cy, h, o = {}) {
    const w = h * PH_RATIO, r = h * 0.075;
    ctx.save(); ctx.translate(cx, cy); if (o.rot) ctx.rotate(o.rot); if (o.sx !== undefined) ctx.scale(o.sx, 1);
    if (o.shadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.roundRect(-w / 2 + h * 0.02, -h / 2 + h * 0.03, w, h, r); ctx.fill(); }
    const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, C.plum1); g.addColorStop(0.45, C.plum2); g.addColorStop(1, C.plum0);
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); ctx.fill();
    // a soft sheen sweeping across
    const sh = o.sheen ?? 0.3;
    ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); ctx.clip();
    const sg = ctx.createLinearGradient(-w / 2 + (sh - 0.3) * w * 2, -h / 2, -w / 2 + (sh + 0.1) * w * 2, h / 2);
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,220,240,0.14)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sg; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,210,235,0.25)'; ctx.lineWidth = Math.max(1.5, h * 0.004); ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, r); ctx.stroke();
    // camera module: a vertical capsule with two lenses, and the ring flash below it
    const mx = -w / 2 + w * 0.28, cw = w * 0.36, top = -h / 2 + h * 0.045;
    ctx.fillStyle = '#4A1A35'; ctx.beginPath(); ctx.roundRect(mx - cw / 2, top, cw, h * 0.37, cw / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(230,200,215,0.55)'; ctx.lineWidth = Math.max(1.5, h * 0.005); ctx.stroke();
    const lens = (ly, lr) => {
      ctx.fillStyle = '#D9C9D2'; ctx.beginPath(); ctx.arc(mx, ly, lr * 1.12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0B0B10'; ctx.beginPath(); ctx.arc(mx, ly, lr, 0, Math.PI * 2); ctx.fill();
      const lg = ctx.createRadialGradient(mx - lr * 0.3, ly - lr * 0.3, 0, mx, ly, lr * 0.7);
      lg.addColorStop(0, 'rgba(120,160,255,0.75)'); lg.addColorStop(1, 'rgba(20,20,40,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(mx, ly, lr * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(mx - lr * 0.32, ly - lr * 0.32, lr * 0.11, 0, Math.PI * 2); ctx.fill();
    };
    lens(top + cw * 0.5, cw * 0.36);
    lens(top + cw * 1.45, cw * 0.3);
    const fy = top + h * 0.37 + cw * 0.62;
    ctx.fillStyle = '#4A1A35'; ctx.beginPath(); ctx.arc(mx, fy, cw * 0.46, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#F1E6EC'; ctx.lineWidth = cw * 0.07; ctx.beginPath(); ctx.arc(mx, fy, cw * 0.3, 0, Math.PI * 2); ctx.stroke();
    // the wordmark
    ctx.save(); ctx.font = `700 ${Math.round(h * 0.042)}px Inter`; ctx.letterSpacing = `${(h * 0.012).toFixed(1)}px`;
    ctx.fillStyle = C.metal; ctx.textAlign = 'center'; ctx.fillText('JOVI', 0, h * 0.27); ctx.restore();
    ctx.restore();
  }
  const phoneFront = (ctx, cx, cy, h, t, o = {}) => UI.phone(ctx, cx, cy, h, cameraScreen, t, { rot: o.rot || 0, bezel: '#2A0F1E', shadow: true, sketch: false, dark: true, time: '10:24' });

  // ---------- the camera app (412 points wide) ----------
  const VF = { x: 0, y: 108, w: 412, h: 549 };
  const AIB = { x: 238, y: 600, w: 158, h: 44 }; // the "IA Câmera" button: same place, same look, every scene

  // the AI button itself (also drawn big on the end card)
  function aiButton(ctx, x, y, w, h, active, t, scale = 1) {
    const r = h / 2, k = scale;
    ctx.save();
    const breathe = 0.35 + 0.25 * (0.5 + 0.5 * Math.sin(t * 4));
    ctx.shadowColor = C.glow + (active > 0 ? 0.9 : breathe) + ')'; ctx.shadowBlur = (active > 0 ? 26 : 16) * k;
    if (active > 0) {
      const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#2F8CFF'); g.addColorStop(1, '#5FD0FF');
      ctx.fillStyle = g;
    } else ctx.fillStyle = 'rgba(10,14,26,0.82)';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = active > 0 ? 'rgba(255,255,255,0.65)' : C.blue; ctx.lineWidth = 2 * k; ctx.stroke();
    // sparkle icon
    const sx = x + h * 0.55, sy = y + h / 2, sr = h * 0.26;
    ctx.fillStyle = active > 0 ? '#FFFFFF' : C.blue2;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2, rad = i % 2 ? sr * 0.32 : sr; ctx.lineTo(sx + Math.cos(a) * rad, sy + Math.sin(a) * rad); }
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + sr * 0.95, sy - sr * 0.8, sr * 0.22, 0, Math.PI * 2); ctx.fill();
    UI.text(ctx, 'IA Câmera', x + h * 1.0, y + h / 2 + h * 0.17, { size: Math.round(h * 0.42), weight: 800, color: '#FFFFFF' });
    ctx.restore();
  }

  // the state of the app at time t (all from score.js)
  function appState(t) {
    const st = { vf: 'sun', e: 0, live: true, active: 0, panel: 0, line: null, status: null, chips: [], press: null, thumb: 'dark', alt: -1 };
    if (t >= ev.aiTap) { st.active = 1; st.panel = clamp((t - ev.aiTap) / 0.3); }
    if (t < ev.capture) {
      st.line = t >= S.vo[1].at - 0.1 ? 'l2' : null;
      st.status = t < S.vo[1].at ? 'listen' : t < ev.thinking ? null : t < ev.ready ? 'adjust1' : 'ready1';
      st.chips = S.adjust1;
      const steps = [[S.adjust1[1].t, 0.45], [S.adjust1[2].t, 0.3], [S.adjust1[3].t, 0.25]];
      st.e = steps.reduce((a, [t0, d]) => a + d * ease.outCubic(clamp((t - t0) / 0.5)), 0);
    } else if (t < ev.capture2 + 0.1) { // second demo
      st.vf = 'run'; st.thumb = 'good';
      st.line = 'l4';
      st.status = t < S.adjust2[0].t ? null : t < ev.capture2 ? 'adjust2' : 'ready2';
      st.chips = S.adjust2;
      st.e = ease.outCubic(clamp((t - S.adjust2[1].t) / 0.35));
      st.press = ev.capture2;
    } else { // the hero: the two results alternate, with the command that made each
      const a = S.alternate.filter((x) => t >= x.t).pop();
      st.alt = a ? a.which : 0;
      st.vf = st.alt === 1 ? 'run' : 'sun'; st.e = 1; st.live = false; st.thumb = 'good';
      st.status = 'done'; st.chips = [];
    }
    if (t >= ev.aiTap - 0.05 && t < ev.capture) st.press = ev.capture;
    return st;
  }

  function icon(ctx, kind, x, y, r) {
    ctx.save(); ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = r * 0.16; ctx.lineCap = 'round';
    if (kind === 'face') { ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y + r * 0.08, r * 0.24, 0.2, Math.PI - 0.2); ctx.stroke(); }
    else if (kind === 'expo') { ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, Math.PI * 2); ctx.fill(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45); ctx.lineTo(x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66); ctx.stroke(); } }
    else if (kind === 'hdr') UI.text(ctx, 'HDR', x, y + r * 0.22, { size: Math.round(r * 0.62), weight: 800, color: '#FFFFFF', align: 'center' });
    else if (kind === 'wb') { ctx.beginPath(); ctx.arc(x, y, r * 0.5, Math.PI / 2, Math.PI * 1.5); ctx.fill(); ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, Math.PI * 2); ctx.stroke(); }
    else if (kind === 'run') { for (const [dy, l] of [[-0.3, 0.7], [0, 0.9], [0.3, 0.6]]) { ctx.beginPath(); ctx.moveTo(x - r * 0.5, y + dy * r); ctx.lineTo(x - r * 0.5 + l * r, y + dy * r); ctx.stroke(); } }
    else if (kind === 'shutter') { ctx.beginPath(); ctx.arc(x, y, r * 0.52, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.52, y + Math.sin(a) * r * 0.52); ctx.lineTo(x + Math.cos(a + 1.2) * r * 0.2, y + Math.sin(a + 1.2) * r * 0.2); ctx.stroke(); } }
    else if (kind === 'focus') { const q = r * 0.5, l = r * 0.22; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.moveTo(x + sx * q, y + sy * (q - l)); ctx.lineTo(x + sx * q, y + sy * q); ctx.lineTo(x + sx * (q - l), y + sy * q); ctx.stroke(); } ctx.beginPath(); ctx.arc(x, y, r * 0.12, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function chip(ctx, x, y, c, t) {
    const p = UI.pop(t, c.t, 0.28, 2);
    if (p <= 0) return;
    const lw = UI.measure(ctx, c.label, 17, 700), vw = c.val ? UI.measure(ctx, c.val, 17, 800) + 12 : 0;
    const w = 58 + lw + vw, h = 42;
    ctx.save(); ctx.translate(x, y + h / 2); ctx.scale(p, p); ctx.translate(-x, -(y + h / 2));
    rr(ctx, x, y, w, h, 21, 'rgba(8,12,22,0.8)');
    glowRR(ctx, x, y, w, h, 21, 0.5 * pulse(t, c.t, 4) + 0.15, 14);
    icon(ctx, c.icon, x + 22, y + h / 2, 15);
    UI.text(ctx, c.label, x + 44, y + 28, { size: 17, weight: 700, color: '#FFFFFF' });
    if (c.val) UI.text(ctx, c.val, x + 44 + lw + 10, y + 28, { size: 17, weight: 800, color: C.blue2 });
    ctx.restore();
  }
  function waveform(ctx, x, y, w, h, t, level) {
    const n = 30, bw = w / n;
    ctx.save(); ctx.fillStyle = C.blue2; ctx.shadowColor = C.glow + '0.8)'; ctx.shadowBlur = 8;
    for (let i = 0; i < n; i++) {
      const env = 0.5 + 0.5 * Math.sin(t * 9 + i * 0.75) * Math.cos(t * 5.3 - i * 0.4);
      const shape = Math.sin(Math.PI * (i + 0.5) / n);
      const a = Math.max(0.06, level * (0.35 + 0.65 * env) * shape);
      const bh = Math.max(4, a * h);
      ctx.beginPath(); ctx.roundRect(x + i * bw + bw * 0.22, y - bh / 2, bw * 0.56, bh, bw * 0.28); ctx.fill();
    }
    ctx.restore();
  }
  // words of a line as they are spoken, wrapped in the panel
  function transcript(ctx, id, x, y, maxW, t, size) {
    const l = voLine(id);
    if (!l) return;
    const ws = l.words.filter((w) => t >= w.t - 0.02).map((w) => w.w);
    if (!ws.length) return;
    const all = l.words.map((w) => w.w);
    const lines = [[]]; let lw = 0;
    const sp = UI.measure(ctx, ' ', size, 600);
    all.forEach((wd, i) => { const ww = UI.measure(ctx, wd, size, 600); if (lines[lines.length - 1].length && lw + sp + ww > maxW) { lines.push([]); lw = 0; } lines[lines.length - 1].push(i); lw += (lw ? sp : 0) + ww; });
    lines.forEach((ln, li) => {
      let xx = x;
      for (const i of ln) {
        if (i >= ws.length) break;
        UI.text(ctx, (i === 0 ? '“' : '') + all[i] + (i === all.length - 1 ? '”' : ''), xx, y + li * size * 1.3, { size, weight: 600, color: '#FFFFFF' });
        xx += UI.measure(ctx, (i === 0 ? '“' : '') + all[i], size, 600) + sp;
      }
    });
  }

  function cameraScreen(ctx, w, h, t) {
    const st = appState(t);
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, w, h);
    // top bar: flash, HDR, timer, settings
    const hdrOn = st.vf === 'sun' ? t >= S.adjust1[2].t : true;
    ctx.save(); ctx.strokeStyle = '#FFFFFF'; ctx.fillStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(44, 66); ctx.lineTo(34, 84); ctx.lineTo(44, 84); ctx.lineTo(38, 100); ctx.lineTo(52, 78); ctx.lineTo(42, 78); ctx.closePath(); ctx.stroke(); // flash
    ctx.beginPath(); ctx.arc(300, 83, 13, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(300, 83); ctx.lineTo(300, 75); ctx.stroke(); // timer
    ctx.beginPath(); ctx.arc(368, 83, 9, 0, Math.PI * 2); ctx.stroke(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(368 + Math.cos(a) * 11, 83 + Math.sin(a) * 11); ctx.lineTo(368 + Math.cos(a) * 15, 83 + Math.sin(a) * 15); ctx.stroke(); }
    ctx.restore();
    if (hdrOn) { rr(ctx, 160, 68, 92, 30, 15, C.blue); UI.text(ctx, 'HDR', 206, 89, { size: 15, weight: 800, color: '#FFFFFF', align: 'center' }); }
    else { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(160, 68, 92, 30, 15); ctx.stroke(); UI.text(ctx, 'HDR', 206, 89, { size: 15, weight: 700, color: '#FFFFFF', align: 'center' }); }
    if (hdrOn && st.vf === 'sun' && t < ev.capture) glowRR(ctx, 160, 68, 92, 30, 15, 0.8 * pulse(t, S.adjust1[2].t, 3), 18);

    // viewfinder
    photo(ctx, VF.x, VF.y, VF.w, VF.h, st.vf, st.e, t, { live: st.live });
    if (st.active) { // the AI frame: a soft blue border while it works
      const a = 0.35 + 0.25 * Math.sin(t * 3);
      glowRR(ctx, VF.x + 4, VF.y + 4, VF.w - 8, VF.h - 8, 18, a * st.panel, 22);
    }
    // face box once a face is found
    if (st.vf === 'sun' && t >= S.adjust1[0].t && t < ev.capture) {
      const p = UI.pop(t, S.adjust1[0].t, 0.25, 2), fx = VF.x + (330 / 600) * VF.w, fy = VF.y + (376 / 800) * VF.h, fr = 92 * p;
      ctx.save(); ctx.strokeStyle = C.blue2; ctx.lineWidth = 3; ctx.shadowColor = C.glow + '0.9)'; ctx.shadowBlur = 10;
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.moveTo(fx + sx * fr, fy + sy * (fr - 22)); ctx.lineTo(fx + sx * fr, fy + sy * fr); ctx.lineTo(fx + sx * (fr - 22), fy + sy * fr); ctx.stroke(); }
      ctx.restore();
    }
    // the adjustment chips, stacked over the viewfinder
    st.chips.forEach((c, i) => chip(ctx, 14, VF.y + 14 + i * 50, c, t));
    // the alternating result: a small badge with the command that made it
    if (st.alt >= 0) {
      const txt = st.alt === 1 ? '“correndo, sem ficar tremida”' : '“contra o sol, sem rosto escuro”';
      const tw = UI.measure(ctx, txt, 16, 700) + 28;
      rr(ctx, (w - tw) / 2, VF.y + 16, tw, 36, 18, 'rgba(8,12,22,0.8)');
      UI.text(ctx, txt, w / 2, VF.y + 40, { size: 16, weight: 700, color: '#FFFFFF', align: 'center' });
    }
    aiButton(ctx, AIB.x, AIB.y, AIB.w, AIB.h, st.active, t);

    // under the viewfinder: the modes, or the AI panel
    const pa = st.panel;
    if (pa < 1) {
      ctx.save(); ctx.globalAlpha = 1 - pa;
      ['NOITE', 'RETRATO', 'FOTO', 'VÍDEO', 'PRO'].forEach((md, i) => UI.text(ctx, md, 46 + i * 80, 712, { size: 14, weight: md === 'FOTO' ? 800 : 600, color: md === 'FOTO' ? '#FFD84A' : '#C9CFDB', align: 'center' }));
      ctx.restore();
    }
    if (pa > 0) {
      ctx.save(); ctx.globalAlpha = pa; ctx.translate(0, (1 - ease.outCubic(pa)) * 20);
      rr(ctx, 12, 668, 388, 152, 22, '#0E1422');
      glowRR(ctx, 12, 668, 388, 152, 22, 0.45, 16);
      // mic
      const mo = Subs.mouth(VO, t, 'bia');
      const speaking = st.line && mo.talking && t < ev.capture2;
      const mr = 25 + (speaking ? 4 * mo.open : 0);
      ctx.save(); ctx.shadowColor = C.glow + '0.9)'; ctx.shadowBlur = speaking ? 24 : 12;
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(52, 712, mr, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(46, 698, 12, 20, 6); ctx.fill();
      ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(52, 711, 11, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(52, 722); ctx.lineTo(52, 727); ctx.stroke();
      // the wave listens to the voice
      const level = speaking ? 0.25 + 0.75 * clamp(mo.open * 1.4) : st.status === 'listen' ? 0.16 : 0.07;
      waveform(ctx, 92, 712, 296, 44, t, level);
      // what she said (word by word) or what the AI is doing
      if (st.line) transcript(ctx, st.line, 26, 758, 360, t, 17);
      if (st.alt >= 0) UI.text(ctx, st.alt === 1 ? '“Agora, uma foto minha correndo…”' : '“Quero uma foto contra o sol…”', 26, 762, { size: 17, weight: 600, color: '#FFFFFF' });
      const stx = { listen: 'Estou ouvindo… descreva sua foto', adjust1: 'Ajustando luz e exposição…', ready1: 'Pronto! Toque para fotografar', adjust2: 'Ajustando para movimento…', ready2: 'Pronto!', done: 'A IA configurou tudo para você' }[st.status];
      if (stx) {
        const y2 = st.line ? 806 : st.alt >= 0 ? 792 : 762;
        const spin = st.status === 'adjust1' || st.status === 'adjust2';
        const done = st.status === 'ready1' || st.status === 'ready2' || st.status === 'done';
        ctx.save();
        if (spin) { ctx.strokeStyle = C.blue2; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(36, y2 - 6, 8, t * 8, t * 8 + 4.2); ctx.stroke(); }
        if (done) { ctx.strokeStyle = '#6EE7A8'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(29, y2 - 6); ctx.lineTo(35, y2); ctx.lineTo(45, y2 - 12); ctx.stroke(); }
        UI.text(ctx, stx, spin || done ? 54 : 26, y2, { size: 16, weight: 700, color: done ? '#6EE7A8' : C.blue2 });
        ctx.restore();
      }
      ctx.restore();
    }
    // shutter row: gallery thumbnail, shutter, flip
    const sy = 868;
    ctx.save(); ctx.beginPath(); ctx.roundRect(46, sy - 24, 48, 48, 10); ctx.clip();
    photo(ctx, 46, sy - 24, 48, 64, st.thumb === 'good' ? 'sun' : 'sun', st.thumb === 'good' ? 1 : 0, t, {});
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(46, sy - 24, 48, 48, 10); ctx.stroke();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(w / 2, sy, 38, 0, Math.PI * 2); ctx.stroke();
    const pr = st.press !== null && t >= st.press ? 1 - 0.22 * pulse(t, st.press, 10) : 1;
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(w / 2, sy, 30 * pr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(342, sy, 18, 0.4, Math.PI - 0.2); ctx.stroke(); ctx.beginPath(); ctx.arc(342, sy, 18, Math.PI + 0.4, -0.2); ctx.stroke();
  }
  cameraScreen.dark = true;

  // ---------- small labels in the world ----------
  function conceptTag(ctx, t, a = 1) {
    if (a <= 0) return;
    const txt = 'PROTÓTIPO CONCEITUAL • criado pelo grupo';
    const tw = UI.measure(ctx, txt, 24, 700, 1) + 44;
    ctx.save(); ctx.globalAlpha = a;
    rr(ctx, SAFE.x, SAFE.y + 6, tw, 46, 23, 'rgba(8,12,22,0.72)');
    ctx.strokeStyle = 'rgba(124,198,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(SAFE.x, SAFE.y + 6, tw, 46, 23); ctx.stroke();
    ctx.fillStyle = C.blue2; ctx.beginPath(); ctx.arc(SAFE.x + 22, SAFE.y + 29, 6, 0, Math.PI * 2); ctx.fill();
    UI.text(ctx, txt, SAFE.x + 36, SAFE.y + 38, { size: 24, weight: 700, color: '#FFFFFF', spacing: 1 });
    ctx.restore();
  }
  function tag(ctx, text, x, y, t, t0, o = {}) {
    const p = UI.pop(t, t0, 0.3, 2);
    if (p <= 0) return;
    const size = o.size || 34, tw = UI.measure(ctx, text, size, 800) + size * 1.2, h = size * 1.7;
    ctx.save(); ctx.translate(x, y); ctx.scale(p, p); if (o.rot) ctx.rotate(o.rot);
    rr(ctx, -tw / 2, -h / 2, tw, h, h / 2, o.bg || 'rgba(8,12,22,0.86)');
    if (o.glow) glowRR(ctx, -tw / 2, -h / 2, tw, h, h / 2, 0.6, 18);
    UI.text(ctx, text, 0, size * 0.36, { size, weight: 800, color: o.color || '#FFFFFF', align: 'center' });
    ctx.restore();
  }
  function flash(ctx, t, t0, a = 0.9, k = 9) { const f = a * Math.exp(-(t - t0) * k); if (t >= t0 && f > 0.01) { ctx.fillStyle = `rgba(255,255,255,${f})`; ctx.fillRect(0, 0, W, H); } }
  function darkBg(ctx, t, glowY = 860) {
    ctx.fillStyle = C.night; ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, glowY, 40, W / 2, glowY, 900);
    g.addColorStop(0, 'rgba(40,90,170,0.45)'); g.addColorStop(0.5, 'rgba(20,40,90,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // a hand's thumb reaching for the AI button (in phone screen space → page space, given the phone box)
  function thumb(ctx, px, py, t) {
    const a = clamp((t - (ev.aiTap - 0.7)) / 0.6), back = clamp((t - (ev.aiTap + 0.25)) / 0.6);
    const u = ease.outCubic(a) * (1 - ease.inCubic(back));
    if (u <= 0.01) return;
    const x = lerp(px + 260, px, u), y = lerp(py + 520, py + 8, u);
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.55);
    ctx.fillStyle = BIA.skin; ctx.beginPath(); ctx.roundRect(-34, 0, 68, 420, 34); ctx.fill();
    ctx.fillStyle = Ch.shade(BIA.skin, 0.88); ctx.beginPath(); ctx.roundRect(-34, 180, 68, 240, 30); ctx.fill();
    ctx.fillStyle = '#E9C8B5'; ctx.beginPath(); ctx.roundRect(-22, 8, 44, 52, 18); ctx.fill();
    ctx.restore();
  }

  // ---------- SCENE 1 (0–6): the challenge ----------
  function shotChallenge(ctx, t) {
    const push = 1 + 0.04 * clamp(t / 6);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(push, push); ctx.translate(-W / 2, -H / 2);
    scenery(ctx, 0, 0, W, H, 1, 300, 520, 'campus');
    const shot = t >= ev.selfie, looking = t >= ev.darkPop && t < 3.2;
    const talking = mouthAt(t, null);
    const hand = !shot ? [130, -440] : t < 3.2 ? [120, -430] : [70, -330];
    bia(ctx, {
      x: 640, y: 1720, s: 2.25, look: looking ? -0.9 : !shot ? 0.6 : -0.1, lookY: !shot ? -0.35 : looking ? -0.1 : 0.1,
      eyes: !shot ? 'happy' : 'normal', brows: shot ? 'worried' : 'up', mouth: talking || (!shot ? 'smile' : 'wavy'), handR: hand,
    });
    // the JOVI in her hand: we see its back (camera + wordmark)
    const hx = 640 + hand[0] * 2.25, hy = 1720 + hand[1] * 2.25;
    phoneBack(ctx, hx + 6, hy - 40, 300, { rot: 0.12, sheen: 0.4 + 0.1 * Math.sin(t) });
    ctx.restore();
    // click + the dark result
    flash(ctx, t, ev.selfie, 0.85, 8);
    const pp = UI.pop(t, ev.darkPop, 0.35, 1.8);
    if (pp > 0) {
      ctx.save(); ctx.translate(330, 640); ctx.rotate(-0.05); ctx.scale(pp, pp);
      ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.roundRect(-218, -284, 436, 568, 18); ctx.fill(); ctx.shadowBlur = 0;
      photo(ctx, -200, -266, 400, 532, 'sun', 0, t, { r: 10, mouth: 'flat' });
      ctx.restore();
      tag(ctx, 'Rosto escuro', 330, 1000, t, ev.darkPop + 0.5, { size: 36, rot: -0.05, color: '#FFB3B3' });
      tag(ctx, 'Fundo estourado', 330, 1080, t, ev.darkPop + 0.9, { size: 30, rot: -0.05, color: '#FFE8A3' });
    }
  }

  // ---------- phone close-ups (scenes 2–4) ----------
  const PH = { cx: 540, cy: 860, h: 1080 };
  function phoneShot(ctx, t, cam) {
    darkBg(ctx, t);
    ctx.save(); ctx.globalAlpha = 0.25; ctx.filter = 'blur(18px)'; scenery(ctx, -100, -100, W + 200, H + 200, 0.6, 300, 500, 'campus'); ctx.restore();
    ctx.fillStyle = 'rgba(7,9,15,0.55)'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (cam) { ctx.translate(cam.x, cam.y); ctx.scale(cam.z, cam.z); ctx.translate(-cam.fx, -cam.fy); }
    const rise = ease.outCubic(clamp((t - ev.cutApp) / 0.45));
    const cy = t < ev.cutApp + 0.5 ? lerp(PH.cy + 500, PH.cy, rise) : PH.cy;
    phoneFront(ctx, PH.cx, cy, PH.h, t);
    // page position of the AI button (for the thumb)
    const k = (PH.h * PH_RATIO - 2 * PH.h * 0.016) / 412;
    const sx = PH.cx - (PH.h * PH_RATIO - 2 * PH.h * 0.016) / 2, sy = cy - (PH.h - 2 * PH.h * 0.016) / 2;
    if (t > ev.aiTap - 1 && t < ev.aiTap + 1) {
      UI.tap(ctx, sx + (AIB.x + AIB.w / 2) * k, sy + (AIB.y + AIB.h / 2) * k, t, ev.aiTap, { color: 'rgba(124,198,255,0.9)', size: 110 });
      thumb(ctx, sx + (AIB.x + AIB.w / 2) * k + 20, sy + (AIB.y + AIB.h / 2) * k + 10, t);
    }
    ctx.restore();
  }
  // a camera that moves smoothly between framings: {fx, fy} = page point to centre, z = zoom
  function camAt(t, keys) {
    let a = keys[0], b = keys[0];
    for (let i = 0; i < keys.length; i++) { if (t >= keys[i][0]) { a = keys[i]; b = keys[i + 1] || keys[i]; } }
    const u = b === a ? 1 : ease.inOutCubic(clamp((t - a[0]) / Math.max(0.01, Math.min(1.2, b[0] - a[0]))));
    return { x: W / 2, y: H / 2 - 40, fx: lerp(a[1], b[1], u), fy: lerp(a[2], b[2], u), z: lerp(a[3], b[3], u) };
  }
  const CAM2 = [[ev.cutApp, 540, 900, 1.0], [ev.aiTap + 0.6, 540, 900, 1.0], [S.vo[1].at - 0.5, 540, 1080, 1.38], [ev.thinking - 0.3, 540, 1080, 1.38], [ev.thinking + 0.5, 540, 760, 1.18], [ev.capture, 540, 760, 1.18]];
  const CAM4 = [[ev.demo2, 540, 1080, 1.38], [S.adjust2[0].t - 0.4, 540, 1080, 1.38], [S.adjust2[0].t + 0.2, 540, 760, 1.18], [ev.capture2, 540, 760, 1.18]];

  // ---------- SCENE 4: before / after, reaction, the running result ----------
  function shotCompare(ctx, t) {
    darkBg(ctx, t, 820);
    const cw = 860, ch = 1146, x = (W - cw) / 2, y = 290;
    ctx.save(); ctx.shadowColor = 'rgba(61,165,255,0.45)'; ctx.shadowBlur = 50; rr(ctx, x - 10, y - 10, cw + 20, ch + 20, 30, '#151B2A'); ctx.restore();
    const u = ease.inOutCubic(clamp((t - ev.compare0) / (ev.compare1 - ev.compare0)));
    const split = x + cw * (1 - u); // the "after" is revealed from the right
    photo(ctx, x, y, cw, ch, 'sun', 0, t, { r: 22, mouth: 'flat' });
    ctx.save(); ctx.beginPath(); ctx.rect(split, y, x + cw - split, ch); ctx.clip();
    photo(ctx, x, y, cw, ch, 'sun', 1, t, { r: 22 });
    ctx.restore();
    if (u > 0 && u < 1) {
      ctx.save(); ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = C.glow + '1)'; ctx.shadowBlur = 20; ctx.fillRect(split - 3, y, 6, ch);
      ctx.beginPath(); ctx.arc(split, y + ch / 2, 34, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.fillStyle = C.blue; ctx.beginPath(); ctx.moveTo(split - 18, y + ch / 2); ctx.lineTo(split - 6, y + ch / 2 - 12); ctx.lineTo(split - 6, y + ch / 2 + 12); ctx.fill();
      ctx.beginPath(); ctx.moveTo(split + 18, y + ch / 2); ctx.lineTo(split + 6, y + ch / 2 - 12); ctx.lineTo(split + 6, y + ch / 2 + 12); ctx.fill();
    }
    const la = 1 - clamp((u - 0.85) / 0.15);
    if (la > 0) { ctx.save(); ctx.globalAlpha = la; tag(ctx, 'ANTES', x + 120, y + 60, t, ev.capture + 0.25, { size: 30 }); ctx.restore(); }
    if (u > 0.15) tag(ctx, 'DEPOIS', x + cw - 130, y + 60, t, ev.compare0 + 0.2, { size: 30, bg: C.blue });
    if (t >= ev.compare1) {
      tag(ctx, 'Rosto iluminado', W / 2, y + ch - 150, t, ev.compare1 + 0.05, { size: 34, glow: true });
      tag(ctx, 'Fundo preservado', W / 2, y + ch - 70, t, ev.compare1 + 0.35, { size: 34, glow: true });
    }
    flash(ctx, t, ev.capture, 0.95, 7);
  }
  function shotReaction(ctx, t) {
    scenery(ctx, 0, 0, W, H, 1, 300, 520, 'campus');
    const talking = mouthAt(t, null);
    const hop = 18 * Math.abs(Math.sin((t - ev.reaction) * Math.PI * 2));
    bia(ctx, { x: 560, y: 1760 - hop, s: 2.3, eyes: talking ? 'wide' : 'happy', brows: 'up', mouth: talking || 'grin', blush: 0.6, look: 0.2, lookY: 0.15, handR: [80, -360], handL: [-160, -560] });
    phoneBack(ctx, 560 + 80 * 2.3 + 6, 1760 - hop - 360 * 2.3 - 36, 300, { rot: 0.1, sheen: 0.5 });
    for (let i = 0; i < 6; i++) {
      const a = t - ev.reaction - i * 0.12;
      if (a < 0 || a > 1.4) continue;
      const ang = -Math.PI / 2 + (i - 2.5) * 0.45, d = 280 + a * 160;
      G.star(ctx, 560 + Math.cos(ang) * d, 720 + Math.sin(ang) * d * 0.7, 26 * (1 - a / 1.4), { fill: i % 2 ? '#FFD84A' : C.blue2, rot: a * 3 });
    }
    tag(ctx, 'Uau!', 820, 520, t, S.vo[2].at, { size: 64, rot: 0.06, bg: C.blue });
  }
  function shotRunResult(ctx, t) {
    darkBg(ctx, t, 820);
    const cw = 860, ch = 1146, x = (W - cw) / 2, y = 290;
    ctx.save(); ctx.shadowColor = 'rgba(61,165,255,0.45)'; ctx.shadowBlur = 50; rr(ctx, x - 10, y - 10, cw + 20, ch + 20, 30, '#151B2A'); ctx.restore();
    photo(ctx, x, y, cw, ch, 'run', 1, t, { r: 22 });
    tag(ctx, 'Nítida, sem borrão', W / 2, y + ch - 150, t, ev.capture2 + 0.3, { size: 36, glow: true });
    tag(ctx, '1/2000 s', W / 2, y + ch - 70, t, ev.capture2 + 0.55, { size: 32, bg: C.blue });
    flash(ctx, t, ev.capture2, 0.95, 7);
  }

  // ---------- SCENE 5: the hero, the tagline, the end card ----------
  function shotHero(ctx, t) {
    darkBg(ctx, t, 820);
    // light streaks behind the phone
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) { const yy = 400 + i * 230 + Math.sin(t * 0.6 + i) * 30; const g = ctx.createLinearGradient(0, yy, W, yy); g.addColorStop(0, 'rgba(61,165,255,0)'); g.addColorStop(0.5, `rgba(61,165,255,${0.08 + 0.05 * Math.sin(t + i)})`); g.addColorStop(1, 'rgba(61,165,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, yy - 2, W, 4); }
    ctx.restore();
    const tl = ease.inOutCubic(clamp((t - ev.tagline) / 0.7)); // the phone steps back for the tagline
    const h = lerp(1100, 620, tl), cy = lerp(860, 1110, tl);
    const a = Math.PI * ease.inOutCubic(clamp((t - ev.flip[0]) / (ev.flip[1] - ev.flip[0])));
    const c = Math.cos(a), sc = Math.max(0.02, Math.abs(c));
    const float = Math.sin((t - ev.hero) * 1.6) * 10;
    const intro = ease.outBack(clamp((t - ev.hero) / 0.5), 1.2);
    ctx.save(); ctx.translate(W / 2, cy + float); ctx.scale(intro * sc, intro); ctx.translate(-W / 2, -(cy + float));
    if (c > 0) phoneBack(ctx, W / 2, cy + float, h, { sheen: 0.2 + 0.3 * clamp((t - ev.hero) / 2) });
    else phoneFront(ctx, W / 2, cy + float, h, t);
    ctx.restore();
    // the tagline, word group by word group as she says it
    S.tagWords.forEach((w, i) => {
      const p = UI.fadeIn(t, w.t, 0.3);
      if (p <= 0) return;
      UI.text(ctx, w.w, W / 2, 470 + i * 104 + (1 - p) * 20, { size: 76, weight: 800, color: i ? C.blue2 : '#FFFFFF', align: 'center', alpha: p, maxW: SAFE.w });
    });
    flash(ctx, t, ev.hero, 0.6, 8);
  }
  function shotEnd(ctx, t) {
    darkBg(ctx, t, 760);
    S.tagWords.forEach((w, i) => UI.text(ctx, w.w, W / 2, 470 + i * 104, { size: 76, weight: 800, color: i ? C.blue2 : '#FFFFFF', align: 'center', maxW: SAFE.w }));
    const bp = UI.pop(t, ev.endCard, 0.45, 1.8);
    if (bp > 0) { ctx.save(); ctx.translate(W / 2, 800); ctx.scale(bp, bp); aiButton(ctx, -230, -64, 460, 128, 1, t, 2.6); ctx.restore(); }
    // "JOVI IA Câmera | Fotografia do seu jeito."
    const wp = UI.fadeIn(t, ev.endCard + 0.3, 0.35);
    const a = 'JOVI IA Câmera', b = 'Fotografia do seu jeito.', sep = '  |  ';
    let size = 50;
    const total = (s) => UI.measure(ctx, a, s, 800) + UI.measure(ctx, sep, s, 400) + UI.measure(ctx, b, s, 400);
    while (total(size) > SAFE.w - 10 && size > 30) size -= 1;
    let x = W / 2 - total(size) / 2;
    const y = 1010 + (1 - wp) * 16;
    UI.text(ctx, a, x, y, { size, weight: 800, color: '#FFFFFF', alpha: wp }); x += UI.measure(ctx, a, size, 800);
    UI.text(ctx, sep, x, y, { size, weight: 400, color: C.blue, alpha: wp }); x += UI.measure(ctx, sep, size, 400);
    UI.text(ctx, b, x, y, { size, weight: 400, color: '#DDE3EE', alpha: wp });
    const dp = UI.fadeIn(t, ev.endCard + 0.8, 0.4);
    UI.text(ctx, 'Protótipo conceitual desenvolvido pelo grupo.', W / 2, 1360, { size: 28, weight: 600, color: C.muted, align: 'center', alpha: dp });
    UI.text(ctx, 'Recurso ainda não disponível nos celulares JOVI.', W / 2, 1402, { size: 28, weight: 600, color: C.muted, align: 'center', alpha: dp });
    flash(ctx, t, ev.endCard, 0.7, 8);
  }

  // everything the 3D film reuses
  globalThis.L2 = {
    C, BIA, mix, rr, glowRR, fade, scenery, bia, photo, phoneBack, aiButton, appState, chip, icon, waveform, transcript, cameraScreen,
    conceptTag, tag, flash, darkBg, thumb, shotChallenge, shotReaction, AIB, VF,
    setVO(vo) { VO = vo; },
  };
})();
