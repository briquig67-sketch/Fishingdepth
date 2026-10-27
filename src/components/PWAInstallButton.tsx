/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 transition active:scale-95 border border-sky-400/30"
        title="Install as Android / Mobile Web App"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Install APK</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-sky-700/60 bg-sky-950/40 px-2.5 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-900/50"
        >
          <Smartphone className="h-3.5 w-3.5 text-sky-400" />
          <span className="hidden sm:inline">Add to Home</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-xl border border-sky-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-sky-400" />
                Install on iPad or iPhone
              </h3>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                1. Tap the <strong className="text-sky-300">Share</strong> icon in the Safari toolbar.<br />
                2. Scroll down and select <strong className="text-sky-300">Add to Home Screen</strong>.<br />
                3. Launch directly from your home screen for full-screen boating use!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-sky-600 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition"
              >
                Close Guide
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
