import { useWallStore } from '@/store/useWallStore';
import type { TimeMode } from '@/types';

const LABELS: Record<TimeMode, string> = {
  all: 'Kaikki',
  day: 'Päivä',
  week: 'Viikko',
  month: 'Kuukausi',
};

export function TimeFilter() {
  const timeMode = useWallStore((s) => s.timeMode);
  const timeOffset = useWallStore((s) => s.timeOffset);
  const setTimeMode = useWallStore((s) => s.setTimeMode);
  const setTimeOffset = useWallStore((s) => s.setTimeOffset);
  const notes = useWallStore((s) => s.notes);

  // Laske nykyisen filtterin viestimäärä
  const filteredCount = notes.filter((n) => {
    if (timeMode === 'all') return true;
    const now = Date.now();
    const msInDay = 86400000;
    const range = timeMode === 'day' ? 1 : timeMode === 'week' ? 7 : 30;
    const start = now - (timeOffset + range) * msInDay;
    const end = now - timeOffset * msInDay;
    const t = new Date(n.created_at).getTime();
    return t >= start && t <= end;
  }).length;

  // Päivämäärän näyttö
  const now = Date.now();
  const msInDay = 86400000;
  const range = timeMode === 'day' ? 1 : timeMode === 'week' ? 7 : 30;
  const periodEnd = new Date(now - timeOffset * msInDay);
  const periodStart = new Date(now - (timeOffset + range) * msInDay);

  const dateLabel = timeMode === 'all'
    ? `${notes.length} viestiä`
    : `${periodStart.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })} – ${periodEnd.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short', year: 'numeric' })} (${filteredCount}/${notes.length})`;

  // Scroll-käsittely aikafiltterille
  const handleWheel = (e: React.WheelEvent) => {
    if (timeMode === 'all') return;
    const delta = e.deltaY > 0 ? 1 : -1;
    const max = 365;
    setTimeOffset(Math.max(0, Math.min(max, timeOffset + delta)));
  };

  return (
    <div
      className="time-filter no-select"
      onWheel={handleWheel}
      title="Rullaa hiirtä selataksesi aikaa"
    >
      {/* Tilavalinta */}
      <div className="time-filter-modes">
        {(Object.keys(LABELS) as TimeMode[]).map((mode) => (
          <button
            key={mode}
            className={timeMode === mode ? 'active' : ''}
            onClick={() => setTimeMode(mode)}
          >
            {LABELS[mode]}
          </button>
        ))}
      </div>

      {/* Ajanavigointi */}
      {timeMode !== 'all' && (
        <div className="time-filter-nav">
          <button
            onClick={() => setTimeOffset(timeOffset + 1)}
            title="Edellinen"
          >
            ‹
          </button>
          <span className="time-filter-date">{dateLabel}</span>
          <button
            onClick={() => timeOffset > 0 && setTimeOffset(timeOffset - 1)}
            disabled={timeOffset <= 0}
            title="Seuraava"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
