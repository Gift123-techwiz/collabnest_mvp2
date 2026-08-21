export function ProgressBar({ value, label, showValue = true }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  return (
    <div>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          {label && <span style={{ fontWeight: 600, color: '#33415a' }}>{label}</span>}
          {showValue && <span style={{ fontWeight: 700, color: '#2563eb' }}>{pct}%</span>}
        </div>
      )}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Field({ label, hint, error, optional, htmlFor, children }) {
  return (
    <div className="field">
      {label && (
        <label className="field-label" htmlFor={htmlFor}>
          {label} {optional && <span className="optional">(optional)</span>}
        </label>
      )}
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}
