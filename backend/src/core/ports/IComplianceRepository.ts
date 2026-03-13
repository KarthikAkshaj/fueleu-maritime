import { ComplianceBalance } from '../domain/Compliance';

export interface IComplianceRepository {
  findCB(shipId: string, year: number): Promise<ComplianceBalance | null>;
  saveCB(cb: ComplianceBalance): Promise<ComplianceBalance>;
  findAdjustedCB(shipId: string, year: number): Promise<ComplianceBalance | null>;
}
