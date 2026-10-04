// IMM DC Tallo — fungsi server "scan-tto": membaca foto dokumen TTO dengan AI lalu mengembalikan isinya sebagai JSON.
// Satu file, sintaks JavaScript biasa, supaya bisa ditempel langsung di dashboard Supabase (Edge Functions).
//
// Secret yang dibaca (Supabase → Edge Functions → Secrets):
//   GEMINI_API_KEY      kunci Google AI Studio            (salah satu dari dua kunci ini wajib ada)
//   ANTHROPIC_API_KEY   kunci Claude
//   SCAN_PROVIDER       'gemini' atau 'claude' bila dua kunci dipasang (bawaan: gemini)
//   GEMINI_MODEL / ANTHROPIC_MODEL   mengganti model bawaan
//   SCAN_DAILY_LIMIT    batas scan per hari (bawaan 200)
// Kunci AI juga boleh disimpan di brankas database (Supabase Vault) dengan nama yang sama; secret fungsi didahulukan.
// SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah disediakan Supabase. Kunci AI tidak pernah dikirim ke aplikasi.

export const LIMITS = { maxBytes: 1500000, perDay: 200, aiTimeoutMs: 30000, dbTimeoutMs: 8000 };
export const MODELS = { gemini: 'gemini-3.5-flash-lite', claude: 'claude-haiku-4-5-20251001' };
const MIMES = ['image/jpeg', 'image/png', 'image/webp'];

export const PROMPT = [
  'Ini foto dokumen "Tanda Terima Online" (TTO) dari gudang. Baca isinya dan balas HANYA dengan satu objek JSON, tanpa teks lain.',
  'Bentuk JSON:',
  '{"no_tto": string, "trans_no": string, "tgl_dok": "YYYY-MM-DD" atau "", "tujuan": string, "items": [{"nama": string, "qty": number atau null, "satuan": string}], "total": number atau null}',
  'Aturan:',
  '- no_tto diambil dari baris "Document No" (contoh: TTO/H001/2026/09/0721). trans_no dari "Trans No". Jangan tertukar.',
  '- tgl_dok dari "Trans Date", diubah ke YYYY-MM-DD. tujuan dari "To Site".',
  '- items: satu entri untuk tiap baris tabel barang, urut dari atas. nama dari kolom Description, qty dari kolom Qty, satuan dari kolom Note (misalnya KOLI).',
  '- total dari baris "Total Qty".',
  '- Salin teks apa adanya, jangan memperbaiki ejaan dan jangan menebak. Yang tidak terbaca diisi "" atau null.',
  '- Abaikan nama orang, tanda tangan, stempel, dan stiker barcode.',
  '- Kalau foto ini bukan dokumen TTO, balas {"no_tto":"","trans_no":"","tgl_dok":"","tujuan":"","items":[],"total":null}.',
].join('\n');

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info', 'access-control-allow-methods': 'POST, OPTIONS' };
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });
const fail = (status, error) => json(status, { ok: false, error });
const str = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
// Angka dari dokumen: "1.000" / "2,500" = pemisah ribuan; "2,5" = desimal. Di luar 0..1.000.000 dianggap salah baca.
const num = (v) => {
  if (v == null || v === '') return null; let t = String(v).trim();
  t = /^\d{1,3}([.,]\d{3})+$/.test(t) ? t.replace(/[.,]/g, '') : t.replace(',', '.');
  const n = Number(t); return Number.isFinite(n) && n >= 0 && n <= 1000000 ? n : null;
};
const timeout = (ms) => (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined);
const modelName = (v, fallback) => (/^[\w.-]{1,80}$/.test(String(v || '')) ? String(v) : fallback);
// Kepala file harus cocok dengan jenis gambarnya (JPEG, PNG, WebP).
function looksLikeImage(b64, mime) {
  let head; try { head = atob(b64.slice(0, 24)); } catch (_) { return false; }
  const c = (i) => head.charCodeAt(i);
  if (mime === 'image/jpeg') return c(0) === 0xff && c(1) === 0xd8 && c(2) === 0xff;
  if (mime === 'image/png') return c(0) === 0x89 && head.slice(1, 4) === 'PNG';
  if (mime === 'image/webp') return head.slice(0, 4) === 'RIFF' && head.slice(8, 12) === 'WEBP';
  return false;
}
function isoDate(v) {
  const s = str(v, 20); let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if (m) return m[1] + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/); return m ? m[3] + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0') : '';
}

export function pickProvider(env) {
  const g = !!(env && env.GEMINI_API_KEY), c = !!(env && env.ANTHROPIC_API_KEY);
  if (!g && !c) return null; if (g && c) return String(env.SCAN_PROVIDER || '').toLowerCase() === 'claude' ? 'claude' : 'gemini';
  return g ? 'gemini' : 'claude';
}

// Merapikan jawaban AI: hanya kolom yang dikenal, panjang dibatasi, angka dipastikan angka.
export function normalizeScan(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('UNREADABLE');
  const items = (Array.isArray(raw.items) ? raw.items : []).filter((x) => x && typeof x === 'object')
    .map((x) => ({ nama: str(x.nama, 80), qty: num(x.qty), satuan: str(x.satuan, 20) })).filter((x) => x.nama).slice(0, 60);
  const scan = { no_tto: str(raw.no_tto, 60), trans_no: str(raw.trans_no, 60), tgl_dok: isoDate(raw.tgl_dok), tujuan: str(raw.tujuan, 120), items, total: num(raw.total) };
  if (!scan.no_tto && !items.length) throw new Error('UNREADABLE');
  return scan;
}
export function parseModelText(text) {
  const s = String(text || ''); const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) throw new Error('UNREADABLE');
  let obj; try { obj = JSON.parse(s.slice(a, b + 1)); } catch (_) { throw new Error('UNREADABLE'); }
  return normalizeScan(obj);
}

async function askGemini(env, image, mime, fetchFn) {
  const model = modelName(env.GEMINI_MODEL, MODELS.gemini);
  const r = await fetchFn('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: mime, data: image } }, { text: PROMPT }] }], generationConfig: { responseMimeType: 'application/json' } }),
    signal: timeout(LIMITS.aiTimeoutMs),
  });
  if (!r.ok) throw Object.assign(new Error(r.status === 429 ? 'AIQUOTA' : 'AIFAIL'), { upstream: r.status });
  const j = await r.json(); const cand = (j.candidates || [])[0] || {};
  if (cand.finishReason === 'MAX_TOKENS') throw new Error('TOOLONG');
  return ((cand.content || {}).parts || []).map((p) => p.text || '').join('');
}
async function askClaude(env, image, mime, fetchFn) {
  const r = await fetchFn('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: modelName(env.ANTHROPIC_MODEL, MODELS.claude), max_tokens: 4096, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mime, data: image } }, { type: 'text', text: PROMPT }] }] }),
    signal: timeout(LIMITS.aiTimeoutMs),
  });
  if (!r.ok) throw Object.assign(new Error(r.status === 429 ? 'AIQUOTA' : 'AIFAIL'), { upstream: r.status });
  const j = await r.json(); if (j.stop_reason === 'max_tokens') throw new Error('TOOLONG');
  return (j.content || []).filter((p) => p.type === 'text').map((p) => p.text || '').join('');
}

// Batas harian dijaga di database (imm_scan_take di supabase/schema.sql): menghitung dan mencatat dalam satu langkah, mengembalikan id jatah (0 = habis).
// Batas ini berlaku untuk semua HP bersama-sama: melindungi tagihan, dengan risiko jatah bisa dihabiskan orang iseng (form manual tetap jalan).
const rpc = (env, name, args, fetchFn) => fetchFn(String(env.SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1/rpc/' + name, {
  method: 'POST', headers: { 'content-type': 'application/json', apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY },
  body: JSON.stringify(args), signal: timeout(LIMITS.dbTimeoutMs),
});
async function takeQuota(env, device, fetchFn) {
  const raw = String(env.SCAN_DAILY_LIMIT == null ? '' : env.SCAN_DAILY_LIMIT).trim(); const n = Math.floor(Number(raw));
  if (raw !== '' && n === 0) return { state: 'QUOTA' }; // 0 = scan dimatikan
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return { state: 'NOLOG' };
  let v; try { const r = await rpc(env, 'imm_scan_take', { p_limit: n > 0 ? n : LIMITS.perDay, p_device: str(device, 40) }, fetchFn); if (!r.ok) return { state: 'NOLOG' }; v = await r.json(); }
  catch (_) { return { state: 'NOLOG' }; }
  return typeof v === 'number' && v > 0 ? { state: 'OK', id: v } : v === 0 ? { state: 'QUOTA' } : { state: 'NOLOG' };
}
// Scan yang gagal bukan karena fotonya (AI galat atau jawaban terpotong) tidak memakan jatah.
async function refund(env, id, fetchFn) { try { await rpc(env, 'imm_scan_refund', { p_id: id }, fetchFn); } catch (_) { /* jatah tetap terpakai */ } }

// Kunci AI: dari secret fungsi; kalau tidak ada, dari brankas database lewat imm_secret (hanya service_role). Diingat 5 menit.
let keyCache = { at: 0, keys: null };
export function _resetKeyCache() { keyCache = { at: 0, keys: null }; }
async function withKeys(env, fetchFn) {
  if (env.GEMINI_API_KEY || env.ANTHROPIC_API_KEY) return env;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return env;
  if (!keyCache.keys || Date.now() - keyCache.at > 300000) {
    const keys = {};
    for (const name of ['GEMINI_API_KEY', 'ANTHROPIC_API_KEY']) {
      try { const r = await rpc(env, 'imm_secret', { p_name: name }, fetchFn); if (r.ok) { const v = await r.json(); if (typeof v === 'string' && v) keys[name] = v; } } catch (_) { /* brankas tidak tersedia */ }
    }
    if (!Object.keys(keys).length) return env; // jangan mengingat hasil kosong: kunci bisa saja baru dipasang
    keyCache = { at: Date.now(), keys };
  }
  return { ...env, ...keyCache.keys };
}

// Membaca badan permintaan dengan batas ukuran, supaya kiriman raksasa tidak membebani server.
async function readJson(req, maxChars) {
  const len = Number(req.headers && req.headers.get && req.headers.get('content-length'));
  if (Number.isFinite(len) && len > maxChars) throw new Error('TOOBIG');
  if (!req.body || !req.body.getReader) { const t = await req.text(); if (t.length > maxChars) throw new Error('TOOBIG'); return JSON.parse(t); }
  const reader = req.body.getReader(); const dec = new TextDecoder(); let text = '';
  for (;;) { const { done, value } = await reader.read(); if (done) break; text += dec.decode(value, { stream: true }); if (text.length > maxChars) { try { await reader.cancel(); } catch (_) { /* abaikan */ } throw new Error('TOOBIG'); } }
  return JSON.parse(text + dec.decode());
}

export async function handle(req, env, fetchFn) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return fail(405, 'METHOD');
  env = await withKeys(env, fetchFn);
  const provider = pickProvider(env); if (!provider) return fail(503, 'NOKEY');
  let body; try { body = await readJson(req, Math.ceil(LIMITS.maxBytes / 0.75) + 4096); } catch (e) { return e && e.message === 'TOOBIG' ? fail(413, 'TOOBIG') : fail(400, 'BADREQ'); }
  const image = body && typeof body.image === 'string' ? body.image.replace(/^data:[^,]*,/, '').replace(/\s+/g, '') : ''; const mime = body && body.mime;
  if (image.length * 0.75 > LIMITS.maxBytes) return fail(413, 'TOOBIG');
  if (!image || !MIMES.includes(mime) || !/^[A-Za-z0-9+/]+={0,2}$/.test(image) || !looksLikeImage(image, mime)) return fail(400, 'BADREQ');
  const q = await takeQuota(env, body.device, fetchFn);
  if (q.state === 'NOLOG') return fail(503, 'NOLOG'); if (q.state === 'QUOTA') return fail(429, 'QUOTA');
  let text; try { text = await (provider === 'gemini' ? askGemini : askClaude)(env, image, mime, fetchFn); }
  catch (e) { await refund(env, q.id, fetchFn); const m = e && e.message; return m === 'AIQUOTA' ? fail(429, 'AIQUOTA') : m === 'TOOLONG' ? fail(422, 'TOOLONG') : json(502, { ok: false, error: 'AIFAIL', upstream: (e && e.upstream) || 0 }); } // upstream = kode HTTP dari layanan AI (tanpa isi jawabannya)
  let scan; try { scan = parseModelText(text); } catch (_) { return fail(422, 'UNREADABLE'); }
  return json(200, { ok: true, provider, scan });
}

// Titik masuk di Supabase (Deno). Di luar Deno (saat diuji dengan Node) baris ini dilewati.
const ENV_KEYS = ['GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'SCAN_PROVIDER', 'GEMINI_MODEL', 'ANTHROPIC_MODEL', 'SCAN_DAILY_LIMIT', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
if (typeof Deno !== 'undefined') Deno.serve((req) => handle(req, Object.fromEntries(ENV_KEYS.map((k) => [k, Deno.env.get(k) || ''])), fetch));
