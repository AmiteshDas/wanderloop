import { useEffect, useState } from 'react';
import { DurationPicker } from './components/DurationPicker';
import { RoutePreview } from './components/RoutePreview';
import { SavedWalks } from './components/SavedWalks';
import { WalkingScreen } from './components/WalkingScreen';
import { MapView } from './components/MapView';
import { formatDistance, formatDuration } from './lib/format';
import { generateLoop, RoutingError } from './lib/routing';
import { deleteWalk, listWalks, saveWalk } from './lib/storage';
import type { RouteResult, Walk } from './lib/types';
import { useGeolocation } from './lib/useGeolocation';
import { useOnlineStatus } from './lib/useOnlineStatus';

type Tab = 'new' | 'saved';
type Step = 'location' | 'duration' | 'preview' | 'walking';

function makeWalkId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [tab, setTab] = useState<Tab>('new');
  const [step, setStep] = useState<Step>('location');
  const online = useOnlineStatus();

  const { position, error: locationError, loading: locating, request: requestLocation } = useGeolocation();

  const [targetMinutes, setTargetMinutes] = useState<number | null>(null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [routeSaved, setRouteSaved] = useState(false);

  const [savedWalks, setSavedWalks] = useState<Walk[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [viewingWalk, setViewingWalk] = useState<Walk | null>(null);

  useEffect(() => {
    if (position && step === 'location') setStep('duration');
  }, [position, step]);

  useEffect(() => {
    refreshSavedWalks();
  }, []);

  async function refreshSavedWalks() {
    setSavedLoading(true);
    try {
      setSavedWalks(await listWalks());
    } finally {
      setSavedLoading(false);
    }
  }

  async function handlePickDuration(minutes: number) {
    if (!position) return;
    setTargetMinutes(minutes);
    setRouteSaved(false);
    await generate(minutes);
  }

  async function generate(minutes: number) {
    if (!position) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const result = await generateLoop(position, minutes);
      setRoute(result);
      setRouteSaved(false);
      setStep('preview');
    } catch (err) {
      setGenerateError(err instanceof RoutingError ? err.message : 'Something went wrong generating your loop.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!route || !position || !targetMinutes) return;
    const walk: Walk = {
      id: makeWalkId(),
      createdAt: Date.now(),
      targetMinutes,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      coordinates: route.coordinates,
      startPoint: position,
    };
    await saveWalk(walk);
    setRouteSaved(true);
    await refreshSavedWalks();
  }

  async function handleDelete(id: string) {
    await deleteWalk(id);
    if (viewingWalk?.id === id) setViewingWalk(null);
    await refreshSavedWalks();
  }

  function resetToDuration() {
    setStep('duration');
    setRoute(null);
    setGenerateError(null);
  }

  return (
    <div className="app">
      {!online && <div className="banner banner--offline">You're offline — routing needs a connection. Cached tiles and saved walks still work.</div>}

      <header className="app__header">
        <h1>Wanderloop</h1>
        <nav className="app__tabs">
          <button
            type="button"
            className={tab === 'new' ? 'app__tab app__tab--active' : 'app__tab'}
            onClick={() => {
              setTab('new');
              setViewingWalk(null);
            }}
          >
            New walk
          </button>
          <button
            type="button"
            className={tab === 'saved' ? 'app__tab app__tab--active' : 'app__tab'}
            onClick={() => setTab('saved')}
          >
            Saved walks
          </button>
        </nav>
      </header>

      <main className="app__main">
        {tab === 'new' && step === 'location' && (
          <div className="screen screen--centered">
            <h2>Find a loop from where you are</h2>
            <p>Wanderloop needs your location to build a route that starts and ends right here.</p>
            {locationError && <p className="banner banner--error">{locationError}</p>}
            <button type="button" className="button button--primary" onClick={requestLocation} disabled={locating}>
              {locating ? 'Locating…' : 'Use my location'}
            </button>
          </div>
        )}

        {tab === 'new' && step === 'duration' && position && (
          <div className="screen">
            <DurationPicker onPick={handlePickDuration} disabled={generating} />
            {generating && <p className="banner">Generating your loop…</p>}
            {generateError && (
              <div className="banner banner--error">
                {generateError}
                {targetMinutes && (
                  <button type="button" className="link-button" onClick={() => generate(targetMinutes)}>
                    Try again
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 'new' && step === 'preview' && position && route && targetMinutes && (
          <RoutePreview
            start={position}
            route={route}
            targetMinutes={targetMinutes}
            generating={generating}
            saved={routeSaved}
            onStartWalk={() => setStep('walking')}
            onRegenerate={() => generate(targetMinutes)}
            onSave={handleSave}
            onBack={resetToDuration}
          />
        )}

        {tab === 'new' && step === 'walking' && position && route && (
          <WalkingScreen start={position} route={route} onEndWalk={() => setStep('preview')} />
        )}

        {tab === 'saved' && !viewingWalk && (
          <div className="screen">
            <SavedWalks walks={savedWalks} loading={savedLoading} onView={setViewingWalk} onDelete={handleDelete} />
          </div>
        )}

        {tab === 'saved' && viewingWalk && (
          <div className="screen screen--preview">
            <MapView center={viewingWalk.startPoint} route={viewingWalk.coordinates} startMarker={viewingWalk.startPoint} />
            <div className="preview-panel">
              <button type="button" className="link-button" onClick={() => setViewingWalk(null)}>
                ← Back to saved walks
              </button>
              <div className="preview-stats">
                <div>
                  <strong>{formatDistance(viewingWalk.distanceMeters)}</strong>
                  <span>distance</span>
                </div>
                <div>
                  <strong>{formatDuration(viewingWalk.durationSeconds)}</strong>
                  <span>~ walk time</span>
                </div>
              </div>
              <button type="button" className="button button--ghost" onClick={() => handleDelete(viewingWalk.id)}>
                Delete this walk
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
