-- IMM DC Tallo — penyimpanan foto putaway dan data TTO.
-- Jalankan sekali di Supabase: SQL Editor → New query → tempel semua → Run.
-- Aman dijalankan ulang.

create table if not exists public.putaway_photos (
  id bigint generated always as identity primary key,
  lpn text not null,
  toloc text,
  path text not null,
  device text,
  created_at timestamptz not null default now()
);
create index if not exists putaway_photos_lpn_idx on public.putaway_photos (lpn);

create table if not exists public.tto (
  id bigint generated always as identity primary key,
  tgl date not null,
  no_tto text not null,
  barang text not null,
  koli integer not null check (koli > 0),
  pic text not null,
  penerima text not null,
  photos text[] not null default '{}',
  device text,
  created_at timestamptz not null default now()
);
create index if not exists tto_tgl_idx on public.tto (tgl);

alter table public.putaway_photos enable row level security;
alter table public.tto enable row level security;

drop policy if exists "imm baca foto" on public.putaway_photos;
drop policy if exists "imm tambah foto" on public.putaway_photos;
drop policy if exists "imm hapus foto" on public.putaway_photos;
create policy "imm baca foto" on public.putaway_photos for select to anon using (true);
create policy "imm tambah foto" on public.putaway_photos for insert to anon with check (true);
create policy "imm hapus foto" on public.putaway_photos for delete to anon using (true);

drop policy if exists "imm baca tto" on public.tto;
drop policy if exists "imm tambah tto" on public.tto;
drop policy if exists "imm hapus tto" on public.tto;
create policy "imm baca tto" on public.tto for select to anon using (true);
create policy "imm tambah tto" on public.tto for insert to anon with check (true);
create policy "imm hapus tto" on public.tto for delete to anon using (true);

grant select, insert, delete on public.putaway_photos, public.tto to anon;

-- Tempat foto: publik untuk dibaca, maksimal 1 MB per foto, hanya JPEG.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('imm-photos', 'imm-photos', true, 1048576, array['image/jpeg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "imm baca objek" on storage.objects;
drop policy if exists "imm unggah objek" on storage.objects;
drop policy if exists "imm hapus objek" on storage.objects;
create policy "imm baca objek" on storage.objects for select to anon using (bucket_id = 'imm-photos');
create policy "imm unggah objek" on storage.objects for insert to anon with check (bucket_id = 'imm-photos');
create policy "imm hapus objek" on storage.objects for delete to anon using (bucket_id = 'imm-photos');
