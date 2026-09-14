import React from 'react';
import { Mountain, AlertCircle } from 'lucide-react';

interface ElevationProfileProps {
  profileData?: number[];
  dimensions?: string;
}

export const ElevationProfile: React.FC<ElevationProfileProps> = ({
  profileData = [-0.2, -0.6, -1.8, -2.5, -2.8, -2.4, -1.5, -0.5, -0.1],
  dimensions = '24ft x 18ft'
}) => {
  const minVal = Math.min(...profileData, -0.5);
  const maxVal = Math.max(...profileData, 0.5);
  const range = maxVal - minVal || 1;

  const width = 300;
  const height = 90;
  const padding = 15;

  const points = profileData.map((val, idx) => {
    const x = padding + (idx / (profileData.length - 1)) * (width - 2 * padding);
    const normY = (val - minVal) / range;
    const y = height - padding - normY * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`;

  return (
    <div className="p-3.5 rounded-xl bg-[#061814] border border-cyan-500/30 space-y-2">
      <div className="flex items-center justify-between text-xs font-mono-tech">
        <span className="text-cyan-400 font-semibold flex items-center gap-1.5 uppercase">
          <Mountain className="w-4 h-4 text-cyan-400" />
          LiDAR Elevation Cross-Section
        </span>
        <span className="text-stone-400 text-[11px]">
          Span: {dimensions}
        </span>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg bg-black/50 p-1 border border-cyan-900/40">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block">
          {/* Zero elevation baseline */}
          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="rgba(255,255,255,0.2)"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Pit filled gradient */}
          <path d={areaD} fill="rgba(6, 182, 212, 0.15)" />

          {/* Profile line */}
          <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

          {/* Data points */}
          {profileData.map((val, idx) => {
            const x = padding + (idx / (profileData.length - 1)) * (width - 2 * padding);
            const normY = (val - minVal) / range;
            const y = height - padding - normY * (height - 2 * padding);
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3"
                fill="#38bdf8"
                stroke="#071714"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>

        <div className="flex items-center justify-between text-[9px] font-mono-tech text-stone-400 px-2 pt-1">
          <span>WEST RIM (0ft)</span>
          <span className="text-amber-400 font-bold">PIT DEPTH: {Math.abs(Math.min(...profileData)).toFixed(1)}ft</span>
          <span>EAST RIM ({dimensions.split('x')[0] || '24ft'})</span>
        </div>
      </div>
    </div>
  );
};
