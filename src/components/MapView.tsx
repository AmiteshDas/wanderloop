import { useEffect, useRef } from 'react';
import {
  Map as MlMap,
  Marker,
  LngLatBounds,
  type GeoJSONSource,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { LatLng } from '../lib/types';

const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const ROUTE_SOURCE_ID = 'route';
const ROUTE_LAYER_ID = 'route-line';

interface RouteGeoJSON {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

interface MapViewProps {
  center: LatLng;
  route?: LatLng[];
  liveMarker?: LatLng | null;
  startMarker?: LatLng | null;
  zoom?: number;
}

export function MapView({ center, route, liveMarker, startMarker, zoom = 15 }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const liveMarkerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MlMap({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [center.lng, center.lat],
      zoom,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the map centered when the reference point changes (e.g. new location fix).
  useEffect(() => {
    mapRef.current?.setCenter([center.lng, center.lat]);
  }, [center]);

  // Draw / update the route line.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const geojson: RouteGeoJSON = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: (route ?? []).map((p) => [p.lng, p.lat]),
      },
    };

    const applyRoute = () => {
      const source = map.getSource(ROUTE_SOURCE_ID) as GeoJSONSource | undefined;
      if (source) {
        source.setData(geojson);
      } else {
        map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: geojson });
        map.addLayer({
          id: ROUTE_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.85 },
        });
      }

      if (route && route.length > 1) {
        const lngs = route.map((p) => p.lng);
        const lats = route.map((p) => p.lat);
        const bounds = new LngLatBounds(
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        );
        map.fitBounds(bounds, { padding: 48, duration: 400 });
      }
    };

    if (map.isStyleLoaded()) applyRoute();
    else map.once('load', applyRoute);
  }, [route]);

  // Start/finish marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!startMarker) {
      startMarkerRef.current?.remove();
      startMarkerRef.current = null;
      return;
    }

    if (!startMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'map-marker map-marker--start';
      startMarkerRef.current = new Marker({ element: el });
    }
    startMarkerRef.current.setLngLat([startMarker.lng, startMarker.lat]).addTo(map);
  }, [startMarker]);

  // Live "you are here" dot.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!liveMarker) {
      liveMarkerRef.current?.remove();
      liveMarkerRef.current = null;
      return;
    }

    if (!liveMarkerRef.current) {
      const el = document.createElement('div');
      el.className = 'map-marker map-marker--live';
      liveMarkerRef.current = new Marker({ element: el });
    }
    liveMarkerRef.current.setLngLat([liveMarker.lng, liveMarker.lat]).addTo(map);
  }, [liveMarker]);

  return <div ref={containerRef} className="map-view" />;
}
