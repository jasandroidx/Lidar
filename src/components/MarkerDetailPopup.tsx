import React, { useState } from 'react';
import {
  X,
  Compass,
  MapPin,
  CheckCircle2,
  Footprints,
  XCircle,
  FileDown,
  ExternalLink,
  BookOpen,
  Scan,
  Share2,
  Copy,
  Check,
  Layers,
  Clock
} from 'lucide-react';
import { TerrainTarget, VerificationStatus } from '../types';
import { ElevationProfile } from './ElevationProfile';
import { triggerHaptic, playAudioFeedback } from '../utils/hapticsAndAudio';
import { copyObsidianToClipboard, downloadObsidianMarkdown, getObsidianDeepLink } from '../utils/obsidianExporter';
import { downloadGPXFile } from '../utils/gpxExporter';

interface MarkerDetailPopupProps {
  target: TerrainTarget | null;
  userDistanceMeters?: number;
  userBearingDeg?: number;
  isGpsActive: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: VerificationStatus) => void;
  onLockGpsTarget: (target: TerrainTarget) => void;
  isLockedTarget?: boolean;
}

export const MarkerDetailPopup: React.FC<MarkerDetailPopupProps> = ({
  target,
  userDistanceMeters,
  userBearingDeg,
  isGpsActive,
  onClose,
  onStatusChange,
  onLockGpsTarget,
  isLockedTarget = false
}) => {
  const [copiedObsidian, setCopiedObsidian] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'lidar' | 'survey'>('history');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!target) return null;

  const handleStatusUpdate = (status: VerificationStatus) => {
    if (status === 'confirmed') {
      triggerHaptic([30, 40, 30]);
      playAudioFeedback('confirm');
    } else if (status === 'walkover') {
      triggerHaptic(40);
      playAudioFeedback('walkover');
    } else {
      triggerHaptic([60, 30, 60]);
      playAudioFeedback('reject');
    }
    onStatusChange(target.id, status);
  };

  const handleCopyObsidian = async () => {
    playAudioFeedback('lock');
    const ok = await copyObsidianToClipboard(target);
    if (ok) {
      setCopiedObsidian(true);
      setTimeout(() => setCopiedObsidian(false), 2000);
    }
  };

  const formattedDistance = userDistanceMeters !== undefined
    ? userDistanceMeters < 1000
      ? `${Math.round(userDistanceMeters)} m (${Math.round(userDistanceMeters * 3.28084)} ft)`
      : `${(userDistanceMeters / 1000).toFixed(2)} km (${(userDistanceMeters * 0.000621371).toFixed(2)} mi)`
    : null;

  return (
    <div
      id="modal-marker-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="marker-popup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-[#071714] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden text-stone-100">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-emerald-950/90 via-[#071e19] to-stone-900 border-b border-emerald-500/30">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Scan className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-tech tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                  {target.category.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-mono-tech text-stone-400">
                  {target.township} Township • Est. {target.yearSettled}
                </span>
              </div>
              <h2 id="marker-popup-title" className="text-base sm:text-lg font-bold font-display text-emerald-100 tracking-wide mt-0.5">
                {target.name}
              </h2>
            </div>
          </div>

          <button
            id="btn-close-marker-popup"
            aria-label="Close historical dossier"
            onClick={() => {
              playAudioFeedback('lock');
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            title="Close Historical Dossier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation / Distance Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-[#05110e] border-b border-emerald-900/40 text-xs font-mono-tech">
          <div className="flex items-center gap-3">
            <span className="text-stone-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {target.latitude.toFixed(5)}°N, {Math.abs(target.longitude).toFixed(5)}°W
            </span>
            <span className="text-stone-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              {target.elevationMeters}m ({Math.round(target.elevationMeters * 3.28084)}ft)
            </span>
          </div>

          {formattedDistance ? (
            <div className="flex items-center gap-2 text-emerald-300 font-bold bg-emerald-950/70 px-2.5 py-1 rounded-md border border-emerald-600/40">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span>RANGE: {formattedDistance}</span>
              {userBearingDeg !== undefined && (
                <span className="text-cyan-300">[{Math.round(userBearingDeg)}°]</span>
              )}
            </div>
          ) : (
            <span className="text-stone-500 italic text-[11px]">GPS Range calculating...</span>
          )}
        </div>

        {/* Tab switcher */}
        <div role="tablist" className="flex border-b border-stone-800 bg-[#051411]">
          <button
            id="tab-history"
            role="tab"
            aria-selected={activeTab === 'history'}
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2.5 text-xs font-mono-tech tracking-wider text-center border-b-2 transition focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
              activeTab === 'history'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 inline-block mr-1.5 mb-0.5" />
            1885 CHRONICLE & ANECDOTES
          </button>
          <button
            id="tab-lidar"
            role="tab"
            aria-selected={activeTab === 'lidar'}
            onClick={() => setActiveTab('lidar')}
            className={`flex-1 py-2.5 text-xs font-mono-tech tracking-wider text-center border-b-2 transition focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              activeTab === 'lidar'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Scan className="w-3.5 h-3.5 inline-block mr-1.5 mb-0.5" />
            LiDAR RELIEF ANOMALY
          </button>
          <button
            id="tab-survey"
            role="tab"
            aria-selected={activeTab === 'survey'}
            onClick={() => setActiveTab('survey')}
            className={`flex-1 py-2.5 text-xs font-mono-tech tracking-wider text-center border-b-2 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
              activeTab === 'survey'
                ? 'border-amber-400 text-amber-300 bg-amber-950/40 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 inline-block mr-1.5 mb-0.5" />
            FIELD RECON & SYNC
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-stone-200">
          {activeTab === 'history' && (
            <div className="space-y-4">
              {/* Authentic Goodspeed Citation Banner */}
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 text-xs">
                <div className="flex items-center justify-between text-amber-300 font-mono-tech font-semibold mb-1">
                  <span>GOODSPEED ARCHIVAL RECORD</span>
                  <span>PAGE {target.goodspeedPage}</span>
                </div>
                <p className="font-chronicle italic text-stone-300 text-sm">
                  "{target.goodspeedCitation}"
                </p>
              </div>

              {/* Historical Narrative */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-400 font-mono-tech flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" /> The Pioneer Story & Lore
                </h3>
                <p className="font-chronicle text-sm sm:text-base leading-relaxed text-stone-200 bg-[#091e19]/60 p-4 rounded-xl border border-emerald-900/40">
                  {target.chronicleSummary}
                </p>
              </div>

              {/* Pioneer Family Detail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-[#061814] border border-stone-800">
                  <span className="text-[11px] font-mono-tech text-stone-400 block uppercase">Pioneer Family:</span>
                  <span className="text-sm font-semibold text-emerald-300">{target.pioneerFamily}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#061814] border border-stone-800">
                  <span className="text-[11px] font-mono-tech text-stone-400 block uppercase">Survey Dimensions:</span>
                  <span className="text-sm font-semibold text-cyan-300 font-mono-tech">{target.dimensionsFeet}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lidar' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#091e19] border border-cyan-500/30 space-y-3">
                <h3 className="text-xs font-mono-tech text-cyan-400 font-semibold tracking-wide uppercase mb-1">
                  LiDAR Ground Surface Interpretation
                </h3>
                <p className="text-sm text-stone-200 leading-relaxed font-sans-ui">
                  {target.anomalyDescription ?? 'No detector run or site visit on record for this target yet.'}
                </p>
                <ElevationProfile dimensions={target.dimensionsFeet} />
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-mono-tech text-stone-400 uppercase tracking-wider">
                  Targeted Micro-Relief Signatures:
                </h4>
                <div className="space-y-2">
                  {(target.lidarFeatures ?? []).map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#061814] border border-emerald-900/50 text-xs"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-700/50 flex items-center justify-center font-mono-tech font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="text-stone-300 font-sans-ui">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs text-stone-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Tip: Drag the <strong>Canopy Peel Slider</strong> on the map directly over this marker to observe how the trees disappear and the bare-earth cellar pit reveals itself.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'survey' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#061814] border border-stone-800 space-y-3">
                <h3 className="text-xs font-mono-tech text-stone-300 uppercase tracking-wider font-semibold">
                  Field Verification Triage
                </h3>
                <p className="text-xs text-stone-400">
                  Assign ground status when scouting in the woods. Haptic and audio feedback confirm your field survey log.
                </p>

                {/* Tactile Big Hit Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    id="btn-popup-confirm"
                    onClick={() => handleStatusUpdate('confirmed')}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-xs font-mono-tech transition active:scale-95 ${
                      target.verificationStatus === 'confirmed'
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/60 font-bold'
                        : 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300 hover:bg-emerald-900/50'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>CONFIRM</span>
                  </button>

                  <button
                    id="btn-popup-walkover"
                    onClick={() => handleStatusUpdate('walkover')}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-xs font-mono-tech transition active:scale-95 ${
                      target.verificationStatus === 'walkover'
                        ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-950/60 font-bold'
                        : 'bg-amber-950/40 border-amber-800/50 text-amber-300 hover:bg-amber-900/50'
                    }`}
                  >
                    <Footprints className="w-5 h-5" />
                    <span>WALKOVER</span>
                  </button>

                  <button
                    id="btn-popup-reject"
                    onClick={() => handleStatusUpdate('rejected')}
                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border text-xs font-mono-tech transition active:scale-95 ${
                      target.verificationStatus === 'rejected'
                        ? 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-950/60 font-bold'
                        : 'bg-rose-950/40 border-rose-800/50 text-rose-300 hover:bg-rose-900/50'
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                    <span>REJECT</span>
                  </button>
                </div>
              </div>

              {/* Field Notes Area */}
              <div className="p-3.5 rounded-xl bg-[#091e19]/60 border border-emerald-900/40 space-y-1.5">
                <span className="text-[11px] font-mono-tech uppercase text-stone-400">Current Field Notes:</span>
                <p className="text-xs text-stone-200 italic font-mono-tech bg-black/40 p-2.5 rounded-lg border border-stone-800">
                  {target.fieldNotes ?? 'No field notes. Nobody has walked this one.'}
                </p>
              </div>

              {/* Export Actions */}
              <div className="space-y-2 pt-1">
                <h4 className="text-xs font-mono-tech text-stone-400 uppercase tracking-wider">
                  Sync & Export Options
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="btn-copy-obsidian"
                    onClick={handleCopyObsidian}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-mono-tech text-stone-200 transition"
                  >
                    {copiedObsidian ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-300">COPIED TO OBSIDIAN!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-cyan-400" />
                        <span>COPY OBSIDIAN NOTE</span>
                      </>
                    )}
                  </button>

                  <button
                    id="btn-download-obsidian"
                    onClick={() => {
                      playAudioFeedback('lock');
                      downloadObsidianMarkdown(target);
                    }}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700 text-xs font-mono-tech text-stone-200 transition"
                  >
                    <FileDown className="w-4 h-4 text-purple-400" />
                    <span>SAVE .MD NOTE</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="btn-export-gpx-single"
                    onClick={() => {
                      playAudioFeedback('lock');
                      downloadGPXFile([target]);
                    }}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/40 text-xs font-mono-tech text-emerald-300 transition"
                  >
                    <Share2 className="w-4 h-4 text-emerald-400" />
                    <span>EXPORT ONX/GAIA GPX</span>
                  </button>

                  <a
                    id="link-obsidian-app"
                    href={getObsidianDeepLink(target)}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/50 border border-purple-600/40 text-xs font-mono-tech text-purple-300 transition"
                    onClick={() => playAudioFeedback('lock')}
                  >
                    <ExternalLink className="w-4 h-4 text-purple-400" />
                    <span>LAUNCH OBSIDIAN APP</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 bg-[#040d0b] border-t border-emerald-900/50">
          <button
            id="btn-lock-gps-target"
            onClick={() => {
              playAudioFeedback('lock');
              triggerHaptic(50);
              onLockGpsTarget(target);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono-tech tracking-wider uppercase font-bold shadow-lg transition active:scale-95 ${
              isLockedTarget
                ? 'bg-cyan-600 text-white border border-cyan-400 ring-2 ring-cyan-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
            }`}
          >
            <Compass className="w-4 h-4 animate-spin-slow" />
            <span>{isLockedTarget ? 'TARGET LOCKED IN RADAR' : 'LOCK AS GPS TARGET'}</span>
          </button>

          <button
            id="btn-dismiss-popup"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono-tech border border-stone-700 transition"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
