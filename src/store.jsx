import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
const KEY = 'rescuegrid_v1';
const PFX = { incidents: 'INC', teams: 'TM', hospitals: 'HOS', volunteers: 'VOL', requests: 'REQ', resources: 'RES', sites: 'SITE', alerts: 'ALR' };
const uid = (p) => p + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
const ago = (m) => new Date(Date.now() - m * 60000).toISOString();
export const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const SEV = { Low: 1, Medium: 2, High: 3, Critical: 4 };
export const score = (i) => Math.min(100, SEV[i.severity] * 20 + Math.min(20, (Date.now() - new Date(i.reportedAt)) / 360000) + (i.category === 'Medical' ? 5 : 0));

export const seed = () => ({
  incidents: [
    { id: 'INC-1001', title: 'Flooded underpass', category: 'Flood', location: 'Riverside District', severity: 'High', status: 'Assigned', description: 'Vehicles trapped, water rising.', reportedAt: ago(95), x: 22, y: 30, teamId: 'TM-01', responseMin: 12 },
    { id: 'INC-1002', title: 'Warehouse fire', category: 'Fire', location: 'Industrial Park', severity: 'Critical', status: 'Reported', description: 'Large fire, possible chemical storage.', reportedAt: ago(20), x: 70, y: 25, teamId: '', responseMin: 0 },
    { id: 'INC-1003', title: 'Road collision', category: 'Medical', location: 'Highway 9 km 14', severity: 'Medium', status: 'In Progress', description: 'Two vehicles, 3 injured.', reportedAt: ago(50), x: 48, y: 62, teamId: 'TM-02', responseMin: 8 },
    { id: 'INC-1004', title: 'Building collapse (partial)', category: 'Rescue', location: 'Old Town', severity: 'Critical', status: 'Reported', description: 'Persons possibly trapped.', reportedAt: ago(10), x: 35, y: 78, teamId: '', responseMin: 0 },
    { id: 'INC-1005', title: 'Power outage shelter need', category: 'Shelter', location: 'North Heights', severity: 'Low', status: 'Resolved', description: 'Residents relocated.', reportedAt: ago(600), x: 80, y: 70, teamId: '', responseMin: 25 },
    { id: 'INC-1006', title: 'Landslide road block', category: 'Rescue', location: 'Hill Pass', severity: 'High', status: 'Resolved', description: 'Cleared.', reportedAt: ago(1500), x: 12, y: 12, teamId: '', responseMin: 31 },
  ],
  teams: [
    { id: 'TM-01', name: 'Alpha Water Rescue', type: 'Water Rescue', members: 'A. Khan, L. Moore, S. Patel', status: 'Deployed', duty: 'Day', performance: 88, x: 25, y: 35 },
    { id: 'TM-02', name: 'Bravo Medical', type: 'Medical', members: 'R. Diaz, T. Okafor', status: 'Deployed', duty: 'Day', performance: 92, x: 50, y: 60 },
    { id: 'TM-03', name: 'Charlie Fire Unit', type: 'Fire', members: 'J. Lee, M. Brown, P. Singh, K. Ito', status: 'Available', duty: 'Day', performance: 85, x: 62, y: 38 },
    { id: 'TM-04', name: 'Delta Urban SAR', type: 'Search & Rescue', members: 'D. Novak, E. Ruiz, F. Ali', status: 'Available', duty: 'Night', performance: 79, x: 40, y: 70 },
    { id: 'TM-05', name: 'Echo Logistics', type: 'Logistics', members: 'G. Cho, H. Park', status: 'Off Duty', duty: 'Night', performance: 74, x: 55, y: 50 },
  ],
  hospitals: [
    { id: 'HOS-01', name: 'Central General Hospital (demo)', phone: '000-DEMO-0101', beds: 40, icu: 6, capacity: 220, medical: 'Trauma, Burns, Surgery', ambulances: 2, x: 45, y: 45 },
    { id: 'HOS-02', name: 'Riverside Medical Center (demo)', phone: '000-DEMO-0102', beds: 18, icu: 2, capacity: 120, medical: 'ER, Pediatrics', ambulances: 1, x: 20, y: 40 },
    { id: 'HOS-03', name: 'North Heights Clinic (demo)', phone: '000-DEMO-0103', beds: 8, icu: 0, capacity: 60, medical: 'Primary care', ambulances: 0, x: 78, y: 60 },
  ],
  sites: [
    { id: 'SITE-01', name: 'City Sports Hall Shelter', type: 'Shelter', capacity: 300, occupied: 120, x: 60, y: 80 },
    { id: 'SITE-02', name: 'School #4 Shelter', type: 'Shelter', capacity: 150, occupied: 40, x: 30, y: 20 },
    { id: 'SITE-03', name: 'Main Supply Depot', type: 'Resource Center', capacity: 1000, occupied: 400, x: 52, y: 30 },
  ],
  resources: [
    { id: 'RES-01', name: 'Ambulances', category: 'Vehicle', total: 10, available: 4, unit: 'units', location: 'Main Supply Depot', minThreshold: 2 },
    { id: 'RES-02', name: 'Rescue vehicles', category: 'Vehicle', total: 8, available: 3, unit: 'units', location: 'Main Supply Depot', minThreshold: 2 },
    { id: 'RES-03', name: 'Medical kits', category: 'Medical', total: 200, available: 35, unit: 'kits', location: 'Main Supply Depot', minThreshold: 40 },
    { id: 'RES-04', name: 'Food packs', category: 'Food', total: 1500, available: 900, unit: 'packs', location: 'City Sports Hall Shelter', minThreshold: 300 },
    { id: 'RES-05', name: 'Drinking water', category: 'Water', total: 5000, available: 2200, unit: 'liters', location: 'Main Supply Depot', minThreshold: 800 },
    { id: 'RES-06', name: 'Emergency equipment', category: 'Equipment', total: 60, available: 25, unit: 'sets', location: 'School #4 Shelter', minThreshold: 10 },
  ],
  volunteers: [
    { id: 'VOL-01', name: 'Maya Torres', skills: 'First aid, Driving', availability: 'Available', location: 'Old Town', assigned: '', history: 'Flood drill 2025' },
    { id: 'VOL-02', name: 'Omar Haddad', skills: 'Logistics, Translation', availability: 'Available', location: 'North Heights', assigned: '', history: '' },
    { id: 'VOL-03', name: 'Chloe Martin', skills: 'Nursing', availability: 'Busy', location: 'Riverside District', assigned: 'INC-1001', history: 'Assigned INC-1001' },
  ],
  requests: [
    { id: 'REQ-01', type: 'Medical', requester: 'R. Singh', details: 'Insulin needed for 3 residents', priority: 'High', status: 'Pending', createdAt: ago(30) },
    { id: 'REQ-02', type: 'Food & Water', requester: 'Shelter #4', details: '200 water liters', priority: 'Medium', status: 'Pending', createdAt: ago(70) },
    { id: 'REQ-03', type: 'Rescue', requester: 'Old Town resident', details: 'Neighbor trapped on 2nd floor', priority: 'Critical', status: 'Approved', createdAt: ago(15) },
  ],
  alerts: [{ id: 'ALR-0', level: 'info', msg: 'DEMO DATA loaded. All incidents and alerts are simulated.', t: ago(1), read: false }],
  settings: { theme: 'dark', live: true },
});

function load() { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : seed(); } catch { return seed(); } }

/* IndexedDB audit log */
const dbp = () => new Promise((res, rej) => {
  const r = indexedDB.open('rescuegrid', 2);
  r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('audit')) d.createObjectStore('audit', { keyPath: 'k', autoIncrement: true }); if (!d.objectStoreNames.contains('files')) d.createObjectStore('files', { keyPath: 'k', autoIncrement: true }); };
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
export const auditAdd = async (m, u) => { try { const d = await dbp(); d.transaction('audit', 'readwrite').objectStore('audit').add({ t: new Date().toISOString(), m, u }); } catch { /* ignore */ } };
export const auditAll = async () => { const d = await dbp(); return new Promise((res, rej) => { const q = d.transaction('audit').objectStore('audit').getAll(); q.onsuccess = () => res(q.result.reverse()); q.onerror = () => rej(q.error); }); };
export const auditClear = async () => { const d = await dbp(); d.transaction('audit', 'readwrite').objectStore('audit').clear(); };

export const fileAdd = async (incId, file) => { const d = await dbp(); return new Promise((res, rej) => { const q = d.transaction('files', 'readwrite').objectStore('files').add({ incId, name: file.name, size: file.size, type: file.type, blob: file, t: new Date().toISOString() }); q.onsuccess = () => res(); q.onerror = () => rej(q.error); }); };
export const fileList = async (incId) => { const d = await dbp(); return new Promise((res, rej) => { const q = d.transaction('files').objectStore('files').getAll(); q.onsuccess = () => res(q.result.filter((f) => f.incId === incId)); q.onerror = () => rej(q.error); }); };
export const fileDel = async (k) => { const d = await dbp(); d.transaction('files', 'readwrite').objectStore('files').delete(k); };
const Ctx = createContext();
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [data, setData] = useState(load);
  const D = useRef(data);
  const [toasts, setToasts] = useState([]);
  const [user, setUserS] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY + '_u')); } catch { return null; } });
  const U = useRef(user); U.current = user;

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* quota */ } document.documentElement.dataset.theme = data.settings.theme; }, [data]);
  const setUser = (u) => { setUserS(u); localStorage.setItem(KEY + '_u', JSON.stringify(u)); if (u) auditAdd('Login as ' + u.role, u.name); };
  const toast = useCallback((m, t = 'ok') => { const id = Math.random(); setToasts((x) => [...x, { id, m, t }]); setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 3500); }, []);
  const commit = useCallback((fn) => { const nd = structuredClone(D.current); fn(nd); D.current = nd; setData(nd); }, []);
  const log = (m) => auditAdd(m, U.current?.name || 'system');
  const pushAlert = (d, level, msg) => { d.alerts.unshift({ id: uid('ALR'), level, msg, t: new Date().toISOString(), read: false }); d.alerts = d.alerts.slice(0, 100); };
  const release = (d, teamId) => { const t = d.teams.find((x) => x.id === teamId); if (t && t.status === 'Deployed') t.status = 'Available'; };

  const A = {
    data, user, setUser, toast, toasts,
    add(col, item) {
      const id = uid(PFX[col]); commit((d) => { d[col].unshift({ ...item, id }); if (col === 'incidents') pushAlert(d, item.severity === 'Critical' ? 'critical' : 'info', `New incident ${id}: ${item.title} (${item.severity})`); });
      log(`Created ${col} ${id}`); toast(`Created ${id}`); return id;
    },
    update(col, id, patch) { commit((d) => { Object.assign(d[col].find((x) => x.id === id), patch); }); log(`Updated ${col} ${id}`); toast(`Updated ${id}`); },
    remove(col, id) { commit((d) => { if (col === 'incidents') { const i = d.incidents.find((x) => x.id === id); if (i?.teamId) release(d, i.teamId); } d[col] = d[col].filter((x) => x.id !== id); }); log(`Deleted ${col} ${id}`); toast(`Deleted ${id}`, 'warn'); },
    assign(incId, teamId) {
      const t = D.current.teams.find((x) => x.id === teamId);
      if (!t || t.status !== 'Available') { toast('Team is not available', 'err'); return false; }
      commit((d) => { const i = d.incidents.find((x) => x.id === incId); const tm = d.teams.find((x) => x.id === teamId); if (i.teamId) release(d, i.teamId); tm.status = 'Deployed'; i.teamId = teamId; i.status = 'Assigned'; i.responseMin = Math.round(5 + dist(tm, i) / 3); pushAlert(d, 'info', `${tm.name} assigned to ${incId} (simulated, no real dispatch)`); });
      log(`Assigned ${teamId} to ${incId}`); toast('Team assigned (simulated)'); return true;
    },
    setStatus(incId, status) { commit((d) => { const i = d.incidents.find((x) => x.id === incId); i.status = status; if (['Resolved', 'Closed'].includes(status) && i.teamId) { release(d, i.teamId); } pushAlert(d, 'info', `${incId} status → ${status}`); }); log(`${incId} → ${status}`); toast(`Status: ${status}`); },
    escalate(incId) { const order = ['Low', 'Medium', 'High', 'Critical']; const i = D.current.incidents.find((x) => x.id === incId); const n = order[Math.min(3, order.indexOf(i.severity) + 1)]; if (n === i.severity) return toast('Already Critical', 'warn'); commit((d) => { d.incidents.find((x) => x.id === incId).severity = n; pushAlert(d, n === 'Critical' ? 'critical' : 'warn', `${incId} escalated to ${n}`); }); log(`Escalated ${incId} to ${n}`); toast(`Escalated to ${n}`); },
    allocate(resId, qty) { const r = D.current.resources.find((x) => x.id === resId); if (qty < 1 || qty > r.available) { toast(`Only ${r.available} available`, 'err'); return false; } commit((d) => { d.resources.find((x) => x.id === resId).available -= qty; }); log(`Allocated ${qty} ${r.name}`); toast(`Allocated ${qty} ${r.unit}`); return true; },
    transfer(resId, dest) { commit((d) => { d.resources.find((x) => x.id === resId).location = dest; }); log(`Transferred ${resId} → ${dest}`); toast('Transferred (simulated)'); },
    markRead() { commit((d) => d.alerts.forEach((a) => (a.read = true))); },
    clearAlerts() { commit((d) => { d.alerts = []; }); },
    setSetting(k, v) { commit((d) => { d.settings[k] = v; }); },
    reset() { const s = seed(); D.current = s; setData(s); auditClear(); toast('Demo data reset'); },
    importData(json) { try { const o = JSON.parse(json); if (!o.incidents || !o.teams || !o.resources) throw new Error('Missing collections'); D.current = { ...seed(), ...o }; setData(D.current); toast('Imported'); } catch (e) { toast('Import failed: ' + e.message, 'err'); } },
  };

  useEffect(() => { // simulated live updates
    const t = setInterval(() => {
      if (!D.current.settings.live) return;
      commit((d) => {
        const msgs = ['[SIMULATED] Sensor reports rising water at Riverside', '[SIMULATED] New call volume spike in Old Town', '[SIMULATED] Weather advisory update'];
        if (Math.random() < 0.5) pushAlert(d, Math.random() < 0.3 ? 'warn' : 'info', msgs[Math.floor(Math.random() * msgs.length)]);
        d.resources.forEach((r) => { if (r.available <= r.minThreshold && !d.alerts.slice(0, 15).some((a) => a.msg.includes(r.name + ' low'))) pushAlert(d, 'warn', `Resource shortage: ${r.name} low (${r.available}/${r.total})`); });
        d.hospitals.forEach((h) => { h.beds = Math.max(0, h.beds + (Math.random() < 0.5 ? -1 : 1)); });
      });
    }, 10000);
    return () => clearInterval(t);
  }, [commit]);

  return <Ctx.Provider value={A}>{children}</Ctx.Provider>;
}
