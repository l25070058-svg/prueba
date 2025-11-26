// server.js - ejemplo de proxy para Google Gemini Flash
// Requisitos: Node 18+, instalar dependencias con `npm install`
const express = require('express');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// CORS mínimo para pruebas locales (ajusta en producción)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.post('/api/gemini', async (req, res) => {
  const prompt = req.body && req.body.prompt;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const apiKey = process.env.GEN_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEN_API_KEY not configured on server' });

  try {
    // Endpoint de ejemplo: ajuste según la versión de la API de Google que uses
    const url = 'https://generativelanguage.googleapis.com/v1beta2/models/gemini-flash:generateText';

    const gResp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // Body ejemplo: ajustar según la spec de la API
        prompt: { text: prompt }
      })
    });

    if (!gResp.ok) {
      const txt = await gResp.text();
      return res.status(502).json({ error: 'Upstream error', detail: txt });
    }

    const data = await gResp.json();

    // Intentar extraer el texto generado de varias formas según la respuesta
    let reply = '';
    if (data?.candidates && data.candidates[0]?.content) reply = data.candidates[0].content;
    else if (data?.output && data.output[0]?.content) reply = data.output[0].content;
    else if (data?.response) reply = data.response;
    else reply = JSON.stringify(data);

    res.json({ reply });
  } catch (err) {
    console.error('Error contacting Gemini API:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Proxy server listening on http://localhost:${port}`);
});
