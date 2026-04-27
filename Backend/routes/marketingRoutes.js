const express = require('express');
const router = express.Router();
const marketingController = require('../controllers/marketingController');

// Rute untuk CRUD Marketing
router.get('/', marketingController.getLeads);
router.post('/', marketingController.addLead);
router.put('/:id', marketingController.updateStatus);
router.delete('/:id', marketingController.deleteLead);

module.exports = router;