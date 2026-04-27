const express = require('express');
const router = express.Router();
const gudangController = require('../controllers/gudangController');

router.get('/dashboard', gudangController.getDashboard);
router.get('/warning', gudangController.getWarningStok);

module.exports = router;
