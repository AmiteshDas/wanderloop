import type { LatLng, RouteResult } from './types';
import { destinationPoint, pathLength } from './geo';

/**
 * Public OSRM demo server configured with the "foot" (walking) profile,
 * hosted by FOSSGIS/OpenStreetMap.de. Swap this for a self-hosted OSRM
 * instance later by overriding VITE_OSRM_BASE_URL.
 */
const OSRM_BASE_URL =
  (import.meta.env.VITE_OSRM_BASE_URL as string | undefined) ??
  'https://routing.openstreetmap.de/routed-foot';
const OSRM_PROFILE = 'foot';

/** Average walking pace used to convert a target duration into a target distance. */
const WALKING_SPEED_MPS = 5000 / 3600; // 5 km/h

export class RoutingError extends Error {}

export function targetDistanceForMinutes(minutes: number): number {
  return minutes * 60 * WALKING_SPEED_MPS;
}

function toOsrmCoordString(points: LatLng[]): string {
  return points.map((p) => `${p.lng},${p.lat}`).join(';');
}

async function osrmRoute(points: LatLng[]): Promise<RouteResult> {
  const url = `${OSRM_BASE_URL}/route/v1/${OSRM_PROFILE}/${toOsrmCoordString(points)}?overview=full&geometries=geojson&steps=false`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new RoutingError('Could not reach the routing service. Check your connection and try again.');
  }

  if (!response.ok) {
    throw new RoutingError('The routing service could not find a walking route there. Try again.');
  }

  const data = await response.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) {
    throw new RoutingError('No walking route could be found nearby. Try again.');
  }

  const route = data.routes[0];
  const coordinates: LatLng[] = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
    lat,
    lng,
  }));

  return {
    coordinates,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  };
}

interface LoopOptions {
  /** How close the generated loop must land to the target distance, e.g. 0.2 = within 20%. */
  tolerance?: number;
  maxAttempts?: number;
}

/**
 * Generates a walking loop that starts and ends at `start`.
 *
 * Strategy: pick a far waypoint roughly half the target distance away in a
 * randomized direction, then a second waypoint offset laterally from it, so
 * the routed path out and the routed path back tend to use different streets
 * rather than retracing an out-and-back. Distance is checked against the
 * target and the attempt is scaled/retried if it misses.
 */
export async function generateLoop(
  start: LatLng,
  targetMinutes: number,
  options: LoopOptions = {},
): Promise<RouteResult> {
  const { tolerance = 0.2, maxAttempts = 6 } = options;
  const targetDistance = targetDistanceForMinutes(targetMinutes);
  const halfDistance = targetDistance / 2;

  let best: RouteResult | null = null;
  let bestDiff = Infinity;
  let scale = 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const bearing = Math.random() * 360;
    const legDistance = halfDistance * scale;

    const farPoint = destinationPoint(start, legDistance, bearing);
    // Offset laterally so the return leg is routed differently than the outbound leg.
    const lateralBearing = bearing + (Math.random() < 0.5 ? 1 : -1) * (60 + Math.random() * 40);
    const lateralDistance = Math.min(legDistance * 0.35, 400);
    const offsetPoint = destinationPoint(farPoint, lateralDistance, lateralBearing);

    let result: RouteResult;
    try {
      result = await osrmRoute([start, farPoint, offsetPoint, start]);
    } catch (err) {
      if (attempt === maxAttempts - 1 && !best) throw err;
      continue;
    }

    // Guard against a degenerate route that retraces itself (not a real loop).
    const straightLineOut = pathLength([start, farPoint]);
    const isDegenerate = result.coordinates.length < 4 || straightLineOut < 20;

    const diff = Math.abs(result.distanceMeters - targetDistance) / targetDistance;
    if (!isDegenerate && diff < bestDiff) {
      best = result;
      bestDiff = diff;
    }

    if (!isDegenerate && diff <= tolerance) {
      return result;
    }

    // Missed the target: scale the next attempt's leg distance to compensate.
    if (result.distanceMeters > 0) {
      scale *= targetDistance / result.distanceMeters;
    }
  }

  if (!best) {
    throw new RoutingError('Could not generate a loop route near you. Try again.');
  }
  return best;
}
