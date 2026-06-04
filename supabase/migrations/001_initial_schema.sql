-- Seinä: Alustava tietokantamigraatio
-- Ajetaan Supabase SQL Editorissa tai paikallisesti: supabase db push

-- Viestit-taulu
CREATE TABLE IF NOT EXISTS public.notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x           FLOAT NOT NULL DEFAULT 0,
  y           FLOAT NOT NULL DEFAULT 0,
  z           INT NOT NULL DEFAULT 0,
  content     TEXT NOT NULL DEFAULT '',
  tags        TEXT[] DEFAULT '{}',
  style       TEXT NOT NULL DEFAULT 'sticky',  -- 'sticky' | 'graffiti' | 'chalk' | 'typewriter' | 'neon'
  color       TEXT DEFAULT '#fff9a8',
  rotation    FLOAT DEFAULT 0,
  width       FLOAT DEFAULT 220,
  height      FLOAT DEFAULT 180,
  drawing_data JSONB,  -- graffiti-stroket (vain graffiti-tyylille)
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Indeksit
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON public.notes USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_notes_style ON public.notes(style);

-- RLS (Row Level Security)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Kuka tahansa voi lukea
DROP POLICY IF EXISTS "Anyone can read" ON public.notes;
CREATE POLICY "Anyone can read" ON public.notes
  FOR SELECT USING (true);

-- Kuka tahansa voi lisätä (anonyymisti)
DROP POLICY IF EXISTS "Anyone can insert" ON public.notes;
CREATE POLICY "Anyone can insert" ON public.notes
  FOR INSERT WITH CHECK (true);

-- Päivitys ja poisto — sallittu (MVP-kehitysvaiheessa)
DROP POLICY IF EXISTS "Anyone can update" ON public.notes;
CREATE POLICY "Anyone can update" ON public.notes
  FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete" ON public.notes;
CREATE POLICY "Anyone can delete" ON public.notes
  FOR DELETE USING (true);

-- Reaaliaikainen publish (WebSocket)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
