const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/', notificationController.getNotifications);
router.get('/count', notificationController.getNotificationCount);

module.exports = router;
