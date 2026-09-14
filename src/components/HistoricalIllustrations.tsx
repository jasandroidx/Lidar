import React from 'react';
import { TargetCategory } from '../types';

interface HistoricalIllustrationProps {
  category: TargetCategory;
  className?: string;
}

export const HistoricalIllustration: React.FC<HistoricalIllustrationProps> = ({ category, className = 'w-full h-44' }) => {
  switch (category) {
    case 'blockhouse_fort':
      return (
        <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="woodCutBg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1a2520" />
              <stop offset="100%" stopColor="#0c1512" />
            </linearGradient>
            <pattern id="hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#2d4a3e" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="400" height="200" fill="url(#woodCutBg)" />
          <rect width="400" height="200" fill="url(#hatch)" opacity="0.4" />
          {/* Forest backdrop */}
          <path d="M10,170 Q30,60 50,170 M40,170 Q70,40 100,170 M300,170 Q330,50 360,170 M340,170 Q370,70 390,170" stroke="#2e5344" strokeWidth="3" fill="none" opacity="0.6"/>
          {/* Blockhouse log structure */}
          {/* Ground floor */}
          <rect x="130" y="100" width="140" height="70" fill="#21322a" stroke="#4ade80" strokeWidth="1.5" />
          {/* Horizontal log lines */}
          <line x1="130" y1="114" x2="270" y2="114" stroke="#3b6653" strokeWidth="1.5" />
          <line x1="130" y1="128" x2="270" y2="128" stroke="#3b6653" strokeWidth="1.5" />
          <line x1="130" y1="142" x2="270" y2="142" stroke="#3b6653" strokeWidth="1.5" />
          <line x1="130" y1="156" x2="270" y2="156" stroke="#3b6653" strokeWidth="1.5" />
          {/* Heavy timber door */}
          <rect x="185" y="125" width="30" height="45" fill="#121b17" stroke="#4ade80" strokeWidth="1.5" />
          <circle cx="210" cy="148" r="2" fill="#4ade80" />
          {/* Loophole rifle slits */}
          <rect x="145" y="118" width="4" height="14" fill="#040d0b" stroke="#34d399" strokeWidth="1" />
          <rect x="250" y="118" width="4" height="14" fill="#040d0b" stroke="#34d399" strokeWidth="1" />
          {/* Overhanging 2nd Story (Blockhouse jettied upper floor) */}
          <rect x="115" y="60" width="170" height="40" fill="#263b32" stroke="#4ade80" strokeWidth="1.5" />
          <line x1="115" y1="72" x2="285" y2="72" stroke="#3b6653" strokeWidth="1.5" />
          <line x1="115" y1="84" x2="285" y2="84" stroke="#3b6653" strokeWidth="1.5" />
          <line x1="115" y1="96" x2="285" y2="96" stroke="#3b6653" strokeWidth="1.5" />
          {/* Upper rifle embrasures */}
          <rect x="135" y="72" width="5" height="16" fill="#040d0b" stroke="#34d399" strokeWidth="1" />
          <rect x="195" y="72" width="5" height="16" fill="#040d0b" stroke="#34d399" strokeWidth="1" />
          <rect x="255" y="72" width="5" height="16" fill="#040d0b" stroke="#34d399" strokeWidth="1" />
          {/* Shake Shingle Roof */}
          <polygon points="100,60 200,20 300,60" fill="#1b2a23" stroke="#4ade80" strokeWidth="2" />
          {/* Stone Chimney */}
          <rect x="250" y="15" width="22" height="45" fill="#3f4f46" stroke="#4ade80" strokeWidth="1" />
          <path d="M250,25 L272,25 M250,35 L272,35 M250,45 L272,45 M261,15 L261,25 M261,35 L261,45" stroke="#25352c" strokeWidth="1" />
          {/* Stockade palisade posts */}
          <path d="M70,170 L70,120 L75,115 L80,120 L80,170 M85,170 L85,118 L90,113 L95,118 L95,170 M100,170 L100,122 L105,117 L110,122 L110,170" stroke="#34d399" strokeWidth="1" fill="#1f332a" />
          {/* Ground contour & grass */}
          <path d="M0,170 Q100,165 200,170 T400,170 L400,200 L0,200 Z" fill="#14211c" stroke="#4ade80" strokeWidth="1.5" />
          {/* Vintage Caption */}
          <text x="200" y="190" fill="#86efac" font-family="'Cinzel', serif" fontSize="11" letterSpacing="2" textAnchor="middle">WOOLSEY PRIDE BLOCKHOUSE • 1807</text>
        </svg>
      );

    case 'cellar_hole':
      return (
        <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cellarBg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e241d" />
              <stop offset="100%" stopColor="#0d140e" />
            </linearGradient>
          </defs>
          <rect width="400" height="200" fill="url(#cellarBg)" />
          {/* Ground level cutaway profile */}
          <path d="M 0,90 L 90,90 L 120,150 L 280,150 L 310,90 L 400,90 L 400,200 L 0,200 Z" fill="#172218" stroke="#10b981" strokeWidth="2" />
          {/* Fieldstone masonry wall layers in cellar pit */}
          <g stroke="#34d399" strokeWidth="1" fill="#243729">
            <rect x="116" y="98" width="16" height="10" rx="1" />
            <rect x="113" y="109" width="18" height="10" rx="1" />
            <rect x="111" y="120" width="18" height="10" rx="1" />
            <rect x="109" y="131" width="18" height="10" rx="1" />
            <rect x="107" y="142" width="19" height="10" rx="1" />

            <rect x="270" y="98" width="16" height="10" rx="1" />
            <rect x="272" y="109" width="18" height="10" rx="1" />
            <rect x="274" y="120" width="18" height="10" rx="1" />
            <rect x="276" y="131" width="18" height="10" rx="1" />
            <rect x="278" y="142" width="19" height="10" rx="1" />
          </g>
          {/* Decayed floor sills and collapsed oak beam */}
          <line x1="126" y1="148" x2="274" y2="148" stroke="#059669" strokeWidth="3" strokeDasharray="8 4" />
          <line x1="140" y1="92" x2="210" y2="148" stroke="#d97706" strokeWidth="4" strokeOpacity="0.8" />
          {/* Overgrown trees growing out of the cellar hole center */}
          <path d="M 200,148 Q 195,110 200,70 Q 205,40 185,20 M 200,70 Q 215,45 230,25" stroke="#6ee7b7" strokeWidth="2.5" fill="none" />
          <circle cx="185" cy="20" r="22" fill="#064e3b" fillOpacity="0.7" stroke="#34d399" strokeWidth="1" />
          <circle cx="230" cy="25" r="18" fill="#064e3b" fillOpacity="0.7" stroke="#34d399" strokeWidth="1" />
          {/* Fallen stone chimney rubble */}
          <polygon points="140,148 155,130 170,148" fill="#374151" stroke="#9ca3af" strokeWidth="1" />
          <polygon points="160,148 175,135 188,148" fill="#4b5563" stroke="#9ca3af" strokeWidth="1" />
          {/* Laser LiDAR beam penetration arrows */}
          <g stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3">
            <line x1="130" y1="10" x2="130" y2="90" />
            <line x1="200" y1="10" x2="200" y2="60" />
            <line x1="270" y1="10" x2="270" y2="90" />
            <line x1="330" y1="10" x2="330" y2="90" />
          </g>
          <text x="200" y="185" fill="#a7f3d0" font-family="'Cinzel', serif" fontSize="11" letterSpacing="2" textAnchor="middle">PIONEER HEWED-LOG CELLAR HOLE</text>
        </svg>
      );

    case 'prehistoric_mound':
      return (
        <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="moundGlow" cx="50%" cy="60%" r="50%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#06251d" />
            </radialGradient>
          </defs>
          <rect width="400" height="200" fill="#091813" />
          {/* Night sky with stars */}
          <g fill="#a7f3d0" opacity="0.6">
            <circle cx="50" cy="30" r="1.5" />
            <circle cx="120" cy="20" r="1" />
            <circle cx="280" cy="35" r="1.5" />
            <circle cx="340" cy="18" r="1" />
            <circle cx="370" cy="45" r="1" />
          </g>
          {/* Great Siple Earthen Mound profile */}
          <path d="M0,170 Q100,165 140,160 Q170,110 200,65 Q230,110 260,160 Q320,165 400,170 L400,200 L0,200 Z" fill="url(#moundGlow)" stroke="#34d399" strokeWidth="2" />
          {/* Causeway / Mole extending to spring */}
          <path d="M70,170 Q130,150 170,140 Q200,135 240,145 Q290,160 330,170" fill="none" stroke="#059669" strokeWidth="3" strokeDasharray="6 3" />
          {/* Contour stepped terrace rings */}
          <path d="M165,115 Q200,105 235,115" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M180,85 Q200,78 220,85" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Ancient spring pool */}
          <ellipse cx="65" cy="170" rx="35" ry="12" fill="#0284c7" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.5" />
          {/* Buried stone slab chamber symbol */}
          <rect x="188" y="115" width="24" height="8" rx="2" fill="#334155" stroke="#cbd5e1" strokeWidth="1" />
          <text x="200" y="190" fill="#a7f3d0" font-family="'Cinzel', serif" fontSize="11" letterSpacing="2" textAnchor="middle">SIPLE GREAT MOUND & CAUSEWAY (1885)</text>
        </svg>
      );

    case 'mill_race':
      return (
        <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="200" fill="#0c1815" />
          {/* Water channel / race */}
          <path d="M0,130 C120,110 180,140 280,125 C340,115 370,120 400,110 L400,165 C360,175 320,170 260,180 C160,195 80,170 0,185 Z" fill="#0369a1" fillOpacity="0.4" stroke="#38bdf8" strokeWidth="1.5" />
          {/* Sluice gate timbers */}
          <rect x="130" y="80" width="10" height="80" fill="#374151" stroke="#94a3b8" strokeWidth="1" />
          <rect x="160" y="80" width="10" height="80" fill="#374151" stroke="#94a3b8" strokeWidth="1" />
          <line x1="125" y1="95" x2="175" y2="95" stroke="#cbd5e1" strokeWidth="2" />
          <line x1="125" y1="120" x2="175" y2="120" stroke="#cbd5e1" strokeWidth="2" />
          {/* Water wheel outline */}
          <circle cx="210" cy="120" r="35" fill="none" stroke="#f59e0b" strokeWidth="3" />
          <circle cx="210" cy="120" r="6" fill="#f59e0b" />
          <line x1="210" y1="85" x2="210" y2="155" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="175" y1="120" x2="245" y2="120" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="185" y1="95" x2="235" y2="145" stroke="#f59e0b" strokeWidth="1.5" />
          <line x1="185" y1="145" x2="235" y2="95" stroke="#f59e0b" strokeWidth="1.5" />
          {/* Mill building foundation */}
          <polygon points="235,115 330,85 350,140 250,160" fill="#1e2923" stroke="#10b981" strokeWidth="1.5" />
          <text x="200" y="190" fill="#a7f3d0" font-family="'Cinzel', serif" fontSize="11" letterSpacing="2" textAnchor="middle">PIONEER PATOKA MILL RACE & SLUICE</text>
        </svg>
      );

    case 'historic_trace':
      return (
        <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="200" fill="#081410" />
          {/* Hardwood Forest Canopy lining path */}
          <g fill="#064e3b" fillOpacity="0.6" stroke="#059669" strokeWidth="1.5">
            <circle cx="40" cy="50" r="30" />
            <circle cx="90" cy="35" r="28" />
            <circle cx="320" cy="40" r="32" />
            <circle cx="370" cy="60" r="30" />
            <circle cx="20" cy="120" r="25" />
            <circle cx="380" cy="130" r="25" />
          </g>
          {/* Sunken Trace Swale cut into ground */}
          <path d="M180,0 Q170,80 190,120 Q210,160 180,200" stroke="#040b08" strokeWidth="36" fill="none" />
          <path d="M180,0 Q170,80 190,120 Q210,160 180,200" stroke="#78350f" strokeWidth="26" fill="none" opacity="0.6" />
          {/* Pioneer wagon ruts / footstep trail */}
          <path d="M174,0 Q164,80 184,120 Q204,160 174,200" stroke="#d97706" strokeWidth="1.5" strokeDasharray="8 4" fill="none" />
          <path d="M186,0 Q176,80 196,120 Q216,160 186,200" stroke="#d97706" strokeWidth="1.5" strokeDasharray="8 4" fill="none" />
          {/* Mileage post */}
          <rect x="225" y="90" width="8" height="24" fill="#d1d5db" stroke="#111827" strokeWidth="1" />
          <rect x="221" y="80" width="16" height="12" fill="#e5e7eb" stroke="#111827" strokeWidth="1" />
          <text x="229" y="89" fill="#111827" fontSize="7" font-weight="bold" textAnchor="middle">13M</text>
          <text x="200" y="190" fill="#a7f3d0" font-family="'Cinzel', serif" fontSize="11" letterSpacing="2" textAnchor="middle">THE GOVERNOR'S TRACE (MUD HOLE ROUTE)</text>
        </svg>
      );

    case 'coal_drift':
      return (
        <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="200" fill="#0d1411" />
          {/* Hillside bluff contour */}
          <path d="M0,40 Q150,50 200,100 Q250,150 400,160 L400,200 L0,200 Z" fill="#1f2923" stroke="#10b981" strokeWidth="1.5" />
          {/* Coal K seam band */}
          <path d="M0,95 Q140,105 190,130 L400,175 L400,185 L190,140 Q140,115 0,105 Z" fill="#09090b" stroke="#334155" strokeWidth="1" />
          {/* Timbered Adit Portal */}
          <rect x="170" y="110" width="40" height="45" fill="#000000" stroke="#f59e0b" strokeWidth="2" />
          {/* Timber Shoring Frame */}
          <line x1="168" y1="110" x2="212" y2="110" stroke="#d97706" strokeWidth="4" />
          <line x1="172" y1="110" x2="172" y2="155" stroke="#d97706" strokeWidth="3" />
          <line x1="208" y1="110" x2="208" y2="155" stroke="#d97706" strokeWidth="3" />
          {/* Spoil pile */}
          <polygon points="215,155 270,135 300,160" fill="#27272a" stroke="#52525b" strokeWidth="1" />
          <text x="200" y="190" fill="#a7f3d0" font-family="'Cinzel', serif" fontSize="11" letterSpacing="2" textAnchor="middle">1837 DR. POSEY UNDERGROUND DRIFT</text>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 400 200" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="200" fill="#0d1512" />
          <circle cx="200" cy="100" r="45" fill="#13241e" stroke="#10b981" strokeWidth="2" />
          <circle cx="200" cy="100" r="28" fill="#091410" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4 4" />
          <circle cx="200" cy="100" r="10" fill="#38bdf8" />
          <text x="200" y="180" fill="#a7f3d0" font-family="'Cinzel', serif" fontSize="11" letterSpacing="2" textAnchor="middle">HISTORICAL TERRAIN ANOMALY</text>
        </svg>
      );
  }
};
