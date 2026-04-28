const db = require('../config/db');

exports.getAllAccounts = (req, res) => {
  const query = 'SELECT * FROM accounts ORDER BY account_code ASC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching accounts:', err);
      return res.status(500).json({ error: 'Gagal mengambil data akun' });
    }
    res.status(200).json(results);
  });
};

exports.getAccountById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM accounts WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching account:', err);
      return res.status(500).json({ error: 'Gagal mengambil data akun' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Akun tidak ditemukan' });
    }
    res.status(200).json(results[0]);
  });
};

exports.createAccount = (req, res) => {
  const { account_code, account_name, category, normal_balance, branch, status } = req.body;
  const query = `
    INSERT INTO accounts (account_code, account_name, category, normal_balance, branch, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [account_code, account_name, category, normal_balance, branch, status || 'Active'], (err, results) => {
    if (err) {
      console.error('Error creating account:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Kode Akun sudah digunakan' });
      }
      return res.status(500).json({ error: 'Gagal menambahkan akun' });
    }
    res.status(201).json({ message: 'Akun berhasil ditambahkan', id: results.insertId });
  });
};

exports.updateAccount = (req, res) => {
  const { id } = req.params;
  const { account_code, account_name, category, normal_balance, branch, status } = req.body;
  const query = `
    UPDATE accounts 
    SET account_code = ?, account_name = ?, category = ?, normal_balance = ?, branch = ?, status = ?
    WHERE id = ?
  `;
  db.query(query, [account_code, account_name, category, normal_balance, branch, status, id], (err, results) => {
    if (err) {
      console.error('Error updating account:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'Kode Akun sudah digunakan' });
      }
      return res.status(500).json({ error: 'Gagal mengupdate akun' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Akun tidak ditemukan' });
    }
    res.status(200).json({ message: 'Akun berhasil diupdate' });
  });
};

exports.deleteAccount = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM accounts WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error deleting account:', err);
      return res.status(500).json({ error: 'Gagal menghapus akun' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Akun tidak ditemukan' });
    }
    res.status(200).json({ message: 'Akun berhasil dihapus' });
  });
};
