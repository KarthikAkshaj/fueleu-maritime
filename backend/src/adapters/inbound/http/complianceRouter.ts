import { Router, Request, Response } from 'express';
import { ComputeCB } from '@core/application/ComputeCB';
import { IRouteRepository } from '@core/ports/IRouteRepository';
import { IComplianceRepository } from '@core/ports/IComplianceRepository';
import { IBankRepository } from '@core/ports/IBankRepository';

export function createComplianceRouter(
  routeRepo: IRouteRepository,
  complianceRepo: IComplianceRepository,
  bankRepo: IBankRepository,
): Router {
  const router = Router();
  const computeCB = new ComputeCB(routeRepo, complianceRepo);

  router.get('/cb', async (req: Request, res: Response) => {
    const { shipId, year } = req.query;
    if (!shipId || !year) {
      res.status(400).json({ error: 'shipId and year query params are required.' });
      return;
    }

    const cb = await computeCB.execute({
      shipId: String(shipId),
      year: Number(year),
    });
    res.json(cb);
  });

  router.get('/adjusted-cb', async (req: Request, res: Response) => {
    const { shipId, year } = req.query;
    if (!shipId || !year) {
      res.status(400).json({ error: 'shipId and year query params are required.' });
      return;
    }

    // Ensure CB is computed first
    const cb = await computeCB.execute({
      shipId: String(shipId),
      year: Number(year),
    });

    const banked = await bankRepo.getTotalBanked(String(shipId), Number(year));
    res.json({ ...cb, cbGco2eq: cb.cbGco2eq + banked, bankedSurplus: banked });
  });

  return router;
}
