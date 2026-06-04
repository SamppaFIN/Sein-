import { useWallStore } from '@/store/useWallStore';

export function TagPanel() {
  const allTags = useWallStore((s) => s.allTags);
  const selectedTags = useWallStore((s) => s.selectedTags);
  const toggleTag = useWallStore((s) => s.toggleTag);
  const setActiveListViewTag = useWallStore((s) => s.setActiveListViewTag);

  if (allTags.length === 0) return null;

  return (
    <div className="tag-panel no-select">
      <h3>🏷️ Tagit</h3>
      {allTags.map((tag) => (
        <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div
            className={`tag-item ${selectedTags.includes(tag) ? 'selected' : ''}`}
            style={{ flex: 1 }}
            onClick={() => toggleTag(tag)}
          >
            #{tag}
            {selectedTags.includes(tag) && ' ✓'}
          </div>
          <span
            className="tag-list-link"
            onClick={() => setActiveListViewTag(tag)}
            title={`Näytä kaikki #${tag} aikajärjestyksessä`}
            style={{
              cursor: 'pointer',
              fontSize: 12,
              opacity: 0.6,
              padding: '2px 4px',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
          >
            📋
          </span>
        </div>
      ))}
      {selectedTags.length > 0 && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11,
            color: '#999',
            cursor: 'pointer',
            textAlign: 'center',
          }}
          onClick={() => selectedTags.forEach((t) => toggleTag(t))}
        >
          Tyhjennä suodatus
        </div>
      )}
    </div>
  );
}
