import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  Navigation,
  Crosshair,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Layers,
  TreePine,
  Mountain,
  Grid,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import {
  TerrainTarget,
  LiDARShaderMode,
  GPSCoordinate,
  FootstepBreadcrumb,
  ScanGridTile
} from '../types';
import { PIKE_CENTER_COORDS } from '../data/historicalData';
import { playAudioFeedback, triggerHaptic } from '../utils/hapticsAndAudio';


/**
 * Monotone chain convex hull. Wraps a homestead cluster's points in the
 * tightest polygon that contains them. Was being called but never defined --
 * cluster hulls blew up at runtime.
 */
function getConvexHull(pts: [number, number][]): [number, number][] {
  if (pts.length < 3) return pts;
  const p = [...pts].sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const build = (src: [number, number][]) => {
    const out: [number, number][] = [];
    for (const q of src) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  return [...build(p), ...build([...p].reverse())];
}

interface MapRadarCanvasProps {
  targets: TerrainTarget[];
  selectedTarget: TerrainTarget | null;
  onSelectTarget: (target: TerrainTarget) => void;
  userGps: GPSCoordinate | null;
  isGpsActive: boolean;
  onToggleGps: () => void;
  peelPercent: number;
  onPeelChange: (percent: number) => void;
  lidarShader?: LiDARShaderMode;
  onShaderChange?: (mode: LiDARShaderMode) => void;
  breadcrumbs?: FootstepBreadcrumb[];
  onAddBreadcrumb?: (point: FootstepBreadcrumb) => void;
  isSimulatingWalk: boolean;
  onToggleSimulateWalk: () => void;
  gridTiles: ScanGridTile[];
  onQueueGridTile: (tileId: string) => void;
}

type BaseMapType = 'esri_satellite' | 'osm_street' | 'usgs_topo';

export const MapRadarCanvas: React.FC<MapRadarCanvasProps> = ({
  targets,
  selectedTarget,
  onSelectTarget,
  userGps,
  isGpsActive,
  onToggleGps,
  peelPercent,
  onPeelChange,
  isSimulatingWalk,
  onToggleSimulateWalk,
  gridTiles,
  onQueueGridTile
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const hullsGroupRef = useRef<L.LayerGroup | null>(null);
  const gpsMarkerRef = useRef<L.CircleMarker | null>(null);
  const breadcrumbPolylineRef = useRef<L.Polyline | null>(null);

  // Keep a stable ref for onSelectTarget callback and latest targets array
  const onSelectTargetRef = useRef(onSelectTarget);
  onSelectTargetRef.current = onSelectTarget;

  const targetsRef = useRef(targets);
  targetsRef.current = targets;

  // Map to reuse Leaflet CircleMarker instances across renders
  const markersMapRef = useRef<Map<string, L.CircleMarker>>(new Map());

  // 1. Initialize Leaflet map instance with preferCanvas: true
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [PIKE_CENTER_COORDS.latitude, PIKE_CENTER_COORDS.longitude],
      zoom: 14,
      zoomControl: false,
      preferCanvas: true
    });

    // Real Esri World Imagery Satellite Tile Layer
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Esri, Maxar, Earthstar Geographics'
      }
    ).addTo(map);

    // Local Relief Model (LRM) drape -- a real XYZ pyramid, county-wide.
    // Was a single lrm_overlay.png pinned to a hardcoded bbox, which covered
    // about one square mile out of 336. Generate tiles with
    //   python3 tools/make_lrm_tiles.py --dtm-dir <dtms> --out public/lrm_tiles
    const overlay = L.tileLayer('/lrm_tiles/{z}/{x}/{y}.png', {
      opacity: (100 - peelPercent) / 100,
      minNativeZoom: 14,
      maxNativeZoom: 18,
      maxZoom: 21,
      tms: false,
      // tiles only exist where a DTM has been processed; missing is normal
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      attribution: 'LRM derived from Purdue GDSL / Indiana QL2 LiDAR'
    }).addTo(map);

    overlayLayerRef.current = overlay;

    const hullsGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);

    hullsGroupRef.current = hullsGroup;
    markersGroupRef.current = markersGroup;
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update LRM overlay opacity when peelPercent changes
  useEffect(() => {
    if (overlayLayerRef.current) {
      overlayLayerRef.current.setOpacity((100 - peelPercent) / 100);
    }
  }, [peelPercent]);

  // 2. Render Homestead Compound Convex Hulls (only recomputed when targets change)
  useEffect(() => {
    const map = mapRef.current;
    const hullsGroup = hullsGroupRef.current;
    if (!map || !hullsGroup) return;

    hullsGroup.clearLayers();

    // Group targets into Homestead Clusters (for compound hulls)
    const clusters: { [key: string]: [number, number][] } = {};
    targets.forEach((t) => {
      const clusterKey = t.township || 'General';
      if (!clusters[clusterKey]) clusters[clusterKey] = [];
      clusters[clusterKey].push([t.latitude, t.longitude]);
    });

    // Draw Hull Polygons for clusters with >= 3 targets
    Object.entries(clusters).forEach(([key, pts]) => {
      if (pts.length >= 3) {
        const hullCoords = getConvexHull(pts);
        const hull = L.polygon(hullCoords as L.LatLngExpression[], {
          color: '#38bdf8',
          weight: 1.5,
          dashArray: '4, 4',
          fillColor: '#0284c7',
          fillOpacity: 0.15
        });
        hullsGroup.addLayer(hull);
      }
    });
  }, [targets]);

  // 2b. Efficiently render & update individual Candidate Circle Markers in-place
  // Performance optimization: Reuses L.circleMarker objects and uses .setStyle() / .setRadius()
  // to avoid destroying and recreating layers, tooltips, and handlers on every GPS tick or selection change.
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    const currentTargetIds = new Set(targets.map((t) => t.id));
    const selectedId = selectedTarget?.id ?? null;

    // Remove markers for targets that no longer exist or are filtered out
    markersMapRef.current.forEach((marker, id) => {
      if (!currentTargetIds.has(id)) {
        markersGroup.removeLayer(marker);
        markersMapRef.current.delete(id);
      }
    });

    // Add new markers or update existing markers in-place
    targets.forEach((t) => {
      const isSelected = selectedId === t.id;

      let color = '#38bdf8'; // unverified cyan
      let fillColor = '#0284c7';
      if (t.verificationStatus === 'confirmed') {
        color = '#10b981'; // emerald
        fillColor = '#059669';
      } else if (t.verificationStatus === 'walkover') {
        color = '#f59e0b'; // amber
        fillColor = '#d97706';
      } else if (t.verificationStatus === 'rejected') {
        color = '#f43f5e'; // rose
        fillColor = '#e11d48';
      }

      let circle = markersMapRef.current.get(t.id);

      if (!circle) {
        circle = L.circleMarker([t.latitude, t.longitude], {
          radius: isSelected ? 12 : 8,
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3 : 2,
          fillColor: fillColor,
          fillOpacity: 0.8
        });

        const targetId = t.id;
        circle.on('click', () => {
          playAudioFeedback('lock');
          triggerHaptic(30);
          const latestTarget = targetsRef.current.find((item) => item.id === targetId);
          if (latestTarget) {
            onSelectTargetRef.current(latestTarget);
          }
        });

        circle.bindTooltip(t.name, {
          permanent: false,
          direction: 'top',
          className:
            'bg-stone-900 border border-emerald-500 text-stone-100 text-xs px-2 py-1 rounded shadow-md font-sans-ui'
        });

        markersGroup.addLayer(circle);
        markersMapRef.current.set(t.id, circle);
      } else {
        // In-place marker update (no layer tear-down)
        circle.setLatLng([t.latitude, t.longitude]);
        circle.setRadius(isSelected ? 12 : 8);
        circle.setStyle({
          color: isSelected ? '#ffffff' : color,
          weight: isSelected ? 3 : 2,
          fillColor: fillColor,
          fillOpacity: 0.8
        });
      }
    });
  }, [targets, selectedTarget?.id, selectedTarget?.verificationStatus]);

  // 3. Render Live User GPS Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userGps) return;

    if (gpsMarkerRef.current) {
      gpsMarkerRef.current.setLatLng([userGps.latitude, userGps.longitude]);
    } else {
      const gpsMarker = L.circleMarker([userGps.latitude, userGps.longitude], {
        radius: 9,
        color: '#38bdf8',
        weight: 3,
        fillColor: '#0ea5e9',
        fillOpacity: 0.9
      }).addTo(map);

      gpsMarker.bindTooltip('YOU (GPS BEACON)', {
        permanent: true,
        direction: 'bottom',
        className: 'bg-blue-950 text-blue-300 font-mono-tech text-[10px] px-1.5 py-0.5 rounded border border-blue-500'
      });

      gpsMarkerRef.current = gpsMarker;
    }
  }, [userGps]);

  const handleCenterGps = () => {
    playAudioFeedback('ping');
    triggerHaptic([20, 20]);
    if (userGps && mapRef.current) {
      mapRef.current.panTo([userGps.latitude, userGps.longitude]);
    }
  };

  const handleZoomIn = () => {
    playAudioFeedback('lock');
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    playAudioFeedback('lock');
    if (mapRef.current) mapRef.current.zoomOut();
  };

  return (
    <div className="relative w-full h-full bg-stone-950 overflow-hidden select-none">
      {/* Leaflet Map DOM Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Top Map HUD: Preset Canopy Peel Toggles */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/75 border border-emerald-900/60 backdrop-blur-md pointer-events-auto shadow-2xl">
          <button
            onClick={() => {
              playAudioFeedback('peel');
              onPeelChange(0);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono-tech transition ${
              peelPercent === 0 ? 'bg-cyan-600 text-white font-bold' : 'text-stone-300 hover:bg-white/10'
            }`}
          >
            PURE LiDAR (100%)
          </button>
          <button
            onClick={() => {
              playAudioFeedback('peel');
              onPeelChange(50);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono-tech transition ${
              peelPercent === 50 ? 'bg-emerald-600 text-white font-bold' : 'text-stone-300 hover:bg-white/10'
            }`}
          >
            50/50
          </button>
          <button
            onClick={() => {
              playAudioFeedback('peel');
              onPeelChange(100);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono-tech transition ${
              peelPercent === 100 ? 'bg-emerald-800 text-white font-bold' : 'text-stone-300 hover:bg-white/10'
            }`}
          >
            CANOPY (ESRI)
          </button>

        {/* Dynamic Opacity Slider Controls */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/75 border border-cyan-900/60 backdrop-blur-md pointer-events-auto text-[11px] font-mono-tech text-cyan-300 shadow-2xl">
          <TreePine className="w-3.5 h-3.5 text-emerald-400" />
          <span>CANOPY PEEL:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={peelPercent}
            onChange={(e) => onPeelChange(Number(e.target.value))}
            aria-label="Canopy peel opacity percentage"
            className="w-24 accent-emerald-500 cursor-pointer"
          />
          <span className="w-8 text-right font-bold">{peelPercent}%</span>
        </div>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute left-3 bottom-6 pointer-events-auto z-20 hidden md:flex flex-col gap-1.5 p-2.5 rounded-xl bg-black/80 border border-emerald-900/60 backdrop-blur-md text-[10px] font-mono-tech text-stone-300 shadow-xl">
        <span className="text-emerald-400 font-bold tracking-wide uppercase">PIKE MAP LEGEND</span>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white" />
          <span>Confirmed Target</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 border border-white" />
          <span>Field Walkover Needed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-500 border border-white" />
          <span>Unverified Candidate</span>
        </div>
      </div>

      {/* Right Controls HUD */}
      <div className="absolute right-3 bottom-24 md:bottom-6 flex flex-col gap-2 z-20 pointer-events-auto">
        <button
          onClick={onToggleGps}
          aria-label={isGpsActive ? 'Turn off live GPS tracking' : 'Turn on live GPS tracking'}
          className={`p-3 rounded-xl border shadow-xl backdrop-blur-md transition active:scale-95 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-cyan-400 focus:outline-none ${
            isGpsActive
              ? 'bg-blue-600 text-white border-blue-400 shadow-blue-900/50'
              : 'bg-stone-900/80 text-stone-300 border-stone-700 hover:text-white'
          }`}
          title={isGpsActive ? 'GPS Signal Active' : 'Engage Live GPS'}
        >
          <Navigation className={`w-5 h-5 ${isGpsActive ? 'animate-pulse text-white' : ''}`} />
        </button>

        <button
          onClick={handleCenterGps}
          aria-label="Center map on GPS position"
          className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-300 hover:text-white shadow-xl backdrop-blur-md transition active:scale-95 focus-visible:ring-2 focus-visible:ring-cyan-400 focus:outline-none"
          title="Center on GPS Beacon"
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={onToggleSimulateWalk}
          aria-label={isSimulatingWalk ? 'Pause field walk simulation' : 'Simulate field walk'}
          className={`p-2.5 rounded-xl border shadow-xl backdrop-blur-md transition active:scale-95 focus-visible:ring-2 focus-visible:ring-cyan-400 focus:outline-none ${
            isSimulatingWalk
              ? 'bg-amber-600 text-white border-amber-400 animate-pulse'
              : 'bg-stone-900/80 text-stone-300 border-stone-700 hover:text-white'
          }`}
          title={isSimulatingWalk ? 'Pause Virtual Walk Simulation' : 'Simulate Field Walk'}
        >
          {isSimulatingWalk ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-amber-400" />}
        </button>

        <button
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom In"
          className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-300 hover:text-white shadow-xl backdrop-blur-md transition active:scale-95 focus-visible:ring-2 focus-visible:ring-cyan-400 focus:outline-none"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom Out"
          className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-300 hover:text-white shadow-xl backdrop-blur-md transition active:scale-95 focus-visible:ring-2 focus-visible:ring-cyan-400 focus:outline-none"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>
    </div>
    </div>
  );
};
