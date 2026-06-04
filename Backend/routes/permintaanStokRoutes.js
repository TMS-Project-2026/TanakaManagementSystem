const express = require('express');
const router = express.Router();
const permintaanStokController = require('../controllers/permintaanStokController');

router.get('/pending/count', permintaanStokController.getPendingCount);
router.post('/', permintaanStokController.createPermintaan);
router.get('/', permintaanStokController.getPermintaan);
router.post('/:id/approve', permintaanStokController.approvePermintaan);
router.post('/:id/reject', permintaanStokController.rejectPermintaan);

module.exports = router;
