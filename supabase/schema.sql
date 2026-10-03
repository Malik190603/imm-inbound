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
  photos text[] not null default '{}' check (coalesce(array_length(photos, 1), 0) <= 4),
  device text,
  created_at timestamptz not null default now()
);
create index if not exists tto_tgl_idx on public.tto (tgl);

-- Maksimal 4 foto per LPN, dijaga di server supaya dua HP yang mengunggah bersamaan tidak bisa melewati batas.
create or replace function public.imm_limit_putaway_photos() returns trigger language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.lpn));
  if (select count(*) from public.putaway_photos where lpn = new.lpn) >= 4 then
    raise exception 'IMM_MAX_PHOTOS: LPN % sudah punya 4 foto', new.lpn using errcode = 'check_violation';
  end if;
  return new;
end $$;
drop trigger if exists imm_limit_putaway_photos on public.putaway_photos;
create trigger imm_limit_putaway_photos before insert on public.putaway_photos for each row execute function public.imm_limit_putaway_photos();

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
