const express = require('express');
const router = express.Router();
const salesOfflineController = require('../controllers/salesOfflineController');

router.get('/', salesOfflineController.getAllOfflineSales);
router.post('/', salesOfflineController.addOfflineSale);
router.put('/:id', salesOfflineController.updateOfflineSale);  // Tambahan untuk Update
router.delete('/:id', salesOfflineController.deleteOfflineSale);  // Tambahan untuk Delete

module.exports = router;