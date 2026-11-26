import { Component, useEffect, useState } from 'react';
export const useLoading = (ms = 450) => { const [l, s] = useState(true); useEffect(() => { const t = setTimeout(() => s(false), ms); return () => clearTimeout(t); }, [ms]); return l; };
export const Skel = ({ n = 5 }) => <div>{Array.from({ length: n }, (_, i) => <div key={i} className="skel" />)}</div>;
export const Empty = ({ m = 'Nothing here yet. Add a record to get started.' }) => <div className="empty"><div style={{ fontSize: 34 }}>📭</div><p>{m}</p></div>;
export const Badge = ({ v }) => <span className={'badge b-' + String(v).toLowerCase().replace(/\W+/g, '')}>{v}</span>;
export const Modal = ({ title, onClose, children }) => (
  <div className="ov" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}><h3>{title}</h3>{children}</div></div>
);
export const Confirm = ({ msg, onYes, onNo }) => (
  <Modal title="Please confirm" onClose={onNo}><p>{msg}</p><div className="row end"><button className="btn ghost" onClick={onNo}>Cancel</button><button className="btn danger" onClick={onYes}>Confirm</button></div></Modal>
);
export class EB extends Component {
  state = { e: null };
  static getDerivedStateFromError(e) { return { e }; }
  render() { return this.state.e ? <div className="empty"><div style={{ fontSize: 34 }}>⚠️</div><p>Something went wrong: {String(this.state.e.message)}</p><button className="btn" onClick={() => this.setState({ e: null })}>Retry</button></div> : this.props.children; }
}
export function Bars({ data, color = 'var(--red)' }) {
  const max = Math.max(1, ...data.map((d) => d.v)); const w = 300 / data.length;
  return (
    <svg viewBox="0 0 300 140" className="chart">
      {data.map((d, i) => { const h = (d.v / max) * 95; return (
        <g key={d.l}><rect className="bar" x={i * w + 6} y={110 - h} width={w - 12} height={h} rx="3" fill={d.c || color} style={{ animationDelay: i * 60 + 'ms' }} />
          <text x={i * w + w / 2} y={106 - h} textAnchor="middle" className="ct">{Math.round(d.v * 10) / 10}</text>
          <text x={i * w + w / 2} y={126} textAnchor="middle" className="cl">{d.l.slice(0, 9)}</text></g>); })}
    </svg>
  );
}
export function Donut({ data }) {
  const tot = data.reduce((a, d) => a + d.v, 0) || 1; let off = 0; const cols = ['#e63946', '#ff8c1a', '#4cc9f0', '#2ec4b6', '#9b5de5', '#f4d35e'];
  return (
    <div className="row"><svg viewBox="0 0 42 42" width="130" height="130"><circle cx="21" cy="21" r="15.9" fill="none" stroke="var(--line)" strokeWidth="6" />
      {data.map((d, i) => { const p = (d.v / tot) * 100; const e = <circle key={d.l} cx="21" cy="21" r="15.9" fill="none" stroke={cols[i % 6]} strokeWidth="6" strokeDasharray={`${p} ${100 - p}`} strokeDashoffset={25 - off} />; off += p; return e; })}</svg>
      <div>{data.map((d, i) => <div key={d.l} className="leg"><i style={{ background: cols[i % 6] }} />{d.l}: {d.v}</div>)}</div></div>
  );
}
