import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Milestone,
  Shield,
  Landmark,
  Compass,
  FileDown,
  Share2,
  Copy,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  Sparkles,
  Search
} from 'lucide-react';
import {
  PIONEER_FAMILY_BADGES,
  EARLY_ROAD_DISTANCES,
  HISTORICAL_CHRONICLE_ACTS
} from '../data/historicalData';
import { TerrainTarget } from '../types';
import { playAudioFeedback, triggerHaptic } from '../utils/hapticsAndAudio';
import { downloadGPXFile } from '../utils/gpxExporter';

interface ChronicleDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targets: TerrainTarget[];
  onSelectTargetFromChronicle: (targetId: string) => void;
}

export const ChronicleDrawer: React.FC<ChronicleDrawerProps> = ({
  isOpen,
  onClose,
  targets,
  onSelectTargetFromChronicle
}) => {
  const [selectedSection, setSelectedSection] = useState<'3acts' | 'badges' | 'distances'>('3acts');
  const [selectedAct, setSelectedAct] = useState<'I' | 'II' | 'III'>('I');
  const [badgeFilter, setBadgeFilter] = useState('');
  const [copiedAllMarkdown, setCopiedAllMarkdown] = useState(false);

  if (!isOpen) return null;

  const handleExportAllGPX = () => {
    playAudioFeedback('lock');
    triggerHaptic(40);
    downloadGPXFile(targets);
  };

  const handleCopyFullChronicle = async () => {
    playAudioFeedback('confirm');
    triggerHaptic([30, 30]);

    const chronicleMd = `# Pike County, Indiana: "What Might Have Been" Chronicle
*Compiled from Goodspeed Bros. & Co., Publishers (1885)*

${HISTORICAL_CHRONICLE_ACTS.map(
  (act) => `## Act ${act.actNumber}: ${act.title} (${act.period})
**Theme:** ${act.theme}

${act.narrativeText}

### Key Archival Citations:
${act.keyCitations.map((c) => `> ${c}`).join('\n')}
`
).join('\n---\n\n')}

## Pioneer Family Land Grants (1800–1837)
${PIONEER_FAMILY_BADGES.map(
  (b) => `- **${b.familyName} Family** (${b.patriarch}): Arrived ${b.arrivalYear}, ${b.township} (${b.landAcres} acres). ${b.historicalSignificance}`
).join('\n')}

## Historic Road Distances (Vincennes to Falls of the Ohio)
${EARLY_ROAD_DISTANCES.map((r) => `- **${r.fromLocation}** ➔ **${r.toLocation}**: ${r.miles} miles (${r.historicalRouteName})`).join('\n')}
`;

    try {
      await navigator.clipboard.writeText(chronicleMd);
      setCopiedAllMarkdown(true);
      setTimeout(() => setCopiedAllMarkdown(false), 2200);
    } catch {
      // Fallback
    }
  };

  const filteredBadges = PIONEER_FAMILY_BADGES.filter(
    (b) =>
      b.familyName.toLowerCase().includes(badgeFilter.toLowerCase()) ||
      b.township.toLowerCase().includes(badgeFilter.toLowerCase()) ||
      b.patriarch.toLowerCase().includes(badgeFilter.toLowerCase())
  );

  return (
    <div
      id="drawer-what-might-have-been"
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl h-full flex flex-col bg-[#071714] border-l border-emerald-500/40 shadow-2xl text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0a231d] to-[#0d1c19] border-b border-emerald-600/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-mono-tech tracking-widest text-amber-400 uppercase">
                HISTORICAL TYPESET ARCHIVE • GOODSPEED 1885
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-display text-amber-100">
                "What Might Have Been" Chronicle
              </h2>
            </div>
          </div>

          <button
            id="btn-close-chronicle"
            aria-label="Close chronicle drawer"
            onClick={() => {
              playAudioFeedback('lock');
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation */}
        <div className="flex border-b border-stone-800 bg-[#05110e] text-xs font-mono-tech">
          <button
            id="nav-section-3acts"
            onClick={() => setSelectedSection('3acts')}
            className={`flex-1 py-3 px-2 text-center border-b-2 transition ${
              selectedSection === '3acts'
                ? 'border-amber-400 text-amber-300 bg-amber-950/30 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
            3-ACT HISTORICAL STORY
          </button>
          <button
            id="nav-section-badges"
            onClick={() => setSelectedSection('badges')}
            className={`flex-1 py-3 px-2 text-center border-b-2 transition ${
              selectedSection === 'badges'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-950/30 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
            PIONEER BADGES (1885)
          </button>
          <button
            id="nav-section-distances"
            onClick={() => setSelectedSection('distances')}
            className={`flex-1 py-3 px-2 text-center border-b-2 transition ${
              selectedSection === 'distances'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30 font-bold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Milestone className="w-3.5 h-3.5 inline-block mr-1 mb-0.5" />
            TRACE DISTANCES
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 text-stone-200">
          {/* Section: 3-Act Story */}
          {selectedSection === '3acts' && (
            <div className="space-y-4">
              {/* Act Selector Pills */}
              <div className="grid grid-cols-3 gap-2">
                {HISTORICAL_CHRONICLE_ACTS.map((act) => (
                  <button
                    key={act.actNumber}
                    onClick={() => {
                      playAudioFeedback('lock');
                      setSelectedAct(act.actNumber);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono-tech transition text-center ${
                      selectedAct === act.actNumber
                        ? 'bg-amber-600/30 border-amber-400 text-amber-200 font-bold shadow-md'
                        : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span className="block text-[10px] text-amber-400/80">ACT {act.actNumber}</span>
                    <span className="truncate block font-semibold">{act.period}</span>
                  </button>
                ))}
              </div>

              {/* Active Act Content */}
              {(() => {
                const act = HISTORICAL_CHRONICLE_ACTS.find((a) => a.actNumber === selectedAct) || HISTORICAL_CHRONICLE_ACTS[0];
                return (
                  <div className="p-5 rounded-2xl bg-[#091f1a]/80 border border-amber-500/30 space-y-4 shadow-xl">
                    <div className="border-b border-amber-500/20 pb-3">
                      <span className="text-[11px] font-mono-tech uppercase text-amber-400 tracking-wider">
                        ACT {act.actNumber} • {act.period}
                      </span>
                      <h3 className="text-xl font-bold font-display text-amber-100 tracking-wide mt-0.5">
                        {act.title}
                      </h3>
                      <p className="text-xs italic text-stone-400 font-chronicle mt-1">
                        {act.theme}
                      </p>
                    </div>

                    <div className="prose prose-invert max-w-none text-stone-200 font-chronicle text-sm sm:text-base leading-relaxed space-y-3 whitespace-pre-line">
                      {act.narrativeText}
                    </div>

                    <div className="pt-3 border-t border-amber-500/20 space-y-2">
                      <span className="text-[11px] font-mono-tech text-amber-400 uppercase tracking-wider block">
                        Verified 1885 History Citations:
                      </span>
                      {act.keyCitations.map((cit, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-black/40 border border-amber-900/40 text-xs font-mono-tech text-amber-200/90"
                        >
                          {cit}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Section: Pioneer Family Badges */}
          {selectedSection === 'badges' && (
            <div className="space-y-4">
              {/* Search / Filter input */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter pioneer families (e.g. Pride, Brenton, Miley)..."
                  value={badgeFilter}
                  onChange={(e) => setBadgeFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-900 border border-emerald-900/60 text-xs font-mono-tech text-stone-100 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="p-4 rounded-xl bg-gradient-to-r from-[#061814] to-[#0a241e] border border-emerald-500/30 hover:border-emerald-400/60 transition space-y-2.5 shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold font-display text-emerald-100">
                            {badge.familyName} Family
                          </h4>
                          <span className="text-[11px] font-mono-tech text-stone-400">
                            Patriarch: {badge.patriarch} • Arr. {badge.arrivalYear}
                          </span>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-600/40 text-[10px] font-mono-tech text-amber-300">
                        {badge.landAcres} Acres
                      </span>
                    </div>

                    <p className="text-xs text-stone-300 font-sans-ui leading-relaxed">
                      {badge.historicalSignificance}
                    </p>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-stone-800 text-[11px] font-chronicle italic text-stone-300">
                      "{badge.quoteExcerpt}"
                      <span className="block mt-1 font-mono-tech not-italic text-stone-500 text-[10px]">
                        — Goodspeed History of Pike County (1885), Page {badge.goodspeedPage}
                      </span>
                    </div>

                    {badge.militaryService && (
                      <div className="text-[10px] font-mono-tech text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/40 inline-block">
                        🎖️ Military Roll: {badge.militaryService}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Early Road Distances */}
          {selectedSection === 'distances' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#091f1a] border border-cyan-500/30">
                <span className="text-[10px] font-mono-tech text-cyan-400 uppercase tracking-widest block font-bold">
                  TERRITORIAL HIGHWAY ARCHIVE
                </span>
                <h3 className="text-base font-bold font-display text-cyan-100 mt-0.5">
                  The Old Indian Trace (Governor's Highway)
                </h3>
                <p className="text-xs text-stone-300 font-sans-ui mt-1 leading-relaxed">
                  Historical road distances from the Wabash at Vincennes across Pike and Dubois Counties through French Lick to the Falls of the Ohio.
                </p>
              </div>

              <div className="space-y-2.5">
                {EARLY_ROAD_DISTANCES.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#061814] border border-stone-800 hover:border-cyan-600/40 transition flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-200">
                        <span className="text-emerald-400">{item.fromLocation}</span>
                        <span className="text-stone-500">➔</span>
                        <span className="text-cyan-300">{item.toLocation}</span>
                      </div>
                      <span className="text-[10px] font-mono-tech text-stone-400 block">
                        Route: {item.historicalRouteName}
                      </span>
                      <span className="text-[11px] text-stone-400 font-sans-ui block">
                        {item.terrainDescription}
                      </span>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-base font-bold font-mono-tech text-amber-400">
                        {item.miles}
                      </span>
                      <span className="text-[10px] font-mono-tech text-stone-400 block uppercase">
                        Miles
                      </span>
                    </div>
                  </div>
                ))}

                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-600/40 flex items-center justify-between font-mono-tech text-xs">
                  <span className="text-stone-300">TOTAL TRACE MILEAGE (POST VINCENNES TO LOUISVILLE):</span>
                  <span className="text-emerald-300 font-bold text-sm">99 MILES</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="p-4 bg-[#040d0b] border-t border-emerald-900/60 flex flex-wrap items-center justify-between gap-3">
          <button
            id="btn-chronicle-export-gpx"
            onClick={handleExportAllGPX}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-mono-tech font-bold border border-emerald-500/50 shadow-md transition active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>EXPORT ALL GPX</span>
          </button>

          <button
            id="btn-chronicle-copy-md"
            onClick={handleCopyFullChronicle}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono-tech border border-stone-700 transition active:scale-95"
          >
            {copiedAllMarkdown ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">CHRONICLE COPIED!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>COPY ALL (OBSIDIAN)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
