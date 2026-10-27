/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BoatGPSState, SIMULATED_START_POINTS } from '../hooks/useBoatGPS';
import { formatDDM, calculateDistanceNM, calculateDistanceKm, calculateBearing, bearingToCardinal } from '../utils/geoUtils';
import { VICTORIAN_FISHING_SPOTS } from '../data/victorianMarineData';
import { 
  Navigation, 
  Compass, 
  Anchor, 
  MapPin, 
  Copy, 
  Check, 
  AlertTriangle, 
  Crosshair, 
  Gauge, 
  Ship,
  Sparkles
} from 'lucide-react';

interface NavigationHUDProps {
  gpsState: BoatGPSState;
  onSetSimulatedLocation: (key: keyof typeof SIMULATED_START_POINTS) => void;
  onUseLiveGPS: () => void;
  onToggleAnchorWatch: (radiusMeters?: number) => void;
  onNavigateToSpot: (spotId: string) => void;
  onPlotCoordinates: (coords: { lat: number; lng: number }) => void;
}

export const NavigationHUD: React.FC<NavigationHUDProps> = ({
  gpsState,
  onSetSimulatedLocation,
  onUseLiveGPS,
  onToggleAnchorWatch,
  onNavigateToSpot,
  onPlotCoordinates,
}) => {
  const [copied, setCopied] = useState(false);
  const [customAnchorRadius, setCustomAnchorRadius] = useState<number>(40);

  const coords = gpsState.coords;

  // Find closest fishing spot
  let closestSpot: { spot: typeof VICTORIAN_FISHING_SPOTS[0]; distanceNM: number; distanceKm: number; bearing: number } | null = null;
  if (coords) {
    let minNM = Infinity;
    for (const spot of VICTORIAN_FISHING_SPOTS) {
      const dist = calculateDistanceNM(coords, spot);
      if (dist < minNM) {
        minNM = dist;
        const distKm = calculateDistanceKm(coords, spot);
        const brg = calculateBearing(coords, spot);
        closestSpot = { spot, distanceNM: dist, distanceKm: distKm, bearing: brg };
      }
    }
  }

  const ddmFormat = coords ? formatDDM(coords.lat, coords.lng) : null;

  const handleCopyCoords = () => {
    if (!coords || !ddmFormat) return;
    const text = `${ddmFormat.full} (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Anchor Alarm Breached Banner */}
      {gpsState.anchorAlarm.isBreached && (
        <div className="flex animate-pulse items-center justify-between rounded-xl border border-rose-500 bg-rose-950/90 p-4 text-white shadow-xl shadow-rose-950/50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-rose-400" />
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-rose-200">
                ⚠️ ANCHOR DRIFT ALARM BREACHED!
              </h4>
              <p className="text-xs text-rose-300">
                Drifted <strong className="text-white text-sm">{gpsState.anchorAlarm.currentDriftMeters}m</strong> from drop point (Radius: {gpsState.anchorAlarm.radiusMeters}m). Vessel is dragging anchor!
              </p>
            </div>
          </div>
          <button
            onClick={() => onToggleAnchorWatch()}
            className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-rose-500"
          >
            Acknowledge / Reset
          </button>
        </div>
      )}

      {/* Main Boating Cockpit Instrument Cluster */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Speed Over Ground (SOG) */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-800/60 bg-gradient-to-br from-slate-900 to-sky-950/80 p-4 shadow-lg shadow-sky-950/40">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Gauge className="h-4 w-4" /> SOG (Speed)
            </span>
            <span className="rounded bg-sky-900/60 px-1.5 py-0.5 text-[10px] text-sky-300">
              KNOTS (kt)
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow">
              {gpsState.speedKnots.toFixed(1)}
            </span>
            <span className="text-xs font-bold text-sky-300">
              knots ({(gpsState.speedKnots * 1.852).toFixed(1)} km/h)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {gpsState.speedKnots < 1
              ? 'Vessel at drift or anchored'
              : gpsState.speedKnots < 7
              ? 'Trolling / idle speed'
              : 'On plane / cruising'}
          </div>
        </div>

        {/* Course Over Ground (COG) / Compass Heading */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-800/60 bg-gradient-to-br from-slate-900 to-sky-950/80 p-4 shadow-lg shadow-sky-950/40">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Compass className="h-4 w-4" /> COG (Course)
            </span>
            <span className="rounded bg-sky-900/60 px-1.5 py-0.5 text-[10px] text-sky-300">
              BEARING
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-white drop-shadow">
              {gpsState.heading !== null ? `${gpsState.heading.toString().padStart(3, '0')}°` : '---°'}
            </span>
            <span className="text-base font-extrabold text-cyan-400">
              {gpsState.heading !== null ? bearingToCardinal(gpsState.heading) : 'N/A'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
            <div
              className="inline-block transition-transform duration-300 text-sky-400"
              style={{
                transform: `rotate(${gpsState.heading || 0}deg)`,
              }}
            >
              <Navigation className="h-3.5 w-3.5 fill-sky-400" />
            </div>
            <span>Heading relative to True North</span>
          </div>
        </div>

        {/* GPS Fix Accuracy & Source */}
        <div className="relative overflow-hidden rounded-2xl border border-sky-800/60 bg-gradient-to-br from-slate-900 to-sky-950/80 p-4 shadow-lg shadow-sky-950/40">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Crosshair className="h-4 w-4" /> GPS Fix Quality
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                gpsState.isLive
                  ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-600/50'
                  : 'bg-amber-900/80 text-amber-300 border border-amber-600/50'
              }`}
            >
              {gpsState.isLive ? 'Hardware Fix' : 'Simulated Fix'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-black text-white">
              ±{gpsState.accuracy ?? 5}m
            </span>
            <span className="text-xs text-slate-300">accuracy</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Satellite fix: 3D High-Precision</span>
            {gpsState.isSimulated && (
              <button
                onClick={onUseLiveGPS}
                className="text-xs font-bold text-sky-400 underline hover:text-sky-300"
              >
                Use Real GPS
              </button>
            )}
          </div>
        </div>

        {/* Anchor Watch Quick Module */}
        <div className={`relative overflow-hidden rounded-2xl border p-4 shadow-lg transition ${
          gpsState.anchorAlarm.isActive
            ? gpsState.anchorAlarm.isBreached
              ? 'border-rose-500 bg-rose-950/80 shadow-rose-900/40'
              : 'border-emerald-600/60 bg-emerald-950/30 shadow-emerald-950/30'
            : 'border-sky-800/60 bg-gradient-to-br from-slate-900 to-sky-950/80'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <Anchor className="h-4 w-4 text-sky-300" /> Anchor Watch
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
              gpsState.anchorAlarm.isActive ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {gpsState.anchorAlarm.isActive ? 'ARMED' : 'OFF'}
            </span>
          </div>

          <div className="mt-2 flex items-baseline justify-between">
            <div>
              <span className="font-mono text-3xl font-black text-white">
                {gpsState.anchorAlarm.isActive ? `${gpsState.anchorAlarm.currentDriftMeters}m` : 'Ready'}
              </span>
              {gpsState.anchorAlarm.isActive && (
                <span className="text-xs text-slate-300 ml-1">/ {gpsState.anchorAlarm.radiusMeters}m</span>
              )}
            </div>

            <button
              onClick={() => onToggleAnchorWatch(customAnchorRadius)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase transition active:scale-95 ${
                gpsState.anchorAlarm.isActive
                  ? 'bg-rose-600 text-white hover:bg-rose-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950'
              }`}
            >
              {gpsState.anchorAlarm.isActive ? 'Disarm' : 'Set Anchor'}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Radius:</span>
            <div className="flex gap-1">
              {[25, 40, 60, 100].map((r) => (
                <button
                  key={r}
                  disabled={gpsState.anchorAlarm.isActive}
                  onClick={() => setCustomAnchorRadius(r)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    customAnchorRadius === r ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {r}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GPS Coordinates Bar & Nearest Fishing Mark */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Vessel Position Coordinates */}
        <div className="rounded-2xl border border-sky-800/60 bg-slate-900/90 p-4 shadow-md">
          <div className="flex items-center justify-between border-b border-sky-900/50 pb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
              <MapPin className="h-4 w-4" /> Vessel GPS Coordinates
            </span>
            <button
              onClick={handleCopyCoords}
              className="flex items-center gap-1 rounded bg-sky-950 px-2 py-1 text-xs font-medium text-sky-300 border border-sky-700/60 hover:bg-sky-900 transition"
              title="Copy GPS coordinates"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {/* Marine DDM format */}
            <div className="rounded-xl bg-slate-950/70 p-2.5 border border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                Maritime DDM (Chart/VHF Format)
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-white tracking-wide">
                {ddmFormat ? ddmFormat.full : 'Awaiting GPS lock...'}
              </div>
            </div>

            {/* Decimal Degrees format */}
            <div className="rounded-xl bg-slate-950/70 p-2.5 border border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Decimal Degrees (DD)
              </div>
              <div className="mt-1 font-mono text-sm font-semibold text-slate-200">
                {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : '---'}
              </div>
            </div>
          </div>

          {/* Quick Simulation Points */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 font-semibold text-sky-300">
              <Ship className="h-3.5 w-3.5 text-sky-400" /> Quick Jump:
            </span>
            <button
              onClick={() => onSetSimulatedLocation('fawkner')}
              className="rounded bg-sky-950/80 px-2 py-0.5 text-sky-200 border border-sky-800 hover:bg-sky-800 transition"
            >
              Fawkner Beacon
            </button>
            <button
              onClick={() => onSetSimulatedLocation('carrum')}
              className="rounded bg-sky-950/80 px-2 py-0.5 text-sky-200 border border-sky-800 hover:bg-sky-800 transition"
            >
              Carrum 14m
            </button>
            <button
              onClick={() => onSetSimulatedLocation('middleSpit')}
              className="rounded bg-sky-950/80 px-2 py-0.5 text-sky-200 border border-sky-800 hover:bg-sky-800 transition"
            >
              Middle Spit
            </button>
            <button
              onClick={() => onSetSimulatedLocation('tortoiseHead')}
              className="rounded bg-sky-950/80 px-2 py-0.5 text-sky-200 border border-sky-800 hover:bg-sky-800 transition"
            >
              Tortoise Head
            </button>
          </div>
        </div>

        {/* Nearest Premier Victorian Fishing Mark */}
        <div className="rounded-2xl border border-sky-800/60 bg-slate-900/90 p-4 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-sky-900/50 pb-2">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400">
                <Sparkles className="h-4 w-4" /> Closest Charted Fishing Spot
              </span>
              {closestSpot && (
                <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-800">
                  {closestSpot.spot.bay === 'port-phillip' ? 'Port Phillip' : 'Western Port'}
                </span>
              )}
            </div>

            {closestSpot ? (
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <h4 className="text-sm font-extrabold text-white">
                    {closestSpot.spot.name}
                  </h4>
                  <div className="text-right">
                    <span className="font-mono text-base font-black text-cyan-300">
                      {closestSpot.distanceNM.toFixed(2)} NM
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5">
                      ({closestSpot.distanceKm.toFixed(1)} km)
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-slate-950 px-2 py-1 font-mono font-bold text-sky-300 border border-slate-800">
                    Steer: {closestSpot.bearing}° {bearingToCardinal(closestSpot.bearing)}
                  </span>
                  <span className="rounded-md bg-slate-950 px-2 py-1 font-semibold text-emerald-300 border border-slate-800">
                    Depth: {closestSpot.spot.depthMeters}m
                  </span>
                  <span className="rounded-md bg-slate-950 px-2 py-1 font-semibold text-amber-300 border border-slate-800">
                    {closestSpot.spot.seabed}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-300 line-clamp-1">
                  Target: {closestSpot.spot.targetSpecies.join(', ')}
                </p>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Acquiring GPS fix to calculate range to closest marks...
              </div>
            )}
          </div>

          {closestSpot && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onNavigateToSpot(closestSpot!.spot.id)}
                className="flex-1 rounded-xl bg-sky-600 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-500 transition active:scale-95"
              >
                Inspect Spot Details
              </button>
              <button
                onClick={() => onPlotCoordinates({ lat: closestSpot!.spot.lat, lng: closestSpot!.spot.lng })}
                className="rounded-xl border border-sky-700 bg-sky-950/80 px-3 py-2 text-xs font-bold text-sky-200 hover:bg-sky-900 transition"
              >
                Center on Chart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
