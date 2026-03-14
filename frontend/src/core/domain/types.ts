export type VesselType = 'Container' | 'BulkCarrier' | 'Tanker' | 'RoRo';
export type FuelType = 'HFO' | 'LNG' | 'MGO';

export interface Route {
  id: string;
  routeId: string;
  vesselType: VesselType;
  fuelType: FuelType;
  year: number;
  ghgIntensity: number;
  fuelConsumption: number;
  distance: number;
  totalEmissions: number;
  isBaseline: boolean;
}

export interface RouteComparison {
  baseline: Route;
  comparison: Route;
  percentDiff: number;
  compliant: boolean;
}

export interface ComplianceBalance {
  shipId: string;
  year: number;
  ghgIntensityActual: number;
  ghgIntensityTarget: number;
  energyInScope: number;
  cbGco2eq: number;
  bankedSurplus?: number;
}

export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  createdAt: string;
}

export interface BankingResult {
  shipId: string;
  year: number;
  cbBefore: number;
  banked: number;
  cbAfter: number;
}

export interface ApplyBankedResult {
  shipId: string;
  year: number;
  cbBefore: number;
  applied: number;
  cbAfter: number;
  remainingBanked: number;
}

export interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  id: string;
  year: number;
  members: PoolMember[];
  createdAt: string;
}
