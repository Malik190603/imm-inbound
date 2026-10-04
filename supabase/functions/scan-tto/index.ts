// IMM DC Tallo — fungsi server "scan-tto": membaca foto dokumen TTO dengan AI lalu mengembalikan isinya sebagai JSON.
// Satu file, sintaks JavaScript biasa, supaya bisa ditempel langsung di dashboard Supabase (Edge Functions).
//
// Secret yang dibaca (Supabase → Edge Functions → Secrets):
//   GEMINI_API_KEY      kunci Google AI Studio            (salah satu dari dua kunci ini wajib ada)
//   ANTHROPIC_API_KEY   kunci Claude
//   SCAN_PROVIDER       'gemini' atau 'claude' bila dua kunci dipasang (bawaan: gemini)
//   GEMINI_MODEL / ANTHROPIC_MODEL   mengganti model bawaan
//   SCAN_DAILY_LIMIT    batas scan per hari (bawaan 200)
// SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY sudah disediakan Supabase. Kunci AI tidak pernah dikirim ke aplikasi.

export const LIMITS = { maxBytes: 1500000, perDay: 200 };
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
const num = (v) => { if (v == null || v === '') return null; const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : null; };
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
  const model = env.GEMINI_MODEL || MODELS.gemini;
  const r = await fetchFn('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: mime, data: image } }, { text: PROMPT }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } }),
  });
  if (!r.ok) throw new Error(r.status === 429 ? 'AIQUOTA' : 'AIFAIL');
  const j = await r.json(); const parts = (((j.candidates || [])[0] || {}).content || {}).parts || [];
  return parts.map((p) => p.text || '').join('');
}
async function askClaude(env, image, mime, fetchFn) {
  const r = await fetchFn('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: env.ANTHROPIC_MODEL || MODELS.claude, max_tokens: 1500, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mime, data: image } }, { type: 'text', text: PROMPT }] }] }),
  });
  if (!r.ok) throw new Error(r.status === 429 ? 'AIQUOTA' : 'AIFAIL');
  const j = await r.json(); return (j.content || []).filter((p) => p.type === 'text').map((p) => p.text || '').join('');
}

// Batas harian dijaga di database (fungsi imm_scan_take di supabase/schema.sql): menghitung dan mencatat dalam satu langkah.
async function takeQuota(env, device, fetchFn) {
  const limit = Math.max(1, Math.floor(Number(env.SCAN_DAILY_LIMIT)) || LIMITS.perDay);
  let r; try {
    r = await fetchFn(String(env.SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1/rpc/imm_scan_take', {
      method: 'POST', headers: { 'content-type': 'application/json', apikey: env.SUPABASE_SERVICE_ROLE_KEY || '', Authorization: 'Bearer ' + (env.SUPABASE_SERVICE_ROLE_KEY || '') },
      body: JSON.stringify({ p_limit: limit, p_device: str(device, 40) }),
    });
  } catch (_) { return 'NOLOG'; }
  if (!r.ok) return 'NOLOG';
  let v; try { v = await r.json(); } catch (_) { return 'NOLOG'; }
  return v === true ? 'OK' : 'QUOTA';
}

export async function handle(req, env, fetchFn) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return fail(405, 'METHOD');
  const provider = pickProvider(env); if (!provider) return fail(503, 'NOKEY');
  let body; try { body = await req.json(); } catch (_) { return fail(400, 'BADREQ'); }
  const image = body && typeof body.image === 'string' ? body.image.replace(/^data:[^,]*,/, '') : ''; const mime = body && body.mime;
  if (!image || !MIMES.includes(mime) || !/^[A-Za-z0-9+/=\s]+$/.test(image.slice(0, 200))) return fail(400, 'BADREQ');
  if (image.length * 0.75 > LIMITS.maxBytes) return fail(413, 'TOOBIG');
  const q = await takeQuota(env, body.device, fetchFn);
  if (q === 'NOLOG') return fail(503, 'NOLOG'); if (q === 'QUOTA') return fail(429, 'QUOTA');
  let text; try { text = await (provider === 'gemini' ? askGemini : askClaude)(env, image, mime, fetchFn); }
  catch (e) { return e && e.message === 'AIQUOTA' ? fail(429, 'AIQUOTA') : fail(502, 'AIFAIL'); }
  let scan; try { scan = parseModelText(text); } catch (_) { return fail(422, 'UNREADABLE'); }
  return json(200, { ok: true, provider, scan });
}

// Titik masuk di Supabase (Deno). Di luar Deno (saat diuji dengan Node) baris ini dilewati.
const ENV_KEYS = ['GEMINI_API_KEY', 'ANTHROPIC_API_KEY', 'SCAN_PROVIDER', 'GEMINI_MODEL', 'ANTHROPIC_MODEL', 'SCAN_DAILY_LIMIT', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
if (typeof Deno !== 'undefined') Deno.serve((req) => handle(req, Object.fromEntries(ENV_KEYS.map((k) => [k, Deno.env.get(k) || ''])), fetch));
