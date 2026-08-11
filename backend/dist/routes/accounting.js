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
const accounting = __importStar(require("../controllers/accountingController"));
const router = (0, express_1.Router)();
// All accounting routes require authentication
router.use(auth_1.authenticate);
// GL Accounts
router.get('/accounts', (0, auth_1.authorize)('accounting', 'chart_of_accounts', 'view'), accounting.getAccounts);
router.post('/accounts', (0, auth_1.authorize)('accounting', 'chart_of_accounts', 'create'), accounting.createAccount);
router.put('/accounts/:id', (0, auth_1.authorize)('accounting', 'chart_of_accounts', 'edit'), accounting.updateAccount);
// Cost Centers
router.get('/cost-centers', (0, auth_1.authorize)('accounting', 'chart_of_accounts', 'view'), accounting.getCostCenters);
router.post('/cost-centers', (0, auth_1.authorize)('accounting', 'chart_of_accounts', 'create'), accounting.createCostCenter);
router.put('/cost-centers/:id', (0, auth_1.authorize)('accounting', 'chart_of_accounts', 'edit'), accounting.updateCostCenter);
// Journal Entries
router.get('/journal-entries', (0, auth_1.authorize)('accounting', 'journal_entries', 'view'), accounting.getJournalEntries);
router.get('/journal-entries/:id', (0, auth_1.authorize)('accounting', 'journal_entries', 'view'), accounting.getJournalEntryById);
router.post('/journal-entries', (0, auth_1.authorize)('accounting', 'journal_entries', 'create'), accounting.createJournalEntry);
router.put('/journal-entries/:id', (0, auth_1.authorize)('accounting', 'journal_entries', 'edit'), accounting.updateJournalEntry);
router.put('/journal-entries/:id/status', (0, auth_1.authorize)('accounting', 'journal_entries', 'edit'), accounting.updateJournalEntryStatus);
// Opening Balances
router.get('/opening-balances', (0, auth_1.authorize)('accounting', 'chart_of_accounts', 'view'), accounting.getOpeningBalances);
router.post('/opening-balances', (0, auth_1.authorize)('accounting', 'chart_of_accounts', 'create'), accounting.createOpeningBalance);
router.put('/opening-balances/:id', (0, auth_1.authorize)('accounting', 'chart_of_accounts', 'edit'), accounting.updateOpeningBalance);
router.delete('/opening-balances/:id', (0, auth_1.authorize)('accounting', 'chart_of_accounts', 'delete'), accounting.deleteOpeningBalance);
router.post('/opening-balances/:id/post', (0, auth_1.authorize)('accounting', 'chart_of_accounts', 'approve'), accounting.postOpeningBalance);
// Receipt Vouchers
router.get('/receipt-vouchers', (0, auth_1.authorize)('vouchers', 'receipt_vouchers', 'view'), accounting.getReceiptVouchers);
router.post('/receipt-vouchers', (0, auth_1.authorize)('vouchers', 'receipt_vouchers', 'create'), accounting.createReceiptVoucher);
router.put('/receipt-vouchers/:id/status', (0, auth_1.authorize)('vouchers', 'receipt_vouchers', 'edit'), accounting.updateReceiptVoucherStatus);
// Payment Vouchers
router.get('/payment-vouchers', (0, auth_1.authorize)('vouchers', 'payment_vouchers', 'view'), accounting.getPaymentVouchers);
router.post('/payment-vouchers', (0, auth_1.authorize)('vouchers', 'payment_vouchers', 'create'), accounting.createPaymentVoucher);
router.put('/payment-vouchers/:id/status', (0, auth_1.authorize)('vouchers', 'payment_vouchers', 'edit'), accounting.updatePaymentVoucherStatus);
exports.default = router;
//# sourceMappingURL=accounting.js.map