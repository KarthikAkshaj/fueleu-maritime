import { allocatePool, PoolMemberInput } from '../Pool';

describe('allocatePool', () => {
  it('distributes surplus to deficit members', () => {
    const members: PoolMemberInput[] = [
      { shipId: 'R002', adjustedCb: 200 },   // surplus
      { shipId: 'R001', adjustedCb: -100 },  // deficit
    ];
    const result = allocatePool(members);

    expect(result.valid).toBe(true);
    const r002 = result.members.find((m) => m.shipId === 'R002')!;
    const r001 = result.members.find((m) => m.shipId === 'R001')!;

    expect(r001.cbAfter).toBe(0);
    expect(r002.cbAfter).toBe(100);
  });

  it('rejects a pool with negative aggregate CB', () => {
    const members: PoolMemberInput[] = [
      { shipId: 'A', adjustedCb: -100 },
      { shipId: 'B', adjustedCb: -50 },
    ];
    const result = allocatePool(members);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/negative/);
  });

  it('keeps surplus ships non-negative after allocation', () => {
    const members: PoolMemberInput[] = [
      { shipId: 'S1', adjustedCb: 50 },
      { shipId: 'D1', adjustedCb: -30 },
    ];
    const result = allocatePool(members);
    expect(result.valid).toBe(true);
    result.members.forEach((m) => expect(m.cbAfter).toBeGreaterThanOrEqual(0));
  });

  it('handles exact balance (poolSum = 0)', () => {
    const members: PoolMemberInput[] = [
      { shipId: 'S1', adjustedCb: 100 },
      { shipId: 'D1', adjustedCb: -100 },
    ];
    const result = allocatePool(members);
    expect(result.valid).toBe(true);
    expect(result.poolSum).toBe(0);
    result.members.forEach((m) => expect(m.cbAfter).toBe(0));
  });
});
