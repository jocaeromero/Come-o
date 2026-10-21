// THE SONG — a calm modern electronic bed + the PT-BR voice + UI sounds, every one from an event in score.js.
//   node song.js   (STEMS=1 writes stems, LUFS=-14 masters to a loudness)
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const Voice = require('./engine/audio/voice');
const { mtof } = require('./engine/music');
const sc = require('./score');
const { T, BEAT, DURATION, m, ev, clock } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const drums = bus(), bass = bus(), pad = bus(), keys = bus(), lead = bus(), fx = bus(), voice = bus();
const verb = bus(), dly = bus();
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const inBreath = (t) => t >= ev.breath[0] && t < ev.breath[1];

// ---------- the voice: offline PT-BR takes placed on the timeline; word times fitted to the audio ----------
const lines = [];
for (const l of sc.vo) {
  const x = Voice.decode(path.join(__dirname, 'assets/vo', l.id + '.wav'));
  voice.addMono(x, l.at, 1.0, 0);
  verb.addMono(x, l.at, 0.04);
  const ws = l.text.split(/\s+/).filter(Boolean);
  const words = Voice.fit(x, ws, null).map((w) => ({ w: w.w, t: +(l.at + w.t).toFixed(3), end: +(l.at + w.end).toFixed(3) }));
  lines.push({ t: l.at, end: +(l.at + x.length / SR).toFixed(3), text: l.text, who: l.who, words, ...(l.noSub ? { noSub: true } : {}) });
}
fs.writeFileSync(path.join(out, 'voice.json'), JSON.stringify({ engine: 'kokoro (pf_dora, pt-br)', lines, mouth: Voice.mouthTrack(voice, 30) }));

// ---------- drums: absent in the problem, light in the discovery, a groove after the capture ----------
const K = I.kick({ tail: 0.22, punch: 0.9 }), CL = I.clap({ decay: 0.18 }), HC = [I.hat(false, 11), I.hat(false, 12)], HO = I.hat(true, 14), CR = I.crash(18);
const SH = [I.shaker(1, 15), I.shaker(0.6, 16)];
const kicks = [];
clock.eachStep(3, 22, 16, (t, b, s) => {
  if (inBreath(t) || t >= T(21, 2)) return;
  const groove = b >= 11, mid = b >= 6;
  const kick = groove ? s % 4 === 0 : mid ? s === 0 || s === 10 : s === 0;
  if (kick) { drums.addMono(K, t, groove ? 0.85 : 0.6); kicks.push(t); }
  if (mid && s % 8 === 4) { drums.addMono(CL, t, groove ? 0.45 : 0.3); verb.addMono(CL, t, 0.18); }
  if (groove) { drums.addMono(HC[s % 2], t, s % 2 ? 0.16 : 0.09, -0.25); if (s % 4 === 2) drums.addMono(HO, t, 0.09, 0.25); }
  else if (s % 2 === 0) drums.addMono(SH[s % 4 === 0 ? 1 : 0], t, 0.1, 0.3);
});
drums.addMono(CR, ev.capture, 0.35, -0.2);
drums.addMono(CR, ev.hero, 0.4, 0.2);
drums.addMono(CR, ev.endCard, 0.3, -0.1);

// ---------- bass: a soft sub from the discovery on, 8ths in the groove ----------
clock.eachStep(3, 21, 8, (t, b, s) => {
  if (inBreath(t)) return;
  const c = sc.chordAt(t);
  if (!c) return;
  const R = c.bass + 12;
  if (b >= 11) bass.addMono(I.bass(s % 2 ? R + 12 : R, BEAT / 2 * 0.8, { sub: 0.9, bright: 0.35 }), t, 0.5);
  else if (b >= 6 && (s === 0 || s === 3 || s === 6)) bass.addMono(I.bass(R, BEAT * 0.7, { sub: 1, bright: 0.2 }), t, 0.42);
  else if (s === 0) bass.addMono(I.bass(R, sc.BAR * 0.9, { sub: 1, bright: 0.1 }), t, 0.3);
});
bass.addMono(I.bass(m('F1'), 2.6, { bright: 0.2, sub: 1 }), T(21), 0.45);

// ---------- pads: warm and wide all through ----------
for (const c of sc.chords) {
  let t1 = c.t1;
  if (c.t0 < ev.breath[0] && c.t1 > ev.breath[0]) t1 = ev.breath[0];
  const last = c.t0 >= T(21);
  const opts = c.t0 >= ev.capture && !last ? { cutoff: 2600, attack: 0.04, release: 0.6 } : { cutoff: 1300, attack: 0.5, release: 1.4 };
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0 + (last ? 1.4 : 0), opts); pad.addStereo(L, R, c.t0, last ? 0.11 : 0.08); }
}

// ---------- a plucked synth arpeggio: the "tech" pulse (starts with the camera) ----------
clock.eachStep(3, 21, 8, (t, b, s) => {
  if (inBreath(t)) return;
  const c = sc.chordAt(t);
  if (!c) return;
  const ns = c.notes.map((n) => n + 12);
  const pat = [0, 1, 2, 1, 0, 2, 1, 2];
  const n = ns[pat[s] % ns.length];
  const g = b >= 11 ? 0.2 : 0.13;
  const p = I.pluck(n, { decay: 0.16, cutoff: b >= 11 ? 3200 : 2000 });
  lead.addMono(p, t, g, s % 2 ? 0.35 : -0.35);
  dly.addMono(p, t, 0.05);
});

// ---------- SCENE 1: the selfie click, a sad little "womp" for the dark photo ----------
const shutter = (t, g = 0.5) => {
  fx.addMono(I.tvClick(), t, g);
  fx.addMono(I.noiseSweep(0.09, 7000, 1800, { q: 0.8 }), t, g * 0.6);
  fx.addMono(I.thud(160, 0.04), t, g * 0.7);
};
shutter(ev.selfie, 0.5);
for (const [i, f] of ['E5', 'C5', 'A4'].entries()) { const mb = I.musicBox(m(f)); keys.addMono(mb, ev.darkPop + 0.1 + i * 0.22, 0.14, 0.1); verb.addMono(mb, ev.darkPop + 0.1 + i * 0.22, 0.12); }
for (const n of [['A4', 0], ['C5', 1], ['E5', 2], ['D5', 3]]) { const mb = I.musicBox(m(n[0])); keys.addMono(mb, T(1, n[1]), 0.1); verb.addMono(mb, T(1, n[1]), 0.12); }

// ---------- SCENE 2: camera opens (whoosh), the AI wakes (bright chime + shimmer) ----------
fx.addMono(I.noiseSweep(0.4, 400, 5000, { q: 0.9, pink: true }), ev.cutApp - 0.3, 0.22);
fx.addMono(I.pop(1400, 33), ev.aiTap, 0.3);
for (const [i, f] of ['E6', 'A6', 'C7', 'E7'].entries()) { const b = I.bell(mtof(m(f)), 1.2, 1.4, 3.5); keys.addMono(b, ev.aiTap + i * 0.045, 0.07, -0.3 + i * 0.2); verb.addMono(b, ev.aiTap + i * 0.045, 0.08); dly.addMono(b, ev.aiTap + i * 0.045, 0.04); }
fx.addMono(I.noiseSweep(0.6, 2000, 9000, { q: 2, pink: true }), ev.aiTap, 0.06);

// ---------- SCENE 3: "thinking" sweep, a note per adjustment, "ready" chime ----------
fx.addMono(I.noiseSweep(0.5, 600, 4000, { q: 1.2, pink: true }), ev.thinking - 0.1, 0.12);
for (const a of sc.adjust1) { const e = I.epiano(a.midi, 0.5); keys.addMono(e, a.t, 0.25, 0.2); verb.addMono(e, a.t, 0.1); fx.addMono(I.pop(2000, 50 + a.t), a.t, 0.08); }
for (const [i, f] of ['C6', 'G6'].entries()) { const b = I.bell(mtof(m(f)), 0.9, 1.2, 3.5); keys.addMono(b, ev.ready + i * 0.08, 0.07); }
fx.addMono(I.noiseSweep(ev.breath[0] - T(10, 1), 300, 7000, { q: 0.9, shape: (x) => x * x, pink: true }), T(10, 1), 0.2); // riser into the capture

// ---------- SCENE 4: capture + sub, the before/after swipe, second demo, capture 2 ----------
shutter(ev.capture, 0.6);
fx.addMono(I.subBoom(1.4), ev.capture, 0.45);
fx.addMono(I.noiseSweep(ev.compare1 - ev.compare0, 1200, 5000, { q: 1, pink: true }), ev.compare0, 0.1);
for (const [i, f] of ['A5', 'C6', 'E6'].entries()) keys.addMono(I.bell(mtof(m(f)), 1, 1.3, 3.5), ev.compare1 + i * 0.06, 0.06);
fx.addMono(I.noiseSweep(0.3, 500, 4500, { q: 0.9, pink: true }), ev.demo2 - 0.25, 0.15);
for (const a of sc.adjust2) { const e = I.epiano(a.midi, 0.35); keys.addMono(e, a.t, 0.22, -0.2); fx.addMono(I.pop(2300, 70 + a.t), a.t, 0.08); }
shutter(ev.capture2, 0.6);
fx.addMono(I.thud(90, 0.08), ev.capture2, 0.4);

// ---------- SCENE 5: the hero hit, the flip, alternating photos, the end chord ----------
fx.addMono(I.subBoom(1.8), ev.hero, 0.55);
fx.addMono(I.thud(80, 0.09), ev.hero, 0.5);
fx.addMono(I.noiseSweep(ev.flip[1] - ev.flip[0], 800, 6000, { q: 1, pink: true }), ev.flip[0], 0.14);
for (const a of sc.alternate) { const mb = I.musicBox(a.midi + 12); keys.addMono(mb, a.t, 0.12, a.which ? 0.3 : -0.3); fx.addMono(I.pop(1800, 90 + a.t), a.t, 0.06); }
for (const [i, f] of ['A5', 'C6', 'E6', 'A6'].entries()) { const b = I.bell(mtof(m(f)), 1.6, 1.5, 3.5); keys.addMono(b, ev.endCard + i * 0.05, 0.08, -0.3 + i * 0.2); verb.addMono(b, ev.endCard, 0.06); }

// ---------- v2 transitions: the phone spin, the aperture, the glitch, the whip ----------
fx.addMono(I.noiseSweep(0.9, 300, 6000, { q: 1.1, pink: true }), ev.cutApp, 0.16);
for (const tc of [ev.capture, ev.capture2]) for (let i = 0; i < 5; i++) fx.addMono(I.woodTick(1.6 + i * 0.12), tc - 0.22 + i * 0.04, 0.08, (i % 2 ? 0.3 : -0.3));
for (let i = 0; i < 8; i++) fx.addMono(I.chipNoise(i % 2 ? 'hat' : 'snare', 40 + i), ev.reaction - 0.12 + i * 0.03, 0.12, (i % 2 ? 0.5 : -0.5));
fx.addMono(I.noiseSweep(0.3, 5000, 400, { q: 0.8, pink: true }), ev.demo2 - 0.18, 0.25);
fx.addMono(I.noiseSweep(1.2, 200, 5000, { q: 1, shape: (x) => x * x, pink: true }), ev.hero - 1.2, 0.18);

// ---------- mix ----------
MIX.sidechain([pad, bass, lead], kicks.filter((t) => t >= ev.capture));
const stems = {
  drums, bass, pad, keys, lead, fx, voice,
  verb: reverb(verb, { room: 0.8, damp: 0.4 }),
  dly: pingpong(dly, BEAT * 0.75, 0.32, 3200),
};
MIX.duck([stems.drums, stems.bass, stems.pad, stems.keys, stems.lead, stems.verb, stems.dly], voice, { depth: 0.55, threshold: 0.03 });
const GAIN = { drums: 0.36, bass: 0.65, pad: 2.2, keys: 1.0, lead: 1.6, fx: 0.8, voice: 1.8, verb: 1, dly: 1 };
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 24);
MIX.gate(mix, ev.breath[0], ev.breath[1]);
MIX.fadeOut(mix, DURATION - 1.2, DURATION);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.8'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : null });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS at drive ${M.drive.toFixed(2)}` : ''})`);
