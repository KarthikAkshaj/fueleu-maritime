import { GetComparison } from '../GetComparison';
import { IRouteRepository } from '@core/ports/IRouteRepository';
import { Route, RouteComparison } from '@core/domain/Route';

const baseline: Route = {
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

const other: Route = {
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

const mockComparison: RouteComparison[] = [
  {
    baseline,
    comparison: other,
    percentDiff: ((88.0 / 91.0) - 1) * 100,
    compliant: true,
  },
];

const routeRepo: jest.Mocked<IRouteRepository> = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findBaseline: jest.fn(),
  setBaseline: jest.fn(),
  getComparison: jest.fn().mockResolvedValue(mockComparison),
};

describe('GetComparison', () => {
  const useCase = new GetComparison(routeRepo);

  beforeEach(() => jest.clearAllMocks());

  it('returns comparison data when a baseline is set', async () => {
    routeRepo.findBaseline.mockResolvedValueOnce(baseline);
    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].baseline.routeId).toBe('R001');
    expect(result[0].comparison.routeId).toBe('R002');
    expect(result[0].compliant).toBe(true);
    expect(result[0].percentDiff).toBeCloseTo(-3.3, 1);
  });

  it('throws when no baseline is set', async () => {
    routeRepo.findBaseline.mockResolvedValueOnce(null);
    await expect(useCase.execute()).rejects.toThrow('No baseline route has been set');
  });

  it('marks a route as non-compliant when above target (93.5 > 89.3368)', async () => {
    const highIntensityRoute: Route = { ...other, ghgIntensity: 93.5, routeId: 'R003' };
    routeRepo.findBaseline.mockResolvedValueOnce(baseline);
    routeRepo.getComparison.mockResolvedValueOnce([
      {
        baseline,
        comparison: highIntensityRoute,
        percentDiff: ((93.5 / 91.0) - 1) * 100,
        compliant: false,
      },
    ]);

    const result = await useCase.execute();
    expect(result[0].compliant).toBe(false);
    expect(result[0].percentDiff).toBeGreaterThan(0);
  });
});
