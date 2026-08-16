import { useCallback, useEffect, useRef, useState } from 'react';
import type { LatLng } from './types';

interface GeolocationState {
  position: LatLng | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: false,
  });

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ position: null, error: 'Geolocation is not supported on this device.', loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          loading: false,
        });
      },
      (err) => {
        setState({ position: null, error: geolocationErrorMessage(err), loading: false });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, []);

  return { ...state, request };
}

/** Continuously tracks live position, e.g. while a walk is in progress. */
export function useWatchPosition(active: boolean) {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!active || !('geolocation' in navigator)) return;

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setError(geolocationErrorMessage(err)),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [active]);

  return { position, error };
}

function geolocationErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Location access was denied. Enable it in your browser settings to generate a loop.';
    case err.POSITION_UNAVAILABLE:
      return 'Your location is currently unavailable. Try again in a moment.';
    case err.TIMEOUT:
      return 'Timed out getting your location. Try again.';
    default:
      return 'Could not get your location.';
  }
}
