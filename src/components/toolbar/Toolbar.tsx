import { useWallStore } from '@/store/useWallStore';

interface ToolbarProps {
  onRandomNote: () => void;
  onNewNote: () => void;
}

export function Toolbar({ onRandomNote, onNewNote }: ToolbarProps) {
  const notesCount = useWallStore((s) => s.notes.length);
  const activeListViewTag = useWallStore((s) => s.activeListViewTag);

  return (
    <div className="toolbar no-select">
      {/* Uusi viesti -nappi */}
      <button className="toolbar-new-btn" onClick={onNewNote} title="Luo uusi viesti">
        +
      </button>

      <div className="divider" />

      {/* Satunnainen lappu -nappi */}
      <button
        className="toolbar-random-btn"
        onClick={onRandomNote}
        disabled={notesCount === 0}
        title={`Avaa satunnainen viesti (${notesCount} kpl)`}
      >
        🎲 {notesCount}
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
