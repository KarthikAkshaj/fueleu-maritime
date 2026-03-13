import { Router, Request, Response } from 'express';
import { BankSurplus } from '@core/application/BankSurplus';
import { ApplyBanked } from '@core/application/ApplyBanked';
import { IComplianceRepository } from '@core/ports/IComplianceRepository';
import { IBankRepository } from '@core/ports/IBankRepository';

export function createBankingRouter(
  complianceRepo: IComplianceRepository,
  bankRepo: IBankRepository,
): Router {
  const router = Router();
  const bankSurplus = new BankSurplus(complianceRepo, bankRepo);
  const applyBanked = new ApplyBanked(complianceRepo, bankRepo);

  router.get('/records', async (req: Request, res: Response) => {
    const { shipId, year } = req.query;
    if (!shipId || !year) {
      res.status(400).json({ error: 'shipId and year query params are required.' });
      return;
    }
    const records = await bankRepo.findByShipAndYear(String(shipId), Number(year));
    const total = await bankRepo.getTotalBanked(String(shipId), Number(year));
    res.json({ records, totalBanked: total });
  });

  router.post('/bank', async (req: Request, res: Response) => {
    const { shipId, year } = req.body as { shipId: string; year: number };
    if (!shipId || !year) {
      res.status(400).json({ error: 'shipId and year are required.' });
      return;
    }
    const result = await bankSurplus.execute({ shipId, year: Number(year) });
    res.json(result);
  });

  router.post('/apply', async (req: Request, res: Response) => {
    const { shipId, year, amount } = req.body as { shipId: string; year: number; amount: number };
    if (!shipId || !year || amount === undefined) {
      res.status(400).json({ error: 'shipId, year, and amount are required.' });
      return;
    }
    const result = await applyBanked.execute({ shipId, year: Number(year), amount: Number(amount) });
    res.json(result);
  });

  return router;
}
