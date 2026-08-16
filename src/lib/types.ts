export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteResult {
  /** [lng, lat] pairs, in path order, as returned by OSRM */
  coordinates: LatLng[];
  distanceMeters: number;
  durationSeconds: number;
}

export interface Walk {
  id: string;
  createdAt: number;
  targetMinutes: number;
  distanceMeters: number;
  durationSeconds: number;
  coordinates: LatLng[];
  startPoint: LatLng;
}
