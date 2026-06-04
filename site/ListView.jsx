/* Loaner — list view */
const Lp = window.Loaner;

function ScenarioRow({ s, selected, selectable, onToggle, onOpen, onDuplicate, onDelete }) {
  const d = Lp.computeDerived(s);
  return (
    <tr className={'srow' + (selected ? ' sel' : '')}>
      <td className="c-check">
        <label className={'chk' + (!selectable && !selected ? ' disabled' : '')}>
          <input
            type="checkbox"
            checked={selected}
            disabled={!selectable && !selected}
            onChange={() => onToggle(s.id)}
          />
          <span className="chk-box"><Icon name="check" size={13} /></span>
        </label>
      </td>
      <td className="c-name" onClick={() => onOpen(s.id)}>
        <div className="name-wrap">
          <span className="swatch" style={{ background: s.color }}></span>
          <div className="name-cell">
            <div className="nm">
              {s.name}
              {d.hasBuydown ? <span className="bd-badge">buydown</span> : null}
            </div>
            <div className="sub">{s.termYears}-year term</div>
          </div>
        </div>
      </td>
      <td className="c-num strong" onClick={() => onOpen(s.id)}>
        <Money0 v={d.monthly} />
        <div className="sub">{d.hasBuydown ? `yr 1 ${Lp.fmtMoney0(d.firstYearMonthly)}` : 'per month'}</div>
      </td>
      <td className="c-num" onClick={() => onOpen(s.id)}>
        <Pct v={s.rate} dp={3} />
        <div className="sub">{Lp.fmtPct(s.apr, 3)} APR</div>
      </td>
      <td className="c-num dim" onClick={() => onOpen(s.id)}><Money0 v={d.loanAmount} /></td>
      <td className="c-num dim" onClick={() => onOpen(s.id)}>{Lp.fmtPct(d.ltv * 100, 1)}</td>
      <td className="c-num dim" onClick={() => onOpen(s.id)}><Money0 v={d.cashToClose} /></td>
      <td className="c-act">
        <div className="row-actions">
          <IconBtn icon="edit" title="Edit" onClick={() => onOpen(s.id)} />
          <IconBtn icon="copy" title="Duplicate" onClick={() => onDuplicate(s.id)} />
          <IconBtn icon="trash" title="Delete" danger onClick={() => onDelete(s.id)} />
        </div>
      </td>
    </tr>
  );
}

function ListView({ scenarios, selected, maxCompare, onToggle, onClearSel, onOpen, onNew, onDuplicate, onDelete, onCompare, onReset }) {
  const selectable = selected.length < maxCompare;
  const atCap = selected.length >= maxCompare;
  const [copyFlash, setCopyFlash] = useState(false);

  const handleShare = async () => {
    try {
      const encoded = await Lp.encodeShare(scenarios);
      const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`;
      await navigator.clipboard.writeText(url);
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1500);
    } catch (e) {}
  };

  return (
    <div className="list-view">
      <div className="list-head">
        <div className="lh-left">
          <h1>Scenarios</h1>
          <span className="count-pill">{scenarios.length}</span>
        </div>
        <div className="lh-right">
          <Btn kind="ghost" icon="upload" onClick={handleShare}>{copyFlash ? 'Copied!' : 'Share link'}</Btn>
          <Btn kind="ghost" icon="reset" onClick={onReset}>Reset to examples</Btn>
          <Btn kind="solid" icon="plus" onClick={onNew}>New scenario</Btn>
        </div>
      </div>

      <div className="table-wrap">
        <table className="ltable">
          <thead>
            <tr>
              <th className="c-check"></th>
              <th className="c-name">Scenario</th>
              <th className="c-num">Monthly</th>
              <th className="c-num">Rate / APR</th>
              <th className="c-num dim">Loan amt</th>
              <th className="c-num dim">LTV</th>
              <th className="c-num dim">Cash to close</th>
              <th className="c-act"></th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => (
              <ScenarioRow
                key={s.id} s={s}
                selected={selected.includes(s.id)}
                selectable={selectable}
                onToggle={onToggle} onOpen={onOpen}
                onDuplicate={onDuplicate} onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
        {scenarios.length === 0 ? (
          <div className="empty">
            <p>No scenarios yet.</p>
            <Btn kind="solid" icon="plus" onClick={onNew}>Create your first scenario</Btn>
          </div>
        ) : null}
      </div>

      <div className={'select-bar' + (selected.length ? ' show' : '')}>
        <div className="sb-inner">
          <div className="sb-info">
            <strong>{selected.length}</strong> selected
            <span className="sb-hint">{atCap ? `max ${maxCompare} reached` : `compare up to ${maxCompare}`}</span>
          </div>
          <div className="sb-actions">
            <Btn kind="ghost" onClick={onClearSel}>Clear</Btn>
            <Btn kind="solid" icon="columns" disabled={selected.length < 2} onClick={onCompare}>
              Compare {selected.length >= 2 ? `(${selected.length})` : ''}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ListView = ListView;
