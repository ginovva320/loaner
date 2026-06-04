/* Loaner — top-level app */
const La = window.Loaner;
const { useState, useEffect, useCallback } = React;
const MAX_COMPARE = 4;

function App() {
  const [scenarios, setScenarios] = useState(() => La.load());
  const [view, setView] = useState('list'); // list | edit | compare
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [compareIds, setCompareIds] = useState([]);

  useEffect(() => { La.save(scenarios); }, [scenarios]);

  const byId = (id) => scenarios.find((s) => s.id === id);

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  const openEdit = (id) => { setEditingId(id); setView('edit'); };
  const backToList = () => { setView('list'); setEditingId(null); };

  const newScenario = () => {
    const s = La.makeScenario({ name: 'New Scenario', sellerCredits: 0, notes: '' });
    setScenarios((prev) => [s, ...prev]);
    openEdit(s.id);
  };

  const duplicateScenario = (id) => {
    const src = byId(id);
    if (!src) return;
    const copy = La.duplicate(src);
    setScenarios((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    return copy.id;
  };

  const deleteScenario = (id) => {
    const s = byId(id);
    if (s && !window.confirm(`Delete "${s.name}"? This can't be undone.`)) return;
    setScenarios((prev) => prev.filter((x) => x.id !== id));
    setSelected((prev) => prev.filter((x) => x !== id));
    setCompareIds((prev) => prev.filter((x) => x !== id));
  };

  const patch = (id, partial) => {
    setScenarios((prev) => prev.map((s) => (s.id === id ? { ...s, ...partial } : s)));
  };

  const startCompare = () => {
    if (selected.length < 2) return;
    setCompareIds(scenarios.filter((s) => selected.includes(s.id)).map((s) => s.id));
    setView('compare');
  };

  const removeFromCompare = (id) => {
    setCompareIds((prev) => {
      const next = prev.filter((x) => x !== id);
      if (next.length < 2) { setView('list'); }
      return next;
    });
    setSelected((prev) => prev.filter((x) => x !== id));
  };

  const resetSeed = () => {
    if (!window.confirm('Replace all scenarios with the example set? Your current scenarios will be lost.')) return;
    const s = La.resetSeed();
    setScenarios(s);
    setSelected([]); setCompareIds([]);
  };

  let body;
  if (view === 'edit' && byId(editingId)) {
    body = (
      <EditView
        scenario={byId(editingId)}
        onPatch={(partial) => patch(editingId, partial)}
        onBack={backToList}
        onDuplicate={() => { const nid = duplicateScenario(editingId); if (nid) openEdit(nid); }}
      />
    );
  } else if (view === 'compare') {
    const cs = compareIds.map(byId).filter(Boolean);
    body = (
      <CompareView
        scenarios={cs}
        onBack={backToList}
        onOpen={(id) => openEdit(id)}
        onRemove={removeFromCompare}
      />
    );
  } else {
    body = (
      <ListView
        scenarios={scenarios}
        selected={selected}
        maxCompare={MAX_COMPARE}
        onToggle={toggleSelect}
        onClearSel={() => setSelected([])}
        onOpen={openEdit}
        onNew={newScenario}
        onDuplicate={duplicateScenario}
        onDelete={deleteScenario}
        onCompare={startCompare}
        onReset={resetSeed}
      />
    );
  }

  return (
    <div className="app">
      <header className="appbar">
        <div className="brand" onClick={backToList} role="button">
          <span className="logo">◳</span>
          <span className="wordmark">Loaner</span>
          <span className="tag">mortgage scenarios</span>
        </div>
        <div className="appbar-right">
          <span className="muted-note">All figures are estimates · saved in your browser</span>
        </div>
      </header>
      <main className="appbody">{body}</main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
