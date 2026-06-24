const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/gudangAccestretController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/dashboard', verifyToken, ctrl.getDashboard);
router.get('/analisis',  verifyToken, ctrl.getAnalisis);
router.get('/warning',   verifyToken, ctrl.getWarningStok);

module.exports = router;
