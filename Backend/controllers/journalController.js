const db = require('../config/db');

// Generate Transaction ID based on type
const generateTxId = (type) => {
  const prefix = type === 'Purchase' ? 'PJ' : 'SJ';
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ym}-${rand}`;
};

// GET all journals with optional filters
exports.getAllJournals = (req, res) => {
  const { type, branch, category, from, to, search } = req.query;
  let conditions = [];
  let params = [];

  if (type) { conditions.push('journal_type = ?'); params.push(type); }
  if (branch) { conditions.push('branch = ?'); params.push(branch); }
  if (category) { conditions.push('category = ?'); params.push(category); }
  if (from) { conditions.push('transaction_date >= ?'); params.push(from); }
  if (to) { conditions.push('transaction_date <= ?'); params.push(to); }
  if (search) {
    conditions.push('(transaction_id LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const query = `SELECT * FROM journals ${where} ORDER BY transaction_date DESC, created_at DESC`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching journals:', err);
      return res.status(500).json({ error: 'Gagal mengambil data jurnal' });
    }
    res.status(200).json(results);
  });
};

// GET summary stats per type
exports.getJournalStats = (req, res) => {
  const { type } = req.query;
  const condition = type ? 'WHERE journal_type = ?' : '';
  const params = type ? [type] : [];

  const query = `
    SELECT 
      COUNT(*) as total_tx,
      COALESCE(SUM(debit), 0) as total_debit,
      COALESCE(SUM(credit), 0) as total_credit,
      COALESCE(SUM(debit) - SUM(credit), 0) as balance
    FROM journals ${condition}
  `;

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil statistik' });
    res.status(200).json(results[0]);
  });
};

// GET by ID
exports.getJournalById = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM journals WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal mengambil data jurnal' });
    if (results.length === 0) return res.status(404).json({ error: 'Jurnal tidak ditemukan' });
    res.status(200).json(results[0]);
  });
};

// CREATE journal
exports.createJournal = (req, res) => {
  const {
    journal_type, branch, transaction_date, category,
    debit_account, credit_account, description, debit, credit, notes, attachment
  } = req.body;

  const transaction_id = generateTxId(journal_type || 'Sales');
  const amount = Math.max(parseFloat(debit) || 0, parseFloat(credit) || 0);

  // Derive account_name from debit_account or credit_account to satisfy NOT NULL constraint
  let account_name = '';
  if (debit_account) {
    account_name = debit_account.split(' - ')[1] || debit_account;
  } else if (credit_account) {
    account_name = credit_account.split(' - ')[1] || credit_account;
  }

  const query = `
    INSERT INTO journals (
      transaction_id, branch, transaction_date, category, journal_type,
      debit_account, credit_account, from_account, to_account, account_name,
      description, debit, credit, amount, notes, status, attachment
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [
    transaction_id, branch, transaction_date, category,
    journal_type || 'Sales',
    debit_account || '', credit_account || '',
    debit_account || '', credit_account || '', // backward compat
    account_name,
    description, parseFloat(debit) || 0, parseFloat(credit) || 0,
    amount, notes || '', 'Completed',
    attachment ? (typeof attachment === 'object' ? JSON.stringify(attachment) : attachment) : null
  ], (err, results) => {
    if (err) {
      console.error('Error creating journal:', err);
      return res.status(500).json({ error: 'Gagal menambahkan jurnal' });
    }
    res.status(201).json({ message: 'Jurnal berhasil ditambahkan', id: results.insertId, transaction_id });
  });
};

// UPDATE journal
exports.updateJournal = (req, res) => {
  const { id } = req.params;
  const {
    journal_type, branch, transaction_date, category,
    debit_account, credit_account, description, debit, credit, notes, status, attachment
  } = req.body;

  const amount = Math.max(parseFloat(debit) || 0, parseFloat(credit) || 0);

  let account_name = '';
  if (debit_account) {
    account_name = debit_account.split(' - ')[1] || debit_account;
  } else if (credit_account) {
    account_name = credit_account.split(' - ')[1] || credit_account;
  }

  // If attachment is explicitly passed, update it, otherwise keep existing
  let attachmentVal = attachment !== undefined ? (typeof attachment === 'object' ? JSON.stringify(attachment) : attachment) : null;

  const query = `
    UPDATE journals SET
      branch = ?, transaction_date = ?, category = ?, journal_type = ?,
      debit_account = ?, credit_account = ?, from_account = ?, to_account = ?, account_name = ?,
      description = ?, debit = ?, credit = ?, amount = ?, notes = ?, status = ?
      ${attachment !== undefined ? ', attachment = ?' : ''}
    WHERE id = ?
  `;

  const params = [
    branch, transaction_date, category, journal_type || 'Sales',
    debit_account || '', credit_account || '',
    debit_account || '', credit_account || '',
    account_name,
    description, parseFloat(debit) || 0, parseFloat(credit) || 0,
    amount, notes || '', status || 'Completed'
  ];

  if (attachment !== undefined) {
    params.push(attachmentVal);
  }
  params.push(id);

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error updating journal:', err);
      return res.status(500).json({ error: 'Gagal mengupdate jurnal' });
    }
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Jurnal tidak ditemukan' });
    res.status(200).json({ message: 'Jurnal berhasil diupdate' });
  });
};

// DELETE journal
exports.deleteJournal = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM journals WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Gagal menghapus jurnal' });
    if (results.affectedRows === 0) return res.status(404).json({ error: 'Jurnal tidak ditemukan' });
    res.status(200).json({ message: 'Jurnal berhasil dihapus' });
  });
};

// UPLOAD files attachment
exports.uploadFiles = (req, res) => {
  const { id } = req.params;
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Tidak ada file yang diupload!" });
  }

  db.query("SELECT attachment FROM journals WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "Jurnal tidak ditemukan!" });

    let existingFiles = [];
    try {
      existingFiles = JSON.parse(results[0].attachment) || [];
    } catch (e) {
      existingFiles = [];
    }

    const newFiles = req.files.map(f => ({
      filename: f.filename,
      originalname: f.originalname,
      path: `/uploads/journals/${f.filename}`,
      size: f.size,
      uploaded_at: new Date().toISOString()
    }));

    const allFiles = [...existingFiles, ...newFiles];

    db.query("UPDATE journals SET attachment = ? WHERE id = ?",
      [JSON.stringify(allFiles), id],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(200).json({ message: "File berhasil diupload!", files: allFiles, attachment: JSON.stringify(allFiles) });
      }
    );
  });
};
