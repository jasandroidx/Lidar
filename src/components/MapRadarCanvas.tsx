import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  Eye,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  TreePine,
  Mountain,
  Crosshair
} from 'lucide-react';
import {
  TerrainTarget,
  LiDARShaderMode,
  GPSCoordinate,
  FootstepBreadcrumb
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
}

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
  onToggleSimulateWalk
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderBarRef = useRef<HTMLDivElement>(null);

  // Map viewport state: center in lat/lng, zoom scale
  const [viewport, setViewport] = useState({
    centerLat: PIKE_CENTER_COORDS.latitude,
    centerLng: PIKE_CENTER_COORDS.longitude,
    zoom: 1.1, // 1.0 = base scale
    panX: 0,
    panY: 0
  });

  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [showContours, setShowContours] = useState(true);
  const [showRadarSweep, setShowRadarSweep] = useState(true);
  const [radarAngle, setRadarAngle] = useState(0);

  // Radar sweep animation
  useEffect(() => {
    if (!showRadarSweep) return;
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + 1.5) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [showRadarSweep]);

  // Coordinate conversion helpers:
  // Lat: ~38.30 to ~38.53 (approx 25 km north-south)
  // Lng: -87.35 to -87.16 (approx 18 km east-west)
  const getCanvasXY = useCallback(
    (lat: number, lng: number, width: number, height: number) => {
      const minLat = 38.30;
      const maxLat = 38.53;
      const minLng = -87.35;
      const maxLng = -87.16;

      const normX = (lng - minLng) / (maxLng - minLng);
      const normY = 1 - (lat - minLat) / (maxLat - minLat); // inverted for screen Y

      const centerX = width / 2 + viewport.panX;
      const centerY = height / 2 + viewport.panY;

      const worldW = width * 1.5 * viewport.zoom;
      const worldH = height * 1.5 * viewport.zoom;

      const x = centerX + (normX - 0.5) * worldW;
      const y = centerY + (normY - 0.5) * worldH;

      return { x, y };
    },
    [viewport]
  );

  // Render procedure on canvas:
  // Renders the underlying base LiDAR layer, then clips and renders the Satellite Forest Canopy layer based on peelPercent!
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const peelX = (width * peelPercent) / 100;

    ctx.clearRect(0, 0, width, height);

    // 1. DRAW BARE-EARTH LiDAR RELIEF (Right side, revealed underneath)
    drawLidarRelief(ctx, width, height, lidarShader, showContours, viewport);

    // 2. DRAW SATELLITE FOREST CANOPY LAYER (Left side, up to peelX)
    if (peelX > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, peelX, height);
      ctx.clip();
      drawSatelliteCanopy(ctx, width, height, viewport);
      ctx.restore();
    }

    // 3. DRAW HISTORICAL GROUND TRACES & NATURAL CREEKS (White River & Patoka River)
    drawHistoricRiversAndTraces(ctx, width, height, getCanvasXY);

    // 4. DRAW BREADCRUMB FOOTSTEPS
    if (breadcrumbs.length > 0) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      breadcrumbs.forEach((pt, i) => {
        const { x, y } = getCanvasXY(pt.lat, pt.lng, width, height);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Individual footstep dots
      breadcrumbs.forEach((pt, i) => {
        const { x, y } = getCanvasXY(pt.lat, pt.lng, width, height);
        ctx.fillStyle = i === breadcrumbs.length - 1 ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 5. DRAW LINE TO ACTIVE LOCKED TARGET
    if (userGps && selectedTarget) {
      const userPt = getCanvasXY(userGps.latitude, userGps.longitude, width, height);
      const targetPt = getCanvasXY(selectedTarget.latitude, selectedTarget.longitude, width, height);

      ctx.save();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(userPt.x, userPt.y);
      ctx.lineTo(targetPt.x, targetPt.y);
      ctx.stroke();

      // Bearing text along line
      const midX = (userPt.x + targetPt.x) / 2;
      const midY = (userPt.y + targetPt.y) / 2;
      ctx.fillStyle = '#06b6d4';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(
        `${selectedTarget.distanceMeters ? Math.round(selectedTarget.distanceMeters) + 'm' : ''}`,
        midX + 6,
        midY - 4
      );
      ctx.restore();
    }

    // 6. DRAW RADAR SWEEP LINE
    if (showRadarSweep && userGps) {
      const userPt = getCanvasXY(userGps.latitude, userGps.longitude, width, height);
      const rad = 240;
      const angleRad = (radarAngle * Math.PI) / 180;

      ctx.save();
      const grad = ctx.createRadialGradient(userPt.x, userPt.y, 10, userPt.x, userPt.y, rad);
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

      ctx.beginPath();
      ctx.moveTo(userPt.x, userPt.y);
      ctx.arc(userPt.x, userPt.y, rad, angleRad - 0.4, angleRad);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Main sweep ray
      ctx.beginPath();
      ctx.moveTo(userPt.x, userPt.y);
      ctx.lineTo(userPt.x + Math.cos(angleRad) * rad, userPt.y + Math.sin(angleRad) * rad);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 7. DRAW HISTORICAL TARGET MARKERS
    targets.forEach((target) => {
      const pt = getCanvasXY(target.latitude, target.longitude, width, height);
      const isSelected = selectedTarget?.id === target.id;
      drawTargetMarker(ctx, pt.x, pt.y, target, isSelected, pt.x < peelX);
    });

    // 8. DRAW LIVE BLUE GPS BEACON
    if (userGps) {
      const userPt = getCanvasXY(userGps.latitude, userGps.longitude, width, height);
      drawGpsBeacon(ctx, userPt.x, userPt.y, userGps.headingDeg || 45);
    }
  }, [
    viewport,
    peelPercent,
    lidarShader,
    showContours,
    showRadarSweep,
    radarAngle,
    targets,
    selectedTarget,
    userGps,
    breadcrumbs,
    getCanvasXY
  ]);

  // Resize canvas smoothly on container size
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !canvasRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Map drag and panning handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isDraggingSlider) return;
    setIsDraggingMap(true);
    setDragStart({ x: e.clientX - viewport.panX, y: e.clientY - viewport.panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const newPercent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      onPeelChange(Math.round(newPercent));
      return;
    }

    if (!isDraggingMap) return;
    setViewport((prev) => ({
      ...prev,
      panX: e.clientX - dragStart.x,
      panY: e.clientY - dragStart.y
    }));
  };

  const handleMouseUp = () => {
    setIsDraggingMap(false);
    setIsDraggingSlider(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isDraggingSlider) return;
    if (e.touches.length === 1) {
      setIsDraggingMap(true);
      setDragStart({
        x: e.touches[0].clientX - viewport.panX,
        y: e.touches[0].clientY - viewport.panY
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingSlider && containerRef.current && e.touches.length > 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.touches[0].clientX;
      const newPercent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      onPeelChange(Math.round(newPercent));
      return;
    }

    if (!isDraggingMap || e.touches.length !== 1) return;
    setViewport((prev) => ({
      ...prev,
      panX: e.touches[0].clientX - dragStart.x,
      panY: e.touches[0].clientY - dragStart.y
    }));
  };

  const handleTouchEnd = () => {
    setIsDraggingMap(false);
    setIsDraggingSlider(false);
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    playAudioFeedback('lock');
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(0.6, Math.min(3.5, prev.zoom + delta))
    }));
  };

  // Center on GPS
  const handleCenterGps = () => {
    playAudioFeedback('ping');
    triggerHaptic([20, 20]);
    if (userGps && canvasRef.current) {
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      // Reset pan so GPS point is centered
      setViewport((prev) => ({
        ...prev,
        panX: 0,
        panY: 0
      }));
    }
  };

  // Canvas click to select marker
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingMap || isDraggingSlider) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check hit test for each target marker (hit radius 24px)
    let hitTarget: TerrainTarget | null = null;
    for (const t of targets) {
      const pt = getCanvasXY(t.latitude, t.longitude, canvas.width, canvas.height);
      const dist = Math.hypot(clickX - pt.x, clickY - pt.y);
      if (dist < 26) {
        hitTarget = t;
        break;
      }
    }

    if (hitTarget) {
      playAudioFeedback('lock');
      triggerHaptic(30);
      onSelectTarget(hitTarget);
    }
  };

  return (
    <div
      ref={containerRef}
      id="map-radar-viewport"
      className="relative w-full h-full bg-[#030907] overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Interactive Canvas */}
      <canvas
        ref={canvasRef}
        id="canvas-radar-display"
        onClick={handleCanvasClick}
        className="absolute inset-0 w-full h-full block"
      />

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
        <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-11 bg-stone-900/90 border-2 border-cyan-400 rounded-lg shadow-2xl flex flex-col items-center justify-center gap-1 backdrop-blur-md transition-transform group-hover:scale-110 active:scale-95 text-cyan-300">
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

      {/* Top Map HUD: Preset Toggles & Compass */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
        {/* Preset Wipe Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-emerald-900/60 backdrop-blur-md pointer-events-auto">
          <button
            id="btn-wipe-0"
            onClick={() => {
              playAudioFeedback('peel');
              onPeelChange(0);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono-tech transition ${
              peelPercent === 0
                ? 'bg-cyan-600 text-white font-bold'
                : 'text-stone-300 hover:bg-white/10'
            }`}
            title="Peel 100% back to Bare-Earth LiDAR"
          >
            PURE LiDAR
          </button>
          <button
            id="btn-wipe-50"
            onClick={() => {
              playAudioFeedback('peel');
              onPeelChange(50);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono-tech transition ${
              peelPercent === 50
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-stone-300 hover:bg-white/10'
            }`}
            title="50/50 Split View"
          >
            50/50 WIPE
          </button>
          <button
            id="btn-wipe-100"
            onClick={() => {
              playAudioFeedback('peel');
              onPeelChange(100);
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono-tech transition ${
              peelPercent === 100
                ? 'bg-emerald-800 text-white font-bold'
                : 'text-stone-300 hover:bg-white/10'
            }`}
            title="Modern Satellite Forest Canopy"
          >
            CANOPY
          </button>
        </div>

        {/* Shader Mode Selector */}
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-black/60 border border-cyan-900/60 backdrop-blur-md pointer-events-auto">
          <span className="text-[10px] font-mono-tech text-stone-400 px-2 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>SHADER:</span>
          </span>
          {(
            [
              ['analytical_hillshade', 'Relief'],
              ['multidirectional', 'Multi-Dir'],
              ['slope_angle', 'Slope/Walls'],
              ['hypsometric', 'Elevation']
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => {
                playAudioFeedback('lock');
                onShaderChange(mode);
              }}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono-tech transition ${
                lidarShader === mode
                  ? 'bg-cyan-600 text-white font-bold shadow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Tactical Controls: Zoom, Center GPS, Simulate Walk */}
      <div className="absolute right-3 bottom-24 md:bottom-6 flex flex-col gap-2 z-20 pointer-events-auto">
        {/* Live GPS Lock / Toggle */}
        <button
          id="btn-toggle-gps-lock"
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

        {/* Center on User GPS */}
        <button
          id="btn-center-gps"
          onClick={handleCenterGps}
          className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-300 hover:text-white shadow-xl backdrop-blur-md transition active:scale-95"
          title="Center on GPS Beacon"
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Virtual Walk Simulator (indoor testing) */}
        <button
          id="btn-simulate-walk"
          onClick={onToggleSimulateWalk}
          className={`p-2.5 rounded-xl border shadow-xl backdrop-blur-md transition active:scale-95 ${
            isSimulatingWalk
              ? 'bg-amber-600 text-white border-amber-400 animate-pulse'
              : 'bg-stone-900/80 text-stone-300 border-stone-700 hover:text-white'
          }`}
          title={isSimulatingWalk ? 'Pause Virtual Walk Simulation' : 'Simulate Walking Field Transect in Woods'}
        >
          {isSimulatingWalk ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Zoom In / Out */}
        <button
          id="btn-zoom-in"
          onClick={() => handleZoom(0.2)}
          className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-300 hover:text-white shadow-xl backdrop-blur-md transition active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          id="btn-zoom-out"
          onClick={() => handleZoom(-0.2)}
          className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-700 text-stone-300 hover:text-white shadow-xl backdrop-blur-md transition active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Contour lines toggle */}
        <button
          id="btn-toggle-contours"
          onClick={() => {
            playAudioFeedback('lock');
            setShowContours(!showContours);
          }}
          className={`p-2.5 rounded-xl border shadow-xl backdrop-blur-md transition active:scale-95 ${
            showContours
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-stone-900/80 border-stone-700 text-stone-500'
          }`}
          title="Toggle 5m Topographic Contours"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Coordinates & Scale Bar */}
      <div className="absolute left-3 bottom-24 md:bottom-4 pointer-events-none z-20 flex flex-col gap-1 text-[10px] font-mono-tech text-stone-400">
        <div className="bg-black/60 px-2 py-1 rounded-md border border-stone-800 backdrop-blur-sm inline-block">
          <span>CENTER: {viewport.centerLat.toFixed(4)}°N, {Math.abs(viewport.centerLng).toFixed(4)}°W</span>
          <span className="ml-2 text-emerald-400">ZOOM: {(viewport.zoom * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-20 h-1 bg-stone-300 border-x border-stone-100" />
          <span>250 METERS</span>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// CANVAS DRAWING HELPER ROUTINES
// =========================================================================

function drawLidarRelief(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  mode: LiDARShaderMode,
  showContours: boolean,
  viewport: { zoom: number; panX: number; panY: number }
) {
  // Base background: deep slate/charcoal terrain
  ctx.fillStyle = '#0b1311';
  ctx.fillRect(0, 0, width, height);

  // Procedural topography ridges & valleys for Pike County:
  // Rolling knobstone topography along Patoka & White River valleys
  const gridStep = 24 * viewport.zoom;
  const cols = Math.ceil(width / gridStep) + 2;
  const rows = Math.ceil(height / gridStep) + 2;

  const offsetX = (viewport.panX % gridStep);
  const offsetY = (viewport.panY % gridStep);

  for (let c = -1; c < cols; c++) {
    for (let r = -1; r < rows; r++) {
      const px = c * gridStep + offsetX;
      const py = r * gridStep + offsetY;

      // Mathematical hillshade simulation from NW lighting (315°)
      const elevation = Math.sin((px + viewport.panX * 0.2) * 0.008) * Math.cos((py + viewport.panY * 0.2) * 0.008);
      const slope = Math.cos((px + py) * 0.015);

      if (mode === 'analytical_hillshade') {
        const val = Math.floor(40 + 70 * (elevation * 0.5 + 0.5) + 30 * slope);
        ctx.fillStyle = `rgb(${Math.round(val * 0.9)}, ${Math.round(val * 1.05)}, ${Math.round(val * 0.95)})`;
      } else if (mode === 'multidirectional') {
        const val1 = 50 + 60 * (elevation * 0.5 + 0.5);
        const val2 = 30 + 40 * slope;
        ctx.fillStyle = `rgb(${Math.round(val1 * 0.8)}, ${Math.round((val1 + val2) * 0.6)}, ${Math.round(val2 * 1.1)})`;
      } else if (mode === 'slope_angle') {
        // Highlights steep features (cellar hole walls, ditches) in amber/cyan
        const steepness = Math.abs(slope);
        if (steepness > 0.65) {
          ctx.fillStyle = `rgba(245, 158, 11, ${0.4 + steepness * 0.5})`;
        } else {
          ctx.fillStyle = `rgb(20, 30, 26)`;
        }
      } else if (mode === 'hypsometric') {
        // Rainbow heat elevation ramp
        const norm = elevation * 0.5 + 0.5;
        if (norm < 0.25) ctx.fillStyle = '#0f766e';
        else if (norm < 0.5) ctx.fillStyle = '#15803d';
        else if (norm < 0.75) ctx.fillStyle = '#b45309';
        else ctx.fillStyle = '#e11d48';
      }

      ctx.fillRect(px, py, gridStep, gridStep);
    }
  }

  // Topographic contour lines overlay
  if (showContours) {
    ctx.save();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = 0; y < height; y += 45 * viewport.zoom) {
      ctx.moveTo(0, y + Math.sin(y * 0.02 + viewport.panX * 0.01) * 20);
      for (let x = 0; x < width; x += 30) {
        ctx.lineTo(x, y + Math.sin((x + viewport.panX) * 0.015) * 15 + Math.cos(y * 0.02) * 10);
      }
    }
    ctx.stroke();
    ctx.restore();
  }
}

function drawSatelliteCanopy(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  viewport: { zoom: number; panX: number; panY: number }
) {
  // Dense forest base: rich deep green foliage
  ctx.fillStyle = '#0f291e';
  ctx.fillRect(0, 0, width, height);

  // Modern agricultural fields & farm parcels
  ctx.fillStyle = '#1e382b';
  ctx.fillRect(width * 0.1, height * 0.15, width * 0.35, height * 0.3);
  ctx.fillStyle = '#1a3326';
  ctx.fillRect(width * 0.45, height * 0.5, width * 0.4, height * 0.35);

  // Dense clumps of tree crowns (hardwood canopy texture)
  const treeStep = 18 * viewport.zoom;
  ctx.save();
  for (let x = -20; x < width + 20; x += treeStep) {
    for (let y = -20; y < height + 20; y += treeStep) {
      // Noise jitter
      const jitterX = Math.sin(x * 12.3 + y * 4.7) * (treeStep * 0.4);
      const jitterY = Math.cos(x * 6.1 + y * 9.8) * (treeStep * 0.4);
      const radius = (treeStep * 0.65) + Math.sin(x + y) * 3;

      const greenTone = Math.floor(45 + Math.sin(x * 0.05) * 20);
      ctx.fillStyle = `rgb(16, ${greenTone}, 26)`;
      ctx.beginPath();
      ctx.arc(x + jitterX, y + jitterY, Math.max(4, radius), 0, Math.PI * 2);
      ctx.fill();

      // Leaf highlight
      ctx.fillStyle = `rgba(52, 211, 153, 0.15)`;
      ctx.beginPath();
      ctx.arc(x + jitterX - 2, y + jitterY - 2, Math.max(2, radius * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Modern paved / gravel roads on satellite view
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.beginPath();
  // State Road 61 / 56 representation
  ctx.moveTo(width * 0.48, 0);
  ctx.lineTo(width * 0.52, height);
  ctx.moveTo(0, height * 0.42);
  ctx.lineTo(width, height * 0.38);
  ctx.stroke();

  // Road center lines
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawHistoricRiversAndTraces(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  getCanvasXY: (lat: number, lng: number, w: number, h: number) => { x: number; y: number }
) {
  ctx.save();

  // White River (North Border of Pike County)
  const whiteRiverPoints = [
    { lat: 38.528, lng: -87.34 },
    { lat: 38.522, lng: -87.31 },
    { lat: 38.515, lng: -87.28 },
    { lat: 38.512, lng: -87.25 },
    { lat: 38.518, lng: -87.21 },
    { lat: 38.524, lng: -87.17 }
  ];

  ctx.strokeStyle = 'rgba(2, 132, 199, 0.7)';
  ctx.lineWidth = 8;
  ctx.beginPath();
  whiteRiverPoints.forEach((pt, i) => {
    const { x, y } = getCanvasXY(pt.lat, pt.lng, width, height);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // River water highlights
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Patoka River (Meandering through south central Pike)
  const patokaPoints = [
    { lat: 38.395, lng: -87.35 },
    { lat: 38.388, lng: -87.30 },
    { lat: 38.382, lng: -87.26 },
    { lat: 38.385, lng: -87.21 }, // Winslow mill site
    { lat: 38.375, lng: -87.17 }
  ];

  ctx.strokeStyle = 'rgba(14, 116, 144, 0.65)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  patokaPoints.forEach((pt, i) => {
    const { x, y } = getCanvasXY(pt.lat, pt.lng, width, height);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // River labels
  const wrLabel = getCanvasXY(38.517, -87.26, width, height);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.fillText('WHITE RIVER (NORTH BOUNDARY)', wrLabel.x - 70, wrLabel.y - 10);

  const prLabel = getCanvasXY(38.385, -87.24, width, height);
  ctx.fillStyle = '#22d3ee';
  ctx.fillText('PATOKA RIVER (1835 FLATBOAT ROUTE)', prLabel.x - 75, prLabel.y - 8);

  // The Governor's Trace / Mud Hole Trace path
  const tracePoints = [
    { lat: 38.518, lng: -87.31 }, // Decker Ferry
    { lat: 38.494, lng: -87.273 }, // White Oak Springs
    { lat: 38.482, lng: -87.23 }, // Long Branch
    { lat: 38.472, lng: -87.17 } // Toward Mud Holes
  ];

  ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  tracePoints.forEach((pt, i) => {
    const { x, y } = getCanvasXY(pt.lat, pt.lng, width, height);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.restore();
}

function drawTargetMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  target: TerrainTarget,
  isSelected: boolean,
  isUnderCanopy: boolean
) {
  ctx.save();

  // Color theme by verification status
  let strokeColor = '#38bdf8'; // unverified cyan
  let fillColor = 'rgba(2, 132, 199, 0.4)';
  if (target.verificationStatus === 'confirmed') {
    strokeColor = '#10b981'; // emerald
    fillColor = 'rgba(16, 185, 129, 0.45)';
  } else if (target.verificationStatus === 'walkover') {
    strokeColor = '#f59e0b'; // amber
    fillColor = 'rgba(245, 158, 11, 0.45)';
  } else if (target.verificationStatus === 'rejected') {
    strokeColor = '#f43f5e'; // rose
    fillColor = 'rgba(244, 63, 94, 0.45)';
  }

  // Selected pulsing outer ring
  if (isSelected) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Anomaly micro-relief shape depending on category
  if (target.category === 'cellar_hole' || target.category === 'blockhouse_fort') {
    // Square cellar depression
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.fillRect(x - 9, y - 9, 18, 18);
    ctx.strokeRect(x - 9, y - 9, 18, 18);

    // Inner cellar pit center
    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (target.category === 'prehistoric_mound') {
    // Concentric mounded ring
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Round waypoint badge
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Name Tag Label
  ctx.fillStyle = isSelected ? '#ffffff' : '#cbd5e1';
  ctx.font = isSelected
    ? 'bold 11px "Plus Jakarta Sans", sans-serif'
    : '10px "Plus Jakarta Sans", sans-serif';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;

  const displayName = target.name.length > 24 ? target.name.slice(0, 22) + '…' : target.name;
  ctx.fillText(displayName, x + 14, y + 4);

  // Status tag badge
  ctx.fillStyle = strokeColor;
  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.fillText(target.verificationStatus.toUpperCase(), x + 14, y + 14);

  ctx.restore();
}

function drawGpsBeacon(ctx: CanvasRenderingContext2D, x: number, y: number, headingDeg: number) {
  ctx.save();

  // Pulsing outer blue aura
  const grad = ctx.createRadialGradient(x, y, 4, x, y, 26);
  grad.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
  grad.addColorStop(0.6, 'rgba(2, 132, 199, 0.2)');
  grad.addColorStop(1, 'rgba(2, 132, 199, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.fill();

  // Compass Heading Cone
  const headingRad = (headingDeg * Math.PI) / 180;
  const coneLength = 36;
  const coneSpread = 0.45;

  ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, coneLength, headingRad - coneSpread, headingRad + coneSpread);
  ctx.closePath();
  ctx.fill();

  // Solid Center Beacon Dot
  ctx.fillStyle = '#38bdf8';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner pinpoint
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // "YOU (GPS)" Label
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 9px "JetBrains Mono", monospace';
  ctx.fillText('YOU (GPS BEACON)', x - 38, y - 14);

  ctx.restore();
}
