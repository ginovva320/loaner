/* Loaner — comparison view */
const Lc = window.Loaner;

function rows() {
  const m = Lc.fmtMoney0, mp = (v) => Lc.fmtMoney(v, 2);
  return {
    params: [
      { label: 'Term', get: (s) => s.termYears + ' yr', raw: false },
      { label: 'Purchase price', get: (s) => s.purchasePrice, fmt: m },
      { label: 'Down payment', get: (s) => s.downPayment, fmt: m },
      { label: 'Loan amount', get: (s, d) => d.loanAmount, fmt: m },
      { label: 'LTV', get: (s, d) => d.ltv * 100, fmt: (v) => Lc.fmtPct(v, 1), dir: 'low' },
      { label: 'Interest rate', get: (s) => s.rate, fmt: (v) => Lc.fmtPct(v, 3), dir: 'low' },
      { label: 'APR', get: (s) => s.apr, fmt: (v) => Lc.fmtPct(v, 3), dir: 'low' },
    ],
    monthly: [
      { label: 'First mortgage P&I', get: (s, d) => d.housing.pi, fmt: mp, dir: 'low' },
      { label: "Homeowner's insurance", get: (s) => s.homeownersInsMonthly, fmt: mp },
      { label: 'Property taxes', get: (s) => s.propertyTaxMonthly, fmt: mp },
      { label: 'Mortgage insurance', get: (s) => s.mortgageInsMonthly, fmt: mp, dir: 'low' },
      { label: 'HOA dues', get: (s) => s.hoaMonthly, fmt: mp },
      { label: 'Total monthly payment', get: (s, d) => d.monthly, fmt: mp, dir: 'low', strong: true },
    ],
    closing: [
      { label: 'Lender fees', get: (s, d) => d.lenderTotal, fmt: m, dir: 'low' },
      { label: 'Points (% of loan)', get: (s, d) => d.pointsPct, fmt: (v) => Lc.fmtPct(v, 3) },
      { label: 'Third-party fees', get: (s, d) => d.thirdPartyTotal, fmt: m, dir: 'low' },
      { label: 'Taxes & gov fees', get: (s, d) => d.govTotal, fmt: m, dir: 'low' },
      { label: 'Prepaids & escrow', get: (s, d) => d.prepaidsEscrowTotal, fmt: m, dir: 'low' },
      { label: 'Total closing costs', get: (s, d) => d.totalClosingCosts, fmt: m, dir: 'low', strong: true },
    ],
    cash: [
      { label: 'Funds due (before credits)', get: (s, d) => d.fundsDue, fmt: m },
      { label: 'Credits applied to costs', get: (s, d) => d.creditsApplied, fmt: m },
      { label: 'Remaining credits', get: (s, d) => d.creditsRemaining, fmt: m, dir: 'high', optional: true },
      { label: 'Cash to close', get: (s, d) => d.cashToClose, fmt: m, dir: 'low', strong: true },
      { label: 'Lifetime interest', get: (s, d) => d.interest, fmt: m, dir: 'low', strong: true },
    ],
  };
}

function bestWorst(values, dir) {
  if (!dir) return {};
  const nums = values.map((v) => (typeof v === 'number' ? v : NaN)).filter((v) => !isNaN(v));
  if (nums.length < 2) return {};
  const min = Math.min(...nums), max = Math.max(...nums);
  if (min === max) return {};
  const best = dir === 'low' ? min : max;
  const worst = dir === 'low' ? max : min;
  return { best, worst };
}

function CompareRow({ r, scen, derived }) {
  const vals = scen.map((s, i) => r.get(s, derived[i]));
  const bw = bestWorst(vals, r.dir);
  return (
    <tr className={'cmp-row' + (r.strong ? ' strong' : '')}>
      <th className="cmp-label">{r.label}</th>
      {scen.map((s, i) => {
        const v = vals[i];
        const isNum = typeof v === 'number';
        let cls = 'cmp-cell';
        if (bw.best !== undefined && isNum) {
          if (v === bw.best) cls += ' best';
          else if (v === bw.worst) cls += ' worst';
        }
        return (
          <td className={cls} key={s.id}>
            <span className={isNum ? 'num' : 'txt'}>{r.fmt ? r.fmt(v) : v}</span>
            {cls.includes('best') ? <span className="bw-tag best-tag">best</span> : null}
            {cls.includes('worst') ? <span className="bw-tag worst-tag">worst</span> : null}
          </td>
        );
      })}
    </tr>
  );
}

function CompareView({ scenarios, onBack, onOpen, onRemove }) {
  const R = rows();
  const derived = scenarios.map((s) => Lc.computeDerived(s));

  // Add per-year P&I rows for however many buydown years appear across scenarios
  const maxBdYears = Math.max(...derived.map(d => d.buydownSchedule.length), 0);
  const monthlyRows = [...R.monthly];
  for (let i = 0; i < maxBdYears; i++) {
    const yr = i + 1;
    monthlyRows.push({
      label: `Year ${yr} P&I (buydown)`,
      get: (s, d) => d.buydownSchedule[i] ? d.buydownSchedule[i].pi : null,
      fmt: (v) => v === null ? '—' : Lc.fmtMoney(v, 2),
    });
  }

  const groups = [
    ['Loan parameters', R.params],
    ['Monthly payment', monthlyRows],
    ['Closing costs', R.closing],
    ['Cash to close', R.cash],
  ];
  const visible = (rs) => rs.filter((r) => {
    if (!r.optional) return true;
    return scenarios.some((s, i) => Math.abs(Number(r.get(s, derived[i])) || 0) > 0.005);
  });
  return (
    <div className="compare-view">
      <div className="cmp-top">
        <button className="back" onClick={onBack}><Icon name="chevL" size={16} />All scenarios</button>
        <div className="cmp-title"><Icon name="columns" size={16} /><span>Comparing {scenarios.length} scenarios</span></div>
        <div className="cmp-legend">
          <span className="lg lg-best">best</span>
          <span className="lg lg-worst">worst</span>
        </div>
      </div>

      <div className="cmp-scroll">
        <table className={'cmp-table cols-' + scenarios.length}>
          <colgroup>
            <col className="col-label" />
            {scenarios.map((s) => <col key={s.id} className="col-scen" />)}
          </colgroup>
          <thead>
            <tr className="cmp-head">
              <th className="cmp-corner">Metric</th>
              {scenarios.map((s, i) => {
                const d = derived[i];
                return (
                  <th className="cmp-colhead" key={s.id} style={{ borderTopColor: s.color }}>
                    <div className="ch-top">
                      <span className="swatch" style={{ background: s.color }}></span>
                      <IconBtn icon="x" title="Remove from comparison" onClick={() => onRemove(s.id)} />
                    </div>
                    <button className="ch-name" onClick={() => onOpen(s.id)} title="Open to edit">{s.name}</button>
                    <div className="ch-big"><span className="num">{Lc.fmtMoney0(d.monthly)}</span><span className="ch-mo">/mo</span></div>
                    <div className="ch-rate num">{Lc.fmtPct(s.rate, 3)} · {Lc.fmtPct(d.ltv * 100, 0)} LTV</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {groups.map(([title, rs]) => {
              const visRows = visible(rs);
              if (!visRows.length) return null;
              return (
                <React.Fragment key={title}>
                  <tr className="cmp-group"><th className="cmp-grouplabel" colSpan={scenarios.length + 1}>{title}</th></tr>
                  {visRows.map((r) => <CompareRow key={r.label} r={r} scen={scenarios} derived={derived} />)}
                </React.Fragment>
              );
            })}
            {scenarios.some((s) => s.notes) ? (
              <React.Fragment>
                <tr className="cmp-group"><th className="cmp-grouplabel" colSpan={scenarios.length + 1}>Notes</th></tr>
                <tr className="cmp-row notes-row">
                  <th className="cmp-label">Notes</th>
                  {scenarios.map((s) => <td className="cmp-cell note-cell" key={s.id}><span className="txt">{s.notes || '—'}</span></td>)}
                </tr>
              </React.Fragment>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.CompareView = CompareView;
