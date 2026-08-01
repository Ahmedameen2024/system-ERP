import { Request, Response, NextFunction } from 'express';
export interface JwtPayload {
    userId: string;
    username: string;
    roleId: string;
    companyId: string;
    branchId: string;
}
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const authorize: (module: string, screen: string, action: "view" | "create" | "edit" | "delete" | "approve" | "print" | "export") => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map