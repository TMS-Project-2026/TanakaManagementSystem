const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Alamat URL untuk login: /api/auth/login
router.post('/login', authController.login);

module.exports = router;