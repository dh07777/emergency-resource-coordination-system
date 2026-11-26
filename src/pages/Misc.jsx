import { useEffect, useRef, useState } from 'react';
import { useStore, auditAll, auditClear, fileAdd, fileList, fileDel } from '../store.jsx';
import { Confirm, Empty } from '../ui.jsx';
export function Alerts() {
  const { data, markRead, clearAlerts } = useStore(); const [lv, setLv] = useState('all');
  const list = data.alerts.filter((a) => lv === 'all' || a.level === lv);
  return (
    <>
      <div className="row between"><h2>Alerts & notifications</h2><div className="row"><select value={lv} onChange={(e) => setLv(e.target.value)}><option value="all">All</option><option>critical</option><option>warn</option><option>info</option></select><button className="btn" onClick={markRead}>Mark all read</button><button className="btn danger" onClick={clearAlerts}>Clear history</button></div></div>
      {list.length ? <div className="card">{list.map((a) => <div key={a.id} className={'alrow al-' + a.level}>{!a.read && <i className="pulse" />} {a.msg} <small className="muted">{new Date(a.t).toLocaleString()}</small></div>)}</div> : <Empty m="No alerts to show." />}
    </>
  );
}
export function Audit() {
  const [rows, setRows] = useState(null); const [err, setErr] = useState('');
  const load = () => auditAll().then(setRows).catch((e) => setErr(e.message)); useEffect(() => { load(); }, []);
  if (err) return <div className="empty"><p>Could not read IndexedDB: {err}</p></div>;
  return (
    <>
      <div className="row between"><h2>Activity audit log <small className="muted">(IndexedDB)</small></h2><button className="btn danger" onClick={() => auditClear().then(load)}>Clear log</button></div>
      {!rows ? <p>Loading…</p> : rows.length ? <div className="tw"><table><thead><tr><th>Time</th><th>User</th><th>Action</th></tr></thead><tbody>{rows.slice(0, 200).map((r) => <tr key={r.k}><td>{new Date(r.t).toLocaleString()}</td><td>{r.u}</td><td>{r.m}</td></tr>)}</tbody></table></div> : <Empty m="No audit entries yet." />}
    </>
  );
}
export function SelfTest() {
  const { data, toast } = useStore(); const [out, setOut] = useState([]);
  const run = async () => {
    const r = []; const t = (n, ok, m = '') => r.push([n, ok, m]);
    try { localStorage.setItem('rg_t', '1'); t('LocalStorage write/read', localStorage.getItem('rg_t') === '1'); localStorage.removeItem('rg_t'); } catch (e) { t('LocalStorage', false, e.message); }
    t('Persisted data matches state', JSON.parse(localStorage.getItem('rescuegrid_v1') || '{}').incidents?.length === data.incidents.length);
    try { const f = new File(['x'], 'selftest.txt'); await fileAdd('SELFTEST', f); const l = await fileList('SELFTEST'); t('IndexedDB file store', l.length > 0); for (const x of l) await fileDel(x.k); } catch (e) { t('IndexedDB', false, e.message); }
    t('No deployed team without incident', data.teams.filter((x) => x.status === 'Deployed').every((x) => data.incidents.some((i) => i.teamId === x.id && !['Resolved', 'Closed'].includes(i.status))), 'Teams marked Deployed must have an active incident');
    t('Resources: available ≤ total', data.resources.every((x) => x.available <= x.total && x.available >= 0));
    t('Unique incident IDs', new Set(data.incidents.map((i) => i.id)).size === data.incidents.length);
    setOut(r); toast('Self-test finished');
  };
  return <div className="card"><h3>Built-in self-test</h3><button className="btn" onClick={run}>Run self-test</button>{out.map(([n, ok, m]) => <p key={n} className={ok ? '' : 'err'}>{ok ? '✅' : '❌'} {n} {m}</p>)}</div>;
}
export function Settings() {
  const { data, setSetting, reset, importData } = useStore(); const [c, setC] = useState(false); const f = useRef();
  const exp = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })); a.download = 'rescuegrid-backup-DEMO.json'; a.click(); };
  return (
    <>
      <h2>Settings</h2>
      <div className="card stack">
        <label className="chk"><input type="checkbox" checked={data.settings.theme === 'dark'} onChange={(e) => setSetting('theme', e.target.checked ? 'dark' : 'light')} /> Dark mode</label>
        <label className="chk"><input type="checkbox" checked={data.settings.live} onChange={(e) => setSetting('live', e.target.checked)} /> Simulated live updates</label>
        <div className="row"><button className="btn" onClick={exp}>Export JSON</button><button className="btn ghost" onClick={() => f.current.click()}>Import JSON</button><button className="btn danger" onClick={() => setC(true)}>Reset demo data</button>
          <input ref={f} type="file" accept=".json" hidden onChange={(e) => { const r = new FileReader(); r.onload = () => importData(r.result); r.readAsText(e.target.files[0]); e.target.value = ''; }} /></div>
      </div>
      <div className="card"><h3>Requires a real backend in production</h3><ul><li>Real authentication, roles and sessions (login here is a demo)</li><li>Live incident feeds, real map tiles and GPS tracking</li><li>Contacting emergency services, SMS/push notifications</li><li>Shared multi-user data, audit integrity and secure storage</li></ul></div>
      <SelfTest />
      {c && <Confirm msg="Reset all data to the original demo set?" onNo={() => setC(false)} onYes={() => { reset(); setC(false); }} />}
    </>
  );
}
