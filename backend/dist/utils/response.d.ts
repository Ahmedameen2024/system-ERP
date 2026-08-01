import { Response } from 'express';
export declare const successResponse: (res: Response, data: unknown, message?: string, statusCode?: number) => Response;
export declare const errorResponse: (res: Response, message: string, statusCode?: number, errors?: unknown) => Response;
export declare const paginatedResponse: (res: Response, data: unknown[], total: number, page: number, limit: number, message?: string) => Response;
export declare const getPaginationParams: (query: Record<string, string | undefined>) => {
    page: number;
    limit: number;
    offset: number;
};
//# sourceMappingURL=response.d.ts.map