/* Loaner mobile — edit view (single-column form + collapsible summary bar) */
(function () {
  const { useState } = React;
  const Lm = window.Loaner;

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

  /* payment breakdown bar for summary sheet */
  function Bar({ label, v, tot, c }) {
    if (v <= 0) return null;
    const pct = Math.max(0, Math.min(100, tot ? (v / tot) * 100 : 0));
    return (
      <div>
        <div className="m-bar-top"><span>{label}</span><span className="num">{Lm.fmtMoney0(v)}</span></div>
        <div className="m-bar-track"><div className="m-bar-fill" style={{ width: pct + '%', background: c }} /></div>
      </div>
    );
  }

  function SRow({ label, children }) {
    return (
      <div className="m-srow">
        <span className="l">{label}</span>
        <span className="v">{children}</span>
      </div>
    );
  }

  /* expandable summary sheet (dark bottom sheet) */
  function SummarySheet({ s, d, onClose }) {
    return (
      <>
        <div className="m-scrim" onClick={onClose} />
        <div className="m-sheet">
          <div className="m-sheet-handle" />
          <div className="m-sheet-head">
            <h4>Summary</h4>
            <button className="m-sheet-x" onClick={onClose}><MIcon name="down" size={20} /></button>
          </div>
          <div className="m-sheet-biglabel">{d.hasBuydown ? 'Note-rate monthly payment' : 'Total monthly payment'}</div>
          <div className="m-sheet-big num">{Lm.fmtMoney0(d.monthly)}</div>
          {d.hasBuydown && (
            <div className="m-sheet-bd">
              <span className="l">Year 1 with buydown</span>
              <span className="v num">{Lm.fmtMoney0(d.firstYearMonthly)}</span>
            </div>
          )}
          <div className="m-bars">
            <Bar label="P&I"       v={d.housing.pi}  tot={d.monthly} c={s.color} />
            <Bar label="Taxes"     v={d.housing.tax} tot={d.monthly} c="#7c8195" />
            <Bar label="Insurance" v={d.housing.hoi} tot={d.monthly} c="#9aa0b2" />
            <Bar label="PMI"       v={d.housing.mi}  tot={d.monthly} c="#b6bbc9" />
            <Bar label="HOA"       v={d.housing.hoa} tot={d.monthly} c="#c9cdd8" />
          </div>
          <div className="m-sheet-stats">
            <SRow label="Loan amount">{Lm.fmtMoney0(d.loanAmount)}</SRow>
            <SRow label="LTV">{Lm.fmtPct(d.ltv * 100, 1)}</SRow>
            <SRow label="Rate / APR">{Lm.fmtPct(s.rate, 3)} / {Lm.fmtPct(s.apr, 3)}</SRow>
            <SRow label="Total closing costs">{Lm.fmtMoney0(d.totalClosingCosts)}</SRow>
            <SRow label="Cash to close">{Lm.fmtMoney0(d.cashToClose)}</SRow>
            {d.creditsRemaining > 0 && <SRow label="Unused credit">{Lm.fmtMoney0(d.creditsRemaining)}</SRow>}
            <SRow label="Lifetime interest">{Lm.fmtMoney0(d.interest)}</SRow>
          </div>
        </div>
      </>
    );
  }

  /* collapsed summary bar docked at the bottom */
  function SummaryBar({ d, onExpand }) {
    return (
      <div className="m-sumbar" onClick={onExpand}>
        <div className="m-sumbar-handle" />
        <div className="m-sumbar-row">
          <div className="m-sumbar-l">
            <span className="m-sumbar-label">{d.hasBuydown ? 'Note-rate / mo' : 'Monthly payment'}</span>
            <span className="m-sumbar-big num">{Lm.fmtMoney0(d.monthly)}</span>
          </div>
          <div className="m-sumbar-r">
            <span className="m-sumbar-label">Cash to close</span>
            <span className="m-sumbar-rv num">{Lm.fmtMoney0(d.cashToClose)}</span>
          </div>
          <span className="m-sumbar-chev"><MIcon name="up" size={18} /></span>
        </div>
      </div>
    );
  }

  function MEditView({ scenario, onPatch, onBack, onDuplicate }) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const s = scenario;
    const d = Lm.computeDerived(s);
    const set = (k) => (v) => onPatch({ [k]: v });
    const setLines = (k) => (items) => onPatch({ [k]: items });

    return (
      <>
        <SubHead
          title="Edit scenario"
          icon="edit"
          onBack={onBack}
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button className="m-iconbtn" onClick={onDuplicate} title="Duplicate scenario">
                <MIcon name="copy" size={17} />
              </button>
              <button className="m-linkbtn" onClick={onBack}>Done</button>
            </div>
          }
        />
        <div className="m-scroll">
          <div className="m-edit">
            {/* name + color swatch picker */}
            <div className="m-edit-title">
              <span className="m-edit-swatch" style={{ background: s.color }} />
              <input
                className="m-edit-name"
                value={s.name}
                onChange={(e) => set('name')(e.target.value)}
              />
            </div>
            <div className="m-swatches">
              {M_SWATCHES.map((c) => (
                <button
                  key={c}
                  className={'m-sw' + (s.color === c ? ' on' : '')}
                  style={{ background: c }}
                  onClick={() => set('color')(c)}
                  aria-label={'color ' + c}
                />
              ))}
            </div>

            <Section title="Loan parameters" sub="rate, price & terms">
              <div className="m-fields">
                <Field label="Purchase price">
                  <MoneyInput value={s.purchasePrice} onChange={set('purchasePrice')} />
                </Field>
                <Field label="Down payment" hint="enter as down $, loan $, or % down">
                  <UnitAmount value={s.downPayment} units={UNITS.down} ctx={{ price: s.purchasePrice }} onChange={set('downPayment')} />
                </Field>
                <Field label="Loan amount" locked hint="purchase price − down payment">
                  <Derived><span className="num">{Lm.fmtMoney0(d.loanAmount)}</span></Derived>
                </Field>
                <Field label="LTV" locked hint="loan ÷ price">
                  <Derived><span className="num">{Lm.fmtPct(d.ltv * 100, 2)}</span></Derived>
                </Field>
                <Field label="Interest rate">
                  <PctInput value={s.rate} onChange={set('rate')} />
                </Field>
                <Field label="APR" hint="enter from your quote">
                  <PctInput value={s.apr} onChange={set('apr')} />
                </Field>
                <Field label="Loan term (years)">
                  <SelectInput value={String(s.termYears)} onChange={(v) => set('termYears')(Number(v))} options={['30','25','20','15','10']} />
                </Field>
              </div>
            </Section>

            <Section title="Estimated monthly payment" sub="proposed housing expense">
              <div className="mh">
                <div className="mh-row locked">
                  <span className="mh-label">
                    First mortgage P&I
                    <span className="lock-tag"><MIcon name="lock" size={10} />derived</span>
                  </span>
                  <span className="mh-val num">{Lm.fmtMoney(d.housing.pi)}</span>
                </div>
                <div className="mh-row">
                  <span className="mh-label">Other financing P&I</span>
                  <span className="mh-val"><MoneyInput value={s.otherFinancingPI} onChange={set('otherFinancingPI')} /></span>
                </div>
                <div className="mh-row">
                  <span className="mh-label">Homeowner's insurance</span>
                  <span className="mh-val"><UnitAmount value={s.homeownersInsMonthly} units={UNITS.ins} onChange={set('homeownersInsMonthly')} /></span>
                </div>
                <div className="mh-row">
                  <span className="mh-label">Property taxes</span>
                  <span className="mh-val"><UnitAmount value={s.propertyTaxMonthly} units={UNITS.tax} ctx={{ price: s.purchasePrice }} onChange={set('propertyTaxMonthly')} /></span>
                </div>
                <div className="mh-row">
                  <span className="mh-label">Mortgage insurance (PMI)</span>
                  <span className="mh-val"><MoneyInput value={s.mortgageInsMonthly} onChange={set('mortgageInsMonthly')} /></span>
                </div>
                <div className="mh-row">
                  <span className="mh-label">Homeowner assn. dues</span>
                  <span className="mh-val"><MoneyInput value={s.hoaMonthly} onChange={set('hoaMonthly')} /></span>
                </div>
                <div className="mh-row strong">
                  <span className="mh-label">Total monthly payment</span>
                  <span className="mh-val num">{Lm.fmtMoney(d.monthly)}</span>
                </div>
              </div>
            </Section>

            {/* BuydownSection renders its own <Section> wrapper */}
            <BuydownSection s={s} d={d} onPatch={onPatch} />

            <Section title="Lender fees" sub="points & origination" right={<span className="sect-total">{Lm.fmtMoney0(d.lenderTotal)}</span>} defaultOpen={false}>
              <LineEditor items={s.lenderFees} onChange={setLines('lenderFees')} />
            </Section>
            <Section title="Third-party fees" sub="cannot shop" right={<span className="sect-total">{Lm.fmtMoney0(d.tpCannot)}</span>} defaultOpen={false}>
              <LineEditor items={s.thirdPartyCannotShop} onChange={setLines('thirdPartyCannotShop')} />
            </Section>
            <Section title="Third-party fees" sub="can shop" right={<span className="sect-total">{Lm.fmtMoney0(d.tpCan)}</span>} defaultOpen={false}>
              <LineEditor items={s.thirdPartyCanShop} onChange={setLines('thirdPartyCanShop')} />
            </Section>
            <Section title="Taxes & government fees" right={<span className="sect-total">{Lm.fmtMoney0(d.govTotal)}</span>} defaultOpen={false}>
              <LineEditor items={s.govFees} onChange={setLines('govFees')} />
            </Section>
            <Section title="Prepaids" sub="paid up front" right={<span className="sect-total">{Lm.fmtMoney0(d.prepaidsTotal)}</span>} defaultOpen={false}>
              <LineEditor items={s.prepaids} onChange={setLines('prepaids')} />
            </Section>
            <Section title="Initial escrow" sub="reserves at closing" right={<span className="sect-total">{Lm.fmtMoney0(d.escrowTotal)}</span>} defaultOpen={false}>
              <LineEditor items={s.escrows} onChange={setLines('escrows')} />
            </Section>

            <Section title="Credits & cash to close" defaultOpen={false}>
              <div className="m-fields">
                <Field label="Estimated total payoffs">
                  <MoneyInput value={s.payoffs} onChange={set('payoffs')} />
                </Field>
                <Field label="Lender credits">
                  <MoneyInput value={s.lenderCredits} onChange={set('lenderCredits')} />
                </Field>
                <Field label="Seller credits" hint="applied to closing costs only — excess shown as unused">
                  <MoneyInput value={s.sellerCredits} onChange={set('sellerCredits')} />
                </Field>
              </div>
              <div className="ctc">
                <div className="ctc-row"><span>Down payment</span><span className="num">{Lm.fmtMoney(s.downPayment)}</span></div>
                <div className="ctc-row"><span>Lender fees</span><span className="num">{Lm.fmtMoney(d.lenderTotal)}</span></div>
                <div className="ctc-row"><span>Third-party fees</span><span className="num">{Lm.fmtMoney(d.thirdPartyTotal)}</span></div>
                <div className="ctc-row"><span>Taxes & government fees</span><span className="num">{Lm.fmtMoney(d.govTotal)}</span></div>
                <div className="ctc-row"><span>Prepaids & initial escrow</span><span className="num">{Lm.fmtMoney(d.prepaidsEscrowTotal)}</span></div>
                <div className="ctc-row"><span>Estimated total payoffs</span><span className="num">{Lm.fmtMoney(d.payoffs)}</span></div>
                <div className="ctc-row sub-tot">
                  <span>Funds due before credits (A) <span className="lock-tag"><MIcon name="lock" size={10} />derived</span></span>
                  <span className="num">{Lm.fmtMoney(d.fundsDue)}</span>
                </div>
                <div className="ctc-row"><span>Credits applied (B)</span><span className="num">−{Lm.fmtMoney(d.creditsApplied)}</span></div>
                <div className="ctc-row grand">
                  <span>Cash to close (A − B) <span className="lock-tag"><MIcon name="lock" size={10} />derived</span></span>
                  <span className="num">{Lm.fmtMoney(d.cashToClose)}</span>
                </div>
                {d.creditsRemaining > 0 && (
                  <div className="ctc-remaining">
                    <span className="rem-l">
                      <span className="rem-t">Remaining credits</span>
                      <span className="rem-s">Credits exceed total closing costs — the excess can't reduce the price or down payment.</span>
                    </span>
                    <span className="num">{Lm.fmtMoney(d.creditsRemaining)}</span>
                  </div>
                )}
              </div>
            </Section>

            <Section title="Notes" defaultOpen={false}>
              <textarea
                className="notes"
                value={s.notes}
                placeholder="Add context — assumptions, who quoted it, what to remember…"
                onChange={(e) => set('notes')(e.target.value)}
              />
            </Section>
            <div style={{ height: 4 }} />
          </div>
        </div>

        {sheetOpen && <SummarySheet s={s} d={d} onClose={() => setSheetOpen(false)} />}
        <SummaryBar d={d} onExpand={() => setSheetOpen(true)} />
      </>
    );
  }

  window.MEditView = MEditView;
})();
