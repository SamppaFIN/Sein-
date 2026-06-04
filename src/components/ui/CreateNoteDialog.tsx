import { useState, useRef, useEffect } from 'react';
import { useWallStore } from '@/store/useWallStore';
import { PRESET_COLORS } from '@/types';
import { randomColor } from '@/lib/notes';

interface CreateNoteDialogProps {
  onClose: () => void;
}

export function CreateNoteDialog({ onClose }: CreateNoteDialogProps) {
  const [content, setContent] = useState('');
  const [color, setColor] = useState(randomColor());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addNote = useWallStore((s) => s.addNote);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleCreate = () => {
    if (content.trim() === '') return;

    // Sijoita lappu näkymän keskelle + satunnainen heitto
    addNote(
      window.innerWidth / 2 - 500 + Math.random() * 500,
      window.innerHeight / 2 - 300 + Math.random() * 300,
      color,
      content,
    );

    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(20,20,40,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: '24px 28px',
          maxWidth: 440,
          width: '90vw',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: '#fff' }}>✏️ Uusi viesti</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 18,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Kirjoita viestisi... #tagit toimii!"
          style={{
            width: '100%',
            minHeight: 100,
            padding: 12,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            background: 'rgba(0,0,0,0.3)',
            color: '#fff',
            fontSize: 14,
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        {/* Väri- ja ohjetieto */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  border: color === c.hex ? '2px solid #fff' : '2px solid transparent',
                  background: c.hex,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                title={c.label}
              />
            ))}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            Enter lähettää • Shift+Enter rivinvaihto • Esc sulkee
          </span>
        </div>

        {/* Tallennusnappi */}
        <button
          onClick={handleCreate}
          disabled={!content.trim()}
          style={{
            width: '100%',
            marginTop: 14,
            padding: '10px 0',
            border: 'none',
            borderRadius: 8,
            background: content.trim() ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
            color: content.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
            fontSize: 14,
            fontWeight: 500,
            cursor: content.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s',
          }}
        >
          Lähetä seinälle
        </button>
      </div>
    </div>
  );
}
