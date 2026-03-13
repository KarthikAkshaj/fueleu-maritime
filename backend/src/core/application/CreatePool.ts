import { Pool, PoolMemberInput, allocatePool } from '../domain/Pool';
import { IComplianceRepository } from '../ports/IComplianceRepository';
import { IPoolRepository } from '../ports/IPoolRepository';

export interface CreatePoolInput {
  year: number;
  shipIds: string[];
}

export class CreatePool {
  constructor(
    private readonly complianceRepo: IComplianceRepository,
    private readonly poolRepo: IPoolRepository,
  ) {}

  async execute({ year, shipIds }: CreatePoolInput): Promise<Pool> {
    if (shipIds.length < 2) {
      throw new Error('A pool requires at least 2 members.');
    }

    // Gather adjusted CB for each ship
    const members: PoolMemberInput[] = [];
    for (const shipId of shipIds) {
      const cb = await this.complianceRepo.findAdjustedCB(shipId, year);
      if (!cb) {
        throw new Error(`No compliance balance found for shipId="${shipId}" year=${year}.`);
      }
      members.push({ shipId, adjustedCb: cb.cbGco2eq });
    }

    const result = allocatePool(members);
    if (!result.valid) {
      throw new Error(result.errors.join(' '));
    }

    return this.poolRepo.save(year, result.members);
  }
}
