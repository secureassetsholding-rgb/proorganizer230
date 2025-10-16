import { db } from '/firebase-config.js';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  doc,
  query,
  orderBy
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

function toMilli(isoOrDate){
  if(!isoOrDate) return Date.now();
  const t = Date.parse(isoOrDate);
  return isNaN(t) ? Date.now() : t;
}

export async function createEvent(payload){
  const c = collection(db, 'events');
  const start = payload.start || new Date().toISOString();
  const end = payload.end || new Date(new Date(start).getTime() + 3600000).toISOString();
  const data = {
    title: payload.title || 'Nuevo evento',
    description: payload.description || '',
    start,
    end,
    allDay: !!payload.allDay,
    category: payload.category || 'Otros',
    color: payload.color || '#0ea5ff',
    owner: payload.owner || null,
    start_ts: toMilli(start),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(c, data);
  return ref.id;
}

export async function updateEvent(eventId, updates){
  const ref = doc(db, 'events', eventId);
  const data = {...updates};
  if(updates.start) data.start_ts = toMilli(updates.start);
  data.updatedAt = serverTimestamp();
  await updateDoc(ref, data);
}

export async function deleteEvent(eventId){
  await deleteDoc(doc(db, 'events', eventId));
}

export function subscribeToEvents(onChange, onError){
  try {
    const q = query(collection(db, 'events'), orderBy('start_ts','asc'));
    return onSnapshot(q, snapshot => {
      const out = [];
      snapshot.forEach(d => {
        const data = d.data();
        out.push({
          id: d.id,
          title: data.title || 'Sin título',
          start: data.start || null,
          end: data.end || null,
          allDay: !!data.allDay,
          color: data.color || '#0ea5ff',
          raw: data
        });
      });
      onChange(out, snapshot);
    }, onError);
  } catch(e){
    const unsub = onSnapshot(collection(db,'events'), snapshot => {
      const out = [];
      snapshot.forEach(d => out.push({ id:d.id, title:d.data().title || 'Sin título', start:d.data().start || null, end:d.data().end || null, allDay:!!d.data().allDay, color:d.data().color||'#0ea5ff', raw:d.data() }));
      onChange(out, snapshot);
    }, onError);
    return unsub;
  }
}

/* Generic CRUD for other modules */
export async function createDoc(collectionName, payload){
  const c = collection(db, collectionName);
  const data = { ...payload, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
  const ref = await addDoc(c, data);
  return ref.id;
}

export async function updateDocById(collectionName, id, updates){
  const ref = doc(db, collectionName, id);
  updates.updatedAt = serverTimestamp();
  await updateDoc(ref, updates);
}

export async function deleteDocById(collectionName, id){
  await deleteDoc(doc(db, collectionName, id));
}

export function subscribeToCollection(collectionName, onChange, onError){
  const q = query(collection(db, collectionName), orderBy('createdAt','desc'));
  return onSnapshot(q, snapshot => {
    const list = [];
    snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
    onChange(list, snapshot);
  }, onError);
}