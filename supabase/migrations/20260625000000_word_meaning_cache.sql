-- Word meaning persistent cache for dictionary lookups + AI enrichment.
-- Allows avoiding repeated external API calls across server restarts.

create table if not exists public.word_meaning_cache (
  word text primary key,
  payload jsonb not null,
  source text not null,
  cached boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep `updated_at` current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_word_meaning_cache_updated_at on public.word_meaning_cache;
create trigger trg_word_meaning_cache_updated_at
before update on public.word_meaning_cache
for each row
execute function public.set_updated_at();

-- Helpful index for lookups by word (primary key already indexed, but keep explicit)
create index if not exists idx_word_meaning_cache_word on public.word_meaning_cache(word);
