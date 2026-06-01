const express = require('express');
const router = express.Router();
const hutangController = require('../controllers/hutangController');

router.get('/', hutangController.getAll);
router.post('/', hutangController.create);
router.post('/:id/pay', hutangController.pay);
router.put('/:id/void', hutangController.void);

module.exports = router;
