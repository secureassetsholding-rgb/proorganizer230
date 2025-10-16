// ia.js - IA híbrida (module)
const DEFAULT_CATEGORIES = [
  { id: 'personal', name: 'Personal', color: '#0ea5ff', keywords: ['cumple','cumpleaños','aniversario','familia','amigo'] },
  { id: 'trabajo', name: 'Trabajo', color: '#10b981', keywords: ['reunión','reunion','meeting','proyecto','entrega','presentación','call'] },
  { id: 'salud', name: 'Salud', color: '#ef4444', keywords: ['doctor','médico','salud','consulta','cita'] },
  { id: 'finanzas', name: 'Finanzas', color: '#f59e0b', keywords: ['pago','factura','pagar','gasto','presupuesto'] },
  { id: 'otros', name: 'Otros', color: '#7c3aed', keywords: [] }
];

function titleCase(s){ return (s||'').replace(/\w\S*/g, w=>w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()); }
function detectCategory(text){
  const t = (text||'').toLowerCase();
  for(const c of DEFAULT_CATEGORIES) for(const kw of c.keywords) if(t.includes(kw)) return c;
  return DEFAULT_CATEGORIES[DEFAULT_CATEGORIES.length-1];
}
function suggestTime(text){
  const now = new Date();
  let dayOffset = 0;
  const t = (text||'').toLowerCase();
  if(/\bmañana\b|\btomorrow\b/.test(t)) dayOffset = 1;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()+dayOffset, 10, 0, 0);
  return { start: d.toISOString(), end: new Date(d.getTime()+3600000).toISOString(), allDay: false };
}
function suggestTitle(text){
  if(!text || !text.trim()) return 'Nuevo evento';
  const first = text.trim().split(/[.!?]/)[0];
  return titleCase(first.split(/\s+/).slice(0,7).join(' '));
}

async function callServerless(type, text, timeout = 7000){
  const endpoint = window.AI_ENDPOINT || (location.hostname.includes('vercel.app') ? '/api/ai' : '/.netlify/functions/ai');
  try {
    const controller = new AbortController();
    const id = setTimeout(()=>controller.abort(), timeout);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, text }),
      signal: controller.signal
    });
    clearTimeout(id);
    if(!res.ok) throw new Error(`AI server error ${res.status}`);
    const j = await res.json();
    if(j && j.success && j.result) return j.result;
    return j.result || j;
  } catch (e) {
    console.warn('AI server failed:', e.message);
    throw e;
  }
}

export async function generateEventFromText(text){
  try {
    const r = await callServerless('generate_event', text);
    if(r && r.title) return r;
  } catch(e){ /* fallback */ }
  const times = suggestTime(text);
  const cat = detectCategory(text);
  return {
    title: suggestTitle(text),
    description: (text||''),
    start: times.start,
    end: times.end,
    allDay: false,
    category: cat.name,
    color: cat.color
  };
}

export async function categorizeText(text){
  try {
    const r = await callServerless('categorize', text);
    if(r && r.category) return r;
  } catch(e){}
  const c = detectCategory(text);
  return { category: c.name, color: c.color };
}

export { DEFAULT_CATEGORIES as categories };