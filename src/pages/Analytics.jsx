import { useMemo } from 'react';
import { useStore } from '../store.jsx';
import { Bars, Donut } from '../ui.jsx';
const group = (arr, f) => arr.reduce((m, x) => { const k = f(x); m[k] = (m[k] || 0) + 1; return m; }, {});
export default function Analytics() {
  const { data, toast } = useStore(); const inc = data.incidents;
  const byCat = useMemo(() => Object.entries(group(inc, (i) => i.category)).map(([l, v]) => ({ l, v })), [inc]);
  const bySev = useMemo(() => Object.entries(group(inc, (i) => i.severity)).map(([l, v]) => ({ l, v })), [inc]);
  const day = Object.entries(group(inc, (i) => i.reportedAt.slice(0, 10))).sort(); const mon = Object.entries(group(inc, (i) => i.reportedAt.slice(0, 7))).sort();
  const resp = inc.filter((i) => i.responseMin > 0); const avg = resp.length ? Math.round(resp.reduce((a, i) => a + i.responseMin, 0) / resp.length) : 0;
  const csv = () => {
    const keys = Object.keys(inc[0] || { id: '' }); const rows = [keys.join(','), ...inc.map((i) => keys.map((k) => `"${String(i[k] ?? '').replace(/"/g, '""')}"`).join(','))];
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' })); a.download = 'rescuegrid-incidents-DEMO.csv'; a.click(); toast('CSV exported');
  };
  return (
    <>
      <div className="row between"><h2>Analytics & reports</h2><div className="row"><button className="btn" onClick={csv}>Export CSV</button><button className="btn ghost" onClick={() => window.print()}>Print report</button></div></div>
      <p className="muted">Simulated demo statistics. Avg simulated response time: <b>{avg} min</b></p>
      <div className="grid two">
        <div className="card"><h3>Incidents by category</h3><Donut data={byCat} /></div>
        <div className="card"><h3>Severity analytics</h3><Bars data={bySev} /></div>
        <div className="card"><h3>Resource utilization %</h3><Bars data={data.resources.map((r) => ({ l: r.name, v: ((r.total - r.available) / r.total) * 100 }))} color="var(--orange)" /></div>
        <div className="card"><h3>Team performance</h3><Bars data={data.teams.map((t) => ({ l: t.name.split(' ')[0], v: t.performance }))} color="#4cc9f0" /></div>
        <div className="card"><h3>Daily report</h3><table><tbody>{day.map(([d, n]) => <tr key={d}><td>{d}</td><td>{n} incidents</td></tr>)}</tbody></table></div>
        <div className="card"><h3>Monthly report</h3><table><tbody>{mon.map(([d, n]) => <tr key={d}><td>{d}</td><td>{n} incidents</td></tr>)}</tbody></table></div>
      </div>
    </>
  );
}
