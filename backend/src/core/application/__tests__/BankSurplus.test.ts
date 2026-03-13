import { BankSurplus } from '../BankSurplus';
import { IComplianceRepository } from '@core/ports/IComplianceRepository';
import { IBankRepository } from '@core/ports/IBankRepository';
import { ComplianceBalance } from '@core/domain/Compliance';
import { BankEntry } from '@core/domain/Banking';

const surplusCB: ComplianceBalance = {
  shipId: 'R002',
  year: 2024,
  ghgIntensityActual: 88.0,
  ghgIntensityTarget: 89.3368,
  energyInScope: 4800 * 41000,
  cbGco2eq: (89.3368 - 88.0) * 4800 * 41000,
};

const deficitCB: ComplianceBalance = {
  ...surplusCB,
  ghgIntensityActual: 91.0,
  cbGco2eq: -1 * Math.abs(surplusCB.cbGco2eq),
};

const complianceRepo: jest.Mocked<IComplianceRepository> = {
  findCB: jest.fn(),
  saveCB: jest.fn(),
  findAdjustedCB: jest.fn(),
};

const bankRepo: jest.Mocked<IBankRepository> = {
  findByShipAndYear: jest.fn(),
  getTotalBanked: jest.fn(),
  save: jest.fn().mockImplementation((e: Omit<BankEntry, 'id' | 'createdAt'>) =>
    Promise.resolve({ ...e, id: 'bank-1', createdAt: new Date() }),
  ),
  deduct: jest.fn(),
};

describe('BankSurplus', () => {
  const useCase = new BankSurplus(complianceRepo, bankRepo);

  it('banks a positive CB', async () => {
    complianceRepo.findCB.mockResolvedValueOnce(surplusCB);
    const result = await useCase.execute({ shipId: 'R002', year: 2024 });

    expect(result.banked).toBeCloseTo(surplusCB.cbGco2eq, 0);
    expect(result.cbAfter).toBe(0);
    expect(bankRepo.save).toHaveBeenCalled();
  });

  it('rejects banking a deficit CB', async () => {
    complianceRepo.findCB.mockResolvedValueOnce(deficitCB);
    await expect(useCase.execute({ shipId: 'R002', year: 2024 })).rejects.toThrow('deficit');
  });

  it('throws when no CB found', async () => {
    complianceRepo.findCB.mockResolvedValueOnce(null);
    await expect(useCase.execute({ shipId: 'R002', year: 2024 })).rejects.toThrow('No compliance balance');
  });
});
