// JOVI IA CÂMERA (9:16): um protótipo CONCEITUAL criado pelo grupo, não uma função comercial dos celulares JOVI.
// A estudante descreve a foto por voz, a IA ajusta exposição/HDR/obturador sozinha.
// Single source of truth: the music (song.js) and the picture (film.js) both read every time from here.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock, makeChords } = MU;

  const FPS = 30;
  const FORMAT = '9:16';
  const STYLE = 'flat';
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const clock = makeClock({ bpm: 120, offset: 0 }); // 1 beat = 0.5 s, 1 bar = 2 s
  const { T, BEAT, BAR } = clock;
  const DURATION = T(22) + 0.8; // 44.8 s

  // the five scenes of the brief
  const S = {
    desafio: [0, T(3)], // 0–6
    descoberta: [T(3), T(6)], // 6–12
    interacao: [T(6), T(11)], // 12–22
    transformacao: [T(11), T(17)], // 22–34
    fechamento: [T(17), DURATION], // 34–44.8
  };

  // Am – F – C – G, a calm minor loop; the payoff opens to C/G
  const { chords, chordAt } = makeChords(clock, {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    G: { notes: ['G3', 'B3', 'D4'], bass: 'G1' },
    Em: { notes: ['G3', 'B3', 'E4'], bass: 'E2' },
    Fmaj7: { notes: ['A3', 'C4', 'E4', 'G4'], bass: 'F1' },
  }, (() => {
    const rows = [];
    const prog = ['Am', 'F', 'C', 'G'];
    for (let b = 0; b < 21; b++) rows.push([b, 0, 4, b >= 17 ? ['F', 'G', 'Am', 'C'][(b - 17) % 4] : prog[b % 4]]);
    rows.push([21, 0, 4, 'Fmaj7']);
    return rows;
  })());

  const ev = {
    selfie: T(0, 2), // 1.0  first selfie: click + dark result
    darkPop: T(0, 2.4),
    cutApp: T(3), // 6.0  open the JOVI camera
    aiTap: T(4), // 8.0  tap "IA Câmera": the interface wakes up
    listen: T(4, 1), // 8.5  "Estou ouvindo…"
    thinking: T(8), // 16.0 "Ajustando luz e exposição…"
    ready: T(10, 2), // 21.0 "Pronto"
    breath: [T(10, 3.5), T(11)], // an 8th of held breath before the capture
    capture: T(11), // 22.0 capture #1
    compare0: T(11, 1.5), compare1: T(12, 2), compareEnd: T(13),
    reaction: T(13), // 26.0 "Uau!"
    demo2: T(14), // 28.0 second demo
    capture2: T(16), // 32.0 capture #2 (running, sharp)
    hero: T(17), // 34.0 hero phone
    flip: [T(17, 2), T(18)], // 35–36 flip from the back to the screen
    tagline: T(19, 0.5), // 38.25
    endCard: T(21), // 42.0 "JOVI IA Câmera | Fotografia do seu jeito."
  };

  // the voice (assets/vo/l*.wav, synthesized offline in PT-BR); song.js writes out/voice.json from these
  const vo = [
    { id: 'l1', at: 1.7, text: 'Quero tirar uma foto assim, mas nunca consigo deixar do jeito que eu quero!', who: 'bia' },
    { id: 'l2', at: 12.4, text: 'Quero uma foto contra o sol, mas sem deixar meu rosto escuro.', who: 'bia' },
    { id: 'l3', at: 26.25, text: 'Uau! Ficou perfeita!', who: 'bia' },
    { id: 'l4', at: 28.3, text: 'Agora, uma foto minha correndo, sem ficar tremida!', who: 'bia' },
    { id: 'l5', at: 38.4, text: 'Você imagina a foto. A IA configura o resto.', who: 'bia', noSub: true },
  ];

  // what the AI does, one chip per step, each a note
  const adjust1 = [
    { t: T(8, 2), icon: 'face', label: 'Rosto detectado', val: 'contraluz', midi: m('E5') },
    { t: T(9, 0), icon: 'expo', label: 'Exposição no rosto', val: '+1,3 EV', midi: m('A5') },
    { t: T(9, 2), icon: 'hdr', label: 'HDR inteligente', val: 'ATIVO', midi: m('C6') },
    { t: T(10, 0), icon: 'wb', label: 'Equilíbrio de luz', val: '5600 K', midi: m('B5') },
  ];
  const adjust2 = [
    { t: T(15, 2.5), icon: 'run', label: 'Movimento detectado', val: '', midi: m('E5') },
    { t: T(15, 3), icon: 'shutter', label: 'Obturador', val: '1/2000 s', midi: m('G5') },
    { t: T(15, 3.5), icon: 'focus', label: 'Foco contínuo', val: 'ATIVO', midi: m('B5') },
  ];
  // the end: the two photos alternate on each beat
  const alternate = [0, 1, 2, 3].map((i) => ({ t: T(18, i), which: i % 2, midi: m(['A4', 'C5', 'E5', 'G5'][i]) }));
  const tagWords = [
    { w: 'Você imagina a foto.', t: 38.4 },
    { w: 'A IA configura o resto.', t: 39.75 },
  ];

  const markers = {
    selfie: { t: ev.selfie, sync: 'av' },
    app: { t: ev.cutApp, sync: 'v' },
    aiTap: { t: ev.aiTap, sync: 'av' },
    thinking: ev.thinking,
    capture: { t: ev.capture, sync: 'av' },
    reaction: ev.reaction,
    demo2: ev.demo2,
    capture2: { t: ev.capture2, sync: 'av' },
    hero: { t: ev.hero, sync: 'av' },
    tagline: ev.tagline,
    endCard: { t: ev.endCard, sync: 'av' },
  };

  const SCORE = {
    FPS, FORMAT, STYLE, W, H, SAFE, DURATION, clock, T, BEAT, BAR, S, m, chords, chordAt, ev, vo,
    adjust1, adjust2, alternate, tagWords, markers,
  };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
