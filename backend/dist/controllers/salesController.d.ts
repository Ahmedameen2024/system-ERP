import { Request, Response } from 'express';
export declare const getCustomers: (req: Request, res: Response) => Promise<void>;
export declare const createCustomer: (req: Request, res: Response) => Promise<void>;
export declare const updateCustomer: (req: Request, res: Response) => Promise<void>;
export declare const getSalesInvoices: (req: Request, res: Response) => Promise<void>;
export declare const getSalesInvoiceById: (req: Request, res: Response) => Promise<void>;
export declare const createSalesInvoice: (req: Request, res: Response) => Promise<void>;
export declare const postSalesInvoice: (req: Request, res: Response) => Promise<void>;
export declare const voidSalesInvoice: (req: Request, res: Response) => Promise<void>;
export declare const getSalesDashboardStats: (req: Request, res: Response) => Promise<void>;
export declare const getCustomerStatement: (req: Request, res: Response) => Promise<void>;
export declare const getSalesReturns: (req: Request, res: Response) => Promise<void>;
export declare const createSalesReturn: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=salesController.d.ts.map