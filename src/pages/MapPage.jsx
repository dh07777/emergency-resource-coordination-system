import { useState } from 'react';
import { useStore, dist } from '../store.jsx';
import { Badge } from '../ui.jsx';
const LAYERS = { incidents: ['🚨', 'Incidents'], teams: ['🚑', 'Teams'], hospitals: ['🏥', 'Hospitals'], shelters: ['🏠', 'Shelters'], depots: ['📦', 'Resource centers'] };
export default function MapPage() {
  const { data } = useStore(); const [on, setOn] = useState(Object.keys(LAYERS)); const [sel, setSel] = useState(null);
  const pts = [
    ...data.incidents.filter((i) => !['Resolved', 'Closed'].includes(i.status)).map((r) => ({ ...r, k: 'incidents', label: r.title })),
    ...data.teams.map((r) => ({ ...r, k: 'teams', label: r.name })), ...data.hospitals.map((r) => ({ ...r, k: 'hospitals', label: r.name })),
    ...data.sites.map((r) => ({ ...r, k: r.type === 'Shelter' ? 'shelters' : 'depots', label: r.name })),
  ].filter((p) => on.includes(p.k));
  const cur = sel && pts.find((p) => p.id === sel);
  const near = cur?.k === 'incidents' ? data.teams.filter((t) => t.status === 'Available').sort((a, b) => dist(a, cur) - dist(b, cur))[0] : null;
  const assignedTeam = cur?.teamId && data.teams.find((t) => t.id === cur.teamId);
  const from = near || assignedTeam;
  return (
    <>
      <h2>Interactive map <small className="muted">(simulated grid, not real geography)</small></h2>
      <div className="row">{Object.entries(LAYERS).map(([k, [e, l]]) => <label key={k} className="chk"><input type="checkbox" checked={on.includes(k)} onChange={() => setOn(on.includes(k) ? on.filter((x) => x !== k) : [...on, k])} />{e} {l}</label>)}</div>
      <div className="grid two map">
        <svg viewBox="0 0 100 100" className="mapsvg">
          {[...Array(9)].map((_, i) => <g key={i}><line x1={(i + 1) * 10} y1="0" x2={(i + 1) * 10} y2="100" className="gl" /><line y1={(i + 1) * 10} x1="0" y2={(i + 1) * 10} x2="100" className="gl" /></g>)}
          {cur && from && <line x1={from.x} y1={from.y} x2={cur.x} y2={cur.y} className="route" />}
          {pts.map((p) => <g key={p.k + p.id} onClick={() => setSel(p.id)} style={{ cursor: 'pointer' }}>
            {p.k === 'incidents' && <circle cx={p.x} cy={p.y} r="3.5" className="ring" />}
            <text x={p.x} y={p.y + 1.5} textAnchor="middle" fontSize={sel === p.id ? 6 : 4.5}>{LAYERS[p.k][0]}</text></g>)}
        </svg>
        <div className="card"><h3>Details</h3>{cur ? <>
          <p><b>{cur.id}</b> {cur.label}</p>{cur.severity && <p><Badge v={cur.severity} /> <Badge v={cur.status} /></p>}{cur.location && <p>{cur.location}</p>}{cur.description && <p>{cur.description}</p>}
          {cur.beds !== undefined && <p>Beds {cur.beds} · ICU {cur.icu}</p>}{cur.occupied !== undefined && <p>Occupancy {cur.occupied}/{cur.capacity}</p>}{cur.status && cur.k === 'teams' && <Badge v={cur.status} />}
          {from && <p className="muted">Simulated route: {from.name} → {cur.id} ({dist(from, cur).toFixed(0)} units, ~{Math.round(5 + dist(from, cur) / 3)} min). {near ? 'Nearest available team (recommendation).' : 'Assigned team.'}</p>}
        </> : <p className="muted">Select a marker. Selecting an incident draws a simulated route.</p>}</div>
      </div>
    </>
  );
}
