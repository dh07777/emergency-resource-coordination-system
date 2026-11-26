import { lazy, Suspense, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useStore } from './store.jsx';
import { EB, Skel } from './ui.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { Incidents, Teams, Hospitals, Volunteers, Requests, Resources, Sites } from './pages/Modules.jsx';
import { Alerts, Audit, Settings } from './pages/Misc.jsx';
const MapPage = lazy(() => import('./pages/MapPage.jsx'));
const Analytics = lazy(() => import('./pages/Analytics.jsx'));

const NAV = [
  ['/', '📊', 'Dashboard', 'all'], ['/incidents', '🚨', 'Incidents', 'admin,coordinator,team'], ['/map', '🗺️', 'Map', 'all'],
  ['/resources', '📦', 'Resources', 'admin,coordinator'], ['/teams', '🚑', 'Rescue teams', 'admin,coordinator,team'],
  ['/requests', '🆘', 'Requests', 'admin,coordinator,volunteer'], ['/hospitals', '🏥', 'Hospitals', 'admin,coordinator'],
  ['/sites', '🏠', 'Shelters & depots', 'admin,coordinator'], ['/volunteers', '🙋', 'Volunteers', 'admin,coordinator,volunteer'],
  ['/alerts', '🔔', 'Alerts', 'all'], ['/analytics', '📈', 'Analytics', 'admin,coordinator'],
  ['/audit', '🧾', 'Audit log', 'admin'], ['/settings', '⚙️', 'Settings', 'admin'],
];

function Search() {
  const { data } = useStore(); const nav = useNavigate(); const [q, setQ] = useState('');
  const cols = [['incidents', '/incidents', 'title'], ['teams', '/teams', 'name'], ['hospitals', '/hospitals', 'name'], ['volunteers', '/volunteers', 'name'], ['requests', '/requests', 'details'], ['resources', '/resources', 'name']];
  const res = q.length < 2 ? [] : cols.flatMap(([c, p, k]) => data[c].filter((r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase())).slice(0, 4).map((r) => ({ id: r.id, p, label: r[k], c })));
  return (
    <div className="search"><input placeholder="Global search…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Global search" />
      {q.length >= 2 && <div className="sres">{res.length ? res.map((r) => <button key={r.id} onClick={() => { nav(r.p); setQ(''); }}>{r.id} · {r.label} <small>{r.c}</small></button>) : <p className="muted">No matches</p>}</div>}</div>
  );
}

export default function App() {
  const s = useStore(); const [open, setOpen] = useState(false);
  if (!s.user) return <><Login /><Toasts /></>;
  const role = s.user.role; const ok = (r) => r === 'all' || r.split(',').includes(role);
  const unread = s.data.alerts.filter((a) => !a.read).length;
  const guard = (path, el) => { const n = NAV.find((x) => x[0] === path); return ok(n[3]) ? el : <Navigate to="/" />; };
  return (
    <div className="shell">
      <aside className={'side' + (open ? ' open' : '')}>
        <div className="brand"><span className="pulse" />RescueGrid</div>
        <nav>{NAV.filter((n) => ok(n[3])).map((n) => <NavLink key={n[0]} to={n[0]} end={n[0] === '/'} onClick={() => setOpen(false)}>{n[1]} {n[2]}</NavLink>)}</nav>
      </aside>
      <div className="main">
        <div className="demo">DEMO SYSTEM – all data, alerts and operations are simulated. No real emergency services are contacted.</div>
        <header className="top">
          <button className="btn ghost burger" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
          <Search />
          <NavLink to="/alerts" className="btn ghost">🔔{unread > 0 && <b className="dot">{unread}</b>}</NavLink>
          <button className="btn ghost" onClick={() => s.setSetting('theme', s.data.settings.theme === 'dark' ? 'light' : 'dark')}>{s.data.settings.theme === 'dark' ? '☀️' : '🌙'}</button>
          <span className="who">{s.user.name} <small>({role})</small></span>
          <button className="btn" onClick={() => s.setUser(null)}>Logout</button>
        </header>
        <main className="page"><EB><Suspense fallback={<Skel />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/incidents" element={guard('/incidents', <Incidents />)} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/resources" element={guard('/resources', <Resources />)} />
            <Route path="/teams" element={guard('/teams', <Teams />)} />
            <Route path="/requests" element={guard('/requests', <Requests />)} />
            <Route path="/hospitals" element={guard('/hospitals', <Hospitals />)} />
            <Route path="/sites" element={guard('/sites', <Sites />)} />
            <Route path="/volunteers" element={guard('/volunteers', <Volunteers />)} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={guard('/analytics', <Analytics />)} />
            <Route path="/audit" element={guard('/audit', <Audit />)} />
            <Route path="/settings" element={guard('/settings', <Settings />)} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes></Suspense></EB></main>
      </div>
      <Toasts />
    </div>
  );
}
function Toasts() { const { toasts } = useStore(); return <div className="toasts">{toasts.map((t) => <div key={t.id} className={'toast t-' + t.t}>{t.m}</div>)}</div>; }
