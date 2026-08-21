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
const purchasing = __importStar(require("../controllers/purchasingController"));
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Purchase Invoices
router.get('/invoices', (0, auth_1.authorize)('purchasing', 'purchase_invoices', 'view'), purchasing.getPurchaseInvoices);
router.get('/invoices/:id', (0, auth_1.authorize)('purchasing', 'purchase_invoices', 'view'), purchasing.getPurchaseInvoiceById);
router.post('/invoices', (0, auth_1.authorize)('purchasing', 'purchase_invoices', 'create'), purchasing.createPurchaseInvoice);
router.put('/invoices/:id', (0, auth_1.authorize)('purchasing', 'purchase_invoices', 'edit'), purchasing.updatePurchaseInvoice);
router.delete('/invoices/:id', (0, auth_1.authorize)('purchasing', 'purchase_invoices', 'delete'), purchasing.deletePurchaseInvoice);
router.post('/invoices/:id/post', (0, auth_1.authorize)('purchasing', 'purchase_invoices', 'approve'), purchasing.postPurchaseInvoice);
router.post('/invoices/:id/void', (0, auth_1.authorize)('purchasing', 'purchase_invoices', 'approve'), purchasing.voidPurchaseInvoice);
exports.default = router;
//# sourceMappingURL=purchasing.js.map