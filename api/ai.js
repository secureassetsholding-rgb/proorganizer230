const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method === 'OPTIONS'){ res.status(200).end(); return; }
  if(req.method !== 'POST'){ res.status(405).json({ success:false, error:'Method not allowed' }); return; }
  if(!process.env.OPENAI_API_KEY){ res.status(500).json({ success:false, error:'OPENAI_API_KEY not set' }); return; }
  try {
    const { type = 'generate_event', text = '' } = req.body || {};
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
    const payload = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Eres estricto: responde SOLO JSON válido.' },
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
      res.status(openaiRes.status).json({ success:false, error: errText });
      return;
    }
    const openaiJson = await openaiRes.json();
    const textResp = openaiJson?.choices?.[0]?.message?.content || openaiJson?.choices?.[0]?.text || '';
    let parsed;
    try { parsed = JSON.parse(textResp); } catch(err){
      const m = textResp.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { raw: textResp };
    }
    res.status(200).json({ success:true, result: parsed });
  } catch(err){
    res.status(500).json({ success:false, error: err.message || String(err) });
  }
}