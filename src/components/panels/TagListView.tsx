import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useWallStore } from '@/store/useWallStore';

export function TagListView() {
  const notes = useWallStore((s) => s.notes);
  const activeListViewTag = useWallStore((s) => s.activeListViewTag);
  const setActiveListViewTag = useWallStore((s) => s.setActiveListViewTag);

  if (!activeListViewTag) return null;

  // Suodata ja järjestä aikajärjestykseen (uusin ensin)
  const filteredNotes = notes
    .filter((n) => n.tags.includes(activeListViewTag))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="tag-list-view no-select">
      {/* Otsikko */}
      <div className="tag-list-header">
        <h2>
          🏷️ #{activeListViewTag}
          <span className="tag-list-count">{filteredNotes.length} viestiä</span>
        </h2>
        <button
          className="tag-list-close"
          onClick={() => setActiveListViewTag(null)}
          title="Sulje"
        >
          ✕
        </button>
      </div>

      {/* Viestilista */}
      <div className="tag-list-body">
        {filteredNotes.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
            Ei viestejä tällä tagilla
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="tag-list-item">
              <div className="tag-list-item-header">
                <span
                  className="tag-list-item-color"
                  style={{ background: note.color }}
                />
                <span className="tag-list-item-time">
                  {new Date(note.created_at).toLocaleDateString('fi-FI', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="tag-list-item-content">
                {note.content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {note.content}
                  </ReactMarkdown>
                ) : (
                  <span style={{ color: '#aaa', fontStyle: 'italic' }}>Tyhjä viesti</span>
                )}
              </div>
              {note.tags.length > 1 && (
                <div className="tag-list-item-tags">
                  {note.tags
                    .filter((t) => t !== activeListViewTag)
                    .map((t) => (
                      <span key={t} className="tag-list-item-tag">#{t}</span>
                    ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
