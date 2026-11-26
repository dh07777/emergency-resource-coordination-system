import { useEffect, useState } from 'react';
import Crud from './Crud.jsx';
import { Modal } from '../ui.jsx';
import { fileAdd, fileList, fileDel, useStore } from '../store.jsx';

function Files({ inc, onClose }) {
  const { toast } = useStore(); const [list, setList] = useState(null); const [err, setErr] = useState('');
  const load = () => fileList(inc.id).then(setList).catch((e) => setErr(e.message)); useEffect(() => { load(); }, []);
  const up = async (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (f.size > 2 * 1024 * 1024) return setErr('File too large (max 2 MB).'); setErr('');
    try { await fileAdd(inc.id, f); toast('File saved to IndexedDB'); load(); } catch (x) { setErr('Save failed: ' + x.message); }
  };
  const open = (f) => { const u = URL.createObjectURL(f.blob); const a = document.createElement('a'); a.href = u; a.download = f.name; a.click(); };
  return (
    <Modal title={`Attachments – ${inc.id}`} onClose={onClose}>
      <label>Add file (max 2 MB, stored locally)<input type="file" onChange={up} /></label>{err && <p className="err">{err}</p>}
      {!list ? <p>Loading…</p> : list.length ? list.map((f) => <div key={f.k} className="alrow row between"><span>{f.name} <small className="muted">{Math.round(f.size / 1024)} KB</small></span><span><button className="btn sm" onClick={() => open(f)}>Download</button><button className="btn sm danger" onClick={() => fileDel(f.k).then(load)}>Delete</button></span></div>) : <p className="muted">No attachments yet.</p>}
      <div className="row end"><button className="btn" onClick={onClose}>Close</button></div>
    </Modal>
  );
}
import { dist, score } from '../store.jsx';
const XY = [{ k: 'x', l: 'Map X (0-100, demo grid)', t: 'number', min: 0, max: 100 }, { k: 'y', l: 'Map Y (0-100, demo grid)', t: 'number', min: 0, max: 100 }];
const SEVS = ['Low', 'Medium', 'High', 'Critical'];
const STAT = ['Reported', 'Assigned', 'In Progress', 'Resolved', 'Closed'];

export const Incidents = () => (
  <Crud col="incidents" title="Incidents" filter={{ k: 'status', opts: STAT }} defaults={{ status: 'Reported', teamId: '', responseMin: 0, x: 50, y: 50 }}
    fields={[{ k: 'title', l: 'Title', req: 1 }, { k: 'category', l: 'Category', opts: ['Fire', 'Flood', 'Medical', 'Rescue', 'Shelter', 'Hazmat', 'Other'] }, { k: 'location', l: 'Location', req: 1 }, { k: 'severity', l: 'Severity', opts: SEVS }, { k: 'status', l: 'Status', opts: STAT }, { k: 'reportedAt', l: 'Reported time', t: 'datetime-local', req: 1 }, ...XY, { k: 'description', l: 'Description', t: 'textarea', req: 1 }]}
    columns={[{ k: 'id', l: 'ID' }, { k: 'title', l: 'Title' }, { k: 'category', l: 'Category' }, { k: 'severity', l: 'Severity', badge: 1 }, { k: 'status', l: 'Status', badge: 1 }, { k: 'score', l: 'Priority (sim)', r: (r) => Math.round(score(r)) }, { k: 'teamId', l: 'Team', r: (r, d) => d.teams.find((t) => t.id === r.teamId)?.name || '—' }]}
    actions={(r, s, setPick) => <><button className="btn sm" onClick={() => setPick({ render: (c) => <Files inc={r} onClose={c} /> })}>Files</button>{!['Resolved', 'Closed'].includes(r.status) && <>
      <button className="btn sm" onClick={() => { const a = s.data.resources.find((x) => x.name === 'Ambulances'); const h = [...s.data.hospitals].filter((x) => x.beds > 0).sort((p, q) => dist(p, r) - dist(q, r))[0]; if (!h) return s.toast('No hospital with free beds', 'err'); if (a && s.allocate(a.id, 1)) s.toast(`Simulated: ambulance → ${h.name}. No real dispatch.`, 'warn'); }}>Ambulance (sim)</button>
      <button className="btn sm" onClick={() => {
        const av = s.data.teams.filter((t) => t.status === 'Available').sort((a, b) => dist(a, r) - dist(b, r));
        setPick({ title: `Assign team to ${r.id}`, label: 'Available teams (nearest first, simulated distance)', options: av.map((t, i) => ({ v: t.id, l: `${i === 0 ? '★ Recommended: ' : ''}${t.name} (${dist(t, r).toFixed(0)} units)` })), onOk: (v) => s.assign(r.id, v) });
      }}>Assign</button>
      <button className="btn sm" onClick={() => s.escalate(r.id)}>Escalate</button>
      <button className="btn sm" onClick={() => s.setStatus(r.id, 'Resolved')}>Resolve</button></>}</>}
  />
);

export const Teams = () => (
  <Crud col="teams" title="Rescue teams" filter={{ k: 'status', opts: ['Available', 'Deployed', 'Off Duty'] }} defaults={{ x: 50, y: 50 }}
    fields={[{ k: 'name', l: 'Team name', req: 1 }, { k: 'type', l: 'Type', opts: ['Fire', 'Medical', 'Water Rescue', 'Search & Rescue', 'Logistics'] }, { k: 'members', l: 'Members (comma separated)', req: 1 }, { k: 'status', l: 'Status', opts: ['Available', 'Deployed', 'Off Duty'] }, { k: 'duty', l: 'Duty shift', opts: ['Day', 'Night'] }, { k: 'performance', l: 'Performance (0-100)', t: 'number', min: 0, max: 100 }, ...XY]}
    columns={[{ k: 'name', l: 'Team' }, { k: 'type', l: 'Type' }, { k: 'members', l: 'Members', r: (r) => r.members.split(',').length + ': ' + r.members }, { k: 'status', l: 'Status', badge: 1 }, { k: 'duty', l: 'Duty' }, { k: 'performance', l: 'Perf.', r: (r) => r.performance + '%' }, { k: 'inc', l: 'Assigned', r: (r, d) => d.incidents.filter((i) => i.teamId === r.id && !['Resolved', 'Closed'].includes(i.status)).map((i) => i.id).join(', ') || '—' }]}
    actions={(r, s) => r.status !== 'Deployed' && <button className="btn sm" onClick={() => s.update('teams', r.id, { status: r.status === 'Available' ? 'Off Duty' : 'Available' })}>{r.status === 'Available' ? 'Go off duty' : 'Go on duty'}</button>}
  />
);

export const Hospitals = () => (
  <Crud col="hospitals" title="Hospitals" defaults={{ x: 50, y: 50 }}
    fields={[{ k: 'name', l: 'Name', req: 1 }, { k: 'phone', l: 'Contact (demo number)', req: 1 }, { k: 'beds', l: 'Available beds', t: 'number', min: 0 }, { k: 'icu', l: 'ICU available', t: 'number', min: 0 }, { k: 'capacity', l: 'Total capacity', t: 'number', min: 1 }, { k: 'medical', l: 'Medical resources', req: 1 }, { k: 'ambulances', l: 'Ambulances assigned', t: 'number', min: 0 }, ...XY]}
    validate={(v) => (+v.beds > +v.capacity ? { beds: 'Beds exceed capacity' } : null)}
    columns={[{ k: 'name', l: 'Hospital' }, { k: 'phone', l: 'Contact (demo)' }, { k: 'beds', l: 'Beds', r: (r) => { const p = Math.round((1 - r.beds / r.capacity) * 100); return <div>{r.beds} free / {r.capacity} ({p}% full)<div className="meter"><i style={{ width: p + '%', background: p > 85 ? 'var(--red)' : p > 65 ? 'var(--orange)' : '#2ec4b6' }} /></div></div>; } }, { k: 'icu', l: 'ICU' }, { k: 'medical', l: 'Resources' }, { k: 'ambulances', l: 'Ambulances' }]}
    actions={(r, s) => <button className="btn sm" onClick={() => { const a = s.data.resources.find((x) => x.name === 'Ambulances'); if (a && s.allocate(a.id, 1)) s.update('hospitals', r.id, { ambulances: r.ambulances + 1 }); }}>Assign ambulance (sim)</button>}
  />
);

export const Volunteers = () => (
  <Crud col="volunteers" title="Volunteers" filter={{ k: 'availability', opts: ['Available', 'Busy', 'Unavailable'] }} defaults={{ assigned: '', history: '' }}
    fields={[{ k: 'name', l: 'Name', req: 1 }, { k: 'skills', l: 'Skills & expertise', req: 1 }, { k: 'availability', l: 'Availability', opts: ['Available', 'Busy', 'Unavailable'] }, { k: 'location', l: 'Location', req: 1 }]}
    columns={[{ k: 'name', l: 'Name' }, { k: 'skills', l: 'Skills' }, { k: 'availability', l: 'Status', badge: 1 }, { k: 'location', l: 'Location' }, { k: 'assigned', l: 'Assigned', r: (r) => r.assigned || '—' }, { k: 'history', l: 'Activity history', r: (r) => r.history || '—' }]}
    actions={(r, s, setPick) => r.availability === 'Available' && <button className="btn sm" onClick={() => setPick({ title: 'Assign volunteer', label: 'Active incident', options: s.data.incidents.filter((i) => !['Resolved', 'Closed'].includes(i.status)).map((i) => ({ v: i.id, l: `${i.id} ${i.title}` })), onOk: (v) => s.update('volunteers', r.id, { availability: 'Busy', assigned: v, history: (r.history ? r.history + '; ' : '') + 'Assigned ' + v }) })}>Assign</button>}
  />
);

export const Requests = () => (
  <Crud col="requests" title="Emergency requests" filter={{ k: 'status', opts: ['Pending', 'Approved', 'Rejected'] }} defaults={{ status: 'Pending' }}
    fields={[{ k: 'type', l: 'Request type', opts: ['Medical', 'Rescue', 'Food & Water', 'Shelter'] }, { k: 'requester', l: 'Requester', req: 1 }, { k: 'details', l: 'Details', t: 'textarea', req: 1 }, { k: 'priority', l: 'Priority', opts: SEVS }, { k: 'status', l: 'Status', opts: ['Pending', 'Approved', 'Rejected'] }]}
    columns={[{ k: 'id', l: 'ID' }, { k: 'type', l: 'Type' }, { k: 'requester', l: 'Requester' }, { k: 'details', l: 'Details' }, { k: 'priority', l: 'Priority', badge: 1 }, { k: 'status', l: 'Status', badge: 1 }]}
    actions={(r, s) => r.status === 'Pending' && <><button className="btn sm" onClick={() => s.update('requests', r.id, { status: 'Approved' })}>Approve</button><button className="btn sm danger" onClick={() => s.update('requests', r.id, { status: 'Rejected' })}>Reject</button></>}
  />
);

export const Resources = () => (
  <Crud col="resources" title="Resources" filter={{ k: 'category', opts: ['Vehicle', 'Medical', 'Food', 'Water', 'Equipment'] }}
    fields={[{ k: 'name', l: 'Name', req: 1 }, { k: 'category', l: 'Category', opts: ['Vehicle', 'Medical', 'Food', 'Water', 'Equipment'] }, { k: 'total', l: 'Total stock', t: 'number', min: 1 }, { k: 'available', l: 'Available', t: 'number', min: 0 }, { k: 'unit', l: 'Unit', req: 1 }, { k: 'location', l: 'Location', req: 1 }, { k: 'minThreshold', l: 'Low-stock threshold', t: 'number', min: 0 }]}
    validate={(v) => (+v.available > +v.total ? { available: 'Cannot exceed total' } : null)}
    columns={[{ k: 'name', l: 'Resource' }, { k: 'category', l: 'Category' }, { k: 'available', l: 'Available', r: (r) => `${r.available}/${r.total} ${r.unit}` }, { k: 'location', l: 'Location' }, { k: 'alert', l: 'Inventory', r: (r) => r.available <= r.minThreshold ? <span className="badge b-critical">LOW</span> : <span className="badge b-low">OK</span> }, { k: 'pred', l: 'Shortage prediction (sim)', r: (r) => { const f = r.available / (r.total || 1); return f < 0.2 ? 'Shortage within ~6h' : f < 0.4 ? 'Watch: ~24h' : 'Stable'; } }]}
    actions={(r, s, setPick) => <>
      <button className="btn sm" onClick={() => setPick({ title: `Allocate ${r.name}`, label: `Quantity (max ${r.available})`, number: true, max: r.available, onOk: (v) => s.allocate(r.id, v) })}>Allocate</button>
      <button className="btn sm" onClick={() => setPick({ title: `Transfer ${r.name}`, label: 'Destination', options: [...s.data.sites, ...s.data.hospitals].map((x) => ({ v: x.name, l: x.name })), onOk: (v) => s.transfer(r.id, v) })}>Transfer</button></>}
  />
);

export const Sites = () => (
  <Crud col="sites" title="Shelters & resource centers" filter={{ k: 'type', opts: ['Shelter', 'Resource Center'] }} defaults={{ x: 50, y: 50 }}
    fields={[{ k: 'name', l: 'Name', req: 1 }, { k: 'type', l: 'Type', opts: ['Shelter', 'Resource Center'] }, { k: 'capacity', l: 'Capacity', t: 'number', min: 1 }, { k: 'occupied', l: 'Occupied', t: 'number', min: 0 }, ...XY]}
    validate={(v) => (+v.occupied > +v.capacity ? { occupied: 'Exceeds capacity' } : null)}
    columns={[{ k: 'name', l: 'Name' }, { k: 'type', l: 'Type', badge: 1 }, { k: 'cap', l: 'Occupancy', r: (r) => `${r.occupied}/${r.capacity} (${Math.round((r.occupied / r.capacity) * 100)}%)` }]}
  />
);
