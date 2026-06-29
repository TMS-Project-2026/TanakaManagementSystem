const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const invoiceController = require('../controllers/invoiceController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Multer config for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads', 'invoices'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

router.get('/', invoiceController.getAllInvoice);
router.get('/next-number', invoiceController.getNextInvoiceNumber);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/', invoiceController.createInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.put('/:id/request-revision', invoiceController.requestRevision);
router.delete('/:id', invoiceController.deleteInvoice);
router.post('/:id/upload', verifyToken, upload.array('files', 10), invoiceController.uploadFiles);

module.exports = router;
