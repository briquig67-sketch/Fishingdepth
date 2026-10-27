/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useBoatGPS, SIMULATED_START_POINTS } from './hooks/useBoatGPS';
import { FishingSpot, CatchLog, GPSCoordinate } from './types/marine';
import { VICTORIAN_FISHING_SPOTS } from './data/victorianMarineData';
import { Header } from './components/Header';
import { NavigationHUD } from './components/NavigationHUD';
import { EnterCoordinatesModal } from './components/EnterCoordinatesModal';
import { MarineDepthMap } from './components/MarineDepthMap';
import { PortPhillipGuide } from './components/PortPhillipGuide';
import { WesternPortGuide } from './components/WesternPortGuide';
import { SavedSpotsManager } from './components/SavedSpotsManager';
import { FishingLogManager } from './components/FishingLogManager';
import { VicFishingRulesModal } from './components/VicFishingRulesModal';
import { SimulateLocationModal } from './components/SimulateLocationModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { 
  Navigation, 
  Compass, 
  Map as MapIcon, 
  Ship, 
  Waves, 
  Bookmark, 
  BookOpen, 
  ShieldCheck, 
  Maximize2,
  ChevronRight,
  Anchor,
  Radio,
  Sparkles
} from 'lucide-react';

export type ActiveTab = 
  | 'gps-position'
  | 'enter-coordinates'
  | 'depth-map'
  | 'port-phillip'
  | 'western-port'
  | 'saved-spots'
  | 'fishing-log';

const LOCAL_STORAGE_SPOTS_KEY = 'vic_boat_guide_custom_spots_v1';
const LOCAL_STORAGE_LOGS_KEY = 'vic_boat_guide_catch_logs_v1';

export default function App() {
  const { gpsState, setSimulatedLocation, useLiveGPS, toggleAnchorAlarm } = useBoatGPS();

  const [activeTab, setActiveTab] = useState<ActiveTab>('depth-map');
  const [displayMode, setDisplayMode] = useState<'day' | 'night' | 'sun'>('day');
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);

  // Focus coordinate on map
  const [mapFocusCoords, setMapFocusCoords] = useState<GPSCoordinate | null>(null);

  // Custom User Spots
  const [customSpots, setCustomSpots] = useState<FishingSpot[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SPOTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Catch Logs
  const [catchLogs, setCatchLogs] = useState<CatchLog[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    // Seed with two authentic demonstration catches
    return [
      {
        id: 'seed-catch-1',
        timestamp: Date.now() - 86400000 * 2,
        species: 'Snapper (Chrysophrys auratus)',
        lengthCm: 68.5,
        weightKg: 4.8,
        depthMeters: 15.5,
        locationName: 'Fawkner Beacon Mud Ground',
        lat: -37.9480,
        lng: 144.9270,
        baitOrLure: 'Whole fresh Californian squid & pilchard head',
        tideState: 'Run Up (Incoming)',
        moonPhase: 'New Moon',
        bay: 'port-phillip',
        released: false,
        notes: 'Screamer run at 05:45am right on slack high water. Hard fight on 20lb leader.',
      },
      {
        id: 'seed-catch-2',
        timestamp: Date.now() - 86400000 * 5,
        species: 'King George Whiting',
        lengthCm: 43.0,
        weightKg: 0.75,
        depthMeters: 4.8,
        locationName: 'Middle Spit Whiting Channel',
        lat: -38.3667,
        lng: 145.3083,
        baitOrLure: 'Tender calamari sliver & pipi cocktail',
        tideState: 'Run Up (Incoming)',
        moonPhase: 'First Quarter',
        bay: 'western-port',
        released: false,
        notes: 'Pothole on edge of ribbon weed. Pipi bait caught 12 fish in 40 minutes.',
      },
    ];
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SPOTS_KEY, JSON.stringify(customSpots));
    } catch {
      // localStorage error
    }
  }, [customSpots]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(catchLogs));
    } catch {
      // localStorage error
    }
  }, [catchLogs]);

  // Handler: Add Custom Spot
  const handleAddSpot = (spot: FishingSpot) => {
    setCustomSpots((prev) => [spot, ...prev]);
  };

  // Handler: Delete Custom Spot
  const handleDeleteSpot = (id: string) => {
    setCustomSpots((prev) => prev.filter((s) => s.id !== id));
  };

  // Handler: Add Catch Log
  const handleAddCatchLog = (log: CatchLog) => {
    setCatchLogs((prev) => [log, ...prev]);
  };

  // Handler: Delete Catch Log
  const handleDeleteCatchLog = (id: string) => {
    setCatchLogs((prev) => prev.filter((l) => l.id !== id));
  };

  // Handler: Plot Spot / Coordinates on Map
  const handlePlotOnMap = (coord: GPSCoordinate) => {
    setMapFocusCoords({ lat: coord.lat, lng: coord.lng });
    setActiveTab('depth-map');
  };

  const handleSaveClickedCoordAsSpot = (coord: GPSCoordinate, depthEst?: number) => {
    const newSpot: FishingSpot = {
      id: `spot-clicked-${Date.now()}`,
      name: `Mark @ ${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`,
      bay: coord.lng < 145.1 ? 'port-phillip' : 'western-port',
      lat: coord.lat,
      lng: coord.lng,
      depthMeters: depthEst || 12,
      seabed: 'Sand / Grit',
      targetSpecies: ['Snapper', 'Flathead'],
      bestTide: 'Tide change',
      bestSeason: 'Spring / Summer',
      notes: 'Plotted directly from marine depth sounder map',
      isUserCustom: true,
    };
    handleAddSpot(newSpot);
    setActiveTab('saved-spots');
  };

  // Theme styling based on display mode
  const getThemeContainerClass = () => {
    if (displayMode === 'night') {
      return 'night-red-mode bg-[#0a0204] text-rose-100 min-h-screen';
    }
    if (displayMode === 'sun') {
      return 'sun-glare-mode bg-slate-900 text-amber-50 min-h-screen';
    }
    return 'day-marine-mode bg-[#061224] text-slate-100 min-h-screen';
  };

  // Nav Items array matching the home screen requirements
  const navItems: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'depth-map', label: 'Marine Depth Map', icon: MapIcon },
    { id: 'gps-position', label: 'My GPS Position', icon: Navigation },
    { id: 'enter-coordinates', label: 'Enter Coordinates', icon: Compass },
    { id: 'port-phillip', label: 'Port Phillip Bay', icon: Ship },
    { id: 'western-port', label: 'Western Port Bay', icon: Waves },
    { id: 'saved-spots', label: 'Saved Fishing Spots', icon: Bookmark },
    { id: 'fishing-log', label: 'Fishing Log', icon: BookOpen },
  ];

  return (
    <div className={getThemeContainerClass()}>
      {/* Top Application Header */}
      <Header
        gpsState={gpsState}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenSimulateModal={() => setIsSimulateModalOpen(true)}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-3 py-3 sm:px-6 sm:py-5 space-y-4">
        {/* Navigation Tabs Bar (Optimized for Android Tablet Boating & Touch) */}
        <div className="flex overflow-x-auto pb-1 scrollbar-none gap-1.5 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-lg shadow-sky-950/80 border border-sky-400/40'
                    : 'bg-slate-900/90 text-sky-200/80 border border-sky-900/60 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-sky-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Marine Depth Map */}
        {activeTab === 'depth-map' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl flex items-center gap-2">
                  <MapIcon className="h-6 w-6 text-sky-400" />
                  Marine Depth Chart & Bathymetry
                </h2>
                <p className="text-xs text-sky-200">
                  Genuine surveyed depth soundings, contours (5m, 10m, 15m, 20m), seamarks and fishing marks
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('enter-coordinates')}
                  className="rounded-xl border border-sky-700 bg-sky-950/80 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-900 transition flex items-center gap-1.5"
                >
                  <Compass className="h-3.5 w-3.5 text-sky-400" /> Enter Coords
                </button>
                <button
                  onClick={() => setActiveTab('gps-position')}
                  className="rounded-xl border border-sky-700 bg-sky-950/80 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-900 transition flex items-center gap-1.5"
                >
                  <Navigation className="h-3.5 w-3.5 text-emerald-400" /> Vessel HUD
                </button>
              </div>
            </div>

            {/* Interactive Leaflet Depth Map */}
            <MarineDepthMap
              boatCoords={gpsState.coords}
              boatHeading={gpsState.heading}
              boatSpeedKnots={gpsState.speedKnots}
              customSpots={customSpots}
              focusCoords={mapFocusCoords}
              onSaveClickedCoord={handleSaveClickedCoordAsSpot}
              onSelectSpot={(spot) => {
                setMapFocusCoords({ lat: spot.lat, lng: spot.lng });
              }}
            />

            {/* Quick Cockpit Bar underneath map */}
            <NavigationHUD
              gpsState={gpsState}
              onSetSimulatedLocation={setSimulatedLocation}
              onUseLiveGPS={useLiveGPS}
              onToggleAnchorWatch={toggleAnchorAlarm}
              onNavigateToSpot={(spotId) => {
                const sp = [...VICTORIAN_FISHING_SPOTS, ...customSpots].find((s) => s.id === spotId);
                if (sp) handlePlotOnMap({ lat: sp.lat, lng: sp.lng });
              }}
              onPlotCoordinates={handlePlotOnMap}
            />
          </div>
        )}

        {/* Tab 2: My GPS Position */}
        {activeTab === 'gps-position' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl flex items-center gap-2">
                  <Navigation className="h-6 w-6 text-sky-400" />
                  My GPS Position & Navigation HUD
                </h2>
                <p className="text-xs text-sky-200">
                  Live SOG speed over ground, COG bearing, maritime DDM coords, anchor watch drift alarm
                </p>
              </div>

              <button
                onClick={() => setIsSimulateModalOpen(true)}
                className="rounded-xl border border-sky-700 bg-sky-950/80 px-3 py-1.5 text-xs font-semibold text-sky-200 hover:bg-sky-900 transition flex items-center gap-1.5"
              >
                <Radio className="h-3.5 w-3.5 text-sky-400" /> GPS Mode & Simulation
              </button>
            </div>

            <NavigationHUD
              gpsState={gpsState}
              onSetSimulatedLocation={setSimulatedLocation}
              onUseLiveGPS={useLiveGPS}
              onToggleAnchorWatch={toggleAnchorAlarm}
              onNavigateToSpot={(spotId) => {
                const sp = [...VICTORIAN_FISHING_SPOTS, ...customSpots].find((s) => s.id === spotId);
                if (sp) handlePlotOnMap({ lat: sp.lat, lng: sp.lng });
              }}
              onPlotCoordinates={handlePlotOnMap}
            />

            {/* In-depth Position Details Card */}
            <div className="rounded-2xl border border-sky-800/60 bg-slate-900/90 p-5 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-sky-300">
                Maritime VHF & Emergency Navigation Report
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                If hailing Marine Rescue Victoria or another vessel via VHF Ch 16, state:
              </p>
              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 font-mono text-xs sm:text-sm text-sky-300 space-y-1">
                <div>"Vessel position: <strong>{gpsState.coords ? `${gpsState.coords.lat >= 0 ? 'North' : 'South'} ${Math.abs(gpsState.coords.lat).toFixed(4)} degrees, East ${gpsState.coords.lng.toFixed(4)} degrees` : 'Acquiring GPS...'}</strong>"</div>
                <div>"Speed Over Ground: <strong>{gpsState.speedKnots.toFixed(1)} knots</strong> • Heading: <strong>{gpsState.heading ?? '---'} degrees</strong>"</div>
                <div>"Fix Accuracy: <strong>±{gpsState.accuracy ?? 5} meters</strong>"</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Enter Coordinates */}
        {activeTab === 'enter-coordinates' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-white sm:text-2xl flex items-center gap-2">
                <Compass className="h-6 w-6 text-sky-400" />
                Enter Coordinates & Waypoint Plotter
              </h2>
              <p className="text-xs text-sky-200">
                Convert between formats, calculate distance and magnetic bearing from boat position
              </p>
            </div>

            <EnterCoordinatesModal
              currentBoatPosition={gpsState.coords}
              onPlotOnMap={(coord) => handlePlotOnMap(coord)}
              onSaveAsSpot={(coord, name) => {
                const newSpot: FishingSpot = {
                  id: `spot-${Date.now()}`,
                  name: name || `Waypoint @ ${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`,
                  bay: coord.lng < 145.1 ? 'port-phillip' : 'western-port',
                  lat: coord.lat,
                  lng: coord.lng,
                  depthMeters: 12,
                  seabed: 'Sand / Grit',
                  targetSpecies: ['Snapper', 'Flathead'],
                  bestTide: 'Tide change',
                  bestSeason: 'Spring / Summer',
                  notes: 'Entered manually via Coordinate Plotter',
                  isUserCustom: true,
                };
                handleAddSpot(newSpot);
                setActiveTab('saved-spots');
              }}
            />
          </div>
        )}

        {/* Tab 4: Port Phillip Bay Area Guide */}
        {activeTab === 'port-phillip' && (
          <PortPhillipGuide
            onPlotSpot={(spot) => handlePlotOnMap({ lat: spot.lat, lng: spot.lng })}
            onNavigateToSpot={(spot) => handlePlotOnMap({ lat: spot.lat, lng: spot.lng })}
          />
        )}

        {/* Tab 5: Western Port Bay Area Guide */}
        {activeTab === 'western-port' && (
          <WesternPortGuide
            onPlotSpot={(spot) => handlePlotOnMap({ lat: spot.lat, lng: spot.lng })}
            onNavigateToSpot={(spot) => handlePlotOnMap({ lat: spot.lat, lng: spot.lng })}
          />
        )}

        {/* Tab 6: Saved Fishing Spots */}
        {activeTab === 'saved-spots' && (
          <SavedSpotsManager
            customSpots={customSpots}
            defaultSpots={VICTORIAN_FISHING_SPOTS}
            boatCoords={gpsState.coords}
            onAddSpot={handleAddSpot}
            onDeleteSpot={handleDeleteSpot}
            onPlotSpot={(spot) => handlePlotOnMap({ lat: spot.lat, lng: spot.lng })}
          />
        )}

        {/* Tab 7: Fishing Log */}
        {activeTab === 'fishing-log' && (
          <FishingLogManager
            catchLogs={catchLogs}
            boatCoords={gpsState.coords}
            onAddCatchLog={handleAddCatchLog}
            onDeleteCatchLog={handleDeleteCatchLog}
          />
        )}
      </main>

      {/* Modals */}
      <VicFishingRulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <SimulateLocationModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        gpsState={gpsState}
        onSelectPoint={setSimulatedLocation}
        onUseLiveGPS={useLiveGPS}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
