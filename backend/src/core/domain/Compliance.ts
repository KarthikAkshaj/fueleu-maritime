// FuelEU Maritime Regulation (EU) 2023/1805
// Target GHG intensity for 2025: 2% reduction from 91.16 gCO2e/MJ
export const TARGET_GHG_INTENSITY = 89.3368; // gCO2e/MJ
export const MJ_PER_TONNE_FUEL = 41_000;     // MJ/t (lower calorific value approximation)

export interface ComplianceBalance {
  shipId: string;
  year: number;
  ghgIntensityActual: number;
  ghgIntensityTarget: number;
  energyInScope: number;   // MJ
  cbGco2eq: number;        // Compliance Balance in gCO2e; positive = surplus, negative = deficit
}

/**
 * Computes the Compliance Balance for a ship-year.
 *
 * CB = (Target − Actual) × EnergyInScope
 *   where EnergyInScope ≈ fuelConsumption (t) × 41 000 MJ/t
 *
 * Positive CB  → surplus (over-performs target)
 * Negative CB  → deficit (under-performs target)
 */
export function computeComplianceBalance(
  shipId: string,
  year: number,
  ghgIntensityActual: number,
  fuelConsumptionTonnes: number,
): ComplianceBalance {
  const energyInScope = fuelConsumptionTonnes * MJ_PER_TONNE_FUEL;
  const cbGco2eq = (TARGET_GHG_INTENSITY - ghgIntensityActual) * energyInScope;

  return {
    shipId,
    year,
    ghgIntensityActual,
    ghgIntensityTarget: TARGET_GHG_INTENSITY,
    energyInScope,
    cbGco2eq,
  };
}
