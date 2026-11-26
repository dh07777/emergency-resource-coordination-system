import { useState } from 'react';
import { useStore } from '../store.jsx';
const ROLES = [['admin', 'Admin'], ['coordinator', 'Emergency coordinator'], ['team', 'Rescue team'], ['volunteer', 'Volunteer']];
export default function Login() {
  const { setUser } = useStore(); const [role, setRole] = useState('admin'); const [name, setName] = useState('Demo User'); const [pw, setPw] = useState('demo123'); const [err, setErr] = useState('');
  const go = (e) => { e.preventDefault(); if (name.trim().length < 2) return setErr('Enter a name (2+ characters).'); if (pw !== 'demo123') return setErr('Demo password is demo123.'); setUser({ name: name.trim(), role }); };
  return (
    <div className="login"><form className="card lg" onSubmit={go}>
      <div className="brand"><span className="pulse" />RescueGrid</div><p className="muted">Emergency Resource Coordination – DEMO. Simulated data only.</p>
      <div className="roles">{ROLES.map(([k, l]) => <button type="button" key={k} className={'btn ' + (role === k ? '' : 'ghost')} onClick={() => setRole(k)}>{l}</button>)}</div>
      <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Password (demo123)<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
      {err && <p className="err">{err}</p>}
      <button className="btn" style={{ width: '100%' }}>Sign in as {ROLES.find((r) => r[0] === role)[1]}</button>
    </form></div>
  );
}
