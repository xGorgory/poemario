'use strict';
// ── APP PRINCIPAL — Versos del Umbral ───────────────
// Requiere: data.js, particles.js  (cargados antes)

/* ─── Estado ─── */
const PIN        = '5010';
let pinValue     = '';
let pinBlocked   = false;
let isAdmin      = false;
let activeFilter = 'all';
let readerIndex  = 0;

/* ─── Tema ─── */
function initTheme() {
  applyTheme(localStorage.getItem('poemario_theme') || 'dark');
  document.getElementById('btn-theme').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('poemario_theme', next);
  });
}
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('btn-theme');
  btn.textContent = t === 'dark' ? '☀' : '☽';
  btn.title = t === 'dark' ? 'Modo claro' : 'Modo oscuro';
}

/* ─── Cursor ─── */
function initCursor() {
  const dot = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;
  let rx = 0, ry = 0;
  document.addEventListener('mousemove', e => {
    dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px';
    rx += (e.clientX - rx) * 0.12; ry += (e.clientY - ry) * 0.12;
  });
  (function loop() { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(loop); })();
  refreshHover();
}
function refreshHover() {
  document.querySelectorAll('button, .poem-card, .filter-pill, a').forEach(el => {
    el.addEventListener('mouseenter', () => { document.getElementById('cursor')?.classList.add('expanded'); document.getElementById('cursor-ring')?.classList.add('expanded'); });
    el.addEventListener('mouseleave', () => { document.getElementById('cursor')?.classList.remove('expanded'); document.getElementById('cursor-ring')?.classList.remove('expanded'); });
  });
}

/* ─── Header scroll ─── */
function initHeaderScroll() {
  window.addEventListener('scroll', () =>
    document.querySelector('header').classList.toggle('scrolled', scrollY > 60), { passive: true });
}

/* ─── Filtros ─── */
function initFilters() {
  document.querySelectorAll('.filter-pill').forEach(btn =>
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPoems();
    })
  );
}

/* ─── Contador animado ─── */
function animateCount(n) {
  const label = document.getElementById('count-label');
  const word  = n === 1 ? 'poema' : 'poemas';
  let cur = 0; const step = Math.max(1, Math.ceil(n / 20));
  const t = setInterval(() => {
    cur = Math.min(cur + step, n);
    label.textContent = `— ${cur} ${word}`;
    if (cur >= n) clearInterval(t);
  }, 40);
}

/* ─── Scroll reveal ─── */
function initReveal() {
  const obs = new IntersectionObserver(entries =>
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } }),
    { threshold: 0.08 }
  );
  document.querySelectorAll('.poem-card').forEach((c, i) => {
    c.style.transitionDelay = (i % 4) * 60 + 'ms';
    obs.observe(c);
  });
}

/* ─── Render ─── */
function renderPoems() {
  const poems   = getPoems();
  const visible = activeFilter === 'all' ? poems : poems.filter(p => p.tag === activeFilter);
  const grid    = document.getElementById('poems-grid');
  animateCount(visible.length);
  grid.innerHTML = '';

  if (visible.length === 0) {
    grid.innerHTML = `<p class="empty-state">Aún no hay poemas en esta colección.<br><em>Añade el primero pulsando «+ Añadir».</em></p>`;
    return;
  }

  visible.forEach(poem => {
    const idx  = poems.indexOf(poem);
    const num  = String(poem.id).padStart(3, '0');
    const card = document.createElement('div');

    if (poem.featured) {
      card.className = 'poem-card featured';
      card.innerHTML = `
        <div class="featured-bg-number">${num}</div>
        <div>
          <div class="card-meta"><span class="card-number">Nº ${num}</span><span class="card-tag">${poem.tag}</span></div>
          <h2 class="poem-title">${poem.title}</h2>
          <div class="poem-excerpt">${poem.body.split('\n').slice(0,5).join('\n')}</div>
          <div class="card-footer"><span class="card-author">${poem.author}</span><span class="card-date">${poem.date}</span></div>
        </div>
        <div class="featured-right"><div class="featured-full-poem">${poem.body}</div></div>`;
    } else {
      card.className = 'poem-card';
      card.innerHTML = `
        <div class="card-meta"><span class="card-number">Nº ${num}</span><span class="card-tag">${poem.tag}</span></div>
        <h2 class="poem-title">${poem.title}</h2>
        <div class="poem-excerpt">${poem.body.split('\n').slice(0,5).join('\n')}</div>
        <div class="card-footer"><span class="card-author">${poem.author}</span><span class="card-date">${poem.date}</span></div>`;
    }

    card.addEventListener('click', () => openReader(idx));
    grid.appendChild(card);
  });

  initReveal(); refreshHover();
}

/* ─── PIN ─── */
function openPinModal()  { pinValue=''; updateDots(); document.getElementById('pin-error').textContent=''; toggle('pin-modal', true); }
function closePinModal() { toggle('pin-modal', false); pinValue=''; updateDots(); }
function closePinOnOverlay(e) { if (e.target===document.getElementById('pin-modal')) closePinModal(); }
function updateDots() {
  for (let i=0;i<4;i++) { const d=document.getElementById('dot-'+i); d.classList.toggle('filled',i<pinValue.length); d.classList.remove('error'); }
}
function pinInput(digit) {
  if (pinBlocked||pinValue.length>=4) return;
  pinValue+=digit; updateDots();
  if (pinValue.length===4) { pinBlocked=true; setTimeout(checkPin,200); }
}
function pinDelete() { if (!pinBlocked) { pinValue=pinValue.slice(0,-1); updateDots(); } }
function checkPin() {
  if (pinValue===PIN) {
    isAdmin=true; document.getElementById('admin-badge').style.display='inline-flex';
    closePinModal(); openAddModal();
  } else {
    for(let i=0;i<4;i++) document.getElementById('dot-'+i).classList.add('error');
    const w=document.getElementById('pin-dots-wrap'); w.classList.add('shake');
    document.getElementById('pin-error').textContent='PIN incorrecto. Inténtalo de nuevo.';
    setTimeout(()=>{ w.classList.remove('shake'); pinValue=''; pinBlocked=false; updateDots(); document.getElementById('pin-error').textContent=''; },850);
  }
}

/* ─── ADD MODAL ─── */
function openAddModal()  { toggle('add-modal', true); setTimeout(()=>document.getElementById('f-title').focus(),400); }
function closeAddModal() { toggle('add-modal', false); }
function closeAddOnOverlay(e) { if (e.target===document.getElementById('add-modal')) closeAddModal(); }
function submitPoem() {
  const title  = document.getElementById('f-title').value.trim();
  const author = document.getElementById('f-author').value.trim();
  const tag    = document.getElementById('f-tag').value;
  const body   = document.getElementById('f-poem').value.trim();
  if (!title||!author||!body) { showToast('Por favor completa todos los campos.'); return; }
  addPoem({ title, author, tag, body });
  renderPoems(); closeAddModal(); showToast('Poema añadido al poemario ✦');
  ['f-title','f-author','f-poem'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('f-tag').selectedIndex=0;
}

/* ─── READER MODAL ─── */
function openReader(idx) {
  const poems = getPoems();
  readerIndex = idx;
  const poem  = poems[idx];
  const num   = String(poem.id).padStart(3,'0');
  document.getElementById('r-num').textContent    = num;
  document.getElementById('r-title').textContent  = poem.title;
  document.getElementById('r-author').textContent = '— ' + poem.author;
  document.getElementById('r-body').textContent   = poem.body;
  document.getElementById('r-tag').textContent    = poem.tag;
  document.getElementById('r-prev').disabled      = idx <= 0;
  document.getElementById('r-next').disabled      = idx >= poems.length - 1;
  // Botón borrar — solo visible en modo admin
  document.getElementById('btn-delete').style.display = isAdmin ? 'inline-flex' : 'none';
  toggle('reader-modal', true);
}
function closeReaderModal()     { toggle('reader-modal', false); }
function closeReaderOnOverlay(e){ if(e.target===document.getElementById('reader-modal')) closeReaderModal(); }
function readerNavigate(dir)    { const n=readerIndex+dir; if(n>=0&&n<getPoems().length) openReader(n); }

function confirmDelete() {
  const confirm = document.getElementById('delete-confirm');
  confirm.style.display = confirm.style.display === 'flex' ? 'none' : 'flex';
}
function executeDelete() {
  const poem = getPoems()[readerIndex];
  deletePoem(poem.id);
  closeReaderModal();
  renderPoems();
  showToast('Poema eliminado.');
}

function printPoem() { window.print(); }

/* ─── HELPER TOGGLE MODAL ─── */
function toggle(id, open) {
  document.getElementById(id).classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}

/* ─── TOAST ─── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ─── TECLADO ─── */
document.addEventListener('keydown', e => {
  if (document.getElementById('pin-modal').classList.contains('open')) {
    if (e.key>='0'&&e.key<='9') { e.preventDefault(); pinInput(e.key); }
    if (e.key==='Backspace') pinDelete();
    if (e.key==='Escape') closePinModal();
  } else if (document.getElementById('add-modal').classList.contains('open')) {
    if (e.key==='Escape') closeAddModal();
  } else if (document.getElementById('reader-modal').classList.contains('open')) {
    if (e.key==='Escape') closeReaderModal();
    if (e.key==='ArrowLeft')  readerNavigate(-1);
    if (e.key==='ArrowRight') readerNavigate(1);
  }
});

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initHeaderScroll();
  initParticles();
  initCursor();
  initFilters();
  renderPoems();
});

/* Exponer para handlers inline */
Object.assign(window, {
  openPinModal, closePinModal, closePinOnOverlay,
  pinInput, pinDelete,
  closeAddModal, closeAddOnOverlay, submitPoem,
  closeReaderModal, closeReaderOnOverlay, readerNavigate,
  confirmDelete, executeDelete, printPoem
});
