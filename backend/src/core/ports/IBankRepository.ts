import { BankEntry } from '../domain/Banking';

export interface IBankRepository {
  findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]>;
  getTotalBanked(shipId: string, year: number): Promise<number>;
  save(entry: Omit<BankEntry, 'id' | 'createdAt'>): Promise<BankEntry>;
  deduct(shipId: string, year: number, amount: number): Promise<void>;
}
