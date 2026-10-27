/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GPSCoordinate } from '../types/marine';
import { mpsToKnots, calculateDistanceMeters, calculateBearing } from '../utils/geoUtils';

export interface BoatGPSState {
  coords: GPSCoordinate | null;
  accuracy: number | null; // meters
  speedKnots: number;
  heading: number | null; // Course over ground 0-359 deg
  timestamp: number | null;
  isLive: boolean;
  isSimulated: boolean;
  status: 'locating' | 'locked' | 'denied' | 'simulated' | 'error';
  errorMessage: string | null;
  anchorAlarm: {
    isActive: boolean;
    anchorPoint: GPSCoordinate | null;
    radiusMeters: number;
    currentDriftMeters: number;
    isBreached: boolean;
  };
}

// Preset simulation locations in Victorian waters for testing
export const SIMULATED_START_POINTS = {
  fawkner: { lat: -37.9480, lng: 144.9270, name: 'Fawkner Beacon (Port Phillip)' },
  carrum: { lat: -38.0742, lng: 145.0805, name: 'Carrum 14m Line (Port Phillip)' },
  middleSpit: { lat: -38.3667, lng: 145.3083, name: 'Middle Spit (Western Port)' },
  mornington: { lat: -38.2050, lng: 145.0133, name: 'Mornington Reef (Port Phillip)' },
  tortoiseHead: { lat: -38.4083, lng: 145.2633, name: 'Tortoise Head (Western Port)' },
};

export function useBoatGPS() {
  const [gpsState, setGpsState] = useState<BoatGPSState>({
    coords: null,
    accuracy: null,
    speedKnots: 0,
    heading: null,
    timestamp: null,
    isLive: false,
    isSimulated: false,
    status: 'locating',
    errorMessage: null,
    anchorAlarm: {
      isActive: false,
      anchorPoint: null,
      radiusMeters: 40,
      currentDriftMeters: 0,
      isBreached: false,
    },
  });

  const lastCoordsRef = useRef<GPSCoordinate | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sound generator for marine alarm
  const triggerAlarmSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch marine beep
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Audio not supported or blocked
    }
  }, []);

  // Set up Geolocation Watch
  useEffect(() => {
    if (gpsState.isSimulated) {
      return;
    }

    if (!('geolocation' in navigator)) {
      // Fallback to simulation if geolocation not supported
      setGpsState((prev) => ({
        ...prev,
        status: 'simulated',
        isSimulated: true,
        coords: SIMULATED_START_POINTS.fawkner,
        accuracy: 5,
        speedKnots: 0,
        heading: 180,
        errorMessage: 'Geolocation not supported on this device. Using simulation.',
      }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newCoords: GPSCoordinate = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        let calculatedHeading = pos.coords.heading;
        // If device heading is null or unavailable, compute COG from successive movements
        if (calculatedHeading === null && lastCoordsRef.current) {
          const dist = calculateDistanceMeters(lastCoordsRef.current, newCoords);
          if (dist > 3) {
            calculatedHeading = calculateBearing(lastCoordsRef.current, newCoords);
          }
        }
        lastCoordsRef.current = newCoords;

        setGpsState((prev) => {
          let driftMeters = 0;
          let breached = false;
          if (prev.anchorAlarm.isActive && prev.anchorAlarm.anchorPoint) {
            driftMeters = Math.round(calculateDistanceMeters(prev.anchorAlarm.anchorPoint, newCoords));
            breached = driftMeters > prev.anchorAlarm.radiusMeters;
            if (breached) {
              triggerAlarmSound();
            }
          }

          return {
            ...prev,
            coords: newCoords,
            accuracy: Math.round(pos.coords.accuracy || 5),
            speedKnots: Number(mpsToKnots(pos.coords.speed).toFixed(1)),
            heading: calculatedHeading !== null && !isNaN(calculatedHeading) ? Math.round(calculatedHeading) : prev.heading,
            timestamp: pos.timestamp,
            isLive: true,
            isSimulated: false,
            status: 'locked',
            errorMessage: null,
            anchorAlarm: {
              ...prev.anchorAlarm,
              currentDriftMeters: driftMeters,
              isBreached: breached,
            },
          };
        });
      },
      (err) => {
        console.warn('Boat GPS Geolocation error:', err.message);
        // Default to Victorian location so user can still test seamlessly
        setGpsState((prev) => ({
          ...prev,
          status: 'denied',
          errorMessage: 'GPS permission denied or unavailable. You can click "Simulate Location" to explore.',
          // Keep previous coordinates if available, else null
        }));
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 12000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [gpsState.isSimulated, triggerAlarmSound]);

  // Activate simulation
  const setSimulatedLocation = useCallback((point: keyof typeof SIMULATED_START_POINTS | GPSCoordinate, speed = 12, heading = 145) => {
    const coords = typeof point === 'string' ? SIMULATED_START_POINTS[point] : point;
    setGpsState((prev) => ({
      ...prev,
      coords: { lat: coords.lat, lng: coords.lng },
      accuracy: 3,
      speedKnots: speed,
      heading: heading,
      timestamp: Date.now(),
      isLive: false,
      isSimulated: true,
      status: 'simulated',
      errorMessage: null,
    }));
  }, []);

  // Return to live device GPS
  const useLiveGPS = useCallback(() => {
    setGpsState((prev) => ({
      ...prev,
      isSimulated: false,
      status: 'locating',
      errorMessage: null,
    }));
  }, []);

  // Toggle Anchor Watch
  const toggleAnchorAlarm = useCallback((radiusMeters = 40) => {
    setGpsState((prev) => {
      if (prev.anchorAlarm.isActive) {
        // Disarm
        return {
          ...prev,
          anchorAlarm: {
            isActive: false,
            anchorPoint: null,
            radiusMeters: 40,
            currentDriftMeters: 0,
            isBreached: false,
          },
        };
      }

      if (!prev.coords) return prev;

      // Arm anchor
      return {
        ...prev,
        anchorAlarm: {
          isActive: true,
          anchorPoint: { ...prev.coords },
          radiusMeters,
          currentDriftMeters: 0,
          isBreached: false,
        },
      };
    });
  }, []);

  return {
    gpsState,
    setSimulatedLocation,
    useLiveGPS,
    toggleAnchorAlarm,
  };
}
