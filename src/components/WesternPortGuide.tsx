/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VICTORIAN_FISHING_SPOTS, VICTORIAN_BOAT_RAMPS } from '../data/victorianMarineData';
import { FishingSpot } from '../types/marine';
import { formatDDM } from '../utils/geoUtils';
import { 
  Anchor, 
  MapPin, 
  AlertTriangle, 
  Fish, 
  Waves, 
  Layers, 
  Navigation,
  Compass
} from 'lucide-react';

interface WesternPortGuideProps {
  onPlotSpot: (spot: FishingSpot) => void;
  onNavigateToSpot: (spot: FishingSpot) => void;
}

export const WesternPortGuide: React.FC<WesternPortGuideProps> = ({
  onPlotSpot,
  onNavigateToSpot,
}) => {
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');

  const wpSpots = VICTORIAN_FISHING_SPOTS.filter((s) => s.bay === 'western-port');
  const wpRamps = VICTORIAN_BOAT_RAMPS.filter((r) => r.bay === 'western-port');

  const filteredSpots = wpSpots.filter((s) => {
    if (selectedSpecies !== 'all' && !s.targetSpecies.includes(selectedSpecies)) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 text-slate-100">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-800 bg-gradient-to-r from-slate-950 via-cyan-950 to-blue-950 p-5 shadow-xl">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-lg bg-cyan-600/30 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300 border border-cyan-500/30">
              Victoria Marine Area Guide
            </span>
            <span className="text-xs text-cyan-200">
              Tidal Range: Up to 3.1m • Channels: Up to 28m depth
            </span>
          </div>

          <h2 className="mt-2 text-2xl font-black text-white uppercase tracking-tight sm:text-3xl">
            Western Port Bay
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-cyan-100/90 max-w-3xl leading-relaxed">
            A dynamic, tide-driven marine system carved by deep trenches surrounding French Island and Phillip Island. World-renowned for its trophy Gummy Shark channels, autumn Elephant Fish run, and premier King George Whiting sandbanks.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <div className="rounded-xl bg-slate-900/80 px-3 py-1.5 border border-cyan-800 flex items-center gap-1.5">
              <Fish className="h-4 w-4 text-cyan-400" />
              <span><strong>Top Targets:</strong> Gummy Shark, Elephant Fish, King George Whiting, Calamari, Snapper</span>
            </div>
            <div className="rounded-xl bg-slate-900/80 px-3 py-1.5 border border-cyan-800 flex items-center gap-1.5">
              <Waves className="h-4 w-4 text-sky-400" />
              <span><strong>Current Flow:</strong> Fast 4-5 knot tidal runs; heavy sinkers essential</span>
            </div>
          </div>
        </div>
      </div>

      {/* Western Port Tidal Warning */}
      <div className="rounded-xl border border-amber-600/60 bg-amber-950/30 p-4 text-xs text-amber-200 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold text-amber-300 uppercase tracking-wide">
            Western Port Boating & Tidal Realities:
          </strong>
          <ul className="mt-1 list-disc list-inside space-y-1 text-amber-200/90">
            <li>
              <strong>Massive Tidal Flow:</strong> The 3+ metre tidal rise forces massive volumes through North Arm and Western Entrance. Standard 2oz–4oz sinkers will not hold; carry 8oz to 16oz snapper sinkers and wire-spreader / running-sinker rigs.
            </li>
            <li>
              <strong>Mudflat Stranding Danger:</strong> Vast mudbanks around French Island dry out completely on low tide. Do NOT cut across unmarked banks at low water. Always stay in charted beacons and lateral channels.
            </li>
            <li>
              <strong>Tidal Time Differences:</strong> High tide at Corinella occurs approximately 1 hour and 15 minutes AFTER high tide at Flinders / Western Entrance.
            </li>
          </ul>
        </div>
      </div>

      {/* Species Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-900/60 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          Charted Western Port Fishing Marks ({filteredSpots.length})
        </span>

        <div className="flex flex-wrap gap-1">
          {['all', 'Gummy Shark', 'Elephant Fish', 'King George Whiting', 'Calamari (Squid)', 'Yellowtail Kingfish'].map((sp) => (
            <button
              key={sp}
              onClick={() => setSelectedSpecies(sp)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                selectedSpecies === sp
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {sp === 'all' ? 'All Species' : sp.replace(' (Squid)', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Spots Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filteredSpots.map((spot) => (
          <div
            key={spot.id}
            className="flex flex-col justify-between rounded-2xl border border-cyan-800/70 bg-slate-900/90 p-4 shadow-lg hover:border-cyan-500 transition"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-black text-white">
                  {spot.name}
                </h4>
                <span className="shrink-0 rounded-md bg-cyan-950 px-2 py-0.5 font-mono text-xs font-bold text-cyan-300 border border-cyan-800">
                  {spot.depthMeters}m Depth
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded bg-slate-950 px-2 py-0.5 text-cyan-300 border border-slate-800">
                  Seabed: {spot.seabed}
                </span>
                <span className="rounded bg-slate-950 px-2 py-0.5 text-emerald-300 border border-slate-800">
                  {spot.bestTide}
                </span>
              </div>

              <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                {spot.notes}
              </p>

              <div className="mt-2.5 rounded-lg bg-slate-950/80 p-2 font-mono text-[11px] text-cyan-300 flex items-center justify-between">
                <span>{formatDDM(spot.lat, spot.lng).full}</span>
                <span className="text-[10px] text-slate-400">({spot.lat.toFixed(4)}, {spot.lng.toFixed(4)})</span>
              </div>
            </div>

            <div className="mt-4 flex gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => onPlotSpot(spot)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition active:scale-95"
              >
                <MapPin className="h-3.5 w-3.5" /> View on Depth Chart
              </button>
              <button
                onClick={() => onNavigateToSpot(spot)}
                className="flex items-center gap-1 rounded-xl border border-cyan-700 bg-cyan-950/80 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-900 transition"
              >
                <Navigation className="h-3.5 w-3.5 text-cyan-400" /> Plot
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Key Western Port Boat Ramps */}
      <div className="rounded-2xl border border-cyan-800/60 bg-slate-900/80 p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
          <Anchor className="h-4 w-4" /> Major Western Port Boat Ramps
        </h3>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {wpRamps.map((ramp) => (
            <div key={ramp.id} className="rounded-xl bg-slate-950/80 p-3 border border-slate-800 text-xs">
              <div className="font-bold text-white">{ramp.name}</div>
              <div className="mt-1 text-slate-400 text-[11px]">
                {ramp.lanes} lanes • {ramp.pontoon ? 'Pontoon equipped' : 'No pontoon'} • {ramp.parkingBays} bays
              </div>
              <div className="mt-1 text-cyan-300 text-[11px]">
                {ramp.suitableTides}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
