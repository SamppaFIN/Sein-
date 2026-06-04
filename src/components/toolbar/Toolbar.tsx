import { useWallStore } from '@/store/useWallStore';
import { PRESET_COLORS } from '@/types';
import { randomColor } from '@/lib/notes';

interface ToolbarProps {
  onRandomNote: () => void;
}

export function Toolbar({ onRandomNote }: ToolbarProps) {
  const notesCount = useWallStore((s) => s.notes.length);
  const editingNoteId = useWallStore((s) => s.editingNoteId);
  const activeColor = useWallStore((s) => s.activeColor);
  const setActiveColor = useWallStore((s) => s.setActiveColor);
  const activeListViewTag = useWallStore((s) => s.activeListViewTag);

  return (
    <div className="toolbar no-select">
      {/* Väripaletti uusille tarroille */}
      <div style={{ display: 'flex', gap: 3, alignItems: 'center', padding: '0 4px' }}>
        {PRESET_COLORS.map((c) => (
          <button
            key={c.hex}
            className={`toolbar-color-swatch ${activeColor === c.hex ? 'active' : ''}`}
            style={{ background: c.hex }}
            title={c.label}
            onClick={() => setActiveColor(c.hex)}
          />
        ))}
        <button
          style={{ fontSize: 10, padding: '2px 5px', color: '#999' }}
          onClick={() => setActiveColor(randomColor())}
          title="Satunnainen väri"
        >
          🎲
        </button>
      </div>

      <div className="divider" />

      {/* Satunnainen lappu -nappi */}
      <button
        className="toolbar-random-btn"
        onClick={onRandomNote}
        disabled={notesCount === 0}
        title={editingNoteId ? '✏️ Muokataan...' : `Avaa satunnainen viesti (${notesCount} kpl)`}
      >
        {editingNoteId ? '✏️' : `🎲 ${notesCount}`}
      </button>

      {activeListViewTag && (
        <>
          <div className="divider" />
          <span style={{ fontSize: 12, color: '#666', padding: '8px 4px', alignSelf: 'center' }}>
            #{activeListViewTag}
          </span>
        </>
      )}
    </div>
  );
}
