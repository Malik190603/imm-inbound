# Contract: Supabase (project IMM, peran anon)

Semua dipanggil dari `www/store.js` lewat REST (`/rest/v1/…`, `/rest/v1/rpc/…`) dengan kunci
anon. Tidak ada perintah hapus.

## Fungsi (RPC, `security definer`, `search_path = public`)

| Fungsi | Masuk | Keluar | Aturan |
|--------|-------|--------|--------|
| `imm_next_no(p_prefix text)` | `WO`/`OBS` | text nomor | tanggal = hari ini WITA; `pg_advisory_xact_lock`; upsert `run_no` |
| `imm_wo_create(p jsonb)` | field FR-050 + nik | baris WO | validasi pilihan & panjang; status `menunggu`; tulis `wo_event` + `notif` (`wo_baru`, `wo_approve`) |
| `imm_wo_move(p_no, p_to, p_nik, p_role, p_jabatan, p_photos text[], p_note)` | | baris WO | cek `WO_NEXT`; `disetujui`/`ditolak` dari `menunggu` hanya jabatan MANAGER; `selesai` hanya role MHE dan 1–4 foto; tulis `wo_event`; `notif` untuk `pending` dan `selesai` |
| `imm_obs_create(p jsonb)` | mulai, tim, nik | baris OBS | status `open` |
| `imm_obs_move(p_no, p_to, p_nik, p_role, p_jabatan)` | | baris OBS | `open→ongoing→closed`; hanya LP / MANAGER / ASST. MANAGER |
| `imm_obs_add(p jsonb)` | no, jenis, objek, kondisi[], detail, photos[], nik | baris entri | hanya bila OBS `ongoing`; objek & kondisi dari daftar tetap |
| `imm_schedule_save(p jsonb)` | id? + field | baris | jabatan MANAGER/ASST. MANAGER/SUPERVISOR/ADMIN |
| `imm_notif_read(p_ids bigint[], p_nik)` | | int | tambahkan nik ke `dibaca_oleh` |

Catatan: role/jabatan dikirim oleh aplikasi (login NIK tanpa PIN, risiko diterima pemilik).

## Tabel yang dibaca langsung (select)
- `work_order?order=created_at.desc&limit=200` (+ filter status/tanggal)
- `wo_event?no=eq.<no>`
- `observasi`, `obs_entry?no=eq.<no>&batal=is.false`
- `dc_schedule?order=mulai.asc`
- `notif?untuk=eq.MANAGER&at=gte.<30 hari>`
- `tto` (seperti sekarang + `penyerah`, `input_by`)

## Storage
Bucket `imm-photos`: `wo/<no>/<n>.jpg`, `obs/<no>/<entry>-<n>.jpg`; foto diperkecil di HP
(`preparePhoto`, sisi terpanjang 1600 px) sebelum diunggah.

## Error yang ditampilkan
`NETWORK`, `TIMEOUT`, `RULE` (pesan dari fungsi: mis. "Lampirkan minimal 1 foto dokumentasi"),
`DUP` (nomor bentrok — tidak terjadi karena kunci), `UNKNOWN`.
