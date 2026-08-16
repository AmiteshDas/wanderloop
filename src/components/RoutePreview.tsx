import type { LatLng, RouteResult } from '../lib/types';
import { formatDistance, formatDuration } from '../lib/format';
import { MapView } from './MapView';

interface RoutePreviewProps {
  start: LatLng;
  route: RouteResult;
  targetMinutes: number;
  generating: boolean;
  onStartWalk: () => void;
  onRegenerate: () => void;
  onSave: () => void;
  onBack: () => void;
  saved: boolean;
}

export function RoutePreview({
  start,
  route,
  targetMinutes,
  generating,
  onStartWalk,
  onRegenerate,
  onSave,
  onBack,
  saved,
}: RoutePreviewProps) {
  return (
    <div className="screen screen--preview">
      <MapView center={start} route={route.coordinates} startMarker={start} />
      <div className="preview-panel">
        <button type="button" className="link-button" onClick={onBack}>
          ← Change duration
        </button>
        <div className="preview-stats">
          <div>
            <strong>{formatDistance(route.distanceMeters)}</strong>
            <span>distance</span>
          </div>
          <div>
            <strong>{formatDuration(route.durationSeconds)}</strong>
            <span>~ walk time</span>
          </div>
          <div>
            <strong>{targetMinutes} min</strong>
            <span>requested</span>
          </div>
        </div>
        <div className="preview-actions">
          <button type="button" className="button button--primary" onClick={onStartWalk} disabled={generating}>
            Start walk
          </button>
          <button type="button" className="button" onClick={onRegenerate} disabled={generating}>
            {generating ? 'Generating…' : 'Give me another'}
          </button>
          <button type="button" className="button button--ghost" onClick={onSave} disabled={saved || generating}>
            {saved ? 'Saved ✓' : 'Save for later'}
          </button>
        </div>
      </div>
    </div>
  );
}
