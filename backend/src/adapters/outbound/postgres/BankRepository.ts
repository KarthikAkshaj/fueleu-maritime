import { Pool as PgPool } from 'pg';
import { BankEntry } from '@core/domain/Banking';
import { IBankRepository } from '@core/ports/IBankRepository';

function rowToEntry(row: Record<string, unknown>): BankEntry {
  return {
    id: row.id as string,
    shipId: row.ship_id as string,
    year: Number(row.year),
    amountGco2eq: Number(row.amount_gco2eq),
    createdAt: row.created_at as Date,
  };
}

export class BankRepository implements IBankRepository {
  constructor(private readonly db: PgPool) {}

  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    const { rows } = await this.db.query(
      'SELECT * FROM bank_entries WHERE ship_id = $1 AND year = $2 ORDER BY created_at',
      [shipId, year],
    );
    return rows.map(rowToEntry);
  }

  async getTotalBanked(shipId: string, year: number): Promise<number> {
    const { rows } = await this.db.query(
      'SELECT COALESCE(SUM(amount_gco2eq), 0) AS total FROM bank_entries WHERE ship_id = $1 AND year = $2',
      [shipId, year],
    );
    return Number(rows[0].total);
  }

  async save(entry: Omit<BankEntry, 'id' | 'createdAt'>): Promise<BankEntry> {
    const { rows } = await this.db.query(
      'INSERT INTO bank_entries (ship_id, year, amount_gco2eq) VALUES ($1, $2, $3) RETURNING *',
      [entry.shipId, entry.year, entry.amountGco2eq],
    );
    return rowToEntry(rows[0]);
  }

  async deduct(shipId: string, year: number, amount: number): Promise<void> {
    // Deduct by inserting a negative entry (preserves audit trail)
    await this.db.query(
      'INSERT INTO bank_entries (ship_id, year, amount_gco2eq) VALUES ($1, $2, $3)',
      [shipId, year, -amount],
    );
  }
}
