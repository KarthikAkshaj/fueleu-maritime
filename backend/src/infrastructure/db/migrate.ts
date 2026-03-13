import { db } from './client';

async function migrate(): Promise<void> {
  console.log('Running migrations...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS routes (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      route_id    VARCHAR(20)  NOT NULL UNIQUE,
      vessel_type VARCHAR(50)  NOT NULL,
      fuel_type   VARCHAR(20)  NOT NULL,
      year        INTEGER      NOT NULL,
      ghg_intensity     NUMERIC(10, 4) NOT NULL,
      fuel_consumption  NUMERIC(10, 2) NOT NULL,
      distance          NUMERIC(10, 2) NOT NULL,
      total_emissions   NUMERIC(10, 2) NOT NULL,
      is_baseline       BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS ship_compliance (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ship_id           VARCHAR(20)  NOT NULL,
      year              INTEGER      NOT NULL,
      ghg_intensity_actual  NUMERIC(10, 4) NOT NULL,
      ghg_intensity_target  NUMERIC(10, 4) NOT NULL,
      energy_in_scope       NUMERIC(20, 2) NOT NULL,
      cb_gco2eq             NUMERIC(20, 2) NOT NULL,
      computed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (ship_id, year)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS bank_entries (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ship_id         VARCHAR(20)  NOT NULL,
      year            INTEGER      NOT NULL,
      amount_gco2eq   NUMERIC(20, 2) NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS pools (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      year        INTEGER NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS pool_members (
      pool_id    UUID        NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
      ship_id    VARCHAR(20) NOT NULL,
      cb_before  NUMERIC(20, 2) NOT NULL,
      cb_after   NUMERIC(20, 2) NOT NULL,
      PRIMARY KEY (pool_id, ship_id)
    );
  `);

  console.log('Migrations complete.');
  await db.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
