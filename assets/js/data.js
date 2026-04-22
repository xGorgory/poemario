'use strict';
// ── DATA LAYER — Versos del Umbral ──────────────────

const STORAGE_KEY = 'poemario_v2';

let _poems  = _load();
let _nextId = _poems.reduce((m, p) => Math.max(m, p.id), 0) + 1;

function _load() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];        // Empieza vacío — sin poemas de ejemplo
  } catch { return []; }
}

function _save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_poems)); } catch {}
}

function getPoems()  { return _poems; }

function addPoem(data) {
  const date = new Date().toLocaleDateString('es-ES', { day:'numeric', month:'short', year:'numeric' });
  const poem = { id: _nextId++, date, featured: false, ...data };
  _poems.unshift(poem);
  _save();
  return poem;
}

function deletePoem(id) {
  _poems = _poems.filter(p => p.id !== id);
  _save();
}

function clearAll() {
  _poems = [];
  _save();
}
