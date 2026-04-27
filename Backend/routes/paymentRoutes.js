const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.get('/', paymentController.getAllPayment);
router.post('/', paymentController.createPayment);
router.put('/:id', paymentController.updatePayment);

module.exports = router;
