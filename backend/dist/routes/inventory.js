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
const inventory = __importStar(require("../controllers/inventoryController"));
const router = (0, express_1.Router)();
// All inventory routes require authentication
router.use(auth_1.authenticate);
// UOMs
router.get('/uoms', (0, auth_1.authorize)('inventory', 'uoms', 'view'), inventory.getUOMs);
router.post('/uoms', (0, auth_1.authorize)('inventory', 'uoms', 'create'), inventory.createUOM);
router.put('/uoms/:id', (0, auth_1.authorize)('inventory', 'uoms', 'edit'), inventory.updateUOM);
// Categories
router.get('/categories', (0, auth_1.authorize)('inventory', 'categories', 'view'), inventory.getCategories);
router.post('/categories', (0, auth_1.authorize)('inventory', 'categories', 'create'), inventory.createCategory);
router.put('/categories/:id', (0, auth_1.authorize)('inventory', 'categories', 'edit'), inventory.updateCategory);
// Warehouses
router.get('/warehouses', (0, auth_1.authorize)('inventory', 'warehouses', 'view'), inventory.getWarehouses);
router.post('/warehouses', (0, auth_1.authorize)('inventory', 'warehouses', 'create'), inventory.createWarehouse);
router.put('/warehouses/:id', (0, auth_1.authorize)('inventory', 'warehouses', 'edit'), inventory.updateWarehouse);
// Items
router.get('/items', (0, auth_1.authorize)('inventory', 'items', 'view'), inventory.getItems);
router.post('/items', (0, auth_1.authorize)('inventory', 'items', 'create'), inventory.createItem);
router.put('/items/:id', (0, auth_1.authorize)('inventory', 'items', 'edit'), inventory.updateItem);
// Inventory Balances & Transactions
router.get('/balances', (0, auth_1.authorize)('inventory', 'balances', 'view'), inventory.getInventoryBalances);
router.get('/transactions', (0, auth_1.authorize)('inventory', 'transactions', 'view'), inventory.getTransactions);
router.post('/transactions', (0, auth_1.authorize)('inventory', 'transactions', 'create'), inventory.createInventoryTransaction);
exports.default = router;
//# sourceMappingURL=inventory.js.map