export interface FlatRecord {
  _id: number;
  month: string; // e.g. "2026-10"
  town: string; // e.g. "BEDOK"
  flat_type: string; // e.g. "4 ROOM"
  block: string;
  street_name: string;
  storey_range: string;
  floor_area_sqm: string | number;
  flat_model: string;
  lease_commence_date: string;
  remaining_lease: string;
  resale_price: string | number;
}

export interface MonthlyTrendPoint {
  month: string; // YYYY-MM
  count: number;
  avgPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  avgPsm: number; // Price per square meter
  avgPsf: number; // Price per square foot
  records: FlatRecord[];
}

export interface TownProfile {
  id: string;
  name: string;
  displayName: string;
  region: 'East' | 'West' | 'North' | 'North-East' | 'Central';
  estateType: 'Mature' | 'Non-Mature';
  developedYear: string;
  estPopulation: string;
  tagline: string;
  overview: string;
  vibe: string;
  mrtLines: string[];
  mrtStations: string[];
  iconicLandmarks: string[];
  natureParks: string[];
  famousEateries: string[];
  topSchools: string[];
  upcomingDevelopments: string[];
  averageLeaseLeftEstimateYears: number;
}

export interface ApiHealthResponse {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  healthy: boolean;
  latencyMs: number;
  statusCode: number;
  timestamp: string;
  upstream?: {
    endpoint: string;
    success: boolean;
    totalRecords: number;
    sampleRecord: any;
    fields: string[];
  };
  server?: {
    uptimeSeconds: number;
    nodeVersion: string;
    memoryUsageMb: number;
  };
  error?: string;
}
