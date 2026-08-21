import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as purchasing from '../controllers/purchasingController';

const router = Router();
router.use(authenticate);

// Purchase Invoices
router.get('/invoices', authorize('purchasing', 'purchase_invoices', 'view'), purchasing.getPurchaseInvoices);
router.get('/invoices/:id', authorize('purchasing', 'purchase_invoices', 'view'), purchasing.getPurchaseInvoiceById);
router.post('/invoices', authorize('purchasing', 'purchase_invoices', 'create'), purchasing.createPurchaseInvoice);
router.put('/invoices/:id', authorize('purchasing', 'purchase_invoices', 'edit'), purchasing.updatePurchaseInvoice);
router.delete('/invoices/:id', authorize('purchasing', 'purchase_invoices', 'delete'), purchasing.deletePurchaseInvoice);
router.post('/invoices/:id/post', authorize('purchasing', 'purchase_invoices', 'approve'), purchasing.postPurchaseInvoice);
router.post('/invoices/:id/void', authorize('purchasing', 'purchase_invoices', 'approve'), purchasing.voidPurchaseInvoice);

export default router;
