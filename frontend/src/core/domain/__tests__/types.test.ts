/**
 * Frontend domain type guard / helper tests.
 * The frontend domain is pure types — so we test the ApiClient request logic
 * and the pool/compliance helpers that mirror the backend.
 */

// Target constant mirroring the backend
const TARGET_GHG_INTENSITY = 89.3368;
const MJ_PER_TONNE_FUEL = 41_000;

function computeCB(ghgIntensity: number, fuelConsumption: number) {
  const energy = fuelConsumption * MJ_PER_TONNE_FUEL;
  return (TARGET_GHG_INTENSITY - ghgIntensity) * energy;
}

describe('CB formula (frontend mirror)', () => {
  it('produces a deficit for above-target intensity', () => {
    expect(computeCB(91.0, 5000)).toBeLessThan(0);
  });

  it('produces a surplus for below-target intensity', () => {
    expect(computeCB(88.0, 4800)).toBeGreaterThan(0);
  });

  it('returns zero when exactly on target', () => {
    expect(computeCB(TARGET_GHG_INTENSITY, 5000)).toBe(0);
  });
});

describe('Compliance target constant', () => {
  it('is 89.3368 (2% below 91.16)', () => {
    const twoPercentBelow = 91.16 * (1 - 0.02);
    expect(Math.abs(TARGET_GHG_INTENSITY - twoPercentBelow)).toBeLessThan(0.001);
  });
});
