const express = require('express');
const router = express.Router();
const produkController = require('../controllers/produkController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

// Semua Role (jika sudah login) bisa melihat barang
router.get('/', verifyToken, produkController.getAllProduk);

// HANYA Role tertentu yang diizinkan memanajemen barang/pricelist
router.post('/', verifyToken, checkRole(['finance', 'Finance', 'owner', 'Owner', 'admin', 'Admin']), produkController.tambahProduk);
router.post('/import', verifyToken, checkRole(['finance', 'Finance', 'owner', 'Owner', 'admin', 'Admin']), produkController.importProduk);
router.put('/:id', verifyToken, checkRole(['finance', 'Finance', 'owner', 'Owner', 'admin', 'Admin']), produkController.updateProduk);
router.delete('/:id', verifyToken, checkRole(['finance', 'Finance', 'owner', 'Owner', 'admin', 'Admin']), produkController.deleteProduk);

module.exports = router;