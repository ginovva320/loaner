/* Loaner mobile — shared icons and navigation chrome */
(function () {
  function MIcon({ name, size = 16, sw = 1.8 }) {
    const p = {
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round',
    };
    const paths = {
      plus:  <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
      copy:  <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>,
      trash: <><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></>,
      edit:  <><path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M14 6l4 4"/></>,
      lock:  <><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
      x:     <><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></>,
      check: <polyline points="5 12 10 17 19 7"/>,
      up:    <polyline points="6 14 12 8 18 14"/>,
      down:  <polyline points="6 10 12 16 18 10"/>,
      chevR: <polyline points="9 6 15 12 9 18"/>,
      back:  <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="11 18 5 12 11 6"/></>,
      reset: <><path d="M4 12a8 8 0 1 0 2.3-5.6"/><polyline points="4 4 4 8 8 8"/></>,
      list:  <><line x1="8" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="8" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></>,
      scale: <><path d="M12 4v16"/><path d="M7 20h10"/><path d="M5 8l-3 6a3 3 0 0 0 6 0L5 8z"/><path d="M19 8l-3 6a3 3 0 0 0 6 0l-3-6z"/><path d="M5 8l7-2 7 2"/></>,
      dots:  <><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/></>,
    };
    return <svg {...p} className="icn">{paths[name] || null}</svg>;
  }

  const M_SWATCHES = ['#4f5bd5','#1f9d72','#c2603a','#b4456f','#6a4fb3','#2f7ec2','#9a8a1e','#4a5568'];

  function TabBar({ active, onList, onNew, onCompare }) {
    return (
      <nav className="m-tabbar">
        <button className={'m-tab' + (active === 'list' ? ' on' : '')} onClick={onList}>
          <MIcon name="list" size={22} sw={active === 'list' ? 2 : 1.7} />
          <span>Scenarios</span>
        </button>
        <button className="m-tab" onClick={onNew}>
          <span className="m-fab"><MIcon name="plus" size={24} sw={2.2} /></span>
        </button>
        <button className={'m-tab' + (active === 'compare' ? ' on' : '')} onClick={onCompare}>
          <MIcon name="scale" size={22} sw={active === 'compare' ? 2 : 1.7} />
          <span>Compare</span>
        </button>
      </nav>
    );
  }

  function ListHead({ count, selecting, onSelect, onDone }) {
    return (
      <header className="m-head list">
        <div className="m-brandrow">
          <div className="m-brand">
            <span className="m-logo">◳</span>
            <span className="m-wordmark">Loaner</span>
            <span className="m-tag">Scenario compare</span>
          </div>
        </div>
        <div className="m-titlerow">
          <h1>Scenarios</h1>
          <span className="m-count num">{count}</span>
          <span className="spacer" />
          <button className="m-linkbtn" onClick={selecting ? onDone : onSelect}>
            {selecting ? 'Done' : 'Select'}
          </button>
        </div>
      </header>
    );
  }

  function SubHead({ backLabel = 'Scenarios', title, icon, right, onBack }) {
    return (
      <header className="m-head sub">
        <div className="m-navrow">
          <button className="m-back" onClick={onBack}><MIcon name="back" size={18} />{backLabel}</button>
          <span className="m-navtitle">
            {icon && <MIcon name={icon} size={15} />}
            {title}
          </span>
          <span style={{ minWidth: 64, display: 'flex', justifyContent: 'flex-end' }}>{right}</span>
        </div>
      </header>
    );
  }

  Object.assign(window, { MIcon, M_SWATCHES, TabBar: TabBar, ListHead, SubHead });
})();
