import { useState } from 'react';
import { useStore } from '../store.jsx';
import { Badge, Confirm, Empty, Modal, Skel, useLoading } from '../ui.jsx';

export function Pick({ title, label, options, onOk, onClose, number, max }) {
  const [v, setV] = useState(number ? 1 : options?.[0]?.v ?? '');
  return (
    <Modal title={title} onClose={onClose}>
      <label>{label}{number ? <input type="number" min="1" max={max} value={v} onChange={(e) => setV(+e.target.value)} /> :
        <select value={v} onChange={(e) => setV(e.target.value)}>{options.length ? options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>) : <option value="">No options available</option>}</select>}</label>
      <div className="row end"><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" disabled={!number && !v} onClick={() => { if (onOk(v) !== false) onClose(); }}>Confirm</button></div>
    </Modal>
  );
}

export default function Crud({ col, title, fields, columns, filter, actions, defaults = {}, validate }) {
  const s = useStore(); const { data, add, update, remove } = s; const loading = useLoading();
  const [q, setQ] = useState(''); const [f, setF] = useState('All'); const [form, setForm] = useState(null); const [del, setDel] = useState(null); const [pick, setPick] = useState(null);
  if (loading) return <Skel />;
  const rows = data[col].filter((r) => (f === 'All' || r[filter.k] === f) && JSON.stringify(r).toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="row between"><h2>{title}</h2><button className="btn" onClick={() => setForm({ id: null, v: { ...Object.fromEntries(fields.map((x) => [x.k, x.def ?? (x.opts ? x.opts[0] : x.t === 'number' ? 0 : '')])), ...defaults, reportedAt: new Date().toISOString().slice(0, 16) }, e: {} })}>+ Add</button></div>
      <div className="row"><input placeholder={`Search ${title.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} />
        {filter && <select value={f} onChange={(e) => setF(e.target.value)}><option>All</option>{filter.opts.map((o) => <option key={o}>{o}</option>)}</select>}</div>
      {rows.length === 0 ? <Empty m={q || f !== 'All' ? 'No records match your filters.' : undefined} /> : (
        <div className="tw"><table><thead><tr>{columns.map((c) => <th key={c.k}>{c.l}</th>)}<th>Actions</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}>{columns.map((c) => <td key={c.k} data-l={c.l}>{c.r ? c.r(r, data) : c.badge ? <Badge v={r[c.k]} /> : String(r[c.k] ?? '')}</td>)}
            <td className="acts"><button className="btn sm" onClick={() => setForm({ id: r.id, v: { ...r }, e: {} })}>Edit</button>
              {actions?.(r, s, setPick)}<button className="btn sm danger" onClick={() => setDel(r)}>Delete</button></td></tr>)}</tbody></table></div>
      )}
      {form && <Modal title={(form.id ? 'Edit ' : 'New ') + title} onClose={() => setForm(null)}>
        <form onSubmit={(e) => {
          e.preventDefault(); const er = {};
          fields.forEach((x) => { const v = form.v[x.k]; if (x.req && String(v).trim() === '') er[x.k] = 'Required'; else if (x.t === 'number') { if (v === '' || isNaN(+v)) er[x.k] = 'Enter a number'; else if (x.min !== undefined && +v < x.min) er[x.k] = `Min ${x.min}`; else if (x.max !== undefined && +v > x.max) er[x.k] = `Max ${x.max}`; } });
          const ve = validate?.(form.v); if (ve) Object.assign(er, ve);
          if (Object.keys(er).length) return setForm({ ...form, e: er });
          const out = { ...form.v }; fields.forEach((x) => { if (x.t === 'number') out[x.k] = +out[x.k]; });
          if (col === 'incidents') out.reportedAt = new Date(out.reportedAt).toISOString();
          form.id ? update(col, form.id, out) : add(col, out); setForm(null);
        }}>
          {fields.map((x) => <label key={x.k}>{x.l}{x.opts ? <select value={form.v[x.k]} onChange={(e) => setForm({ ...form, v: { ...form.v, [x.k]: e.target.value } })}>{x.opts.map((o) => <option key={o}>{o}</option>)}</select>
            : x.t === 'textarea' ? <textarea rows="3" value={form.v[x.k]} onChange={(e) => setForm({ ...form, v: { ...form.v, [x.k]: e.target.value } })} />
              : <input type={x.t || 'text'} value={form.v[x.k]} onChange={(e) => setForm({ ...form, v: { ...form.v, [x.k]: e.target.value } })} />}
            {form.e[x.k] && <span className="err">{form.e[x.k]}</span>}</label>)}
          <div className="row end"><button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn">Save</button></div>
        </form></Modal>}
      {del && <Confirm msg={`Delete ${del.id}? This cannot be undone.`} onNo={() => setDel(null)} onYes={() => { remove(col, del.id); setDel(null); }} />}
      {pick && (pick.render ? pick.render(() => setPick(null)) : <Pick {...pick} onClose={() => setPick(null)} />)}
    </>
  );
}
