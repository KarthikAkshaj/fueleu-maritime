import { ComplianceBalance, computeComplianceBalance } from '../domain/Compliance';
import { IRouteRepository } from '../ports/IRouteRepository';
import { IComplianceRepository } from '../ports/IComplianceRepository';

export interface ComputeCBInput {
  shipId: string;
  year: number;
}

export class ComputeCB {
  constructor(
    private readonly routeRepo: IRouteRepository,
    private readonly complianceRepo: IComplianceRepository,
  ) {}

  async execute({ shipId, year }: ComputeCBInput): Promise<ComplianceBalance> {
    // Find the route matching this ship/year (routeId is used as shipId)
    const routes = await this.routeRepo.findAll();
    const route = routes.find((r) => r.routeId === shipId && r.year === year);

    if (!route) {
      throw new Error(`No route found for shipId="${shipId}" year=${year}`);
    }

    const cb = computeComplianceBalance(shipId, year, route.ghgIntensity, route.fuelConsumption);
    return this.complianceRepo.saveCB(cb);
  }
}
