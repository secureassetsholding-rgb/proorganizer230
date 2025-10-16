import { subscribeToEvents, createEvent, updateEvent, deleteEvent } from '/js/firestore.js';
import { generateEventFromText, categories as IA_CATEGORIES } from '/ia.js';
import { auth } from '/firebase-config.js';

document.addEventListener('DOMContentLoaded', async () => {
  document.body.dataset.requiresAuth = "true";
  const calendarEl = document.getElementById('calendar');
  if(!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
    navLinks: true,
    selectable: true,
    nowIndicator: true,
    eventClick: function(info){
      openEditModal(info.event);
    },
    dateClick: function(info){
      openCreateModal(info.dateStr);
    },
    events: []
  });

  calendar.render();

  const btnNew = document.getElementById('btn-new-event');
  const modalEl = document.getElementById('eventModal');
  const modal = new bootstrap.Modal(modalEl);
  const fldTitle = document.getElementById('ev-title');
  const fldDesc = document.getElementById('ev-desc');
  const fldStart = document.getElementById('ev-start');
  const fldEnd = document.getElementById('ev-end');
  const fldAllDay = document.getElementById('ev-allday');
  const fldCategory = document.getElementById('ev-category');
  const fldColor = document.getElementById('ev-color');
  const btnSave = document.getElementById('ev-save');
  const btnDelete = document.getElementById('ev-delete');
  const btnAISuggest = document.getElementById('ev-ai');

  let editingId = null;

  const categories = IA_CATEGORIES;
  categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.name;
    opt.textContent = c.name;
    fldCategory.appendChild(opt);
  });

  btnNew.addEventListener('click', () => openCreateModal());

  btnAISuggest?.addEventListener('click', async () => {
    const text = fldDesc.value || fldTitle.value || '';
    btnAISuggest.disabled = true;
    btnAISuggest.textContent = 'Sugerir...';
    try {
      const s = await generateEventFromText(text);
      if(s.title) fldTitle.value = s.title;
      if(s.description) fldDesc.value = s.description;
      if(s.start) fldStart.value = s.start.slice(0,16);
      if(s.end) fldEnd.value = s.end.slice(0,16);
      if(s.category) fldCategory.value = s.category;
      if(s.color) fldColor.value = s.color;
    } catch(e){ console.warn(e); alert('No se pudo obtener sugerencia de IA'); }
    btnAISuggest.disabled = false;
    btnAISuggest.textContent = 'IA sugerir';
  });

  btnSave.addEventListener('click', async () => {
    const payload = {
      title: fldTitle.value.trim(),
      description: fldDesc.value.trim(),
      start: fldStart.value ? new Date(fldStart.value).toISOString() : new Date().toISOString(),
      end: fldEnd.value ? new Date(fldEnd.value).toISOString() : new Date(new Date(fldStart.value||Date.now()).getTime()+3600000).toISOString(),
      allDay: fldAllDay.checked,
      category: fldCategory.value,
      color: fldColor.value,
      owner: auth.currentUser ? auth.currentUser.uid : null
    };
    try {
      if(editingId){
        await updateEvent(editingId, payload);
      } else {
        await createEvent(payload);
      }
      modal.hide();
    } catch(err){
      console.error(err);
      alert('Error guardando evento: ' + err.message);
    }
  });

  btnDelete.addEventListener('click', async () => {
    if(!editingId) return;
    if(!confirm('Eliminar este evento?')) return;
    try {
      await deleteEvent(editingId);
      modal.hide();
    } catch(err){ console.error(err); alert('Error eliminando evento'); }
  });

  function openCreateModal(dateStr){
    editingId = null;
    btnDelete.style.display = 'none';
    fldTitle.value = '';
    fldDesc.value = '';
    fldStart.value = dateStr ? (dateStr + 'T10:00') : new Date().toISOString().slice(0,16);
    fldEnd.value = new Date(new Date().getTime() + 3600000).toISOString().slice(0,16);
    fldAllDay.checked = false;
    fldCategory.value = 'Otros';
    fldColor.value = '#0ea5ff';
    modal.show();
  }

  function openEditModal(ev){
    editingId = ev.id;
    btnDelete.style.display = 'inline-block';
    fldTitle.value = ev.title || '';
    fldDesc.value = (ev.extendedProps && ev.extendedProps.raw && ev.extendedProps.raw.description) || '';
    fldStart.value = ev.start ? new Date(ev.start).toISOString().slice(0,16) : '';
    fldEnd.value = ev.end ? new Date(ev.end).toISOString().slice(0,16) : '';
    fldAllDay.checked = !!ev.allDay;
    fldCategory.value = (ev.extendedProps && ev.extendedProps.raw && ev.extendedProps.raw.category) || 'Otros';
    fldColor.value = ev.backgroundColor || ev.extendedProps?.raw?.color || '#0ea5ff';
    modal.show();
  }

  const unsub = subscribeToEvents((events) => {
    calendar.removeAllEvents();
    events.forEach(ev => {
      calendar.addEvent({
        id: ev.id,
        title: ev.title,
        start: ev.start,
        end: ev.end,
        allDay: ev.allDay,
        color: ev.color
      });
    });
  }, (err) => {
    console.error('subscribeToEvents error', err);
  });

  window.addEventListener('beforeunload', () => {
    if(unsub) unsub();
  });

});