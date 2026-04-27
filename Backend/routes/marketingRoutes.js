const express = require('express');
const router = express.Router();
const marketingController = require('../controllers/marketingController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Rute untuk CRUD Marketing (dengan authentikasi)
router.get('/', verifyToken, marketingController.getLeads);
router.post('/', verifyToken, marketingController.addLead);
router.put('/:id', verifyToken, marketingController.updateStatus);
router.delete('/:id', verifyToken, marketingController.deleteLead);

module.exports = router;