import { RouteComparison } from '../domain/Route';
import { IRouteRepository } from '../ports/IRouteRepository';

export class GetComparison {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(): Promise<RouteComparison[]> {
    const baseline = await this.routeRepo.findBaseline();
    if (!baseline) {
      throw new Error('No baseline route has been set. Use POST /routes/:id/baseline first.');
    }
    return this.routeRepo.getComparison();
  }
}
