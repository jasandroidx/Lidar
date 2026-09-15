import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Layers,
  BookOpen,
  Share2,
  FileDown,
  Shield,
  CheckCircle2,
  Footprints,
  XCircle,
  Scan,
  TreePine,
  Mountain,
  Navigation,
  Sparkles,
  Menu,
  X,
  Copy,
  Check,
  Search,
  Sliders,
  Maximize2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { MapRadarCanvas } from './components/MapRadarCanvas';
import { MarkerDetailPopup } from './components/MarkerDetailPopup';
import { ChronicleDrawer } from './components/ChronicleDrawer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { INITIAL_HISTORICAL_TARGETS, INITIAL_GRID_TILES, PIKE_CENTER_COORDS } from './data/historicalData';
import {
  TerrainTarget,
  VerificationStatus,
  LiDARShaderMode,
  GPSCoordinate,
  FootstepBreadcrumb,
  ScanGridTile
} from './types';
import { playAudioFeedback, triggerHaptic } from './utils/hapticsAndAudio';
import { downloadGPXFile } from './utils/gpxExporter';
import { copyObsidianToClipboard, downloadObsidianMarkdown } from './utils/obsidianExporter';

export default function App() {
  // Candidate Targets state with local storage persistence
  const [targets, setTargets] = useState<TerrainTarget[]>(() => {
    try {
      const saved = localStorage.getItem('pike_terrain_targets');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return INITIAL_HISTORICAL_TARGETS;
  });

  // Grokbot Grid Blocks state
  const [gridTiles, setGridTiles] = useState<ScanGridTile[]>(() => {
    try {
      const saved = localStorage.getItem('pike_scan_grid_tiles');
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return INITIAL_GRID_TILES;
  });

  // Save grid tiles to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pike_scan_grid_tiles', JSON.stringify(gridTiles));
    } catch {
      // Ignore
    }
  }, [gridTiles]);

  // Queue a grid tile next handler
  const handleQueueGridTile = (tileId: string) => {
    setGridTiles((prev) =>
      prev.map((tile) => {
        if (tile.id === tileId) {
          return {
            ...tile,
            status: 'queued',
            nextScheduledScanTime: 'Priority #1 (Queued by Operator)'
          };
        }
        return tile;
      })
    );
  };

  // Selected marker state
  const [selectedTarget, setSelectedTarget] = useState<TerrainTarget | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [lockedTarget, setLockedTarget] = useState<TerrainTarget | null>(null);

  // Canopy Peel slider percentage state (0 = pure LiDAR relief, 100 = satellite canopy, default = 85)
  const [peelPercent, setPeelPercent] = useState<number>(85);
  const [lidarShader, setLidarShader] = useState<LiDARShaderMode>('analytical_hillshade');

  // Live GPS navigation & Breadcrumb footsteps
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [userGps, setUserGps] = useState<GPSCoordinate | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FootstepBreadcrumb[]>([]);
  const [isSimulatingWalk, setIsSimulatingWalk] = useState<boolean>(false);

  // Chronicle Drawer & Mobile/Desktop UI state
  const [isChronicleOpen, setIsChronicleOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Save targets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pike_terrain_targets', JSON.stringify(targets));
    } catch {
      // Ignore storage error
    }
  }, [targets]);

  // Haversine distance helper
  const calculateDistanceAndBearing = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371000; // meters
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      // Bearing
      const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
      const x =
        Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
        Math.sin((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.cos(dLon);
      const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

      return { distance, bearing };
    },
    []
  );

  // Bolt Optimization: Dynamically compute range/bearing for selected target without mutating state
  const selectedTargetWithDistance = useMemo(() => {
    if (!selectedTarget) return null;
    if (!userGps) return selectedTarget;
    const { distance, bearing } = calculateDistanceAndBearing(
      userGps.latitude,
      userGps.longitude,
      selectedTarget.latitude,
      selectedTarget.longitude
    );
    return {
      ...selectedTarget,
      distanceMeters: distance,
      bearingDeg: bearing
    };
  }, [selectedTarget, userGps, calculateDistanceAndBearing]);

  // Bolt Optimization: Decouple ephemeral GPS distance & bearing calculations from persistent `targets` state.
  // Instead of triggering a full `setTargets` state update on every GPS tick (which rewrites state & localStorage),
  // distance and bearing are calculated dynamically on demand in memoized view projections below.

  // Handle Real Device Geolocation API
  useEffect(() => {
    if (!isGpsActive) return;

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setIsGpsActive(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newGps: GPSCoordinate = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitudeMeters: pos.coords.altitude || undefined,
          accuracyMeters: pos.coords.accuracy,
          headingDeg: pos.coords.heading || 45,
          speedMps: pos.coords.speed || 0,
          timestamp: pos.timestamp
        };
        setUserGps(newGps);

        // Add breadcrumb footstep
        setBreadcrumbs((prev) => [
          ...prev,
          {
            x: 0,
            y: 0,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: pos.timestamp
          }
        ]);
      },
      (err) => {
        console.warn('GPS error:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isGpsActive]);

  // Virtual Field Walk Simulator for testing
  useEffect(() => {
    if (!isSimulatingWalk) return;

    // Start near Winslow townsite
    let currentLat = 38.384;
    let currentLng = -87.218;
    let heading = 45;

    const interval = setInterval(() => {
      currentLat += (Math.random() * 0.0003 - 0.0001);
      currentLng += (Math.random() * 0.0003 - 0.0001);
      heading = (heading + (Math.random() * 20 - 10)) % 360;

      const newGps: GPSCoordinate = {
        latitude: currentLat,
        longitude: currentLng,
        headingDeg: heading,
        speedMps: 1.4,
        accuracyMeters: 3,
        timestamp: Date.now()
      };

      setUserGps(newGps);

      setBreadcrumbs((prev) => [
        ...prev.slice(-40), // keep last 40 steps
        {
          x: 0,
          y: 0,
          lat: currentLat,
          lng: currentLng,
          timestamp: Date.now()
        }
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulatingWalk]);

  // Handle status changes (Confirm, Walkover, Reject)
  const handleStatusChange = (id: string, status: VerificationStatus) => {
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, verificationStatus: status } : t))
    );
    if (selectedTarget && selectedTarget.id === id) {
      setSelectedTarget((prev) => (prev ? { ...prev, verificationStatus: status } : null));
    }
  };

  // Toggle Live GPS
  const handleToggleGps = () => {
    if (!isGpsActive) {
      playAudioFeedback('ping');
      triggerHaptic([30, 30]);
      setIsGpsActive(true);
      // Set initial GPS location if not set
      if (!userGps) {
        setUserGps({
          latitude: 38.3871,
          longitude: -87.2162,
          headingDeg: 45,
          timestamp: Date.now()
        });
      }
    } else {
      playAudioFeedback('lock');
      setIsGpsActive(false);
      setIsSimulatingWalk(false);
    }
  };

  // Target selection handler
  const handleSelectTarget = (target: TerrainTarget) => {
    setSelectedTarget(target);
    setIsPopupOpen(true);
  };

  // Filtered candidate list for sidebar & navigation (dynamically calculates range if userGPS present)
  const filteredTargets = useMemo(() => {
    return targets
      .filter((t) => {
        const matchCat = filterCategory === 'all' || t.category === filterCategory;
        const matchStatus = filterStatus === 'all' || t.verificationStatus === filterStatus;
        const matchSearch =
          searchQuery === '' ||
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.township.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.pioneerFamily.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchStatus && matchSearch;
      })
      .map((t) => {
        if (!userGps) return t;
        const { distance, bearing } = calculateDistanceAndBearing(
          userGps.latitude,
          userGps.longitude,
          t.latitude,
          t.longitude
        );
        return {
          ...t,
          distanceMeters: distance,
          bearingDeg: bearing
        };
      });
  }, [targets, filterCategory, filterStatus, searchQuery, userGps, calculateDistanceAndBearing]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0d1117] text-stone-100 flex flex-col font-sans-ui">
      {/* --------------------------------------------------------------------- */}
      {/* DARK TRANSLUCENT FLOATING HUD TOP BAR ("Pike Terrain Keep")           */}
      {/* --------------------------------------------------------------------- */}
      <header
        id="hud-top-bar"
        className="absolute top-0 left-0 right-0 z-40 px-3 py-2.5 sm:px-6 sm:py-3 bg-[#0d1117]/80 border-b border-emerald-900/50 backdrop-blur-md flex items-center justify-between shadow-2xl"
      >
        {/* Brand / Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="btn-toggle-sidebar"
            onClick={() => {
              playAudioFeedback('lock');
              setIsSidebarOpen(!isSidebarOpen);
            }}
            className="p-1.5 rounded-lg bg-stone-900/80 border border-emerald-800/50 text-emerald-400 hover:text-emerald-200 transition active:scale-95"
            title="Toggle Glassmorphic Radar Sidebar"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold font-display text-emerald-100 tracking-wider">
                  Pike Terrain Keep
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/40 text-[10px] font-mono-tech text-emerald-300">
                  LiDAR 1m DEM
                </span>
              </div>
              <p className="text-[10px] font-mono-tech text-stone-400 hidden sm:block">
                PATOKA & WHITE RIVER HISTORICAL RADAR • PIKE COUNTY, IN
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Export Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Field GPS Tracking Button */}
          <button
            id="btn-hud-gps"
            onClick={handleToggleGps}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono-tech transition flex items-center gap-1.5 shadow-md active:scale-95 ${
              isGpsActive
                ? 'bg-blue-600 border-blue-400 text-white font-bold animate-pulse shadow-blue-900/60'
                : 'bg-stone-900/80 border-stone-700 text-stone-300 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{isGpsActive ? 'FIELD GPS ACTIVE' : 'FIELD GPS'}</span>
          </button>

          {/* GPX Export Button */}
          <button
            id="btn-hud-gpx"
            onClick={() => {
              playAudioFeedback('lock');
              downloadGPXFile(targets);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-600/50 text-xs font-mono-tech text-emerald-300 transition flex items-center gap-1.5 shadow-md active:scale-95"
            title="Export confirmed sites to GPX for onX Hunt / Gaia GPS"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>GPX</span>
          </button>

          {/* Chronicle Drawer Trigger */}
          <button
            id="btn-hud-chronicle"
            onClick={() => {
              playAudioFeedback('confirm');
              setIsChronicleOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900/80 border border-amber-600/50 text-xs font-mono-tech text-amber-300 transition flex items-center gap-1.5 shadow-md active:scale-95"
            title="Open 1885 Goodspeed Chronicle & Pioneer Badges"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">CHRONICLE</span>
          </button>

          {/* PWA & Offline Indicators */}
          <OfflineIndicator />
          <PWAInstallButton />
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* MAIN VIEWPORT CANVAS: ESRI WORLD IMAGERY + CANOPY PEEL OVERLAY        */}
      {/* --------------------------------------------------------------------- */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <MapRadarCanvas
          targets={filteredTargets}
          selectedTarget={selectedTargetWithDistance}
          onSelectTarget={handleSelectTarget}
          userGps={userGps}
          isGpsActive={isGpsActive}
          onToggleGps={handleToggleGps}
          peelPercent={peelPercent}
          onPeelChange={setPeelPercent}
          lidarShader={lidarShader}
          onShaderChange={setLidarShader}
          breadcrumbs={breadcrumbs}
          onAddBreadcrumb={(pt) => setBreadcrumbs((prev) => [...prev, pt])}
          isSimulatingWalk={isSimulatingWalk}
          onToggleSimulateWalk={() => setIsSimulatingWalk(!isSimulatingWalk)}
          gridTiles={gridTiles}
          onQueueGridTile={handleQueueGridTile}
        />

        {/* ------------------------------------------------------------------- */}
        {/* DESKTOP GLASSMORPHIC RADAR SIDEBAR (COLLAPSIBLE)                    */}
        {/* ------------------------------------------------------------------- */}
        {isSidebarOpen && (
          <aside
            id="sidebar-radar-glass"
            className="absolute top-16 left-3 bottom-6 z-30 w-80 sm:w-96 bg-[#071714]/90 border border-emerald-500/30 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden animate-slide-right"
          >
            {/* Sidebar Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-950/90 to-stone-900 border-b border-emerald-900/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold font-display text-emerald-100 uppercase tracking-wider">
                  LiDAR & Grokbot Hub
                </h3>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-stone-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grokbot Grid Scan Banner */}
            <div className="p-3 bg-stone-900/90 border-b border-stone-800 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono-tech text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> GROKBOT SCAN TILES
                </span>
                <span className="text-[10px] font-mono-tech text-stone-400">
                  {gridTiles.filter((g) => g.status === 'scanned').length} / {gridTiles.length} COMPLETE
                </span>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {gridTiles.map((tile) => (
                  <button
                    key={tile.id}
                    onClick={() => {
                      playAudioFeedback('lock');
                      if (tile.status === 'unscanned' || tile.status === 'queued') {
                        handleQueueGridTile(tile.id);
                      }
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-mono-tech whitespace-nowrap border transition ${
                      tile.status === 'scanned'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                        : tile.status === 'scanning'
                        ? 'bg-amber-950 text-amber-300 border-amber-600 animate-pulse'
                        : tile.status === 'queued'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                        : 'bg-stone-800 text-stone-300 border-stone-700 hover:border-amber-500'
                    }`}
                  >
                    {tile.code.split(' ')[0]} ({tile.status})
                  </button>
                ))}
              </div>
            </div>

            {/* Search & Filters */}
            <div className="p-3 bg-[#051411] border-b border-stone-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search cellar, township, pioneer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-stone-900 border border-stone-700 text-xs font-mono-tech text-stone-100 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex gap-2 text-[10px] font-mono-tech">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-md p-1.5 text-stone-300"
                >
                  <option value="all">ALL CATEGORIES</option>
                  <option value="cellar_hole">Cellar Hole</option>
                  <option value="pioneer_well">Pioneer Well / Cistern</option>
                  <option value="blockhouse_fort">Blockhouse Fort</option>
                  <option value="prehistoric_mound">Prehistoric Mound</option>
                  <option value="mill_race">Mill Race</option>
                  <option value="historic_trace">Historic Trace</option>
                  <option value="coal_drift">Coal Drift</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-md p-1.5 text-stone-300"
                >
                  <option value="all">ALL STATUSES</option>
                  <option value="unverified">Unverified</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="walkover">Walkover</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Candidate List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredTargets.map((target) => (
                <div
                  key={target.id}
                  onClick={() => handleSelectTarget(target)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    selectedTarget?.id === target.id
                      ? 'bg-emerald-950/80 border-emerald-400 shadow-lg'
                      : 'bg-[#061814]/70 border-stone-800 hover:border-emerald-700/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono-tech uppercase text-emerald-400 font-semibold px-2 py-0.5 rounded bg-black/40 border border-emerald-900/60">
                      {target.category.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-[9px] font-mono-tech uppercase font-bold px-1.5 py-0.5 rounded ${
                        target.verificationStatus === 'confirmed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                          : target.verificationStatus === 'walkover'
                          ? 'bg-amber-950 text-amber-300 border border-amber-600'
                          : target.verificationStatus === 'rejected'
                          ? 'bg-rose-950 text-rose-300 border border-rose-600'
                          : 'bg-stone-900 text-stone-400 border border-stone-700'
                      }`}
                    >
                      {target.verificationStatus}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold font-display text-stone-100 mt-1">
                    {target.name}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] font-mono-tech text-stone-400 mt-2">
                    <span>{target.township} Twp</span>
                    <span>{target.dimensionsFeet}</span>
                    {target.distanceMeters && (
                      <span className="text-cyan-400 font-bold">
                        {Math.round(target.distanceMeters)}m
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* MOBILE BOTTOM-SHEET SWIPE CARD (TOUCH-FRIENDLY HITS)               */}
        {/* ------------------------------------------------------------------- */}
        {selectedTargetWithDistance && !isPopupOpen && (
          <div
            id="mobile-bottom-sheet-card"
            className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-30 p-4 rounded-2xl bg-[#071714]/95 border border-emerald-500/40 backdrop-blur-xl shadow-2xl animate-slide-up"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono-tech uppercase text-emerald-400 font-semibold">
                  {selectedTargetWithDistance.category.replace(/_/g, ' ')} • {selectedTargetWithDistance.township} Twp
                </span>
                <h3 className="text-base font-bold font-display text-emerald-100">
                  {selectedTargetWithDistance.name}
                </h3>
              </div>

              <button
                onClick={() => setSelectedTarget(null)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Distance & Bearing */}
            <div className="flex items-center justify-between text-xs font-mono-tech text-stone-300 my-2.5 p-2 rounded-lg bg-black/40 border border-emerald-900/40">
              <span>EST. SETTLED: {selectedTargetWithDistance.yearSettled}</span>
              {selectedTargetWithDistance.distanceMeters ? (
                <span className="text-cyan-300 font-bold">
                  RANGE: {Math.round(selectedTargetWithDistance.distanceMeters)}m
                </span>
              ) : (
                <span className="text-stone-500">Tap GPS to Track</span>
              )}
            </div>

            {/* Large Mobile Touch Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                id="btn-sheet-confirm"
                onClick={() => {
                  playAudioFeedback('confirm');
                  triggerHaptic([30, 40, 30]);
                  handleStatusChange(selectedTargetWithDistance.id, 'confirmed');
                }}
                className={`py-2 px-1 rounded-xl text-xs font-mono-tech font-bold border flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                  selectedTargetWithDistance.verificationStatus === 'confirmed'
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>CONFIRM</span>
              </button>

              <button
                id="btn-sheet-walkover"
                onClick={() => {
                  playAudioFeedback('walkover');
                  triggerHaptic(40);
                  handleStatusChange(selectedTargetWithDistance.id, 'walkover');
                }}
                className={`py-2 px-1 rounded-xl text-xs font-mono-tech font-bold border flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                  selectedTargetWithDistance.verificationStatus === 'walkover'
                    ? 'bg-amber-600 border-amber-400 text-white'
                    : 'bg-amber-950/50 border-amber-800 text-amber-300'
                }`}
              >
                <Footprints className="w-4 h-4" />
                <span>WALKOVER</span>
              </button>

              <button
                id="btn-sheet-open-dossier"
                onClick={() => {
                  playAudioFeedback('lock');
                  setIsPopupOpen(true);
                }}
                className="py-2 px-1 rounded-xl text-xs font-mono-tech font-bold bg-cyan-950/60 border border-cyan-600/50 text-cyan-300 flex flex-col items-center justify-center gap-1 transition active:scale-95"
              >
                <BookOpen className="w-4 h-4" />
                <span>DOSSIER</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* --------------------------------------------------------------------- */}
      {/* HISTORICAL MARKER INSPECTOR POPUP MODAL                               */}
      {/* --------------------------------------------------------------------- */}
      <MarkerDetailPopup
        target={selectedTargetWithDistance}
        userDistanceMeters={selectedTargetWithDistance?.distanceMeters}
        userBearingDeg={selectedTargetWithDistance?.bearingDeg}
        isGpsActive={isGpsActive}
        onClose={() => setIsPopupOpen(false)}
        onStatusChange={handleStatusChange}
        onLockGpsTarget={(t) => {
          setLockedTarget(t);
          setIsPopupOpen(false);
          setIsGpsActive(true);
        }}
        isLockedTarget={lockedTarget?.id === selectedTarget?.id}
      />

      {/* --------------------------------------------------------------------- */}
      {/* "WHAT MIGHT HAVE BEEN" CHRONICLE DRAWER (TYPESET STORY + BADGES)     */}
      {/* --------------------------------------------------------------------- */}
      <ChronicleDrawer
        isOpen={isChronicleOpen}
        onClose={() => setIsChronicleOpen(false)}
        targets={targets}
        onSelectTargetFromChronicle={(id) => {
          const t = targets.find((item) => item.id === id);
          if (t) {
            setSelectedTarget(t);
            setIsPopupOpen(true);
          }
        }}
      />
    </div>
  );
}
