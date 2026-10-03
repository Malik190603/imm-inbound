// Pembantu murni untuk lapisan tampilan (tanpa DOM): dipakai aplikasi (window.IMMUi) dan diuji dengan node --test.
(function (root, factory) { const m = factory(); if (typeof module === 'object' && module.exports) module.exports = m; else root.IMMUi = m; })(typeof self !== 'undefined' ? self : this, function () {
  // ---------- kontras WCAG ----------
  function rgb(hex) {
    let h = String(hex || '').trim().replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  }
  const lum = (hex) => { const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

  // ---------- strip minggu: kemarin … 5 hari ke depan ----------
  function addDays(iso, n) { const [y, m, d] = iso.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10); }
  const weekDays = (today) => Array.from({ length: 7 }, (_, i) => addDays(today, i - 1));

  // ---------- baris bernilai nol dipisahkan supaya bisa diringkas ----------
  function splitZeros(items, value) { const shown = [], zeros = []; for (const x of items) ((Number(value(x)) || 0) > 0 ? shown : zeros).push(x); return { shown, zeros }; }

  // ---------- pembanding: nilai sekarang terhadap patokan ----------
  function deltaInfo(cur, base) {
    if (!Number.isFinite(cur) || !Number.isFinite(base) || base <= 0) return null;
    const p = (cur - base) / base * 100, pct = Math.round(Math.abs(p));
    return { dir: pct < 1 ? 'same' : p > 0 ? 'up' : 'down', pct };
  }

  // ---------- kamus istilah ----------
  const GLOSSARY = {
    cbm: { t: 'CBM', d: 'Meter kubik: ukuran volume barang. Satu CBM kira-kira sebesar kotak 1 × 1 × 1 meter.' },
    teus: { t: 'TEUs', d: 'Satuan hitung kontainer. Kontainer 20 kaki dihitung 1 TEU, kontainer 40 kaki dihitung 2 TEUs.' },
    lc: { t: 'LC', d: 'Nomor muatan satu kontainer (No LC). Semua barang dalam satu kontainer memakai No LC yang sama.' },
    lpn: { t: 'LPN', d: 'Nomor palet atau wadah barang di gudang. Awalan ID berarti barang bagus, awalan RC berarti barang rusak.' },
    dept: { t: 'Dept', d: 'Kelompok barang (Sku Group), misalnya R110BG. Dipakai untuk mengatur lokasi simpan.' },
    bu: { t: 'BU', d: 'Business unit pemilik barang: HCI, AHI, FBI, TGI, atau KWI.' },
    yard: { t: 'Yard', d: 'Kontainer sudah tiba di pelabuhan Makassar dan menunggu diantar ke DC.' },
    dooring: { t: 'Dooring', d: 'Kontainer sedang diantar dari pelabuhan ke DC untuk dibongkar.' },
    leadtime: { t: 'Lead time', d: 'Lama perjalanan kontainer, dihitung dari checkout di gudang asal sampai dibongkar di DC.' },
    p90: { t: '9 dari 10', d: 'Batas waktu yang dipenuhi sembilan dari sepuluh kontainer. Lebih jujur daripada rata-rata karena tidak tertarik satu kontainer yang sangat lama.' },
    campur: { t: 'Campur Dept', d: 'Satu LPN berisi barang dari lebih dari satu Dept. Perlu dicek karena lokasi simpannya bisa berbeda.' },
    lppbdo: { t: 'LPPBDO', d: 'Laporan selisih barang datang: barang yang jumlah atau kondisinya tidak sesuai dokumen kiriman.' },
    tto: { t: 'TTO', d: 'Tanda terima serah terima dokumen atau barang antara tim inbound dan penerima.' },
  };

  return { contrast, weekDays, splitZeros, deltaInfo, GLOSSARY, addDays };
});
