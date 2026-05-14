const express = require('express');
const router = express.Router();
const stokJalanController = require('../controllers/stokJalanController');

router.get('/', stokJalanController.getAllStokJalan);
router.post('/', stokJalanController.createStokJalan);
router.put('/:id', stokJalanController.updateStokJalan);
router.delete('/:id', stokJalanController.deleteStokJalan);

module.exports = router;
