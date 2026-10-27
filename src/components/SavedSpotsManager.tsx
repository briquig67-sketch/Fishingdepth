/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';
import { FishingSpot, GPSCoordinate, SeabedType, BayRegion } from '../types/marine';
import { formatDDM, calculateDistanceNM, calculateDistanceKm, calculateBearing, bearingToCardinal, parseCoordinates } from '../utils/geoUtils';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  MapPin, 
  Download, 
  Upload, 
  Search, 
  Filter, 
  Navigation, 
  Crosshair, 
  Check, 
  Copy,
  FolderDown,
  Sparkles
} from 'lucide-react';

interface SavedSpotsManagerProps {
  customSpots: FishingSpot[];
  defaultSpots: FishingSpot[];
  boatCoords: GPSCoordinate | null;
  onAddSpot: (spot: FishingSpot) => void;
  onDeleteSpot: (spotId: string) => void;
  onPlotSpot: (spot: FishingSpot) => void;
}

export const SavedSpotsManager: React.FC<SavedSpotsManagerProps> = ({
  customSpots,
  defaultSpots,
  boatCoords,
  onAddSpot,
  onDeleteSpot,
  onPlotSpot,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [bayFilter, setBayFilter] = useState<'all' | 'port-phillip' | 'western-port' | 'custom'>('all');
  const [sortBy, setSortBy] = useState<'distance' | 'name' | 'depth'>('distance');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [newName, setNewName] = useState<string>('');
  const [newCoordsStr, setNewCoordsStr] = useState<string>('');
  const [newDepth, setNewDepth] = useState<string>('12');
  const [newBay, setNewBay] = useState<BayRegion>('port-phillip');
  const [newSeabed, setNewSeabed] = useState<SeabedType>('Sand / Grit');
  const [newSpecies, setNewSpecies] = useState<string>('Snapper, Flathead');
  const [newNotes, setNewNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const searchInputId = useId();
  const sortSelectId = useId();
  const spotNameId = useId();
  const spotCoordsId = useId();
  const spotDepthId = useId();
  const spotBayId = useId();
  const spotSeabedId = useId();
  const spotSpeciesId = useId();
  const spotNotesId = useId();

  const allSpots = [...defaultSpots, ...customSpots];

  // Filtering & Sorting
  const filteredSpots = allSpots
    .filter((spot) => {
      if (bayFilter === 'custom' && !spot.isUserCustom) return false;
      if (bayFilter === 'port-phillip' && spot.bay !== 'port-phillip') return false;
      if (bayFilter === 'western-port' && spot.bay !== 'western-port') return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = spot.name.toLowerCase().includes(q);
        const matchesNotes = spot.notes.toLowerCase().includes(q);
        const matchesSpecies = spot.targetSpecies.some((s) => s.toLowerCase().includes(q));
        const matchesSeabed = spot.seabed.toLowerCase().includes(q);
        return matchesName || matchesNotes || matchesSpecies || matchesSeabed;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'distance' && boatCoords) {
        const distA = calculateDistanceNM(boatCoords, a);
        const distB = calculateDistanceNM(boatCoords, b);
        return distA - distB;
      }
      if (sortBy === 'depth') {
        return a.depthMeters - b.depthMeters;
      }
      return a.name.localeCompare(b.name);
    });

  const handleCreateSpot = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim()) {
      setFormError('Please enter a spot name');
      return;
    }

    const parse = parseCoordinates(newCoordsStr);
    if (!parse.success || !parse.coord) {
      setFormError(parse.error || 'Invalid GPS coordinates format');
      return;
    }

    const depthNum = parseFloat(newDepth) || 10;
    const speciesList = newSpecies.split(',').map((s) => s.trim()).filter(Boolean);

    const newSpot: FishingSpot = {
      id: `custom-spot-${Date.now()}`,
      name: newName.trim(),
      bay: newBay,
      lat: parse.coord.lat,
      lng: parse.coord.lng,
      depthMeters: depthNum,
      seabed: newSeabed,
      targetSpecies: speciesList.length > 0 ? speciesList : ['Snapper'],
      bestTide: 'High tide or change of tide',
      bestSeason: 'All year',
      notes: newNotes.trim() || 'Custom private waypoint',
      isUserCustom: true,
    };

    onAddSpot(newSpot);

    // Reset
    setNewName('');
    setNewCoordsStr('');
    setNewNotes('');
    setIsAddingNew(false);
  };

  const fillWithCurrentBoatGPS = () => {
    if (!boatCoords) return;
    setNewCoordsStr(`${boatCoords.lat.toFixed(5)}, ${boatCoords.lng.toFixed(5)}`);
  };

  const handleCopy = (spot: FishingSpot) => {
    const text = `${spot.name}: ${formatDDM(spot.lat, spot.lng).full} (Depth: ${spot.depthMeters}m)`;
    navigator.clipboard.writeText(text);
    setCopiedId(spot.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export Waypoints to standard GPX
  const exportGPX = () => {
    const waypointsXml = allSpots
      .map(
        (s) => `  <wpt lat="${s.lat}" lon="${s.lng}">
    <name>${escapeXml(s.name)}</name>
    <desc>Depth: ${s.depthMeters}m | Seabed: ${escapeXml(s.seabed)} | Target: ${escapeXml(s.targetSpecies.join(', '))}</desc>
    <sym>Fishing Spot</sym>
  </wpt>`
      )
      .join('\n');

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Victorian Boat Fishing Guide" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Victorian Boat Fishing Waypoints</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
${waypointsXml}
</gpx>`;

    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vic_Fishing_Waypoints_${new Date().toISOString().slice(0, 10)}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to JSON
  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customSpots, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `Custom_Spots_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const escapeXml = (unsafe: string) => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  return (
    <div className="space-y-4 text-slate-100">
      {/* Top Bar with Add Button and Export */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-sky-400" />
            Saved Fishing Spots & Marks
          </h2>
          <p className="text-xs text-sky-200">
            {allSpots.length} Total Waypoints ({customSpots.length} custom user marks)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-500 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{isAddingNew ? 'Cancel' : 'Add New Spot'}</span>
          </button>

          <button
            onClick={exportGPX}
            title="Export standard GPX for Lowrance / Garmin / Simrad"
            className="flex items-center gap-1 rounded-xl border border-sky-700 bg-sky-950/80 px-3 py-2 text-xs font-bold text-sky-200 hover:bg-sky-900 transition"
          >
            <FolderDown className="h-4 w-4 text-sky-400" />
            <span className="hidden sm:inline">Export GPX</span>
          </button>

          <button
            onClick={exportJSON}
            title="Export JSON backup"
            className="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-300 hover:text-white"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* New Spot Form */}
      {isAddingNew && (
        <form
          onSubmit={handleCreateSpot}
          className="rounded-2xl border border-sky-600/70 bg-slate-900/95 p-5 shadow-2xl space-y-3 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-sky-800 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-400" />
              Save New Fishing Spot
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          {formError && (
            <div className="rounded-lg bg-rose-950/80 border border-rose-600 p-2 text-xs text-rose-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label htmlFor={spotNameId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Spot Name *
              </label>
              <input
                id={spotNameId}
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Secret Snapper Hole, Kingfish Bommie"
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor={spotCoordsId} className="block font-bold text-slate-300 uppercase tracking-wider">
                  Coordinates *
                </label>
                {boatCoords && (
                  <button
                    type="button"
                    onClick={fillWithCurrentBoatGPS}
                    className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                  >
                    <Crosshair className="h-3 w-3" /> Use Vessel GPS
                  </button>
                )}
              </div>
              <input
                id={spotCoordsId}
                type="text"
                required
                value={newCoordsStr}
                onChange={(e) => setNewCoordsStr(e.target.value)}
                placeholder="-38.2050, 145.0133  or  38° 12.300' S, 145° 00.800' E"
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 font-mono text-xs focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor={spotDepthId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Water Depth (Meters)
              </label>
              <input
                id={spotDepthId}
                type="number"
                step="0.5"
                value={newDepth}
                onChange={(e) => setNewDepth(e.target.value)}
                placeholder="12.5"
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor={spotBayId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Bay Region
              </label>
              <select
                id={spotBayId}
                value={newBay}
                onChange={(e) => setNewBay(e.target.value as BayRegion)}
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
              >
                <option value="port-phillip">Port Phillip Bay</option>
                <option value="western-port">Western Port Bay</option>
                <option value="bass-strait">Bass Strait (Offshore)</option>
              </select>
            </div>

            <div>
              <label htmlFor={spotSeabedId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Seabed Classification
              </label>
              <select
                id={spotSeabedId}
                value={newSeabed}
                onChange={(e) => setNewSeabed(e.target.value as SeabedType)}
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
              >
                <option value="Sand / Grit">Sand / Grit</option>
                <option value="Broken Shell / Rubble">Broken Shell / Rubble</option>
                <option value="Mud / Silt">Mud / Silt</option>
                <option value="Calcarenite Rock">Calcarenite Rock</option>
                <option value="Kelp Reef">Kelp Reef</option>
                <option value="Seagrass Bed">Seagrass Bed</option>
                <option value="Artificial Concrete Reef">Artificial Concrete Reef</option>
                <option value="Wreck / Iron">Wreck / Iron</option>
                <option value="Deep Trench / Mud">Deep Trench / Mud</option>
              </select>
            </div>

            <div>
              <label htmlFor={spotSpeciesId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Target Species (Comma separated)
              </label>
              <input
                id={spotSpeciesId}
                type="text"
                value={newSpecies}
                onChange={(e) => setNewSpecies(e.target.value)}
                placeholder="Snapper, Whiting, Squid, Gummy Shark"
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor={spotNotesId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1 text-xs">
              Fishing Notes & Strategy
            </label>
            <textarea
              id={spotNotesId}
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="e.g. Best on turn of tide with fresh calamari heads or pilchards..."
              className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 text-xs focus:border-sky-400 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white hover:bg-sky-500 transition active:scale-95 shadow-md shadow-sky-950"
            >
              Save Waypoint
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-800/60 bg-slate-900/80 p-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            id={searchInputId}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search spot name, species, seabed..."
            className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
          />
        </div>

        {/* Bay filter pills */}
        <div className="flex flex-wrap gap-1">
          {[
            { id: 'all', label: 'All Marks' },
            { id: 'port-phillip', label: 'Port Phillip' },
            { id: 'western-port', label: 'Western Port' },
            { id: 'custom', label: `My Custom (${customSpots.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setBayFilter(tab.id as typeof bayFilter)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                bayFilter === tab.id
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <label htmlFor={sortSelectId} className="hidden sm:inline">Sort:</label>
          <select
            id={sortSelectId}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white focus:outline-none"
          >
            <option value="distance">Nearest to Boat</option>
            <option value="name">Name (A-Z)</option>
            <option value="depth">Depth</option>
          </select>
        </div>
      </div>

      {/* Spots Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredSpots.map((spot) => {
          let distanceNM: number | null = null;
          let distanceKm: number | null = null;
          let bearingDeg: number | null = null;

          if (boatCoords) {
            distanceNM = calculateDistanceNM(boatCoords, spot);
            distanceKm = calculateDistanceKm(boatCoords, spot);
            bearingDeg = calculateBearing(boatCoords, spot);
          }

          return (
            <div
              key={spot.id}
              className={`flex flex-col justify-between rounded-2xl border p-4 shadow-lg transition hover:shadow-sky-950/50 ${
                spot.isUserCustom
                  ? 'border-pink-800/80 bg-slate-900/90'
                  : 'border-sky-800/70 bg-slate-900/90'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">
                      {spot.name}
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {spot.bay === 'port-phillip' ? 'Port Phillip Bay' : 'Western Port Bay'}
                      {spot.isUserCustom && ' • Custom Waypoint'}
                    </span>
                  </div>

                  <span className="shrink-0 rounded-md bg-slate-950 px-2 py-0.5 font-mono text-xs font-bold text-sky-300 border border-slate-800">
                    {spot.depthMeters}m
                  </span>
                </div>

                {/* Distance from boat */}
                {distanceNM !== null && bearingDeg !== null && (
                  <div className="mt-2 rounded-lg bg-sky-950/70 p-2 border border-sky-800 text-[11px] flex items-center justify-between">
                    <span className="text-sky-300 font-semibold flex items-center gap-1">
                      <Navigation className="h-3 w-3 text-cyan-400" />
                      {distanceNM.toFixed(2)} NM ({distanceKm?.toFixed(1)} km)
                    </span>
                    <span className="font-mono font-bold text-white">
                      Steer: {bearingDeg}° {bearingToCardinal(bearingDeg)}
                    </span>
                  </div>
                )}

                <div className="mt-2.5 flex flex-wrap gap-1 text-[11px]">
                  <span className="rounded bg-slate-950 px-2 py-0.5 text-cyan-300 border border-slate-800">
                    {spot.seabed}
                  </span>
                  <span className="rounded bg-slate-950 px-2 py-0.5 text-emerald-300 border border-slate-800">
                    {spot.targetSpecies.slice(0, 2).join(', ')}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-300 line-clamp-2">
                  {spot.notes}
                </p>

                {/* Coordinates */}
                <div className="mt-2.5 rounded bg-slate-950/80 p-1.5 font-mono text-[10px] text-slate-300 flex items-center justify-between">
                  <span>{formatDDM(spot.lat, spot.lng).full}</span>
                  <button
                    onClick={() => handleCopy(spot)}
                    className="text-slate-400 hover:text-white"
                    title="Copy coordinates"
                  >
                    {copiedId === spot.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onPlotSpot(spot)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 py-1.5 text-xs font-bold text-white hover:bg-sky-500 transition active:scale-95"
                >
                  <MapPin className="h-3.5 w-3.5" /> View on Chart
                </button>

                {spot.isUserCustom && (
                  <button
                    onClick={() => onDeleteSpot(spot.id)}
                    className="rounded-xl border border-rose-800 bg-rose-950/60 p-1.5 text-rose-300 hover:bg-rose-900 transition"
                    title="Delete custom spot"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
