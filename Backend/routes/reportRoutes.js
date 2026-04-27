const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const neracaController = require('../controllers/neracaController');
const jurnalController = require('../controllers/jurnalController');

// Laba Rugi, Expense, Income Expense, Arus Kas
router.get('/laba-rugi', reportController.getLabaRugi);
router.get('/expense', reportController.getExpenseReport);
router.get('/income-expense', reportController.getIncomeExpense);
router.get('/arus-kas', reportController.getArusKas);
router.get('/semua-transaksi', reportController.getSemuaTransaksi);

// Neraca, Perubahan Modal
router.get('/neraca', neracaController.getNeraca);
router.get('/perubahan-modal', neracaController.getPerubahanModal);

// Hutang, Piutang, Jurnal, Buku Besar
router.get('/hutang', jurnalController.getHutang);
router.get('/piutang', jurnalController.getPiutang);
router.get('/jurnal', jurnalController.getJurnal);
router.get('/buku-besar', jurnalController.getBukuBesar);

module.exports = router;
