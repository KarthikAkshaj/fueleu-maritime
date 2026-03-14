import { computeComplianceBalance, TARGET_GHG_INTENSITY, MJ_PER_TONNE_FUEL } from '../Compliance';

describe('computeComplianceBalance', () => {
  it('returns a deficit for above-target GHG intensity', () => {
    const cb = computeComplianceBalance('R001', 2024, 91.0, 5000);
    expect(cb.cbGco2eq).toBeLessThan(0);
    expect(cb.energyInScope).toBe(5000 * MJ_PER_TONNE_FUEL);
    expect(cb.ghgIntensityTarget).toBe(TARGET_GHG_INTENSITY);
  });

  it('returns a surplus for below-target GHG intensity', () => {
    const cb = computeComplianceBalance('R002', 2024, 88.0, 4800);
    expect(cb.cbGco2eq).toBeGreaterThan(0);
  });

  it('returns zero CB when exactly on target', () => {
    const cb = computeComplianceBalance('RX', 2025, TARGET_GHG_INTENSITY, 5000);
    expect(cb.cbGco2eq).toBe(0);
  });

  it('formula: CB = (target - actual) * fuelConsumption * MJ_PER_TONNE', () => {
    const fuel = 4000;
    const intensity = 90.0;
    const expected = (TARGET_GHG_INTENSITY - intensity) * fuel * MJ_PER_TONNE_FUEL;
    const cb = computeComplianceBalance('RY', 2024, intensity, fuel);
    expect(cb.cbGco2eq).toBeCloseTo(expected, 2);
  });
});
