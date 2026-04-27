const express = require('express');
const router = express.Router();

const ownerController = require('../controllers/ownerController');
const reportController = require('../controllers/reportController');
const approvalController = require('../controllers/approvalController');

// Owner Overview Endpoints
router.get('/dashboard', ownerController.getDashboard);
router.get('/marketing', ownerController.getMarketing);
router.get('/finance', ownerController.getFinance);
router.get('/gudang', ownerController.getGudang);
router.get('/produksi', ownerController.getProduksi);
router.get('/cabang', ownerController.getCabang);
router.get('/users', ownerController.getUsers);

// Report Center
router.get('/report', reportController.getReport);

// Approval Center
router.get('/approval', approvalController.getApprovals);
router.put('/approval/:id', approvalController.updateApproval);

module.exports = router;
