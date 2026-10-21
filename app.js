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

  let lead = subject;
  if (style && subject) lead = lang === "en" ? `${style} of ${subject}` : `${style} de ${subject}`;
  else if (style) lead = style;

  const palette = d.palette ? (lang === "en" ? `${d.palette} color palette` : `paleta de cores: ${d.palette}`) : "";
  const pieces = [
    lead,
    d.action,
    d.setting,
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

// ---------- Interface ----------

const $ = (sel) => document.querySelector(sel);
const forms = { text: $("#textForm"), image: $("#imageForm") };
const output = $("#output");
let mode = store.get("pm.mode", "text") === "image" ? "image" : "text";

function fillSelects() {
  for (const [id, opts] of Object.entries(OPTIONS)) {
    const select = document.getElementById(id);
    select.replaceChildren(new Option(id === "t-lang" ? "— mesmo do prompt —" : "— livre —", ""));
    for (const [key, pt] of opts) select.add(new Option(pt, key));
  }
}

function fillPresets() {
  const select = $("#presetSelect");
  select.replaceChildren(new Option("— escolha um modelo —", ""));
  PRESETS[mode].forEach((p, i) => select.add(new Option(p.name, String(i))));
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
  const data = readForm(forms[mode]);
  output.value = mode === "text" ? buildTextPrompt(data) : buildImagePrompt(data);
  updateCounter();
  store.set(`pm.form.${mode}`, data);
}

function updateCounter() {
  const text = output.value;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  $("#counter").textContent = `${text.length} caracteres · ${words} palavras`;
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
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
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
    tag.textContent = item.mode === "image" ? "🎨" : "📝";
    const text = document.createElement("span");
    text.className = "item-text";
    text.textContent = item.text;
    text.title = "Carregar este prompt";
    text.addEventListener("click", () => {
      output.value = item.text;
      updateCounter();
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
  a.download = `prompt-${mode === "image" ? "imagem" : "texto"}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Melhorar com IA (Claude) ----------

const MODEL = "claude-opus-5-5";
const SDK_URL = "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.131.0/+esm";
let sdkPromise;
let stopCurrent;

// Dentro do claude.ai a página usa a conta do próprio visitante (capacidade
// "sample"), sem chave de API. Fora dele, usa a chave salva em ⚙️ IA.
const inClaudeViewer = typeof window.claude?.use === "function";
const samplePromise = inClaudeViewer ? window.claude.use("sample") : null;

const TOOL_NAMES = {
  generic: "um gerador de imagens genérico",
  midjourney: "Midjourney",
  dalle: "DALL·E / GPT Image",
  sd: "Stable Diffusion / Flux",
};

function systemPrompt() {
  if (mode === "text") {
    return [
      "Você é um engenheiro de prompts especialista. Você recebe um rascunho de prompt, montado a partir de um formulário, e devolve uma versão melhor, pronta para colar em um assistente de IA como Claude ou ChatGPT.",
      "",
      "Como melhorar:",
      "- Preserve a intenção, os fatos e todas as restrições do rascunho. Não invente dados específicos (nomes, números, preços); quando faltar algo essencial, use um marcador entre colchetes, como [nome do produto].",
      "- Deixe a tarefa explícita e acrescente o que costuma faltar: o propósito da tarefa, critérios do que é uma boa resposta e o formato de saída esperado.",
      "- Mantenha o idioma e o estilo de estrutura do rascunho (títulos Markdown, tags XML ou texto simples).",
      "- Seja claro e direto; não encha o prompt de instruções genéricas.",
      "",
      "Responda apenas com o prompt final, sem comentários antes ou depois e sem bloco de código.",
    ].join("\n");
  }
  const d = readForm(forms.image);
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

function setAiState(state, msg) {
  const generating = state === "generating";
  $("#improveBtn").disabled = generating;
  $("#stopAiBtn").hidden = !generating;
  $("#useAiBtn").disabled = generating || !$("#aiOutput").value;
  $("#copyAiBtn").disabled = generating || !$("#aiOutput").value;
  $("#aiStatus").textContent = msg || "";
}

function errorMessage(Anthropic, err) {
  if (err instanceof Anthropic.AuthenticationError) return "Chave de API inválida. Confira em ⚙️ IA.";
  if (err instanceof Anthropic.PermissionDeniedError) return "Sua chave não tem permissão para este modelo.";
  if (err instanceof Anthropic.RateLimitError) return "Limite de uso atingido. Espere um pouco e tente de novo.";
  if (err instanceof Anthropic.APIConnectionError) return "Sem conexão com a API. Verifique sua internet.";
  if (err instanceof Anthropic.APIError) return `Erro da API (${err.status ?? "?"}): ${err.message}`;
  return `Erro: ${err.message || err}`;
}

const SAMPLE_ERRORS = {
  not_granted: "Você não autorizou esta página a usar o Claude.",
  sampling_disabled: "O Claude não está disponível nesta conta.",
  rate_limited: "Limite de uso atingido. Espere um pouco e tente de novo.",
  session_expired: "Sua sessão expirou. Entre de novo no claude.ai.",
  refused: "A IA não quis responder a este pedido. Tente reformular.",
  empty_completion: "A IA não devolveu nada. Tente de novo.",
};

async function improveWithSample(draft) {
  const sample = await samplePromise;
  if (!sample) return toast("A IA não está disponível nesta visualização");

  const aiOutput = $("#aiOutput");
  const ctl = new AbortController();
  stopCurrent = () => ctl.abort();
  $("#aiBox").hidden = false;
  aiOutput.value = "";
  setAiState("generating", "Pensando…");
  try {
    const { truncated } = await sample(`${systemPrompt()}\n\nRascunho do prompt:\n\n${draft}`, {
      signal: ctl.signal,
      cache: false,
      onText: ({ text }) => {
        aiOutput.value = text;
        aiOutput.scrollTop = aiOutput.scrollHeight;
      },
    });
    setAiState("done", truncated ? "Pronto (resposta cortada por tamanho)." : "Pronto ✨");
  } catch (e) {
    aiOutput.value = e.text ?? "";
    if (e.code === "cancelled") setAiState("done", "Interrompido.");
    else setAiState("error", SAMPLE_ERRORS[e.code] || "Falha de conexão com o Claude. Tente de novo.");
  } finally {
    stopCurrent = undefined;
  }
}

async function improveWithAI() {
  const draft = output.value.trim();
  if (!draft) return toast("Preencha o formulário primeiro");
  if (inClaudeViewer) return improveWithSample(draft);
  const apiKey = store.get("pm.apiKey", "");
  if (!apiKey) {
    openSettings();
    return toast("Cole sua chave de API para usar a IA");
  }

  const aiOutput = $("#aiOutput");
  $("#aiBox").hidden = false;
  aiOutput.value = "";
  setAiState("generating", "Gerando…");

  let Anthropic;
  try {
    sdkPromise ??= import(SDK_URL);
    ({ default: Anthropic } = await sdkPromise);
  } catch {
    sdkPromise = undefined;
    return setAiState("error", "Não consegui carregar o SDK da Anthropic (sem internet?).");
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      // Se o modelo recusar, a API tenta automaticamente outro modelo adequado.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: systemPrompt(),
      messages: [{ role: "user", content: `Rascunho do prompt:\n\n${draft}` }],
    });
    stopCurrent = () => stream.abort();
    stream.on("text", (delta) => {
      aiOutput.value += delta;
      aiOutput.scrollTop = aiOutput.scrollHeight;
    });
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      setAiState("error", "A IA não quis responder a este pedido. Tente reformular.");
    } else if (message.stop_reason === "max_tokens") {
      setAiState("done", "Pronto (resposta cortada por tamanho).");
    } else {
      const servedBy = message.model && message.model !== MODEL ? ` · respondido por ${message.model}` : "";
      setAiState("done", `Pronto ✨${servedBy}`);
    }
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError) setAiState("done", "Interrompido.");
    else setAiState("error", errorMessage(Anthropic, err));
  } finally {
    stopCurrent = undefined;
  }
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
  const preset = PRESETS[mode][Number(e.target.value)];
  if (!preset) return;
  resetForm(forms[mode]);
  writeForm(forms[mode], preset.values);
  render();
  e.target.value = "";
  toast(`Modelo “${preset.name}” aplicado — troque o que está entre [colchetes]`);
});

$("#clearForm").addEventListener("click", () => {
  resetForm(forms[mode]);
  render();
});

output.addEventListener("input", updateCounter);
$("#copyBtn").addEventListener("click", () => copy(output.value));
$("#saveBtn").addEventListener("click", saveToHistory);
$("#downloadBtn").addEventListener("click", download);
$("#improveBtn").addEventListener("click", improveWithAI);
$("#stopAiBtn").addEventListener("click", () => stopCurrent?.());
$("#copyAiBtn").addEventListener("click", () => copy($("#aiOutput").value));
$("#useAiBtn").addEventListener("click", () => {
  output.value = $("#aiOutput").value;
  updateCounter();
  toast("Versão da IA aplicada");
});
$("#openSettings").addEventListener("click", openSettings);

if (inClaudeViewer) {
  // No claude.ai não há chave para configurar, e downloads por link não funcionam.
  $("#openSettings").hidden = true;
  $("#downloadBtn").hidden = true;
  samplePromise.then((sample) => {
    if (!sample) $("#improveBtn").hidden = true;
  });
}

renderHistory();
setMode(mode);
