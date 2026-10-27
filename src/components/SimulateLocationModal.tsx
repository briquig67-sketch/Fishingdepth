/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SIMULATED_START_POINTS, BoatGPSState } from '../hooks/useBoatGPS';
import { Radio, X, MapPin, Check, Satellite, Compass } from 'lucide-react';

interface SimulateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  gpsState: BoatGPSState;
  onSelectPoint: (key: keyof typeof SIMULATED_START_POINTS) => void;
  onUseLiveGPS: () => void;
}

export const SimulateLocationModal: React.FC<SimulateLocationModalProps> = ({
  isOpen,
  onClose,
  gpsState,
  onSelectPoint,
  onUseLiveGPS,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-sky-700 bg-slate-900 shadow-2xl text-slate-100 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-sky-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Vessel GPS Fix Source
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          While on the water in your boat, use <strong>Hardware Satellite GPS</strong>. While at home planning your trip, you can simulate vessel positions at key Victorian fishing grounds.
        </p>

        {/* Live Device GPS Option */}
        <button
          onClick={() => {
            onUseLiveGPS();
            onClose();
          }}
          className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition active:scale-95 ${
            gpsState.isLive
              ? 'border-emerald-500 bg-emerald-950/50 shadow-md shadow-emerald-950'
              : 'border-slate-700 bg-slate-950 hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${gpsState.isLive ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              <Satellite className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                Real Device GPS Fix
                {gpsState.isLive && (
                  <span className="rounded bg-emerald-800 px-1.5 py-0.2 text-[9px] text-white">ACTIVE</span>
                )}
              </div>
              <div className="text-[11px] text-slate-400">
                Uses your device's high-precision internal GPS sensor
              </div>
            </div>
          </div>
          {gpsState.isLive && <Check className="h-4 w-4 text-emerald-400" />}
        </button>

        <div className="border-t border-slate-800 pt-3">
          <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider block mb-2">
            Or Simulate In Victorian Waters:
          </span>

          <div className="space-y-2">
            {(Object.entries(SIMULATED_START_POINTS) as [keyof typeof SIMULATED_START_POINTS, typeof SIMULATED_START_POINTS.fawkner][]).map(([key, point]) => (
              <button
                key={key}
                onClick={() => {
                  onSelectPoint(key);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-sky-950 hover:border-sky-700 text-left transition"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-sky-400" />
                  <span className="text-xs font-semibold text-white">{point.name}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  {point.lat.toFixed(3)}, {point.lng.toFixed(3)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
