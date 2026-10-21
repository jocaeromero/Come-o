// THE 3D LAYER — a JOVI phone modelled in three.js (PBR, studio reflections, bloom), holographic callouts,
// floating photo cards and bokeh. film.js poses everything per frame from score.js and draws J3.canvas.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const J3 = {};
// phone size in world units (the real phone's proportions: 0.47 width/height)
const PW = 0.752, PH = 1.6, D = 0.058, B = 0.013, R = 0.12;
const SW = PW - 0.05, SH = PH - 0.05; // the screen
J3.dims = { PW, PH, SW, SH };

function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function planeUV(geo, w, h) { // ShapeGeometry UVs are positions: map them to 0..1
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  uv.needsUpdate = true;
  return geo;
}
const canvasTex = (w, h) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return { canvas: c, ctx: c.getContext('2d'), tex };
};

J3.init = ({ W, H }) => {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  J3.renderer = renderer; J3.canvas = renderer.domElement;

  const scene = new THREE.Scene();
  J3.scene = scene;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.7;

  // background: a deep navy studio with a blue glow (redrawn when its glow moves)
  J3.bg = canvasTex(540, 960);
  scene.background = J3.bg.tex;
  J3.setBackground(0.5, 0.45, 1);

  const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 100);
  camera.position.set(0, 0, 5);
  J3.camera = camera;

  // lights: a soft key, cool blue rims from behind (the brand's luminous blue)
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(2, 3, 4); scene.add(key);
  const rimL = new THREE.PointLight(0x3da5ff, 9, 10, 1.5); rimL.position.set(-2.2, 1.2, -1.2); scene.add(rimL);
  const rimR = new THREE.PointLight(0x7cc6ff, 7, 10, 1.5); rimR.position.set(2.4, -0.6, -1.4); scene.add(rimR);
  const fill = new THREE.PointLight(0xff9ad0, 2.5, 8, 1.5); fill.position.set(0, -2, 2.5); scene.add(fill);
  J3.lights = { key, rimL, rimR, fill };

  J3.phone = buildPhone();
  scene.add(J3.phone);

  // bokeh dust: deterministic points drifting slowly
  {
    const n = 260, pos = new Float32Array(n * 3), seed = [];
    let s = 7;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < n; i++) { seed.push([rnd(), rnd(), rnd(), rnd()]); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const sp = canvasTex(64, 64);
    const g = sp.ctx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(160,210,255,0.5)'); g.addColorStop(1, 'rgba(120,180,255,0)');
    sp.ctx.fillStyle = g; sp.ctx.fillRect(0, 0, 64, 64); sp.tex.needsUpdate = true;
    const mat = new THREE.PointsMaterial({ size: 0.06, map: sp.tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0x9fd2ff, opacity: 0.55, sizeAttenuation: true });
    J3.dust = new THREE.Points(geo, mat); J3.dust.userData.seed = seed; scene.add(J3.dust);
  }

  // composer: render → bloom → tone map / sRGB
  const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  J3.bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.4, 0.45, 0.9);
  composer.addPass(J3.bloom);
  composer.addPass(new OutputPass());
  J3.composer = composer;
  J3.items = {};
};

J3.setBackground = (gx, gy, k) => {
  const { ctx, canvas, tex } = J3.bg, w = canvas.width, h = canvas.height;
  const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#05070D'); g.addColorStop(1, '#0A0E1A');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const r = ctx.createRadialGradient(gx * w, gy * h, 10, gx * w, gy * h, w * 0.95);
  r.addColorStop(0, `rgba(48,110,210,${0.55 * k})`); r.addColorStop(0.45, `rgba(24,52,120,${0.25 * k})`); r.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, w, h);
  tex.needsUpdate = true;
};

function buildPhone() {
  const phone = new THREE.Group();
  const plum = new THREE.MeshPhysicalMaterial({ color: 0x2a0817, metalness: 0.35, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.25, sheenColor: new THREE.Color(0xb04a7a) });
  const frame = new THREE.MeshPhysicalMaterial({ color: 0x5a2a42, metalness: 0.95, roughness: 0.22, clearcoat: 0.6 });
  const silver = new THREE.MeshPhysicalMaterial({ color: 0xe0d2da, metalness: 1, roughness: 0.16 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x020203, metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 });
  J3.mats = { plum, frame, silver, glass };

  // body: a rounded slab with bevelled edges
  const body = new THREE.ExtrudeGeometry(rrShape(PW - 2 * B, PH - 2 * B, R - B), { depth: D, bevelEnabled: true, bevelThickness: B, bevelSize: B, bevelSegments: 8, curveSegments: 28 });
  body.translate(0, 0, -D / 2);
  phone.add(new THREE.Mesh(body, [plum, frame]));
  const zf = D / 2 + B, zb = -(D / 2 + B);

  // front: black glass, the live screen, the punch-hole camera
  const fg = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(PW - 0.006, PH - 0.006, R - 0.003), 28), glass);
  fg.position.z = zf + 0.0006; phone.add(fg);
  J3.screen = canvasTex(824, Math.round(824 * SH / SW));
  const scr = new THREE.Mesh(planeUV(new THREE.ShapeGeometry(rrShape(SW, SH, R - 0.03), 28), SW, SH), new THREE.MeshBasicMaterial({ map: J3.screen.tex, toneMapped: false, color: new THREE.Color(0.86, 0.86, 0.86) }));
  scr.position.z = zf + 0.0012; phone.add(scr);
  J3.screenMesh = scr;
  const hole = new THREE.Mesh(new THREE.CircleGeometry(0.016, 32), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  hole.position.set(0, SH / 2 - 0.045, zf + 0.0018); phone.add(hole);
  // a glassy highlight over the screen
  const gloss = canvasTex(256, 512);
  { const g = gloss.ctx.createLinearGradient(0, 0, 256, 512); g.addColorStop(0, 'rgba(255,255,255,0.0)'); g.addColorStop(0.42, 'rgba(255,255,255,0.0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.10)'); g.addColorStop(0.58, 'rgba(255,255,255,0.0)'); g.addColorStop(1, 'rgba(255,255,255,0)'); gloss.ctx.fillStyle = g; gloss.ctx.fillRect(0, 0, 256, 512); gloss.tex.needsUpdate = true; }
  const gm = new THREE.Mesh(planeUV(new THREE.ShapeGeometry(rrShape(SW, SH, R - 0.03), 28), SW, SH), new THREE.MeshBasicMaterial({ map: gloss.tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  gm.position.z = zf + 0.0024; phone.add(gm); J3.gloss = gm;

  // side keys (right edge, seen from the front)
  for (const [y, h] of [[0.28, 0.2], [0.02, 0.11]]) { const k = new THREE.Mesh(new THREE.BoxGeometry(0.012, h, 0.03), frame); k.position.set(PW / 2 + 0.004, y, 0); phone.add(k); }

  // back: the vertical camera capsule (seen from behind it sits upper-left → +x here), two lenses, a ring flash
  const back = new THREE.Group(); back.rotation.y = Math.PI; back.position.z = zb; phone.add(back);
  const mx = -(PW / 2 - 0.205), cw = 0.27, chh = 0.56, my = PH / 2 - 0.07 - chh / 2;
  const cap = new THREE.ExtrudeGeometry(rrShape(cw - 0.012, chh - 0.012, cw / 2 - 0.006), { depth: 0.01, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 5, curveSegments: 32 });
  const capM = new THREE.Mesh(cap, [new THREE.MeshPhysicalMaterial({ color: 0x3a1027, metalness: 0.4, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05 }), silver]);
  capM.position.set(mx, my, 0.001); back.add(capM);
  const lens = (y, r) => {
    const g = new THREE.Group(); g.position.set(mx, y, 0.017);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.16, r * 1.2, 0.022, 64), silver); ring.rotation.x = Math.PI / 2; g.add(ring);
    const glassL = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.024, 64), glass); glassL.rotation.x = Math.PI / 2; glassL.position.z = 0.001; g.add(glassL);
    const inner = canvasTex(256, 256);
    { const c = inner.ctx; const gr = c.createRadialGradient(128, 128, 10, 128, 128, 128); gr.addColorStop(0, '#0b0f1e'); gr.addColorStop(0.35, '#16224a'); gr.addColorStop(0.55, '#06070c'); gr.addColorStop(0.7, '#2a2f44'); gr.addColorStop(0.74, '#06070c'); gr.addColorStop(1, '#000'); c.fillStyle = gr; c.fillRect(0, 0, 256, 256);
      c.fillStyle = 'rgba(140,170,255,0.35)'; c.beginPath(); c.ellipse(96, 92, 22, 13, -0.6, 0, Math.PI * 2); c.fill(); inner.tex.needsUpdate = true; }
    const el = new THREE.Mesh(new THREE.CircleGeometry(r * 0.86, 64), new THREE.MeshPhysicalMaterial({ map: inner.tex, roughness: 0.05, clearcoat: 1, metalness: 0 }));
    el.position.z = 0.0135; g.add(el);
    back.add(g);
  };
  lens(my + 0.14, 0.092);
  lens(my - 0.135, 0.084);
  const fy = my - chh / 2 - 0.1;
  const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.012, 64), new THREE.MeshPhysicalMaterial({ color: 0x3a1027, metalness: 0.4, roughness: 0.25, clearcoat: 1 })); fl.rotation.x = Math.PI / 2; fl.position.set(mx, fy, 0.004); back.add(fl);
  const ringF = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.011, 24, 64), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2f8, emissiveIntensity: 0.25, roughness: 0.3 })); ringF.position.set(mx, fy, 0.012); back.add(ringF);
  // the wordmark
  const logo = canvasTex(512, 128);
  { const c = logo.ctx; c.clearRect(0, 0, 512, 128); c.font = '700 84px Inter'; c.letterSpacing = '26px'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#E9DCE4'; c.fillText('JOVI', 270, 66); logo.tex.needsUpdate = true; }
  J3.logoTex = logo;
  const lg = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.075), new THREE.MeshStandardMaterial({ map: logo.tex, transparent: true, metalness: 0.9, roughness: 0.25, color: 0xffffff }));
  lg.position.set(-0.03, -PH / 2 + 0.42, 0.0015); back.add(lg);
  return phone;
}
J3.redrawLogo = () => { const c = J3.logoTex.ctx; c.clearRect(0, 0, 512, 128); c.font = '700 84px Inter'; c.letterSpacing = '26px'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#E9DCE4'; c.fillText('JOVI', 270, 66); J3.logoTex.tex.needsUpdate = true; };

// a flat textured card in space (photo, holographic label…): returns { mesh, canvas, ctx, tex }
J3.card = (id, pxW, pxH, w, h, { glow = false, additive = false, bright = 0.92 } = {}) => {
  if (J3.items[id]) return J3.items[id];
  const ct = canvasTex(pxW, pxH);
  const mat = new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false, depthWrite: !additive, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide });
  mat.color.setScalar(bright);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.visible = false;
  J3.scene.add(mesh);
  const it = { ...ct, mesh, mat, glow };
  J3.items[id] = it;
  return it;
};
J3.hideAll = () => { for (const k in J3.items) J3.items[k].mesh.visible = false; };

// a shockwave ring (the AI tap) in the phone's local space
J3.ring = (() => {
  let m = null;
  return (u, pos) => {
    if (!m) { m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: 0x7cc6ff, transparent: true, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false })); J3.phone.add(m); }
    if (u <= 0 || u >= 1) { m.visible = false; return; }
    m.visible = true; m.position.set(pos[0], pos[1], D / 2 + B + 0.004);
    const s = 0.02 + u * 0.32; m.scale.set(s, s, s);
    m.material.opacity = (1 - u) * 1.6; m.material.color.setRGB(0.6 * 1.8, 0.85 * 1.8, 1.8);
  };
})();

J3.render = (t, { dust = 1 } = {}) => {
  // dust drifts as a pure function of t
  const p = J3.dust.geometry.attributes.position, sd = J3.dust.userData.seed;
  for (let i = 0; i < sd.length; i++) {
    const [a, b, c, d] = sd[i];
    p.setXYZ(i, (a - 0.5) * 7 + Math.sin(t * 0.2 + d * 6) * 0.15, ((b + t * 0.012 * (0.5 + d)) % 1 - 0.5) * 9, -1.5 - c * 5);
  }
  p.needsUpdate = true;
  J3.dust.material.opacity = 0.55 * dust;
  J3.composer.render();
  return J3.canvas;
};

globalThis.J3 = J3;
globalThis.THREE = THREE;
window.dispatchEvent(new Event('j3ready'));
