// Pengurai toleran untuk data Google Sheets (tanpa DOM): window.IMMParse di aplikasi, module.exports di Node.
// Tanggal selalu dikembalikan sebagai teks ISO 'yyyy-mm-dd' (zona WITA tidak ikut campur).
(function (root, factory) { const m = factory(); if (typeof module === 'object' && module.exports) module.exports = m; else root.IMMParse = m; })(typeof self !== 'undefined' ? self : this, function () {
  const str = (v) => String(v == null ? '' : v).replace(/ /g, ' ').trim();
  const ERR = /^#(N\/A|DIV\/0!|VALUE!|REF!|NAME\?|NUM!|NULL!|ERROR!)/i;
  const norm = (s) => str(s).toUpperCase().replace(/\s+/g, ' ');

  // ---------- angka ----------
  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : null;
    let s = str(v);
    if (!s || ERR.test(s)) return null;
    if (/^[-–—]$/.test(s)) return 0;
    let neg = false;
    if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
    s = s.replace(/^rp\.?\s*/i, '').replace(/\s*(%|kg|cbm|m3|teus?|pcs|qty)$/i, '').replace(/\s/g, '');
    if (/^-/.test(s)) { neg = !neg; s = s.slice(1); }
    s = s.replace(/^rp\.?/i, '');
    if (!/^[\d.,]+$/.test(s) || !/\d/.test(s)) return null;
    const dots = (s.match(/\./g) || []).length, commas = (s.match(/,/g) || []).length;
    if (dots && commas) {
      const dec = s.lastIndexOf('.') > s.lastIndexOf(',') ? '.' : ',';
      s = dec === '.' ? s.replace(/,/g, '') : s.replace(/\./g, '').replace(',', '.');
    } else if (dots > 1) s = s.replace(/\./g, '');
    else if (commas > 1) s = s.replace(/,/g, '');
    else if (commas === 1) s = /^\d{1,3},\d{3}$/.test(s) ? s.replace(',', '') : s.replace(',', '.');
    else if (dots === 1 && /^\d{1,3}\.\d{3}$/.test(s) && !/^0\./.test(s)) s = s.replace('.', '');
    const n = parseFloat(s);
    if (!isFinite(n)) return null;
    return neg ? -n : n;
  }
  function pct(v, asFraction) {
    const n = num(v);
    if (n == null) return null;
    if (asFraction && !/%/.test(str(v)) && Math.abs(n) <= 1) return Math.round(n * 10000) / 100;
    return n;
  }

  // ---------- tanggal ----------
  const MON = { JAN: 1, JANUARI: 1, JANUARY: 1, FEB: 2, FEBRUARI: 2, FEBRUARY: 2, MAR: 3, MARET: 3, MARCH: 3, APR: 4, APRIL: 4,
    MAY: 5, MEI: 5, JUN: 6, JUNI: 6, JUNE: 6, JUL: 7, JULI: 7, JULY: 7, AUG: 8, AGU: 8, AGT: 8, AGS: 8, AGUSTUS: 8, AUGUST: 8, AUGT: 8,
    SEP: 9, SEPT: 9, SEPTEMBER: 9, OCT: 10, OKT: 10, OKTOBER: 10, OCTOBER: 10, NOV: 11, NOP: 11, NOVEMBER: 11, DEC: 12, DES: 12, DESEMBER: 12, DECEMBER: 12 };
  const MON_ID3 = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const pad = (n) => String(n).padStart(2, '0');
  function mk(y, m, d) {
    y = +y; m = +m; d = +d;
    if (y < 100) y += 2000;
    if (!(y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
    const t = new Date(Date.UTC(y, m - 1, d));
    if (t.getUTCMonth() !== m - 1) return null;
    return `${y}-${pad(m)}-${pad(d)}`;
  }
  function serial(n) {
    if (!(n > 30000 && n < 80000)) return null;
    const t = new Date(Date.UTC(1899, 11, 30) + Math.floor(n) * 86400000);
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  }
  // ctx: { year: tahun untuk tanggal tanpa tahun, dmy: true bila a/b/yyyy berarti hari/bulan }
  function date(v, ctx) {
    ctx = ctx || {};
    if (typeof v === 'number') return serial(v);
    const s = str(v);
    if (!s || ERR.test(s)) return null;
    let m;
    if ((m = s.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})/))) return mk(m[1], +m[2] + 1, m[3]);
    if (/^\d{5}(\.\d+)?$/.test(s)) return serial(+s);
    if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return mk(m[1], m[2], m[3]);
    if ((m = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\b/))) return ctx.dmy || +m[1] > 12 ? mk(m[3], m[2], m[1]) : mk(m[3], m[1], m[2]);
    const t = s.toUpperCase().replace(/^[A-Z]+,\s*/, '').replace(/[-,]/g, ' ').replace(/\s+/g, ' ').trim();
    if ((m = t.match(/^(\d{1,2}) ([A-Z]+)(?: (\d{2,4}))?\b/)) && MON[m[2]]) {
      const y = m[3] || ctx.year;
      return y ? mk(y, MON[m[2]], m[1]) : null;
    }
    if ((m = t.match(/^([A-Z]+) (\d{1,2})(?: (\d{4}))?$/)) && MON[m[1]]) {
      const y = m[3] || ctx.year;
      return y ? mk(y, MON[m[1]], m[2]) : null;
    }
    return null;
  }
  const HARI = /^(SENIN|SELASA|RABU|KAMIS|JUMAT|JUM'AT|SABTU|MINGGU)[,\s]+/i;
  function sepDate(v) {
    const s = str(v);
    if (!HARI.test(s)) return null;
    const m = s.replace(HARI, '').match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    return m ? mk(m[3], m[2], m[1]) : null;
  }
  function codeDate(v) {
    const m = str(v).match(/^(\d{2})(\d{2})(\d{2})[A-Z]/i);
    return m ? mk('20' + m[1], m[2], m[3]) : null;
  }
  const toUTC = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  const fromUTC = (t) => { const d = new Date(t); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
  const addDays = (iso, n) => fromUTC(toUTC(iso) + n * 86400000);
  const diffDays = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 86400000);
  const witaDay = (d) => fromUTC((d || new Date()).getTime() + 8 * 3600000);
  function isoWeek(iso) {
    const t = new Date(toUTC(iso));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = Date.UTC(t.getUTCFullYear(), 0, 1);
    return Math.ceil(((t - y0) / 86400000 + 1) / 7);
  }
  const weekTab = (iso) => 'W' + isoWeek(iso);
  function monthTab(prefix, iso, opt) {
    const [y, m] = iso.split('-').map(Number);
    return `${prefix} ${MON_ID3[m - 1]}${opt && opt.year === false ? '' : ' ' + y}`;
  }

  // ---------- header & baris ----------
  function col(headers, ...names) {
    const H = (headers || []).map(norm);
    for (const n of names) { const i = H.indexOf(norm(n)); if (i >= 0) return i; }
    return -1;
  }
  const hasHeaders = (headers, need) => (need || []).every((n) => col(headers, ...[].concat(n)) >= 0);
  function fillSep(rows, dateCol) {
    const out = []; let cur = null;
    for (const r of rows || []) {
      const d = sepDate(r[dateCol]);
      if (d) { cur = d; continue; }
      if (cur && r.some((c) => str(c))) out.push({ date: cur, row: r });
    }
    return out;
  }
  function matrixDay(rows, o) {
    const ctx = { year: o.year || 2026 };
    const hdr = rows[o.dateRow] || [];
    const dates = [], idx = {};
    for (let c = o.firstDateCol; c < hdr.length; c++) { const d = date(hdr[c], ctx); if (d) { dates.push(d); idx[d] = c; } }
    const rowOf = (label) => rows.find((r, i) => i !== o.dateRow && norm(r[o.labelCol]) === norm(label));
    return {
      dates,
      get(label, d) { const r = rowOf(label); if (!r || idx[d] == null) return null; return str(r[idx[d]]); },
      cell(label, c) { const r = rowOf(label); return r ? str(r[c]) : null; },
      last(label, upTo) {
        const r = rowOf(label); if (!r) return null;
        for (let i = dates.length - 1; i >= 0; i--) { if (upTo && dates[i] > upTo) continue; if (str(r[idx[dates[i]]])) return dates[i]; }
        return null;
      },
    };
  }
  function stripPrivate(headers, rows, priv) {
    const P = (priv || []).map(norm);
    const keep = headers.map((h, i) => (P.indexOf(norm(h)) < 0 ? i : -1)).filter((i) => i >= 0);
    return { headers: keep.map((i) => headers[i]), rows: rows.map((r) => keep.map((i) => (r[i] == null ? '' : r[i]))) };
  }
  function parseCSV(text) {
    const out = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); out.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); out.push(row); }
    return out;
  }

  return { str, norm, num, pct, date, sepDate, codeDate, isoWeek, weekTab, monthTab, MON_ID3, col, hasHeaders, fillSep, matrixDay, stripPrivate, parseCSV, witaDay, addDays, diffDays };
});
