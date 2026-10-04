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

-- Scan TTO dari foto: pencatat pemakaian untuk batas harian (dipanggil hanya oleh fungsi server scan-tto).
-- Aplikasi (anon) tidak bisa membaca atau menulis tabel ini, dan tidak bisa memanggil fungsinya.
create table if not exists public.scan_log (
  id bigint generated always as identity primary key,
  device text,
  created_at timestamptz not null default now()
);
create index if not exists scan_log_created_idx on public.scan_log (created_at);
alter table public.scan_log enable row level security;

-- Mengambil satu jatah scan untuk hari ini (waktu Makassar). Hasil: id jatah, atau 0 bila batas harian tercapai.
drop function if exists public.imm_scan_take(integer, text);
create function public.imm_scan_take(p_limit integer, p_device text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare n integer; new_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('imm_scan_take'));
  select count(*) into n from public.scan_log
    where created_at >= (date_trunc('day', now() at time zone 'Asia/Makassar') at time zone 'Asia/Makassar');
  if n >= greatest(coalesce(p_limit, 1), 1) then return 0; end if;
  insert into public.scan_log (device) values (left(coalesce(p_device, ''), 40)) returning id into new_id;
  delete from public.scan_log where created_at < now() - interval '30 days';
  return new_id;
end $$;
-- Mengembalikan jatah bila AI gagal menjawab (bukan salah fotonya).
create or replace function public.imm_scan_refund(p_id bigint) returns void
language sql security definer set search_path = '' as $$ delete from public.scan_log where id = p_id $$;
revoke all on function public.imm_scan_take(integer, text) from public, anon, authenticated;
revoke all on function public.imm_scan_refund(bigint) from public, anon, authenticated;
grant execute on function public.imm_scan_take(integer, text), public.imm_scan_refund(bigint) to service_role;
