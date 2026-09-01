-- supabase/schema.sql
-- Colección MTG — Esquema completo para Supabase (PostgreSQL)
-- Ejecutar en SQL Editor de Supabase

-- Extensión para UUIDs
create extension if not exists "pgcrypto";

-- ============================================================
-- Tabla: cards
-- ============================================================
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  name_es text not null,
  name_en text,
  quantity integer not null default 1 check (quantity >= 0),
  type text,
  edition text,
  rarity text check (rarity in ('common','uncommon','rare','mythic','special','bonus') or rarity is null),
  year text,
  language text not null default 'ES' check (language in ('ES','EN','JP','FR','DE','IT','PT','RU','CN','KR') or language ~ '^[A-Z]{2}$'),
  condition text not null default 'NM' check (condition in ('NM','LP','MP','HP','DMG')),
  owner text,
  notes text,
  price_usd numeric(10,2),
  scryfall_id text unique,
  scryfall_uri text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para búsqueda y filtros
create index if not exists idx_cards_name_es on public.cards using gin (to_tsvector('spanish', name_es));
create index if not exists idx_cards_name_en on public.cards using gin (to_tsvector('english', coalesce(name_en, '')));
create index if not exists idx_cards_edition on public.cards (edition);
create index if not exists idx_cards_rarity on public.cards (rarity);
create index if not exists idx_cards_language on public.cards (language);
create index if not exists idx_cards_owner on public.cards (owner);
create index if not exists idx_cards_scryfall_id on public.cards (scryfall_id);
create index if not exists idx_cards_created_at on public.cards (created_at desc);

-- Trigger para updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.cards;
create trigger set_updated_at
  before update on public.cards
  for each row execute function public.handle_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table public.cards enable row level security;

-- Lectura pública (catálogo)
drop policy if exists "Public can read cards" on public.cards;
create policy "Public can read cards"
  on public.cards for select
  using (true);

-- Escritura solo para usuarios autenticados (panel admin)
-- Solo usuarios logueados vía Supabase Auth pueden modificar inventario
drop policy if exists "Authenticated can insert cards" on public.cards;
create policy "Authenticated can insert cards"
  on public.cards for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated can update cards" on public.cards;
create policy "Authenticated can update cards"
  on public.cards for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated can delete cards" on public.cards;
create policy "Authenticated can delete cards"
  on public.cards for delete
  using (auth.role() = 'authenticated');

-- ============================================================
-- Seed opcional (descomenta para pruebas)
-- ============================================================
-- insert into public.cards (name_es, name_en, type, edition, rarity, year, language, condition, owner, quantity, price_usd, scryfall_id, image_url)
-- values
--   ('Relámpago', 'Lightning Bolt', 'Instant', 'Modern Masters', 'common', '2013', 'ES', 'NM', 'Colección Principal', 4, 2.50, null, null),
--   ('Tarmogoyf', 'Tarmogoyf', 'Creature — Lhurgoyf', 'Modern Masters', 'mythic', '2013', 'EN', 'LP', 'Juan Pérez', 2, 15.00, null, null),
--   ('Black Lotus', 'Black Lotus', 'Artifact', 'Alpha', 'rare', '1993', 'EN', 'HP', 'Bóveda', 1, 15000.00, null, null);
