const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/quotationController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'quotations'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

router.get('/', verifyToken, controller.getAllQuotations);
router.get('/next-number', verifyToken, controller.getNextQuotationNumber);
router.get('/:id', verifyToken, controller.getQuotationById);
router.post('/', verifyToken, controller.createQuotation);
router.put('/:id', verifyToken, controller.updateQuotation);
router.delete('/:id', verifyToken, controller.deleteQuotation);
router.post('/:id/upload', verifyToken, upload.array('files', 10), controller.uploadFiles);
router.post('/:id/submit', verifyToken, controller.submitToFinance);

module.exports = router;
