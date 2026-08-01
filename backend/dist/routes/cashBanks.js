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
const cashBanks = __importStar(require("../controllers/cashBanksController"));
const router = (0, express_1.Router)();
// All cash-banks routes require authentication
router.use(auth_1.authenticate);
// Cash Boxes Routes
router.get('/cash-boxes', cashBanks.getCashBoxes);
router.get('/cash-boxes/:id', cashBanks.getCashBoxById);
router.post('/cash-boxes', (0, auth_1.authorize)('system', 'cash_boxes', 'create'), cashBanks.createCashBox);
router.put('/cash-boxes/:id', (0, auth_1.authorize)('system', 'cash_boxes', 'edit'), cashBanks.updateCashBox);
router.delete('/cash-boxes/:id', (0, auth_1.authorize)('system', 'cash_boxes', 'delete'), cashBanks.deleteCashBox);
// Bank Accounts Routes
router.get('/bank-accounts', cashBanks.getBankAccounts);
router.get('/bank-accounts/:id', cashBanks.getBankAccountById);
router.post('/bank-accounts', (0, auth_1.authorize)('system', 'bank_accounts', 'create'), cashBanks.createBankAccount);
router.put('/bank-accounts/:id', (0, auth_1.authorize)('system', 'bank_accounts', 'edit'), cashBanks.updateBankAccount);
router.delete('/bank-accounts/:id', (0, auth_1.authorize)('system', 'bank_accounts', 'delete'), cashBanks.deleteBankAccount);
exports.default = router;
//# sourceMappingURL=cashBanks.js.map