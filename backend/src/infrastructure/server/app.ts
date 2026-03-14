import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db } from '../db/client';
import { RouteRepository } from '@adapters/outbound/postgres/RouteRepository';
import { ComplianceRepository } from '@adapters/outbound/postgres/ComplianceRepository';
import { BankRepository } from '@adapters/outbound/postgres/BankRepository';
import { PoolRepository } from '@adapters/outbound/postgres/PoolRepository';
import { createRoutesRouter } from '@adapters/inbound/http/routesRouter';
import { createComplianceRouter } from '@adapters/inbound/http/complianceRouter';
import { createBankingRouter } from '@adapters/inbound/http/bankingRouter';
import { createPoolsRouter } from '@adapters/inbound/http/poolsRouter';
import { errorHandler } from '@shared/errorHandler';

const routeRepo = new RouteRepository(db);
const complianceRepo = new ComplianceRepository(db);
const bankRepo = new BankRepository(db);
const poolRepo = new PoolRepository(db);

const app = express();
app.use(cors());
app.use(express.json());

app.use('/routes', createRoutesRouter(routeRepo));
app.use('/compliance', createComplianceRouter(routeRepo, complianceRepo, bankRepo));
app.use('/banking', createBankingRouter(complianceRepo, bankRepo));
app.use('/pools', createPoolsRouter(complianceRepo, poolRepo));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

export { app };
