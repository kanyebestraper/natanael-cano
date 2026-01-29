// Estado de la aplicación
const AppState = {
  isEditing: false,
  theme: localStorage.getItem('theme') || 'light',
  data: JSON.parse(localStorage.getItem('projectData')) || null
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDate();
  initCountdown();
  initProgressBars();
  initEventListeners();
  loadSavedData();
  
  console.log('📋 Definición de Alcance inicializada');
});

// Funciones de utilidad
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Tema oscuro/claro
function initTheme() {
  document.documentElement.setAttribute('data-theme', AppState.theme);
  updateThemeIcon();
}

function toggleTheme() {
  AppState.theme = AppState.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', AppState.theme);
  localStorage.setItem('theme', AppState.theme);
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = $('#themeToggle i');
  if (AppState.theme === 'dark') {
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  } else {
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
  }
}

// Fechas
function initDate() {
  const now = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('es-ES', options);
  
  $('#currentDate').textContent = dateStr;
  $('#footerDate').textContent = dateStr;
}

// Cuenta regresiva para la fecha límite (30/09/2025)
function initCountdown() {
  const deadline = new Date('2025-09-30T23:59:59');
  
  function update() {
    const now = new Date();
    const diff = deadline - now;
    
    if (diff <= 0) {
      $('#countdown').textContent = '¡Fecha límite alcanzada!';
      return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    
    if (months > 0) {
      $('#countdown').textContent = `${months}m ${remainingDays}d restantes`;
    } else {
      $('#countdown').textContent = `${days} días restantes`;
    }
  }
  
  update();
  setInterval(update, 60000); // Actualizar cada minuto
}

// Barras de progreso animadas
function initProgressBars() {
  setTimeout(() => {
    $$('.progress-fill').forEach(bar => {
      const target = bar.getAttribute('data-target');
      if (target) {
        bar.style.width = target + '%';
      }
    });
  }, 500);
}

// Modo edición
function toggleEditMode() {
  AppState.isEditing = !AppState.isEditing;
  document.body.classList.toggle('editing', AppState.isEditing);
  
  const editBtn = $('#editToggle');
  editBtn.classList.toggle('active', AppState.isEditing);
  
  // Habilitar/deshabilitar contenteditable
  $$('[contenteditable]').forEach(el => {
    el.contentEditable = AppState.isEditing;
  });
  
  $$('.editable-list').forEach(el => {
    el.contentEditable = AppState.isEditing;
  });
  
  // Mostrar/ocultar controles de eliminar
  $$('.actions').forEach(el => {
    el.classList.toggle('hidden', !AppState.isEditing);
  });
  
  // Mostrar/ocultar botones de agregar
  $$('.btn-add').forEach(btn => {
    btn.classList.toggle('hidden', !AppState.isEditing);
  });
  
  showNotification(AppState.isEditing ? 'Modo edición activado' : 'Modo edición desactivado');
}

// Guardar datos
function saveData() {
  const data = {
    title: $('.editable-title').textContent,
    objetivo: $('[data-section="objetivo"] .editable')?.textContent || '',
    objetivosEspecificos: [],
    inScope: [],
    outScope: [],
    criterios: [],
    restricciones: [],
    lastSaved: new Date().toISOString()
  };
  
  // Recolectar objetivos específicos
  $$('.objective-item').forEach(item => {
    data.objetivosEspecificos.push({
      id: item.getAttribute('data-id'),
      content: item.querySelector('.editable').innerHTML
    });
  });
  
  // Recolectar alcance
  $$('.in-scope .checklist li').forEach(li => {
    data.inScope.push(li.innerHTML);
  });
  
  $$('.out-scope .checklist li').forEach(li => {
    data.outScope.push(li.innerHTML);
  });
  
  // Recolectar criterios
  $$('.criterion-card').forEach(card => {
    data.criterios.push({
      id: card.getAttribute('data-id'),
      content: card.querySelector('p').textContent,
      status: card.querySelector('.status-badge').textContent
    });
  });
  
  // Recolectar restricciones
  $$('#constraintsBody tr').forEach(tr => {
    const tds = tr.querySelectorAll('td');
    if (tds.length >= 2) {
      data.restricciones.push({
        parametro: tds[0].textContent,
        valor: tds[1].textContent
      });
    }
  });
  
  localStorage.setItem('projectData', JSON.stringify(data));
  showNotification('Cambios guardados correctamente');
  
  // Efecto visual en el botón
  const btn = $('#saveBtn');
  const originalIcon = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check"></i>';
  setTimeout(() => {
    btn.innerHTML = originalIcon;
  }, 1500);
}

// Cargar datos guardados
function loadSavedData() {
  if (!AppState.data) return;
  
  const data = AppState.data;
  
  if (data.title) {
    $('.editable-title').textContent = data.title;
  }
  
  console.log('Datos cargados desde localStorage:', data.lastSaved);
}

// Agregar nuevo objetivo
function addObjective() {
  const list = $('.objectives-list');
  const newId = 'oe' + ($$('.objective-item').length + 1);
  
  const li = document.createElement('li');
  li.className = 'objective-item';
  li.setAttribute('data-id', newId);
  li.innerHTML = `
    <div class="objective-header">
      <span class="objective-code">${newId.toUpperCase()}</span>
      <button class="btn-icon-small delete-item" title="Eliminar objetivo">
        <i class="fas fa-trash"></i>
      </button>
    </div>
    <div class="editable" contenteditable="${AppState.isEditing}">Nuevo objetivo específico...</div>
    <div class="progress-indicator">
      <div class="progress-mini" style="width: 0%"></div>
    </div>
  `;
  
  list.appendChild(li);
  attachDeleteHandler(li.querySelector('.delete-item'));
  
  if (AppState.isEditing) {
    li.querySelector('.editable').focus();
  }
}

// Agregar restricción
function addConstraint() {
  const tbody = $('#constraintsBody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td class="editable" contenteditable="${AppState.isEditing}">Nueva restricción</td>
    <td class="editable" contenteditable="${AppState.isEditing}">Valor</td>
    <td class="actions ${AppState.isEditing ? '' : 'hidden'}">
      <button class="btn-icon-small delete-row" title="Eliminar">
        <i class="fas fa-trash"></i>
      </button>
    </td>
  `;
  
  tbody.appendChild(tr);
  attachDeleteHandler(tr.querySelector('.delete-row'));
}

// Eliminar elementos
function attachDeleteHandler(btn) {
  btn.addEventListener('click', function() {
    const item = this.closest('.objective-item, tr');
    if (item && confirm('¿Estás seguro de eliminar este elemento?')) {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-20px)';
      setTimeout(() => item.remove(), 300);
    }
  });
}

// Colapsar/expandir secciones
function toggleSection(btn) {
  const card = btn.closest('.card');
  const content = card.querySelector('.card-content');
  const isCollapsed = content.style.display === 'none';
  
  content.style.display = isCollapsed ? 'block' : 'none';
  btn.classList.toggle('collapsed', !isCollapsed);
  btn.innerHTML = isCollapsed ? '<i class="fas fa-chevron-up"></i>' : '<i class="fas fa-chevron-down"></i>';
}

// Notificaciones
function showNotification(message) {
  const notif = $('#notification');
  $('#notificationText').textContent = message;
  notif.classList.remove('hidden');
  
  setTimeout(() => notif.classList.add('show'), 10);
  
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.classList.add('hidden'), 300);
  }, 3000);
}

// Imprimir/PDF
function printDocument() {
  window.print();
}

// Event Listeners
function initEventListeners() {
  $('#themeToggle').addEventListener('click', toggleTheme);
  $('#editToggle').addEventListener('click', toggleEditMode);
  $('#saveBtn').addEventListener('click', saveData);
  $('#printBtn').addEventListener('click', printDocument);
  $('#addObjective').addEventListener('click', addObjective);
  $('#addConstraint').addEventListener('click', addConstraint);
  
  // Toggle sections
  $$('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleSection(btn));
  });
  
  // Delete buttons
  $$('.delete-item').forEach(btn => attachDeleteHandler(btn));
  $$('.delete-row').forEach(btn => attachDeleteHandler(btn));
  
  // Cambiar estado de criterios al hacer clic
  $$('.criterion-card').forEach(card => {
    card.addEventListener('click', function(e) {
      if (!AppState.isEditing && e.target.closest('.status-badge')) {
        const badge = this.querySelector('.status-badge');
        if (badge.classList.contains('pending')) {
          badge.classList.remove('pending');
          badge.classList.add('completed');
          badge.textContent = 'Completado';
        } else {
          badge.classList.remove('completed');
          badge.classList.add('pending');
          badge.textContent = 'Pendiente';
        }
        saveData();
      }
    });
  });
  
  // Guardar automáticamente al salir de edición
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveData();
    }
    if (e.key === 'Escape' && AppState.isEditing) {
      toggleEditMode();
    }
  });
}

// Auto-guardado cada 30 segundos si está en modo edición
setInterval(() => {
  if (AppState.isEditing) {
    saveData();
  }
}, 30000);

// Confirmar salida si hay cambios sin guardar (modo edición)
window.addEventListener('beforeunload', (e) => {
  if (AppState.isEditing) {
    e.preventDefault();
    e.returnValue = '';
  }
});
