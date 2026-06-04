import { useState } from 'react';
import { useWallStore } from '@/store/useWallStore';

export function DevPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const seedNotes = useWallStore((s) => s.seedNotes);
  const clearNotes = useWallStore((s) => s.clearNotes);
  const notesCount = useWallStore((s) => s.notes.length);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    await seedNotes(100);
    setSeeding(false);
  };

  const handleClear = async () => {
    if (!confirm('Tyhjennä kaikki viestit?')) return;
    await clearNotes();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 99999,
          background: 'rgba(0,0,0,0.5)',
          color: '#0f0',
          border: '1px solid #0f0',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 11,
          cursor: 'pointer',
          fontFamily: 'monospace',
        }}
        title="Kehitystyökalut"
      >
        🛠 DEV
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 99999,
        background: 'rgba(10,10,20,0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '14px 16px',
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#ccc',
        minWidth: 200,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ color: '#0f0' }}>🛠 DEV</span>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <strong>{notesCount}</strong> viestiä tietokannassa
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={handleSeed}
          disabled={seeding}
          style={{
            background: seeding ? '#333' : 'rgba(0,255,0,0.1)',
            color: seeding ? '#666' : '#0f0',
            border: '1px solid #0f0',
            borderRadius: 6,
            padding: '6px 12px',
            cursor: seeding ? 'default' : 'pointer',
            fontSize: 11,
            fontFamily: 'monospace',
          }}
        >
          {seeding ? '⏳ Luodaan...' : '🌱 Seed 100 viestiä (30 pv)'}
        </button>

        <button
          onClick={handleClear}
          style={{
            background: 'rgba(255,0,0,0.1)',
            color: '#f44',
            border: '1px solid #f44',
            borderRadius: 6,
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: 11,
            fontFamily: 'monospace',
          }}
        >
          🗑 Tyhjennä kanta
        </button>
      </div>
    </div>
  );
}
