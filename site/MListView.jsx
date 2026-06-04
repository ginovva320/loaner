/* Loaner mobile — list view (stacked cards, simplified) */
(function () {
  const { useState } = React;
  const Lm = window.Loaner;

  function ActionSheet({ s, onClose, onOpen, onDuplicate, onDelete }) {
    return (
      <>
        <div className="m-scrim" onClick={onClose} />
        <div className="m-action-sheet">
          <div className="m-action-header">
            <div className="m-action-title">{s.name}</div>
          </div>
          <button className="m-action-item" onClick={() => { onClose(); onOpen(s.id); }}>
            <MIcon name="edit" size={18} />Edit
          </button>
          <button className="m-action-item" onClick={() => { onClose(); onDuplicate(s.id); }}>
            <MIcon name="copy" size={18} />Duplicate
          </button>
          <button className="m-action-item danger" onClick={() => { onClose(); onDelete(s.id); }}>
            <MIcon name="trash" size={18} />Delete
          </button>
          <button className="m-action-cancel" onClick={onClose}>Cancel</button>
        </div>
      </>
    );
  }

  function ScenarioCard({ s, selecting, selected, onToggle, onOpen, onKebab }) {
    const d = Lm.computeDerived(s);
    return (
      <article
        className={'m-card' + (selected && selecting ? ' sel' : '')}
        onClick={() => selecting ? onToggle(s.id) : onOpen(s.id)}
      >
        <div className="m-card-top">
          {selecting
            ? <span className={'m-chk' + (selected ? ' on' : '')}>{selected && selecting && <MIcon name="check" size={14} sw={2.6} />}</span>
            : <span className="m-swatch" style={{ background: s.color }} />}
          <div className="m-card-id">
            <div className="m-card-name">
              {s.name}
              {d.hasBuydown && <span className="bd-badge">Buydown</span>}
            </div>
            <div className="m-card-sub num">
              {Lm.fmtPct(s.rate, 3)} · {(d.ltv * 100).toFixed(0)}% LTV · {s.termYears}yr
            </div>
          </div>
          {!selecting && (
            <button
              className="m-card-kebab"
              onClick={(e) => { e.stopPropagation(); onKebab(s.id); }}
            >
              <MIcon name="dots" size={18} />
            </button>
          )}
        </div>
        <div className="m-pay">
          <span className="m-pay-big num">{Lm.fmtMoney0(d.monthly)}</span>
          <span className="m-pay-mo">/mo</span>
          {d.hasBuydown && (
            <span className="m-pay-yr1 num">Yr 1 {Lm.fmtMoney0(d.firstYearMonthly)}</span>
          )}
        </div>
      </article>
    );
  }

  function MListView({ scenarios, selected, maxCompare, onToggle, onClearSel, onOpen, onNew, onDuplicate, onDelete, onCompare }) {
    const [selecting, setSelecting] = useState(false);
    const [activeKebab, setActiveKebab] = useState(null);

    const handleDone = () => { setSelecting(false); onClearSel(); };
    const handleCompare = () => { setSelecting(false); onCompare(); };
    const activeScenario = activeKebab ? scenarios.find((s) => s.id === activeKebab) : null;

    return (
      <>
        <ListHead
          count={scenarios.length}
          selecting={selecting}
          onSelect={() => setSelecting(true)}
          onDone={handleDone}
        />
        <div className="m-scroll">
          <div className="m-list">
            {scenarios.map((s) => (
              <ScenarioCard
                key={s.id} s={s}
                selecting={selecting}
                selected={selected.includes(s.id)}
                onToggle={onToggle}
                onOpen={onOpen}
                onKebab={(id) => setActiveKebab(id)}
              />
            ))}
            {scenarios.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-3)' }}>
                <p style={{ margin: '0 0 16px' }}>No scenarios yet.</p>
                <button className="m-btn m-btn-solid" onClick={onNew}>Add your first scenario</button>
              </div>
            )}
          </div>
        </div>
        {selecting ? (
          <div className="m-selbar">
            <span className="m-selbar-info">
              <strong>{selected.length}</strong>{' '}
              selected — up to {maxCompare}
            </span>
            <span className="grow" />
            <button className="m-selbar-clear" onClick={handleDone}>Cancel</button>
            <button
              className={'m-selbar-go' + (selected.length < 2 ? ' off' : '')}
              disabled={selected.length < 2}
              onClick={handleCompare}
            >
              <MIcon name="scale" size={16} />Compare
            </button>
          </div>
        ) : (
          <TabBar active="list" onList={() => {}} onNew={onNew} onCompare={() => {}} />
        )}
        {activeScenario && (
          <ActionSheet
            s={activeScenario}
            onClose={() => setActiveKebab(null)}
            onOpen={onOpen}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        )}
      </>
    );
  }

  window.MListView = MListView;
})();
