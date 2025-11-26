// script.js
// Lógica del chatbot. El cliente sólo usa `fetch` hacia un endpoint proxy
// Expectativa: el endpoint `/api/gemini` recibe { prompt: string } y responde JSON { reply: string }
// Nota: por seguridad la API key de Google debe almacenarse en el servidor/proxy. No pongas claves en el cliente.

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('chat-toggle');
  const panel = document.getElementById('chat-panel');
  const closeBtn = document.getElementById('chat-close');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');

  function openPanel() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    input.focus();
  }

  function closePanel() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  toggle.addEventListener('click', () => {
    if (panel.classList.contains('open')) closePanel(); else openPanel();
  });

  closeBtn.addEventListener('click', closePanel);

  function appendMessage(text, cls) {
    const el = document.createElement('div');
    el.className = 'chatbot-msg ' + cls;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  async function sendToProxy(prompt) {
    // Mostrar indicador de carga
    const loadingEl = appendMessage('Pensando...', 'assistant loading');
    try {
      const resp = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || resp.statusText);
      }

      const data = await resp.json();
      // Se espera { reply: "texto" } desde el proxy; si usas otro shape, ajusta aquí.
      const reply = data.reply || (data.output && data.output[0] && data.output[0].content) || JSON.stringify(data);
      loadingEl.remove();
      appendMessage(reply, 'assistant');
    } catch (err) {
      loadingEl.remove();
      appendMessage('Error: ' + err.message, 'assistant');
      console.error('Error en fetch a /api/gemini:', err);
    }
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    appendMessage(text, 'user');
    input.value = '';
    // Enviar al proxy (que debe reenviar a Google Gemini Flash)
    sendToProxy(text);
  });

  // Enviar con Enter y limpiar con Esc
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      input.value = '';
      input.blur();
    }
  });

  // Shortcut para abrir con Ctrl+K
  document.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      if (panel.classList.contains('open')) closePanel(); else openPanel();
    }
  });
});

/*
Instrucciones rápidas para el proxy (ejemplo conceptual - servidor):

1) Ruta cliente -> POST /api/gemini { prompt }
2) Proxy añade Authorization: Bearer YOUR_SERVER_SIDE_KEY y llama al endpoint de Google Generative API
   (ejemplo server-side: https://generativelanguage.googleapis.com/v1beta2/models/gemini-flash:generateText )
3) Proxy transforma la respuesta a { reply: string } y la devuelve al cliente

Evita poner la API key en este archivo JS. También es posible usar funciones serverless (Cloud Run, Cloud Functions, Vercel, Netlify) como proxy.
*/
