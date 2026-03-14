import type {
  Route,
  RouteComparison,
  ComplianceBalance,
  BankEntry,
  BankingResult,
  ApplyBankedResult,
  Pool,
} from '../domain/types';

export interface IApiPort {
  // Routes
  getRoutes(): Promise<Route[]>;
  setBaseline(routeId: string): Promise<Route>;
  getComparison(): Promise<RouteComparison[]>;

  // Compliance
  getComplianceBalance(shipId: string, year: number): Promise<ComplianceBalance>;
  getAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance>;

  // Banking
  getBankingRecords(shipId: string, year: number): Promise<{ records: BankEntry[]; totalBanked: number }>;
  bankSurplus(shipId: string, year: number): Promise<BankingResult>;
  applyBanked(shipId: string, year: number, amount: number): Promise<ApplyBankedResult>;

  // Pools
  createPool(year: number, shipIds: string[]): Promise<Pool>;
}
