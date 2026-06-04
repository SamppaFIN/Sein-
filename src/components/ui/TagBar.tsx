import { useWallStore } from '@/store/useWallStore';

export function TagBar() {
  const allTags = useWallStore((s) => s.allTags);
  const selectedTags = useWallStore((s) => s.selectedTags);
  const toggleTag = useWallStore((s) => s.toggleTag);

  if (allTags.length === 0) return null;

  return (
    <div className="tag-bar no-select">
      <span className="tag-bar-label">🏷️</span>
      <div className="tag-bar-tags">
        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          const count = useWallStore.getState().notes.filter((n) => n.tags.includes(tag)).length;
          return (
            <span
              key={tag}
              className={`tag-bar-item ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              #{tag}
              <span className="tag-bar-count">{count}</span>
            </span>
          );
        })}
      </div>
      {selectedTags.length > 0 && (
        <button
          className="tag-bar-clear"
          onClick={() => selectedTags.forEach((t) => toggleTag(t))}
          title="Tyhjennä suodatus"
        >
          ✕
        </button>
      )}
    </div>
  );
}
