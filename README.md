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

- **💬 Assistente** — descreva o que você quer em uma frase. A IA faz de 2 a 4 perguntas sobre o que falta, você responde o que souber e ela escreve o prompt. Depois dá para pedir ajustes ("deixe mais curto", "tom mais divertido"). Também tem **Gerar direto**, sem perguntas.
- **📝 Texto** — formulário com papel da IA, tarefa, contexto, público, formato, tom, tamanho, idioma, restrições, exemplos e instruções extras. Monta o prompt em Markdown, tags XML ou texto simples, em português ou inglês.
- **🎨 Imagem** — assunto, ação, cenário, estilo, iluminação, câmera, clima, paleta, detalhes, prompt negativo e proporção, no formato de cada ferramenta (`--ar`/`--no` no Midjourney, `Negative prompt:` no Stable Diffusion/Flux, frase natural no DALL·E).
- **▶ Testar prompt** — roda o prompt de texto no Claude e mostra a resposta, para você ajustar antes de usar.
- **✨ Melhorar com IA** — reescreve o prompt deixando a tarefa, o contexto e o formato mais claros.
- **Suas edições ficam.** Se você editar o prompt à mão, o formulário para de sobrescrevê-lo até você clicar em "Voltar a usar o formulário".
- **Idiomas misturados** — se você escrever em português e pedir o prompt em inglês (ou o contrário, na aba Imagem), aparece um aviso com o botão **Traduzir campos com IA**.
- **Modelos** — modelos prontos e **seus próprios modelos**: salve o formulário com um nome e use de novo depois.
- **Copiar, salvar no histórico e baixar .txt.** Histórico, modelos e formulários ficam salvos no navegador.

### IA

- **No link do claude.ai**, a IA usa a sua própria conta do Claude, sem chave de API. No primeiro uso a página pede permissão.
- **Rodando o site por conta própria** (localhost, Netlify…), clique em **⚙️ IA** e cole uma chave de API da Anthropic ([console.anthropic.com](https://console.anthropic.com/settings/keys)). O modelo usado é o `claude-opus-5-5`.

> 🔒 A chave fica salva só no `localStorage` do seu navegador e vai direto para a API da Anthropic. Como fica acessível no navegador, use uma chave só sua e não use esse recurso em computadores compartilhados. Para abrir o app para outras pessoas usando a sua chave, o certo é colocar a chamada à API num backend (por exemplo, uma Netlify Function).

## Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | Estrutura da página |
| `styles.css` | Visual (com modo escuro automático) |
| `app.js` | Opções, modelos prontos, montagem dos prompts e integração com o Claude |
