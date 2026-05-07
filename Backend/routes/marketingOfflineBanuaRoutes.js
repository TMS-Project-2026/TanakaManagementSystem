const express = require('express');
const router = express.Router();
const controller = require('../controllers/marketingOfflineBanuaController');
const { verifyToken } = require('../middlewares/authMiddleware');

// CUSTOMER
router.get('/customers', verifyToken, controller.getCustomers);
router.post('/customers', verifyToken, controller.createCustomer);
router.put('/customers/:id', verifyToken, controller.updateCustomer);
router.delete('/customers/:id', verifyToken, controller.deleteCustomer);

// QUOTATION
router.get('/quotations', verifyToken, controller.getQuotations);
router.post('/quotations', verifyToken, controller.createQuotation);
router.put('/quotations/:id', verifyToken, controller.updateQuotation);
router.delete('/quotations/:id', verifyToken, controller.deleteQuotation);
router.post('/quotations/:id/submit', verifyToken, controller.ajukanQuotation);

// ORDER MANUAL
router.get('/orders', verifyToken, controller.getOrders);
router.post('/orders', verifyToken, controller.createOrder);
router.put('/orders/:id', verifyToken, controller.updateOrder);
router.delete('/orders/:id', verifyToken, controller.deleteOrder);
router.post('/orders/bulk', verifyToken, controller.bulkCreateOrders);
router.post('/orders/:id/submit', verifyToken, controller.ajukanOrder);

// INVENTORY & REPORTS
router.get('/inventory', verifyToken, controller.getInventory);
router.get('/reports', verifyToken, controller.getReports);
router.get('/promo', verifyToken, controller.getPromoStock);

module.exports = router;
