interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  scale: number;
}

export function ZoomControls({ onZoomIn, onZoomOut, onReset, scale }: ZoomControlsProps) {
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
    </div>
  );
}
