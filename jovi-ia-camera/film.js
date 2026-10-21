// THE FILM (9:16) v2 — a 3D product film: the JOVI phone in three.js (scene3d.js), its live camera UI on the
// screen, holographic AI callouts, floating photo cards, and punchy transitions. The scenes with the girl
// (lib2d.js) are placeholders until the group's own footage replaces them.
(function () {
  const U = globalThis.U, G = globalThis.G, UI = globalThis.UI, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev, BEAT } = S;
  const { clamp, lerp, ease, pulse } = U;
  const W = G.W, H = G.H, SAFE = G.SAFE;
  let L2, J3, THREE, VO = null, SUBS = [];

  // ---------- small maths ----------
  const io = ease.inOutCubic;
  // keyframes: [[t, {a: 1, b: 2}], …] → eased values at t
  function kf(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, a] = keys[i], [t1, b] = keys[i + 1];
      if (t < t1) { const u = io(clamp((t - t0) / (t1 - t0))); const o = {}; for (const k in a) o[k] = lerp(a[k], b[k] ?? a[k], u); return o; }
    }
    return keys[keys.length - 1][1];
  }
  const P = (o) => Object.assign({ rx: 0, ry: 0, rz: 0, px: 0, py: 0, pz: 0, s: 1, cx: 0, cy: 0, cz: 5, lx: 0, ly: 0, lz: 0, fov: 30, env: 0 }, o);

  // phone-local points of the UI (screen points → world units)
  let SCR_H = 910;
  const local = (xPt, yPt) => [(xPt / 412) * J3.dims.SW - J3.dims.SW / 2, J3.dims.SH / 2 - (yPt / SCR_H) * J3.dims.SH];

  // ---------- the phone screen: the same camera UI as before, drawn at 2× into the 3D screen texture ----------
  function drawScreen(t, mode = 'app') {
    const { ctx, tex } = J3.screen;
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    if (mode === 'home' || (mode === 'app' && t < ev.cutApp + 0.75)) {
      // home screen → the camera app opens from its icon
      const g = ctx.createLinearGradient(0, 0, 412, SCR_H); g.addColorStop(0, '#2B0E22'); g.addColorStop(0.55, '#14183A'); g.addColorStop(1, '#071330');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 412, SCR_H);
      const rg = ctx.createRadialGradient(300, 260, 10, 300, 260, 320); rg.addColorStop(0, 'rgba(61,165,255,0.45)'); rg.addColorStop(1, 'rgba(61,165,255,0)'); ctx.fillStyle = rg; ctx.fillRect(0, 0, 412, SCR_H);
      UI.text(ctx, '10:24', 206, 200, { size: 64, weight: 800, color: '#FFFFFF', align: 'center' });
      UI.text(ctx, 'quarta-feira, 21 de outubro', 206, 236, { size: 16, weight: 600, color: 'rgba(255,255,255,0.8)', align: 'center' });
      const icons = [['#1E1E24', 'cam'], ['#3DA5FF', ''], ['#E8608C', ''], ['#2EC27E', '']];
      icons.forEach(([c, k], i) => {
        const x = 60 + i * 97, y = 790;
        const press = k === 'cam' ? 1 - 0.12 * pulse(t, ev.cutApp + 0.45, 10) * (t > ev.cutApp + 0.45 ? 1 : 0) : 1;
        ctx.save(); ctx.translate(x, y); ctx.scale(press, press);
        ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(-32, -32, 64, 64, 18); ctx.fill();
        if (k === 'cam') { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-18, -12, 36, 26, 6); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 1, 8, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#3DA5FF'; ctx.beginPath(); ctx.arc(12, -6, 3, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
      });
      if (mode === 'app' && t > ev.cutApp + 0.45) { // the app grows out of the icon
        const u = ease.outCubic(clamp((t - (ev.cutApp + 0.45)) / 0.3));
        ctx.save(); ctx.beginPath(); ctx.arc(lerp(60, 206, u), lerp(790, SCR_H / 2, u), lerp(30, 560, u), 0, Math.PI * 2); ctx.clip();
        L2.cameraScreen(ctx, 412, SCR_H, t); ctx.restore();
      }
    } else L2.cameraScreen(ctx, 412, SCR_H, t);
    // status bar
    UI.text(ctx, '10:24', 34, 36, { size: 16, weight: 700, color: '#FFFFFF' });
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(350, 25, 28, 12, 3); ctx.fill(); ctx.fillRect(379, 28, 2, 6);
    // the tap ripple on the AI button
    if (t > ev.aiTap - 0.05 && t < ev.aiTap + 0.8) UI.tap(ctx, L2.AIB.x + L2.AIB.w / 2, L2.AIB.y + L2.AIB.h / 2, t, ev.aiTap, { color: 'rgba(160,215,255,0.95)', size: 70 });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    tex.needsUpdate = true;
  }

  // ---------- holographic callouts: one per AI decision, they fly out of the screen ----------
  const CALL1 = [
    { c: S.adjust1[0], k: 'ROSTO DETECTADO', v: 'Contraluz', side: -1, y: 0.52 },
    { c: S.adjust1[1], k: 'EXPOSIÇÃO NO ROSTO', v: '+1,3 EV', side: -1, y: 0.2 },
    { c: S.adjust1[2], k: 'HDR INTELIGENTE', v: 'ATIVO', side: -1, y: -0.12 },
    { c: S.adjust1[3], k: 'EQUILÍBRIO DE LUZ', v: '5600 K', side: -1, y: -0.44 },
  ];
  const CALL2 = [
    { c: S.adjust2[0], k: 'MOVIMENTO', v: 'Detectado', side: -1, y: 0.42 },
    { c: S.adjust2[1], k: 'OBTURADOR', v: '1/2000 s', side: -1, y: 0.08 },
    { c: S.adjust2[2], k: 'FOCO CONTÍNUO', v: 'ATIVO', side: -1, y: -0.26 },
  ];
  function paintCallout(it, d) {
    const { ctx, canvas, tex } = it, w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.shadowColor = 'rgba(80,170,255,0.9)'; ctx.shadowBlur = 28;
    ctx.fillStyle = 'rgba(10,22,46,0.78)'; ctx.beginPath(); ctx.roundRect(24, 24, w - 48, h - 48, 40); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#A8DBFF'; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(24, 24, w - 48, h - 48, 40); ctx.stroke();
    ctx.restore();
    L2.icon(ctx, d.c.icon, 120, h / 2, 56);
    UI.text(ctx, d.k, 196, h / 2 - 26, { size: 44, weight: 700, color: '#A8DBFF', spacing: 2, maxW: 760 });
    UI.text(ctx, d.v, 196, h / 2 + 66, { size: 104, weight: 800, color: '#FFFFFF', maxW: 760 });
    tex.needsUpdate = true;
  }
  function callouts(t, list, tag) {
    const v = new THREE.Vector3();
    list.forEach((d, i) => {
      const it = J3.card(`${tag}${i}`, 1000, 300, 0.6, 0.18, { bright: 0.96 });
      if (!it.painted) { paintCallout(it, d); it.painted = true; }
      const a = t - d.c.t;
      if (a < 0) { it.mesh.visible = false; return; }
      const u = ease.outBack(clamp(a / 0.5), 1.4), f = clamp(a / 0.25);
      // from the chip on the screen out to the side, in front of the glass
      const [sx, sy] = local(120, 150 + i * 50);
      const tx = d.side * 0.6, ty = d.y + Math.sin(t * 1.4 + i) * 0.015;
      v.set(lerp(sx, tx, u), lerp(sy, ty, u), lerp(0.05, 0.45, u));
      J3.phone.localToWorld(v);
      it.mesh.position.copy(v);
      it.mesh.quaternion.copy(J3.camera.quaternion);
      it.mesh.rotateY(-d.side * 0.12);
      const s = lerp(0.25, 1, clamp(u));
      it.mesh.scale.set(s, s, s);
      it.mat.opacity = f;
      it.mesh.visible = true;
    });
  }

  // ---------- photo cards ----------
  const photoCanvas = (() => { let c; return () => c || (c = Object.assign(document.createElement('canvas'), { width: 600, height: 800 })); })();
  function paintPhoto(it, kind, e, t, split = null) {
    const { ctx, canvas, tex } = it, w = canvas.width, h = canvas.height, m = 18;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#F7F8FB'; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 34); ctx.fill();
    if (split === null) L2.photo(ctx, m, m, w - 2 * m, h - 2 * m, kind, e, t, { r: 24 });
    else {
      L2.photo(ctx, m, m, w - 2 * m, h - 2 * m, kind, 0, t, { r: 24, mouth: 'flat' });
      const sx = m + (w - 2 * m) * split;
      ctx.save(); ctx.beginPath(); ctx.rect(sx, m, w - m - sx, h - 2 * m); ctx.clip();
      L2.photo(ctx, m, m, w - 2 * m, h - 2 * m, kind, 1, t, { r: 24 });
      ctx.restore();
      if (split > 0.001 && split < 0.999) {
        ctx.save(); ctx.shadowColor = 'rgba(80,170,255,1)'; ctx.shadowBlur = 30; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(sx - 4, m, 8, h - 2 * m);
        ctx.beginPath(); ctx.arc(sx, h / 2, 44, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#3DA5FF';
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sx + s * 26, h / 2); ctx.lineTo(sx + s * 8, h / 2 - 16); ctx.lineTo(sx + s * 8, h / 2 + 16); ctx.fill(); }
      }
    }
    tex.needsUpdate = true;
  }
  function placeCard(it, x, y, z, ry, rx, s, op = 1) {
    it.mesh.position.set(x, y, z); it.mesh.rotation.set(rx, ry, 0); it.mesh.scale.set(s, s, s); it.mat.opacity = op; it.mesh.visible = op > 0.001;
  }

  // ---------- poses (phone + camera) per shot ----------
  const BTN = () => local(L2.AIB.x + L2.AIB.w / 2, L2.AIB.y + L2.AIB.h / 2);
  function posePhoneShot(t) {
    const [bx, by] = BTN(), panelY = local(206, 744)[1];
    const K = [
      [ev.cutApp, P({ rx: 0.18, ry: Math.PI + 0.7, rz: 0.1, cz: 6.4, ly: 0.05 })],
      [ev.cutApp + 1.0, P({ rx: 0.06, ry: 0.32, rz: 0.03, cx: 0.35, cz: 5.0, ly: 0 })],
      [ev.aiTap - 0.35, P({ rx: 0.04, ry: 0.26, rz: 0.02, cx: 0.7, cy: -0.25, cz: 3.4, lx: bx * 0.6, ly: by * 0.8 })],
      [ev.aiTap + 0.6, P({ rx: 0.04, ry: 0.22, rz: 0.02, cx: 0.6, cy: -0.2, cz: 3.7, lx: bx * 0.5, ly: by * 0.6 })],
      [S.vo[1].at - 0.6, P({ rx: 0.02, ry: 0.08, cx: 0.15, cy: 0.05, cz: 4.9, lx: 0, ly: 0 })],
      [S.vo[1].at + 0.2, P({ rx: -0.1, ry: -0.26, cx: -0.4, cy: -0.75, cz: 3.0, lx: 0, ly: panelY * 0.8 })],
      [ev.thinking - 0.2, P({ rx: -0.1, ry: -0.2, cx: -0.3, cy: -0.7, cz: 2.8, lx: 0, ly: panelY * 0.8 })],
      [ev.thinking + 0.7, P({ rx: 0.05, ry: 0.2, cx: 0.05, cy: 0.05, cz: 5.3, lx: -0.24, ly: 0 })],
      [ev.capture, P({ rx: 0.04, ry: 0.1, cx: 0.0, cy: 0.05, cz: 5.0, lx: -0.22, ly: 0.02 })],
    ];
    return kf(t, K);
  }
  function poseDemo2(t) {
    const panelY = local(206, 744)[1];
    return kf(t, [
      [ev.demo2, P({ rx: -0.08, ry: 0.3, cx: 0.45, cy: -0.75, cz: 3.0, lx: 0, ly: panelY * 0.8 })],
      [S.adjust2[0].t - 0.5, P({ rx: -0.08, ry: 0.22, cx: 0.3, cy: -0.7, cz: 2.8, lx: 0, ly: panelY * 0.8 })],
      [S.adjust2[0].t + 0.3, P({ rx: 0.04, ry: 0.18, cx: 0.05, cy: 0.05, cz: 5.3, lx: -0.24, ly: 0 })],
      [ev.capture2, P({ rx: 0.04, ry: 0.1, cx: 0, cy: 0.05, cz: 5.0, lx: -0.22, ly: 0.02 })],
    ]);
  }
  function poseHero(t) {
    const TAU = Math.PI * 2;
    return kf(t, [
      [ev.hero, P({ rx: 0.14, ry: Math.PI - 0.55, rz: -0.06, cy: -0.75, cz: 4.9, ly: 0.25, env: 0 })],
      [ev.flip[0], P({ rx: 0.1, ry: Math.PI + 0.3, rz: -0.03, cy: -0.55, cz: 5.1, ly: 0.2, env: 1.2 })],
      [ev.flip[1], P({ rx: 0.04, ry: TAU + 0.12, rz: 0, cy: 0, cz: 5.8, ly: 0, env: 2.2 })],
      [ev.tagline, P({ rx: 0.04, ry: TAU - 0.1, rz: 0, cy: 0, cz: 5.8, ly: 0, env: 2.6 })],
      [ev.tagline + 0.8, P({ rx: 0.1, ry: TAU + 0.25, py: -0.62, s: 0.62, cy: 0, cz: 5.8, ly: 0, env: 3.0 })],
      [ev.endCard, P({ rx: 0.1, ry: TAU + 0.6, py: -0.62, s: 0.62, cy: 0, cz: 5.8, ly: 0, env: 3.6 })],
    ]);
  }
  function apply(p) {
    J3.phone.position.set(p.px, p.py, p.pz);
    J3.phone.rotation.set(p.rx, p.ry, p.rz);
    J3.phone.scale.setScalar(p.s);
    J3.phone.updateMatrixWorld(true);
    const look = new THREE.Vector3(p.lx, p.ly, p.lz); J3.phone.localToWorld(look);
    J3.camera.position.set(look.x + p.cx, look.y + p.cy, look.z + p.cz);
    J3.camera.fov = p.fov; J3.camera.updateProjectionMatrix();
    J3.camera.lookAt(look);
    J3.camera.updateMatrixWorld(true);
    J3.scene.environmentRotation.set(0, p.env, 0);
  }

  // ---------- 2D post transitions on the finished frame ----------
  let FX = null;
  const grab = (ctx) => {
    const c = ctx.canvas;
    if (!FX || FX.width !== c.width || FX.height !== c.height) { FX = document.createElement('canvas'); FX.width = c.width; FX.height = c.height; }
    const f = FX.getContext('2d'); f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, FX.width, FX.height); f.drawImage(c, 0, 0);
    return FX;
  };
  function zoomBlur(ctx, k, cx = 0.5, cy = 0.5) {
    if (k <= 0.01) return;
    const src = grab(ctx), w = src.width, h = src.height;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 1; i <= 7; i++) { const s = 1 + k * 0.22 * (i / 7); ctx.globalAlpha = 0.2; ctx.drawImage(src, cx * w - (cx * w) * s, cy * h - (cy * h) * s, w * s, h * s); }
    ctx.restore();
  }
  function whip(ctx, k, dir = 1) {
    if (k <= 0.01) return;
    const src = grab(ctx), w = src.width;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 1; i <= 8; i++) { ctx.globalAlpha = 0.16; ctx.drawImage(src, dir * k * i * w * 0.035, 0); }
    ctx.restore();
  }
  function glitch(ctx, k, t) {
    if (k <= 0.01) return;
    const src = grab(ctx), w = src.width, h = src.height, n = 18, fr = Math.floor(t * 30);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let i = 0; i < n; i++) {
      const y0 = Math.floor(U.hash(i, fr, 1) * h), sh = Math.floor((0.01 + 0.06 * U.hash(i, fr, 2)) * h), dx = (U.hash(i, fr, 3) - 0.5) * k * w * 0.18;
      ctx.drawImage(src, 0, y0, w, sh, dx, y0, w, sh);
      if (U.hash(i, fr, 4) > 0.7) { ctx.globalAlpha = 0.35 * k; ctx.fillStyle = U.hash(i, fr, 5) > 0.5 ? '#00E5FF' : '#FF2BD6'; ctx.fillRect(0, y0, w, Math.max(2, sh * 0.15)); ctx.globalAlpha = 1; }
    }
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.5 * k;
    ctx.drawImage(src, k * 14, 0); ctx.drawImage(src, -k * 14, 0);
    ctx.restore();
  }
  // a camera aperture: u = 0 open … 1 closed
  function iris(ctx, u, rot) {
    if (u <= 0.001) return;
    const R = Math.hypot(W, H) / 2, r = R * (1 - u), cx = W / 2, cy = H / 2;
    ctx.save(); ctx.fillStyle = '#05060A';
    ctx.beginPath(); ctx.rect(0, 0, W, H);
    for (let i = 0; i <= 6; i++) { const a = rot + (i / 6) * Math.PI * 2; if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(124,198,255,0.5)'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const a = rot + (i / 6) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); ctx.lineTo(cx + Math.cos(a + 1.1) * R * 1.2, cy + Math.sin(a + 1.1) * R * 1.2); ctx.stroke(); }
    ctx.restore();
  }
  const flash = (ctx, t, t0, a = 0.9, k = 9, col = '255,255,255') => { const f = a * Math.exp(-(t - t0) * k); if (t >= t0 && f > 0.01) { ctx.fillStyle = `rgba(${col},${f})`; ctx.fillRect(0, 0, W, H); } };
  const tri = (t, t0, d) => clamp(1 - Math.abs(t - t0) / d);

  // ---------- 2D overlays: big kinetic words ----------
  function kinetic(ctx, text, x, y, t, t0, o = {}) {
    const a = clamp((t - t0) / 0.35);
    if (a <= 0) return;
    const u = ease.outCubic(a), size = o.size || 76;
    ctx.save();
    ctx.globalAlpha = (o.alpha ?? 1) * u;
    ctx.filter = a < 1 ? `blur(${((1 - u) * 10).toFixed(1)}px)` : 'none';
    ctx.translate(x, y + (1 - u) * 40);
    ctx.scale(1 + (1 - u) * 0.12, 1 + (1 - u) * 0.12);
    if (o.glow) { ctx.shadowColor = 'rgba(61,165,255,0.9)'; ctx.shadowBlur = 30; }
    UI.text(ctx, text, 0, 0, { size, weight: 800, color: o.color || '#FFFFFF', align: 'center', maxW: SAFE.w });
    ctx.restore();
  }

  // ---------- shots ----------
  function shot3DPhone(ctx, t, pose, extra) {
    J3.hideAll();
    J3.phone.visible = true;
    apply(pose);
    drawScreen(t);
    const [bx, by] = BTN();
    J3.ring(clamp((t - ev.aiTap) / 0.7), [bx, by]);
    J3.bloom.strength = 0.5 + 0.9 * pulse(t, ev.aiTap, 5) * (t >= ev.aiTap ? 1 : 0);
    if (extra) extra(t);
    ctx.drawImage(J3.render(t), 0, 0, W, H);
  }
  function shotCompare3D(ctx, t) {
    J3.hideAll(); J3.phone.visible = false; J3.ring(0, [0, 0]);
    apply(P({ cz: 5.5, cy: 0.05 }));
    const it = J3.card('photoA', 900, 1200, 1.2, 1.6);
    const u = io(clamp((t - ev.compare0) / (ev.compare1 - ev.compare0)));
    paintPhoto(it, 'sun', 0, t, 1 - u);
    const a = clamp((t - ev.capture) / 0.5);
    placeCard(it, 0, lerp(-0.25, 0.08, ease.outCubic(a)), lerp(-1.2, 0, ease.outCubic(a)), lerp(-0.5, 0.18, io(clamp((t - ev.capture) / 4))), lerp(0.25, 0.02, ease.outCubic(a)), 1);
    J3.bloom.strength = 0.45;
    ctx.drawImage(J3.render(t), 0, 0, W, H);
    const la = 1 - clamp((u - 0.8) / 0.2);
    if (la > 0) { ctx.save(); ctx.globalAlpha = la; L2.tag(ctx, 'ANTES', 250, 330, t, ev.capture + 0.3, { size: 34 }); ctx.restore(); }
    if (u > 0.2) L2.tag(ctx, 'DEPOIS', 830, 330, t, ev.compare0 + 0.25, { size: 34, bg: '#3DA5FF' });
    if (t >= ev.compare1) {
      L2.tag(ctx, 'Rosto iluminado', W / 2, 1330, t, ev.compare1 + 0.05, { size: 40, glow: true });
      L2.tag(ctx, 'Fundo preservado', W / 2, 1420, t, ev.compare1 + 0.35, { size: 40, glow: true });
    }
  }
  function shotRun3D(ctx, t) {
    J3.hideAll(); J3.phone.visible = false; J3.ring(0, [0, 0]);
    apply(P({ cz: lerp(5.7, 5.2, clamp((t - ev.capture2) / 2)), cy: 0.05 }));
    const it = J3.card('photoB', 900, 1200, 1.2, 1.6);
    paintPhoto(it, 'run', 1, ev.capture2);
    const a = ease.outCubic(clamp((t - ev.capture2) / 0.5));
    placeCard(it, lerp(1.4, 0, a), 0.08, lerp(-0.6, 0, a), lerp(0.6, -0.12, a), 0.02, 1);
    J3.bloom.strength = 0.45;
    ctx.drawImage(J3.render(t), 0, 0, W, H);
    // speed streaks
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) {
      const y = 300 + U.hash(i, 9) * 1200, len = 200 + U.hash(i, 8) * 400, sp = 1600 + U.hash(i, 7) * 1400;
      const x = ((t - ev.capture2) * sp + U.hash(i, 6) * W * 2) % (W + len) - len;
      const g = ctx.createLinearGradient(x, y, x + len, y); g.addColorStop(0, 'rgba(124,198,255,0)'); g.addColorStop(1, 'rgba(160,215,255,0.5)');
      ctx.fillStyle = g; ctx.fillRect(x, y, len, 3);
    }
    ctx.restore();
    L2.tag(ctx, 'Nítida, sem borrão', W / 2, 1330, t, ev.capture2 + 0.3, { size: 40, glow: true });
    L2.tag(ctx, '1/2000 s', W / 2, 1420, t, ev.capture2 + 0.55, { size: 36, bg: '#3DA5FF' });
  }
  function shotHero3D(ctx, t) {
    const p = poseHero(t);
    J3.hideAll(); J3.ring(0, [0, 0]);
    J3.phone.visible = t < ev.endCard + 0.35;
    apply(p);
    drawScreen(t);
    // the two results orbit the phone and take turns at the front, one per beat
    if (t >= ev.flip[1] - 0.2 && t < ev.endCard) {
      const A = J3.card('heroA', 600, 800, 0.6, 0.8), B = J3.card('heroB', 600, 800, 0.6, 0.8);
      if (!A.painted) { paintPhoto(A, 'sun', 1, 0); A.painted = true; }
      if (!B.painted) { paintPhoto(B, 'run', 1, 0.3); B.painted = true; }
      const appear = ease.outBack(clamp((t - (ev.flip[1] - 0.2)) / 0.5), 1.3) * (1 - clamp((t - ev.tagline) / 0.5));
      const al = S.alternate.filter((x) => t >= x.t).pop(), which = al ? al.which : 0;
      const kA = which === 0 ? 1 : 0.0, kB = which === 1 ? 1 : 0.0;
      placeCard(A, -0.46 + Math.sin(t) * 0.02, 0.25, 0.35 + kA * 0.25, 0.45, 0, appear * (0.82 + kA * 0.22), appear * (0.55 + 0.45 * kA));
      placeCard(B, 0.46 + Math.sin(t + 1) * 0.02, -0.25, 0.35 + kB * 0.25, -0.45, 0, appear * (0.82 + kB * 0.22), appear * (0.55 + 0.45 * kB));
    }
    J3.bloom.strength = 0.55 + 0.6 * pulse(t, ev.hero, 4) + 0.8 * pulse(t, ev.endCard, 3) * (t >= ev.endCard ? 1 : 0);
    ctx.drawImage(J3.render(t, { dust: 1 }), 0, 0, W, H);
    // a light sweep across the back
    if (t < ev.flip[0] + 0.3) {
      const u = clamp((t - ev.hero - 0.3) / 1.0);
      if (u > 0 && u < 1) {
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        const x = lerp(-300, W + 300, io(u));
        const g = ctx.createLinearGradient(x - 160, 0, x + 160, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(200,225,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.translate(W / 2, H / 2); ctx.rotate(0.35); ctx.translate(-W / 2, -H / 2);
        ctx.fillStyle = g; ctx.fillRect(x - 160, -400, 320, H + 800);
        ctx.restore();
      }
      const lp = UI.fadeIn(t, ev.hero + 0.5, 0.4) * (1 - clamp((t - ev.flip[0]) / 0.25));
      if (lp > 0) {
        kinetic(ctx, 'Conheça a', W / 2, 290, t, ev.hero + 0.4, { size: 46, color: '#A8DBFF', alpha: lp });
        kinetic(ctx, 'JOVI IA Câmera', W / 2, 380, t, ev.hero + 0.55, { size: 92, glow: true, alpha: lp });
      }
    }
    // the tagline and the end card
    if (t >= ev.tagline) {
      kinetic(ctx, 'Você imagina a foto.', W / 2, 470, t, S.tagWords[0].t, { size: 80 });
      kinetic(ctx, 'A IA configura o resto.', W / 2, 574, t, S.tagWords[1].t, { size: 80, color: '#7CC6FF', glow: true });
    }
    if (t >= ev.endCard) endCard(ctx, t);
  }
  function endCard(ctx, t) {
    const bp = UI.pop(t, ev.endCard + 0.25, 0.45, 1.8);
    if (bp > 0) { ctx.save(); ctx.translate(W / 2, 800); ctx.scale(bp, bp); L2.aiButton(ctx, -230, -64, 460, 128, 1, t, 2.6); ctx.restore(); }
    const wp = UI.fadeIn(t, ev.endCard + 0.55, 0.35);
    const a = 'JOVI IA Câmera', b = 'Fotografia do seu jeito.', sep = '  |  ';
    let size = 50;
    const total = (s) => UI.measure(ctx, a, s, 800) + UI.measure(ctx, sep, s, 400) + UI.measure(ctx, b, s, 400);
    while (total(size) > SAFE.w - 10 && size > 30) size -= 1;
    let x = W / 2 - total(size) / 2;
    const y = 1010 + (1 - wp) * 16;
    UI.text(ctx, a, x, y, { size, weight: 800, color: '#FFFFFF', alpha: wp }); x += UI.measure(ctx, a, size, 800);
    UI.text(ctx, sep, x, y, { size, weight: 400, color: '#3DA5FF', alpha: wp }); x += UI.measure(ctx, sep, size, 400);
    UI.text(ctx, b, x, y, { size, weight: 400, color: '#DDE3EE', alpha: wp });
    const dp = UI.fadeIn(t, ev.endCard + 1.0, 0.4);
    UI.text(ctx, 'Protótipo conceitual desenvolvido pelo grupo.', W / 2, 1300, { size: 28, weight: 600, color: '#9AA4B8', align: 'center', alpha: dp });
    UI.text(ctx, 'Recurso ainda não disponível nos celulares JOVI.', W / 2, 1342, { size: 28, weight: 600, color: '#9AA4B8', align: 'center', alpha: dp });
  }

  Studio.film({
    async init() {
      if (!globalThis.J3) await new Promise((r) => window.addEventListener('j3ready', r, { once: true }));
      L2 = globalThis.L2; J3 = globalThis.J3; THREE = globalThis.THREE;
      J3.init({ W, H });
      J3.redrawLogo();
      SCR_H = J3.screen.canvas.height / 2;
      VO = await Studio.loadJSON('out/voice.json');
      L2.setVO(VO);
      const lines = VO ? { ...VO, lines: VO.lines.filter((l) => !l.noSub) } : null;
      SUBS = Subs.fromVoice(lines, { maxWords: 6, hold: 0.35 });
    },
    draw(ctx, t) {
      // ---- the shots ----
      if (t < ev.cutApp) L2.shotChallenge(ctx, t);
      else if (t < ev.capture) {
        const tt = t >= ev.breath[0] ? ev.breath[0] - 0.001 : t; // the held breath freezes the frame
        shot3DPhone(ctx, tt, posePhoneShot(tt), (x) => callouts(x, CALL1, 'c1_'));
        if (t >= ev.breath[0]) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H); }
      } else if (t < ev.reaction) shotCompare3D(ctx, t);
      else if (t < ev.demo2) L2.shotReaction(ctx, t);
      else if (t < ev.capture2) shot3DPhone(ctx, t, poseDemo2(t), (x) => callouts(x, CALL2, 'c2_'));
      else if (t < ev.hero) shotRun3D(ctx, t);
      else shotHero3D(ctx, t);

      // ---- transitions ----
      zoomBlur(ctx, Math.max(clamp((t - (ev.cutApp - 0.45)) / 0.45) * (t < ev.cutApp ? 1 : 0), (1 - clamp((t - ev.cutApp) / 0.3)) * (t >= ev.cutApp ? 1 : 0)));
      if (t >= ev.cutApp && t < ev.cutApp + 0.3) flash(ctx, t, ev.cutApp, 0.6, 12);
      // the shutter closes over the held breath and opens on the capture
      const ir = t < ev.capture ? clamp((t - ev.breath[0]) / (ev.capture - ev.breath[0])) : 1 - clamp((t - ev.capture) / 0.28);
      if (t > ev.breath[0] && t < ev.capture + 0.3) iris(ctx, io(ir), t * 2);
      const ir2 = t < ev.capture2 ? clamp((t - (ev.capture2 - 0.2)) / 0.2) : 1 - clamp((t - ev.capture2) / 0.28);
      if (t > ev.capture2 - 0.2 && t < ev.capture2 + 0.3) iris(ctx, io(ir2), t * 2);
      flash(ctx, t, ev.capture, 0.95, 7);
      flash(ctx, t, ev.capture2, 0.95, 7);
      glitch(ctx, tri(t, ev.reaction, 0.16), t);
      whip(ctx, tri(t, ev.demo2, 0.18), -1);
      zoomBlur(ctx, (1 - clamp((t - ev.hero) / 0.35)) * (t >= ev.hero ? 1 : 0));
      flash(ctx, t, ev.hero, 0.8, 9, '200,225,255');
      flash(ctx, t, ev.endCard, 0.5, 8, '200,225,255');

      // ---- labels and captions ----
      const showTag = t >= ev.cutApp && t < ev.hero;
      L2.conceptTag(ctx, t, showTag ? UI.fadeIn(t, ev.cutApp + 0.4, 0.4) : 0);
      const inPhone = (t >= ev.cutApp && t < ev.capture) || (t >= ev.demo2 && t < ev.capture2);
      Subs.draw(ctx, t, SUBS, { style: 'box', size: 50, y: inPhone ? 1470 : 1440, highlight: '#7CC6FF' });
    },
    post: { vignette: 0.16 },
    fadeOut: 0.6,
  });
})();
