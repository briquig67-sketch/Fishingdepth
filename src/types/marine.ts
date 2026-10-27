/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BayRegion = 'port-phillip' | 'western-port' | 'bass-strait';

export type SeabedType = 
  | 'Sand / Grit'
  | 'Mud / Silt'
  | 'Kelp Reef'
  | 'Calcarenite Rock'
  | 'Seagrass Bed'
  | 'Artificial Concrete Reef'
  | 'Wreck / Iron'
  | 'Broken Shell / Rubble'
  | 'Deep Trench / Mud';

export interface GPSCoordinate {
  lat: number;
  lng: number;
}

export interface SoundingPoint {
  id: string;
  lat: number;
  lng: number;
  depthMeters: number;
  seabed: SeabedType;
  bay: BayRegion;
  locationName: string;
  chartRef?: string;
}

export interface DepthContourFeature {
  depth: number; // e.g. 2, 5, 10, 15, 20, 30, 50, 80 meters
  color: string;
  bay: BayRegion;
  coordinates: [number, number][][]; // GeoJSON polygon rings [lng, lat]
}

export interface NavigationMark {
  id: string;
  name: string;
  officialRef?: string;
  type: 'beacon' | 'buoy' | 'lighthouse' | 'cardinal' | 'spit' | 'channel_pole';
  lat: number;
  lng: number;
  depthMeters: number;
  bay: BayRegion;
  lightChar?: string;
  notes: string;
}

export interface MarineParkZone {
  id: string;
  name: string;
  bay: BayRegion;
  status: 'Sanctuary (No Take)' | 'Marine National Park' | 'Special Management Area';
  polygon: [number, number][]; // [lat, lng]
  description: string;
}

export interface BoatRamp {
  id: string;
  name: string;
  bay: BayRegion;
  lat: number;
  lng: number;
  lanes: number;
  pontoon: boolean;
  fishCleaningTable: boolean;
  parkingBays: number;
  suitableTides: string;
  address: string;
}

export interface FishingSpot {
  id: string;
  name: string;
  bay: BayRegion;
  lat: number;
  lng: number;
  depthMeters: number;
  seabed: SeabedType;
  targetSpecies: string[];
  bestTide: string;
  bestSeason: string;
  notes: string;
  isUserCustom?: boolean;
}

export interface CatchLog {
  id: string;
  timestamp: number;
  species: string;
  lengthCm: number;
  weightKg?: number;
  depthMeters?: number;
  locationName: string;
  lat?: number;
  lng?: number;
  baitOrLure: string;
  tideState: 'Low' | 'Run Up (Incoming)' | 'High' | 'Run Down (Outgoing)' | 'Slack';
  moonPhase: 'New Moon' | 'First Quarter' | 'Full Moon' | 'Last Quarter';
  notes?: string;
  bay: BayRegion;
  released: boolean;
}

export interface VictorianSpeciesRule {
  commonName: string;
  scientificName: string;
  minSizeCm?: number;
  maxSizeCm?: number;
  bagLimit: string;
  possessionLimit?: string;
  closedSeason?: string;
  notes: string;
  category: 'Scale Fish' | 'Squid / Cephalopod' | 'Elasmobranch (Shark/Ray)' | 'Pelagic';
}
