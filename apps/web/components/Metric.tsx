export function Metric({ label, value }: { label: string; value: number }) {
  const percent = Math.round(value * 100);
  return (
    <div>
      <div className="metric">
        <span>{label}</span>
        <span className="muted">{percent}%</span>
      </div>
      <div className="metric-bar">
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
