/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BoatGPSState } from '../hooks/useBoatGPS';
import { ShieldCheck, Moon, Sun, Flame, Radio, Compass } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  gpsState: BoatGPSState;
  displayMode: 'day' | 'night' | 'sun';
  setDisplayMode: (mode: 'day' | 'night' | 'sun') => void;
  onOpenRules: () => void;
  onOpenSimulateModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  gpsState,
  displayMode,
  setDisplayMode,
  onOpenRules,
  onOpenSimulateModal,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-sky-900/60 bg-slate-950/95 backdrop-blur-md px-3 py-2.5 sm:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 via-sky-600 to-cyan-500 p-0.5 shadow-md shadow-sky-950/80">
            <img
              src="/logo.svg"
              alt="Victorian Boat Fishing Guide Logo"
              className="h-full w-full rounded-[10px] object-cover"
            />
            {/* Live GPS pulsing radar dot */}
            <span className={`absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center`}>
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
                  gpsState.isLive ? 'bg-emerald-400' : gpsState.isSimulated ? 'bg-amber-400' : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  gpsState.isLive ? 'bg-emerald-500' : gpsState.isSimulated ? 'bg-amber-500' : 'bg-rose-500'
                }`}
              />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white sm:text-xl uppercase drop-shadow">
                Victorian Boat Fishing Guide
              </h1>
              <span className="hidden rounded bg-sky-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-sky-200 uppercase md:inline-block border border-sky-700/50">
                VIC Marine
              </span>
            </div>
            <p className="text-[11px] font-medium text-sky-300/80 flex items-center gap-1.5">
              <span>Port Phillip Bay</span>
              <span className="text-sky-600">•</span>
              <span>Western Port Bay</span>
              <span className="text-sky-600">•</span>
              <span className="text-emerald-400 font-semibold">Real Charted Depths</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* GPS Status Indicator / Simulator Selector */}
          <button
            onClick={onOpenSimulateModal}
            title="GPS Mode & Status"
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition active:scale-95 ${
              gpsState.isLive
                ? 'border-emerald-600/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                : gpsState.isSimulated
                ? 'border-amber-600/60 bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
                : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${gpsState.isLive ? 'animate-pulse text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">
              {gpsState.isLive ? 'GPS: LOCKED' : gpsState.isSimulated ? 'GPS: SIMULATED' : 'GPS: SEARCHING'}
            </span>
            <span className="sm:hidden">{gpsState.isLive ? 'GPS' : 'SIM'}</span>
          </button>

          {/* VFA Rules Button */}
          <button
            onClick={onOpenRules}
            title="Victorian Fisheries Size & Bag Limits"
            className="flex items-center gap-1.5 rounded-lg border border-sky-700/50 bg-sky-950/40 px-2.5 py-1.5 text-xs font-semibold text-sky-200 transition hover:bg-sky-900/60 active:scale-95"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
            <span className="hidden md:inline">VFA Rules</span>
            <span className="md:hidden">Rules</span>
          </button>

          {/* View Mode Toggle: Day Marine / Night Red / Sun Glare */}
          <div className="flex rounded-lg border border-slate-700/80 bg-slate-900 p-0.5">
            <button
              onClick={() => setDisplayMode('day')}
              title="Day Marine View"
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                displayMode === 'day' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDisplayMode('night')}
              title="Night Red Vision (Low light for boating)"
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                displayMode === 'night' ? 'bg-rose-700 text-white shadow' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <Moon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDisplayMode('sun')}
              title="High-Contrast Sunlight Mode (for bright deck screens)"
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                displayMode === 'sun' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
