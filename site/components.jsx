/* Loaner — shared UI components. Exports to window. */
const { useState, useRef, useEffect } = React;
const L = window.Loaner;

/* ---------- minimal line icons ---------- */
function Icon({ name, size = 16 }) {
  const p = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  const paths = {
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>,
    trash: <><path d="M4 7h16" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    x: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
    check: <polyline points="5 12 10 17 19 7" />,
    chevL: <polyline points="15 5 8 12 15 19" />,
    chevR: <polyline points="9 5 16 12 9 19" />,
    columns: <><rect x="3" y="4" width="7" height="16" rx="1" /><rect x="14" y="4" width="7" height="16" rx="1" /></>,
    up: <polyline points="6 14 12 8 18 14" />,
    down: <polyline points="6 10 12 16 18 10" />,
    reset: <><path d="M4 12a8 8 0 1 0 2.3-5.6" /><polyline points="4 4 4 8 8 8" /></>,
    note: <><path d="M5 4h11l3 3v13H5z" /><path d="M16 4v4h4" /><line x1="8" y1="12" x2="15" y2="12" /><line x1="8" y1="16" x2="13" y2="16" /></>,
    upload: <><line x1="5" y1="21" x2="19" y2="21" /><line x1="12" y1="19" x2="12" y2="11" /><polyline points="8 11 12 7 16 11" /></>,
  };
  return <svg {...p} className="icn">{paths[name] || null}</svg>;
}

/* ---------- buttons ---------- */
function Btn({ kind = 'ghost', icon, children, ...rest }) {
  return (
    <button className={'btn btn-' + kind} {...rest}>
      {icon ? <Icon name={icon} size={15} /> : null}
      {children ? <span>{children}</span> : null}
    </button>
  );
}
function IconBtn({ icon, title, danger, ...rest }) {
  return (
    <button className={'iconbtn' + (danger ? ' danger' : '')} title={title} aria-label={title} {...rest}>
      <Icon name={icon} size={16} />
    </button>
  );
}

/* ---------- value displays ---------- */
const Money = ({ v, dp = 2, className = '' }) => <span className={'num ' + className}>{L.fmtMoney(v, dp)}</span>;
const Money0 = ({ v, className = '' }) => <span className={'num ' + className}>{L.fmtMoney0(v)}</span>;
const Pct = ({ v, dp = 3, className = '' }) => <span className={'num ' + className}>{L.fmtPct(v, dp)}</span>;

/* ---------- inputs ---------- */
function moneyToNumber(str) {
  const n = parseFloat(String(str).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

function MoneyInput({ value, onChange, align = 'right', dp = 2 }) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const display = focused ? draft : L.fmtNum(value, dp);
  return (
    <input
      className="inp num"
      style={{ textAlign: align }}
      inputMode="decimal"
      value={display}
      onFocus={(e) => { setFocused(true); setDraft(String(value)); requestAnimationFrame(() => e.target.select()); }}
      onChange={(e) => { setDraft(e.target.value); onChange(moneyToNumber(e.target.value)); }}
      onBlur={() => setFocused(false)}
    />
  );
}

function PctInput({ value, onChange, dp = 3 }) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  return (
    <div className="suffix-wrap">
      <input
        className="inp num"
        style={{ textAlign: 'right' }}
        inputMode="decimal"
        value={focused ? draft : L.fmtNum(value, dp)}
        onFocus={(e) => { setFocused(true); setDraft(String(value)); requestAnimationFrame(() => e.target.select()); }}
        onChange={(e) => { setDraft(e.target.value); onChange(moneyToNumber(e.target.value)); }}
        onBlur={() => setFocused(false)}
      />
      <span className="suffix">%</span>
    </div>
  );
}

function TextInput({ value, onChange, placeholder }) {
  return <input className="inp" value={value || ''} placeholder={placeholder || ''} onChange={(e) => onChange(e.target.value)} />;
}

function SelectInput({ value, onChange, options }) {
  return (
    <div className="select-wrap">
      <select className="inp sel" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="select-caret"><Icon name="down" size={13} /></span>
    </div>
  );
}

/* multi-unit amount input — canonical stored value + switchable display unit */
function UnitAmount({ value, units, ctx = {}, onChange, defaultUnit }) {
  const [u, setU] = useState(defaultUnit || units[0].key);
  const unit = units.find((x) => x.key === u) || units[0];
  const disp = unit.to(value, ctx);
  const handle = (v) => onChange(unit.from(v, ctx));
  return (
    <div className="unitamt">
      {unit.kind === 'pct'
        ? <PctInput value={disp} onChange={handle} dp={unit.dp != null ? unit.dp : 2} />
        : <MoneyInput value={disp} onChange={handle} dp={unit.dp != null ? unit.dp : 2} />}
      <div className="unit-sel-wrap">
        <select className="unit-sel" value={u} onChange={(e) => setU(e.target.value)}>
          {units.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
        </select>
        <span className="unit-caret"><Icon name="down" size={11} /></span>
      </div>
    </div>
  );
}

/* labelled field row */
function Field({ label, hint, children, locked }) {
  return (
    <div className={'field' + (locked ? ' field-locked' : '')}>
      <div className="field-label">
        {label}
        {locked ? <span className="lock-tag"><Icon name="lock" size={11} />derived</span> : null}
      </div>
      <div className="field-control">{children}</div>
      {hint ? <div className="field-hint">{hint}</div> : null}
    </div>
  );
}

/* read-only derived value display */
function Derived({ children }) {
  return <div className="derived-val">{children}</div>;
}

/* editable fee line list */
function LineEditor({ items, onChange }) {
  const update = (id, patch) => onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => onChange(items.filter((it) => it.id !== id));
  const add = () => onChange([...items, L.line('New line item', 0)]);
  const total = L.sum(items);
  return (
    <div className="lines">
      {items.map((it) => (
        <div className="line-row" key={it.id}>
          <input className="inp line-label" value={it.label} onChange={(e) => update(it.id, { label: e.target.value })} />
          <div className="line-amt"><MoneyInput value={it.amount} onChange={(v) => update(it.id, { amount: v })} /></div>
          <IconBtn icon="x" title="Remove line" onClick={() => remove(it.id)} />
        </div>
      ))}
      <div className="line-foot">
        <button className="addline" onClick={add}><Icon name="plus" size={13} />Add line</button>
        <div className="line-total">
          <span>Subtotal</span><Money v={total} />
        </div>
      </div>
    </div>
  );
}

/* collapsible section */
function Section({ title, sub, right, defaultOpen = true, children, accent }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={'sect' + (open ? '' : ' closed')}>
      <header className="sect-head" onClick={() => setOpen(!open)}>
        <span className="sect-caret"><Icon name={open ? 'down' : 'chevR'} size={14} /></span>
        <h3 style={accent ? { color: accent } : null}>{title}</h3>
        {sub ? <span className="sect-sub">{sub}</span> : null}
        <div className="sect-right" onClick={(e) => e.stopPropagation()}>{right}</div>
      </header>
      {open ? <div className="sect-body">{children}</div> : null}
    </section>
  );
}

Object.assign(window, {
  Icon, Btn, IconBtn, Money, Money0, Pct,
  MoneyInput, PctInput, TextInput, SelectInput, UnitAmount,
  Field, Derived, LineEditor, Section,
});
