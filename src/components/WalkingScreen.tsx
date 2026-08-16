import type { LatLng, RouteResult } from '../lib/types';
import { formatDistance, formatDuration } from '../lib/format';
import { useWatchPosition } from '../lib/useGeolocation';
import { MapView } from './MapView';

interface WalkingScreenProps {
  start: LatLng;
  route: RouteResult;
  onEndWalk: () => void;
}

export function WalkingScreen({ start, route, onEndWalk }: WalkingScreenProps) {
  const { position, error } = useWatchPosition(true);

  return (
    <div className="screen screen--walking">
      <MapView center={position ?? start} route={route.coordinates} startMarker={start} liveMarker={position} zoom={17} />
      <div className="walking-panel">
        {error && <p className="banner banner--warning">{error}</p>}
        <div className="preview-stats">
          <div>
            <strong>{formatDistance(route.distanceMeters)}</strong>
            <span>loop distance</span>
          </div>
          <div>
            <strong>{formatDuration(route.durationSeconds)}</strong>
            <span>~ walk time</span>
          </div>
        </div>
        <p className="walking-panel__hint">Follow the blue line. The dot shows where you are.</p>
        <button type="button" className="button button--primary" onClick={onEndWalk}>
          End walk
        </button>
      </div>
    </div>
  );
}
