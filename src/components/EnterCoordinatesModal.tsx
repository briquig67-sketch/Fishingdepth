/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';
import { GPSCoordinate } from '../types/marine';
import { parseCoordinates, formatDDM, formatDMS, calculateDistanceNM, calculateDistanceKm, calculateBearing, bearingToCardinal } from '../utils/geoUtils';
import { 
  Compass, 
  MapPin, 
  Check, 
  AlertCircle, 
  Navigation, 
  Plus, 
  X,
  BookmarkPlus
} from 'lucide-react';

interface EnterCoordinatesModalProps {
  currentBoatPosition: GPSCoordinate | null;
  onPlotOnMap: (coord: GPSCoordinate, label?: string) => void;
  onSaveAsSpot: (coord: GPSCoordinate, defaultName?: string) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const EnterCoordinatesModal: React.FC<EnterCoordinatesModalProps> = ({
  currentBoatPosition,
  onPlotOnMap,
  onSaveAsSpot,
  onClose,
  isModal = false,
}) => {
  const [inputVal, setInputVal] = useState<string>('');
  const [spotName, setSpotName] = useState<string>('');
  const rawInputId = useId();
  const customSpotNameId = useId();

  const parseResult = parseCoordinates(inputVal);
  const parsedCoord = parseResult.success && parseResult.coord ? parseResult.coord : null;

  // Compute live range and bearing if vessel position is known
  let rangeNM: number | null = null;
  let rangeKm: number | null = null;
  let bearingDeg: number | null = null;

  if (currentBoatPosition && parsedCoord) {
    rangeNM = calculateDistanceNM(currentBoatPosition, parsedCoord);
    rangeKm = calculateDistanceKm(currentBoatPosition, parsedCoord);
    bearingDeg = calculateBearing(currentBoatPosition, parsedCoord);
  }

  // Check if inside Victorian bay bounding box
  const isVictorianWaters = parsedCoord
    ? parsedCoord.lat >= -39.0 && parsedCoord.lat <= -37.5 && parsedCoord.lng >= 144.0 && parsedCoord.lng <= 146.0
    : false;

  const handlePlot = () => {
    if (!parsedCoord) return;
    onPlotOnMap(parsedCoord, spotName.trim() || 'Custom Waypoint');
    if (onClose) onClose();
  };

  const handleSave = () => {
    if (!parsedCoord) return;
    onSaveAsSpot(parsedCoord, spotName.trim() || 'Custom GPS Spot');
    if (onClose) onClose();
  };

  const loadExample = (text: string, name: string) => {
    setInputVal(text);
    setSpotName(name);
  };

  const content = (
    <div className="space-y-4 text-slate-100">
      <div className="flex items-center justify-between border-b border-sky-800/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-sky-600/30 p-2 text-sky-400 border border-sky-500/40">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              Enter Coordinates & Plot
            </h3>
            <p className="text-xs text-sky-300">
              Input any GPS format (DD, Maritime DDM, DMS) to calculate range & bearing
            </p>
          </div>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Coordinate Input Field */}
      <div>
        <label htmlFor={rawInputId} className="block text-xs font-bold uppercase tracking-wider text-sky-300">
          Raw Coordinates (Paste or Type)
        </label>
        <div className="mt-1 relative">
          <input
            id={rawInputId}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={`e.g. -38.2050, 145.0133  or  38° 12.300' S, 145° 00.800' E`}
            className="w-full rounded-xl border border-sky-700/80 bg-slate-950 px-3.5 py-3 font-mono text-sm text-white placeholder-slate-500 shadow-inner focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
          {inputVal && (
            <button
              onClick={() => setInputVal('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          Dual parser supports: Decimal Degrees, Degrees Decimal Minutes (DDM), or Degrees Minutes Seconds (DMS).
        </p>
      </div>

      {/* Optional Spot Name */}
      <div>
        <label htmlFor={customSpotNameId} className="block text-xs font-bold uppercase tracking-wider text-slate-300">
          Custom Spot Label (Optional)
        </label>
        <input
          id={customSpotNameId}
          type="text"
          value={spotName}
          onChange={(e) => setSpotName(e.target.value)}
          placeholder="e.g. Secret Snapper Gutter, Kingfish Ledge"
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
        />
      </div>

      {/* Validation & Live Parsing Status Card */}
      {inputVal.trim() && (
        <div
          className={`rounded-xl border p-3 text-xs ${
            parsedCoord
              ? 'border-emerald-600/60 bg-emerald-950/30 text-emerald-200'
              : 'border-rose-600/60 bg-rose-950/30 text-rose-200'
          }`}
        >
          {parsedCoord ? (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Check className="h-4 w-4" /> Valid Coordinates Recognized
                {isVictorianWaters && (
                  <span className="ml-2 rounded bg-sky-900/80 px-1.5 py-0.5 text-[10px] text-sky-200 border border-sky-700">
                    Victorian Waters
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="rounded bg-slate-950/80 p-2 font-mono">
                  <span className="text-slate-400 block text-[10px]">MARITIME DDM:</span>
                  <span className="font-bold text-white">{formatDDM(parsedCoord.lat, parsedCoord.lng).full}</span>
                </div>
                <div className="rounded bg-slate-950/80 p-2 font-mono">
                  <span className="text-slate-400 block text-[10px]">DECIMAL DEGREES:</span>
                  <span className="font-bold text-white">{parsedCoord.lat.toFixed(6)}, {parsedCoord.lng.toFixed(6)}</span>
                </div>
              </div>

              {/* Navigation Range & Bearing relative to current boat position */}
              {currentBoatPosition && rangeNM !== null && bearingDeg !== null && (
                <div className="rounded-lg bg-sky-950/80 p-2.5 border border-sky-800 text-sky-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Navigation className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Range from Boat:</span>
                    <strong className="text-white text-sm font-mono">{rangeNM.toFixed(2)} NM</strong>
                    <span className="text-[11px] text-slate-300">({rangeKm?.toFixed(1)} km)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span>Bearing:</span>
                    <strong className="text-white text-sm font-mono">{bearingDeg}° {bearingToCardinal(bearingDeg)}</strong>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{parseResult.error || 'Invalid coordinate format.'}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          disabled={!parsedCoord}
          onClick={handlePlot}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
        >
          <MapPin className="h-4 w-4" /> Plot on Depth Map
        </button>

        <button
          disabled={!parsedCoord}
          onClick={handleSave}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 rounded-xl border border-sky-600 bg-sky-950/80 px-4 py-2.5 text-xs font-bold text-sky-200 hover:bg-sky-900 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95"
        >
          <BookmarkPlus className="h-4 w-4" /> Save to Fishing Spots
        </button>
      </div>

      {/* Preset Quick Marks */}
      <div className="border-t border-slate-800 pt-3">
        <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Or load verified Victorian test coordinates:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => loadExample('-37.9480, 144.9270', 'Fawkner Beacon (15.5m Silt)')}
            className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-sky-900 hover:text-white border border-slate-700"
          >
            Fawkner Beacon (Port Phillip)
          </button>
          <button
            onClick={() => loadExample('38° 12.300\' S, 145° 00.800\' E', 'Mornington Artificial Reef')}
            className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-sky-900 hover:text-white border border-slate-700"
          >
            Mornington Reef (DDM format)
          </button>
          <button
            onClick={() => loadExample('-38.3667, 145.3083', 'Middle Spit Whiting (4.8m Weed)')}
            className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-sky-900 hover:text-white border border-slate-700"
          >
            Middle Spit (Western Port)
          </button>
          <button
            onClick={() => loadExample('-38.4083, 145.2633', 'Tortoise Head Gutter (13.5m)')}
            className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-sky-900 hover:text-white border border-slate-700"
          >
            Tortoise Head (Western Port)
          </button>
          <button
            onClick={() => loadExample('-38.3017, 144.6300', 'The Rip Canyon (62m Deep)')}
            className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-sky-900 hover:text-white border border-slate-700"
          >
            The Rip (Heads Deep Chasm)
          </button>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-lg rounded-2xl border border-sky-800 bg-slate-900 p-5 shadow-2xl">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sky-800/60 bg-slate-900/90 p-5 shadow-lg">
      {content}
    </div>
  );
};
