import { ApplyBanked } from '../ApplyBanked';
import { IComplianceRepository } from '@core/ports/IComplianceRepository';
import { IBankRepository } from '@core/ports/IBankRepository';
import { ComplianceBalance } from '@core/domain/Compliance';

const deficitCB: ComplianceBalance = {
  shipId: 'R001',
  year: 2024,
  ghgIntensityActual: 91.0,
  ghgIntensityTarget: 89.3368,
  energyInScope: 5000 * 41000,
  cbGco2eq: (89.3368 - 91.0) * 5000 * 41000, // negative
};

const complianceRepo: jest.Mocked<IComplianceRepository> = {
  findCB: jest.fn(),
  saveCB: jest.fn().mockImplementation((cb: ComplianceBalance) => Promise.resolve(cb)),
  findAdjustedCB: jest.fn(),
};

const bankRepo: jest.Mocked<IBankRepository> = {
  findByShipAndYear: jest.fn(),
  getTotalBanked: jest.fn(),
  save: jest.fn(),
  deduct: jest.fn().mockResolvedValue(undefined),
};

describe('ApplyBanked', () => {
  const useCase = new ApplyBanked(complianceRepo, bankRepo);

  beforeEach(() => jest.clearAllMocks());

  it('applies banked surplus to a deficit', async () => {
    complianceRepo.findCB.mockResolvedValue(deficitCB);
    bankRepo.getTotalBanked.mockResolvedValue(500_000_000);

    const result = await useCase.execute({ shipId: 'R001', year: 2024, amount: 200_000_000 });

    expect(result.applied).toBe(200_000_000);
    expect(result.cbAfter).toBeCloseTo(deficitCB.cbGco2eq + 200_000_000, 0);
    expect(bankRepo.deduct).toHaveBeenCalledWith('R001', 2024, 200_000_000);
  });

  it('rejects over-application', async () => {
    complianceRepo.findCB.mockResolvedValue(deficitCB);
    bankRepo.getTotalBanked.mockResolvedValue(100);

    await expect(
      useCase.execute({ shipId: 'R001', year: 2024, amount: 999 }),
    ).rejects.toThrow('Cannot apply');
  });

  it('rejects zero or negative amount', async () => {
    await expect(
      useCase.execute({ shipId: 'R001', year: 2024, amount: 0 }),
    ).rejects.toThrow('positive');
  });
});
