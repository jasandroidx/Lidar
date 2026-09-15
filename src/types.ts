export type VerificationStatus = 'unverified' | 'confirmed' | 'walkover' | 'rejected';

export type TargetCategory = 
  | 'cellar_hole' 
  | 'pioneer_well' 
  | 'blockhouse_fort' 
  | 'prehistoric_mound' 
  | 'mill_race' 
  | 'historic_trace' 
  | 'coal_drift';

export type LiDARShaderMode = 
  | 'analytical_hillshade' 
  | 'multidirectional' 
  | 'slope_angle' 
  | 'hypsometric' 
  | 'contour';

export interface TerrainTarget {
  id: string;
  name: string;
  category: TargetCategory;
  township: string;
  yearSettled: number;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  dimensionsFeet: string;
  goodspeedCitation: string;
  goodspeedPage: number;
  pioneerFamily: string;
  chronicleSummary: string;
  // Observation fields. Populated ONLY by a real detector run or a real site
  // visit. Absent means nobody has looked yet -- that is the honest default.
  anomalyDescription?: string;
  lidarFeatures?: string[];
  verificationStatus: VerificationStatus;
  fieldNotes?: string;
  confirmedDate?: string;
  /** true only once the Goodspeed page cite is checked against goodspeed_fulltext.txt */
  citationVerified?: boolean;
  /** burials, mounds, and anything SHAARD restricts: coords are fuzzed, never exported */
  locationRestricted?: boolean;
  distanceMeters?: number;
  bearingDeg?: number;
}

export interface PioneerFamilyBadge {
  id: string;
  familyName: string;
  patriarch: string;
  arrivalYear: number;
  township: string;
  landAcres: number;
  militaryService?: string;
  historicalSignificance: string;
  quoteExcerpt: string;
  goodspeedPage: number;
  iconName: string;
}

export interface EarlyRoadDistance {
  fromLocation: string;
  toLocation: string;
  miles: number;
  historicalRouteName: string;
  terrainDescription: string;
}

export interface HistoricalAct {
  actNumber: 'I' | 'II' | 'III';
  title: string;
  period: string;
  theme: string;
  narrativeText: string;
  keyCitations: string[];
}

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  altitudeMeters?: number;
  accuracyMeters?: number;
  headingDeg?: number;
  speedMps?: number;
  timestamp: number;
}

export interface FootstepBreadcrumb {
  x: number;
  y: number;
  lat: number;
  lng: number;
  timestamp: number;
}

export type GridStatus = 'scanned' | 'scanning' | 'queued' | 'unscanned';

export interface ScanGridTile {
  id: string;
  code: string; // e.g. "GRID-P-04"
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
  status: GridStatus;
  anomaliesFoundCount: number;
  lastScannedTime?: string;
  nextScheduledScanTime?: string;
  scanProgressPercent?: number;
}
