// Login NIK dan hak akses Role × Jabatan (tanpa DOM): window.IMMAuth di aplikasi, module.exports di Node.
// Sumber pengguna: tab "Master User APK" (kolom USER = "ID.NAMA", ROLE, JABATAN).
(function (root, factory) { const m = factory(); if (typeof module === 'object' && module.exports) module.exports = m; else root.IMMAuth = m; })(typeof self !== 'undefined' ? self : this, function () {
  const str = (v) => String(v == null ? '' : v).trim();
  const up = (v) => str(v).toUpperCase().replace(/\s+/g, ' ');
  const normNik = (v) => str(v).toUpperCase().replace(/\s+/g, '');

  const ROLES = ['INBOUND', 'STORING', 'OUTBOUND', 'INVENTORY', 'PLANNER', 'LP', 'MHE', 'MANAGER', 'ASST. MANAGER'];
  const JABATAN = ['ADMIN', 'MANAGER', 'ASST. MANAGER', 'SUPERVISOR', 'STAFF COORDINATOR', 'STAFF', 'STAFF LP', 'WAREHOUSEMAN'];
  function canon(v) {
    const s = up(v).replace(/ASST\.?\s*MANAGER|ASSISTANT MANAGER|ASST MGR/, 'ASST. MANAGER').replace(/^STAFF COORD(INATOR)?$/, 'STAFF COORDINATOR');
    return s;
  }

  function parseMaster(rows) {
    const out = new Map();
    if (!rows || !rows.length) return out;
    const H = rows[0].map(up);
    const ci = (n) => H.indexOf(n);
    const cu = ci('USER'), cr = ci('ROLE'), cj = ci('JABATAN');
    if (cu < 0 || cr < 0 || cj < 0) return out;
    for (const r of rows.slice(1)) {
      const raw = str(r[cu]);
      const m = raw.match(/^([A-Za-z]?\d{4,})\s*[.\-–]\s*(.*)$/);
      if (!m) continue;
      const nik = normNik(m[1]);
      const role = canon(r[cr]), jabatan = canon(r[cj]);
      if (!nik || !role || !jabatan) continue;
      out.set(nik, { nik, name: str(m[2]), role, jabatan });
    }
    return out;
  }

  const DEPTS = [['inbound', 'Inbound'], ['storing', 'Storing'], ['outbound', 'Outbound'], ['inventory', 'Inventory'], ['planner', 'Planner'], ['lp', 'LP'], ['mhe', 'MHE']];
  const MENUS = [
    { id: 'dashboard', label: 'Dashboard', desc: 'KPI semua departemen beserta pending dan aging', subs: DEPTS.map(([id, label]) => ({ id, label })) },
    { id: 'monitoring', label: 'Monitoring', desc: 'Aging LC di DC dan posisi kontainer', subs: [{ id: 'lcdc', label: 'LC DC' }, { id: 'container', label: 'Container' }] },
    { id: 'occupancy', label: 'Occupancy & Capacity', desc: 'Ruang terpakai dan sisa di racking DC Tallo', subs: [{ id: 'capacity', label: 'Occupancy & Capacity' }, { id: 'layout', label: 'Layout Gudang' }] },
    { id: 'sloc', label: 'Sloc', desc: 'Value rupiah dan qty per Sloc', subs: [{ id: 'value', label: 'Value' }, { id: 'qty', label: 'Qty' }] },
    { id: 'schedule', label: 'Project & Schedule', desc: 'Project DC dan jadwal resmi HO', subs: [{ id: 'project', label: 'DC Project' }, { id: 'official', label: 'Official Schedule' }] },
    { id: 'demand', label: 'Demand', desc: 'Demand per departemen', subs: [['inbound', 'Inbound'], ['storing', 'Storing'], ['inventory', 'Inventory'], ['planner', 'Planner'], ['outbound', 'Outbound']].map(([id, label]) => ({ id, label })) },
    { id: 'lppb', label: 'LPPBDO / LPPBPO', desc: 'Selisih penerimaan dari dua arah', subs: [{ id: 'inbound', label: 'Inbound' }, { id: 'outbound', label: 'Outbound' }] },
    { id: 'report', label: 'Report', desc: 'Laporan harian HO dan internal DC', subs: [{ id: 'daily', label: 'Daily Report' }, { id: 'status', label: 'Status' }] },
    { id: 'tto', label: 'TTO & Dokumen', desc: 'Serah terima dokumen antar departemen', subs: [{ id: 'list', label: 'List' }] },
    { id: 'infra', label: 'Infrastructure', desc: 'Work order alat penunjang kerja', subs: [{ id: 'workorder', label: 'Work Order' }, { id: 'reminder', label: 'Reminder' }] },
    { id: 'mpp', label: 'MPP', desc: 'Kebutuhan orang dibanding demand', subs: [{ id: 'kebutuhan', label: 'Kebutuhan' }] },
    { id: 'lp', label: 'LP Menu', desc: 'Keluar masuk DC dan observasi', subs: [{ id: 'inout', label: 'In/Out' }, { id: 'observasi', label: 'Observasi' }] }];

  const R_STD = ['MANAGER', 'ASST. MANAGER', 'INBOUND', 'STORING', 'OUTBOUND', 'INVENTORY', 'PLANNER'];
  const J_STD = ['MANAGER', 'ASST. MANAGER', 'SUPERVISOR', 'STAFF', 'STAFF COORDINATOR'];
  const ACCESS = {
    dashboard: { roles: R_STD, jabatan: J_STD },
    monitoring: { roles: R_STD, jabatan: J_STD },
    occupancy: { roles: R_STD, jabatan: J_STD },
    sloc: { roles: R_STD, jabatan: J_STD },
    schedule: { roles: R_STD, jabatan: ['MANAGER', 'ASST. MANAGER', 'SUPERVISOR'] },
    demand: { roles: '*', jabatan: '*' },
    lppb: { roles: ['MANAGER', 'ASST. MANAGER', 'INBOUND', 'OUTBOUND', 'INVENTORY', 'PLANNER'], jabatan: J_STD },
    report: { roles: R_STD, jabatan: J_STD },
    tto: { roles: R_STD.concat('LP'), jabatan: J_STD.concat('STAFF LP') },
    infra: { roles: R_STD.concat('LP', 'MHE'), jabatan: J_STD },
    mpp: { roles: ['MANAGER', 'ASST. MANAGER', 'INBOUND', 'STORING', 'OUTBOUND'], jabatan: J_STD },
    lp: { roles: ['MANAGER', 'ASST. MANAGER', 'LP'], jabatan: ['MANAGER', 'ASST. MANAGER', 'SUPERVISOR', 'STAFF LP'] },
  };
  const inList = (l, v) => l === '*' || l.indexOf(v) >= 0;
  const own = (u) => (u && (u.role === 'LP' || u.role === 'MHE') ? u.role.toLowerCase() : null);

  function can(u, menu) {
    if (!u || !ACCESS[menu]) return false;
    if (u.jabatan === 'ADMIN') return true;
    if (u.jabatan === 'WAREHOUSEMAN') return menu === 'demand';
    const a = ACCESS[menu];
    if (inList(a.roles, u.role) && inList(a.jabatan, u.jabatan)) return true;
    return menu === 'dashboard' && !!own(u);
  }
  function fullDash(u) {
    if (!u) return false;
    if (u.jabatan === 'ADMIN') return true;
    if (u.jabatan === 'WAREHOUSEMAN') return false;
    return inList(ACCESS.dashboard.roles, u.role) && inList(ACCESS.dashboard.jabatan, u.jabatan);
  }
  function dashDepts(u) {
    if (!can(u, 'dashboard')) return [];
    const all = DEPTS.map((d) => d[0]);
    if (!fullDash(u)) return [own(u)];
    const mine = (u.role || '').toLowerCase();
    return all.indexOf(mine) >= 0 ? [mine].concat(all.filter((d) => d !== mine)) : all;
  }
  function canSub(u, menu, sub) {
    if (!can(u, menu)) return false;
    if (menu === 'dashboard') return dashDepts(u).indexOf(sub) >= 0;
    return true;
  }
  const visibleMenus = (u) => MENUS.map((m) => m.id).filter((id) => can(u, id));
  const isManager = (u) => !!u && u.jabatan === 'MANAGER';
  const canEditSchedule = (u) => !!u && ['MANAGER', 'ASST. MANAGER', 'SUPERVISOR', 'ADMIN'].indexOf(u.jabatan) >= 0;
  const canMoveObs = (u) => !!u && (u.role === 'LP' || u.jabatan === 'MANAGER' || u.jabatan === 'ASST. MANAGER' || u.jabatan === 'ADMIN') && u.jabatan !== 'WAREHOUSEMAN';
  function homeLinks(u) {
    const L = { akurasi: ['dashboard', 'inventory'], damage: ['sloc', 'value'], occupancy: ['occupancy', 'capacity'], container: ['monitoring', 'container'], sla: ['dashboard', 'outbound'] };
    const o = {};
    for (const k in L) o[k] = canSub(u, L[k][0], L[k][1]) ? L[k].join('/') : null;
    return o;
  }
  const menu = (id) => MENUS.find((m) => m.id === id) || null;

  return { normNik, parseMaster, ROLES, JABATAN, DEPTS, MENUS, ACCESS, can, canSub, visibleMenus, dashDepts, isManager, canEditSchedule, canMoveObs, homeLinks, menu };
});
