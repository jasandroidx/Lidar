import React, { useState, useEffect } from 'react';
import { MapRadarCanvas } from './components/MapRadarCanvas';
import { MarkerDetailPopup } from './components/MarkerDetailPopup';
import { ChronicleDrawer } from './components/ChronicleDrawer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { TerrainTarget, LiDARShaderMode, GPSCoordinate, FootstepBreadcrumb } from './types';
import { INITIAL_HISTORICAL_TARGETS, PIKE_CENTER_COORDS } from './data/historicalData';

export default function App() {
  const [targets, setTargets] = useState<TerrainTarget[]>(INITIAL_HISTORICAL_TARGETS);
  const [selectedTarget, setSelectedTarget] = useState<TerrainTarget | null>(INITIAL_HISTORICAL_TARGETS[0]);
  const [userGps, setUserGps] = useState<GPSCoordinate | null>({
    latitude: PIKE_CENTER_COORDS.latitude - 0.005,
    longitude: PIKE_CENTER_COORDS.longitude - 0.005,
    headingDeg: 42,
    accuracyMeters: 3.5
  });
  const [isGpsActive, setIsGpsActive] = useState(true);
  const [peelPercent, setPeelPercent] = useState(50);
  const [lidarShader, setLidarShader] = useState<LiDARShaderMode>('analytical_hillshade');
  const [breadcrumbs, setBreadcrumbs] = useState<FootstepBreadcrumb[]>([]);
  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);
  const [isChronicleOpen, setIsChronicleOpen] = useState(false);

  // Update distance calculation relative to GPS
  useEffect(() => {
    if (!userGps) return;
    setTargets((prev) =>
      prev.map((t) => {
        const dLat = (t.latitude - userGps.latitude) * 111000;
        const dLng = (t.longitude - userGps.longitude) * 111000 * Math.cos((t.latitude * Math.PI) / 180);
        const dist = Math.hypot(dLat, dLng);
        return { ...t, distanceMeters: dist };
      })
    );
  }, [userGps]);

  const handleUpdateStatus = (id: string, status: any, notes?: string) => {
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, verificationStatus: status, fieldNotes: notes !== undefined ? notes : t.fieldNotes } : t))
    );
    if (selectedTarget && selectedTarget.id === id) {
      setSelectedTarget((prev) => (prev ? { ...prev, verificationStatus: status, fieldNotes: notes !== undefined ? notes : prev.fieldNotes } : null));
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#040d0b] text-stone-100 flex flex-col font-sans-ui">
      <header className="h-14 bg-stone-950/90 border-b border-emerald-900/40 px-4 flex items-center justify-between z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
          <h1 className="font-serif-title font-bold text-base sm:text-lg tracking-wide text-emerald-400">
            PIKE TERRAIN RADAR
          </h1>
          <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            1885 GOODSPEED
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsChronicleOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-700/60 text-xs font-mono-tech text-emerald-300 hover:bg-emerald-900 transition flex items-center gap-1.5"
          >
            📜 CHRONICLES ({targets.length})
          </button>
          <PWAInstallButton />
          <OfflineIndicator />
        </div>
      </header>

      <main className="relative flex-1 w-full h-full">
        <MapRadarCanvas
          targets={targets}
          selectedTarget={selectedTarget}
          onSelectTarget={(t) => setSelectedTarget(t)}
          userGps={userGps}
          isGpsActive={isGpsActive}
          onToggleGps={() => setIsGpsActive(!isGpsActive)}
          peelPercent={peelPercent}
          onPeelChange={(p) => setPeelPercent(p)}
          lidarShader={lidarShader}
          onShaderChange={(s) => setLidarShader(s)}
          breadcrumbs={breadcrumbs}
          onAddBreadcrumb={(b) => setBreadcrumbs((prev) => [...prev, b])}
          isSimulatingWalk={isSimulatingWalk}
          onToggleSimulateWalk={() => setIsSimulatingWalk(!isSimulatingWalk)}
        />

        {selectedTarget && (
          <MarkerDetailPopup
            target={selectedTarget}
            onClose={() => setSelectedTarget(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </main>

      <ChronicleDrawer
        isOpen={isChronicleOpen}
        onClose={() => setIsChronicleOpen(false)}
        targets={targets}
        onSelectTarget={(t) => {
          setSelectedTarget(t);
          setIsChronicleOpen(false);
        }}
      />
    </div>
  );
}
