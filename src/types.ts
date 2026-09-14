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
  anomalyDescription: string;
  lidarFeatures: string[];
  verificationStatus: VerificationStatus;
  fieldNotes: string;
  confirmedDate?: string;
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
