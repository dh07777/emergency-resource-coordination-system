import { useStore, score } from '../store.jsx';
import { Bars, Badge, Empty, Skel, useLoading } from '../ui.jsx';
export default function Dashboard() {
  const { data } = useStore(); const loading = useLoading(); if (loading) return <Skel n={6} />;
  const inc = data.incidents; const active = inc.filter((i) => !['Resolved', 'Closed'].includes(i.status));
  const crit = active.filter((i) => i.severity === 'Critical');
  const res = data.resources; const amb = res.find((r) => r.name === 'Ambulances');
  const stats = [
    ['Total cases', inc.length], ['Active', active.length], ['Resolved', inc.length - active.length], ['Teams available', data.teams.filter((t) => t.status === 'Available').length],
    ['Ambulances free', amb ? amb.available : 0], ['Resource units free', res.reduce((a, r) => a + r.available, 0)], ['Critical alerts', crit.length + data.alerts.filter((a) => a.level === 'critical' && !a.read).length],
  ];
  const timeline = [...inc].sort((a, b) => b.reportedAt.localeCompare(a.reportedAt)).slice(0, 6);
  return (
    <>
      <h2>Emergency dashboard <span className="live"><i className="pulse" /> live (simulated)</span></h2>
      <div className="grid stats">{stats.map(([l, v], i) => <div key={l} className={'card stat' + (i === 6 && v ? ' crit' : '')}><small>{l}</small><b>{v}</b></div>)}</div>
      <div className="grid two">
        <div className="card"><h3>Active incidents by severity</h3><Bars data={['Low', 'Medium', 'High', 'Critical'].map((s) => ({ l: s, v: active.filter((i) => i.severity === s).length, c: { Low: '#4cc9f0', Medium: '#f4d35e', High: '#ff8c1a', Critical: '#e63946' }[s] }))} /></div>
        <div className="card"><h3>Resource availability %</h3><Bars data={res.map((r) => ({ l: r.name, v: (r.available / r.total) * 100, c: r.available <= r.minThreshold ? '#e63946' : '#2ec4b6' }))} /></div>
      </div>
      <div className="grid two">
        <div className="card"><h3>Activity timeline</h3>{timeline.length ? <ul className="tl">{timeline.map((i) => <li key={i.id}><b>{new Date(i.reportedAt).toLocaleTimeString()}</b> {i.id} {i.title} <Badge v={i.status} /> <small>score {Math.round(score(i))}</small></li>)}</ul> : <Empty />}</div>
        <div className="card"><h3>Latest alerts</h3>{data.alerts.length ? <ul className="tl">{data.alerts.slice(0, 6).map((a) => <li key={a.id} className={'al-' + a.level}>{a.msg}</li>)}</ul> : <Empty m="No alerts." />}</div>
      </div>
    </>
  );
}
