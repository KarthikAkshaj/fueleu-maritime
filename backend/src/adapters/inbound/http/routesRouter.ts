import { Router, Request, Response } from 'express';
import { GetRoutes } from '../../../core/application/GetRoutes';
import { SetBaseline } from '../../../core/application/SetBaseline';
import { GetComparison } from '../../../core/application/GetComparison';
import { IRouteRepository } from '../../../core/ports/IRouteRepository';

export function createRoutesRouter(routeRepo: IRouteRepository): Router {
  const router = Router();
  const getRoutes = new GetRoutes(routeRepo);
  const setBaseline = new SetBaseline(routeRepo);
  const getComparison = new GetComparison(routeRepo);

  router.get('/', async (_req: Request, res: Response) => {
    const routes = await getRoutes.execute();
    res.json(routes);
  });

  router.post('/:id/baseline', async (req: Request, res: Response) => {
    const route = await setBaseline.execute(String(req.params.id));
    res.json(route);
  });

  router.get('/comparison', async (_req: Request, res: Response) => {
    const comparison = await getComparison.execute();
    res.json(comparison);
  });

  return router;
}
