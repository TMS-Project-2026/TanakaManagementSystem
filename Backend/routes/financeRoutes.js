const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');

router.get('/dashboard', financeController.getDashboard);
router.get('/report', financeController.getReport);

module.exports = router;