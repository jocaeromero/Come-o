# ✦ Prompt Maker

Monte prompts bem estruturados para IAs de **texto** (Claude, ChatGPT…) e de **imagem** (Midjourney, DALL·E, Stable Diffusion, Flux…) preenchendo um formulário — e, se quiser, peça para o Claude melhorar o resultado.

## Como usar

É um site estático: não precisa instalar nada nem rodar build.

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

(Abrir o `index.html` direto com duplo clique não funciona, porque o navegador bloqueia módulos JS em `file://`.)

Para publicar, envie a pasta para o **Netlify**, **GitHub Pages** ou **Vercel** — não precisa de nenhuma configuração.

## Recursos

- **Aba Texto** — papel da IA, tarefa, contexto, público, formato, tom, tamanho, idioma, restrições, exemplos e instruções extras (pensar passo a passo, fazer perguntas, citar fontes, dar 3 variações). Monta o prompt em Markdown, tags XML ou texto simples, em português ou inglês.
- **Aba Imagem** — assunto, ação, cenário, estilo, iluminação, câmera, clima, paleta, detalhes, prompt negativo e proporção. Formata de acordo com a ferramenta (`--ar`/`--no` no Midjourney, `Negative prompt:` no Stable Diffusion/Flux, frase natural no DALL·E). As opções das listas saem traduzidas para o inglês.
- **Modelos prontos** para começar rápido (post para redes sociais, e-mail, revisão de código, foto de produto, retrato cinematográfico…).
- **Copiar, salvar no histórico e baixar .txt.** O histórico e o formulário ficam salvos no navegador.
- **✨ Melhorar com IA** — envia o rascunho para o Claude (`claude-opus-5-5`) e mostra a versão melhorada em tempo real. Para usar, clique em **⚙️ IA** e cole sua chave de API da Anthropic ([console.anthropic.com](https://console.anthropic.com/settings/keys)).

> 🔒 A chave fica salva só no `localStorage` do seu navegador e vai direto para a API da Anthropic. Como fica acessível no navegador, use uma chave só sua e não use esse recurso em computadores compartilhados. Para abrir o app para outras pessoas usando a sua chave, o certo é colocar a chamada à API num backend (por exemplo, uma Netlify Function).

## Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | Estrutura da página |
| `styles.css` | Visual (com modo escuro automático) |
| `app.js` | Opções, modelos prontos, montagem dos prompts e integração com o Claude |
