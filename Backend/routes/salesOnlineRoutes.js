const express = require('express');
const router = express.Router();
const salesOnlineController = require('../controllers/salesOnlineController');

// 👇 TAMBAHKAN BARIS INI (Harus di atas yang lain agar tidak bentrok)
router.get('/dashboard-stats', salesOnlineController.getDashboardData);

router.get('/', salesOnlineController.getAllSales);
router.post('/', salesOnlineController.addSale);
router.delete('/:id', salesOnlineController.deleteSale);

module.exports = router;