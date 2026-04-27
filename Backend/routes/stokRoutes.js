const express = require('express');
const router = express.Router();
const stokController = require('../controllers/stokController');

router.get('/', stokController.getAllStok);
router.post('/', stokController.createStok);
router.put('/:id', stokController.updateStok);
router.delete('/:id', stokController.deleteStok);

module.exports = router;
