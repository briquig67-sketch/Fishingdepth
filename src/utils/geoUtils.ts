/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GPSCoordinate } from '../types/marine';

/**
 * Converts decimal degrees to standard maritime Degrees Decimal Minutes (DDM)
 * e.g. -37.9480 -> 37° 56.880' S
 */
export function formatDDM(lat: number, lng: number): { latStr: string; lngStr: string; full: string } {
  const latHem = lat >= 0 ? 'N' : 'S';
  const lngHem = lng >= 0 ? 'E' : 'W';

  const absLat = Math.abs(lat);
  const latDeg = Math.floor(absLat);
  const latMin = ((absLat - latDeg) * 60).toFixed(3);

  const absLng = Math.abs(lng);
  const lngDeg = Math.floor(absLng);
  const lngMin = ((absLng - lngDeg) * 60).toFixed(3);

  const latStr = `${latDeg}° ${latMin}' ${latHem}`;
  const lngStr = `${lngDeg}° ${lngMin}' ${lngHem}`;

  return {
    latStr,
    lngStr,
    full: `${latStr}, ${lngStr}`,
  };
}

/**
 * Converts decimal degrees to Degrees, Minutes, Seconds (DMS)
 */
export function formatDMS(lat: number, lng: number): string {
  const formatCoord = (deg: number, pos: string, neg: string) => {
    const hem = deg >= 0 ? pos : neg;
    const abs = Math.abs(deg);
    const d = Math.floor(abs);
    const minFloat = (abs - d) * 60;
    const m = Math.floor(minFloat);
    const s = ((minFloat - m) * 60).toFixed(1);
    return `${d}° ${m}' ${s}" ${hem}`;
  };

  return `${formatCoord(lat, 'N', 'S')}, ${formatCoord(lng, 'E', 'W')}`;
}

/**
 * Parses user coordinate input into standard { lat, lng } in decimal degrees.
 * Supports:
 * - "-37.9480, 144.9270"
 * - "-37.9480 144.9270"
 * - "37 56.880 S, 144 55.620 E"
 * - "37°56.880'S 144°55.620'E"
 * - "37° 56' 52.8\" S, 144° 55' 37.2\" E"
 */
export function parseCoordinates(input: string): { success: boolean; coord?: GPSCoordinate; error?: string } {
  const clean = input.trim().toUpperCase();
  if (!clean) {
    return { success: false, error: 'Coordinate input cannot be empty' };
  }

  // 1. Try simple decimal degrees: "-37.9480, 144.9270" or "-37.9480 144.9270"
  const ddRegex = /^([+-]?\d+(?:\.\d+)?)[,\s]+([+-]?\d+(?:\.\d+)?)$/;
  const ddMatch = clean.match(ddRegex);
  if (ddMatch) {
    const lat = parseFloat(ddMatch[1]);
    const lng = parseFloat(ddMatch[2]);
    if (isValidLatLng(lat, lng)) {
      return { success: true, coord: { lat, lng } };
    }
  }

  // 2. Try DDM / DMS with cardinal letters (S/N and E/W)
  try {
    const parts = clean.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    if (parts.length === 2) {
      const lat = parseSingleCoordPart(parts[0], ['S', 'N']);
      const lng = parseSingleCoordPart(parts[1], ['W', 'E']);
      if (lat !== null && lng !== null && isValidLatLng(lat, lng)) {
        return { success: true, coord: { lat, lng } };
      }
    }

    // Try space split if no comma
    const spaceTokens = clean.match(/(\d+[^NSEW]*[NSEW])/g);
    if (spaceTokens && spaceTokens.length === 2) {
      const lat = parseSingleCoordPart(spaceTokens[0], ['S', 'N']);
      const lng = parseSingleCoordPart(spaceTokens[1], ['W', 'E']);
      if (lat !== null && lng !== null && isValidLatLng(lat, lng)) {
        return { success: true, coord: { lat, lng } };
      }
    }
  } catch {
    // fallback error below
  }

  return {
    success: false,
    error: 'Invalid coordinate format. Try: "-38.1234, 144.9876" or "38° 07.404\' S, 144° 59.256\' E"',
  };
}

function parseSingleCoordPart(part: string, cardinals: string[]): number | null {
  const isSouthOrWest = part.includes('S') || part.includes('W');
  const isNorthOrEast = part.includes('N') || part.includes('E');

  // Strip all cardinal characters and symbols except numbers, dots, and spaces
  const numbersOnly = part.replace(/[NSEW°'"]/g, ' ').trim().replace(/\s+/g, ' ');
  const tokens = numbersOnly.split(' ').map(parseFloat).filter((n) => !isNaN(n));

  let val = 0;
  if (tokens.length === 1) {
    // Decimal degrees without +/-
    val = tokens[0];
  } else if (tokens.length === 2) {
    // Degrees + Decimal Minutes
    val = tokens[0] + tokens[1] / 60;
  } else if (tokens.length === 3) {
    // Degrees + Minutes + Seconds
    val = tokens[0] + tokens[1] / 60 + tokens[2] / 3600;
  } else {
    return null;
  }

  if (isSouthOrWest) {
    val = -Math.abs(val);
  } else if (isNorthOrEast) {
    val = Math.abs(val);
  }

  return val;
}

function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Calculates great-circle distance between two points in Nautical Miles (NM)
 */
export function calculateDistanceNM(from: GPSCoordinate, to: GPSCoordinate): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates great-circle distance in kilometers
 */
export function calculateDistanceKm(from: GPSCoordinate, to: GPSCoordinate): number {
  return calculateDistanceNM(from, to) * 1.852;
}

/**
 * Calculates great-circle distance in meters
 */
export function calculateDistanceMeters(from: GPSCoordinate, to: GPSCoordinate): number {
  return calculateDistanceKm(from, to) * 1000;
}

/**
 * Computes initial compass bearing from point A to point B (0° to 360°)
 */
export function calculateBearing(from: GPSCoordinate, to: GPSCoordinate): number {
  const y = Math.sin(toRad(to.lng - from.lng)) * Math.cos(toRad(to.lat));
  const x =
    Math.cos(toRad(from.lat)) * Math.sin(toRad(to.lat)) -
    Math.sin(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.cos(toRad(to.lng - from.lng));

  let brng = toDeg(Math.atan2(y, x));
  brng = (brng + 360) % 360;
  return Math.round(brng);
}

/**
 * Converts a compass bearing degree into 16-point cardinal compass text
 */
export function bearingToCardinal(deg: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(((deg % 360) / 22.5)) % 16;
  return directions[index];
}

/**
 * Converts m/s (standard Geolocation coords.speed) to Knots (kt)
 */
export function mpsToKnots(speedMps: number | null): number {
  if (speedMps === null || isNaN(speedMps) || speedMps < 0) return 0;
  return speedMps * 1.94384;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}
