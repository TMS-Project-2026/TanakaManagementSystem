const express = require('express');
const router = express.Router();
const c = require('../controllers/transferRekeningController');
router.get('/', c.getAll);
router.get('/summary', c.getSummary);
router.post('/', c.create);
router.put('/:id', c.update);
router.delete('/:id', c.remove);
module.exports = router;
