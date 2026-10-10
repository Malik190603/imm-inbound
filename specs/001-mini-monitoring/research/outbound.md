# Pemetaan KPI Storing / Outbound / Planner ke Google Sheets

Tanggal riset: Sabtu 10 Okt 2026 (pagi). Metode: hanya WebFetch ke gviz (43 fetch). Privasi: tidak ada nama orang/customer, NIK, HP yang disalin.
Prefix URL: `G = https://docs.google.com/spreadsheets/d/` (bila cache aneh: `https://docs.google.com/spreadsheets/u/0/d/`).

ID singkat:
- **SO** = `1UxfNFEWjHhPP9MhBIAMDYnT6cv6XkzgeWX1qWk0YSNU` DASHBOARD STORING & OUTBOUND AHI 2026 (**hanya AHI / A017**)
- **DP** = `1xiP8ziuMarhvMI_f_WOjwwW3Vm4B3KleAYRGRFmpFSg` Demand Picking 2026 (AHI)
- **PL** = `1WHg13sOdeAVtutRIn5eL_11a3SjOAR5d4fOWUXMiFiA` Dashboard Planner (HCI + AHI)
- **LD** = `1-DrDOPpH80FZ819XEXJr7MPJcq38Gv_2fTHHAwm8JZs` Laporan Daily Update 2026 (HCI + AHI)
- **DT** = `1iXNQJ3mLv7mw3X1x9n_IvVEroprL-scWhe13-dFGONY` Salinan dari Daily 2026 TALLO (**basi**)
- **IMM** = `1Dxejz_FVQqE6t3xg6dWsLwlJoB7qBFOyZKRqvsfonQs` tab MASTER_LC
- **LB** = `1tW0CEKUTkcMBFFVgk_8BOCIBzf0nkGxG-_g8V7iKVX0` LOGBOOK BARANG KELUAR 2026 (LP)

Catatan teknis gviz:
- `sheet=<nama>` yang **salah** tidak error, tetapi diam-diam mengembalikan tab pertama (contoh: `sheet=SHIPMENT` di SO mengembalikan isi `Dashboard`). Validasi selalu dengan mencocokkan header yang diharapkan.
- `&range=A1:N60&headers=0` + `tqx=out:html` berguna untuk tab berformat dashboard/matriks.
- Agregat `group by` di server berjalan (`count`, `sum`, `min`, `max`) bila kolom bertipe angka/tanggal. Kolom tanggal campuran teks/tanggal menjadi null untuk nilai minoritas (lihat LB Monitoring LC, MASTER_LC).

---

## Tab-tab sumber (header persis)

### SO `Case ID` (case ID yang di-release = demand picking)
`STORERKEY, SHIPTO, ORDERKEY, EXTERNORDERKEY, TYPE, REQUESTEDSHIPDATE, CASEID, WAVEKEY, ID, LOC, SKU, DESCR, DEPT, QTY, STATUS, ADDDATE, Level, Time, Area, GATE, MONTH` (A..U)
- ADDDATE = tanggal (gviz bertipe date). STATUS hampir selalu `Released` (sedikit `Normal`). Level ∈ `Floor`, `Level Atas`, `Level Bawah` (+ sesekali `#VALUE!`/kosong). TYPE ∈ `GRW`, `Customer`, `Tugu`, `Damage`. Area `Gudang A`. Data 1 Sep → 10 Okt 2026 (bulan berjalan + sebelumnya).
- URL: `G<SO>/gviz/tq?tqx=out:csv&sheet=Case%20ID&tq=select%20P,O,Q,E,count(G)%20group%20by%20P,O,Q,E`

### SO `Transaction` (log picking WMS)
`No, STORERKEY, TRANTYPE, SKU, Description, SKUGROUP, LOT, FROMLOC, FROMID, TOLOC, TOID, SOURCEKEY, QTY, ADDDATE, ADDWHO(ID.nama — jangan tampilkan), USERNAME, EXTERN, DOC No, Expired date, SOURCETYPE, TransNo, CM3, BATCH, Level, Time, Status, Area, LOC, LVL, GATE, MONTH` (A..AE)
- TRANTYPE `PICKING`, TOLOC `PACK`, TOID = Case ID tujuan. Status `Picking`. BATCH (shift) ∈ PAGI/SIANG/MALAM. LVL = tingkat rak 1–6 (FLR untuk floor). CM3 = volume baris dalam cm³ → **CBM = sum(CM3)/1e6** (cocok dengan Demand Picking: 1 Okt 23,98 vs 23,93; 9 Okt 24,97 vs 24,96).
- 1 Sep → 10 Okt: PAGI 7.951, SIANG 6.904, MALAM 1.194 baris.
- URL: `G<SO>/gviz/tq?tqx=out:csv&sheet=Transaction&tq=select%20N,Z,X,count(A),sum(M),sum(V)%20where%20N%3E%3Ddate%20%272026-10-01%27%20group%20by%20N,Z,X`

### SO `Query Picking` (agregat siap pakai hari ini)
Blok berdampingan: `STORERKEY, ADDDATE, Level, Area, TYPE, Total S` (case ID released per level/type) | `STORERKEY, ADDDATE, BATCH, Level, Area, GATE, Total AA` (picked per shift/level) | `STORERKEY, ADDDATE, BATCH, Area, LVL, Total AC` (picked per LVL rak) | `STORERKEY, ADDDATE, EXTERN, BATCH, Status, Total W` (per picker — ID orang, jangan tampilkan) | `Date/Day, CaseID, PAGI, SIANG, MALAM, MPP, Productivity`.
- Hari ini (10/10): released 126; picked PAGI 61 + SIANG 65 = 126.
- URL: `G<SO>/gviz/tq?tqx=out:csv&sheet=Query%20Picking&tq=select%20*%20limit%206`

### SO `Dashboard` (tata letak, AHI)
Blok "STATUS / GUDANG A / LEVEL": baris `RELEASED`, `PICKED`, `OPEN CID`, `%` × kolom LVL ATAS / LVL BAWAH / FLOOR / total → 34/85/7/126, 34/85/7/126, 0/0/0/0, 100%. Blok "PICKING BY LOCATION RACKING": LVL 6=9, 5=10, 4=8, 3=10, 2=22, 1=57, FLR=7, TOTAL=123. Blok "INTRANSIT CUSTOMER" RELEASED/PICKED/OPEN LOC 21/21/0. FILLRATE per dept (CBM ORIGINAL, QTY SHIPPED, ACHIEVMENT), GROUPING BY DEPARTEMEN (99%), "SLA STO (DK)" HIT 0-3 HARI / MISS 7 HARI UP (saat dibaca semua 0).
- URL: `G<SO>/gviz/tq?tqx=out:html&sheet=Dashboard&headers=0`

### SO tab lain
- `MIS SLA`: `NO, Aging (Days), SHIPFROMSITE, SHIPFROM, OWNER, STREBOOKING, ShipToCode, ShipTo, Ship To Name, No RT, MegaDO, ORDERKEY, NORECEIVE, EXTERNORDERKEY, TYPE, CITY, STATUS, Receive Date, Delivery Date, Edit Date, H Delivery Date, CBM, Qty, CaseID, Receive No HUB, LC DC HUB, LC NDC, Alamat, REASON, Achievement(Hit/Miss), Area(Dalam/Luar Kota), Status(MISS), KETERANGAN` — daftar order SLA store yang **miss** (AHI).
- `Query Grouping`: per dept `BU, KODE, DEPARTEMEN, CAPASITY(CBM), terpakai, %, achievement` (kapasitas lokasi per dept).
- `FILLRATE`: ekspor order lines (`No LC, ORDERKEY, …, STATUS, ADDDATE, EDITDATE, …, ORIGINALQTY, OPENQTY, …, QTYPICKED, SHIPPEDQTY, CBM_ORIGINAL_QTY, CBM_SHIPPED_QTY, OK, NOL, KURANG, MONTH`) — sama struktur MASTER_LC.
- `Query Fillrate`: header saja (`TYPE, EDITDATE, STORERKEY, Total_Z, Total_AA, Total_T, Total_Y, OWNER, STATUS, Edit Date, Area, Status, Total AF`), kosong.
- `shiped nol`: baris order shipped 0 + `KETEANGAN SHIPED NOL`.
- `AA`: peta `LOC → GATE`.
- `RT`: beberapa blok query kecil; blok kanan `Tanggal | Site | Inbound | … | Move | Outsatnding Floor` berisi `10/10/2026 | AHI | 0 0 0.0 0.0 0 0 0 | 1153 | 1384 | 120%`. 1384/1153 = 120% = persis Occupancy AHI di LD (119,99%) → angka ini **kapasitas vs terpakai (CBM)**, bukan outstanding floor meski labelnya begitu.
- `report/day`: bukan tabel — teks pesan WA harian (demand 9-10: PICKING 540 CID = lvl atas 177, lvl bawah 276, flr 87; target 30 cid/man/jam; MOVE 23 cbm, target 2,5 cbm/man/jam; pencapaian jam 12:00). Cocok dengan Case ID.

### DP `okt` (dan `Feb`…`Sept`, `diman picking` = Jan, `sumary`)
Tanpa baris header di tab bulanan. Kolom A = tanggal teks "Friday, 9 Oct" (tanpa tahun). Lalu grup 5 kolom **OD, CID, SKU, QTY, CBM**: B–F plan picking GRW AHI, G–K plan picking customer AHI, L–P **total picking**, Q–U / V–Z / AA–AE transit store (AHI/TGI/KWI), AF–AJ total transit store, AK–AN transit customer/RT (urutan grup menurut survei; label tidak ikut gviz).
- 9 Okt: total picking 142 OD / 540 CID / 285 SKU / 1.629 qty / 24,96 CBM. 8 Okt transit total 238 OD / 4.050 CID / 27,06 CBM. 10 Okt belum terisi.
- URL: `G<DP>/gviz/tq?tqx=out:html&sheet=okt&headers=0&range=A1:AN14`
- `sumary`: "Diman OUT" per tanggal (`kamis,1/1/2026`) dengan grup OD/qty/cbm + "SISA DIMN SEBELUMNYA" — hanya Jan yang terisi.

### LD `RDC Tallo AHI Okt 2026` / `RDC Tallo HCI Okt 2026` (matriks KPI harian)
Baris 2: `PERFORMANCE | STANDARD | (ACHIVEMENT) | 1 Oct-26 … ` (E = 1 Okt; jendela sampai 5 Nov-26). Baris: `SLA Customer`(99%), `SLA Store`(99%), `LPPB DO`(0,20%), `Accuracy`(99%), `Occupancy`(85%-115%), `Tugu`(0,20%), `Picking Level 1`(30%); lalu MHE, SLOC (Rp), INCOMING kontainer (POO/SAILING/POD <7, 7-14, >14 hari), UNLOADING PLAN/REALISASI/PENDING BONGKAR (teus/armada), **OUTBOUND PLANNING DEMAND IN / REALISASI WAVE / FORECAST** (cbm & OD: Customer –DC/–Transit NDC/–RT Store; Store –DC/–Transit/–Antar Store), **OUTSTANDING ORDER AKAN DATANG / H+0 / TELAT** (cbm & OD Customer –DC/–Transit), **BACKLOG STORE 0 / 1-3 / 4-7 / 8-14 / 15-21 / 22 UP** (cbm, Dalam/Luar Kota, –DC/–Transit).
- URL AHI: `G<LD>/gviz/tq?tqx=out:html&sheet=RDC%20Tallo%20AHI%20Okt%202026&headers=0&range=A1:N60` (lanjut `range=B60:N140`)
- URL HCI: `G<LD>/gviz/tq?tqx=out:html&sheet=RDC%20Tallo%20HCI%20Okt%202026&headers=0&range=A1:N12`
- `Summary AHI` (dan `Summary HCI`): kartu satu tanggal ("Date: 10 Oct-26") dengan PERFORMANCE/STANDARD/nilai, MHE, WH MAN (Headcount/Kebutuhan/Hadir/Gap), OUTBOUND PLANNING vs KEMAMPUAN. URL `…sheet=Summary%20AHI&headers=0&range=A1:P40`.
- `Penggunaan Armada`: analisa kemampuan armada per BU (jumlah armada × CBM, "lakukan Rit-2") — statis.
- `schedulle`: jadwal shift MPP (nama orang — jangan dipakai).

### PL Dashboard Planner — nama tab (dari bar tab halaman `/edit`)
`Dashboard`, `PLAN GRW`, `SHIP GRW`, `PLAN TODAY CUST`, `SHIP CS`, `Out Cust H+1-3`, `Q PLAN TODAY`, `Q Ship CS`, `Q PLAN GRW`, `Q Ship GRW`, `Q H+1`, `Pending`, `Rumus BU` (pemisahan kata dari teks bar tab; yang terverifikasi lewat gviz: PLAN GRW, PLAN TODAY CUST, SHIP CS, Out Cust H+1-3, Pending).
- `PLAN GRW`: `#, STORE(=BU), LC HUB, NO, STOP, MEGA DO, NO ORDER, PRIORITY, RTACTION, SHIPFROM, NO RECEIVE, STATUS, NAMESHIPTO, TYPE, LOADID, ADDRESS, REASON, STORE BOOKING, ADD DATE, REQ DATE, SKU, QTY, CBM, NO LC 2, REQUEST ORI DATE, -, -, TYPE (COPY RUMUSNYA)(RDC/NDC), TANGGAL KIRIM (RUMUS TANAM)`. CBM bertipe campuran (sum gagal: AVG_SUM_ONLY_NUMERIC) → jumlahkan di klien.
- `PLAN TODAY CUST` / `SHIP CS`: `XX, P, R, PRIORITAS, RT-ACTION, ACTION, ORDERKEY, EXTERNORDERKEY, SHIPTO, NAME SHIPTO(nama customer!), ADDRESS, CITY, REASON, AREA DELIVERY, SHIPFROM, SHIPFROM DESC, TYPE(Customer/Tugu/…), t_SKU, QTY_ARTICLE, QTY_rcv, CBM, ADDATE, REQ KIRIM, STATUS, PHONE1(sensitif), NO LC DC, NO RCV HUB, NO LC HUB, NO SR, OWNER(BU), STORE BOOKING, FROM SITE, AREA, (PLAN TODAY: JANGAN DIHAPUS=PLAN | SHIP CS: ASAL, aging)`.
- `Out Cust H+1-3`: `Aging (Days), SHIPFROMSITE, OWNER, STREBOOKING, ShipTo, ShipToName, No RT, MegaDO, ORDERKEY, NORECEIVE, EXTERNORDERKEY, TYPE, CITY, STATUS(header tertulis "Created Internally"), Receive date, Delivery Date, Edit Date, H Delivery Date, CBM, Qty, CaseID, Receive No HUB, LC DC HUB, LC NDC, Alamat, REASON, Achievement(Hit/Miss), Area, RUMUS JANGAN DI HAPUS(tgl), ST(Today/H+1/H+2/H+3 up), DC(RDC/NDC), STO`. OWNER = HCI & AHI. Delivery Date 1 Agu → 20 Nov 2026.
  - URL agregat: `G<PL>/gviz/tq?tqx=out:csv&sheet=Out%20Cust%20H%2B1-3&tq=select%20C,AD,AE,N,count(I),sum(S),sum(T),min(P),max(P)%20group%20by%20C,AD,AE,N`
  - Nilai STATUS yang ada: `Created Internally, Not Started, Allocated, Part Released, Released, Part Picked, Picked Complete, Staged, Loaded` (RDC) dan `Receive, Hub-stage, Hub-Loaded` (NDC/transit). **Tidak ada `Shipped Complete`** dan banyak baris lama (Agu) masih `Loaded`/`Released` → kemungkinan status dibekukan saat baris ditempel; ST tampaknya kategori lead time, bukan relatif ke hari ini. Perlu konfirmasi pemilik sebelum dipakai sebagai "outstanding saat ini".
- `Pending`: `PLANDELIVERYDATE, LC, Order Key, Ext Order Key, Reaceive No, No Trans, No Police, Nama Custome, Reason Pending, Nik Driver, Nik Asst Driver, Time, Stop, Type, Owner, Store, Wilayah, From, CBM, Tgl kirim, Aging., Days, Month, Aging time` — **kosong (header saja)** saat ini.
- `Dashboard` (filter tanggal 10/10/2026, SITE ALL): lihat KPI D.

### IMM `MASTER_LC`
Header A..AA: `No LC, ORDERKEY, EXTERNORDERKEY, AreaPengiriman, TradingPartner, KODE SITE, SITE NAME(nama customer/store), ORDERDATE, REQUESTEDSHIPDATE, POKEY, TYPE, STATUS, ADDDATE, EDITDATE, EDITWHO(nama), SITE(BU), SKU, DESCR, Dept, ORIGINALQTY, OPENQTY, QTYPREALLOCATED, QTYALLOCATED, QTYPICKED, SHIPPEDQTY, CBM_ORIGINAL_QTY, CBM_SHIPPED_QTY`. 45.522 baris.
- STATUS × BU (count baris): AHI Shipped Complete 16.891 (GRW 16.830, Customer 50, Flow Thru 8, CSO 3) + 774 kosong; HCI Shipped Complete 26.699 (Customer 18.741, GRW 7.639, Flow Thru 198, Custom Made 98, CSO 18, Damage 4, Tugu 1) + 179 kosong; FBI Shipped Complete 442; KWI 398 kosong; TGI 139 kosong (baris KWI/TGI/kosong hanya berisi SHIPPEDQTY).
- **Hanya `Shipped Complete`** → tidak ada tahap outbound terbuka. QTYPICKED selalu 0.
- ORDERDATE/ADDDATE = teks `MM/DD/YYYY HH:MM` (= waktu order dibuat; ADDDATE = ORDERDATE). EDITDATE campuran (19.909 bertipe datetime, sisanya teks/kosong; urutan D/M vs M/D tidak konsisten — max terbaca "2026-12-9"). Yang bisa diturunkan: lead time order dibuat → edit terakhir (≈ shipped) per LC. **Tidak** bisa memberi LC→Check in→Open→Close.
- URL: `G<IMM>/gviz/tq?tqx=out:csv&sheet=MASTER_LC&tq=select%20P,L,K,count(B),sum(T),sum(X),sum(Y),sum(Z)%20group%20by%20P,L,K`

### LB `Monitoring LC` dan `SEMESTER 2` (logbook LP barang keluar per LC/armada)
- `Monitoring LC` header: `SITE, WHSEID, LOAD, TYPESI, PLAN DELIVERY DATE, NOPOL, KODE ARMADA, JOBLD, NIK DRIVER(sensitif), NAMA DRIVER(nama), CREW 1, CREW 1 NAME, REMARK, JALUR, ADD DATE, TGL KIRIM, TGL LOADING, TOTAL STOPAN, TOTAL ORDER, Infor, RT TD, RT A, RT B, ORDER NDC, TOTAL CASE ID, DRIVER, LP`. Isi baris bergeser dari header (kolom A berisi No LC `260101C003`, nilai `RIT 1` muncul di kolom J). 6.138 baris, baris pemisah tanggal teks "Kamis 1 Januari 2026". Kolom tanggal hanya terbaca bertipe date untuk 1–2 Jan → isi tampaknya hanya awal tahun / format campuran; tidak ada LC Sept/Okt.
- `SEMESTER 2`: header gabungan (`NO GRW, STOP, CARRIERID, TRANSPORTTYPE, NOPOL, JENIS PENGIRIMAN, KETERANGAN, RETASE, STATUS, NAMA CUST, …`), baris berisi LC (mis. `260724C013`), tipe armada, `RIT 1`. Ini kandidat sumber Rit per hari (perlu baca seluruh tab dan parse di klien).

### DT Salinan dari Daily 2026 TALLO — **basi, jangan dipakai**
- `SLA Customer AHI`: ringkasan 7 hari semua 0; baris detail (`STORERKEY, ORDERKEY, EXTERNORDERKEY, SHIP TO NAME, TYPE, STORE BOOKING, BOOKING SITE, DELIVERY SITE, 1..5 (tanggal tahap), 0, SLA CATEGORY(ON TIME/DELAY 1-3), AREA PENGIRIMAN, CITY`) hanya 1 Feb → 8 Mei 2026.
- `SLA & Outstanding Store`: blok 7 hari (03–09 Okt) HCI semua 0; blok harian berhenti di Jan.

---

## A. Home "SLA Outbound" — **READY**
- Sumber: LD `RDC Tallo AHI Okt 2026` dan `RDC Tallo HCI Okt 2026`, baris `SLA Customer` dan `SLA Store` (kolom B), STANDARD kolom C (`99%`), nilai harian di kolom yang header baris 2-nya = tanggal (`d Mon-yy`, mis. `9 Oct-26`).
- Formula: realisasi = sel tanggal terakhir yang terisi (hari ini biasanya kosong sampai laporan dibuat → pakai H-1); status = realisasi ≥ standar.
- Sampel terbaru (9 Okt): AHI SLA Customer 100,00%, SLA Store 100,00%; HCI 100,00% / 100,00%. Alternatif satu sel: `Summary AHI`/`Summary HCI` (kartu "Date: 10 Oct-26", SLA Customer 100,00%).
- BU: hanya **AHI** (grup AHI/A017; TGI/KWI/FBI tidak dipisah) dan **HCI**. Nama tab berganti tiap bulan (`… Nov 2026`) → cari tab berdasarkan pola, atau pakai `Summary <BU>`.
- Detail miss per order (AHI saja): SO `MIS SLA` (Achievement = Miss, Aging (Days), REASON).

## B. Storing (AHI saja) — **READY** untuk case ID/level, **PARTIAL** untuk demand CBM inbound / outstanding floor, **NO SOURCE** untuk pressing
| KPI | Sumber | Formula | Sampel 10/10 (9/10) |
|---|---|---|---|
| Total case ID | SO `Case ID` | count(CASEID) where ADDDATE = hari ini (STATUS Released) | 126 (540) |
| Picked | SO `Transaction` | count where TRANTYPE=PICKING, Status=Picking, ADDDATE=hari ini (atau distinct TOID ∈ CASEID hari ini) | 126 (540) |
| Open case ID | Case ID − Picked (lebih tepat: CASEID yang tidak ada di Transaction.TOID) | | 0 |
| Level bawah / atas / floor | kolom `Level` di kedua tab | per level | Released 85 / 34 / 7; picked 85 / 34 / 7 (9/10: 276/177/87 vs 277/176/87) |
| % | picked / released | | 100% |
| Breakdown per LVL rak | `Transaction.LVL` (1–6, FLR) atau `Query Picking` blok Total AC | count per LVL | LVL1 57, 2 22, 3 10, 4 8, 5 10, 6 9, FLR 7 (=123, Gudang A) |
| Per shift | `Transaction.BATCH` / `Query Picking` | | PAGI 61, SIANG 65 |
| CBM picking | `Transaction.CM3` | sum/1e6 | 5,18 m³ (24,97) |
| Total demand (CID/qty/CBM) | DP `okt` grup L–P | baris tanggal = "Friday, 9 Oct" | 9 Okt: 142 OD, 540 CID, 1.629 qty, 24,96 CBM |
| Demand dari inbound by CBM | Tidak ada kolom eksplisit di SO. Kandidat: LD baris "OUTBOUND PLANNING DEMAND IN" (cbm) atau SO `RT` blok "Inbound" (nilai 0) | — | PARTIAL |
| Outstanding floor | SO `RT` kolom berlabel "Outsatnding Floor" ternyata berisi kapasitas 1.153 / terpakai 1.384 / 120% (= occupancy) | — | PARTIAL (label menyesatkan) |
| Pressing | tidak ditemukan di SO/DP/LD | — | NO SOURCE |
HCI: tidak ada sheet storing HCI di daftar ini (hanya LD "Picking Level 1" % harian per BU: AHI 37%, HCI 24% pada 9 Okt).

## C. Outbound
| KPI | Status | Sumber / alasan |
|---|---|---|
| Aging LC→Check in, Check in→Open, Open→Close (avg/min/max) | **NO SOURCE** | Tidak ada stempel waktu check-in/open/close dock di sheet mana pun. MASTER_LC hanya order dibuat (ORDERDATE=ADDDATE) dan EDITDATE terakhir; Monitoring LC punya ADD DATE, TGL LOADING, TGL KIRIM per LC (paling dekat: LC dibuat→loading→kirim), tetapi isinya hanya awal Jan / format campuran. |
| Rit 2 kirim hari ini, Rit 1 kirim besok | **PARTIAL** | LB `SEMESTER 2` (kolom RETASE berisi `RIT 1`/`RIT 2`, No LC `yyMMdd…` → tanggal kirim dari 6 digit pertama LC). Kolom bergeser dan bertipe campuran → baca tab penuh (tanpa `tq`) dan parse di klien. Belum diverifikasi ada data Okt. |
| Total picked + status picked/open/close | **PARTIAL** | Picked/open per case ID: SO (AHI) seperti B. Status order per tahap: PL `Out Cust H+1-3` STATUS (Released / Picked Complete / Loaded …), HCI+AHI, tapi status kemungkinan dibekukan (lihat atas). MASTER_LC tidak berguna (hanya Shipped Complete). |
| Outstanding booking DC (order, CBM) | **PARTIAL** | LD baris "OUTSTANDING ORDER AKAN DATANG / H+0 / TELAT" Customer –DC (cbm & OD) per hari. AHI 10 Okt: akan datang 16 OD / 3,50 cbm (DC 16 / 3,50), H+0 0, telat 0. HCI: baris sama di tab HCI (tidak dibaca di bawah baris 12). |
| Outstanding intransit (order, CBM) | **PARTIAL** | LD baris yang sama, "– Transit" (AHI 10 Okt: 0 OD / 0,00). PL `Out Cust H+1-3` DC=NDC status Receive/Hub-stage. |
| Outstanding location pack (qty) | **NO SOURCE (langsung)** | Tidak ada snapshot stok lokasi PACK. Turunan: Transaction (TOLOC=PACK) qty picked − shipped; atau PL status `Picked Complete`/`Staged`. |
Cakupan BU: SO = AHI saja; LD = AHI & HCI; PL = HCI & AHI; MASTER_LC = AHI, HCI, FBI (+KWI/TGI tanpa status).

## D. Planner (PL `Dashboard`, filter From/To = hari ini, SITE ALL) — **PARTIAL** (angka hanya dari tab tata letak; rumus tab mentah belum terpetakan)
Tata letak (baris 9–20; pemetaan kolom disimpulkan): B = TYPE (`Customer RDC`, `Customer NDC`, `RT`, `TOTAL`); C/D/E = PLAN OD/CBM/QTY; F/G/H = REALISASI OD/CBM/QTY; I = %; K/L/M = outstanding TODAY (H0); O/P/Q = H+1; S/T/U = H+2; W/X/Y = H+3 up (OD/CBM/QTY). Blok HCI baris 11–14, AHI baris 17–20.
- HCI 10/10: Plan RDC 138 OD/65,75 CBM/511 qty, NDC 14/4,84/42, RT 23/14,22/23, TOTAL 175/84,82/576; realisasi 0 (0%). Outstanding TOTAL Today 45/20,82/153; H+1 107/48,14/316; H+2 87/105,51/932; H+3up 219/215,20/1.590.
- AHI 10/10: Plan TOTAL 35/21,88/66 (RDC 10/2,77/41, NDC 1/0,14/1, RT 24/18,98/24); outstanding H+1 9/1,55/18, H+2 6/1,65/15, H+3up 1/0,30/1.
- Aging intransit customer in DC (blok "BY STORE (GRW)", H22–N34): baris per store (Latanete, Panakkukang, Pettarani, Perintis, Hertasning, IE …, TITIP KIRIM), kolom J=1-3, K=4-7, L=8-15, M/N = (diduga 16-30 / 30 up; label tidak terbaca). Contoh Latanete 29,01 / – / 12,32 / 2,09 (satuan diduga CBM). Hanya HCI terlihat.
- Outstanding transit CBM: sel E6 = 142,62 (label tidak terbaca) — perlu konfirmasi.
- Pending kirim: tab `Pending` kosong → 0 saat ini (READY bila diisi; kolom CBM, Owner, Aging).
- Alternatif lebih bersih per hari: LD "OUTSTANDING ORDER" dan "BACKLOG STORE 0 / 1-3 / 4-7 / 8-14 / 15-21 / 22 UP" (AHI 9 Okt: backlog store 1-3 hari 24,49 cbm; lainnya 0). Bucket LD berbeda dari 1-3/4-7/8-15/16-30/30up.
- URL: `G<PL>/gviz/tq?tqx=out:html&sheet=Dashboard&headers=0&range=A1:AZ70`

## E. Demand per dept per hari (CBM & qty)
| Dept | Sumber | Satuan tersedia | Status |
|---|---|---|---|
| Inbound | LD baris UNLOADING PLAN/REALISASI/PENDING BONGKAR (teus/armada, bukan CBM); CBM masuk harian: "Dashboard inventory SCR" kolom `Inbound` (survei #12) | teus, armada, CBM (inventory) | PARTIAL |
| Storing | DP `okt` (OD, CID, SKU, QTY, CBM per tanggal); SO Case ID/Transaction (CID, qty, CM3) | CID, qty, CBM | READY (AHI) |
| Inventory | Tidak ada "demand"; hanya cycle count target/realisasi (Dashboard inventory02) | lokasi/qty | NO SOURCE (CBM) |
| Planner | LD "OUTBOUND PLANNING – DEMAND IN / FORECAST" (cbm & OD per Customer DC/Transit/RT Store, Store DC/Transit) | cbm, OD (tanpa qty) | READY (AHI, HCI) |
| Outbound | LD "REALISASI WAVE" (cbm, OD); PL Dashboard plan/realisasi (OD/CBM/QTY) | cbm, OD, qty | PARTIAL |
Sampel AHI 9 Okt (LD): DEMAND IN Customer 2,13 cbm / 6 OD, Store 25,27 cbm; FORECAST total 25,41 cbm; REALISASI WAVE Customer 4,51 cbm.

## Status MASTER_LC dan stempel waktu
- Nilai STATUS: hanya `Shipped Complete` (+ kosong). Tidak ada Released/Picked/Loaded.
- ADDDATE = ORDERDATE (teks). EDITDATE = suntingan terakhir (≈ waktu shipped), format campuran. Kesimpulan: tidak bisa memberi stage timestamps outbound; hanya lead time order→shipped kasar per LC.
