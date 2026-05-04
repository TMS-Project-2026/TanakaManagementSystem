const express = require('express');
const router = express.Router();
const controller = require('../controllers/marketingOnlineBanuaController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/dashboard', verifyToken, controller.getDashboard);
router.get('/orders', verifyToken, controller.getOrders);
router.post('/orders/:id/ajukan-finance', verifyToken, controller.ajukanKeFinance);
router.post('/import', verifyToken, controller.importShopee);
router.get('/inventory', verifyToken, controller.getInventory);
router.get('/reports', verifyToken, controller.getReports);

module.exports = router;
