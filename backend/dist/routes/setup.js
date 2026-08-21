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
const setup = __importStar(require("../controllers/setupController"));
const cashBanks = __importStar(require("../controllers/cashBanksController"));
const router = (0, express_1.Router)();
// All setup routes require authentication
router.use(auth_1.authenticate);
// Company Profile
router.get('/company', setup.getCompany);
router.put('/company', (0, auth_1.authorize)('system', 'company_profile', 'edit'), setup.updateCompany);
// Branches
router.get('/branches', (0, auth_1.authorize)('system', 'branches', 'view'), setup.getBranches);
router.post('/branches', (0, auth_1.authorize)('system', 'branches', 'create'), setup.createBranch);
router.put('/branches/:id', (0, auth_1.authorize)('system', 'branches', 'edit'), setup.updateBranch);
router.delete('/branches/:id', (0, auth_1.authorize)('system', 'branches', 'delete'), setup.deleteBranch);
// Currencies
router.get('/currencies', setup.getCurrencies);
router.post('/currencies', (0, auth_1.authorize)('system', 'currencies', 'create'), setup.createCurrency);
router.put('/currencies/:id', (0, auth_1.authorize)('system', 'currencies', 'edit'), setup.updateCurrency);
// Exchange Rates
router.get('/exchange-rates', (0, auth_1.authorize)('system', 'exchange_rates', 'view'), setup.getExchangeRates);
router.post('/exchange-rates', (0, auth_1.authorize)('system', 'exchange_rates', 'create'), setup.createExchangeRate);
// Users
router.get('/users', (0, auth_1.authorize)('system', 'users', 'view'), setup.getUsers);
router.post('/users', (0, auth_1.authorize)('system', 'users', 'create'), setup.createUser);
router.put('/users/:id', (0, auth_1.authorize)('system', 'users', 'edit'), setup.updateUser);
// Roles
router.get('/roles', setup.getRoles);
router.post('/roles', (0, auth_1.authorize)('system', 'roles', 'create'), setup.createRole);
// Permissions
router.get('/permissions/:roleId', (0, auth_1.authorize)('system', 'permissions', 'view'), setup.getPermissions);
router.put('/permissions/:roleId', (0, auth_1.authorize)('system', 'permissions', 'edit'), setup.updatePermissions);
// Settings
router.get('/settings', setup.getSettings);
router.put('/settings', (0, auth_1.authorize)('system', 'company_profile', 'edit'), setup.updateSettings);
// Lookup data (available to all authenticated users)
router.get('/payment-methods', setup.getPaymentMethods);
router.get('/taxes', setup.getTaxes);
router.get('/departments', setup.getDepartments);
router.post('/departments', (0, auth_1.authorize)('system', 'branches', 'create'), setup.createDepartment);
router.get('/suppliers', setup.getSuppliers);
router.post('/suppliers', setup.createSupplier);
router.put('/suppliers/:id', setup.updateSupplier);
router.get('/financial-periods', setup.getFinancialPeriods);
// Cash & Bank Masters under Setup
router.get('/cash-boxes', cashBanks.getCashBoxes);
router.get('/cash-boxes/:id', cashBanks.getCashBoxById);
router.post('/cash-boxes', (0, auth_1.authorize)('system', 'cash_boxes', 'create'), cashBanks.createCashBox);
router.put('/cash-boxes/:id', (0, auth_1.authorize)('system', 'cash_boxes', 'edit'), cashBanks.updateCashBox);
router.delete('/cash-boxes/:id', (0, auth_1.authorize)('system', 'cash_boxes', 'delete'), cashBanks.deleteCashBox);
router.get('/bank-accounts', cashBanks.getBankAccounts);
router.get('/bank-accounts/:id', cashBanks.getBankAccountById);
router.post('/bank-accounts', (0, auth_1.authorize)('system', 'bank_accounts', 'create'), cashBanks.createBankAccount);
router.put('/bank-accounts/:id', (0, auth_1.authorize)('system', 'bank_accounts', 'edit'), cashBanks.updateBankAccount);
router.delete('/bank-accounts/:id', (0, auth_1.authorize)('system', 'bank_accounts', 'delete'), cashBanks.deleteBankAccount);
// Currency Transfers & FX Exchange
router.get('/currency-transfers', cashBanks.getCurrencyTransfers);
router.post('/currency-transfers', cashBanks.createCurrencyTransfer);
exports.default = router;
//# sourceMappingURL=setup.js.map