import { Pool, PoolMember } from '../domain/Pool';

export interface IPoolRepository {
  save(year: number, members: PoolMember[]): Promise<Pool>;
  findById(id: string): Promise<Pool | null>;
}
