const express = require('express');
const router = express.Router();
const { getMyInvoices, getAllInvoices, getInvoiceById, payInvoice } = require('../controllers/invoice.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/role.middleware');

router.use(verifyToken);

// Invoices paths
router.get('/my-invoices', getMyInvoices);
router.get('/all', verifyToken, requireAdmin, getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/:id/pay', payInvoice);

module.exports = router;
