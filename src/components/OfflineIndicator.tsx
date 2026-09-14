import React, { useEffect, useState } from 'react';
import { WifiOff, Radio } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return (
      <div
        id="badge-field-status"
        className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono-tech text-emerald-400"
        title="Field Navigation Ready (LiDAR Cache & Local Storage)"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>FIELD READY</span>
      </div>
    );
  }

  return (
    <div
      id="banner-offline-active"
      className="fixed bottom-16 md:bottom-5 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-900/90 border border-amber-500/50 px-3 py-1.5 text-xs font-mono-tech text-amber-200 shadow-xl backdrop-blur-md"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
      <span>OFFLINE FIELD MODE (Local LiDAR Cache Active)</span>
    </div>
  );
};
