const express = require('express');
const router = express.Router();
const piutangController = require('../controllers/piutangController');

router.get('/', piutangController.getAll);
router.post('/', piutangController.create);
router.post('/:id/pay', piutangController.pay);
router.put('/:id/void', piutangController.void);

module.exports = router;
