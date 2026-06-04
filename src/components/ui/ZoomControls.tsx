interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onShowAll: () => void;
  scale: number;
}

export function ZoomControls({ onZoomIn, onZoomOut, onReset, onShowAll, scale }: ZoomControlsProps) {
  return (
    <div className="zoom-controls no-select">
      <button onClick={onZoomIn} title="Lähennä">+</button>
      <button
        onClick={onReset}
        title="Palauta"
        style={{ fontSize: 12 }}
      >
        {Math.round(scale * 100)}%
      </button>
      <button onClick={onZoomOut} title="Loitonna">−</button>
      <button
        onClick={onShowAll}
        title="Näytä kaikki viestit"
        style={{ fontSize: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}
      >
        ⊞
      </button>
    </div>
  );
}
