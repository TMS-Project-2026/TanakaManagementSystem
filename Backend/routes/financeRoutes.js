const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// Kunci ketat! Hanya divisi Keuangan, Manager, dan Admin yang boleh menyentuh uang.
router.post('/', verifyToken, checkRole(['Finance', 'Manager', 'Admin']), financeController.buatInvoice);
router.put('/:id_invoice/lunas', verifyToken, checkRole(['Finance', 'Manager', 'Admin']), financeController.lunasiInvoice);

module.exports = router;