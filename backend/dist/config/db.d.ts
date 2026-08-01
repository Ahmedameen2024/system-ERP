import { Pool, PoolClient } from 'pg';
declare const pool: Pool;
export declare const query: (text: string, params?: unknown[]) => Promise<import("pg").QueryResult<any>>;
export declare const getClient: () => Promise<PoolClient>;
export declare const transaction: <T>(callback: (client: PoolClient) => Promise<T>) => Promise<T>;
export declare const testConnection: () => Promise<void>;
export default pool;
//# sourceMappingURL=db.d.ts.map