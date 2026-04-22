'use strict';
// ── DATA LAYER — Supabase ────────────────────────────
// Depende de: supabase.config.js (cargado antes)

let _sb = null;

function getClient() {
  if (!_sb) {
    _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _sb;
}

async function getPoems() {
  const { data, error } = await getClient()
    .from('poems')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function addPoem(poem) {
  const date = new Date().toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
  const { data, error } = await getClient()
    .from('poems')
    .insert([{ ...poem, date, featured: false }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deletePoem(id) {
  const { error } = await getClient()
    .from('poems')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
