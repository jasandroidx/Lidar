import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        id="btn-pwa-install"
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/40 px-3 py-1.5 text-xs font-mono-tech tracking-wider text-emerald-100 shadow-md transition active:scale-95"
        title="Install Pike Terrain Radar as Native PWA"
      >
        <Download className="w-3.5 h-3.5" />
        <span>INSTALL PWA</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          id="btn-pwa-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg bg-stone-800/80 hover:bg-stone-700 border border-stone-600/50 px-2.5 py-1.5 text-xs font-mono-tech text-stone-200 shadow-sm transition active:scale-95"
          title="Install on iOS Safari"
        >
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>INSTALL (iOS)</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-xl bg-stone-900 border border-emerald-500/40 p-6 shadow-2xl text-stone-100">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <h3 className="text-base font-semibold font-display tracking-wide text-emerald-400 flex items-center gap-2">
                  <Smartphone className="w-4 h-4" /> Install on iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-stone-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs leading-relaxed text-stone-300">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-stone-800/70 border border-stone-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">1</span>
                  <p>In Safari, tap the <strong className="text-white">Share</strong> icon (box with upward arrow) at the bottom toolbar.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-stone-800/70 border border-stone-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">2</span>
                  <p>Scroll down and select <strong className="text-white">Add to Home Screen</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-stone-800/70 border border-stone-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">3</span>
                  <p>Tap <strong className="text-emerald-400">Add</strong>. Launch offline in the deep woods with full GPS navigation.</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-emerald-600/90 py-2.5 text-xs font-semibold tracking-wider text-white hover:bg-emerald-500 transition"
              >
                GOT IT
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
