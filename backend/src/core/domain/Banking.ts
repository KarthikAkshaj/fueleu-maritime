export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;   // always positive — stored surplus
  createdAt: Date;
}

export interface BankingResult {
  shipId: string;
  year: number;
  cbBefore: number;
  banked: number;
  cbAfter: number;
}

export interface ApplyBankedResult {
  shipId: string;
  year: number;
  cbBefore: number;
  applied: number;
  cbAfter: number;
  remainingBanked: number;
}
