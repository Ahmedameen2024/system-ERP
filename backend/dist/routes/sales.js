"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const sales = __importStar(require("../controllers/salesController"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Customers
router.get('/customers', (0, auth_1.authorize)('sales', 'customers', 'view'), sales.getCustomers);
router.post('/customers', (0, auth_1.authorize)('sales', 'customers', 'create'), sales.createCustomer);
router.put('/customers/:id', (0, auth_1.authorize)('sales', 'customers', 'edit'), sales.updateCustomer);
// Customer Statement
router.get('/customers/:customerId/statement', (0, auth_1.authorize)('sales', 'customers', 'view'), sales.getCustomerStatement);
// Sales Invoices
router.get('/invoices', (0, auth_1.authorize)('sales', 'sales_invoices', 'view'), sales.getSalesInvoices);
router.get('/invoices/:id', (0, auth_1.authorize)('sales', 'sales_invoices', 'view'), sales.getSalesInvoiceById);
router.post('/invoices', (0, auth_1.authorize)('sales', 'sales_invoices', 'create'), sales.createSalesInvoice);
router.put('/invoices/:id', (0, auth_1.authorize)('sales', 'sales_invoices', 'edit'), sales.updateSalesInvoice);
router.delete('/invoices/:id', (0, auth_1.authorize)('sales', 'sales_invoices', 'delete'), sales.deleteSalesInvoice);
router.post('/invoices/:id/post', (0, auth_1.authorize)('sales', 'sales_invoices', 'approve'), sales.postSalesInvoice);
router.post('/invoices/:id/void', (0, auth_1.authorize)('sales', 'sales_invoices', 'approve'), sales.voidSalesInvoice);
// Sales Returns
router.get('/returns', (0, auth_1.authorize)('sales', 'sales_returns', 'view'), sales.getSalesReturns);
router.post('/returns', (0, auth_1.authorize)('sales', 'sales_returns', 'create'), sales.createSalesReturn);
// Dashboard & Reports
router.get('/dashboard-stats', (0, auth_1.authorize)('sales', 'sales_invoices', 'view'), sales.getSalesDashboardStats);
exports.default = router;
//# sourceMappingURL=sales.js.map