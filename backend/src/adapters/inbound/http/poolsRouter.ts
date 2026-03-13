import { Router, Request, Response } from 'express';
import { CreatePool } from '@core/application/CreatePool';
import { IComplianceRepository } from '@core/ports/IComplianceRepository';
import { IPoolRepository } from '@core/ports/IPoolRepository';

export function createPoolsRouter(
  complianceRepo: IComplianceRepository,
  poolRepo: IPoolRepository,
): Router {
  const router = Router();
  const createPool = new CreatePool(complianceRepo, poolRepo);

  router.post('/', async (req: Request, res: Response) => {
    const { year, shipIds } = req.body as { year: number; shipIds: string[] };
    if (!year || !Array.isArray(shipIds) || shipIds.length < 2) {
      res.status(400).json({ error: 'year and shipIds (min 2 members) are required.' });
      return;
    }
    const pool = await createPool.execute({ year: Number(year), shipIds });
    res.status(201).json(pool);
  });

  return router;
}
