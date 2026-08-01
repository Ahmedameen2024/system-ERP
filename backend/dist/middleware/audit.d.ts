import { Request, Response, NextFunction } from 'express';
export declare const auditLog: (tableName: string, actionType: string) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const errorHandler: (err: Error, req: Request, res: Response, _next: NextFunction) => void;
//# sourceMappingURL=audit.d.ts.map