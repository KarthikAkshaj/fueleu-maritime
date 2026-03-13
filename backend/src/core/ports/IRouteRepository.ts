import { Route, RouteComparison } from '../domain/Route';

export interface IRouteRepository {
  findAll(): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  findBaseline(): Promise<Route | null>;
  setBaseline(id: string): Promise<Route>;
  getComparison(): Promise<RouteComparison[]>;
}
