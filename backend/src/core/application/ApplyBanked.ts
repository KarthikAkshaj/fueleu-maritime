import { ApplyBankedResult } from '../domain/Banking';
import { IComplianceRepository } from '../ports/IComplianceRepository';
import { IBankRepository } from '../ports/IBankRepository';

export interface ApplyBankedInput {
  shipId: string;
  year: number;
  amount: number;
}

export class ApplyBanked {
  constructor(
    private readonly complianceRepo: IComplianceRepository,
    private readonly bankRepo: IBankRepository,
  ) {}

  async execute({ shipId, year, amount }: ApplyBankedInput): Promise<ApplyBankedResult> {
    if (amount <= 0) {
      throw new Error('Amount to apply must be positive.');
    }

    const cb = await this.complianceRepo.findCB(shipId, year);
    if (!cb) {
      throw new Error(`No compliance balance found for shipId="${shipId}" year=${year}. Compute it first.`);
    }

    const totalBanked = await this.bankRepo.getTotalBanked(shipId, year);
    if (totalBanked <= 0) {
      throw new Error(`No banked surplus available for shipId="${shipId}" year=${year}.`);
    }

    if (amount > totalBanked) {
      throw new Error(
        `Cannot apply ${amount.toFixed(2)} gCO2e — only ${totalBanked.toFixed(2)} gCO2e banked.`,
      );
    }

    const cbBefore = cb.cbGco2eq;
    await this.bankRepo.deduct(shipId, year, amount);

    const updated = await this.complianceRepo.saveCB({
      ...cb,
      cbGco2eq: cbBefore + amount,
    });

    return {
      shipId,
      year,
      cbBefore,
      applied: amount,
      cbAfter: updated.cbGco2eq,
      remainingBanked: totalBanked - amount,
    };
  }
}
