import { Pool as PgPool } from 'pg';
import { Route, RouteComparison, VesselType, FuelType } from '@core/domain/Route';
import { TARGET_GHG_INTENSITY } from '@core/domain/Compliance';
import { IRouteRepository } from '@core/ports/IRouteRepository';

function rowToRoute(row: Record<string, unknown>): Route {
  return {
    id: row.id as string,
    routeId: row.route_id as string,
    vesselType: row.vessel_type as VesselType,
    fuelType: row.fuel_type as FuelType,
    year: Number(row.year),
    ghgIntensity: Number(row.ghg_intensity),
    fuelConsumption: Number(row.fuel_consumption),
    distance: Number(row.distance),
    totalEmissions: Number(row.total_emissions),
    isBaseline: row.is_baseline as boolean,
  };
}

export class RouteRepository implements IRouteRepository {
  constructor(private readonly db: PgPool) {}

  async findAll(): Promise<Route[]> {
    const { rows } = await this.db.query('SELECT * FROM routes ORDER BY year, route_id');
    return rows.map(rowToRoute);
  }

  async findById(id: string): Promise<Route | null> {
    const { rows } = await this.db.query('SELECT * FROM routes WHERE id = $1', [id]);
    return rows.length > 0 ? rowToRoute(rows[0]) : null;
  }

  async findBaseline(): Promise<Route | null> {
    const { rows } = await this.db.query('SELECT * FROM routes WHERE is_baseline = TRUE LIMIT 1');
    return rows.length > 0 ? rowToRoute(rows[0]) : null;
  }

  async setBaseline(id: string): Promise<Route> {
    await this.db.query('UPDATE routes SET is_baseline = FALSE');
    const { rows } = await this.db.query(
      'UPDATE routes SET is_baseline = TRUE WHERE id = $1 RETURNING *',
      [id],
    );
    if (rows.length === 0) throw new Error(`Route ${id} not found.`);
    return rowToRoute(rows[0]);
  }

  async getComparison(): Promise<RouteComparison[]> {
    const baseline = await this.findBaseline();
    if (!baseline) throw new Error('No baseline set.');

    const all = await this.findAll();
    const comparisons = all.filter((r) => r.id !== baseline.id);

    return comparisons.map((comparison) => {
      const percentDiff = ((comparison.ghgIntensity / baseline.ghgIntensity) - 1) * 100;
      const compliant = comparison.ghgIntensity <= TARGET_GHG_INTENSITY;
      return { baseline, comparison, percentDiff, compliant };
    });
  }
}
