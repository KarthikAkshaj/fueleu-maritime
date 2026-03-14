import { Pool as PgPool } from 'pg';
import { Pool, PoolMember } from '../../../core/domain/Pool';
import { IPoolRepository } from '../../../core/ports/IPoolRepository';

export class PoolRepository implements IPoolRepository {
  constructor(private readonly db: PgPool) {}

  async save(year: number, members: PoolMember[]): Promise<Pool> {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        'INSERT INTO pools (year) VALUES ($1) RETURNING *',
        [year],
      );
      const pool = rows[0];

      for (const m of members) {
        await client.query(
          'INSERT INTO pool_members (pool_id, ship_id, cb_before, cb_after) VALUES ($1, $2, $3, $4)',
          [pool.id, m.shipId, m.cbBefore, m.cbAfter],
        );
      }

      await client.query('COMMIT');

      return {
        id: pool.id as string,
        year: Number(pool.year),
        members,
        createdAt: pool.created_at as Date,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Pool | null> {
    const { rows: poolRows } = await this.db.query(
      'SELECT * FROM pools WHERE id = $1',
      [id],
    );
    if (poolRows.length === 0) return null;

    const { rows: memberRows } = await this.db.query(
      'SELECT * FROM pool_members WHERE pool_id = $1',
      [id],
    );

    return {
      id: poolRows[0].id as string,
      year: Number(poolRows[0].year),
      createdAt: poolRows[0].created_at as Date,
      members: memberRows.map((r) => ({
        shipId: r.ship_id as string,
        cbBefore: Number(r.cb_before),
        cbAfter: Number(r.cb_after),
      })),
    };
  }
}
