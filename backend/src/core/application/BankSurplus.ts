import { BankingResult } from '../domain/Banking';
import { IComplianceRepository } from '../ports/IComplianceRepository';
import { IBankRepository } from '../ports/IBankRepository';

export interface BankSurplusInput {
  shipId: string;
  year: number;
}

export class BankSurplus {
  constructor(
    private readonly complianceRepo: IComplianceRepository,
    private readonly bankRepo: IBankRepository,
  ) {}

  async execute({ shipId, year }: BankSurplusInput): Promise<BankingResult> {
    const cb = await this.complianceRepo.findCB(shipId, year);
    if (!cb) {
      throw new Error(`No compliance balance found for shipId="${shipId}" year=${year}. Compute it first.`);
    }

    if (cb.cbGco2eq <= 0) {
      throw new Error(`Cannot bank a deficit or zero CB (${cb.cbGco2eq.toFixed(2)} gCO2e).`);
    }

    const cbBefore = cb.cbGco2eq;
    await this.bankRepo.save({ shipId, year, amountGco2eq: cbBefore });

    return {
      shipId,
      year,
      cbBefore,
      banked: cbBefore,
      cbAfter: 0,
    };
  }
}
