/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useId } from 'react';
import { CatchLog, GPSCoordinate, BayRegion } from '../types/marine';
import { VICTORIAN_SPECIES_RULES } from '../data/victorianMarineData';
import { formatDDM } from '../utils/geoUtils';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Download, 
  Fish, 
  Scale, 
  Ruler, 
  Waves, 
  Moon, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  MapPin
} from 'lucide-react';

interface FishingLogManagerProps {
  catchLogs: CatchLog[];
  boatCoords: GPSCoordinate | null;
  onAddCatchLog: (log: CatchLog) => void;
  onDeleteCatchLog: (logId: string) => void;
}

export const FishingLogManager: React.FC<FishingLogManagerProps> = ({
  catchLogs,
  boatCoords,
  onAddCatchLog,
  onDeleteCatchLog,
}) => {
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);
  const [speciesFilter, setSpeciesFilter] = useState<string>('all');

  // Form states
  const [species, setSpecies] = useState<string>('Snapper (Pinkie / Big Red)');
  const [lengthCm, setLengthCm] = useState<string>('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [depthMeters, setDepthMeters] = useState<string>('14');
  const [locationName, setLocationName] = useState<string>('');
  const [bay, setBay] = useState<BayRegion>('port-phillip');
  const [baitOrLure, setBaitOrLure] = useState<string>('Fresh Calamari & Pilchard');
  const [tideState, setTideState] = useState<CatchLog['tideState']>('Run Up (Incoming)');
  const [moonPhase, setMoonPhase] = useState<CatchLog['moonPhase']>('New Moon');
  const [released, setReleased] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [includeGps, setIncludeGps] = useState<boolean>(true);

  const speciesSelectId = useId();
  const lengthInputId = useId();
  const weightInputId = useId();
  const depthInputId = useId();
  const baySelectId = useId();
  const locationInputId = useId();
  const baitInputId = useId();
  const tideSelectId = useId();
  const moonSelectId = useId();
  const releasedSelectId = useId();
  const notesInputId = useId();

  // Find relevant legal rule for selected species
  const matchedRule = VICTORIAN_SPECIES_RULES.find((r) =>
    species.toLowerCase().includes(r.commonName.toLowerCase().split(' ')[0])
  );

  const parsedLength = parseFloat(lengthCm);
  const isUndersized = matchedRule && matchedRule.minSizeCm && !isNaN(parsedLength)
    ? parsedLength < matchedRule.minSizeCm
    : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newLog: CatchLog = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      species,
      lengthCm: parsedLength || 0,
      weightKg: weightKg ? parseFloat(weightKg) : undefined,
      depthMeters: depthMeters ? parseFloat(depthMeters) : undefined,
      locationName: locationName.trim() || (bay === 'port-phillip' ? 'Port Phillip Mark' : 'Western Port Channel'),
      lat: includeGps && boatCoords ? boatCoords.lat : undefined,
      lng: includeGps && boatCoords ? boatCoords.lng : undefined,
      baitOrLure,
      tideState,
      moonPhase,
      bay,
      released,
      notes: notes.trim(),
    };

    onAddCatchLog(newLog);

    // Reset
    setLengthCm('');
    setWeightKg('');
    setNotes('');
    setIsAddingNew(false);
  };

  // Stats calculation
  const totalCatches = catchLogs.length;
  const releasedCount = catchLogs.filter((l) => l.released).length;
  const releaseRate = totalCatches > 0 ? Math.round((releasedCount / totalCatches) * 100) : 0;
  const longestFish = catchLogs.reduce((max, l) => (l.lengthCm > max ? l.lengthCm : max), 0);

  // Species counts
  const speciesCounts: Record<string, number> = {};
  catchLogs.forEach((l) => {
    speciesCounts[l.species] = (speciesCounts[l.species] || 0) + 1;
  });
  const topSpeciesEntry = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1])[0];

  const filteredLogs = catchLogs.filter((l) => {
    if (speciesFilter !== 'all' && l.species !== speciesFilter) return false;
    return true;
  });

  const exportCSV = () => {
    const headers = ['Date', 'Species', 'Length(cm)', 'Weight(kg)', 'Depth(m)', 'Bay', 'Location', 'Bait/Lure', 'Tide', 'Moon', 'Status', 'Notes'];
    const rows = catchLogs.map((l) => [
      new Date(l.timestamp).toLocaleDateString(),
      `"${l.species}"`,
      l.lengthCm,
      l.weightKg || '',
      l.depthMeters || '',
      l.bay,
      `"${l.locationName}"`,
      `"${l.baitOrLure}"`,
      l.tideState,
      l.moonPhase,
      l.released ? 'Released' : 'Kept',
      `"${l.notes || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Vic_Fishing_CatchLog_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 text-slate-100">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-sky-400" />
            Vessel Fishing Log & Catches
          </h2>
          <p className="text-xs text-sky-200">
            Record catches, real depths, GPS tags, and track legal size limits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddingNew(!isAddingNew)}
            className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-sky-500 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{isAddingNew ? 'Cancel' : 'Log New Catch'}</span>
          </button>

          {catchLogs.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-1 rounded-xl border border-sky-700 bg-sky-950/80 px-3 py-2 text-xs font-bold text-sky-200 hover:bg-sky-900 transition"
              title="Export Catch Log to CSV"
            >
              <Download className="h-4 w-4 text-sky-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Catch Stats Strip */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-sky-800/60 bg-slate-900/80 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Fish Logged</div>
          <div className="mt-1 font-mono text-2xl font-black text-white">{totalCatches}</div>
        </div>
        <div className="rounded-xl border border-sky-800/60 bg-slate-900/80 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Longest Catch</div>
          <div className="mt-1 font-mono text-2xl font-black text-cyan-300">
            {longestFish > 0 ? `${longestFish} cm` : '---'}
          </div>
        </div>
        <div className="rounded-xl border border-sky-800/60 bg-slate-900/80 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Release Rate</div>
          <div className="mt-1 font-mono text-2xl font-black text-emerald-300">{releaseRate}%</div>
        </div>
        <div className="rounded-xl border border-sky-800/60 bg-slate-900/80 p-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Top Species</div>
          <div className="mt-1 text-sm font-bold text-amber-200 truncate">
            {topSpeciesEntry ? topSpeciesEntry[0].split(' ')[0] : 'None'}
          </div>
        </div>
      </div>

      {/* Add New Catch Form */}
      {isAddingNew && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-sky-600/70 bg-slate-900/95 p-5 shadow-2xl space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-sky-800 pb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-400" />
              Record Marine Catch
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Species */}
            <div>
              <label htmlFor={speciesSelectId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Species *
              </label>
              <select
                id={speciesSelectId}
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
              >
                <option value="Snapper (Pinkie / Big Red)">Snapper (Chrysophrys auratus)</option>
                <option value="King George Whiting">King George Whiting</option>
                <option value="Southern Calamari / Squid">Southern Calamari / Squid</option>
                <option value="Gummy Shark">Gummy Shark</option>
                <option value="Flathead (Sand / Tiger)">Flathead (Sand / Tiger)</option>
                <option value="Yellowtail Kingfish">Yellowtail Kingfish</option>
                <option value="Elephant Fish">Elephant Fish</option>
                <option value="Australian Salmon">Australian Salmon</option>
                <option value="Silver Trevally">Silver Trevally</option>
                <option value="Garfish">Southern Sea Garfish</option>
                <option value="Other Species">Other Species</option>
              </select>
            </div>

            {/* Length */}
            <div>
              <label htmlFor={lengthInputId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Length (cm) *
              </label>
              <input
                id={lengthInputId}
                type="number"
                step="0.5"
                required
                value={lengthCm}
                onChange={(e) => setLengthCm(e.target.value)}
                placeholder="e.g. 42.5"
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 font-mono focus:border-sky-400 focus:outline-none"
              />
            </div>

            {/* Weight */}
            <div>
              <label htmlFor={weightInputId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Weight (kg) (Optional)
              </label>
              <input
                id={weightInputId}
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 2.4"
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 font-mono focus:border-sky-400 focus:outline-none"
              />
            </div>

            {/* Depth */}
            <div>
              <label htmlFor={depthInputId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Water Depth (Meters)
              </label>
              <input
                id={depthInputId}
                type="number"
                step="0.5"
                value={depthMeters}
                onChange={(e) => setDepthMeters(e.target.value)}
                placeholder="14"
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 font-mono focus:border-sky-400 focus:outline-none"
              />
            </div>

            {/* Bay */}
            <div>
              <label htmlFor={baySelectId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Bay Region
              </label>
              <select
                id={baySelectId}
                value={bay}
                onChange={(e) => setBay(e.target.value as BayRegion)}
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
              >
                <option value="port-phillip">Port Phillip Bay</option>
                <option value="western-port">Western Port Bay</option>
                <option value="bass-strait">Bass Strait (Offshore)</option>
              </select>
            </div>

            {/* Location Label */}
            <div>
              <label htmlFor={locationInputId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Spot / Mark Name
              </label>
              <input
                id={locationInputId}
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Carrum 14m, Tortoise Head"
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>

            {/* Bait / Lure */}
            <div>
              <label htmlFor={baitInputId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Bait or Lure
              </label>
              <input
                id={baitInputId}
                type="text"
                value={baitOrLure}
                onChange={(e) => setBaitOrLure(e.target.value)}
                placeholder="e.g. Silver whiting, Pilchard, Squid jig"
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </div>

            {/* Tide */}
            <div>
              <label htmlFor={tideSelectId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Tide Stage
              </label>
              <select
                id={tideSelectId}
                value={tideState}
                onChange={(e) => setTideState(e.target.value as CatchLog['tideState'])}
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
              >
                <option value="Run Up (Incoming)">Run Up (Incoming / Flood)</option>
                <option value="High">High Slack Water</option>
                <option value="Run Down (Outgoing)">Run Down (Outgoing / Ebb)</option>
                <option value="Low">Low Slack Water</option>
                <option value="Slack">Slack Water Change</option>
              </select>
            </div>

            {/* Moon Phase */}
            <div>
              <label htmlFor={moonSelectId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Moon Phase
              </label>
              <select
                id={moonSelectId}
                value={moonPhase}
                onChange={(e) => setMoonPhase(e.target.value as CatchLog['moonPhase'])}
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
              >
                <option value="New Moon">New Moon (Dark nights / Spring tide)</option>
                <option value="First Quarter">First Quarter (Neap tides)</option>
                <option value="Full Moon">Full Moon (Bright / High tides)</option>
                <option value="Last Quarter">Last Quarter</option>
              </select>
            </div>

            {/* Status (Kept vs Released) */}
            <div>
              <label htmlFor={releasedSelectId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Outcome
              </label>
              <select
                id={releasedSelectId}
                value={released ? 'released' : 'kept'}
                onChange={(e) => setReleased(e.target.value === 'released')}
                className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white focus:border-sky-400 focus:outline-none"
              >
                <option value="kept">Kept for Table (Legal Size)</option>
                <option value="released">Released / Sport</option>
              </select>
            </div>
          </div>

          {/* Legal Limit Compliance Banner */}
          {matchedRule && (
            <div
              className={`rounded-xl border p-3 text-xs ${
                isUndersized
                  ? 'border-rose-600 bg-rose-950/60 text-rose-200'
                  : 'border-emerald-600/60 bg-emerald-950/40 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold">
                {isUndersized ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    <span>⚠️ UNDERSIZED WARNING: Victorian legal minimum length is {matchedRule.minSizeCm} cm!</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Victorian Legal Regulation: {matchedRule.minSizeCm ? `Min length ${matchedRule.minSizeCm} cm` : 'No min length'} • Bag limit: {matchedRule.bagLimit}</span>
                  </>
                )}
              </div>
              <p className="mt-1 text-[11px] opacity-90">{matchedRule.notes}</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor={notesInputId} className="block font-bold text-slate-300 uppercase tracking-wider mb-1 text-xs">
              Catch Notes (Water clarity, bite time, rig details)
            </label>
            <textarea
              id={notesInputId}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Aggressive bite right on the turn of tide, taken on running sinker with 30lb fluorocarbon leader..."
              className="w-full rounded-xl border border-sky-800 bg-slate-950 px-3 py-2 text-white placeholder-slate-500 text-xs focus:border-sky-400 focus:outline-none"
            />
          </div>

          {/* GPS tag toggle */}
          {boatCoords && (
            <label className="flex items-center gap-2 text-xs text-sky-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeGps}
                onChange={(e) => setIncludeGps(e.target.checked)}
                className="rounded accent-sky-500"
              />
              <span>Attach Vessel GPS Coordinates: {formatDDM(boatCoords.lat, boatCoords.lng).full}</span>
            </label>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
              Save Catch Log
            </button>
          </div>
        </form>
      )}

      {/* Catches List */}
      <div className="space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="rounded-2xl border border-sky-800/60 bg-slate-900/60 p-8 text-center text-slate-400">
            <Fish className="mx-auto h-8 w-8 text-sky-400/60 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No catches logged yet</p>
            <p className="text-xs text-slate-500 mt-1">Tap "Log New Catch" to record your fish while on the water!</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-sky-800/60 bg-slate-900/90 p-4 shadow-md hover:border-sky-500 transition"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-sky-950 p-2.5 text-sky-400 border border-sky-800">
                  <Fish className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-black text-white">{log.species}</h4>
                    <span className="font-mono text-xs font-extrabold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      {log.lengthCm} cm {log.weightKg ? `• ${log.weightKg} kg` : ''}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        log.released
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-sky-950 text-sky-300 border border-sky-700'
                      }`}
                    >
                      {log.released ? 'Released' : 'Kept'}
                    </span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="font-semibold text-sky-300">{log.locationName}</span>
                    <span>•</span>
                    <span>Depth: {log.depthMeters ?? 12}m</span>
                    <span>•</span>
                    <span>Bait: {log.baitOrLure}</span>
                    <span>•</span>
                    <span>Tide: {log.tideState}</span>
                  </div>

                  {log.notes && (
                    <p className="mt-1.5 text-xs text-slate-400 italic">
                      "{log.notes}"
                    </p>
                  )}

                  {log.lat && log.lng && (
                    <div className="mt-1 font-mono text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-sky-400" />
                      {formatDDM(log.lat, log.lng).full}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-[11px] text-slate-400">
                  {new Date(log.timestamp).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onDeleteCatchLog(log.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Delete log entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
