export interface PoolMemberInput {
  shipId: string;
  adjustedCb: number;   // CB after banking adjustments
}

export interface PoolMember {
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface Pool {
  id: string;
  year: number;
  members: PoolMember[];
  createdAt: Date;
}

export interface PoolAllocationResult {
  valid: boolean;
  errors: string[];
  members: PoolMember[];
  poolSum: number;
}

/**
 * Greedy allocation per FuelEU Article 21.
 *
 * Rules:
 *  1. Sum(adjustedCB) >= 0  (pool must not be in aggregate deficit)
 *  2. A deficit ship cannot exit worse than it entered
 *  3. A surplus ship cannot exit with a negative CB
 *
 * Algorithm:
 *  - Sort members descending by CB (highest surplus first)
 *  - Transfer surplus into deficits until deficits are zeroed or surplus exhausted
 */
export function allocatePool(members: PoolMemberInput[]): PoolAllocationResult {
  const errors: string[] = [];
  const poolSum = members.reduce((sum, m) => sum + m.adjustedCb, 0);

  if (poolSum < 0) {
    errors.push('Pool aggregate compliance balance is negative. Pool sum must be >= 0.');
  }

  if (errors.length > 0) {
    return { valid: false, errors, members: [], poolSum };
  }

  // Work on a mutable copy sorted: surpluses first
  const sorted = [...members].sort((a, b) => b.adjustedCb - a.adjustedCb);
  const working = sorted.map((m) => ({ shipId: m.shipId, cbBefore: m.adjustedCb, cbAfter: m.adjustedCb }));

  // Greedy pass: move surplus from front to deficits at back
  let lo = 0;
  let hi = working.length - 1;

  while (lo < hi) {
    const surplus = working[lo];
    const deficit = working[hi];

    if (surplus.cbAfter <= 0) { lo++; continue; }
    if (deficit.cbAfter >= 0) { hi--; continue; }

    const transfer = Math.min(surplus.cbAfter, -deficit.cbAfter);
    surplus.cbAfter -= transfer;
    deficit.cbAfter += transfer;

    if (surplus.cbAfter === 0) lo++;
    if (deficit.cbAfter === 0) hi--;
  }

  // Validate post-allocation rules
  const postErrors: string[] = [];
  for (const m of working) {
    if (m.cbBefore < 0 && m.cbAfter < m.cbBefore) {
      postErrors.push(`Ship ${m.shipId}: deficit ship exits worse than it entered.`);
    }
    if (m.cbBefore > 0 && m.cbAfter < 0) {
      postErrors.push(`Ship ${m.shipId}: surplus ship exits with negative CB.`);
    }
  }

  if (postErrors.length > 0) {
    return { valid: false, errors: postErrors, members: [], poolSum };
  }

  return { valid: true, errors: [], members: working, poolSum };
}
