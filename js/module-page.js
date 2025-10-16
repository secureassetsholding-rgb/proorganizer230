import { createDoc, subscribeToCollection, updateDocById, deleteDocById } from '/js/firestore.js';
import { auth } from '/firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('module-root');
  if(!root) return;
  document.body.dataset.requiresAuth = "true";
  const collectionName = root.dataset.collection;
  const title = root.dataset.title || collectionName;

  const listEl = document.createElement('div');
  listEl.className = 'mb-3';
  root.appendChild(listEl);

  const btnNew = document.createElement('button');
  btnNew.className = 'btn btn-primary mb-3';
  btnNew.textContent = 'Nuevo ' + title;
  root.prepend(btnNew);

  const modalHtml = `
  <div class="modal fade" id="moduleModal" tabindex="-1">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header"><h5 class="modal-title">Nuevo ${title}</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">
          <div class="mb-3"><label class="form-label">Título</label><input id="mod-title" class="form-control"/></div>
          <div class="mb-3"><label class="form-label">Contenido</label><textarea id="mod-content" class="form-control" rows="4"></textarea></div>
        </div>
        <div class="modal-footer"><button id="mod-save" class="btn btn-primary">Guardar</button><button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button></div>
      </div>
    </div>
  </div>`;
  root.insertAdjacentHTML('beforeend', modalHtml);
  const modal = new bootstrap.Modal(document.getElementById('moduleModal'));

  let editingId = null;

  btnNew.addEventListener('click', () => {
    editingId = null;
    document.getElementById('mod-title').value = '';
    document.getElementById('mod-content').value = '';
    document.querySelector('#moduleModal .modal-title').textContent = 'Nuevo ' + title;
    modal.show();
  });

  document.getElementById('mod-save').addEventListener('click', async () => {
    const t = document.getElementById('mod-title').value.trim();
    const c = document.getElementById('mod-content').value.trim();
    try {
      if(editingId){
        await updateDocById(collectionName, editingId, { title: t, content: c });
      } else {
        await createDoc(collectionName, { title: t, content: c, owner: auth.currentUser ? auth.currentUser.uid : null });
      }
      modal.hide();
    } catch(err){ console.error(err); alert('Error guardando'); }
  });

  function renderList(items){
    listEl.innerHTML = '';
    if(items.length === 0) listEl.innerHTML = '<div class="small-muted">No hay elementos</div>';
    items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'module-list-item';
      el.innerHTML = `<div>
          <strong>${item.title || '(sin título)'}</strong>
          <div class="small-muted">${item.content ? item.content.slice(0,80) : ''}</div>
        </div>
        <div>
          <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${item.id}">Editar</button>
          <button class="btn btn-sm btn-outline-danger btn-del" data-id="${item.id}">Borrar</button>
        </div>`;
      listEl.appendChild(el);
    });
    listEl.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      const item = items.find(x => x.id === id);
      editingId = id;
      document.getElementById('mod-title').value = item.title || '';
      document.getElementById('mod-content').value = item.content || '';
      document.querySelector('#moduleModal .modal-title').textContent = 'Editar';
      modal.show();
    }));
    listEl.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      if(!confirm('Eliminar?')) return;
      try {
        await deleteDocById(collectionName, id);
      } catch(err){ console.error(err); alert('Error eliminando'); }
    }));
  }

  const unsub = subscribeToCollection(collectionName, (items) => {
    renderList(items);
  }, (err) => console.error(err));

  window.addEventListener('beforeunload', () => { if(unsub) unsub(); });
});