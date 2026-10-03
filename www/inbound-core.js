// Logika murni menu Inbound (tanpa DOM): dipakai aplikasi (window.IMMCore) dan diuji dengan node --test.
(function (root, factory) { const m = factory(); if (typeof module === 'object' && module.exports) module.exports = m; else root.IMMCore = m; })(typeof self !== 'undefined' ? self : this, function () {
  const OPERATORS = [
    { id: '129057', name: 'Armin Rahman' }, { id: '148453', name: 'Akmal' }, { id: '187606', name: 'Muh Putra Abidzar' },
    { id: '188400', name: 'Muh Aditya Putra' }, { id: '192831', name: 'M Fikri Firmansyah' }];
  const PICS = ['Aan', 'Ramadhan', 'Malik', 'Armin', 'Akmal', 'Abi', 'Adit', 'Fikri'];
  const HCI = 'PT Home Center Indonesia (HCI)', AHI = 'PT Aspirasi Hidup Indonesia (AHI)';
  const MPP = [
    { name: 'Sumarni', title: 'Assistant Manager', bu: HCI }, { name: 'Aan Kurniawan', title: 'Inbound Supervisor', bu: HCI },
    { name: 'Ramadhan', title: 'Inbound Coordinator Staff', bu: HCI }, { name: 'M. Malik', title: 'Inbound Staff', bu: AHI },
    { name: 'Armin Rahman', title: 'Warehouseman', bu: HCI }, { name: 'Akmal', title: 'Warehouseman', bu: HCI },
    { name: 'Muh Putra Abidzar', title: 'Warehouseman', bu: HCI }, { name: 'Muh Aditya Putra', title: 'Warehouseman', bu: HCI },
    { name: 'M Fikri Firmansyah', title: 'Warehouseman', bu: AHI }];
  const STOCK_HEADERS = ['Storerkey', 'Trantype', 'SKU', 'Description', 'Sku Group', 'Toloc', 'Toid', 'Qty', 'Source type', 'CM3', 'Tanggal (WITA)', 'Date', 'Kategori', 'Hitung Produktivitas?', 'Id Operator', 'Username Operator', 'CM3 (Final)'];
  const TRANSIT_HEADERS = ['Owner', 'CBM Received', 'Received By', 'Date', 'Hitung Transit?'];

  const str = (v) => String(v == null ? '' : v).trim();
  const up = (v) => str(v).toUpperCase();
  const num = (v) => parseFloat(str(v).replace(/,/g, '')) || 0;
  const r6 = (n) => Math.round(n * 1e6) / 1e6;
  const yes = (v) => up(v) === 'YA';

  function toObjects(rows) {
    const headers = (rows[0] || []).map(str);
    return { headers, rows: rows.slice(1).map((r) => { const o = {}; headers.forEach((h, i) => { o[h] = str(r[i]); }); return o; }) };
  }
  const missingHeaders = (headers, needed) => needed.filter((h) => headers.indexOf(h) < 0);

  // ---------- Sheet kontainer (RDC) ----------
  // Susunan kolom sheet ini bisa berubah, jadi kolom dicari lewat judulnya. Urutan di bawah = urutan kolom yang dibaca aplikasi.
  // [nama untuk pesan, cara mencocokkan judul (sudah huruf besar, spasi dirapikan), kemunculan ke-berapa]
  const RDC_COLS = [
    ['BU (asal)', (h) => h === 'BU', 1], ['SI', (h) => h === 'SI', 1], ['Type Armada', (h) => h === 'TYPE ARMADA', 1], ['Delivery Date', (h) => h === 'DELIVERY DATE', 1],
    ['Checkout', (h) => h === 'CHECKOUT', 1], ['No Container', (h) => h === 'NO CONTAINER', 1], ['Nama Kapal', (h) => h === 'NAMA KAPAL', 1], ['POO', (h) => h === 'POO', 1],
    ['ETD', (h) => h === 'ETD', 1], ['ATD', (h) => h === 'ATD', 1], ['ETA', (h) => h === 'ETA', 1], ['ATA', (h) => h.indexOf('ATA') === 0, 1],
    ['REQUEST DOORING', (h) => h.indexOf('REQUEST DOORING') === 0, 1], ['ACTUAL DOORING', (h) => h.indexOf('ACTUAL DOORING') === 0, 1], ['TANGGAL BONGKAR', (h) => h === 'TANGGAL BONGKAR', 1],
    ['Position', (h) => h.indexOf('POSITION') === 0, 1], ['Status Shipment', (h) => h === 'STATUS SHIPMENT', 1], ['BU (kode)', (h) => h === 'BU', 2],
    ['AGING YARD', (h) => h === 'AGING YARD', 1], ['KATEGORI AGING YARD', (h) => h === 'KATEGORI AGING YARD', 1], ['TEUs', (h) => h === 'TEUS', 1],
    ['Aging POO', (h) => h.indexOf('AGING POO') === 0, 1], ['Aging OTW', (h) => h.indexOf('AGING OTW') === 0, 1], ['AGING POD', (h) => h.indexOf('AGING POD') === 0, 1], ['LEAD TIME', (h) => h.indexOf('LEAD TIME') === 0, 1]];
  const RDC_FILTER = ['BU NAME', (h) => h === 'BU NAME', 1];
  function rdcQuery(headers) {
    const H = (headers || []).map((h) => up(h).replace(/\s+/g, ' '));
    const find = (c) => { let n = 0; for (let i = 0; i < H.length; i++) if (c[1](H[i]) && ++n === c[2]) return i; return -1; };
    const idx = RDC_COLS.map(find), f = find(RDC_FILTER);
    const miss = (f < 0 ? [RDC_FILTER[0]] : []).concat(RDC_COLS.filter((c, i) => idx[i] < 0).map((c) => c[0]));
    if (miss.length) throw new Error('Kolom ' + miss.join(', ') + ' tidak ditemukan di sheet kontainer.');
    return 'select ' + idx.map(columnLetter).join(',') + " where " + columnLetter(f) + " contains 'Makassar'";
  }

  // "M/D/YYYY" → "YYYY-MM-DD"; apa pun selain itu → ''
  function usDate(s) {
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str(s)); if (!m) return '';
    const mo = +m[1], d = +m[2]; if (mo < 1 || mo > 12 || d < 1 || d > 31) return '';
    return m[3] + '-' + String(mo).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }
  // "10/01/2026 1:05 PM" → "13:05"
  function clock(s) {
    const m = /(\d{1,2}):(\d{2})(?::\d{2})?\s*([AP]M)?/i.exec(str(s)); if (!m) return '';
    let h = +m[1]; const ap = (m[3] || '').toUpperCase(); if (ap === 'PM' && h < 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
    return String(h).padStart(2, '0') + ':' + m[2];
  }
  function lpnKind(id) { const p = up(id).slice(0, 2); return p === 'ID' ? 'good' : p === 'RC' ? 'damage' : 'other'; }
  const operatorOf = (v) => { const s = str(v); return OPERATORS.find((o) => s.indexOf(o.id) === 0) || null; };
  const inRange = (d, o) => d && d >= o.from && d <= o.to;
  // o.bu: 'ALL', satu kode BU, atau daftar kode BU
  const buOk = (v, o) => !o.bu || o.bu === 'ALL' || (Array.isArray(o.bu) ? o.bu.map(up).indexOf(up(v)) >= 0 : up(v) === up(o.bu));
  // indeks kolom (0 = A) → huruf kolom spreadsheet
  function columnLetter(i) { let s = ''; i += 1; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = (i - m - 1) / 26; } return s; }

  function putawayLpns(rows, o) {
    const map = new Map();
    for (const r of rows) {
      if (up(r['Trantype']) !== 'MOVE' || up(r['Source type']) !== 'NSPRFPA02') continue;
      const toloc = up(r['Toloc']); if (toloc.indexOf('FLR') !== 0) continue;
      const lpn = up(r['Toid']); if (!lpn) continue;
      const date = usDate(r['Date']); if (!inRange(date, o) || !buOk(r['Storerkey'], o)) continue;
      let g = map.get(lpn);
      if (!g) { g = { lpn, kind: lpnKind(lpn), tolocs: [], depts: [], mixed: false, skus: 0, qty: 0, cbm: 0, date: '', time: '', operator: '', bu: up(r['Storerkey']), items: [] }; map.set(lpn, g); }
      const dept = str(r['Sku Group']) || '-', qty = num(r['Qty']), time = clock(r['Tanggal (WITA)']);
      if (g.tolocs.indexOf(toloc) < 0) g.tolocs.push(toloc);
      if (g.depts.indexOf(dept) < 0) g.depts.push(dept);
      g.qty += qty; g.cbm = r6(g.cbm + num(r['CM3']) / 1e6);
      if (date + time >= g.date + g.time) { g.date = date; g.time = time; const op = operatorOf(r['Id Operator']); g.operator = op ? op.name : str(r['Username Operator']); }
      g.items.push({ sku: str(r['SKU']), desc: str(r['Description']), dept, qty, toloc });
    }
    const out = Array.from(map.values()); out.forEach((g) => { g.mixed = g.depts.length > 1; g.skus = new Set(g.items.map((i) => i.sku)).size; });
    return out.sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time) || a.lpn.localeCompare(b.lpn));
  }

  function productivity(stockRows, transitRows, o) {
    const ops = OPERATORS.map((x) => ({ id: x.id, name: x.name, rcv: 0, put: 0, rcvStock: 0, rcvTransit: 0, putStock: 0, putTransit: 0 }));
    const byId = {}; ops.forEach((x) => { byId[x.id] = x; });
    const days = new Map();
    const add = (id, date, k, v) => { const x = byId[id]; x[k] = r6(x[k] + v); let d = days.get(date); if (!d) { d = { d: date, rcv: 0, put: 0 }; days.set(date, d); } const t = k.indexOf('rcv') === 0 ? 'rcv' : 'put'; d[t] = r6(d[t] + v); };
    for (const r of stockRows) {
      if (!yes(r['Hitung Produktivitas?'])) continue;
      const op = operatorOf(r['Id Operator']); if (!op) continue;
      const date = usDate(r['Date']); if (!inRange(date, o) || !buOk(r['Storerkey'], o)) continue;
      const kat = up(r['Kategori']);
      if (kat === 'RECEIVING' || kat === 'RECEIVE') add(op.id, date, 'rcvStock', num(r['CM3']) / 1e6);
      else if (kat === 'PUTAWAY') add(op.id, date, 'putStock', num(r['CM3 (Final)']) / 1e6);
    }
    for (const r of transitRows) {
      if (!yes(r['Hitung Transit?'])) continue;
      const op = operatorOf(r['Received By']); if (!op) continue;
      const date = usDate(r['Date']); if (!inRange(date, o) || !buOk(r['Owner'], o)) continue;
      const v = num(r['CBM Received']); add(op.id, date, 'rcvTransit', v); add(op.id, date, 'putTransit', v);
    }
    ops.forEach((x) => { x.rcv = r6(x.rcvStock + x.rcvTransit); x.put = r6(x.putStock + x.putTransit); });
    const team = { rcv: r6(ops.reduce((t, x) => t + x.rcv, 0)), put: r6(ops.reduce((t, x) => t + x.put, 0)) };
    ops.sort((a, b) => (b.rcv + b.put) - (a.rcv + a.put));
    return { team, ops, days: Array.from(days.values()).sort((a, b) => a.d.localeCompare(b.d)) };
  }

  // Sandi tidak disimpan sebagai teks: hanya sha256(garam + sandi).
  const PW_SALT = 'imm-tallo:';
  const PW_HASH = 'fe2ed619a490e2f5c0c0e5b569064c4d20ee9be7f7e73fbeade5c64f15fc15bf';
  const UNLOCK_MS = 2 * 3600e3;
  async function sha256Hex(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  const hashPassword = (pw) => sha256Hex(PW_SALT + pw);
  async function checkPassword(pw, hash) { return !!pw && (await hashPassword(pw)) === (hash || PW_HASH); }
  function unlockValid(ts, now) { ts = Number(ts) || 0; return ts > 0 && now >= ts && now - ts < UNLOCK_MS; }

  function stampText(d) {
    const p = {}; new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Makassar', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).forEach((x) => { p[x.type] = x.value; });
    return p.day + '/' + p.month + '/' + p.year + ' ' + (p.hour === '24' ? '00' : p.hour) + ':' + p.minute + ' WITA';
  }

  return { OPERATORS, PICS, MPP, STOCK_HEADERS, TRANSIT_HEADERS, toObjects, missingHeaders, columnLetter, rdcQuery, usDate, lpnKind, putawayLpns, productivity, PW_SALT, PW_HASH, hashPassword, checkPassword, unlockValid, stampText };
});
