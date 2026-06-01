const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const journalController = require('../controllers/journalController');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'journals');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

router.get('/', journalController.getAllJournals);
router.get('/stats/summary', journalController.getJournalStats);
router.get('/stats/finance-summary', journalController.getFinanceSummary);
router.get('/stats/purchase-summary', journalController.getPurchaseFinanceSummary);
router.get('/:id', journalController.getJournalById);
router.post('/', journalController.createJournal);
router.put('/:id', journalController.updateJournal);
router.delete('/:id', journalController.deleteJournal);
router.post('/:id/upload', upload.array('files', 10), journalController.uploadFiles);

module.exports = router;
