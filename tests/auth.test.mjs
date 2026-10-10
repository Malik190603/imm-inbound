import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const A = require('../www/auth-core.js');
const eq = assert.equal, deepEq = assert.deepEqual;
const U = (role, jabatan) => ({ nik: '1', name: 'X', role, jabatan });

test('normNik trims, uppercases, keeps leading zeros', () => {
  eq(A.normNik(' 012345 '), '012345');
  eq(A.normNik('e01234'), 'E01234');
  eq(A.normNik('12 34 56'), '123456');
  eq(A.normNik(''), '');
});

test('parseMaster: "ID.NAMA", last row wins, aliases normalised, junk skipped', () => {
  const rows = [
    ['USER', 'ROLE', 'JABATAN', '', '', 'ROLE', '', 'JABATAN'],
    ['012345.BUDI SANTOSO', 'INBOUND', 'SUPERVISOR', '', '', 'ADMIN', '', 'ADMIN'],
    ['E01234.Ani', 'lp', 'Staff LP'],
    ['223344.CICI', 'Asst Manager', 'Asst. Manager'],
    ['012345.BUDI SANTOSO', 'INBOUND', 'STAFF COORDINATOR'],
    ['', 'INBOUND', 'STAFF'],
    ['TANPA ID', 'INBOUND', 'STAFF']];
  const m = A.parseMaster(rows);
  eq(m.size, 3);
  deepEq(m.get('012345'), { nik: '012345', name: 'BUDI SANTOSO', role: 'INBOUND', jabatan: 'STAFF COORDINATOR' });
  deepEq(m.get('E01234'), { nik: 'E01234', name: 'Ani', role: 'LP', jabatan: 'STAFF LP' });
  eq(m.get('223344').role, 'ASST. MANAGER'); eq(m.get('223344').jabatan, 'ASST. MANAGER');
});

test('parseMaster finds columns by header text', () => {
  const m = A.parseMaster([['JABATAN', 'USER', 'ROLE'], ['STAFF', '111111.A', 'PLANNER']]);
  deepEq(m.get('111111'), { nik: '111111', name: 'A', role: 'PLANNER', jabatan: 'STAFF' });
});

test('menu list matches the owner document', () => {
  deepEq(A.MENUS.map((m) => m.id), ['dashboard', 'monitoring', 'occupancy', 'sloc', 'schedule', 'demand', 'lppb', 'report', 'tto', 'infra', 'mpp', 'lp']);
  deepEq(A.MENUS.find((m) => m.id === 'dashboard').subs.map((s) => s.id), ['inbound', 'storing', 'outbound', 'inventory', 'planner', 'lp', 'mhe']);
  deepEq(A.MENUS.find((m) => m.id === 'lp').subs.map((s) => s.id), ['inout', 'observasi']);
  deepEq(A.MENUS.find((m) => m.id === 'infra').subs.map((s) => s.id), ['workorder', 'reminder']);
});

test('access table FR-010', () => {
  const sup = U('INBOUND', 'SUPERVISOR');
  deepEq(A.visibleMenus(sup), ['dashboard', 'monitoring', 'occupancy', 'sloc', 'schedule', 'demand', 'lppb', 'report', 'tto', 'infra', 'mpp']);
  const staffStoring = U('STORING', 'STAFF COORDINATOR');
  eq(A.can(staffStoring, 'schedule'), false); // jabatan only Manager/Asst/Supervisor
  eq(A.can(staffStoring, 'lppb'), false);     // role Storing not in LPPB list
  eq(A.can(staffStoring, 'mpp'), true);
  eq(A.can(U('INVENTORY', 'STAFF'), 'mpp'), false);
  eq(A.can(U('PLANNER', 'STAFF'), 'lppb'), true);
  const lp = U('LP', 'STAFF LP');
  deepEq(A.visibleMenus(lp), ['dashboard', 'demand', 'tto', 'lp']);
  const lpSup = U('LP', 'SUPERVISOR');
  deepEq(A.visibleMenus(lpSup), ['dashboard', 'demand', 'tto', 'infra', 'lp']);
  const mhe = U('MHE', 'STAFF COORDINATOR');
  deepEq(A.visibleMenus(mhe), ['dashboard', 'demand', 'infra']);
  const mgr = U('MANAGER', 'MANAGER');
  deepEq(A.visibleMenus(mgr), A.MENUS.map((m) => m.id));
  const asst = U('ASST. MANAGER', 'ASST. MANAGER');
  deepEq(A.visibleMenus(asst), A.MENUS.map((m) => m.id));
});

test('ADMIN sees everything, WAREHOUSEMAN only demand', () => {
  deepEq(A.visibleMenus(U('INBOUND', 'ADMIN')), A.MENUS.map((m) => m.id));
  deepEq(A.visibleMenus(U('STORING', 'WAREHOUSEMAN')), ['demand']);
  deepEq(A.visibleMenus(U('MHE', 'WAREHOUSEMAN')), ['demand']);
  eq(A.can(null, 'demand'), false);
});

test('dashboard departments: own dept first; LP / MHE only their own', () => {
  deepEq(A.dashDepts(U('OUTBOUND', 'STAFF')), ['outbound', 'inbound', 'storing', 'inventory', 'planner', 'lp', 'mhe']);
  deepEq(A.dashDepts(U('MANAGER', 'MANAGER')), ['inbound', 'storing', 'outbound', 'inventory', 'planner', 'lp', 'mhe']);
  deepEq(A.dashDepts(U('LP', 'STAFF LP')), ['lp']);
  deepEq(A.dashDepts(U('MHE', 'STAFF COORDINATOR')), ['mhe']);
  deepEq(A.dashDepts(U('STORING', 'WAREHOUSEMAN')), []);
});

test('canSub for sub menus and permission helpers', () => {
  eq(A.canSub(U('LP', 'STAFF LP'), 'dashboard', 'lp'), true);
  eq(A.canSub(U('LP', 'STAFF LP'), 'dashboard', 'inbound'), false);
  eq(A.canSub(U('INBOUND', 'STAFF'), 'dashboard', 'mhe'), true);
  eq(A.isManager(U('MANAGER', 'MANAGER')), true);
  eq(A.isManager(U('ASST. MANAGER', 'ASST. MANAGER')), false);
  eq(A.canEditSchedule(U('INBOUND', 'SUPERVISOR')), true);
  eq(A.canEditSchedule(U('INBOUND', 'STAFF')), false);
  eq(A.canEditSchedule(U('INBOUND', 'ADMIN')), true);
  eq(A.canMoveObs(U('LP', 'STAFF LP')), true);
  eq(A.canMoveObs(U('INBOUND', 'SUPERVISOR')), false);
  eq(A.canMoveObs(U('ASST. MANAGER', 'ASST. MANAGER')), true);
});

test('home links only to permitted menus', () => {
  deepEq(A.homeLinks(U('STORING', 'WAREHOUSEMAN')), { akurasi: null, damage: null, occupancy: null, container: null, sla: null });
  deepEq(A.homeLinks(U('INBOUND', 'STAFF')), { akurasi: 'dashboard/inventory', damage: 'sloc/value', occupancy: 'occupancy/capacity', container: 'monitoring/container', sla: 'dashboard/outbound' });
});
