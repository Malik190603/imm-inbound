# Data Model: Mini Monitoring

## Di HP (bukan database)

### Session (`localStorage['imm.session']`)
| Field | Tipe | Aturan |
|-------|------|--------|
| nik | text | hasil `normNik()` (huruf besar, tanpa spasi, nol di depan dipertahankan) |
| name | text | hanya untuk layar Akun |
| role | enum | INBOUND, STORING, OUTBOUND, INVENTORY, PLANNER, LP, MHE, MANAGER, ASST. MANAGER |
| jabatan | enum | ADMIN, MANAGER, ASST. MANAGER, SUPERVISOR, STAFF COORDINATOR, STAFF, STAFF LP, WAREHOUSEMAN |
| at | ISO time | waktu masuk |

Master user terakhir disimpan di `imm.users` (daftar nik→role/jabatan, **tanpa nama orang
lain**) agar akses tetap jalan saat offline.

### Source (registri `www/sources.js`)
`{ key, group, title, id, sheet, gid?, need:[header…], private:[header…], bu?:[…], ttl }` —
`need` dipakai untuk memastikan tab yang benar; `private` dibuang sebelum baris disimpan.

### Filter
`{ bu: 'ALL'|'HCI'|'AHI'|'KWI'|'TGI'|'FBI', period: 'today'|'yesterday'|'7d'|'month'|… }`.
Bawaan: `today` + `ALL`; LPPBDO: `month` + `ALL`.

## Supabase (project IMM)

### run_no
| Kolom | Tipe | Catatan |
|-------|------|---------|
| prefix | text | `WO` atau `OBS` |
| day | date | tanggal WITA |
| last | int | nomor terakhir |
PK (prefix, day). Hanya diubah lewat `imm_next_no`.

### work_order
| Kolom | Tipe | Aturan |
|-------|------|--------|
| no | text PK | `WO-yyyymmdd-NNNN` |
| tanggal | date | hari dibuat (WITA) |
| alat | text | salah satu dari 9 pilihan FR-050 |
| pekerjaan | text | salah satu dari 12 pilihan FR-050 |
| detail | text | wajib, ≤ 1000 |
| mulai | timestamptz | wajib |
| tim | text | wajib, ≤ 200 |
| biaya | numeric | ≥ 0, boleh kosong |
| catatan | text | ≤ 1000 |
| status | text | `menunggu`, `disetujui`, `ditolak`, `pending`, `selesai` |
| photos | text[] | 0–4 path; wajib 1–4 saat `selesai` |
| created_by | text | NIK |
| created_at, updated_at | timestamptz | |

Transisi (dicek `imm_wo_move`):
`menunggu → disetujui | ditolak` (jabatan MANAGER) · `disetujui → pending | selesai` ·
`pending → disetujui | selesai` · `selesai` dan `ditolak` final. `selesai` hanya Role MHE dan
`array_length(photos) between 1 and 4`.

### wo_event
`id bigserial, no text → work_order, dari text, ke text, nik text, catatan text, at timestamptz`.
Riwayat semua perubahan status (termasuk pembuatan).

### observasi
| Kolom | Tipe | Aturan |
|-------|------|--------|
| no | text PK | `OBS-yyyymmdd-NNNN` |
| tanggal | date | |
| mulai | timestamptz | wajib |
| tim | text | wajib |
| status | text | `open → ongoing → closed` |
| created_by, checkin_by, closed_by | text | NIK |
| created_at, checkin_at, closed_at | timestamptz | |

### obs_entry
| Kolom | Tipe | Aturan |
|-------|------|--------|
| id | bigserial PK | |
| no | text → observasi | hanya saat status `ongoing` |
| jenis | text | `lokasi` atau `checklist` |
| objek | text | 13 lokasi (FR-062) atau 8 alat (FR-063) |
| kondisi | text[] | ≥ 1, dari 9 pilihan |
| detail | text | ≤ 500 |
| photos | text[] | 0–4 |
| nik | text | |
| at | timestamptz | |
| batal | boolean | default false (pengganti hapus) |

### dc_schedule
`id bigserial, jenis ('project'|'official'), nama, mulai date, selesai date, status
('rencana'|'berjalan'|'selesai'|'batal'), keterangan, created_by, created_at, updated_at`.
`selesai >= mulai`.

### notif
`id bigserial, untuk text ('MANAGER'), jenis ('wo_baru'|'wo_approve'|'wo_pending'|'wo_selesai'),
ref text (no WO), pesan text, at timestamptz, dibaca_oleh text[]`.

### tto (perubahan)
Tambah kolom `penyerah text` (Yang menyerahkan, teks bebas) dan `input_by text` (NIK). Kolom
PIC lama tetap untuk data lama.

## Kebijakan akses (RLS, peran anon)
- `select` dan `insert` untuk tabel di atas; `update` hanya lewat fungsi `security definer`
  (`imm_wo_move`, `imm_obs_move`, `imm_notif_read`, `imm_schedule_save`).
- Tidak ada kebijakan `delete` untuk tabel baru.
