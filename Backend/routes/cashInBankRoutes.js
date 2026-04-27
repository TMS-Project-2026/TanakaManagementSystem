const express = require('express');
const router = express.Router();
const cashInBankController = require('../controllers/cashInBankController');

router.get('/', cashInBankController.getAll);
router.get('/summary', cashInBankController.getSummary);
router.post('/', cashInBankController.create);
router.put('/:id', cashInBankController.update);
router.delete('/:id', cashInBankController.remove);

module.exports = router;
