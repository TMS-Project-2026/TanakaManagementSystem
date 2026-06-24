const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/pricelistOnlineController');

// GET semua pricelist
router.get('/', ctrl.getAll);

// GET autofill by kode (untuk form order)
router.get('/kode/:kode', ctrl.getByKode);

// POST tambah satu produk
router.post('/', ctrl.create);

// POST bulk seed (insert banyak sekaligus)
router.post('/seed', ctrl.bulkInsert);

// PUT update produk by ID
router.put('/:id', ctrl.update);

// DELETE produk by ID
router.delete('/:id', ctrl.remove);

module.exports = router;
