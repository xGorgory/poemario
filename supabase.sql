-- ============================================================
--  POEMARIO — Supabase Setup
--  Ejecuta este SQL en: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Tabla de poemas
CREATE TABLE IF NOT EXISTS poems (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  author      TEXT NOT NULL,
  tag         TEXT NOT NULL DEFAULT 'Sin categoría',
  date        TEXT,
  featured    BOOLEAN DEFAULT FALSE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security (RLS) — seguridad por fila
ALTER TABLE poems ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer (el poemario es público)
CREATE POLICY "Lectura pública"
  ON poems FOR SELECT
  USING (true);

-- Sólo con la anon key se puede insertar (el PIN lo controla el JS)
CREATE POLICY "Inserción anónima"
  ON poems FOR INSERT
  WITH CHECK (true);

-- Borrar también permitido (el PIN lo protege en el frontend)
CREATE POLICY "Borrado anónimo"
  ON poems FOR DELETE
  USING (true);

-- Actualizar (para marcar como featured, etc.)
CREATE POLICY "Actualización anónima"
  ON poems FOR UPDATE
  USING (true);
