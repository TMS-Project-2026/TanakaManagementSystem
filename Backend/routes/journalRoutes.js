const express = require('express');
const router = express.Router();
const journalController = require('../controllers/journalController');

router.get('/', journalController.getAllJournals);
router.get('/:id', journalController.getJournalById);
router.post('/', journalController.createJournal);
router.put('/:id', journalController.updateJournal);
router.delete('/:id', journalController.deleteJournal);

module.exports = router;
