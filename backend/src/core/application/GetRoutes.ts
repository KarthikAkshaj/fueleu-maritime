import { Route } from '../domain/Route';
import { IRouteRepository } from '../ports/IRouteRepository';

export class GetRoutes {
  constructor(private readonly routeRepo: IRouteRepository) {}

  async execute(): Promise<Route[]> {
    return this.routeRepo.findAll();
  }
}
