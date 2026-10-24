// Prompt Maker — monta prompts para IAs de texto e de imagem.
// Tudo roda no navegador; a IA (Claude) só é chamada no botão "Melhorar com IA".

// ---------- Opções das listas (chave, rótulo em PT, texto em EN) ----------

const OPTIONS = {
  "t-format": [
    ["prose", "texto corrido", "flowing prose"],
    ["bullets", "lista com tópicos", "a bulleted list"],
    ["steps", "passo a passo numerado", "a numbered step-by-step list"],
    ["table", "tabela", "a table"],
    ["json", "JSON", "JSON"],
    ["code", "código", "code"],
    ["email", "e-mail", "an email"],
    ["script", "roteiro", "a script"],
  ],
  "t-tone": [
    ["neutral", "neutro", "neutral"],
    ["formal", "formal", "formal"],
    ["casual", "casual e próximo", "casual and friendly"],
    ["persuasive", "persuasivo", "persuasive"],
    ["technical", "técnico", "technical"],
    ["didactic", "didático", "educational"],
    ["creative", "criativo e divertido", "creative and playful"],
    ["empathetic", "empático", "empathetic"],
  ],
  "t-length": [
    ["xs", "bem curto (até 50 palavras)", "very short (under 50 words)"],
    ["short", "curto (1 parágrafo)", "short (one paragraph)"],
    ["medium", "médio (3 a 5 parágrafos)", "medium (3 to 5 paragraphs)"],
    ["long", "longo e detalhado", "long and detailed"],
  ],
  "t-lang": [
    ["ptbr", "português do Brasil", "Brazilian Portuguese"],
    ["en", "inglês", "English"],
    ["es", "espanhol", "Spanish"],
  ],
  "i-style": [
    ["photo", "fotografia realista", "realistic photograph"],
    ["cinematic", "fotografia cinematográfica", "cinematic film still"],
    ["product", "foto de produto em estúdio", "studio product photograph"],
    ["digital", "ilustração digital", "digital illustration"],
    ["painting", "pintura digital", "digital painting"],
    ["watercolor", "aquarela", "watercolor painting"],
    ["oil", "pintura a óleo", "oil painting"],
    ["anime", "ilustração estilo anime", "anime-style illustration"],
    ["render3d", "render 3D", "3D render"],
    ["pixel", "pixel art", "pixel art"],
    ["flat", "ilustração vetorial flat", "flat vector illustration"],
    ["lineart", "desenho em traço minimalista", "minimalist line drawing"],
    ["sketch", "esboço a lápis", "pencil sketch"],
  ],
  "i-light": [
    ["golden", "luz de golden hour", "golden hour lighting"],
    ["soft", "luz suave e difusa", "soft diffused light"],
    ["natural", "luz natural do dia", "natural daylight"],
    ["studio", "iluminação de estúdio", "studio lighting"],
    ["softbox", "luz de softbox", "softbox lighting"],
    ["dramatic", "luz dramática com sombras fortes", "dramatic lighting with deep shadows"],
    ["backlight", "contraluz", "backlit"],
    ["neon", "luzes neon", "neon lights"],
    ["moon", "luz da lua", "moonlight"],
    ["candle", "luz de velas", "candlelight"],
  ],
  "i-camera": [
    ["closeup", "close-up", "close-up shot"],
    ["portrait85", "retrato com lente 85mm", "portrait, 85mm lens"],
    ["medium", "plano médio", "medium shot"],
    ["wide", "plano geral", "wide shot"],
    ["aerial", "vista aérea", "aerial view"],
    ["macro", "macro", "macro shot"],
    ["lowangle", "ângulo baixo", "low-angle shot"],
    ["top", "vista de cima (flat lay)", "top-down flat lay"],
    ["isometric", "vista isométrica", "isometric view"],
  ],
  "i-mood": [
    ["cozy", "atmosfera aconchegante", "cozy atmosphere"],
    ["epic", "atmosfera épica", "epic atmosphere"],
    ["dreamy", "atmosfera onírica", "dreamy atmosphere"],
    ["melancholic", "clima melancólico", "melancholic mood"],
    ["joyful", "clima alegre", "joyful mood"],
    ["mysterious", "atmosfera misteriosa", "mysterious atmosphere"],
    ["clean", "estética limpa e minimalista", "clean minimalist aesthetic"],
    ["futuristic", "clima futurista", "futuristic vibe"],
    ["vintage", "estética vintage", "vintage aesthetic"],
  ],
};

// Texto da opção escolhida no idioma pedido ("" se nada escolhido).
function optText(selectId, key, lang) {
  const opt = OPTIONS[selectId].find(([k]) => k === key);
  if (!opt) return "";
  return lang === "en" ? opt[2] : opt[1];
}

// ---------- Modelos prontos ----------

const PRESETS = {
  text: [
    {
      name: "Post para redes sociais",
      values: {
        role: "um social media criativo",
        task: "Escreva uma legenda para um post no Instagram sobre [assunto].",
        audience: "[descreva seu público]",
        format: "prose", tone: "casual", length: "short",
        constraints: "Terminar com uma chamada para ação\nNo máximo 5 hashtags\nNo máximo 3 emojis",
        variations: true,
      },
    },
    {
      name: "E-mail profissional",
      values: {
        role: "um assistente executivo com ótima escrita",
        task: "Escreva um e-mail para [destinatário] sobre [assunto].",
        context: "[o que já foi conversado, prazos, o que você precisa que a pessoa faça]",
        format: "email", tone: "formal", length: "short",
        constraints: "Assunto do e-mail na primeira linha\nIr direto ao ponto",
      },
    },
    {
      name: "Revisar código",
      values: {
        role: "um engenheiro de software sênior",
        task: "Revise o código abaixo. Aponte bugs, problemas de segurança e melhorias de legibilidade, em ordem de gravidade.",
        context: "[cole o código aqui]",
        format: "bullets", tone: "technical",
        constraints: "Mostrar o trecho corrigido para cada problema\nNão reescrever o que já está bom",
        stepByStep: true,
      },
    },
    {
      name: "Explicar um conceito",
      values: {
        role: "um professor paciente e didático",
        task: "Explique [conceito] de forma simples.",
        audience: "alguém que nunca estudou o assunto",
        format: "steps", tone: "didactic", length: "medium",
        constraints: "Usar uma analogia do dia a dia\nEvitar jargões ou explicá-los",
        askQuestions: true,
      },
    },
    {
      name: "Resumir um texto",
      values: {
        role: "um analista objetivo",
        task: "Resuma o texto abaixo destacando os pontos principais, decisões e próximos passos.",
        context: "[cole o texto aqui]",
        format: "bullets", tone: "neutral", length: "short",
        constraints: "Não incluir opiniões\nManter números e datas exatos",
      },
    },
    {
      name: "Brainstorm de ideias",
      values: {
        role: "um consultor de negócios criativo",
        task: "Liste 10 ideias de [o que você quer] para [objetivo].",
        context: "[orçamento, recursos, restrições]",
        format: "table", tone: "creative",
        constraints: "Colunas: ideia, por que funciona, custo estimado (baixo/médio/alto)",
      },
    },
  ],
  image: [
    {
      name: "Foto de produto",
      values: {
        subject: "a minimalist ceramic coffee mug",
        setting: "on a light oak table",
        style: "product", lighting: "softbox", camera: "closeup", mood: "clean",
        details: "sharp focus, realistic reflections, high detail",
        negative: "text, watermark, clutter",
        ratio: "1:1",
      },
    },
    {
      name: "Retrato cinematográfico",
      values: {
        subject: "a young woman with freckles",
        action: "looking out of a rainy window",
        style: "cinematic", lighting: "soft", camera: "portrait85", mood: "melancholic",
        palette: "teal and orange",
        details: "film grain, shallow depth of field",
        negative: "blurry, distorted face, extra fingers",
        ratio: "4:5",
      },
    },
    {
      name: "Paisagem de fantasia",
      values: {
        subject: "a floating island with waterfalls",
        setting: "above a sea of clouds",
        style: "painting", lighting: "golden", camera: "wide", mood: "epic",
        details: "intricate details, volumetric light",
        ratio: "16:9",
      },
    },
    {
      name: "Logo minimalista",
      values: {
        subject: "a logo icon for a coffee shop",
        style: "flat", mood: "clean",
        palette: "two colors: espresso brown and cream",
        details: "simple geometric shapes, centered, plain white background",
        negative: "photorealistic, gradients, text, clutter",
        ratio: "1:1",
      },
    },
    {
      name: "Personagem anime",
      values: {
        subject: "a cheerful girl with short silver hair and a backpack",
        action: "waving",
        setting: "busy Tokyo street at dusk",
        style: "anime", lighting: "neon", camera: "medium", mood: "joyful",
        negative: "extra limbs, low quality",
        ratio: "9:16",
      },
    },
  ],
};

// ---------- Montagem do prompt de texto ----------

const TEXT_LABELS = {
  pt: {
    youAre: (r) => `Você é ${r}.`,
    task: "Tarefa", context: "Contexto", audience: "Público-alvo",
    output: "Formato da resposta", format: "Formato", tone: "Tom", length: "Tamanho", lang: "Idioma",
    constraints: "Restrições", examples: "Exemplos", extras: "Instruções adicionais",
    stepByStep: "Antes de responder, pense passo a passo e organize seu raciocínio.",
    askQuestions: "Se faltar alguma informação importante, faça perguntas antes de começar.",
    sources: "Cite as fontes quando possível e deixe claro quando não tiver certeza de algo.",
    variations: "Ofereça 3 variações diferentes para eu escolher.",
    tags: { task: "tarefa", context: "contexto", audience: "publico_alvo", output: "formato_da_resposta", constraints: "restricoes", examples: "exemplos", extras: "instrucoes" },
  },
  en: {
    youAre: (r) => `You are ${r}.`,
    task: "Task", context: "Context", audience: "Audience",
    output: "Response format", format: "Format", tone: "Tone", length: "Length", lang: "Language",
    constraints: "Constraints", examples: "Examples", extras: "Additional instructions",
    stepByStep: "Before answering, think step by step and organize your reasoning.",
    askQuestions: "If any important information is missing, ask me questions before you start.",
    sources: "Cite sources when possible and say clearly when you are unsure about something.",
    variations: "Give me 3 different variations to choose from.",
    tags: { task: "task", context: "context", audience: "audience", output: "response_format", constraints: "constraints", examples: "examples", extras: "instructions" },
  },
};

function lines(text) {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

function buildTextPrompt(d) {
  const lang = d.promptLang === "en" ? "en" : "pt";
  const L = TEXT_LABELS[lang];
  const sections = [];

  if (d.task) sections.push({ key: "task", body: d.task });
  if (d.context) sections.push({ key: "context", body: d.context });
  if (d.audience) sections.push({ key: "audience", body: d.audience });

  const out = [
    [L.format, optText("t-format", d.format, lang)],
    [L.tone, optText("t-tone", d.tone, lang)],
    [L.length, optText("t-length", d.length, lang)],
    [L.lang, optText("t-lang", d.answerLang, lang)],
  ].filter(([, v]) => v);
  if (out.length) sections.push({ key: "output", items: out.map(([k, v]) => `${k}: ${v}`) });

  const constraints = lines(d.constraints || "");
  if (constraints.length) sections.push({ key: "constraints", items: constraints });
  if (d.examples) sections.push({ key: "examples", body: d.examples });

  const extras = ["stepByStep", "askQuestions", "sources", "variations"].filter((k) => d[k]).map((k) => L[k]);
  if (extras.length) sections.push({ key: "extras", items: extras });

  if (!sections.length && !d.role) return "";

  const parts = [];
  if (d.role) parts.push(L.youAre(d.role.replace(/\.$/, "")));

  for (const s of sections) {
    const title = L[s.key];
    if (d.structure === "xml") {
      const tag = L.tags[s.key];
      const body = s.items ? s.items.join("\n") : s.body;
      parts.push(`<${tag}>\n${body}\n</${tag}>`);
    } else if (d.structure === "plain") {
      const body = s.items ? s.items.map((i) => `- ${i}`).join("\n") : s.body;
      parts.push(`${title}:\n${body}`);
    } else {
      const body = s.items ? s.items.map((i) => `- ${i}`).join("\n") : s.body;
      parts.push(`## ${title}\n${body}`);
    }
  }
  return parts.join("\n\n");
}

// ---------- Montagem do prompt de imagem ----------

function buildImagePrompt(d) {
  const lang = d.promptLang === "pt" ? "pt" : "en";
  const style = optText("i-style", d.style, lang);
  const subject = d.subject.trim();
  if (!subject && !style && !d.setting) return "";

  // Assunto primeiro e estilo como item da lista: não precisa de "of"/"de"
  // ligando os dois, então campos em idiomas diferentes não viram frase quebrada.
  const palette = d.palette ? (lang === "en" ? `${d.palette} color palette` : `paleta de cores: ${d.palette}`) : "";
  const pieces = [
    subject,
    d.action,
    d.setting,
    style,
    optText("i-light", d.lighting, lang),
    optText("i-camera", d.camera, lang),
    palette,
    optText("i-mood", d.mood, lang),
    d.details,
  ].map((p) => (p || "").trim().replace(/[.,]+$/, "")).filter(Boolean);

  const neg = (d.negative || "").trim();
  const L = lang === "en"
    ? { ratio: "Aspect ratio", avoid: "Avoid", negative: "Negative prompt" }
    : { ratio: "Proporção", avoid: "Evitar", negative: "Prompt negativo" };

  const body = pieces.join(", ");
  switch (d.tool) {
    case "midjourney": {
      let p = body;
      if (d.ratio) p += ` --ar ${d.ratio}`;
      if (neg) p += ` --no ${neg}`;
      return p;
    }
    case "sd": {
      const out = [body];
      if (neg) out.push(`${L.negative}: ${neg}`);
      if (d.ratio) out.push(`${L.ratio}: ${d.ratio}`);
      return out.join("\n\n");
    }
    case "dalle": {
      // Frase natural: primeira letra maiúscula e ponto final.
      const sentence = body.charAt(0).toUpperCase() + body.slice(1) + ".";
      const out = [sentence];
      if (d.ratio) out.push(`${L.ratio} ${d.ratio}.`);
      if (neg) out.push(`${L.avoid}: ${neg}.`);
      return out.join(" ");
    }
    default: {
      const out = [body];
      if (d.ratio) out.push(`${L.ratio}: ${d.ratio}`);
      if (neg) out.push(`${L.avoid}: ${neg}`);
      return out.join("\n");
    }
  }
}

// ---------- Armazenamento local (pode falhar em janela anônima) ----------

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* sem armazenamento: segue sem salvar */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* idem */
    }
  },
};

// ---------- Estado da interface ----------

const $ = (sel) => document.querySelector(sel);
const forms = { text: $("#textForm"), image: $("#imageForm") };
const output = $("#output");
const MODES = ["assistant", "text", "image"];
let mode = MODES.includes(store.get("pm.mode", "assistant")) ? store.get("pm.mode", "assistant") : "assistant";

// O que está no quadro "Seu prompt" de cada aba. "detached" = a pessoa editou
// à mão (ou carregou do histórico / da IA) e o formulário não sobrescreve mais.
const outState = {
  assistant: { text: "", detached: true },
  text: { text: "", detached: false },
  image: { text: "", detached: false },
};
Object.assign(outState, store.get("pm.out", {}));
for (const m of MODES) if (!outState[m] || typeof outState[m].text !== "string") outState[m] = { text: "", detached: m === "assistant" };

const isFormMode = () => mode === "text" || mode === "image";

function saveOutState() {
  store.set("pm.out", outState);
}

function setOutput(text, opts = {}) {
  output.value = text;
  outState[mode].text = text;
  if (opts.detached !== undefined) outState[mode].detached = opts.detached;
  updateCounter();
  updateDetachedNotice();
  saveOutState();
}

function updateDetachedNotice() {
  $("#detachedNotice").hidden = !(isFormMode() && outState[mode].detached);
}

function updateCounter() {
  const text = output.value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  $("#counter").textContent = `${text.length} caracteres · ${words} palavras`;
}

// ---------- Formulários ----------

function fillSelects() {
  for (const [id, opts] of Object.entries(OPTIONS)) {
    const select = document.getElementById(id);
    select.replaceChildren(new Option(id === "t-lang" ? "— mesmo do prompt —" : "— livre —", ""));
    for (const [key, pt] of opts) select.add(new Option(pt, key));
  }
}

function readForm(form) {
  const data = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    data[el.name] = el.type === "checkbox" ? el.checked : el.value.trim();
  }
  return data;
}

function writeForm(form, values) {
  for (const el of form.elements) {
    if (!el.name || !(el.name in values)) continue;
    if (el.type === "checkbox") el.checked = Boolean(values[el.name]);
    else el.value = values[el.name];
  }
}

function resetForm(form) {
  // Mantém preferências de estrutura/idioma/ferramenta ao limpar.
  const keep = ["structure", "promptLang", "tool"];
  for (const el of form.elements) {
    if (!el.name || keep.includes(el.name)) continue;
    if (el.type === "checkbox") el.checked = false;
    else el.value = "";
  }
}

function render() {
  if (!isFormMode()) return;
  const data = readForm(forms[mode]);
  store.set(`pm.form.${mode}`, data);
  updateLangNotice(data);
  if (outState[mode].detached) return;
  setOutput(mode === "text" ? buildTextPrompt(data) : buildImagePrompt(data));
}

// ---------- Aviso de idiomas misturados ----------

const FREE_TEXT = {
  text: ["role", "task", "context", "audience", "constraints", "examples"],
  image: ["subject", "action", "setting", "palette", "details", "negative"],
};
const PT_HINT = /[ãõçáéíóúâêôà]|\b(de|do|da|dos|das|um|uma|para|com|não|que|sobre|seu|sua|em|na|os|ou)\b/i;
const EN_HINT = /\b(the|of|with|and|for|is|are|your|this|that|wearing|in|at|an)\b/i;

// Campos digitados em outro idioma que não o do prompt final.
function mismatchedFields(data) {
  const target = data.promptLang === "en" ? "en" : "pt";
  // No modo texto só avisamos PT→EN: contexto em inglês (código, por exemplo) é comum e intencional.
  if (mode === "text" && target === "pt") return [];
  const looksWrong = target === "en" ? PT_HINT : EN_HINT;
  return FREE_TEXT[mode].filter((name) => data[name] && looksWrong.test(data[name]));
}

function updateLangNotice(data) {
  const fields = isFormMode() ? mismatchedFields(data) : [];
  $("#langNotice").hidden = fields.length === 0;
  if (fields.length) {
    const target = data.promptLang === "en" ? "inglês" : "português";
    const source = data.promptLang === "en" ? "português" : "inglês";
    $("#langNoticeText").textContent = `Alguns campos estão em ${source}, mas o prompt vai sair em ${target}.`;
  }
}

// ---------- Modelos (prontos e salvos por você) ----------

function getTemplates(m) {
  const t = store.get(`pm.templates.${m}`, []);
  return Array.isArray(t) ? t : [];
}

function fillPresets() {
  const select = $("#presetSelect");
  select.replaceChildren(new Option("— escolha um modelo —", ""));
  if (!isFormMode()) return;
  const builtIn = document.createElement("optgroup");
  builtIn.label = "Prontos";
  PRESETS[mode].forEach((p, i) => builtIn.append(new Option(p.name, `p:${i}`)));
  select.append(builtIn);
  const mine = getTemplates(mode);
  if (mine.length) {
    const group = document.createElement("optgroup");
    group.label = "Meus modelos";
    for (const t of mine) group.append(new Option(t.name, `u:${t.id}`));
    select.append(group);
  }
  resetDeleteButton();
}

function selectedTemplate() {
  const v = $("#presetSelect").value;
  if (!v.startsWith("u:")) return null;
  return getTemplates(mode).find((t) => String(t.id) === v.slice(2)) || null;
}

function applyPreset(values, name) {
  resetForm(forms[mode]);
  writeForm(forms[mode], values);
  outState[mode].detached = false;
  render();
  toast(`Modelo “${name}” aplicado`);
}

function saveTemplate() {
  const name = $("#templateName").value.trim();
  if (!name) return toast("Dê um nome ao modelo antes de salvar");
  const templates = getTemplates(mode).filter((t) => t.name !== name);
  templates.push({ id: Date.now(), name, values: readForm(forms[mode]) });
  store.set(`pm.templates.${mode}`, templates);
  $("#templateName").value = "";
  fillPresets();
  toast(`Modelo “${name}” salvo`);
}

let deleteArmed = false;
function resetDeleteButton() {
  deleteArmed = false;
  const btn = $("#deleteTemplate");
  btn.textContent = "Excluir modelo";
  btn.hidden = !selectedTemplate();
}

function deleteTemplate() {
  const t = selectedTemplate();
  if (!t) return;
  // Sem confirm() (bloqueado em alguns visualizadores): o primeiro clique só pede confirmação.
  if (!deleteArmed) {
    deleteArmed = true;
    $("#deleteTemplate").textContent = "Clique de novo para excluir";
    setTimeout(resetDeleteButton, 4000);
    return;
  }
  store.set(`pm.templates.${mode}`, getTemplates(mode).filter((x) => x.id !== t.id));
  fillPresets();
  toast(`Modelo “${t.name}” excluído`);
}

// ---------- Abas ----------

function assistantKind() {
  return $("#a-kind-image").checked ? "image" : "text";
}

// Qual tipo de prompt está no quadro: texto ou imagem.
function currentKind() {
  return mode === "assistant" ? assistantKind() : mode;
}

const PLACEHOLDERS = {
  assistant: "Descreva o que você quer ao lado e o prompt aparece aqui.",
  text: "Preencha o formulário e o prompt aparece aqui.",
  image: "Preencha o formulário e o prompt aparece aqui.",
};

function updateTestButton() {
  // Não dá para "testar" um prompt de imagem aqui: o Claude não gera imagens.
  $("#testBtn").hidden = aiUnavailable || currentKind() === "image";
}

function setMode(next) {
  mode = next;
  store.set("pm.mode", mode);
  document.querySelectorAll(".tab").forEach((t) => {
    const active = t.dataset.mode === mode;
    t.classList.toggle("active", active);
    t.setAttribute("aria-selected", String(active));
  });
  for (const [m, f] of Object.entries(forms)) f.hidden = m !== mode;
  $("#assistantPanel").hidden = mode !== "assistant";
  $("#presetsBox").hidden = !isFormMode();
  $("#formActions").hidden = !isFormMode();
  if (!isFormMode()) $("#langNotice").hidden = true;
  output.placeholder = PLACEHOLDERS[mode];
  output.value = outState[mode].text;
  updateCounter();
  updateDetachedNotice();
  updateTestButton();
  fillPresets();
  $("#aiBox").hidden = true;
  render();
}

let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}

async function copy(text) {
  if (!text) return toast("Nada para copiar ainda");
  try {
    await navigator.clipboard.writeText(text);
    toast("Copiado! ✅");
  } catch {
    toast("Não consegui copiar — selecione e use Ctrl+C");
  }
}

// ---------- Histórico ----------

function getHistory() {
  const h = store.get("pm.history", []);
  return Array.isArray(h) ? h : [];
}

const MODE_ICONS = { assistant: "💬", text: "📝", image: "🎨" };

function renderHistory() {
  const list = $("#historyList");
  const items = getHistory();
  $("#historyCount").textContent = items.length ? `(${items.length})` : "";
  list.replaceChildren();
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Nenhum prompt salvo ainda.";
    list.append(li);
    return;
  }
  for (const item of items) {
    const li = document.createElement("li");
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = MODE_ICONS[item.mode] || "📝";
    const text = document.createElement("span");
    text.className = "item-text";
    text.textContent = item.text;
    text.title = "Carregar este prompt";
    text.addEventListener("click", () => {
      if (MODES.includes(item.mode) && item.mode !== mode) setMode(item.mode);
      setOutput(item.text, { detached: true });
      toast("Prompt carregado");
    });
    const del = document.createElement("button");
    del.className = "del";
    del.title = "Apagar";
    del.textContent = "✕";
    del.addEventListener("click", () => {
      store.set("pm.history", getHistory().filter((h) => h.id !== item.id));
      renderHistory();
    });
    li.append(tag, text, del);
    list.append(li);
  }
}

function saveToHistory() {
  const text = output.value.trim();
  if (!text) return toast("Nada para salvar ainda");
  const items = getHistory().filter((h) => h.text !== text);
  items.unshift({ id: Date.now(), mode, text });
  store.set("pm.history", items.slice(0, 50));
  renderHistory();
  $("#historyBox").open = true;
  toast("Salvo no histórico ⭐");
}

function download() {
  const text = output.value;
  if (!text) return toast("Nada para baixar ainda");
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `prompt-${currentKind() === "image" ? "imagem" : "texto"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Chamadas ao Claude ----------

const MODEL = "claude-opus-5-5";
const SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.131.0/+esm";
let sdkPromise;

// Dentro do claude.ai a página usa a conta do próprio visitante (capacidade
// "sample"), sem chave de API. Fora dele, usa a chave salva em ⚙️ IA.
const inClaudeViewer = typeof window.claude?.use === "function";
const samplePromise = inClaudeViewer ? window.claude.use("sample") : null;
let aiUnavailable = false;

/**
 * Manda um pedido ao Claude e devolve {text, truncated}. Chama onText(textoCompleto)
 * enquanto a resposta chega. Em caso de erro rejeita com {code, message, text?}.
 */
async function askClaude({ input, onText, signal, effort = "medium", quick = false }) {
  if (inClaudeViewer) {
    const sample = await samplePromise;
    if (!sample) throw { code: "unavailable" };
    const opts = { signal, cache: false, onText: ({ text }) => onText?.(text) };
    if (quick) opts.modelTier = "quick";
    const { text, truncated } = await sample(input, opts);
    return { text, truncated };
  }

  const apiKey = store.get("pm.apiKey", "");
  if (!apiKey) throw { code: "no_key" };
  let Anthropic;
  try {
    sdkPromise ??= import(SDK_URL);
    ({ default: Anthropic } = await sdkPromise);
  } catch {
    sdkPromise = undefined;
    throw { code: "sdk" };
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  let full = "";
  try {
    const stream = client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort },
        // Se o modelo recusar, a API tenta automaticamente outro modelo adequado.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        messages: [{ role: "user", content: input }],
      },
      { signal },
    );
    stream.on("text", (delta) => {
      full += delta;
      onText?.(full);
    });
    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") throw { code: "refused" };
    return { text: full, truncated: message.stop_reason === "max_tokens" };
  } catch (err) {
    if (err?.code && !(err instanceof Error)) throw err;
    if (err instanceof Anthropic.APIUserAbortError || signal?.aborted) throw { code: "cancelled", text: full };
    if (err instanceof Anthropic.AuthenticationError) throw { code: "bad_key" };
    if (err instanceof Anthropic.PermissionDeniedError) throw { code: "forbidden" };
    if (err instanceof Anthropic.RateLimitError) throw { code: "rate_limited", text: full };
    if (err instanceof Anthropic.APIConnectionError) throw { code: "offline", text: full };
    throw { code: "api_error", message: err?.message || String(err), text: full };
  }
}

const AI_ERRORS = {
  unavailable: "A IA não está disponível nesta visualização.",
  no_key: "Cole sua chave de API em ⚙️ IA para usar a IA.",
  bad_key: "Chave de API inválida. Confira em ⚙️ IA.",
  forbidden: "Sua chave não tem permissão para este modelo.",
  sdk: "Não consegui carregar o SDK da Anthropic (sem internet?).",
  offline: "Sem conexão com a IA. Verifique sua internet.",
  not_granted: "Você não autorizou esta página a usar o Claude.",
  sampling_disabled: "O Claude não está disponível nesta conta.",
  rate_limited: "Limite de uso atingido. Espere um pouco e tente de novo.",
  session_expired: "Sua sessão expirou. Entre de novo no claude.ai.",
  refused: "A IA não quis responder a este pedido. Tente reformular.",
  empty_completion: "A IA não devolveu nada. Tente de novo.",
  bad_json: "Não entendi a resposta da IA. Tente de novo ou use “Gerar direto”.",
};

function aiErrorText(e) {
  if (e?.code === "no_key") openSettings();
  if (e?.code === "api_error") return `Erro da API: ${e.message}`;
  return AI_ERRORS[e?.code] || "Falha de conexão com a IA. Tente de novo.";
}

// Lê JSON de uma resposta que pode ter texto ou ``` em volta.
function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    /* tenta os formatos abaixo */
  }
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try {
      return JSON.parse(fence[1]);
    } catch {
      /* idem */
    }
  }
  const start = text.search(/[[{]/);
  const end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      /* desiste */
    }
  }
  return null;
}

// Um pedido por vez: enquanto a IA trabalha, os outros botões de IA ficam travados.
const AI_BUTTONS = ["#improveBtn", "#testBtn", "#translateBtn", "#a-start", "#a-skip", "#a-build", "#a-refineBtn"];
let stopCurrent;

function setBusy(on) {
  for (const sel of AI_BUTTONS) $(sel).disabled = on;
}

async function withAi(stopButton, call) {
  const ctl = new AbortController();
  stopCurrent = () => ctl.abort();
  setBusy(true);
  if (stopButton) $(stopButton).hidden = false;
  try {
    return await call(ctl.signal);
  } finally {
    stopCurrent = undefined;
    setBusy(false);
    if (stopButton) $(stopButton).hidden = true;
  }
}

// ---------- Instruções para a IA ----------

const TOOL_NAMES = {
  generic: "um gerador de imagens genérico",
  midjourney: "Midjourney",
  dalle: "DALL·E / GPT Image",
  sd: "Stable Diffusion / Flux",
};

function improveInstructions() {
  if (currentKind() === "text") {
    return [
      "Você é um engenheiro de prompts especialista. Você recebe um rascunho de prompt e devolve uma versão melhor, pronta para colar em um assistente de IA como Claude ou ChatGPT.",
      "",
      "Como melhorar:",
      "- Preserve a intenção, os fatos e todas as restrições do rascunho. Não invente dados específicos (nomes, números, preços); quando faltar algo essencial, use um marcador entre colchetes, como [nome do produto].",
      "- Deixe a tarefa explícita e acrescente o que costuma faltar: o propósito da tarefa, critérios do que é uma boa resposta e o formato de saída esperado.",
      "- Mantenha o idioma e o estilo de estrutura do rascunho (títulos Markdown, tags XML ou texto simples). Se houver trechos em outro idioma, traduza-os para o idioma principal.",
      "- Seja claro e direto; não encha o prompt de instruções genéricas.",
      "",
      "Responda apenas com o prompt final, sem comentários antes ou depois e sem bloco de código.",
    ].join("\n");
  }
  const d = mode === "image" ? readForm(forms.image) : { tool: "generic", promptLang: "en" };
  const lang = d.promptLang === "pt" ? "português" : "inglês";
  return [
    `Você é especialista em escrever prompts para modelos de geração de imagem. A ferramenta de destino é ${TOOL_NAMES[d.tool] || TOOL_NAMES.generic}.`,
    "Você recebe um rascunho de prompt e devolve uma versão melhor e mais vívida.",
    "",
    "Como melhorar:",
    "- Mantenha o assunto, o estilo e as escolhas do rascunho; enriqueça com detalhes visuais concretos e coerentes (composição, luz, textura, lente, cores).",
    `- Escreva o prompt final em ${lang}, traduzindo o que estiver em outro idioma.`,
    "- Use a sintaxe da ferramenta: no Midjourney, parâmetros como --ar e --no no final; no Stable Diffusion/Flux, o prompt principal seguido de uma linha \"Negative prompt:\"; no DALL·E/GPT Image, uma descrição natural em frases completas.",
    "- Preserve a proporção e a lista do que evitar, se houver.",
    "",
    "Responda apenas com o prompt final, sem comentários antes ou depois e sem bloco de código.",
  ].join("\n");
}

function questionsInstructions(kind, idea) {
  const target = kind === "image"
    ? "geradores de imagem (Midjourney, DALL·E, Stable Diffusion…)"
    : "assistentes de IA de texto (Claude, ChatGPT…)";
  const topics = kind === "image"
    ? "Pense em estilo visual, cenário, composição, cores, proporção e ferramenta."
    : "Pense em objetivo, público, contexto, formato, tom e tamanho.";
  return [
    `Você ajuda pessoas a escrever prompts para ${target}. A pessoa descreveu o que quer:`,
    "",
    `<pedido>\n${idea}\n</pedido>`,
    "",
    `Escolha de 2 a 4 perguntas curtas, em português do Brasil, sobre as informações que ainda faltam e que mais mudariam a qualidade do resultado. ${topics} Não pergunte o que o pedido já responde. Para cada pergunta, dê um exemplo curto de resposta que combine com o pedido.`,
    "",
    "Responda só com JSON, sem texto antes ou depois, neste formato:",
    '{"questions":[{"question":"...","example":"..."}]}',
  ].join("\n");
}

function buildInstructions(kind, idea, qa) {
  const answers = qa.length
    ? ["", "<respostas>", ...qa.map(({ question, answer }) => `P: ${question}\nR: ${answer || "(sem resposta — decida algo sensato ou use um [marcador])"}`), "</respostas>"]
    : [];
  if (kind === "image") {
    return [
      "Você é especialista em prompts para geradores de imagem. Escreva um prompt a partir do pedido abaixo.",
      "",
      `<pedido>\n${idea}\n</pedido>`,
      ...answers,
      "",
      "Como escrever:",
      "- Em inglês, como uma descrição visual concreta: assunto, ação, cenário, estilo, iluminação, enquadramento, cores e clima.",
      "- Se a pessoa citou uma ferramenta, use a sintaxe dela (Midjourney: --ar e --no no final; Stable Diffusion/Flux: linha \"Negative prompt:\"). Sem ferramenta citada, escreva um parágrafo natural e, se fizer sentido, uma linha \"Avoid: …\".",
      "- Respeite tudo o que a pessoa pediu e preencha o que faltar com escolhas coerentes com o pedido.",
      "",
      "Responda apenas com o prompt final, sem comentários antes ou depois e sem bloco de código.",
    ].join("\n");
  }
  return [
    "Você é um engenheiro de prompts especialista. Escreva um prompt pronto para colar em um assistente de IA (Claude, ChatGPT) a partir do pedido abaixo.",
    "",
    `<pedido>\n${idea}\n</pedido>`,
    ...answers,
    "",
    "Como escrever:",
    "- Diga quem a IA deve ser, se isso ajudar, e explique a tarefa e o propósito dela.",
    "- Inclua o contexto e os detalhes que a pessoa deu; explique o motivo das restrições quando ele for claro.",
    "- Diga o formato, o tom e o tamanho esperados para a resposta.",
    "- Não invente dados específicos (nomes, preços, datas). Onde faltar algo essencial, use um marcador entre colchetes, como [nome da loja].",
    "- Escreva em português do Brasil, a menos que o pedido indique outro idioma. Use títulos curtos só se deixarem o prompt mais fácil de ler.",
    "",
    "Responda apenas com o prompt final, sem comentários antes ou depois e sem bloco de código.",
  ].join("\n");
}

function refineInstructions(prompt, change) {
  return [
    "Ajuste o prompt abaixo conforme o pedido de mudança. Mantenha tudo o que não foi pedido para mudar e o mesmo idioma.",
    "",
    `<prompt>\n${prompt}\n</prompt>`,
    "",
    `<mudanca>\n${change}\n</mudanca>`,
    "",
    "Responda apenas com o prompt ajustado, sem comentários antes ou depois e sem bloco de código.",
  ].join("\n");
}

// ---------- Melhorar e testar (caixa da IA) ----------

function setAiBoxState(state, msg) {
  const out = $("#aiOutput").value;
  $("#useAiBtn").disabled = state === "generating" || !out;
  $("#copyAiBtn").disabled = state === "generating" || !out;
  const status = $("#aiStatus");
  status.textContent = msg || "";
  status.classList.toggle("error", state === "error");
}

async function runInAiBox(title, canUse, input, effort) {
  const aiOutput = $("#aiOutput");
  $("#aiTitle").textContent = title;
  $("#useAiBtn").hidden = !canUse;
  $("#aiBox").hidden = false;
  aiOutput.value = "";
  setAiBoxState("generating", "Pensando…");
  await withAi("#stopAiBtn", async (signal) => {
    try {
      const { truncated } = await askClaude({
        input,
        signal,
        effort,
        onText: (text) => {
          aiOutput.value = text;
          aiOutput.scrollTop = aiOutput.scrollHeight;
        },
      });
      setAiBoxState("done", truncated ? "Pronto (resposta cortada por tamanho)." : "Pronto ✨");
    } catch (e) {
      aiOutput.value = e?.text ?? "";
      if (e?.code === "cancelled") setAiBoxState("done", "Interrompido.");
      else setAiBoxState("error", aiErrorText(e));
    }
  });
}

function improveWithAI() {
  const draft = output.value.trim();
  if (!draft) return toast("Monte um prompt primeiro");
  runInAiBox("Versão melhorada", true, `${improveInstructions()}\n\nRascunho do prompt:\n\n${draft}`, "medium");
}

function testPrompt() {
  const draft = output.value.trim();
  if (!draft) return toast("Monte um prompt primeiro");
  runInAiBox("Resposta do teste", false, draft, "medium");
}

// ---------- Traduzir campos ----------

async function translateFields() {
  const data = readForm(forms[mode]);
  const fields = mismatchedFields(data);
  if (!fields.length) return;
  const values = Object.fromEntries(fields.map((f) => [f, data[f]]));
  const target = data.promptLang === "en" ? "inglês" : "português do Brasil";
  const input = [
    `Traduza os valores deste JSON para ${target}. Mantenha as chaves, o sentido, nomes próprios, marcadores entre [colchetes] e as quebras de linha. Não traduza código.`,
    "Responda só com o JSON traduzido, sem texto antes ou depois.",
    "",
    JSON.stringify(values, null, 2),
  ].join("\n");

  const btn = $("#translateBtn");
  btn.textContent = "Traduzindo…";
  await withAi(null, async (signal) => {
    try {
      const { text } = await askClaude({ input, signal, effort: "low", quick: true });
      const translated = parseJson(text);
      if (!translated || typeof translated !== "object") throw { code: "bad_json" };
      const updates = {};
      for (const f of fields) if (typeof translated[f] === "string") updates[f] = translated[f];
      writeForm(forms[mode], updates);
      render();
      toast(outState[mode].detached ? "Campos traduzidos — volte a usar o formulário para atualizar o prompt" : "Campos traduzidos ✅");
    } catch (e) {
      if (e?.code !== "cancelled") toast(aiErrorText(e));
    }
  });
  btn.textContent = "Traduzir campos com IA";
}

// ---------- Assistente ----------

let questions = [];

function setAssistantStatus(msg, isError = false) {
  const el = $("#a-status");
  el.textContent = msg;
  el.classList.toggle("error", isError);
}

function renderQuestions() {
  const list = $("#a-questionList");
  list.replaceChildren();
  questions.forEach((q, i) => {
    const field = document.createElement("div");
    field.className = "field";
    const label = document.createElement("label");
    label.htmlFor = `a-q${i}`;
    label.textContent = q.question;
    const input = document.createElement("textarea");
    input.id = `a-q${i}`;
    input.rows = 2;
    input.placeholder = q.example ? `Ex.: ${q.example}` : "";
    field.append(label, input);
    list.append(field);
  });
  $("#a-questions").hidden = questions.length === 0;
}

function resetAssistant() {
  questions = [];
  renderQuestions();
  $("#a-refine").hidden = true;
  $("#a-reset").hidden = true;
  $("#a-change").value = "";
  setAssistantStatus("");
}

async function askQuestions() {
  const idea = $("#a-idea").value.trim();
  if (!idea) return toast("Descreva primeiro o que você quer");
  resetAssistant();
  setAssistantStatus("Pensando nas perguntas…");
  await withAi("#a-stop", async (signal) => {
    try {
      const { text } = await askClaude({ input: questionsInstructions(assistantKind(), idea), signal, effort: "low", quick: true });
      const parsed = parseJson(text);
      const list = Array.isArray(parsed?.questions) ? parsed.questions : [];
      questions = list
        .filter((q) => q && typeof q.question === "string" && q.question.trim())
        .slice(0, 4)
        .map((q) => ({ question: q.question.trim(), example: typeof q.example === "string" ? q.example.trim() : "" }));
      if (!questions.length) throw { code: "bad_json" };
      renderQuestions();
      $("#a-reset").hidden = false;
      setAssistantStatus("");
      $("#a-q0")?.focus();
    } catch (e) {
      if (e?.code === "cancelled") setAssistantStatus("Interrompido.");
      else setAssistantStatus(aiErrorText(e), true);
    }
  });
}

// Escreve a resposta da IA direto no quadro "Seu prompt", aparecendo aos poucos.
async function streamIntoOutput(input, doneMsg) {
  const previous = output.value;
  await withAi("#a-stop", async (signal) => {
    try {
      const { text, truncated } = await askClaude({
        input,
        signal,
        effort: "medium",
        onText: (t) => {
          output.value = t;
          updateCounter();
        },
      });
      setOutput(text);
      $("#a-refine").hidden = false;
      $("#a-reset").hidden = false;
      setAssistantStatus(truncated ? "Pronto, mas a resposta foi cortada por tamanho." : doneMsg);
      if (window.innerWidth < 860) $(".output-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      // Se não veio nada, devolve o prompt anterior em vez de deixar o quadro vazio.
      setOutput(e?.text || previous);
      if (e?.code === "cancelled") setAssistantStatus("Interrompido.");
      else setAssistantStatus(aiErrorText(e), true);
    }
  });
}

async function buildFromAssistant(skipQuestions) {
  const idea = $("#a-idea").value.trim();
  if (!idea) return toast("Descreva primeiro o que você quer");
  const qa = skipQuestions
    ? []
    : questions.map((q, i) => ({ question: q.question, answer: $(`#a-q${i}`)?.value.trim() || "" }));
  setAssistantStatus("Escrevendo o prompt…");
  await streamIntoOutput(buildInstructions(assistantKind(), idea, qa), "Pronto ✨ Copie, teste ou peça um ajuste.");
}

async function refineFromAssistant() {
  const change = $("#a-change").value.trim();
  if (!output.value.trim()) return toast("Gere um prompt primeiro");
  if (!change) return toast("Diga o que quer mudar");
  setAssistantStatus("Ajustando…");
  await streamIntoOutput(refineInstructions(output.value.trim(), change), "Ajustado ✨");
  $("#a-change").value = "";
}

// ---------- Configurações ----------

function openSettings() {
  $("#apiKey").value = store.get("pm.apiKey", "");
  $("#settings").returnValue = "";
  $("#settings").showModal();
}

$("#settings").addEventListener("close", () => {
  const action = $("#settings").returnValue;
  if (action === "save") {
    const key = $("#apiKey").value.trim();
    if (key) {
      store.set("pm.apiKey", key);
      toast("Chave salva 🔑");
    }
  } else if (action === "forget") {
    store.remove("pm.apiKey");
    toast("Chave apagada");
  }
});

// ---------- Eventos ----------

fillSelects();
for (const [m, form] of Object.entries(forms)) {
  writeForm(form, store.get(`pm.form.${m}`, {}));
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", (e) => e.preventDefault());
}

document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => setMode(t.dataset.mode)));

$("#presetSelect").addEventListener("change", (e) => {
  const v = e.target.value;
  if (v.startsWith("p:")) {
    const preset = PRESETS[mode][Number(v.slice(2))];
    e.target.value = "";
    resetDeleteButton();
    if (preset) applyPreset(preset.values, preset.name);
  } else if (v.startsWith("u:")) {
    const t = selectedTemplate();
    resetDeleteButton();
    if (t) applyPreset(t.values, t.name);
  } else {
    resetDeleteButton();
  }
});
$("#saveTemplate").addEventListener("click", saveTemplate);
$("#templateName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") saveTemplate();
});
$("#deleteTemplate").addEventListener("click", deleteTemplate);

$("#clearForm").addEventListener("click", () => {
  resetForm(forms[mode]);
  outState[mode].detached = false;
  render();
});

output.addEventListener("input", () => {
  outState[mode].text = output.value;
  if (isFormMode()) outState[mode].detached = true;
  updateCounter();
  updateDetachedNotice();
  saveOutState();
});
$("#reattachBtn").addEventListener("click", () => {
  outState[mode].detached = false;
  render();
  toast("Prompt refeito a partir do formulário");
});

$("#copyBtn").addEventListener("click", () => copy(output.value));
$("#saveBtn").addEventListener("click", saveToHistory);
$("#downloadBtn").addEventListener("click", download);
$("#improveBtn").addEventListener("click", improveWithAI);
$("#testBtn").addEventListener("click", testPrompt);
$("#translateBtn").addEventListener("click", translateFields);
$("#stopAiBtn").addEventListener("click", () => stopCurrent?.());
$("#copyAiBtn").addEventListener("click", () => copy($("#aiOutput").value));
$("#useAiBtn").addEventListener("click", () => {
  setOutput($("#aiOutput").value, { detached: true });
  toast("Versão da IA aplicada");
});
$("#openSettings").addEventListener("click", openSettings);

$("#a-start").addEventListener("click", askQuestions);
$("#a-skip").addEventListener("click", () => buildFromAssistant(true));
$("#a-build").addEventListener("click", () => buildFromAssistant(false));
$("#a-refineBtn").addEventListener("click", refineFromAssistant);
$("#a-stop").addEventListener("click", () => stopCurrent?.());
$("#a-reset").addEventListener("click", () => {
  resetAssistant();
  $("#a-idea").value = "";
  store.set("pm.assistant", { kind: assistantKind(), idea: "" });
  setOutput("");
  $("#a-idea").focus();
});
$("#a-idea").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) askQuestions();
});
for (const el of ["#a-idea", "#a-kind-text", "#a-kind-image"]) {
  $(el).addEventListener("input", () => {
    store.set("pm.assistant", { kind: assistantKind(), idea: $("#a-idea").value });
    updateTestButton();
  });
}
const savedAssistant = store.get("pm.assistant", {});
if (savedAssistant.kind === "image") $("#a-kind-image").checked = true;
if (typeof savedAssistant.idea === "string") $("#a-idea").value = savedAssistant.idea;

if (inClaudeViewer) {
  // No claude.ai não há chave para configurar, e downloads por link não funcionam.
  $("#openSettings").hidden = true;
  $("#downloadBtn").hidden = true;
  samplePromise.then((sample) => {
    if (sample) return;
    aiUnavailable = true;
    $("#improveBtn").hidden = true;
    $("#translateBtn").hidden = true;
    updateTestButton();
    setAssistantStatus("A IA não está disponível nesta visualização. Use as abas Texto e Imagem.", true);
  });
}

renderHistory();
setMode(mode);
