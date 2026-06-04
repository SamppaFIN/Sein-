import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWallStore } from '@/store/useWallStore';
import { getFadeOpacity } from '@/lib/notes';

const TIMELINE_LENGTH = 4000;
const CARD_WIDTH = 260;

export function GraffitiTimeline() {
  const notes = useWallStore((s) => s.notes);

  // Järjestä aikajärjestykseen (vanhin ensin)
  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [notes],
  );

  if (notes.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 18,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎨</div>
        <div>Graffiti-aikajana on tyhjä</div>
        <div style={{ fontSize: 13, marginTop: 8, color: 'rgba(255,255,255,0.15)' }}>
          Luo tarroja tarra-tilassa — ne ilmestyvät tänne aikajanalle
        </div>
      </div>
    );
  }

  // Laske aikajanan aikaväli
  const firstTime = new Date(sortedNotes[0].created_at).getTime();
  const lastTime = new Date(sortedNotes[sortedNotes.length - 1].created_at).getTime();
  const timeSpan = Math.max(lastTime - firstTime, 1000 * 60 * 5); // vähintään 5 min

  // Sijoita jokainen tarra aikajanalle
  const getTimelinePosition = (note: typeof sortedNotes[0], index: number) => {
    const noteTime = new Date(note.created_at).getTime();
    const t = timeSpan > 0 ? (noteTime - firstTime) / timeSpan : 0;

    return {
      x: 200 + t * (TIMELINE_LENGTH - 400),
      y: 200 + (index % 3) * 280 + Math.sin(index * 1.7) * 80,
      t,
    };
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: TIMELINE_LENGTH + 400,
        height: 1200,
        pointerEvents: 'auto',
      }}
    >
      {/* Aikajanan viiva */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <defs>
          <linearGradient id="timelineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(100,150,255,0.05)" />
            <stop offset="20%" stopColor="rgba(100,150,255,0.3)" />
            <stop offset="50%" stopColor="rgba(180,130,255,0.4)" />
            <stop offset="80%" stopColor="rgba(100,150,255,0.3)" />
            <stop offset="100%" stopColor="rgba(100,150,255,0.05)" />
          </linearGradient>
        </defs>
        <line
          x1={150}
          y1={160}
          x2={TIMELINE_LENGTH + 250}
          y2={160}
          stroke="url(#timelineGrad)"
          strokeWidth={2}
        />
        {/* Aikamerkinnät */}
        {sortedNotes.length > 1 &&
          [0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const timeAt = new Date(firstTime + frac * timeSpan);
            const x = 200 + frac * (TIMELINE_LENGTH - 400);
            return (
              <g key={frac}>
                <line
                  x1={x}
                  y1={155}
                  x2={x}
                  y2={170}
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={185}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.3)"
                  fontSize={10}
                >
                  {timeAt.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </text>
              </g>
            );
          })}
      </svg>

      {/* Tarrat aikajanalla */}
      {sortedNotes.map((note, i) => {
        const { x, y } = getTimelinePosition(note, i);
        const fadeOpacity = getFadeOpacity(note.created_at);
        const isNew = i === sortedNotes.length - 1;

        return (
          <div
            key={note.id}
            className="timeline-note"
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: CARD_WIDTH,
              padding: '12px 14px',
              background: `linear-gradient(135deg, ${note.color}dd, ${note.color}99)`,
              borderRadius: 6,
              boxShadow: isNew
                ? `0 0 20px rgba(150,180,255,0.4), 3px 3px 10px rgba(0,0,0,0.3)`
                : `2px 2px 8px rgba(0,0,0,0.25)`,
              opacity: fadeOpacity * 0.85,
              transform: `rotate(${(i % 5 - 2) * 0.8}deg)`,
              fontSize: 13,
              lineHeight: 1.4,
              color: '#1a1a1a',
              zIndex: isNew ? 10 : 1,
              transition: 'box-shadow 0.3s',
              cursor: 'default',
            }}
          >
            {/* Yhteysviiva aikajanaan */}
            <div
              style={{
                position: 'absolute',
                top: -20,
                left: '50%',
                width: 1,
                height: 20,
                background: `rgba(255,255,255,${fadeOpacity * 0.3})`,
                transform: 'translateX(-50%)',
              }}
            />

            {/* Aikaleima */}
            <div style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', marginBottom: 4, textAlign: 'right' }}>
              {new Date(note.created_at).toLocaleDateString('fi-FI', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            {/* Sisältö */}
            <div className="timeline-content">
              {note.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {note.content.length > 120 ? note.content.slice(0, 120) + '...' : note.content}
                </ReactMarkdown>
              ) : (
                <span style={{ color: '#999', fontStyle: 'italic' }}>tyhjä</span>
              )}
            </div>

            {/* Tagit */}
            {note.tags.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {note.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 9,
                      color: 'rgba(0,0,0,0.5)',
                      background: 'rgba(0,0,0,0.06)',
                      padding: '1px 5px',
                      borderRadius: 8,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
                {note.tags.length > 3 && (
                  <span style={{ fontSize: 9, color: 'rgba(0,0,0,0.3)' }}>
                    +{note.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Uusin-merkki */}
            {isNew && (
              <div
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  background: '#ff6b8a',
                  color: '#fff',
                  fontSize: 9,
                  padding: '2px 6px',
                  borderRadius: 10,
                  boxShadow: '0 0 8px rgba(255,100,140,0.5)',
                }}
              >
                uusin
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
