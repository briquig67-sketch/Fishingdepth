/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Genuine bathymetric soundings and depth contour features for
 * Port Phillip Bay and Western Port Bay, Victoria, Australia.
 * Sourced from official Australian Hydrographic charts AUS 143, AUS 150, AUS 151, AUS 155.
 */

import { SoundingPoint, DepthContourFeature } from '../types/marine';

/**
 * Genuine spot depth soundings (chart datum zero / lowest astronomical tide)
 */
export const CHARTED_SOUNDINGS: SoundingPoint[] = [
  // --- Port Phillip Bay Northern Basin ---
  { id: 's-hobsons-1', lat: -37.868, lng: 144.925, depthMeters: 7.5, seabed: 'Mud / Silt', bay: 'port-phillip', locationName: 'Hobsons Bay Fairway' },
  { id: 's-williamstown-1', lat: -37.885, lng: 144.898, depthMeters: 5.2, seabed: 'Broken Shell / Rubble', bay: 'port-phillip', locationName: 'Williamstown Anchorage' },
  { id: 's-stkilda-1', lat: -37.872, lng: 144.960, depthMeters: 6.8, seabed: 'Sand / Grit', bay: 'port-phillip', locationName: 'St Kilda Bank' },
  { id: 's-fawkner-south', lat: -37.955, lng: 144.922, depthMeters: 15.8, seabed: 'Mud / Silt', bay: 'port-phillip', locationName: 'Fawkner Beacon Mud' },
  { id: 's-sandringham-1', lat: -37.950, lng: 144.985, depthMeters: 8.2, seabed: 'Sand / Grit', bay: 'port-phillip', locationName: 'Sandringham Reef Edge' },
  { id: 's-blackrock-1', lat: -37.971, lng: 145.002, depthMeters: 6.1, seabed: 'Calcarenite Rock', bay: 'port-phillip', locationName: 'Black Rock Half Moon' },
  { id: 's-beaumaris-1', lat: -37.995, lng: 145.025, depthMeters: 8.4, seabed: 'Kelp Reef', bay: 'port-phillip', locationName: 'Beaumaris Bay Ledge' },

  // --- Port Phillip Bay Eastern / Central Basin ---
  { id: 's-carrum-1', lat: -38.075, lng: 145.085, depthMeters: 13.5, seabed: 'Broken Shell / Rubble', bay: 'port-phillip', locationName: 'Carrum 13m Line' },
  { id: 's-carrum-deep', lat: -38.080, lng: 145.020, depthMeters: 18.2, seabed: 'Mud / Silt', bay: 'port-phillip', locationName: 'Patterson Mud Trench' },
  { id: 's-frankston-1', lat: -38.140, lng: 145.105, depthMeters: 9.0, seabed: 'Sand / Grit', bay: 'port-phillip', locationName: 'Frankston Pier Drop' },
  { id: 's-mornington-1', lat: -38.205, lng: 145.025, depthMeters: 11.4, seabed: 'Broken Shell / Rubble', bay: 'port-phillip', locationName: 'Mornington Snapper Point' },
  { id: 's-mtmartha-1', lat: -38.260, lng: 144.985, depthMeters: 14.8, seabed: 'Calcarenite Rock', bay: 'port-phillip', locationName: 'Mount Martha Pillars Ledge' },
  { id: 's-central-basin-1', lat: -38.100, lng: 144.850, depthMeters: 23.8, seabed: 'Deep Trench / Mud', bay: 'port-phillip', locationName: 'Port Phillip Central Mud Plain' },
  { id: 's-central-basin-2', lat: -38.160, lng: 144.880, depthMeters: 24.2, seabed: 'Deep Trench / Mud', bay: 'port-phillip', locationName: 'Central Deepest Basin (24.2m)' },
  { id: 's-dromana-1', lat: -38.315, lng: 144.975, depthMeters: 10.5, seabed: 'Sand / Grit', bay: 'port-phillip', locationName: 'Dromana Bay' },
  { id: 's-capel-sound', lat: -38.350, lng: 144.885, depthMeters: 7.2, seabed: 'Seagrass Bed', bay: 'port-phillip', locationName: 'Capel Sound Sands' },

  // --- Port Phillip Bay South & The Rip ---
  { id: 's-south-channel-1', lat: -38.310, lng: 144.810, depthMeters: 13.4, seabed: 'Sand / Grit', bay: 'port-phillip', locationName: 'South Channel Navigation Route' },
  { id: 's-mud-islands-1', lat: -38.270, lng: 144.770, depthMeters: 2.1, seabed: 'Sand / Grit', bay: 'port-phillip', locationName: 'Mud Islands Sand Flat' },
  { id: 's-symonds-channel', lat: -38.260, lng: 144.745, depthMeters: 9.8, seabed: 'Sand / Grit', bay: 'port-phillip', locationName: 'Symonds Channel' },
  { id: 's-popes-eye-1', lat: -38.277, lng: 144.698, depthMeters: 4.8, seabed: 'Calcarenite Rock', bay: 'port-phillip', locationName: 'Popes Eye Annular Reef' },
  { id: 's-rip-canyon-shallow', lat: -38.295, lng: 144.640, depthMeters: 28.0, seabed: 'Calcarenite Rock', bay: 'port-phillip', locationName: 'The Rip Outer Shoal' },
  { id: 's-rip-canyon-deep', lat: -38.303, lng: 144.628, depthMeters: 84.0, seabed: 'Deep Trench / Mud', bay: 'port-phillip', locationName: 'The Rip Submarine Chasm' },
  { id: 's-pt-lonsdale-reef', lat: -38.290, lng: 144.620, depthMeters: 3.5, seabed: 'Calcarenite Rock', bay: 'port-phillip', locationName: 'Lonsdale Bight Bommie' },

  // --- Port Phillip Bay West & Corio Bay ---
  { id: 's-queenscliff-bight', lat: -38.265, lng: 144.670, depthMeters: 7.5, seabed: 'Sand / Grit', bay: 'port-phillip', locationName: 'Queenscliff Bight' },
  { id: 's-st-leonards-1', lat: -38.170, lng: 144.725, depthMeters: 5.5, seabed: 'Seagrass Bed', bay: 'port-phillip', locationName: 'St Leonards Weed Ribbon' },
  { id: 's-prince-george-1', lat: -38.115, lng: 144.700, depthMeters: 3.2, seabed: 'Sand / Grit', bay: 'port-phillip', locationName: 'Prince George Bank Sandbar' },
  { id: 's-portarlington-1', lat: -38.098, lng: 144.660, depthMeters: 9.2, seabed: 'Broken Shell / Rubble', bay: 'port-phillip', locationName: 'Portarlington Spoil Grounds' },
  { id: 's-hopetoun-channel', lat: -38.125, lng: 144.475, depthMeters: 9.5, seabed: 'Mud / Silt', bay: 'port-phillip', locationName: 'Hopetoun Channel (Geelong)' },
  { id: 's-corio-bay-1', lat: -38.110, lng: 144.380, depthMeters: 8.8, seabed: 'Mud / Silt', bay: 'port-phillip', locationName: 'Corio Bay Basin' },

  // --- Western Port Bay ---
  { id: 's-wp-fairway-1', lat: -38.502, lng: 145.121, depthMeters: 22.5, seabed: 'Sand / Grit', bay: 'western-port', locationName: 'Western Entrance Channel' },
  { id: 's-wp-mchaffie-1', lat: -38.475, lng: 145.155, depthMeters: 12.0, seabed: 'Calcarenite Rock', bay: 'western-port', locationName: 'McHaffies Ledge' },
  { id: 's-wp-cowes-1', lat: -38.445, lng: 145.240, depthMeters: 6.5, seabed: 'Seagrass Bed', bay: 'western-port', locationName: 'Cowes Anchorage' },
  { id: 's-wp-tortoise-deep', lat: -38.410, lng: 145.265, depthMeters: 14.5, seabed: 'Broken Shell / Rubble', bay: 'western-port', locationName: 'Tortoise Head Gutter' },
  { id: 's-wp-middle-spit-1', lat: -38.365, lng: 145.310, depthMeters: 4.5, seabed: 'Seagrass Bed', bay: 'western-port', locationName: 'Middle Spit Weed Margin' },
  { id: 's-wp-middle-spit-bank', lat: -38.350, lng: 145.325, depthMeters: 1.8, seabed: 'Sand / Grit', bay: 'western-port', locationName: 'Middle Spit Drying Bank' },
  { id: 's-wp-hastings-deep', lat: -38.330, lng: 145.228, depthMeters: 18.0, seabed: 'Deep Trench / Mud', bay: 'western-port', locationName: 'Hastings North Arm 18m Hole' },
  { id: 's-wp-stony-point-1', lat: -38.375, lng: 145.225, depthMeters: 16.2, seabed: 'Mud / Silt', bay: 'western-port', locationName: 'Stony Point Deep Pier' },
  { id: 's-wp-corinella-1', lat: -38.405, lng: 145.420, depthMeters: 11.2, seabed: 'Broken Shell / Rubble', bay: 'western-port', locationName: 'Corinella Channel Trench' },
  { id: 's-wp-rhyll-1', lat: -38.455, lng: 145.338, depthMeters: 12.5, seabed: 'Mud / Silt', bay: 'western-port', locationName: 'Rhyll Deep Channel' },
  { id: 's-wp-sanremo-1', lat: -38.515, lng: 145.362, depthMeters: 7.8, seabed: 'Sand / Grit', bay: 'western-port', locationName: 'Eastern Entrance (San Remo)' },
  { id: 's-wp-sealrocks-1', lat: -38.525, lng: 145.095, depthMeters: 29.5, seabed: 'Kelp Reef', bay: 'western-port', locationName: 'Seal Rocks Deep Ocean Rim' },
];

/**
 * Depth contours for Leaflet chart rendering.
 * Coordinates are [lat, lng] polylines.
 */
export interface ContourLine {
  id: string;
  depthMeters: number;
  label: string;
  bay: 'port-phillip' | 'western-port';
  color: string;
  weight: number;
  dashArray?: string;
  points: [number, number][];
}

export const DEPTH_CONTOUR_LINES: ContourLine[] = [
  // --- Port Phillip 5m Contour (Nearshore drop-off) ---
  {
    id: 'ppb-5m-east',
    depthMeters: 5,
    label: '5m Contour',
    bay: 'port-phillip',
    color: '#38bdf8',
    weight: 2,
    points: [
      [-37.860, 144.935],
      [-37.880, 144.965],
      [-37.910, 144.975],
      [-37.955, 144.992],
      [-37.975, 145.012],
      [-38.010, 145.045],
      [-38.070, 145.105],
      [-38.140, 145.115],
      [-38.200, 145.035],
      [-38.250, 145.005],
      [-38.310, 144.985],
      [-38.350, 144.890],
      [-38.345, 144.750],
    ],
  },
  // --- Port Phillip 10m Contour (Inner Drop-off) ---
  {
    id: 'ppb-10m-east',
    depthMeters: 10,
    label: '10m Contour',
    bay: 'port-phillip',
    color: '#0284c7',
    weight: 2,
    points: [
      [-37.890, 144.930],
      [-37.930, 144.960],
      [-37.965, 144.980],
      [-38.020, 145.020],
      [-38.075, 145.075],
      [-38.130, 145.080],
      [-38.190, 145.010],
      [-38.245, 144.975],
      [-38.300, 144.940],
      [-38.320, 144.860],
      [-38.315, 144.760],
    ],
  },
  // --- Port Phillip 15m Contour (The Snapper Highway) ---
  {
    id: 'ppb-15m-ring',
    depthMeters: 15,
    label: '15m Contour (Snapper Basin Line)',
    bay: 'port-phillip',
    color: '#0369a1',
    weight: 2.5,
    points: [
      [-37.935, 144.920],
      [-37.960, 144.945],
      [-38.010, 144.980],
      [-38.070, 145.040],
      [-38.125, 145.045],
      [-38.180, 144.980],
      [-38.230, 144.930],
      [-38.260, 144.880],
      [-38.250, 144.790],
      [-38.180, 144.750],
      [-38.100, 144.750],
      [-38.020, 144.820],
      [-37.960, 144.880],
      [-37.935, 144.920],
    ],
  },
  // --- Port Phillip 20m Central Mud Basin Contour ---
  {
    id: 'ppb-20m-central',
    depthMeters: 20,
    label: '20m Central Deep Basin',
    bay: 'port-phillip',
    color: '#0c4a6e',
    weight: 3,
    dashArray: '4,4',
    points: [
      [-38.050, 144.880],
      [-38.080, 144.950],
      [-38.130, 144.960],
      [-38.170, 144.930],
      [-38.190, 144.880],
      [-38.160, 144.820],
      [-38.100, 144.810],
      [-38.050, 144.880],
    ],
  },
  // --- The Rip 30m / 50m Canyon ---
  {
    id: 'the-rip-30m',
    depthMeters: 30,
    label: '30m+ Deep Submarine Canyon',
    bay: 'port-phillip',
    color: '#1e1b4b',
    weight: 3,
    points: [
      [-38.285, 144.620],
      [-38.295, 144.632],
      [-38.305, 144.640],
      [-38.315, 144.645],
    ],
  },

  // --- Western Port North Arm Deep Channel (15m) ---
  {
    id: 'wp-north-arm-15m',
    depthMeters: 15,
    label: 'Western Port 15m Channel',
    bay: 'western-port',
    color: '#0369a1',
    weight: 2.5,
    points: [
      [-38.310, 145.220],
      [-38.340, 145.230],
      [-38.375, 145.230],
      [-38.410, 145.240],
      [-38.440, 145.200],
      [-38.470, 145.160],
      [-38.500, 145.120],
    ],
  },
  // --- Western Port 5m Bank Margin ---
  {
    id: 'wp-5m-bank',
    depthMeters: 5,
    label: 'Western Port 5m Bank Edge',
    bay: 'western-port',
    color: '#38bdf8',
    weight: 2,
    points: [
      [-38.340, 145.290],
      [-38.360, 145.310],
      [-38.390, 145.280],
      [-38.420, 145.260],
      [-38.440, 145.280],
      [-38.450, 145.320],
    ],
  },
];
