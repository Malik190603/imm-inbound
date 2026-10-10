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
-- Baris tidak pernah dihapus (paling banyak sebanyak batas harian per hari); jatah yang dikembalikan hanya ditandai.
create table if not exists public.scan_log (
  id bigint generated always as identity primary key,
  device text,
  created_at timestamptz not null default now()
);
alter table public.scan_log add column if not exists refunded boolean not null default false;
create index if not exists scan_log_created_idx on public.scan_log (created_at);
alter table public.scan_log enable row level security;
revoke all on table public.scan_log from anon, authenticated;

-- Mengambil satu jatah scan untuk hari ini (waktu Makassar). Hasil: id jatah, atau 0 bila batas harian tercapai.
create or replace function public.imm_scan_take(p_limit integer, p_device text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare n integer; new_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('imm_scan_take'));
  select count(*) into n from public.scan_log
    where not refunded and created_at >= (date_trunc('day', now() at time zone 'Asia/Makassar') at time zone 'Asia/Makassar');
  if n >= greatest(coalesce(p_limit, 1), 1) then return 0; end if;
  insert into public.scan_log (device) values (left(coalesce(p_device, ''), 40)) returning id into new_id;
  return new_id;
end $$;
-- Mengembalikan jatah bila AI gagal menjawab (bukan salah fotonya).
create or replace function public.imm_scan_refund(p_id bigint) returns void
language sql security definer set search_path = '' as $$ update public.scan_log set refunded = true where id = p_id $$;
revoke all on function public.imm_scan_take(integer, text) from public, anon, authenticated;
revoke all on function public.imm_scan_refund(bigint) from public, anon, authenticated;
grant execute on function public.imm_scan_take(integer, text), public.imm_scan_refund(bigint) to service_role;

-- Kunci AI boleh disimpan di brankas Supabase (Vault) dengan nama GEMINI_API_KEY atau ANTHROPIC_API_KEY,
-- sebagai pengganti secret fungsi. Hanya fungsi server (service_role) yang bisa membacanya.
create or replace function public.imm_secret(p_name text) returns text
language plpgsql security definer set search_path = '' as $$
declare v text;
begin
  if p_name not in ('GEMINI_API_KEY', 'ANTHROPIC_API_KEY') then return null; end if;
  select decrypted_secret into v from vault.decrypted_secrets where name = p_name limit 1;
  return v;
exception when undefined_table or invalid_schema_name then return null;
end $$;
revoke all on function public.imm_secret(text) from public, anon, authenticated;
grant execute on function public.imm_secret(text) to service_role;


-- ============================================================================================
-- Mini Monitoring 2.0 — Work Order, Observasi LP, Project & Schedule, pemberitahuan Manager.
-- Aman dijalankan ulang. Tanpa perintah hapus: perubahan ditandai (status / batal), bukan dihapus.
-- Aplikasi (anon) hanya boleh MEMBACA tabel ini; semua penulisan lewat fungsi di bawah yang memeriksa aturan.
-- Login aplikasi memakai NIK tanpa PIN (keputusan pemilik), jadi role/jabatan dikirim oleh aplikasi.
-- ============================================================================================
alter table public.tto add column if not exists input_by text;

create table if not exists public.run_no (
  prefix text not null,
  day date not null,
  last integer not null default 0,
  primary key (prefix, day)
);
alter table public.run_no enable row level security;
revoke all on table public.run_no from anon, authenticated;

create table if not exists public.work_order (
  no text primary key,
  tanggal date not null,
  alat text not null check (alat in ('Electric Reachtruk','Forklift','Hand Pallet','Pallet Mover','Stock Picker','Battery Charger Pallet Mover','Battery Charger Electric Reachtruk','Lampu','Kelistrikan')),
  pekerjaan text not null check (pekerjaan in ('Perawatan Berkala','Perbaikan Kerusakan','Pemeriksaan Alat','Penggantian Komponen','Pemasangan','Pembongkaran','Pekerjaan Kelistrikan','Penanganan Gangguan','Pembersihan','Pengujian Fungsi','Modifikasi','Lain Lain')),
  detail text not null check (length(detail) between 1 and 1000),
  mulai timestamptz not null,
  tim text not null check (length(tim) between 1 and 200),
  biaya numeric check (biaya is null or biaya >= 0),
  catatan text not null default '' check (length(catatan) <= 1000),
  status text not null default 'menunggu' check (status in ('menunggu','disetujui','ditolak','pending','selesai')),
  photos text[] not null default '{}' check (coalesce(array_length(photos, 1), 0) <= 4),
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists work_order_status_idx on public.work_order (status, created_at desc);

create table if not exists public.wo_event (
  id bigint generated always as identity primary key,
  no text not null references public.work_order(no),
  dari text,
  ke text not null,
  nik text not null,
  catatan text not null default '',
  at timestamptz not null default now()
);
create index if not exists wo_event_no_idx on public.wo_event (no);

create table if not exists public.observasi (
  no text primary key,
  tanggal date not null,
  mulai timestamptz not null,
  tim text not null check (length(tim) between 1 and 200),
  status text not null default 'open' check (status in ('open','ongoing','closed')),
  created_by text not null,
  checkin_by text,
  closed_by text,
  created_at timestamptz not null default now(),
  checkin_at timestamptz,
  closed_at timestamptz
);
create index if not exists observasi_created_idx on public.observasi (created_at desc);

create table if not exists public.obs_entry (
  id bigint generated always as identity primary key,
  no text not null references public.observasi(no),
  jenis text not null check (jenis in ('lokasi','checklist')),
  objek text not null,
  kondisi text[] not null check (coalesce(array_length(kondisi, 1), 0) >= 1),
  detail text not null default '' check (length(detail) <= 500),
  photos text[] not null default '{}' check (coalesce(array_length(photos, 1), 0) <= 4),
  nik text not null,
  at timestamptz not null default now(),
  batal boolean not null default false
);
create index if not exists obs_entry_no_idx on public.obs_entry (no);

create table if not exists public.dc_schedule (
  id bigint generated always as identity primary key,
  jenis text not null check (jenis in ('project','official')),
  nama text not null check (length(nama) between 1 and 200),
  mulai date not null,
  selesai date,
  status text not null default 'rencana' check (status in ('rencana','berjalan','selesai','batal')),
  keterangan text not null default '' check (length(keterangan) <= 1000),
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (selesai is null or selesai >= mulai)
);

create table if not exists public.notif (
  id bigint generated always as identity primary key,
  untuk text not null default 'MANAGER',
  jenis text not null check (jenis in ('wo_baru','wo_pending','wo_selesai','wo_disetujui','wo_ditolak')),
  ref text,
  pesan text not null,
  at timestamptz not null default now(),
  dibaca_oleh text[] not null default '{}'
);
create index if not exists notif_at_idx on public.notif (untuk, at desc);

alter table public.work_order enable row level security;
alter table public.wo_event enable row level security;
alter table public.observasi enable row level security;
alter table public.obs_entry enable row level security;
alter table public.dc_schedule enable row level security;
alter table public.notif enable row level security;
drop policy if exists "mm baca wo" on public.work_order;
drop policy if exists "mm baca wo event" on public.wo_event;
drop policy if exists "mm baca obs" on public.observasi;
drop policy if exists "mm baca obs entry" on public.obs_entry;
drop policy if exists "mm baca jadwal" on public.dc_schedule;
drop policy if exists "mm baca notif" on public.notif;
create policy "mm baca wo" on public.work_order for select to anon using (true);
create policy "mm baca wo event" on public.wo_event for select to anon using (true);
create policy "mm baca obs" on public.observasi for select to anon using (true);
create policy "mm baca obs entry" on public.obs_entry for select to anon using (true);
create policy "mm baca jadwal" on public.dc_schedule for select to anon using (true);
create policy "mm baca notif" on public.notif for select to anon using (true);
revoke all on table public.work_order, public.wo_event, public.observasi, public.obs_entry, public.dc_schedule, public.notif from anon, authenticated;
grant select on public.work_order, public.wo_event, public.observasi, public.obs_entry, public.dc_schedule, public.notif to anon;

-- Nomor urut per hari (WITA): WO-yyyymmdd-0001, OBS-yyyymmdd-0001. Upsert mengunci baris penghitung, jadi tidak pernah ganda.
create or replace function public.imm_next_no(p_prefix text) returns text
language plpgsql security definer set search_path = '' as $$
declare d date := (now() at time zone 'Asia/Makassar')::date; n integer;
begin
  if p_prefix not in ('WO', 'OBS') then raise exception 'IMM_RULE: awalan nomor tidak dikenal'; end if;
  insert into public.run_no (prefix, day, last) values (p_prefix, d, 1)
    on conflict (prefix, day) do update set last = public.run_no.last + 1
    returning last into n;
  return p_prefix || '-' || to_char(d, 'YYYYMMDD') || '-' || lpad(n::text, 4, '0');
end $$;

create or replace function public.imm_wo_create(p jsonb) returns public.work_order
language plpgsql security definer set search_path = '' as $$
declare r public.work_order; v_no text; v_nik text := btrim(coalesce(p->>'nik', ''));
begin
  if v_nik = '' then raise exception 'IMM_RULE: NIK pembuat wajib'; end if;
  if coalesce(p->>'alat', '') not in ('Electric Reachtruk','Forklift','Hand Pallet','Pallet Mover','Stock Picker','Battery Charger Pallet Mover','Battery Charger Electric Reachtruk','Lampu','Kelistrikan') then raise exception 'IMM_RULE: Pilih alat / mesin'; end if;
  if coalesce(p->>'pekerjaan', '') not in ('Perawatan Berkala','Perbaikan Kerusakan','Pemeriksaan Alat','Penggantian Komponen','Pemasangan','Pembongkaran','Pekerjaan Kelistrikan','Penanganan Gangguan','Pembersihan','Pengujian Fungsi','Modifikasi','Lain Lain') then raise exception 'IMM_RULE: Pilih nama pekerjaan'; end if;
  if btrim(coalesce(p->>'detail', '')) = '' then raise exception 'IMM_RULE: Isi detail pekerjaan'; end if;
  if btrim(coalesce(p->>'tim', '')) = '' then raise exception 'IMM_RULE: Isi tim yang terlibat'; end if;
  v_no := public.imm_next_no('WO');
  insert into public.work_order (no, tanggal, alat, pekerjaan, detail, mulai, tim, biaya, catatan, created_by)
  values (v_no, (now() at time zone 'Asia/Makassar')::date, p->>'alat', p->>'pekerjaan', btrim(p->>'detail'),
          ((p->>'mulai')::timestamp at time zone 'Asia/Makassar'), btrim(p->>'tim'), nullif(p->>'biaya', '')::numeric,
          btrim(coalesce(p->>'catatan', '')), v_nik)
  returning * into r;
  insert into public.wo_event (no, dari, ke, nik) values (v_no, null, 'menunggu', v_nik);
  insert into public.notif (jenis, ref, pesan) values ('wo_baru', v_no, 'Work Order baru ' || v_no || ' (' || r.alat || ') perlu persetujuan');
  return r;
end $$;

-- Aturan sama dengan www/wo-core.js (canMove).
create or replace function public.imm_wo_move(p_no text, p_to text, p_nik text, p_role text, p_jabatan text, p_photos text[] default null, p_note text default '')
returns public.work_order
language plpgsql security definer set search_path = '' as $$
declare r public.work_order; v_from text; n integer := coalesce(array_length(p_photos, 1), 0);
begin
  select * into r from public.work_order where no = p_no for update;
  if not found then raise exception 'IMM_RULE: Work Order tidak ditemukan'; end if;
  v_from := r.status;
  if not ((v_from = 'menunggu' and p_to in ('disetujui', 'ditolak')) or (v_from = 'disetujui' and p_to in ('pending', 'selesai')) or (v_from = 'pending' and p_to in ('disetujui', 'selesai'))) then
    raise exception 'IMM_RULE: Status ini tidak bisa diubah';
  end if;
  if (v_from = 'menunggu' or (v_from = 'pending' and p_to = 'disetujui')) and p_jabatan <> 'MANAGER' then
    raise exception 'IMM_RULE: Hanya Manager yang bisa menyetujui';
  end if;
  if p_to = 'pending' and not ((p_role = 'MHE' and p_jabatan <> 'WAREHOUSEMAN') or p_jabatan in ('MANAGER', 'ADMIN')) then
    raise exception 'IMM_RULE: Hanya MHE atau Manager';
  end if;
  if p_to = 'selesai' then
    if not (p_role = 'MHE' and p_jabatan <> 'WAREHOUSEMAN') then raise exception 'IMM_RULE: Hanya MHE yang menandai selesai'; end if;
    if n < 1 then raise exception 'IMM_RULE: Lampirkan minimal 1 foto dokumentasi'; end if;
    if n > 4 then raise exception 'IMM_RULE: Maksimal 4 foto'; end if;
  end if;
  update public.work_order set status = p_to, updated_at = now(), photos = case when p_to = 'selesai' then p_photos else photos end
    where no = p_no returning * into r;
  insert into public.wo_event (no, dari, ke, nik, catatan) values (p_no, v_from, p_to, btrim(coalesce(p_nik, '')), left(coalesce(p_note, ''), 500));
  if p_to in ('pending', 'selesai') then
    insert into public.notif (jenis, ref, pesan) values ('wo_' || p_to, p_no, 'Work Order ' || p_no || case when p_to = 'pending' then ' berstatus Pending' else ' selesai dikerjakan' end);
  end if;
  return r;
end $$;

create or replace function public.imm_obs_create(p jsonb) returns public.observasi
language plpgsql security definer set search_path = '' as $$
declare r public.observasi; v_nik text := btrim(coalesce(p->>'nik', ''));
begin
  if v_nik = '' then raise exception 'IMM_RULE: NIK pembuat wajib'; end if;
  if not (p->>'role' = 'LP' or p->>'jabatan' in ('MANAGER', 'ASST. MANAGER', 'ADMIN')) or p->>'jabatan' = 'WAREHOUSEMAN' then raise exception 'IMM_RULE: Hanya LP atau Manager'; end if;
  insert into public.observasi (no, tanggal, mulai, tim, created_by)
  values (public.imm_next_no('OBS'), (now() at time zone 'Asia/Makassar')::date, ((p->>'mulai')::timestamp at time zone 'Asia/Makassar'), btrim(p->>'tim'), v_nik)
  returning * into r;
  return r;
end $$;

create or replace function public.imm_obs_move(p_no text, p_to text, p_nik text, p_role text, p_jabatan text) returns public.observasi
language plpgsql security definer set search_path = '' as $$
declare r public.observasi;
begin
  select * into r from public.observasi where no = p_no for update;
  if not found then raise exception 'IMM_RULE: Observasi tidak ditemukan'; end if;
  if not ((r.status = 'open' and p_to = 'ongoing') or (r.status = 'ongoing' and p_to = 'closed')) then raise exception 'IMM_RULE: Status ini tidak bisa diubah'; end if;
  if not (p_role = 'LP' or p_jabatan in ('MANAGER', 'ASST. MANAGER', 'ADMIN')) or p_jabatan = 'WAREHOUSEMAN' then raise exception 'IMM_RULE: Hanya LP atau Manager'; end if;
  if p_to = 'ongoing' then
    update public.observasi set status = 'ongoing', checkin_by = p_nik, checkin_at = now() where no = p_no returning * into r;
  else
    update public.observasi set status = 'closed', closed_by = p_nik, closed_at = now() where no = p_no returning * into r;
  end if;
  return r;
end $$;

create or replace function public.imm_obs_add(p jsonb) returns public.obs_entry
language plpgsql security definer set search_path = '' as $$
declare r public.obs_entry; v_status text; v_kondisi text[]; v_photos text[];
begin
  select status into v_status from public.observasi where no = p->>'no';
  if v_status is distinct from 'ongoing' then raise exception 'IMM_RULE: Observasi harus berstatus Ongoing (check-in dulu)'; end if;
  select coalesce(array_agg(x), '{}') into v_kondisi from jsonb_array_elements_text(coalesce(p->'kondisi', '[]')) x;
  select coalesce(array_agg(x), '{}') into v_photos from jsonb_array_elements_text(coalesce(p->'photos', '[]')) x;
  if p->>'jenis' = 'lokasi' and p->>'objek' not in ('Pintu Inbound','Pintu Outbound A','Pintu Outbound B','Area MHE','Office','Dispatching','Floor','Rak','Area Luar','Area Parkir Armada','Area Parkir Karyawan','Area WC','Area Mess') then raise exception 'IMM_RULE: Pilih lokasi'; end if;
  if p->>'jenis' = 'checklist' and p->>'objek' not in ('Lampu','CCTV','Apar','Tempat Sampah','Charger Lifttruck / Pallet Mover','Stop Kontak','Alarm','Hand Talkie') then raise exception 'IMM_RULE: Pilih item checklist'; end if;
  if coalesce(array_length(v_kondisi, 1), 0) < 1 or not (v_kondisi <@ array['Aman / Baik','Tidak menyala','Bersih','Kotor','Tergembok','Lengkap','Aktif','Tidak Aktif','Berbahaya']) then raise exception 'IMM_RULE: Pilih minimal 1 kondisi'; end if;
  insert into public.obs_entry (no, jenis, objek, kondisi, detail, photos, nik)
  values (p->>'no', p->>'jenis', p->>'objek', v_kondisi, btrim(coalesce(p->>'detail', '')), v_photos, btrim(coalesce(p->>'nik', '')))
  returning * into r;
  return r;
end $$;

create or replace function public.imm_obs_cancel(p_id bigint, p_nik text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select o.status from public.obs_entry e join public.observasi o on o.no = e.no where e.id = p_id) is distinct from 'ongoing' then
    raise exception 'IMM_RULE: Isian hanya bisa dibatalkan saat Ongoing';
  end if;
  update public.obs_entry set batal = true where id = p_id;
end $$;

create or replace function public.imm_schedule_save(p jsonb) returns public.dc_schedule
language plpgsql security definer set search_path = '' as $$
declare r public.dc_schedule;
begin
  if coalesce(p->>'jabatan', '') not in ('MANAGER', 'ASST. MANAGER', 'SUPERVISOR', 'ADMIN') then raise exception 'IMM_RULE: Hanya Manager, Asst Manager, atau Supervisor'; end if;
  if nullif(p->>'selesai', '') is not null and (p->>'selesai')::date < (p->>'mulai')::date then raise exception 'IMM_RULE: Tanggal selesai tidak boleh sebelum mulai'; end if;
  if nullif(p->>'id', '') is null then
    insert into public.dc_schedule (jenis, nama, mulai, selesai, status, keterangan, created_by)
    values (p->>'jenis', btrim(p->>'nama'), (p->>'mulai')::date, nullif(p->>'selesai', '')::date, coalesce(p->>'status', 'rencana'), btrim(coalesce(p->>'keterangan', '')), btrim(coalesce(p->>'nik', '')))
    returning * into r;
  else
    update public.dc_schedule set jenis = p->>'jenis', nama = btrim(p->>'nama'), mulai = (p->>'mulai')::date, selesai = nullif(p->>'selesai', '')::date,
      status = coalesce(p->>'status', status), keterangan = btrim(coalesce(p->>'keterangan', '')), updated_at = now()
      where id = (p->>'id')::bigint returning * into r;
    if not found then raise exception 'IMM_RULE: Jadwal tidak ditemukan'; end if;
  end if;
  return r;
end $$;

create or replace function public.imm_notif_read(p_ids bigint[], p_nik text) returns integer
language sql security definer set search_path = '' as $$
  with u as (update public.notif set dibaca_oleh = array_append(dibaca_oleh, p_nik)
             where id = any(p_ids) and not (p_nik = any(dibaca_oleh)) returning 1)
  select count(*)::integer from u
$$;

revoke all on function public.imm_next_no(text) from public, anon, authenticated;
revoke all on function public.imm_wo_create(jsonb), public.imm_wo_move(text, text, text, text, text, text[], text), public.imm_obs_create(jsonb),
  public.imm_obs_move(text, text, text, text, text), public.imm_obs_add(jsonb), public.imm_obs_cancel(bigint, text), public.imm_schedule_save(jsonb),
  public.imm_notif_read(bigint[], text) from public, authenticated;
grant execute on function public.imm_wo_create(jsonb), public.imm_wo_move(text, text, text, text, text, text[], text), public.imm_obs_create(jsonb),
  public.imm_obs_move(text, text, text, text, text), public.imm_obs_add(jsonb), public.imm_obs_cancel(bigint, text), public.imm_schedule_save(jsonb),
  public.imm_notif_read(bigint[], text) to anon;
