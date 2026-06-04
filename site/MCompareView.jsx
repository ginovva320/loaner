/* Loaner mobile — compare view (metric-led accordion, direction C) */
(function () {
  const { useState } = React;
  const Lm = window.Loaner;
  const m = Lm.fmtMoney0;

  const METRICS = [
    { label: 'Total monthly payment', group: 'Monthly',       get: (s, d) => d.monthly,           fmt: m,                              dir: 'low', initOpen: true },
    { label: 'Year 1 payment',        group: 'Monthly',       get: (s, d) => d.firstYearMonthly,  fmt: m,                              dir: 'low', optional: true },
    { label: 'Cash to close',         group: 'Upfront',       get: (s, d) => d.cashToClose,        fmt: m,                              dir: 'low', initOpen: true },
    { label: 'Total closing costs',   group: 'Upfront',       get: (s, d) => d.totalClosingCosts,  fmt: m,                              dir: 'low' },
    { label: 'Interest rate',         group: 'Cost of money', get: (s)    => s.rate,               fmt: (v) => Lm.fmtPct(v, 3),        dir: 'low' },
    { label: 'Lifetime interest',     group: 'Cost of money', get: (s, d) => d.interest,           fmt: m,                              dir: 'low' },
  ];

  function MCompareView({ scenarios, onBack, onOpen }) {
    const derived = scenarios.map((s) => Lm.computeDerived(s));

    const visible = METRICS.filter((mt) =>
      !mt.optional || scenarios.some((s, i) => Math.abs(Number(mt.get(s, derived[i])) || 0) > 0.005)
    );

    const initOpen = Object.fromEntries(visible.map((mt) => [mt.label, !!mt.initOpen]));
    const [open, setOpen] = useState(initOpen);
    const toggle = (label) => setOpen((prev) => ({ ...prev, [label]: !prev[label] }));

    let lastGroup = null;

    return (
      <>
        <SubHead
          title={'Compare · ' + scenarios.length}
          icon="scale"
          onBack={onBack}
        />
        <div className="m-scroll">
          <div className="cmpC">
            {visible.map((mt) => {
              const vals = scenarios.map((s, i) => mt.get(s, derived[i]));
              const nums = vals.filter((v) => typeof v === 'number' && !isNaN(v));
              const spread = nums.length > 1 ? Math.max(...nums) - Math.min(...nums) : 0;
              const isOpen = !!open[mt.label];

              const showGroup = mt.group !== lastGroup;
              lastGroup = mt.group;

              return (
                <React.Fragment key={mt.label}>
                  {showGroup && <div className="cmpC-group">{mt.group}</div>}
                  <div className={'cmpC-item' + (isOpen ? ' open' : '')}>
                    <div className="cmpC-itemhead" onClick={() => toggle(mt.label)}>
                      <span className="cmpC-mlabel">{mt.label}</span>
                      <span className="cmpC-spread num">spread {mt.fmt(spread)}</span>
                      <span className="cmpC-caret"><MIcon name="down" size={16} /></span>
                    </div>
                    {isOpen && (
                      <div className="cmpC-body">
                        {scenarios.map((s, i) => {
                          const v = vals[i];
                          return (
                            <div className="cmpC-rank" key={s.id}>
                              <span className="cmpC-rank-swatch" style={{ background: s.color }} />
                              <span className="cmpC-rank-name">{s.name.split(' —')[0]}</span>
                              <span className="cmpC-rank-v">{mt.fmt(v)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
        <TabBar active="compare" onList={onBack} onNew={() => {}} onCompare={() => {}} />
      </>
    );
  }

  window.MCompareView = MCompareView;
})();
