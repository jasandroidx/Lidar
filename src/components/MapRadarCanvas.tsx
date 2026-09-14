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

interface MapRadarCanvasProps {
  targets: TerrainTarget[];
  selectedTarget: TerrainTarget | null;
  onSelectTarget: (target: TerrainTarget) => void;
  userGps: GPSCoordinate | null;
  isGpsActive: boolean;
  onToggleGps: () => void;
  peelPercent: number;
  onPeelChange: (percent: number) => void;
  lidarShader: LiDARShaderMode;
  onShaderChange: (mode: LiDARShaderMode) => void;
  breadcrumbs: FootstepBreadcrumb[];
  onAddBreadcrumb: (point: FootstepBreadcrumb) => void;
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
  lidarShader,
  onShaderChange,
  breadcrumbs,
  onAddBreadcrumb,
  isSimulatingWalk,
  onToggleSimulateWalk,
  gridTiles,
  onQueueGridTile
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayersRef = useRef<{
    satellite?: L.TileLayer;
    street?: L.TileLayer;
    topo?: L.TileLayer;
    lidar?: L.TileLayer;
  }>({});

  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const gridGroupRef = useRef<L.LayerGroup | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);
  const breadcrumbsPolylineRef = useRef<L.Polyline | null>(null);
  const targetLineRef = useRef<L.Polyline | null>(null);

  const [baseMapType, setBaseMapType] = useState<BaseMapType>('esri_satellite');
  const [showGridOverlay, setShowGridOverlay] = useState(true);
  const [hoveredTarget, setHoveredTarget] = useState<TerrainTarget | null>(null);
  const [hoveredGridTile, setHoveredGridTile] = useState<ScanGridTile | null>(null);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const sliderBarRef = useRef<HTMLDivElement>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [PIKE_CENTER_COORDS.latitude, PIKE_CENTER_COORDS.longitude],
      zoom: 13,
      zoomControl: false,
      attributionControl: false
    });

    // Tile Layers Setup
    // 1. Esri World Imagery (Satellite)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Esri World Imagery' }
    );

    // 2. OpenStreetMap (Street Map)
    const streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 19, attribution: 'OpenStreetMap' }
    );

    // 3. USGS Topo Base
    const topoLayer = L.tileLayer(
      'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 16, attribution: 'USGS National Map' }
    );

    // 4. LiDAR Bare-Earth Hillshade (Esri Elevation / USGS 3DEP Hillshade)
    const lidarLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, opacity: 1 - peelPercent / 100 }
    );

    // Default base layer
    satelliteLayer.addTo(map);
    lidarLayer.addTo(map);

    tileLayersRef.current = {
      satellite: satelliteLayer,
      street: streetLayer,
      topo: topoLayer,
      lidar: lidarLayer
    };

    // Layer Groups
    const markersGroup = L.layerGroup().addTo(map);
    const gridGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    gridGroupRef.current = gridGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Base Map Switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayersRef.current.satellite) return;

    const { satellite, street, topo } = tileLayersRef.current;
    if (satellite && map.hasLayer(satellite)) map.removeLayer(satellite);
    if (street && map.hasLayer(street)) map.removeLayer(street);
    if (topo && map.hasLayer(topo)) map.removeLayer(topo);

    if (baseMapType === 'esri_satellite' && satellite) map.addLayer(satellite);
    if (baseMapType === 'osm_street' && street) map.addLayer(street);
    if (baseMapType === 'usgs_topo' && topo) map.addLayer(topo);

    // Ensure LiDAR layer remains on top
    if (tileLayersRef.current.lidar) {
      tileLayersRef.current.lidar.bringToFront();
    }
  }, [baseMapType]);

  // Handle Canopy Peel Opacity Slider
  useEffect(() => {
    if (tileLayersRef.current.lidar) {
      // 0% peel = 1.0 LiDAR opacity (pure LiDAR)
      // 100% peel = 0.0 LiDAR opacity (pure Satellite canopy)
      const opacity = 1 - peelPercent / 100;
      tileLayersRef.current.lidar.setOpacity(opacity);
    }
  }, [peelPercent]);

  // Render Grokbot Scan Grid Blocks Overlay
  useEffect(() => {
    const map = mapInstanceRef.current;
    const gridGroup = gridGroupRef.current;
    if (!map || !gridGroup) return;

    gridGroup.clearLayers();
    if (!showGridOverlay) return;

    gridTiles.forEach((tile) => {
      const { north, south, east, west } = tile.bounds;
      const bounds: L.LatLngBoundsExpression = [
        [south, west],
        [north, east]
      ];

      let color = '#38bdf8'; // cyan for queued/default
      let fillColor = 'rgba(56, 189, 248, 0.08)';
      let dashArray = undefined;

      if (tile.status === 'scanned') {
        color = '#10b981'; // emerald
        fillColor = 'rgba(16, 185, 129, 0.12)';
      } else if (tile.status === 'scanning') {
        color = '#f59e0b'; // amber
        fillColor = 'rgba(245, 158, 11, 0.2)';
        dashArray = '6, 6';
      } else if (tile.status === 'queued') {
        color = '#06b6d4'; // cyan
        fillColor = 'rgba(6, 182, 212, 0.1)';
        dashArray = '4, 4';
      } else if (tile.status === 'unscanned') {
        color = '#64748b'; // slate
        fillColor = 'rgba(100, 116, 139, 0.05)';
        dashArray = '2, 4';
      }

      const rect = L.rectangle(bounds, {
        color,
        weight: tile.status === 'scanning' ? 2.5 : 1.5,
        fillColor,
        fillOpacity: 0.15,
        dashArray
      });

      // Interactive hover & click on grid block
      rect.on('mouseover', () => setHoveredGridTile(tile));
      rect.on('mouseout', () => setHoveredGridTile(null));
      rect.on('click', () => {
        playAudioFeedback('lock');
        triggerHaptic(20);
        if (tile.status === 'unscanned' || tile.status === 'queued') {
          onQueueGridTile(tile.id);
        }
      });

      gridGroup.addLayer(rect);
    });
  }, [gridTiles, showGridOverlay, onQueueGridTile]);

  // Render Anomaly Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    targets.forEach((target) => {
      const isSelected = selectedTarget?.id === target.id;
      let statusColor = '#38bdf8'; // cyan unverified
      if (target.verificationStatus === 'confirmed') statusColor = '#10b981';
      else if (target.verificationStatus === 'walkover') statusColor = '#f59e0b';
      else if (target.verificationStatus === 'rejected') statusColor = '#f43f5e';

      const iconHtml = `
        <div class="relative group cursor-pointer flex items-center justify-center transition-transform ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-115'
        }">
          ${
            isSelected
              ? `<div class="absolute -inset-2 rounded-full bg-white/20 animate-ping"></div>`
              : ''
          }
          <div class="w-8 h-8 rounded-full bg-stone-900/90 border-2 flex items-center justify-center shadow-xl backdrop-blur-md" style="border-color: ${statusColor}; color: ${statusColor};">
            <span class="text-xs font-mono-tech font-bold">${
              target.category === 'cellar_hole'
                ? '⌂'
                : target.category === 'pioneer_well'
                ? '○'
                : target.category === 'blockhouse_fort'
                ? '⛨'
                : target.category === 'prehistoric_mound'
                ? '▲'
                : target.category === 'mill_race'
                ? '⚙'
                : target.category === 'coal_drift'
                ? '⛏'
                : '≡'
            }</span>
          </div>
          <div class="absolute top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono-tech text-stone-200 whitespace-nowrap shadow border border-stone-800 pointer-events-none">
            ${target.name.length > 20 ? target.name.slice(0, 18) + '…' : target.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-anomaly-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([target.latitude, target.longitude], {
        icon: customIcon
      });

      marker.on('mouseover', () => setHoveredTarget(target));
      marker.on('mouseout', () => setHoveredTarget(null));
      marker.on('click', () => {
        playAudioFeedback('lock');
        triggerHaptic(30);
        onSelectTarget(target);
      });

      markersGroup.addLayer(marker);
    });
  }, [targets, selectedTarget, onSelectTarget]);

  // Render User GPS Beacon & Breadcrumbs
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userGps) {
      const gpsLatLng: [number, number] = [userGps.latitude, userGps.longitude];

      const gpsIconHtml = `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-10 h-10 rounded-full bg-cyan-500/30 animate-ping"></div>
          <div class="w-6 h-6 rounded-full bg-cyan-500 border-2 border-white shadow-2xl flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-white"></div>
          </div>
        </div>
      `;

      const gpsIcon = L.divIcon({
        html: gpsIconHtml,
        className: 'custom-gps-beacon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      if (!gpsMarkerRef.current) {
        gpsMarkerRef.current = L.marker(gpsLatLng, { icon: gpsIcon }).addTo(map);
      } else {
        gpsMarkerRef.current.setLatLng(gpsLatLng);
      }

      // Target lock polyline
      if (selectedTarget) {
        const targetLatLng: [number, number] = [selectedTarget.latitude, selectedTarget.longitude];
        if (targetLineRef.current) {
          targetLineRef.current.setLatLngs([gpsLatLng, targetLatLng]);
        } else {
          targetLineRef.current = L.polyline([gpsLatLng, targetLatLng], {
            color: '#06b6d4',
            weight: 2,
            dashArray: '6, 6',
            opacity: 0.8
          }).addTo(map);
        }
      } else if (targetLineRef.current) {
        map.removeLayer(targetLineRef.current);
        targetLineRef.current = null;
      }
    } else {
      if (gpsMarkerRef.current) {
        map.removeLayer(gpsMarkerRef.current);
        gpsMarkerRef.current = null;
      }
      if (targetLineRef.current) {
        map.removeLayer(targetLineRef.current);
        targetLineRef.current = null;
      }
    }

    // Breadcrumbs path
    if (breadcrumbs.length > 0) {
      const latLngs: [number, number][] = breadcrumbs.map((b) => [b.lat, b.lng]);
      if (breadcrumbsPolylineRef.current) {
        breadcrumbsPolylineRef.current.setLatLngs(latLngs);
      } else {
        breadcrumbsPolylineRef.current = L.polyline(latLngs, {
          color: '#38bdf8',
          weight: 3,
          opacity: 0.7,
          dashArray: '4, 4'
        }).addTo(map);
      }
    }
  }, [userGps, selectedTarget, breadcrumbs]);

  // Zoom handlers
  const handleZoom = (delta: number) => {
    playAudioFeedback('lock');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
    }
  };

  const handleCenterGps = () => {
    playAudioFeedback('ping');
    triggerHaptic([20, 20]);
    if (userGps && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userGps.latitude, userGps.longitude], 16, { animate: true });
    }
  };

  // Slider Dragging Event Handling
  const handleSliderMove = (clientX: number) => {
    if (!sliderBarRef.current) return;
    const mapRect = mapContainerRef.current?.getBoundingClientRect();
    if (!mapRect) return;

    const percent = Math.max(0, Math.min(100, ((clientX - mapRect.left) / mapRect.width) * 100));
    onPeelChange(Math.round(percent));
  };

  return (
    <div className="relative w-full h-full bg-stone-950 overflow-hidden select-none touch-none">
      {/* Real Leaflet Tile Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Touch-Draggable Canopy Peel Wipe Slider Line */}
      <div
        id="canopy-peel-slider-divider"
        ref={sliderBarRef}
        style={{ left: `${peelPercent}%` }}
        className="absolute top-0 bottom-0 w-1.5 -ml-[3px] bg-gradient-to-b from-cyan-400 via-emerald-400 to-amber-400 shadow-[0_0_15px_rgba(56,189,248,0.8)] z-30 cursor-ew-resize group pointer-events-auto"
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsDraggingSlider(true);
          playAudioFeedback('peel');
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          setIsDraggingSlider(true);
          playAudioFeedback('peel');
        }}
      >
        {/* Thumb grabber knob */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-11 bg-stone-900/95 border-2 border-cyan-400 rounded-lg shadow-2xl flex flex-col items-center justify-center gap-1 backdrop-blur-md transition-transform group-hover:scale-110 active:scale-95 text-cyan-300">
          <div className="flex items-center gap-0.5">
            <span className="w-0.5 h-4 bg-cyan-400 rounded-full" />
            <span className="w-0.5 h-4 bg-emerald-400 rounded-full" />
            <span className="w-0.5 h-4 bg-amber-400 rounded-full" />
          </div>
          <span className="text-[8px] font-mono-tech font-bold leading-none text-white">PEEL</span>
        </div>

        {/* Top Tag: Canopy vs LiDAR */}
        <div className="absolute top-3 -left-28 -translate-x-full px-2.5 py-1 rounded-md bg-stone-900/85 border border-emerald-500/40 text-[10px] font-mono-tech text-emerald-300 shadow-lg pointer-events-none whitespace-nowrap flex items-center gap-1">
          <TreePine className="w-3 h-3 text-emerald-400" />
          <span>CANOPY ({peelPercent}%)</span>
        </div>

        <div className="absolute top-3 left-4 px-2.5 py-1 rounded-md bg-stone-900/85 border border-cyan-500/40 text-[10px] font-mono-tech text-cyan-300 shadow-lg pointer-events-none whitespace-nowrap flex items-center gap-1">
          <Mountain className="w-3 h-3 text-cyan-400" />
          <span>LiDAR ({100 - peelPercent}%)</span>
        </div>
      </div>

      {/* Top Map HUD: Base Map Selector, Preset Wipes, Grid Toggle */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
        {/* Base Map Tile Selector */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-black/80 border border-emerald-900/60 backdrop-blur-md pointer-events-auto shadow-xl">
          <span className="text-[10px] font-mono-tech text-stone-400 px-2 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">MAP:</span>
          </span>
          <button
            onClick={() => setBaseMapType('esri_satellite')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono-tech transition ${
              baseMapType === 'esri_satellite'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-stone-300 hover:bg-white/10'
            }`}
          >
            SATELLITE
          </button>
          <button
            onClick={() => setBaseMapType('osm_street')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono-tech transition ${
              baseMapType === 'osm_street'
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-stone-300 hover:bg-white/10'
            }`}
          >
            STREET
          </button>
          <button
            onClick={() => setBaseMapType('usgs_topo')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono-tech transition ${
              baseMapType === 'usgs_topo'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-stone-300 hover:bg-white/10'
            }`}
          >
            USGS TOPO
          </button>
        </div>

        {/* Preset Wipe Buttons & Grid Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/80 border border-cyan-900/60 backdrop-blur-md pointer-events-auto shadow-xl">
          <button
            onClick={() => {
              playAudioFeedback('peel');
              onPeelChange(0);
            }}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono-tech transition ${
              peelPercent === 0 ? 'bg-cyan-600 text-white font-bold' : 'text-stone-300 hover:bg-white/10'
            }`}
          >
            PURE LiDAR
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
            CANOPY
          </button>

          <button
            onClick={() => {
              playAudioFeedback('lock');
              setShowGridOverlay(!showGridOverlay);
            }}
            className={`ml-1 px-2.5 py-1 rounded-lg text-[10px] font-mono-tech flex items-center gap-1 transition ${
              showGridOverlay
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-stone-800 text-stone-400 hover:text-white'
            }`}
            title="Toggle Grokbot Scan Grid Overlay"
          >
            <Grid className="w-3 h-3" />
            <span>GRID</span>
          </button>
        </div>
      </div>

      {/* Floating Tactical Controls: Zoom, GPS Lock, Virtual Walk Simulator */}
      <div className="absolute right-3 bottom-24 md:bottom-6 flex flex-col gap-2 z-20 pointer-events-auto">
        <button
          onClick={onToggleGps}
          className={`p-3 rounded-xl border shadow-xl backdrop-blur-md transition active:scale-95 flex items-center justify-center ${
            isGpsActive
              ? 'bg-blue-600 text-white border-blue-400 shadow-blue-900/50'
              : 'bg-stone-900/80 text-stone-300 border-stone-700 hover:text-white'
          }`}
          title={isGpsActive ? 'GPS Signal Active (Tracking Footsteps)' : 'Engage Live Phone GPS'}
        >
          <Navigation className={`w-5 h-5 ${isGpsActive ? 'animate-pulse text-white' : ''}`} />
        </button>

        <button
          onClick={handleCenterGps}
          className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-300 hover:text-white shadow-xl backdrop-blur-md transition active:scale-95"
          title="Center on GPS Beacon"
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={onToggleSimulateWalk}
          className={`p-2.5 rounded-xl border shadow-xl backdrop-blur-md transition active:scale-95 ${
            isSimulatingWalk
              ? 'bg-amber-600 text-white border-amber-400 animate-pulse'
              : 'bg-stone-900/80 text-stone-300 border-stone-700 hover:text-white'
          }`}
          title={isSimulatingWalk ? 'Pause Virtual Walk Simulation' : 'Simulate Field Walk'}
        >
          {isSimulatingWalk ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-amber-400" />}
        </button>

        <button
          onClick={() => handleZoom(1)}
          className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-300 hover:text-white shadow-xl backdrop-blur-md transition active:scale-95"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleZoom(-1)}
          className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-300 hover:text-white shadow-xl backdrop-blur-md transition active:scale-95"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Hovered Target Tactical Details Tooltip */}
      {hoveredTarget && (
        <div className="absolute top-16 left-3 max-w-sm bg-stone-900/95 border border-cyan-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md z-30 pointer-events-none font-sans-ui text-stone-200 animate-fadeIn">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h4 className="font-bold text-sm text-cyan-300">{hoveredTarget.name}</h4>
          </div>
          <p className="text-xs text-stone-300 mb-2 leading-tight">{hoveredTarget.anomalyDescription}</p>
          <div className="text-[10px] font-mono-tech text-stone-400 border-t border-stone-800 pt-1.5 flex flex-col gap-1">
            <span className="text-emerald-400">⚡ WHY FLAGGED BY GROKBOT:</span>
            {hoveredTarget.lidarFeatures.slice(0, 2).map((feat, i) => (
              <span key={i} className="flex items-center gap-1 text-stone-300">
                <span>•</span> {feat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Hovered Grid Block Tooltip */}
      {hoveredGridTile && !hoveredTarget && (
        <div className="absolute top-16 left-3 max-w-xs bg-stone-900/95 border border-amber-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md z-30 pointer-events-none font-sans-ui text-stone-200">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-amber-400" />
              <h4 className="font-mono-tech font-bold text-xs text-amber-300">{hoveredGridTile.code}</h4>
            </div>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono-tech uppercase ${
                hoveredGridTile.status === 'scanned'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                  : hoveredGridTile.status === 'scanning'
                  ? 'bg-amber-950 text-amber-400 border border-amber-700 animate-pulse'
                  : hoveredGridTile.status === 'queued'
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-700'
                  : 'bg-stone-800 text-stone-400'
              }`}
            >
              {hoveredGridTile.status}
            </span>
          </div>
          <p className="text-[11px] text-stone-300 mb-1">
            {hoveredGridTile.status === 'scanned'
              ? `LiDAR scan completed. ${hoveredGridTile.anomaliesFoundCount} anomalies detected.`
              : hoveredGridTile.status === 'scanning'
              ? `Grokbot scan actively processing terrain tiles (${hoveredGridTile.scanProgressPercent}%)...`
              : hoveredGridTile.status === 'queued'
              ? `Queued for next 4-hour Grokbot LiDAR scan pass.`
              : `Unscanned sector. Click tile to queue this grid next!`}
          </p>
          {(hoveredGridTile.status === 'unscanned' || hoveredGridTile.status === 'queued') && (
            <div className="mt-2 pt-1 border-t border-stone-800 text-[10px] font-mono-tech text-amber-400 font-bold flex items-center gap-1">
              <span>👉 CLICK TILE TO QUEUE THIS GRID NEXT</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Coordinates HUD */}
      <div className="absolute left-3 bottom-24 md:bottom-4 pointer-events-none z-20 flex flex-col gap-1 text-[10px] font-mono-tech text-stone-400">
        <div className="bg-black/80 px-2.5 py-1 rounded-md border border-stone-800 backdrop-blur-sm inline-block shadow-lg">
          <span>CENTER: {PIKE_CENTER_COORDS.latitude.toFixed(4)}°N, {Math.abs(PIKE_CENTER_COORDS.longitude).toFixed(4)}°W</span>
          <span className="ml-2 text-emerald-400">ESRI / USGS GIS READY</span>
        </div>
      </div>
    </div>
  );
};
