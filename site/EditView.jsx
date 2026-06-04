/* Loaner — edit / detail view */
const Le = window.Loaner;

const OPTS = {
  termYears: ['30', '25', '20', '15', '10'],
};

const SWATCHES = ['#4f5bd5', '#1f9d72', '#c2603a', '#8a4fd6', '#2f7fc9', '#b8852a', '#cc4b6e', '#3a8a8a'];

const UNITS = {
  down: [
    { key: 'down', label: 'down $', kind: 'money', to: (d) => d, from: (v) => Math.max(0, v) },
    { key: 'loan', label: 'loan $', kind: 'money', to: (d, c) => Math.max(0, c.price - d), from: (v, c) => Math.max(0, c.price - v) },
    { key: 'pct', label: '% down', kind: 'pct', dp: 2, to: (d, c) => (c.price ? (d / c.price) * 100 : 0), from: (v, c) => (c.price * v) / 100 },
  ],
  tax: [
    { key: 'mo', label: '$ / mo', kind: 'money', to: (m) => m, from: (v) => v },
    { key: 'yr', label: '$ / yr', kind: 'money', to: (m) => m * 12, from: (v) => v / 12 },
    { key: 'pct', label: '% / yr', kind: 'pct', dp: 3, to: (m, c) => (c.price ? ((m * 12) / c.price) * 100 : 0), from: (v, c) => (c.price * v) / 100 / 12 },
  ],
  ins: [
    { key: 'mo', label: '$ / mo', kind: 'money', to: (m) => m, from: (v) => v },
    { key: 'yr', label: '$ / yr', kind: 'money', to: (m) => m * 12, from: (v) => v / 12 },
  ],
};

function MonthlyRow({ label, children, locked, strong }) {
  return (
    <div className={'mh-row' + (locked ? ' locked' : '') + (strong ? ' strong' : '')}>
      <span className="mh-label">{label}{locked ? <span className="lock-tag"><Icon name="lock" size={11} />derived</span> : null}</span>
      <span className="mh-val">{children}</span>
    </div>
  );
}

function RailBar({ label, v, tot, c }) {
  const pct = tot ? Math.max(0, Math.min(100, (v / tot) * 100)) : 0;
  if (v <= 0) return null;
  return (
    <div className="rb">
      <div className="rb-top"><span>{label}</span><Money0 v={v} /></div>
      <div className="rb-track"><div className="rb-fill" style={{ width: pct + '%', background: c }}></div></div>
    </div>
  );
}

function RailStat({ label, children, locked }) {
  return (
    <div className="rstat">
      <span className="rs-label">{label}{locked ? <Icon name="lock" size={11} /> : null}</span>
      <span className="rs-val num">{children}</span>
    </div>
  );
}

function BuydownSection({ s, d, onPatch }) {
  const bd = Array.isArray(s.buydown) ? s.buydown : [];
  const setBd = (next) => onPatch({ buydown: next });
  const setYear = (i, val) => { const n = [...bd]; n[i] = val; setBd(n); };
  const addYear = () => {
    const note = Number(s.rate) || 0;
    const last = bd.length ? Number(bd[bd.length - 1]) : note - bd.length - 1;
    const next = Math.min(note, (bd.length ? last + 1 : note - 1));
    setBd([...bd, Number(next.toFixed(3))]);
  };
  const removeYear = (i) => setBd(bd.filter((_, j) => j !== i));
  const presets = [
    { key: 'none', label: 'None', years: [] },
    { key: '1/0', label: '1/0', years: [Number(s.rate) - 1] },
    { key: '2/1', label: '2/1', years: [Number(s.rate) - 2, Number(s.rate) - 1] },
    { key: '3/2/1', label: '3/2/1', years: [Number(s.rate) - 3, Number(s.rate) - 2, Number(s.rate) - 1] },
  ];
  const activeKey = (() => {
    if (!bd.length) return 'none';
    const note = Number(s.rate);
    const matches = (arr) => arr.length === bd.length && arr.every((v, i) => Math.abs(v - bd[i]) < 0.001);
    const p = presets.find((p) => p.key !== 'none' && matches(p.years));
    return p ? p.key : 'custom';
  })();

  return (
    <Section
      title="Temporary buydown"
      sub="subsidized rate for the first year(s)"
      right={d.hasBuydown ? <span className="sect-total">cost <Money v={d.buydownCost} /></span> : null}
      defaultOpen={d.hasBuydown}
    >
      <div className="bd-presets">
        {presets.map((p) => (
          <button
            key={p.key}
            className={'bd-preset' + (activeKey === p.key ? ' on' : '')}
            onClick={() => setBd(p.years.map((v) => Number(Math.max(0, v).toFixed(3))))}
          >{p.label}</button>
        ))}
        {activeKey === 'custom' ? <span className="bd-custom-tag">custom</span> : null}
      </div>

      {bd.length ? (
        <div className="bd-rows">
          {bd.map((rt, i) => {
            const row = d.buydownSchedule[i];
            return (
              <div className="bd-row" key={i}>
                <span className="bd-yr">Year {i + 1}</span>
                <PctInput value={Number(rt) || 0} onChange={(v) => setYear(i, v)} />
                <span className="bd-arrow"><Icon name="chevR" size={14} /></span>
                <span className="bd-pay">
                  <Money v={row ? row.pi : 0} />
                  <span className="bd-sub">save {Le.fmtMoney0(row ? row.saving : 0)}/mo</span>
                </span>
                <IconBtn icon="x" title="Remove year" onClick={() => removeYear(i)} />
              </div>
            );
          })}
          <div className="bd-row final">
            <span className="bd-yr">Year {bd.length + 1}+</span>
            <span className="bd-noterate num">{Le.fmtPct(s.rate, 3)}</span>
            <span className="bd-arrow"><Icon name="chevR" size={14} /></span>
            <span className="bd-pay">
              <Money v={d.pi} />
              <span className="bd-sub">note rate P&I</span>
            </span>
            <span className="bd-spacer"></span>
          </div>
        </div>
      ) : (
        <p className="bd-empty">No buydown — pick a preset above or add a year to subsidize the rate for the first year(s).</p>
      )}

      <div className="bd-foot">
        <button className="addline" onClick={addYear}><Icon name="plus" size={13} />Add a buydown year</button>
        {d.hasBuydown ? (
          <div className="bd-cost">
            <span>Upfront cost</span><Money v={d.buydownCost} />
          </div>
        ) : null}
      </div>
      {d.hasBuydown ? <p className="bd-hint">Funded at closing (often by the seller or lender). Shown here for reference — not added to your cash-to-close above.</p> : null}
    </Section>
  );
}

function EditView({ scenario, onPatch, onBack, onDuplicate }) {
  const s = scenario;
  const d = Le.computeDerived(s);
  const set = (k) => (v) => onPatch({ [k]: v });
  const setLines = (k) => (items) => onPatch({ [k]: items });

  return (
    <div className="edit-view">
      <div className="edit-top">
        <button className="back" onClick={onBack}><Icon name="chevL" size={16} />All scenarios</button>
        <div className="et-actions">
          <Btn kind="ghost" icon="copy" onClick={onDuplicate}>Duplicate</Btn>
          <Btn kind="solid" icon="check" onClick={onBack}>Done</Btn>
        </div>
      </div>

      <div className="edit-title">
        <span className="title-swatch" style={{ background: s.color }}></span>
        <input className="title-input" value={s.name} onChange={(e) => set('name')(e.target.value)} />
      </div>
      <div className="swatch-pick">
        {SWATCHES.map((c) => (
          <button key={c} className={'sw' + (s.color === c ? ' on' : '')} style={{ background: c }} onClick={() => set('color')(c)} aria-label={'color ' + c} />
        ))}
      </div>

      <div className="edit-grid">
        <div className="edit-main">
          <Section title="Loan parameters" sub="rate, price & terms">
            <div className="fields-grid">
              <Field label="Purchase price"><MoneyInput value={s.purchasePrice} onChange={set('purchasePrice')} /></Field>
              <Field label="Down payment" hint="enter as down $, loan $, or % down — switch with the unit picker">
                <UnitAmount value={s.downPayment} units={UNITS.down} ctx={{ price: s.purchasePrice }} onChange={set('downPayment')} />
              </Field>
              <Field label="Loan amount" locked hint="purchase price − down payment"><Derived><Money v={d.loanAmount} /></Derived></Field>
              <Field label="LTV" locked hint="loan ÷ price"><Derived><span className="num">{Le.fmtPct(d.ltv * 100, 2)}</span></Derived></Field>
              <Field label="Interest rate"><PctInput value={s.rate} onChange={set('rate')} /></Field>
              <Field label="APR" hint="enter from your quote"><PctInput value={s.apr} onChange={set('apr')} /></Field>
              <Field label="Loan term (years)"><SelectInput value={String(s.termYears)} onChange={(v) => set('termYears')(Number(v))} options={OPTS.termYears} /></Field>
            </div>
          </Section>

          <Section title="Estimated monthly payment" sub="proposed housing expense">
            <div className="mh">
              <MonthlyRow label="First mortgage P&I" locked><Money v={d.housing.pi} /></MonthlyRow>
              <div className="mh-row">
                <span className="mh-label">Other financing P&I</span>
                <span className="mh-val"><MoneyInput value={s.otherFinancingPI} onChange={set('otherFinancingPI')} /></span>
              </div>
              <div className="mh-row">
                <span className="mh-label">Homeowner's insurance</span>
                <span className="mh-val wide"><UnitAmount value={s.homeownersInsMonthly} units={UNITS.ins} onChange={set('homeownersInsMonthly')} /></span>
              </div>
              <div className="mh-row">
                <span className="mh-label">Property taxes</span>
                <span className="mh-val wide"><UnitAmount value={s.propertyTaxMonthly} units={UNITS.tax} ctx={{ price: s.purchasePrice }} onChange={set('propertyTaxMonthly')} /></span>
              </div>
              <div className="mh-row">
                <span className="mh-label">Mortgage insurance (PMI)</span>
                <span className="mh-val"><MoneyInput value={s.mortgageInsMonthly} onChange={set('mortgageInsMonthly')} /></span>
              </div>
              <div className="mh-row">
                <span className="mh-label">Homeowner assn. dues</span>
                <span className="mh-val"><MoneyInput value={s.hoaMonthly} onChange={set('hoaMonthly')} /></span>
              </div>
              <MonthlyRow label="Total monthly payment" locked strong><Money v={d.monthly} /></MonthlyRow>
            </div>
          </Section>

          <BuydownSection s={s} d={d} onPatch={onPatch} />

          <Section title="Lender fees" sub="points & origination" right={<span className="sect-total"><Money v={d.lenderTotal} /> · {Le.fmtPct(d.pointsPct, 3)} of loan</span>}>
            <LineEditor items={s.lenderFees} onChange={setLines('lenderFees')} />
          </Section>

          <Section title="Third-party fees" sub="services you cannot shop for" right={<span className="sect-total"><Money v={d.tpCannot} /></span>}>
            <LineEditor items={s.thirdPartyCannotShop} onChange={setLines('thirdPartyCannotShop')} />
          </Section>

          <Section title="Third-party fees" sub="services you can shop for" right={<span className="sect-total"><Money v={d.tpCan} /></span>}>
            <LineEditor items={s.thirdPartyCanShop} onChange={setLines('thirdPartyCanShop')} />
          </Section>

          <Section title="Taxes & other government fees" right={<span className="sect-total"><Money v={d.govTotal} /></span>}>
            <LineEditor items={s.govFees} onChange={setLines('govFees')} />
          </Section>

          <Section title="Prepaids" sub="paid up front at closing" right={<span className="sect-total"><Money v={d.prepaidsTotal} /></span>}>
            <LineEditor items={s.prepaids} onChange={setLines('prepaids')} />
          </Section>

          <Section title="Initial escrow payment" sub="reserves collected at closing" right={<span className="sect-total"><Money v={d.escrowTotal} /></span>}>
            <LineEditor items={s.escrows} onChange={setLines('escrows')} />
          </Section>

          <Section title="Credits & cash to close">
            <div className="fields-grid">
              <Field label="Estimated total payoffs"><MoneyInput value={s.payoffs} onChange={set('payoffs')} /></Field>
              <Field label="Lender credits"><MoneyInput value={s.lenderCredits} onChange={set('lenderCredits')} /></Field>
              <Field label="Seller credits" hint="applied to closing costs only — can't reduce the price; any excess is shown as unused">
                <MoneyInput value={s.sellerCredits} onChange={set('sellerCredits')} />
              </Field>
            </div>
            <div className="ctc">
              <div className="ctc-row"><span>Down payment</span><Money v={s.downPayment} /></div>
              <div className="ctc-row"><span>Lender fees</span><Money v={d.lenderTotal} /></div>
              <div className="ctc-row"><span>Third-party fees</span><Money v={d.thirdPartyTotal} /></div>
              <div className="ctc-row"><span>Taxes & government fees</span><Money v={d.govTotal} /></div>
              <div className="ctc-row"><span>Prepaids & initial escrow</span><Money v={d.prepaidsEscrowTotal} /></div>
              <div className="ctc-row"><span>Estimated total payoffs</span><Money v={d.payoffs} /></div>
              <div className="ctc-row sub-tot locked">
                <span>Funds due before credits (A) <span className="lock-tag"><Icon name="lock" size={11} />derived</span></span>
                <Money v={d.fundsDue} />
              </div>
              <div className="ctc-row"><span>Credits applied to costs (B)</span><Money v={-d.creditsApplied} /></div>
              <div className="ctc-row grand locked">
                <span>Estimated cash to close (A − B) <span className="lock-tag"><Icon name="lock" size={11} />derived</span></span>
                <Money v={d.cashToClose} />
              </div>
              {d.creditsRemaining > 0 ? (
                <div className="ctc-remaining">
                  <span className="rem-l">
                    <span className="rem-t">Remaining credits</span>
                    <span className="rem-s">Credits of {Le.fmtMoney0(d.creditsAvailable)} exceed total closing costs of {Le.fmtMoney0(d.totalClosingCosts)}. The excess can't reduce the purchase price or down payment.</span>
                  </span>
                  <Money v={d.creditsRemaining} />
                </div>
              ) : null}
            </div>
          </Section>

          <Section title="Notes" defaultOpen={true}>
            <textarea
              className="notes"
              value={s.notes}
              placeholder="Add context for this scenario — assumptions, who quoted it, what to remember…"
              onChange={(e) => set('notes')(e.target.value)}
            />
          </Section>
        </div>

        <aside className="edit-rail">
          <div className="rail-card">
            <div className="rc-label">{d.hasBuydown ? 'Note-rate monthly payment' : 'Total monthly payment'}</div>
            <div className="rc-big"><Money0 v={d.monthly} /></div>
            {d.hasBuydown ? (
              <div className="rc-buydown">
                <span className="rc-bd-label">Year 1 with buydown</span>
                <span className="rc-bd-val num">{Le.fmtMoney0(d.firstYearMonthly)}<span className="rc-bd-mo">/mo</span></span>
              </div>
            ) : null}
            <div className="rc-bars">
              <RailBar label="P&I" v={d.housing.pi} tot={d.monthly} c={s.color} />
              <RailBar label="Taxes" v={d.housing.tax} tot={d.monthly} c="#7c8195" />
              <RailBar label="Insurance" v={d.housing.hoi} tot={d.monthly} c="#9aa0b2" />
              <RailBar label="PMI" v={d.housing.mi} tot={d.monthly} c="#b6bbc9" />
              <RailBar label="HOA" v={d.housing.hoa} tot={d.monthly} c="#c9cdd8" />
            </div>
          </div>
          <div className="rail-stats">
            <RailStat label="Loan amount" locked><Money0 v={d.loanAmount} /></RailStat>
            <RailStat label="LTV" locked>{Le.fmtPct(d.ltv * 100, 1)}</RailStat>
            <RailStat label="Rate / APR">{Le.fmtPct(s.rate, 3)} / {Le.fmtPct(s.apr, 3)}</RailStat>
            <RailStat label="Total closing costs" locked><Money0 v={d.totalClosingCosts} /></RailStat>
            <RailStat label="Cash to close" locked><Money0 v={d.cashToClose} /></RailStat>
            {d.creditsRemaining > 0 ? <RailStat label="Remaining credits" locked><Money0 v={d.creditsRemaining} /></RailStat> : null}
            <RailStat label="Lifetime interest" locked><Money0 v={d.interest} /></RailStat>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.EditView = EditView;
window.BuydownSection = BuydownSection;
