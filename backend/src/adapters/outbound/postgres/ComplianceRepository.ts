import { Pool as PgPool } from 'pg';
import { ComplianceBalance } from '../../../core/domain/Compliance';
import { IComplianceRepository } from '../../../core/ports/IComplianceRepository';

function rowToCB(row: Record<string, unknown>): ComplianceBalance {
  return {
    shipId: row.ship_id as string,
    year: Number(row.year),
    ghgIntensityActual: Number(row.ghg_intensity_actual),
    ghgIntensityTarget: Number(row.ghg_intensity_target),
    energyInScope: Number(row.energy_in_scope),
    cbGco2eq: Number(row.cb_gco2eq),
  };
}

export class ComplianceRepository implements IComplianceRepository {
  constructor(private readonly db: PgPool) {}

  async findCB(shipId: string, year: number): Promise<ComplianceBalance | null> {
    const { rows } = await this.db.query(
      'SELECT * FROM ship_compliance WHERE ship_id = $1 AND year = $2',
      [shipId, year],
    );
    return rows.length > 0 ? rowToCB(rows[0]) : null;
  }

  async saveCB(cb: ComplianceBalance): Promise<ComplianceBalance> {
    const { rows } = await this.db.query(
      `INSERT INTO ship_compliance (ship_id, year, ghg_intensity_actual, ghg_intensity_target, energy_in_scope, cb_gco2eq)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (ship_id, year) DO UPDATE SET
         ghg_intensity_actual = EXCLUDED.ghg_intensity_actual,
         ghg_intensity_target = EXCLUDED.ghg_intensity_target,
         energy_in_scope      = EXCLUDED.energy_in_scope,
         cb_gco2eq            = EXCLUDED.cb_gco2eq,
         computed_at          = NOW()
       RETURNING *`,
      [cb.shipId, cb.year, cb.ghgIntensityActual, cb.ghgIntensityTarget, cb.energyInScope, cb.cbGco2eq],
    );
    return rowToCB(rows[0]);
  }

  async findAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance | null> {
    // Adjusted CB = base CB + sum of applied bank entries
    const base = await this.findCB(shipId, year);
    if (!base) return null;

    const { rows } = await this.db.query(
      'SELECT COALESCE(SUM(amount_gco2eq), 0) AS total FROM bank_entries WHERE ship_id = $1 AND year = $2',
      [shipId, year],
    );
    const banked = Number(rows[0].total);

    return { ...base, cbGco2eq: base.cbGco2eq + banked };
  }
}
