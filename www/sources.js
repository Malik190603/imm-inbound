// Registri sumber Google Sheets Mini Monitoring + pemuat gviz bervalidasi dan bercache.
// window.IMMSrc di aplikasi, module.exports di Node (tes memakai fetch tiruan lewat setFetch).
// Pelajaran dari riset (specs/001-mini-monitoring/research): gviz MENGEMBALIKAN TAB PERTAMA bila nama tab salah,
// jadi setiap sumber punya `need` (judul kolom wajib) atau `mark` (teks penanda) yang dicek sebelum data dipakai.
// Kolom berisi data pribadi tidak diminta sama sekali (select kolom aman saja) atau dibuang lewat `priv`.
(function (root, factory) {
  const P = (typeof module === 'object' && module.exports) ? require('./parse-core.js') : root.IMMParse;
  const m = factory(P);
  if (typeof module === 'object' && module.exports) module.exports = m; else root.IMMSrc = m;
})(typeof self !== 'undefined' ? self : this, function (P) {
  const DOCS = {
    IMM: '1Dxejz_FVQqE6t3xg6dWsLwlJoB7qBFOyZKRqvsfonQs',
    SCR: '1Lah0IepAbVPJ1wpE6hjtEwOqojgKJniJvYn5FJtcob0',
    INV02: '10CJOU1DCjNnm6HePh0Xt_GT_i243XLJwo07MkaDyLNo',
    INV26: '1_HLTa4UBkM74DnebjIS4lhj5iLN9HSApRoFpBYeLgHE',
    LAYH: '1HTmVQq7pnId3WdH-i-cG0H1LXfdiqaqMEkUs72z5dJM',
    LAYA: '1Fh9ZBo3sTW4u4upoWslDzT0Vl2Nh6ikJ5TJGiOx6GrQ',
    SO: '1UxfNFEWjHhPP9MhBIAMDYnT6cv6XkzgeWX1qWk0YSNU',
    DP: '1xiP8ziuMarhvMI_f_WOjwwW3Vm4B3KleAYRGRFmpFSg',
    PL: '1WHg13sOdeAVtutRIn5eL_11a3SjOAR5d4fOWUXMiFiA',
    LD: '1-DrDOPpH80FZ819XEXJr7MPJcq38Gv_2fTHHAwm8JZs',
    PLAN26: '1F1VnN_kOOpTCUMip_-Jpdg6RUY7Ai9wmNFVFr6Z0kac',
    DIS2: '1crYUpCJSYHrfBbZ99aUee3v4hRJrxWw4XRIryl9rong',
    INSCR: '1T6uWLA_8eDa5TYaKGZATHUoGMYXc6JzrR4wHEFK4mi4',
    VIS: '1Pr9g7PQ9_xFIBhejYo8eBbPmoOeBmI6OQKaaGqLFboE',
    KAR: '1OTPaUh5C1iHHPj_ihsfMxTjVhrfxPDZNHundJvUO9Zg',
    LB: '1tW0CEKUTkcMBFFVgk_8BOCIBzf0nkGxG-_g8V7iKVX0',
    BM: '1U4Odr5w27a7ErcdCAJIhsJpBcYMqTBbMpgjXINGAnZc',
    KDS: '1jB8LDiBboIynBJPdO38CCpXGNWXD7LxF8uSRfLPZ4uk',
    OBS: '1wu9xjqFrmWaqNQksdOBfoy9xAu-cJYn14zSscm7fCvk',
    SEAL: '12_LjT16sinXF6V2rAa_wPgS2rWeRY3un71I7MPtoc_s',
    MC: '1yJpdmsaMT2nRGFXj21aSix9qQENJqy16D5g4U73ggww',
    MCU: '1IdI7WJr1SzyAL8WWASoO3ZkbFu3fp-xpGEn2Mm-W7VI',
    DRH: '1EvZus41LoHBFBEGyVz9Ri6Re_q5G0c-cZtAcsAxy7vU',
    DRA: '1xDo4qqUeBbbb_lLdAzSaBFDnylDZ7N56SjNcD59mWbw',
    DRN: '1Vp7QyadObJJA0n8jV5SjCgkbL3klGpFvYzZiXAuyGxc',
    OPI: '1o8GxDc72nZTcHdj9oBH2CuYPZHbHvd1And4mG0yzRFw',
    D26: '1iXNQJ3mLv7mw3X1x9n_IvVEroprL-scWhe13-dFGONY',
    DCR: '1F2JiOJpp2F7ITOjoMkchLE-HTCYUE6ZODRcvaqRhLwk',
  };
  const MIN = 60000, HOUR = 60 * MIN;
  const back = (ctx, n) => P.addDays(ctx.today, -n);
  // Tab bulanan Demand Picking memakai ejaan bebas; bulan yang belum ada jatuh ke nama 3 huruf kecil.
  const DP_TAB = { 1: 'diman picking', 2: 'Feb', 3: 'Maret', 4: 'April', 5: 'Mei', 6: 'jUNI', 7: 'jULI', 8: 'Augt', 9: 'Sept', 10: 'okt', 11: 'nov', 12: 'des' };
  const mon = (ctx) => +ctx.today.slice(5, 7);
  const ldTab = (bu) => (ctx) => P.monthTab('RDC Tallo ' + bu, ctx.today);
  const drTab = (bu) => (ctx) => P.monthTab('RDC Tallo ' + bu, ctx.today, { year: false });
  const LOADCODE = "matches '[0-9]{6}[A-Z][0-9]+'";

  // group = menu/departemen pemakai (untuk Settings → Database Spreadsheet)
  const REG = {
    users: { doc: 'IMM', sheet: 'Master User APK', tq: 'select A,B,C', headers: 1, need: ['USER', 'ROLE', 'JABATAN'], ttl: 6 * HOUR, group: 'Akun', title: 'Master User APK', keepRaw: false },
    // ---------- Inventory ----------
    wtwH: { doc: 'INV02', sheet: 'WTW HCI', tq: (c) => `select * where B > 0 and A >= date '${back(c, 45)}' and A <= date '${c.today}'`, headers: 1, need: ['TGL', 'TARGET', ['RALISASI', 'REALISASI'], 'ACCURASI LOC'], ttl: 30 * MIN, group: 'Inventory', title: 'Wall to wall HCI' },
    wtwA: { doc: 'INV02', sheet: 'WTW AHI', tq: (c) => `select * where B > 0 and A >= date '${back(c, 45)}' and A <= date '${c.today}'`, headers: 1, need: ['TGL', 'TARGET', ['RALISASI', 'REALISASI'], 'ACCURASI LOC'], ttl: 30 * MIN, group: 'Inventory', title: 'Wall to wall AHI' },
    occH: { doc: 'SCR', sheet: 'OCCUPANCY HCI', tq: 'select A,B,C,D,E,F,G where D is not null', headers: 1, need: ['TGL', 'BU', 'Capasity', 'Used Space'], ttl: 30 * MIN, group: 'Inventory', title: 'Occupancy HCI' },
    occA: { doc: 'SCR', sheet: 'OCCUPANCY AHI', tq: 'select A,B,C,D,E,F,G where D is not null', headers: 1, need: ['TGL', 'BU', 'Capasity', 'Used Space'], ttl: 30 * MIN, group: 'Inventory', title: 'Occupancy AHI' },
    occAll: { doc: 'INV02', sheet: 'Occupancy', tq: 'select Q,R,AK,AL,AM,AN,AO,AP,AQ', headers: 0, mark: ['FBI'], ttl: 30 * MIN, group: 'Inventory', title: 'Occupancy FBI' },
    sloc: { doc: 'INV02', sheet: 'Update 1007 & 1009', tq: (c) => `select * where B >= date '${back(c, 40)}' and B <= date '${c.today}'`, headers: 0, mark: [], allowEmpty: true, ttl: HOUR, group: 'Inventory', title: 'Sloc 1007 & 1009' },
    barus: { doc: 'INV26', sheet: 'Update barus', range: 'A1:AE40', headers: 0, mark: ['ON HAND'], ttl: HOUR, group: 'Inventory', title: 'Update BARUS' },
    virtual: { doc: 'INV26', sheet: 'Virtual', range: 'A1:W40', headers: 0, mark: ['FLOOR', 'PACK'], ttl: HOUR, group: 'Inventory', title: 'Lokasi virtual & floor' },
    ccPick: { doc: 'INV26', sheet: 'CC PICKING', range: 'A1:AC80', headers: 0, mark: ['PICKING'], ttl: HOUR, group: 'Inventory', title: 'Cycle count picking' },
    ccMove: { doc: 'INV26', sheet: 'CC MOVE', range: 'A1:AC80', headers: 0, mark: ['MOVE'], ttl: HOUR, group: 'Inventory', title: 'Cycle count move' },
    locH: { doc: 'LAYH', sheet: 'Mst_Lokasi_All', tq: "select B,H,L,U,AA where B matches '[A-Z][0-9]{2}\\.[0-9]{3}\\.[0-9]+'", headers: 1, need: ['Location', 'Zone'], ttl: 24 * HOUR, group: 'Inventory', title: 'Master lokasi gudang' },
    stockLoc: { doc: 'LAYH', sheet: 'Update Stock By Location', tq: 'select D,sum(AC),max(T) where D is not null group by D', headers: 1, mark: [], ttl: 24 * HOUR, group: 'Inventory', title: 'Stok per lokasi (HCI)' },
    // ---------- Storing / Outbound / Planner ----------
    caseId: { doc: 'SO', sheet: 'Case ID', tq: (c) => `select P,E,Q,count(G) where P >= date '${back(c, 1)}' and P <= date '${c.today}' group by P,E,Q`, headers: 1, mark: [], need: [['ADDDATE']], ttl: 10 * MIN, group: 'Storing', title: 'Case ID (AHI)' },
    trans: { doc: 'SO', sheet: 'Transaction', tq: (c) => `select N,X,AC,W,count(A),sum(M),sum(V) where C = 'PICKING' and N >= date '${back(c, 1)}' and N <= date '${c.today}' group by N,X,AC,W`, headers: 1, need: [['ADDDATE']], ttl: 10 * MIN, group: 'Storing', title: 'Transaksi picking (AHI)' },
    dp: { doc: 'DP', sheet: (c) => DP_TAB[mon(c)], range: 'A1:AN40', headers: 0, mark: [], dateCol: 0, ttl: HOUR, group: 'Storing', title: 'Demand Picking' },
    plDash: { doc: 'PL', sheet: 'Dashboard', range: 'A1:Z70', headers: 0, mark: ['Customer RDC'], ttl: 15 * MIN, group: 'Planner', title: 'Dashboard Planner' },
    plPending: { doc: 'PL', sheet: 'Pending', tq: 'select A,O,Q,S,T,U', headers: 1, need: ['PLANDELIVERYDATE', 'CBM'], ttl: 15 * MIN, group: 'Planner', title: 'Pending kirim' },
    ldH: { doc: 'LD', sheet: ldTab('HCI'), range: 'A1:AN230', headers: 0, mark: ['PERFORMANCE', 'SLA Customer'], ttl: 15 * MIN, group: 'Outbound', title: 'Laporan Daily Update HCI' },
    ldA: { doc: 'LD', sheet: ldTab('AHI'), range: 'A1:AN230', headers: 0, mark: ['PERFORMANCE', 'SLA Customer'], ttl: 15 * MIN, group: 'Outbound', title: 'Laporan Daily Update AHI' },
    rit: { doc: 'LB', sheet: 'SEMESTER 2', tq: (c) => `select A,B,J where A starts with '${c.today.slice(2).replace(/-/g, '')}' or A starts with '${P.addDays(c.today, 1).slice(2).replace(/-/g, '')}'`, headers: 0, mark: [], allowEmpty: true, ttl: 15 * MIN, group: 'Outbound', title: 'Logbook barang keluar (Rit)' },
    // ---------- LP ----------
    lbSum: { doc: 'LB', sheet: 'SUMMARY', tq: 'select * limit 40', headers: 0, mark: ['TOTAL OD'], ttl: HOUR, group: 'LP', title: 'Logbook keluar — Summary' },
    palopo: { doc: 'LB', sheet: 'DATA ARMADA PALOPO', tq: `select B where B ${LOADCODE}`, headers: 0, mark: [], allowEmpty: true, ttl: HOUR, group: 'LP', title: 'Armada Palopo' },
    mamuju: { doc: 'LB', sheet: 'AZKO MAMUJU', tq: `select B where B ${LOADCODE}`, headers: 0, mark: [], allowEmpty: true, ttl: HOUR, group: 'LP', title: 'Armada Mamuju' },
    palu: { doc: 'LB', sheet: 'DATA ARMADA PALU 2026', tq: `select C where C ${LOADCODE}`, headers: 0, mark: [], allowEmpty: true, ttl: HOUR, group: 'LP', title: 'Armada Palu' },
    ttoOut: { doc: 'LB', sheet: 'TTO', tq: 'select A,D,F,G,H,I,K,L,M', headers: 1, need: ['TANGGAL', 'NO TTO'], ttl: HOUR, group: 'LP', title: 'TTO keluar' },
    nmOut: { doc: 'LB', sheet: 'NON MARCHENDISE', tq: 'select A,B,C,D,H', headers: 1, need: ['TANGGAL', 'PENGIRIM'], ttl: HOUR, group: 'LP', title: 'Non merchandise keluar' },
    visitor: { doc: 'VIS', sheet: 'Form Visitor', tq: (c) => `select A,F,I,J where A >= date '${back(c, 62)}'`, headers: 1, need: ['Timestamp', 'Tujuan Kunjungan'], allowEmpty: true, dmy: true, ttl: 10 * MIN, group: 'LP', title: 'Logbook visitor' },
    karyawan: { doc: 'KAR', sheet: 'Form Responses 1', tq: (c) => `select A,C,E,G,H,I,J where A >= date '${back(c, 62)}'`, headers: 1, need: ['Timestamp', 'Bagian'], allowEmpty: true, dmy: true, ttl: 10 * MIN, group: 'LP', title: 'Keluar masuk karyawan' },
    jemput: { doc: 'BM', sheet: 'DO JEMPUTAN ALL BU TAHUN 2026', tq: 'select B,C,F,I', headers: 0, mark: [], ttl: 30 * MIN, group: 'LP', title: 'DO jemputan (barang masuk)' },
    tugu: { doc: 'BM', sheet: 'TARIKANTUGU 2026', tq: 'select count(E)', headers: 1, mark: [], ttl: HOUR, group: 'LP', title: 'Tarikan tugu' },
    ret3pl: { doc: 'BM', sheet: 'BARANG RETURN 3PL', tq: 'select A,B,C,E', headers: 0, mark: [], ttl: HOUR, group: 'LP', title: 'Return 3PL' },
    sj: { doc: 'BM', sheet: 'SURAT JALAN ', tq: 'select count(D)', headers: 1, mark: [], ttl: HOUR, group: 'LP', title: 'Surat jalan' },
    ttoIn: { doc: 'BM', sheet: 'TTO', tq: 'select A,B,D,E,F', headers: 0, mark: [], ttl: HOUR, group: 'LP', title: 'TTO masuk' },
    nmIn: { doc: 'BM', sheet: 'NON MERCHANDISE', tq: 'select A,B,C,D,E,H', headers: 1, need: ['TANGGAL', 'PENGIRIM'], ttl: HOUR, group: 'LP', title: 'Non merchandise masuk' },
    seal: { doc: 'SEAL', sheet: 'Sheet1', tq: 'select A,C,D', headers: 0, mark: [], ttl: 15 * MIN, group: 'LP', title: 'Armada terseal' },
    kardus: { doc: 'KDS', sheet: 'Form Responses 1', tq: 'select C,E,F,G,K', headers: 1, need: ['TGL PROSES', 'JUMLAH /KG'], ttl: HOUR, group: 'LP', title: 'Penjualan kardus' },
    // ---------- Report Status (aturan per laporan: research/reports.md) ----------
    rep1: { doc: 'MC', gid: '1795026471', tq: (c) => `select count(B) where H = date '${c.day || c.today}'`, headers: 1, mark: [], allowEmpty: true, ttl: 10 * MIN, group: 'Report', title: 'MONITORING CONTAINER 2026' },
    rep2: { doc: 'MCU', sheet: 'BACKUP', tq: (c) => `select count(B) where U = date '${c.day || c.today}'`, headers: 1, mark: [], allowEmpty: true, ttl: 10 * MIN, group: 'Report', title: 'Monitoring Container - Update' },
    rep3: { doc: 'DRH', sheet: drTab('HCI'), headers: 0, range: 'A1:AN200', mark: ['REALISASI'], ttl: 10 * MIN, group: 'Report', title: 'Salinan DC Daily Report - HCI' },
    rep4: { doc: 'DRA', sheet: drTab('AHI'), headers: 0, range: 'A1:AN200', mark: ['REALISASI'], ttl: 10 * MIN, group: 'Report', title: 'Salinan dari Daily Report DC - AHI & NEKA' },
    rep5: { doc: 'DRN', sheet: 'HCI', headers: 0, range: 'A1:H40', mark: ['TALLO'], ttl: 10 * MIN, group: 'Report', title: 'Daily Report HCI - RDC SDC' },
    rep6: { doc: 'OPI', sheet: (c) => P.weekTab(c.today), headers: 0, range: 'A1:AZ160', mark: ['MAKASSAR'], ttl: 30 * MIN, group: 'Report', title: 'Occupancy & Planning Inbound RDC SDC 2026' },
    rep7: { doc: 'D26', gid: '1213798625', tq: 'select B,G,H', headers: 0, mark: [], ttl: 10 * MIN, group: 'Report', title: 'Salinan dari Daily 2026 TALLO' },
    rep9: { doc: 'DCR', gid: '336408577', tq: (c) => `select count(B) where T = date '${c.day || c.today}'`, headers: 1, mark: [], allowEmpty: true, ttl: 10 * MIN, group: 'Report', title: 'Data Container RDC -SDC' },
  };
  // Laporan #8 (Laporan Daily Update 2026) memakai sumber ldH + ldA.
  const REPORTS = [
    { id: 'rep1', name: 'MONITORING CONTAINER 2026', doc: 'MC' },
    { id: 'rep2', name: 'Monitoring Container - Update', doc: 'MCU' },
    { id: 'rep3', name: 'Salinan DC Daily Report - HCI', doc: 'DRH' },
    { id: 'rep4', name: 'Salinan dari Daily Report DC - AHI & NEKA', doc: 'DRA' },
    { id: 'rep5', name: 'Daily Report HCI - RDC SDC', doc: 'DRN' },
    { id: 'rep6', name: 'Occupancy & Planning Inbound RDC SDC 2026', doc: 'OPI', weekly: true },
    { id: 'rep7', name: 'Salinan dari Daily 2026 TALLO', doc: 'D26' },
    { id: 'rep8', name: 'Laporan Daily Update 2026', doc: 'LD' },
    { id: 'rep9', name: 'Data Container RDC -SDC', doc: 'DCR' }];
  // Settings → Database Spreadsheet
  const LINKS = [
    ['Master', 'IMM', 'Mini Monitoring (master user, LC, plan, LPPBDO)'],
    ['Inbound', 'PLAN26', '2026 Planning Inbound (Unloading Container)'], ['Inbound', 'DIS2', 'Dashboard Inbound Semester 2'], ['Inbound', 'INSCR', 'Inbound (Script)'],
    ['Storing', 'SO', 'Dashboard Storing & Outbound AHI 2026'], ['Storing', 'DP', 'Demand Picking 2026'], ['Storing', 'LAYA', 'Layout AHI lokasi DC Tallo'], ['Storing', 'LAYH', 'Layout lokasi DC Tallo HCI'],
    ['Inventory', 'SCR', 'Dashboard inventory SCR'], ['Inventory', 'INV02', 'Dashboard inventory02'], ['Inventory', 'INV26', 'Dashboard Inventory 2026'],
    ['Planner', 'PL', 'Dashboard Planner'],
    ['LP', 'VIS', 'Logbook Visitor'], ['LP', 'KAR', 'Kontrol Keluar Masuk Karyawan'], ['LP', 'LB', 'Logbook Barang Keluar 2026'], ['LP', 'BM', 'Barang Masuk 2026'], ['LP', 'KDS', 'Rekap Penjualan Kardus'], ['LP', 'OBS', 'Checklist Observasi'], ['LP', 'SEAL', 'Armada Terseal'],
    ['Official Report', 'MC', 'MONITORING CONTAINER 2026'], ['Official Report', 'MCU', 'Monitoring Container - Update'], ['Official Report', 'DRH', 'Salinan DC Daily Report - HCI'], ['Official Report', 'DRA', 'Salinan dari Daily Report DC - AHI & NEKA'],
    ['Official Report', 'DRN', 'Daily Report HCI - RDC SDC'], ['Official Report', 'OPI', 'Occupancy & Planning Inbound RDC SDC 2026'], ['Official Report', 'D26', 'Salinan dari Daily 2026 TALLO'], ['Official Report', 'LD', 'Laporan Daily Update 2026'], ['Official Report', 'DCR', 'Data Container RDC -SDC']];
  const docUrl = (k) => `https://docs.google.com/spreadsheets/d/${DOCS[k] || k}/edit`;

  // ---------- pemuat ----------
  let fetchFn = (typeof fetch === 'function') ? fetch.bind(typeof self !== 'undefined' ? self : globalThis) : null;
  let store = null; // { get(k), set(k,v) } — localStorage di aplikasi
  const mem = new Map(), inflight = new Map();
  let active = 0; const waiting = [];
  const MAX = 4;
  let seq = 0;
  function setFetch(f) { fetchFn = f; }
  function setStore(s) { store = s; }
  function clear() { mem.clear(); inflight.clear(); }
  const val = (x, ctx) => (typeof x === 'function' ? x(ctx) : x);
  function spec(key, ctx) {
    const s = REG[key]; if (!s) throw new Error('Sumber tidak dikenal: ' + key);
    return { key, doc: DOCS[s.doc] || s.doc, sheet: val(s.sheet, ctx), gid: s.gid, tq: val(s.tq, ctx), range: s.range, headers: s.headers == null ? 1 : s.headers, need: s.need || [], mark: s.mark || [], allowEmpty: !!s.allowEmpty, ttl: s.ttl || 30 * MIN, title: s.title };
  }
  function url(key, ctx) {
    const s = spec(key, ctx);
    const q = [`r=${Date.now().toString(36)}${(seq++).toString(36)}`, 'tqx=out:csv', `headers=${s.headers}`];
    q.push(s.gid ? 'gid=' + s.gid : 'sheet=' + encodeURIComponent(s.sheet));
    if (s.range) q.push('range=' + s.range);
    if (s.tq) q.push('tq=' + encodeURIComponent(s.tq));
    return `https://docs.google.com/spreadsheets/d/${s.doc}/gviz/tq?${q.join('&')}`;
  }
  function cacheKey(key, ctx) { const s = spec(key, ctx); return `imm.src.${key}.${s.sheet || s.gid || ''}.${s.tq || ''}`.slice(0, 220); }
  function check(s, rows) {
    if (!rows.length) { if (s.allowEmpty || (!s.need.length && !s.mark.length)) return null; return 'EMPTY'; }
    if (s.need.length && !P.hasHeaders(rows[0], s.need)) return 'WRONGTAB';
    if (s.mark.length) {
      const text = rows.slice(0, 60).map((r) => r.join(' ')).join(' ').toUpperCase();
      if (!s.mark.every((m) => text.indexOf(String(m).toUpperCase()) >= 0)) return 'WRONGTAB';
    }
    return null;
  }
  function slot() { return new Promise((res) => { if (active < MAX) { active++; res(); } else waiting.push(res); }); }
  function release() { const n = waiting.shift(); if (n) n(); else active--; }
  class SrcError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
  async function fetchRows(key, ctx) {
    const s = spec(key, ctx);
    if (!fetchFn) throw new SrcError('NETWORK', 'Tidak ada koneksi');
    await slot();
    let res, txt;
    try {
      try { res = await fetchFn(url(key, ctx), { cache: 'no-store' }); } catch (e) { throw new SrcError('NETWORK', 'Tidak bisa terhubung ke Google Sheets. Cek koneksi internet.'); }
      if (!res.ok) throw new SrcError('HTTP', `${s.title}: gagal dibaca (HTTP ${res.status}).`);
      txt = await res.text();
    } finally { release(); }
    if (/^\s*</.test(txt)) throw new SrcError('PRIVATE', `${s.title}: spreadsheet tidak bisa dibaca. Pastikan dibagikan "Siapa saja yang memiliki link".`);
    if (/google\.visualization\.Query\.setResponse/.test(txt) && /"status":"error"/.test(txt)) throw new SrcError('QUERY', `${s.title}: query ditolak Google Sheets.`);
    const rows = P.parseCSV(txt).filter((r) => r.some((c) => String(c).trim() !== ''));
    const bad = check(s, rows);
    if (bad === 'WRONGTAB') throw new SrcError('WRONGTAB', `${s.title}: tab "${s.sheet || s.gid}" tidak ditemukan atau susunannya berubah.`);
    if (bad === 'EMPTY') throw new SrcError('EMPTY', `${s.title}: belum ada data.`);
    return rows;
  }
  // load: ambil dari memori bila masih segar, lalu dari jaringan; bila jaringan gagal pakai cache lama (stale: true).
  async function load(key, ctx, opt) {
    opt = opt || {};
    const s = spec(key, ctx), ck = cacheKey(key, ctx), now = Date.now();
    const hit = mem.get(ck) || (store && store.get(ck));
    if (hit && !opt.force && now - hit.at < s.ttl) { mem.set(ck, hit); return { rows: hit.rows, at: hit.at, from: 'cache' }; }
    if (inflight.has(ck)) return inflight.get(ck);
    const p = (async () => {
      try {
        const rows = await fetchRows(key, ctx);
        const v = { at: Date.now(), rows };
        mem.set(ck, v);
        if (store && REG[key].keepRaw !== false) { try { const j = JSON.stringify(v); if (j.length < 300000) store.set(ck, v); } catch (e) { /* penuh */ } }
        return { rows, at: v.at, from: 'net' };
      } catch (e) {
        if (hit && e.code !== 'WRONGTAB') return { rows: hit.rows, at: hit.at, from: 'cache', stale: true, error: e };
        throw e;
      } finally { inflight.delete(ck); }
    })();
    inflight.set(ck, p);
    return p;
  }
  // Tampilkan cache dulu (bila ada) tanpa menunggu jaringan.
  function peek(key, ctx) { const ck = cacheKey(key, ctx); return mem.get(ck) || (store && store.get(ck)) || null; }
  async function loadMany(keys, ctx, opt) {
    const out = {};
    await Promise.all(keys.map(async (k) => { try { out[k] = await load(k, ctx, opt); } catch (e) { out[k] = { error: e, rows: null }; } }));
    return out;
  }

  return { DOCS, REG, REPORTS, LINKS, DP_TAB, docUrl, spec, url, load, loadMany, peek, setFetch, setStore, clear, SrcError, check };
});
