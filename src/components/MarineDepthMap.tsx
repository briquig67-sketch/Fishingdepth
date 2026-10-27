/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { GPSCoordinate, FishingSpot, BoatRamp, MarineParkZone, SoundingPoint } from '../types/marine';
import { formatDDM, calculateDistanceNM, calculateBearing, bearingToCardinal } from '../utils/geoUtils';
import { VICTORIAN_FISHING_SPOTS, VICTORIAN_NAVIGATION_MARKS, VICTORIAN_BOAT_RAMPS, VICTORIAN_MARINE_PARKS } from '../data/victorianMarineData';
import { CHARTED_SOUNDINGS, DEPTH_CONTOUR_LINES } from '../data/bathymetryData';
import { 
  Layers, 
  Crosshair, 
  MapPin, 
  Maximize2, 
  Minimize2, 
  Info, 
  Ship, 
  Anchor, 
  Eye, 
  EyeOff,
  Navigation2
} from 'lucide-react';

interface MarineDepthMapProps {
  boatCoords: GPSCoordinate | null;
  boatHeading: number | null;
  boatSpeedKnots: number;
  customSpots?: FishingSpot[];
  focusCoords?: GPSCoordinate | null;
  onSelectSpot?: (spot: FishingSpot) => void;
  onSaveClickedCoord?: (coord: GPSCoordinate, depthEst?: number) => void;
  className?: string;
}

export const MarineDepthMap: React.FC<MarineDepthMapProps> = ({
  boatCoords,
  boatHeading,
  boatSpeedKnots,
  customSpots = [],
  focusCoords,
  onSelectSpot,
  onSaveClickedCoord,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const boatLayerRef = useRef<L.LayerGroup | null>(null);
  const focusLayerRef = useRef<L.LayerGroup | null>(null);
  const contoursLayerRef = useRef<L.LayerGroup | null>(null);
  const soundingsLayerRef = useRef<L.LayerGroup | null>(null);
  const spotsLayerRef = useRef<L.LayerGroup | null>(null);
  const rampsLayerRef = useRef<L.LayerGroup | null>(null);
  const parksLayerRef = useRef<L.LayerGroup | null>(null);
  const seamarksLayerRef = useRef<L.TileLayer | null>(null);

  // Layer Visibility State
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showSoundings, setShowSoundings] = useState<boolean>(true);
  const [showFishingSpots, setShowFishingSpots] = useState<boolean>(true);
  const [showRamps, setShowRamps] = useState<boolean>(true);
  const [showMarineParks, setShowMarineParks] = useState<boolean>(true);
  const [showSeaMarks, setShowSeaMarks] = useState<boolean>(true);
  const [baseMapType, setBaseMapType] = useState<'ocean' | 'voyager' | 'satellite'>('ocean');

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [clickedWaterPoint, setClickedWaterPoint] = useState<{ coord: GPSCoordinate; depthEst: number; seabedEst: string } | null>(null);
  const [controlsOpen, setControlsOpen] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center between Port Phillip and Western Port: approx -38.20, 145.05
    const map = L.map(mapContainerRef.current, {
      center: [-38.22, 145.02],
      zoom: 10,
      minZoom: 8,
      maxZoom: 18,
      zoomControl: false,
    });

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial Base Layer
    const baseLayers: Record<string, L.TileLayer> = {
      ocean: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri, GEBCO, NOAA, National Geographic',
        maxZoom: 16,
      }),
      voyager: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO, OpenStreetMap contributors',
        maxZoom: 19,
      }),
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 18,
      }),
    };

    baseLayers.ocean.addTo(map);

    // OpenSeaMap nautical seamarks overlay
    const seamarks = L.tileLayer('https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenSeaMap contributors',
      maxZoom: 18,
      opacity: 0.9,
    });
    seamarks.addTo(map);
    seamarksLayerRef.current = seamarks;

    // Initialize Layer Groups
    boatLayerRef.current = L.layerGroup().addTo(map);
    focusLayerRef.current = L.layerGroup().addTo(map);
    contoursLayerRef.current = L.layerGroup().addTo(map);
    soundingsLayerRef.current = L.layerGroup().addTo(map);
    spotsLayerRef.current = L.layerGroup().addTo(map);
    rampsLayerRef.current = L.layerGroup().addTo(map);
    parksLayerRef.current = L.layerGroup().addTo(map);

    // Click handler on map: inspect depth & coordinates
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickCoord: GPSCoordinate = { lat: e.latlng.lat, lng: e.latlng.lng };

      // Find nearest charted sounding to estimate depth
      let closestSounding: SoundingPoint | null = null;
      let minDistance = Infinity;
      for (const s of CHARTED_SOUNDINGS) {
        const d = calculateDistanceNM(clickCoord, s);
        if (d < minDistance) {
          minDistance = d;
          closestSounding = s;
        }
      }

      const estDepth = closestSounding ? closestSounding.depthMeters : 12;
      const estSeabed = closestSounding ? closestSounding.seabed : 'Sand / Grit';

      setClickedWaterPoint({
        coord: clickCoord,
        depthEst: estDepth,
        seabedEst: estSeabed,
      });

      // Show temporary popup
      L.popup({ offset: [0, -10], className: 'custom-marine-popup' })
        .setLatLng(e.latlng)
        .setContent(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; color: #0f172a; min-width: 170px;">
            <div style="font-weight: 800; color: #0284c7; margin-bottom: 2px;">📍 CHART INSPECTOR</div>
            <div><strong>Lat/Lng:</strong> ${clickCoord.lat.toFixed(4)}, ${clickCoord.lng.toFixed(4)}</div>
            <div><strong>Maritime:</strong> ${formatDDM(clickCoord.lat, clickCoord.lng).full}</div>
            <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #cbd5e1;">
              <strong>Estimated Depth:</strong> <span style="color: #0369a1; font-weight: bold;">~${estDepth}m</span><br/>
              <strong>Seabed:</strong> ${estSeabed}
            </div>
          </div>
        `)
        .openOn(map);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer && layer !== seamarksLayerRef.current) {
        map.removeLayer(layer);
      }
    });

    let newBase: L.TileLayer;
    if (baseMapType === 'voyager') {
      newBase = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CARTO, OpenStreetMap',
        maxZoom: 19,
      });
    } else if (baseMapType === 'satellite') {
      newBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri, Maxar',
        maxZoom: 18,
      });
    } else {
      newBase = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri, GEBCO, NOAA',
        maxZoom: 16,
      });
    }
    newBase.addTo(map);

    // Keep seamarks on top
    if (showSeaMarks && seamarksLayerRef.current) {
      seamarksLayerRef.current.bringToFront();
    }
  }, [baseMapType, showSeaMarks]);

  // Toggle OpenSeaMap Seamarks
  useEffect(() => {
    const map = mapInstanceRef.current;
    const seamarks = seamarksLayerRef.current;
    if (!map || !seamarks) return;

    if (showSeaMarks) {
      if (!map.hasLayer(seamarks)) {
        seamarks.addTo(map);
      }
      seamarks.bringToFront();
    } else {
      if (map.hasLayer(seamarks)) {
        map.removeLayer(seamarks);
      }
    }
  }, [showSeaMarks]);

  // Render Depth Contours
  useEffect(() => {
    const group = contoursLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showContours) return;

    DEPTH_CONTOUR_LINES.forEach((contour) => {
      const polyline = L.polyline(contour.points, {
        color: contour.color,
        weight: contour.weight,
        dashArray: contour.dashArray,
        opacity: 0.85,
      });

      polyline.bindTooltip(
        `<span style="font-weight: 800; font-family: monospace;">${contour.depthMeters}m</span> CONTOUR`,
        { permanent: false, sticky: true, className: 'contour-tooltip' }
      );

      group.addLayer(polyline);
    });
  }, [showContours]);

  // Render Charted Soundings (Spot Depths)
  useEffect(() => {
    const group = soundingsLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showSoundings) return;

    CHARTED_SOUNDINGS.forEach((s) => {
      // Create depth number badge
      const depthBadgeHtml = `
        <div style="
          background: rgba(10, 25, 47, 0.88);
          border: 1px solid #38bdf8;
          border-radius: 4px;
          color: #38bdf8;
          font-family: monospace;
          font-size: 10px;
          font-weight: 900;
          padding: 1px 4px;
          text-align: center;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.5);
        ">
          ${s.depthMeters.toFixed(1)}m
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'sounding-depth-icon',
        html: depthBadgeHtml,
        iconSize: [42, 18],
        iconAnchor: [21, 9],
      });

      const marker = L.marker([s.lat, s.lng], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; min-width: 160px;">
          <div style="font-weight: 800; color: #0284c7;">⚓ SOUNDING: ${s.depthMeters} METERS</div>
          <div style="font-weight: 600; color: #0f172a; margin-top: 2px;">${s.locationName}</div>
          <div style="margin-top: 4px; font-size: 11px; color: #475569;">
            <strong>Seabed Type:</strong> ${s.seabed}<br/>
            <strong>GPS:</strong> ${formatDDM(s.lat, s.lng).full}
          </div>
        </div>
      `);

      group.addLayer(marker);
    });
  }, [showSoundings]);

  // Render Fishing Spots (Default + Custom)
  useEffect(() => {
    const group = spotsLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showFishingSpots) return;

    const allSpots = [...VICTORIAN_FISHING_SPOTS, ...customSpots];

    allSpots.forEach((spot) => {
      const isCustom = spot.isUserCustom;
      const spotHtml = `
        <div style="
          background: ${isCustom ? '#ec4899' : '#0284c7'};
          border: 2px solid #ffffff;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.6);
        ">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z"/>
            <path d="M18 12v.5"/>
            <path d="M16 17.93a1 1 0 0 1-1.66.73l-4.66-3.88a2 2 0 0 0-1.34-.53H4a2 2 0 0 1-2-2V9.75a2 2 0 0 1 2-2h4.34a2 2 0 0 0 1.34-.53l4.66-3.88A1 1 0 0 1 16 4.07V18Z"/>
          </svg>
        </div>
      `;

      const icon = L.divIcon({
        className: 'fishing-spot-marker',
        html: spotHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon });

      let distanceText = '';
      if (boatCoords) {
        const dist = calculateDistanceNM(boatCoords, spot);
        const brg = calculateBearing(boatCoords, spot);
        distanceText = `<div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0; color: #0284c7; font-weight: 700;">
          From Boat: ${dist.toFixed(2)} NM (${(dist * 1.852).toFixed(1)} km) • Steer ${brg}° ${bearingToCardinal(brg)}
        </div>`;
      }

      marker.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; min-width: 200px; color: #0f172a;">
          <div style="font-weight: 800; color: #0284c7; font-size: 13px;">${spot.name}</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
            ${spot.bay === 'port-phillip' ? 'Port Phillip Bay' : 'Western Port Bay'} • <strong>Depth: ${spot.depthMeters}m</strong>
          </div>
          <div style="margin-top: 4px;">
            <strong>Seabed:</strong> ${spot.seabed}<br/>
            <strong>Target:</strong> ${spot.targetSpecies.join(', ')}<br/>
            <strong>Best Tide:</strong> ${spot.bestTide}<br/>
            <strong>Notes:</strong> ${spot.notes}
          </div>
          ${distanceText}
        </div>
      `);

      if (onSelectSpot) {
        marker.on('click', () => onSelectSpot(spot));
      }

      group.addLayer(marker);
    });
  }, [showFishingSpots, customSpots, boatCoords, onSelectSpot]);

  // Render Victorian Boat Ramps
  useEffect(() => {
    const group = rampsLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showRamps) return;

    VICTORIAN_BOAT_RAMPS.forEach((ramp) => {
      const rampHtml = `
        <div style="
          background: #0f766e;
          border: 2px solid #ffffff;
          border-radius: 4px;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: bold;
          font-size: 11px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.5);
        ">
          ⚓
        </div>
      `;

      const icon = L.divIcon({
        className: 'boat-ramp-icon',
        html: rampHtml,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([ramp.lat, ramp.lng], { icon });
      marker.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; min-width: 190px; color: #0f172a;">
          <div style="font-weight: 800; color: #0f766e;">🚤 ${ramp.name}</div>
          <div style="margin-top: 3px; font-size: 11px;">
            <strong>Lanes:</strong> ${ramp.lanes} • <strong>Pontoon:</strong> ${ramp.pontoon ? 'Yes' : 'No'}<br/>
            <strong>Fish Cleaning:</strong> ${ramp.fishCleaningTable ? 'Yes' : 'No'}<br/>
            <strong>Parking:</strong> ~${ramp.parkingBays} bays<br/>
            <strong>Tides:</strong> ${ramp.suitableTides}
          </div>
        </div>
      `);

      group.addLayer(marker);
    });
  }, [showRamps]);

  // Render Marine National Parks (NO TAKE SANCTUARY ZONES)
  useEffect(() => {
    const group = parksLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showMarineParks) return;

    VICTORIAN_MARINE_PARKS.forEach((park) => {
      const polygon = L.polygon(park.polygon, {
        color: '#e11d48',
        fillColor: '#f43f5e',
        fillOpacity: 0.25,
        weight: 2,
        dashArray: '6,4',
      });

      polygon.bindPopup(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; min-width: 190px; color: #9f1239;">
          <div style="font-weight: 900; font-size: 13px;">🚫 ${park.name}</div>
          <div style="font-weight: 700; color: #e11d48; margin-top: 2px;">STATUS: STRICT NO TAKE ZONE</div>
          <p style="margin-top: 4px; font-size: 11px; color: #475569;">
            ${park.description}
          </p>
        </div>
      `);

      group.addLayer(polygon);
    });
  }, [showMarineParks]);

  // Render Live Boat Vessel Marker
  useEffect(() => {
    const group = boatLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (!boatCoords) return;

    const heading = boatHeading ?? 0;

    const boatHtml = `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing radar wave -->
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(56, 189, 248, 0.25);
          animation: pulse 2s infinite ease-out;
        "></div>
        <!-- Vessel arrow oriented with COG heading -->
        <div style="
          transform: rotate(${heading}deg);
          transition: transform 0.4s ease;
          width: 30px;
          height: 30px;
          background: #0284c7;
          border: 2.5px solid #ffffff;
          border-radius: 50% 50% 12% 12%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(0,0,0,0.7);
        ">
          <!-- Heading direction pointer -->
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff">
            <polygon points="12,2 22,22 12,17 2,22"/>
          </svg>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'live-boat-icon',
      html: boatHtml,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const marker = L.marker([boatCoords.lat, boatCoords.lng], { icon, zIndexOffset: 1000 });
    marker.bindPopup(`
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 12px; min-width: 160px; color: #0f172a;">
        <div style="font-weight: 800; color: #0284c7;">🚤 MY VESSEL POSITION</div>
        <div style="margin-top: 2px;">
          <strong>Speed:</strong> ${boatSpeedKnots.toFixed(1)} knots<br/>
          <strong>Course:</strong> ${boatHeading !== null ? `${boatHeading}° ${bearingToCardinal(boatHeading)}` : 'N/A'}<br/>
          <strong>Lat/Lng:</strong> ${formatDDM(boatCoords.lat, boatCoords.lng).full}
        </div>
      </div>
    `);

    group.addLayer(marker);
  }, [boatCoords, boatHeading, boatSpeedKnots]);

  // Center on focus coordinates when requested
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !focusCoords) return;

    map.setView([focusCoords.lat, focusCoords.lng], 13, { animate: true });

    const focusGroup = focusLayerRef.current;
    if (focusGroup) {
      focusGroup.clearLayers();
      const circle = L.circleMarker([focusCoords.lat, focusCoords.lng], {
        radius: 14,
        color: '#f59e0b',
        fillColor: '#fbbf24',
        fillOpacity: 0.6,
        weight: 3,
      });
      focusGroup.addLayer(circle);
    }
  }, [focusCoords]);

  // Center navigation functions
  const centerOnBoat = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !boatCoords) return;
    map.setView([boatCoords.lat, boatCoords.lng], 13, { animate: true });
  }, [boatCoords]);

  const centerOnPortPhillip = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([-38.10, 144.88], 10, { animate: true });
  }, []);

  const centerOnWesternPort = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setView([-38.38, 145.28], 11, { animate: true });
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-sky-800/80 bg-slate-950 shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'h-[520px] sm:h-[620px]'
      } ${className}`}
    >
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="h-full w-full" />

      {/* Top Left: Quick Area Jump Buttons */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-1.5 pointer-events-auto">
        <button
          onClick={centerOnPortPhillip}
          className="flex items-center gap-1 rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-sky-200 shadow-md backdrop-blur-md border border-sky-700/60 hover:bg-sky-900 active:scale-95 transition"
        >
          Port Phillip Bay
        </button>
        <button
          onClick={centerOnWesternPort}
          className="flex items-center gap-1 rounded-xl bg-slate-900/90 px-3 py-1.5 text-xs font-bold text-cyan-200 shadow-md backdrop-blur-md border border-cyan-700/60 hover:bg-cyan-900 active:scale-95 transition"
        >
          Western Port Bay
        </button>
        {boatCoords && (
          <button
            onClick={centerOnBoat}
            className="flex items-center gap-1 rounded-xl bg-emerald-900/90 px-3 py-1.5 text-xs font-bold text-emerald-200 shadow-md backdrop-blur-md border border-emerald-600/60 hover:bg-emerald-800 active:scale-95 transition"
          >
            <Crosshair className="h-3.5 w-3.5" /> My Boat
          </button>
        )}
      </div>

      {/* Top Right: Layer Controls & Fullscreen */}
      <div className="absolute top-3 right-14 z-[1000] flex items-center gap-1.5 pointer-events-auto">
        <button
          onClick={() => setControlsOpen(!controlsOpen)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shadow-md backdrop-blur-md border transition active:scale-95 ${
            controlsOpen
              ? 'bg-sky-600 text-white border-sky-400'
              : 'bg-slate-900/90 text-sky-200 border-sky-700/60 hover:bg-slate-800'
          }`}
          title="Chart Layers"
        >
          <Layers className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Layers</span>
        </button>

        <button
          onClick={toggleFullscreen}
          className="rounded-xl bg-slate-900/90 p-2 text-sky-200 shadow-md backdrop-blur-md border border-sky-700/60 hover:bg-slate-800 active:scale-95 transition"
          title={isFullscreen ? 'Exit Fullscreen' : 'Boat Tablet Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Slide-out Layer Controls Drawer */}
      {controlsOpen && (
        <div className="absolute top-14 right-3 z-[1000] w-72 rounded-2xl border border-sky-800 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md text-slate-100 pointer-events-auto animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-sky-900/60 pb-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-300">
              Marine Chart Layers
            </span>
            <button
              onClick={() => setControlsOpen(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Close
            </button>
          </div>

          {/* Base Map selector */}
          <div className="mb-3">
            <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Base Chart
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(['ocean', 'voyager', 'satellite'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setBaseMapType(type)}
                  className={`rounded-lg py-1 text-center text-xs font-medium capitalize border transition ${
                    baseMapType === type
                      ? 'bg-sky-600 border-sky-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Layer toggles */}
          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5 text-sky-300">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span> Depth Contours (5m, 10m, 15m, 20m)
              </span>
              <input
                type="checkbox"
                checked={showContours}
                onChange={(e) => setShowContours(e.target.checked)}
                className="rounded accent-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-cyan-400"></span> Charted Soundings (Depths in meters)
              </span>
              <input
                type="checkbox"
                checked={showSoundings}
                onChange={(e) => setShowSoundings(e.target.checked)}
                className="rounded accent-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5 text-blue-300">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span> Fishing Spots & Marks
              </span>
              <input
                type="checkbox"
                checked={showFishingSpots}
                onChange={(e) => setShowFishingSpots(e.target.checked)}
                className="rounded accent-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5 text-teal-300">
                <span className="h-2 w-2 rounded-full bg-teal-500"></span> Victorian Boat Ramps
              </span>
              <input
                type="checkbox"
                checked={showRamps}
                onChange={(e) => setShowRamps(e.target.checked)}
                className="rounded accent-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5 text-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-500"></span> Marine Parks (NO TAKE ZONES)
              </span>
              <input
                type="checkbox"
                checked={showMarineParks}
                onChange={(e) => setShowMarineParks(e.target.checked)}
                className="rounded accent-sky-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5 text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span> OpenSeaMap Seamarks & Buoys
              </span>
              <input
                type="checkbox"
                checked={showSeaMarks}
                onChange={(e) => setShowSeaMarks(e.target.checked)}
                className="rounded accent-sky-500"
              />
            </label>
          </div>
        </div>
      )}

      {/* Bottom Chart Legend & Water Inspector */}
      <div className="absolute bottom-3 left-3 right-3 z-[1000] pointer-events-auto">
        {clickedWaterPoint ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-700 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-sky-600/30 p-2 text-sky-400 border border-sky-500/40">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">
                  Point Selected: {formatDDM(clickedWaterPoint.coord.lat, clickedWaterPoint.coord.lng).full}
                </div>
                <div className="text-sky-300 text-[11px]">
                  Estimated Depth: <strong className="text-white font-mono">~{clickedWaterPoint.depthEst}m</strong> • Seabed: <strong className="text-cyan-300">{clickedWaterPoint.seabedEst}</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onSaveClickedCoord && (
                <button
                  onClick={() => {
                    onSaveClickedCoord(clickedWaterPoint.coord, clickedWaterPoint.depthEst);
                    setClickedWaterPoint(null);
                  }}
                  className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500 active:scale-95 transition"
                >
                  Save as Spot
                </button>
              )}
              <button
                onClick={() => setClickedWaterPoint(null)}
                className="rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex items-center justify-between rounded-xl border border-sky-900/60 bg-slate-950/80 px-3 py-2 text-[11px] text-slate-300 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <span className="font-semibold text-sky-400">Depth Key:</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded bg-sky-400"></span> 5m Contour
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded bg-sky-600"></span> 10m Contour
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded bg-sky-800"></span> 15m Snapper Line
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded bg-slate-900 border border-slate-700"></span> 20m+ Basin
              </span>
            </div>
            <div className="text-slate-400">
              💡 Tap anywhere on the water to inspect charted depth
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
