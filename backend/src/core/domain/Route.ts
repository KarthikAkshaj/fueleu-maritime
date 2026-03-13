export type VesselType = 'Container' | 'BulkCarrier' | 'Tanker' | 'RoRo';
export type FuelType = 'HFO' | 'LNG' | 'MGO';

export interface Route {
  id: string;
  routeId: string;
  vesselType: VesselType;
  fuelType: FuelType;
  year: number;
  ghgIntensity: number;      // gCO2e/MJ
  fuelConsumption: number;   // tonnes
  distance: number;          // km
  totalEmissions: number;    // tonnes
  isBaseline: boolean;
}

export interface RouteComparison {
  baseline: Route;
  comparison: Route;
  percentDiff: number;
  compliant: boolean;
}
