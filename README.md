# Wanderloop

Open the app, say how long you want to walk, get a loop route starting and ending where you are, and just follow it. No destination planning required.

## Stack

- Vite + React + TypeScript, built as an installable PWA (no app store needed)
- MapLibre GL + CARTO Positron (a free OpenStreetMap-based vector basemap with a deliberately minimal style, so the route stands out instead of competing with road casings/labels/dashed paths)
- OSRM (public `routed-foot` demo instance, self-hostable later) for walking-profile routing
- Saved walks stored locally in IndexedDB — no accounts, no server

## Loop generation

Target duration is converted to a target distance at an assumed ~5 km/h walking pace. A waypoint roughly half that distance away is picked in a randomized direction, offset laterally so the routed path back differs from the path out, and OSRM is asked to route through it and back to the start. If the resulting distance misses the target, the leg length is rescaled and retried (up to a few attempts), keeping the closest result. See `src/lib/routing.ts`.

## MVP features

1. Get current location (Geolocation API)
2. Pick a duration (15/30/45/60 min presets)
3. Generate a loop route, shown on the map with distance/time
4. "Start walk" — a live position dot shows where you are on the route
5. "Give me another" to regenerate
6. Save / list / delete walks locally (IndexedDB)
7. Offline banner, geolocation/routing error handling, installable PWA with cached map tiles

Explicitly deferred: accounts/sync, LLM-themed routes, voice turn-by-turn, elevation preferences, stats, sharing.

## Development

```
npm install
npm run dev
```

```
npm run build    # typecheck + production build
npm run lint
npm run preview
```

Routing defaults to the public `https://routing.openstreetmap.de/routed-foot` OSRM demo. Point it at a self-hosted instance via `VITE_OSRM_BASE_URL`.
