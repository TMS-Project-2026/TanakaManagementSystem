const express = require('express');
const router = express.Router();
const marketingOfflineTanakaController = require('../controllers/marketingOfflineTanakaController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// Middleware untuk memastikan hanya role marketing_offline_tanaka, admin, manager, owner yang bisa akses
const allowAccess = checkRole(['marketing_offline_tanaka', 'marketing_offline_banua', 'marketing_offline', 'marketing', 'Marketing', 'Admin', 'Manager', 'owner']);

// Customers
router.get('/customers', verifyToken, allowAccess, marketingOfflineTanakaController.getCustomers);
router.post('/customers', verifyToken, allowAccess, marketingOfflineTanakaController.createCustomer);
router.put('/customers/:id', verifyToken, allowAccess, marketingOfflineTanakaController.updateCustomer);
router.delete('/customers/:id', verifyToken, allowAccess, marketingOfflineTanakaController.deleteCustomer);

// Quotations
router.get('/quotations', verifyToken, allowAccess, marketingOfflineTanakaController.getQuotations);
router.post('/quotations', verifyToken, allowAccess, marketingOfflineTanakaController.createQuotation);
router.put('/quotations/:id', verifyToken, allowAccess, marketingOfflineTanakaController.updateQuotation);
router.delete('/quotations/:id', verifyToken, allowAccess, marketingOfflineTanakaController.deleteQuotation);
router.post('/quotations/:id/ajukan', verifyToken, allowAccess, marketingOfflineTanakaController.ajukanQuotation);

// Orders
router.get('/orders', verifyToken, allowAccess, marketingOfflineTanakaController.getOrders);
router.post('/orders', verifyToken, allowAccess, marketingOfflineTanakaController.createOrder);
router.post('/orders/request-discount-approval', verifyToken, allowAccess, marketingOfflineTanakaController.requestDiscountApproval);
router.post('/orders/bulk', verifyToken, allowAccess, marketingOfflineTanakaController.bulkCreateOrders);
router.put('/orders/:id', verifyToken, allowAccess, marketingOfflineTanakaController.updateOrder);
router.delete('/orders/:id', verifyToken, allowAccess, marketingOfflineTanakaController.deleteOrder);
router.post('/orders/:id/submit', verifyToken, allowAccess, marketingOfflineTanakaController.ajukanOrder);

// Inventory & Promo
router.get('/inventory', verifyToken, allowAccess, marketingOfflineTanakaController.getInventory);
router.get('/promo', verifyToken, allowAccess, marketingOfflineTanakaController.getPromoStock);

// Reports
router.get('/reports', verifyToken, allowAccess, marketingOfflineTanakaController.getReports);

module.exports = router;
