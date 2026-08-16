import type { Walk } from '../lib/types';
import { formatDate, formatDistance, formatDuration } from '../lib/format';

interface SavedWalksProps {
  walks: Walk[];
  loading: boolean;
  onView: (walk: Walk) => void;
  onDelete: (id: string) => void;
}

export function SavedWalks({ walks, loading, onView, onDelete }: SavedWalksProps) {
  if (loading) {
    return <p className="saved-walks__empty">Loading saved walks…</p>;
  }

  if (walks.length === 0) {
    return <p className="saved-walks__empty">No saved walks yet. Generate a loop and save it to see it here.</p>;
  }

  return (
    <ul className="saved-walks">
      {walks.map((walk) => (
        <li key={walk.id} className="saved-walks__item">
          <button type="button" className="saved-walks__main" onClick={() => onView(walk)}>
            <strong>{formatDistance(walk.distanceMeters)}</strong>
            <span>{formatDuration(walk.durationSeconds)} · requested {walk.targetMinutes} min</span>
            <span className="saved-walks__date">{formatDate(walk.createdAt)}</span>
          </button>
          <button
            type="button"
            className="saved-walks__delete"
            aria-label="Delete walk"
            onClick={() => onDelete(walk.id)}
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
