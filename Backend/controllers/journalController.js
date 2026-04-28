const db = require('../config/db');

exports.getAllJournals = (req, res) => {
  const query = 'SELECT * FROM journals ORDER BY transaction_date DESC, created_at DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching journals:', err);
      return res.status(500).json({ error: 'Gagal mengambil data jurnal' });
    }
    res.status(200).json(results);
  });
};

exports.getJournalById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM journals WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching journal:', err);
      return res.status(500).json({ error: 'Gagal mengambil data jurnal' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Jurnal tidak ditemukan' });
    }
    res.status(200).json(results[0]);
  });
};

exports.createJournal = (req, res) => {
  const { 
    branch, transaction_date, category, from_account, to_account, 
    account_name, description, unit, qty, unit_price, amount, 
    debit, credit, notes, status 
  } = req.body;

  // Generate Transaction ID
  const prefix = 'TRX';
  const timestamp = Date.now().toString().slice(-6);
  const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
  const transaction_id = `${prefix}-${timestamp}-${randomStr}`;

  const query = `
    INSERT INTO journals (
      transaction_id, branch, transaction_date, category, from_account, to_account, 
      account_name, description, unit, qty, unit_price, amount, debit, credit, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [
    transaction_id, branch, transaction_date, category, from_account, to_account,
    account_name, description, unit, qty || 1, unit_price || 0, amount, debit, credit, notes, status || 'Completed'
  ], (err, results) => {
    if (err) {
      console.error('Error creating journal:', err);
      return res.status(500).json({ error: 'Gagal menambahkan jurnal' });
    }
    res.status(201).json({ message: 'Jurnal berhasil ditambahkan', id: results.insertId, transaction_id });
  });
};

exports.updateJournal = (req, res) => {
  const { id } = req.params;
  const { 
    branch, transaction_date, category, from_account, to_account, 
    account_name, description, unit, qty, unit_price, amount, 
    debit, credit, notes, status 
  } = req.body;

  const query = `
    UPDATE journals SET
      branch = ?, transaction_date = ?, category = ?, from_account = ?, to_account = ?, 
      account_name = ?, description = ?, unit = ?, qty = ?, unit_price = ?, amount = ?, 
      debit = ?, credit = ?, notes = ?, status = ?
    WHERE id = ?
  `;

  db.query(query, [
    branch, transaction_date, category, from_account, to_account,
    account_name, description, unit, qty, unit_price, amount, debit, credit, notes, status, id
  ], (err, results) => {
    if (err) {
      console.error('Error updating journal:', err);
      return res.status(500).json({ error: 'Gagal mengupdate jurnal' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Jurnal tidak ditemukan' });
    }
    res.status(200).json({ message: 'Jurnal berhasil diupdate' });
  });
};

exports.deleteJournal = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM journals WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error deleting journal:', err);
      return res.status(500).json({ error: 'Gagal menghapus jurnal' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Jurnal tidak ditemukan' });
    }
    res.status(200).json({ message: 'Jurnal berhasil dihapus' });
  });
};
