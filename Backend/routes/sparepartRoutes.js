const express = require('express');
const router = express.Router();
const sparepartController = require('../controllers/sparepartController');

router.get('/', sparepartController.getAllSparepart);
router.post('/', sparepartController.createSparepart);
router.put('/:id', sparepartController.updateSparepart);
router.delete('/:id', sparepartController.deleteSparepart);

module.exports = router;
