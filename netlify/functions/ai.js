const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ success:false, error:'Method not allowed' }) };
  if (!process.env.OPENAI_API_KEY) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success:false, error:'OPENAI_API_KEY not set' }) };
  }
  try {
    const { type = 'generate_event', text = '' } = JSON.parse(event.body || '{}');
    let userPrompt = '';
    if (type === 'generate_event') {
      userPrompt = `Eres un generador de eventos. A partir de la entrada genera SOLO un JSON con:
{"title": string, "description": string, "start": string (ISO) o null, "end": string (ISO) o null, "allDay": boolean, "category": string (Personal, Trabajo, Salud, Finanzas, Otros), "color": string (hex)}
Entrada: """${text}"""
RESPONDE SOLO EL JSON.`;
    } else if (type === 'categorize') {
      userPrompt = `Categoriza "${text}" en: Personal, Trabajo, Salud, Finanzas, Otros. Responde SOLO con JSON: {"category":"...","color":"#..."} `;
    } else {
      userPrompt = `Analiza: ${text} y responde JSON.`;
    }
    const system = `Eres estricto: responde SOLO JSON válido.`;
    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 350
    };
    const openaiRes = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return { statusCode: openaiRes.status, headers: corsHeaders, body: JSON.stringify({ success:false, error: errText }) };
    }
    const openaiJson = await openaiRes.json();
    const textResp = openaiJson?.choices?.[0]?.message?.content || openaiJson?.choices?.[0]?.text || '';
    let parsed;
    try {
      parsed = JSON.parse(textResp);
    } catch (err) {
      const m = textResp.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else parsed = { raw: textResp };
    }
    return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true, result: parsed }) };
  } catch (error) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ success:false, error: error.message }) };
  }
};