const express = require('express');
const router = express.Router();
const mutasiController = require('../controllers/mutasiController');

router.get('/', mutasiController.getAllMutasi);
router.post('/', mutasiController.createMutasi);

module.exports = router;