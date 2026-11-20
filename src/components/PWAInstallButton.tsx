import React, { useState } from 'react';
import { Smartphone, WifiOff } from 'lucide-react';
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
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#171A23] hover:bg-white/10 border border-[#10B981]/50 text-xs font-semibold text-[#10B981] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Install on Android</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#171A23] border border-white/15 text-xs font-medium text-[#F3F4F6] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
            <div className="w-full max-w-sm rounded-xl bg-[#101218] border border-white/15 p-6 shadow-2xl">
              <h3 className="font-display text-base font-bold text-white">
                Install on iPhone / iPad
              </h3>
              <p className="mt-2 text-xs text-[#9CA3AF] leading-relaxed">
                1. Tap the <strong className="text-white">Share</strong> button in Safari.
                <br />
                2. Scroll down and tap{' '}
                <strong className="text-white">Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-[#10B981] py-2 text-xs font-bold text-[#08090C] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWAInstall();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#171A23] border border-[#FF6B2C]/60 px-3 py-2 text-xs font-medium text-[#F3F4F6] shadow-xl">
      <WifiOff className="w-3.5 h-3.5 text-[#FF6B2C]" />
      <span>Offline Mode — Cached studio assets active</span>
    </div>
  );
};
