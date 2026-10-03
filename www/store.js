// Penyimpanan bersama di Supabase (foto + data TTO) dan penyiapan foto (perkecil + cap waktu).
// Dipakai aplikasi (window.IMMStore) dan diuji dengan node --test.
(function (root, factory) { const m = factory(root); if (typeof module === 'object' && module.exports) module.exports = m; else root.IMMStore = m; })(typeof self !== 'undefined' ? self : this, function (root) {
  // Project URL + anon public key Supabase. Aman ada di aplikasi (memang kunci publik); JANGAN isi service_role.
  const SUPA = Object.assign({ url: 'https://rmvttktlzkecvooqvkpp.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtdnR0a3RsemtlY3Zvb3F2a3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwNDMyMzQsImV4cCI6MjEwNjYxOTIzNH0.4zy-du0WwTE348d-CBDOQH5zi24cDG80oGCc9COmoFI' }, (root && root.IMM_SUPA) || {});
  const BUCKET = 'imm-photos', MAX_PHOTOS = 4, CHUNK = 80;
  // Di Android, fetch bawaan WebView dipakai (bukan CapacitorHttp) supaya isi foto terkirim apa adanya; Supabase mengizinkan CORS.
  let fetchImpl = null;
  const doFetch = (u, o) => (fetchImpl || (root && root.CapacitorWebFetch) || fetch)(u, o);
  const configured = () => !!(SUPA.url && SUPA.key);
  const need = () => { if (!configured()) throw new Error('NOCONFIG'); };
  const headers = (extra) => Object.assign({ apikey: SUPA.key, Authorization: 'Bearer ' + SUPA.key }, extra || {});
  const safe = (s) => String(s || '').trim().replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 60) || 'x';
  const rand = () => Math.random().toString(36).slice(2, 8);
  const photoUrl = (path) => SUPA.url + '/storage/v1/object/public/' + BUCKET + '/' + path;

  async function call(url, o) {
    let r; try { r = await doFetch(url, o); } catch (e) { throw new Error('NETWORK'); }
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r;
  }
  const rest = (path, o) => call(SUPA.url + '/rest/v1/' + path, o);
  const upload = (path, blob) => call(SUPA.url + '/storage/v1/object/' + BUCKET + '/' + path, { method: 'POST', headers: headers({ 'Content-Type': 'image/jpeg', 'x-upsert': 'false' }), body: blob });
  const removeObject = (path) => call(SUPA.url + '/storage/v1/object/' + BUCKET + '/' + path, { method: 'DELETE', headers: headers() });
  async function insert(table, row) {
    const r = await rest(table, { method: 'POST', headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=representation' }), body: JSON.stringify(row) });
    const j = await r.json(); return Array.isArray(j) ? j[0] : j;
  }

  // ---------- foto putaway ----------
  async function listPutawayPhotos(lpns) {
    need(); const ids = Array.from(new Set((lpns || []).filter(Boolean))); const out = [];
    for (let i = 0; i < ids.length; i += CHUNK) {
      const inList = ids.slice(i, i + CHUNK).map((x) => '"' + String(x).replace(/"/g, '') + '"').join(',');
      const r = await rest('putaway_photos?select=id,lpn,toloc,path,created_at&lpn=in.(' + encodeURIComponent(inList) + ')&order=created_at.asc', { headers: headers() });
      out.push(...(await r.json()));
    }
    return out;
  }
  async function addPutawayPhoto(lpn, toloc, blob, device) {
    need();
    const have = await (await rest('putaway_photos?select=id&lpn=eq.' + encodeURIComponent(lpn), { headers: headers() })).json();
    if (have.length >= MAX_PHOTOS) throw new Error('MAX');
    const path = 'putaway/' + safe(lpn) + '/' + Date.now() + '-' + rand() + '.jpg';
    await upload(path, blob);
    try { return await insert('putaway_photos', { lpn, toloc: toloc || '', path, device: device || '' }); }
    catch (e) {
      try { await removeObject(path); } catch (_) { /* objek yatim dibiarkan */ }
      // Server menolak foto ke-5 (trigger di schema.sql): HP lain mengisi LPN ini saat foto sedang diunggah.
      let n = -1; try { n = (await (await rest('putaway_photos?select=id&lpn=eq.' + encodeURIComponent(lpn), { headers: headers() })).json()).length; } catch (_) { /* pakai galat asli */ }
      if (n >= MAX_PHOTOS) throw new Error('MAX');
      throw e;
    }
  }
  async function removePutawayPhoto(row) {
    need(); await rest('putaway_photos?id=eq.' + encodeURIComponent(row.id), { method: 'DELETE', headers: headers() });
    try { await removeObject(row.path); } catch (_) { /* baris sudah terhapus; objek yatim tidak tampil di aplikasi */ }
  }

  // ---------- TTO / dokumen ----------
  function validTto(e) {
    const t = (v) => String(v == null ? '' : v).trim(); const koli = Number(e && e.koli);
    return !!e && /^\d{4}-\d{2}-\d{2}$/.test(t(e.tgl)) && !!t(e.no_tto) && !!t(e.barang) && !!t(e.pic) && !!t(e.penerima) && Number.isInteger(koli) && koli >= 1;
  }
  async function listTto(o) {
    need(); const f = o && o.from, t = o && o.to;
    const q = 'tto?select=*' + (f && f > '1000' ? '&tgl=gte.' + f : '') + (t && t < '9000' ? '&tgl=lte.' + t : '') + '&order=tgl.desc,created_at.desc';
    return (await rest(q, { headers: headers() })).json();
  }
  async function addTto(entry, blobs, device) {
    need(); blobs = blobs || [];
    if (!validTto(entry)) throw new Error('INVALID');
    if (blobs.length > MAX_PHOTOS) throw new Error('MAX');
    const t = (v) => String(v).trim(); const dir = 'tto/' + safe(entry.no_tto) + '/' + Date.now() + '-'; const paths = [];
    const undo = async () => { for (const p of paths) { try { await removeObject(p); } catch (_) { /* objek yatim dibiarkan */ } } };
    try {
      for (let i = 0; i < blobs.length; i++) { const p = dir + i + '-' + rand() + '.jpg'; await upload(p, blobs[i]); paths.push(p); }
      return await insert('tto', { tgl: t(entry.tgl), no_tto: t(entry.no_tto), barang: t(entry.barang), koli: Number(entry.koli), pic: t(entry.pic), penerima: t(entry.penerima), photos: paths, device: device || '' });
    } catch (e) { await undo(); throw e; }
  }
  async function removeTto(row) {
    need(); await rest('tto?id=eq.' + encodeURIComponent(row.id), { method: 'DELETE', headers: headers() });
    for (const p of row.photos || []) { try { await removeObject(p); } catch (_) { /* baris sudah terhapus */ } }
  }

  // ---------- penyiapan foto (hanya di browser) ----------
  async function preparePhoto(file, lines) {
    const MAXS = 1280;
    let src; try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
    catch (e) { src = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('BADIMAGE')); im.src = URL.createObjectURL(file); }); }
    const sw = src.width, sh = src.height; if (!sw || !sh) throw new Error('BADIMAGE');
    const k = Math.min(1, MAXS / Math.max(sw, sh)); const w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
    g.drawImage(src, 0, 0, w, h);
    if (src.close) src.close(); else if (src.src) { try { URL.revokeObjectURL(src.src); } catch (_) { /* abaikan */ } } // lepas memori foto asli (bisa belasan MB)
    const txt = (lines || []).filter(Boolean); 
    if (txt.length) {
      const fs = Math.max(13, Math.round(Math.min(w, h) * 0.04)), pad = Math.round(fs * 0.6), lh = Math.round(fs * 1.3), sH = pad * 2 + lh * txt.length;
      g.fillStyle = 'rgba(8,12,16,.72)'; g.fillRect(0, h - sH, w, sH);
      g.fillStyle = '#fff'; g.textBaseline = 'top'; g.font = '700 ' + fs + 'px system-ui,-apple-system,Roboto,sans-serif';
      txt.forEach((t, i) => { g.font = (i === 0 ? '700 ' : '500 ') + fs + 'px system-ui,-apple-system,Roboto,sans-serif'; g.fillText(String(t), pad, h - sH + pad + i * lh, w - pad * 2); });
    }
    return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('BADIMAGE'))), 'image/jpeg', 0.72));
  }

  return {
    configured, photoUrl, listPutawayPhotos, addPutawayPhoto, removePutawayPhoto, listTto, addTto, removeTto, validTto, preparePhoto, MAX_PHOTOS,
    _setFetch(f) { fetchImpl = f; }, _config(url, key) { SUPA.url = url; SUPA.key = key; },
    _internals: { rest, upload, removeObject, insert, headers, safe, rand, need },
  };
});
