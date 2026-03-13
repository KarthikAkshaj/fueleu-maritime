/**
 * Integration tests for HTTP endpoints.
 *
 * These tests use in-memory mock repositories (no real database) to verify
 * the full HTTP → use-case → response pipeline without requiring a running
 * Postgres instance.
 */
import express from 'express';
import request from 'supertest';
import { createRoutesRouter } from '../routesRouter';
import { createComplianceRouter } from '../complianceRouter';
import { createBankingRouter } from '../bankingRouter';
import { createPoolsRouter } from '../poolsRouter';
import { errorHandler } from '@shared/errorHandler';
import type { IRouteRepository } from '@core/ports/IRouteRepository';
import type { IComplianceRepository } from '@core/ports/IComplianceRepository';
import type { IBankRepository } from '@core/ports/IBankRepository';
import type { IPoolRepository } from '@core/ports/IPoolRepository';
import type { Route, RouteComparison } from '@core/domain/Route';
import type { ComplianceBalance } from '@core/domain/Compliance';
import type { BankEntry } from '@core/domain/Banking';
import type { Pool, PoolMember } from '@core/domain/Pool';

// ── Seed data ────────────────────────────────────────────────────────────────

const baselineRoute: Route = {
  id: 'uuid-1',
  routeId: 'R001',
  vesselType: 'Container',
  fuelType: 'HFO',
  year: 2024,
  ghgIntensity: 91.0,
  fuelConsumption: 5000,
  distance: 12000,
  totalEmissions: 4500,
  isBaseline: true,
};

const otherRoute: Route = {
  id: 'uuid-2',
  routeId: 'R002',
  vesselType: 'BulkCarrier',
  fuelType: 'LNG',
  year: 2024,
  ghgIntensity: 88.0,
  fuelConsumption: 4800,
  distance: 11500,
  totalEmissions: 4200,
  isBaseline: false,
};

const mockCB: ComplianceBalance = {
  shipId: 'R002',
  year: 2024,
  ghgIntensityActual: 88.0,
  ghgIntensityTarget: 89.3368,
  energyInScope: 4800 * 41000,
  cbGco2eq: (89.3368 - 88.0) * 4800 * 41000,
};

// ── Mock repositories ─────────────────────────────────────────────────────────

const routeRepo: IRouteRepository = {
  findAll: jest.fn().mockResolvedValue([baselineRoute, otherRoute]),
  findById: jest.fn().mockImplementation((id: string) =>
    Promise.resolve(id === 'uuid-1' ? baselineRoute : id === 'uuid-2' ? otherRoute : null),
  ),
  findBaseline: jest.fn().mockResolvedValue(baselineRoute),
  setBaseline: jest.fn().mockResolvedValue({ ...otherRoute, isBaseline: true }),
  getComparison: jest.fn().mockResolvedValue([
    {
      baseline: baselineRoute,
      comparison: otherRoute,
      percentDiff: ((88.0 / 91.0) - 1) * 100,
      compliant: true,
    } as RouteComparison,
  ]),
};

const complianceRepo: IComplianceRepository = {
  findCB: jest.fn().mockResolvedValue(mockCB),
  saveCB: jest.fn().mockImplementation((cb: ComplianceBalance) => Promise.resolve(cb)),
  findAdjustedCB: jest.fn().mockResolvedValue(mockCB),
};

const bankRepo: IBankRepository = {
  findByShipAndYear: jest.fn().mockResolvedValue([] as BankEntry[]),
  getTotalBanked: jest.fn().mockResolvedValue(0),
  save: jest.fn().mockImplementation((e: Omit<BankEntry, 'id' | 'createdAt'>) =>
    Promise.resolve({ ...e, id: 'bank-1', createdAt: new Date() }),
  ),
  deduct: jest.fn().mockResolvedValue(undefined),
};

const poolRepo: IPoolRepository = {
  save: jest.fn().mockImplementation((year: number, members: PoolMember[]) =>
    Promise.resolve({ id: 'pool-1', year, members, createdAt: new Date() } as Pool),
  ),
  findById: jest.fn().mockResolvedValue(null),
};

// ── App setup ─────────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/routes', createRoutesRouter(routeRepo));
  app.use('/compliance', createComplianceRouter(routeRepo, complianceRepo, bankRepo));
  app.use('/banking', createBankingRouter(complianceRepo, bankRepo));
  app.use('/pools', createPoolsRouter(complianceRepo, poolRepo));
  app.use(errorHandler);
  return app;
}

const app = buildApp();

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /routes', () => {
  it('returns all routes', async () => {
    const res = await request(app).get('/routes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].routeId).toBe('R001');
  });
});

describe('POST /routes/:id/baseline', () => {
  it('sets a route as baseline', async () => {
    const res = await request(app).post('/routes/uuid-2/baseline');
    expect(res.status).toBe(200);
    expect(res.body.isBaseline).toBe(true);
  });

  it('returns 500 for unknown route', async () => {
    const res = await request(app).post('/routes/unknown/baseline');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/not found/);
  });
});

describe('GET /routes/comparison', () => {
  it('returns comparison data with percentDiff and compliant flag', async () => {
    const res = await request(app).get('/routes/comparison');
    expect(res.status).toBe(200);
    expect(res.body[0]).toHaveProperty('percentDiff');
    expect(res.body[0]).toHaveProperty('compliant');
  });
});

describe('GET /compliance/cb', () => {
  it('returns compliance balance for a ship/year', async () => {
    const res = await request(app).get('/compliance/cb?shipId=R002&year=2024');
    expect(res.status).toBe(200);
    expect(res.body.shipId).toBe('R002');
    expect(res.body).toHaveProperty('cbGco2eq');
  });

  it('returns 400 when query params missing', async () => {
    const res = await request(app).get('/compliance/cb');
    expect(res.status).toBe(400);
  });
});

describe('POST /banking/bank', () => {
  it('banks a positive CB', async () => {
    const res = await request(app)
      .post('/banking/bank')
      .send({ shipId: 'R002', year: 2024 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('banked');
  });

  it('returns 400 when body is missing fields', async () => {
    const res = await request(app).post('/banking/bank').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /banking/apply', () => {
  it('returns 500 when no banked surplus available', async () => {
    bankRepo.getTotalBanked = jest.fn().mockResolvedValue(0);
    const res = await request(app)
      .post('/banking/apply')
      .send({ shipId: 'R002', year: 2024, amount: 100 });
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/No banked surplus/);
  });
});

describe('POST /pools', () => {
  it('creates a pool with valid members', async () => {
    // Give both ships a positive CB so pool is valid
    complianceRepo.findAdjustedCB = jest.fn().mockResolvedValue({ ...mockCB, cbGco2eq: 500 });

    const res = await request(app)
      .post('/pools')
      .send({ year: 2024, shipIds: ['R001', 'R002'] });
    expect(res.status).toBe(201);
    expect(res.body.members).toHaveLength(2);
  });

  it('returns 400 when fewer than 2 members', async () => {
    const res = await request(app)
      .post('/pools')
      .send({ year: 2024, shipIds: ['R001'] });
    expect(res.status).toBe(400);
  });
});
