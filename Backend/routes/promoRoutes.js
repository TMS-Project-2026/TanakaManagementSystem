const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController'); // Sesuaikan lokasi file

router.get('/', promoController.getPromoAktif);
router.post('/', promoController.aktifkanPromo);
router.delete('/:id', promoController.hapusPromo);
router.get('/rekomendasi', promoController.getRekomendasi); // Endpoint tambahan

module.exports = router;