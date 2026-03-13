import { ComputeCB } from '../ComputeCB';
import { TARGET_GHG_INTENSITY, MJ_PER_TONNE_FUEL } from '@core/domain/Compliance';
import { IRouteRepository } from '@core/ports/IRouteRepository';
import { IComplianceRepository } from '@core/ports/IComplianceRepository';
import { Route } from '@core/domain/Route';
import { ComplianceBalance } from '@core/domain/Compliance';

const mockRoute: Route = {
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

const routeRepo: jest.Mocked<IRouteRepository> = {
  findAll: jest.fn().mockResolvedValue([mockRoute]),
  findById: jest.fn(),
  findBaseline: jest.fn(),
  setBaseline: jest.fn(),
  getComparison: jest.fn(),
};

const complianceRepo: jest.Mocked<IComplianceRepository> = {
  findCB: jest.fn(),
  saveCB: jest.fn().mockImplementation((cb: ComplianceBalance) => Promise.resolve(cb)),
  findAdjustedCB: jest.fn(),
};

describe('ComputeCB', () => {
  const useCase = new ComputeCB(routeRepo, complianceRepo);

  it('calculates a negative CB for a route above target intensity', async () => {
    const result = await useCase.execute({ shipId: 'R001', year: 2024 });

    const expectedEnergy = 5000 * MJ_PER_TONNE_FUEL;
    const expectedCB = (TARGET_GHG_INTENSITY - 91.0) * expectedEnergy;

    expect(result.energyInScope).toBe(expectedEnergy);
    expect(result.cbGco2eq).toBeCloseTo(expectedCB, 0);
    expect(result.cbGco2eq).toBeLessThan(0); // 91.0 > 89.3368 → deficit
  });

  it('throws when no route found', async () => {
    routeRepo.findAll.mockResolvedValueOnce([]);
    await expect(useCase.execute({ shipId: 'MISSING', year: 2024 })).rejects.toThrow('No route found');
  });
});
