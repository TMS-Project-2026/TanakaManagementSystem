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

// GET finance summary: revenue, receivable (piutang), penerimaan (cash in bank), piutang berjalan
exports.getFinanceSummary = (req, res) => {
  // 1. Total Revenue = SUM semua nominal piutang (termasuk yang sudah lunas)
  const sqlRevenue = `SELECT COALESCE(SUM(nominal), 0) as total_revenue FROM piutang WHERE status != 'Void'`;

  // 2. Total Receivable = SUM sisa piutang yang belum lunas
  const sqlReceivable = `SELECT COALESCE(SUM(sisa), 0) as total_receivable FROM piutang WHERE status NOT IN ('Paid','Void')`;

  // 3. Total Penerimaan = SUM yang sudah terbayar dari piutang
  const sqlCash = `SELECT COALESCE(SUM(terbayar), 0) as total_cash_in_bank FROM piutang WHERE status != 'Void'`;

  // 4. Total Transaksi
  const sqlTx = `SELECT COUNT(*) as total_tx FROM piutang WHERE status != 'Void'`;

  db.query(sqlRevenue, [], (err1, resRevenue) => {
    if (err1) return res.status(500).json({ error: 'Gagal mengambil revenue' });

    db.query(sqlReceivable, [], (err2, resReceivable) => {
      if (err2) return res.status(500).json({ error: 'Gagal mengambil piutang' });

      db.query(sqlCash, [], (err3, resCash) => {
        if (err3) return res.status(500).json({ error: 'Gagal mengambil penerimaan' });

        db.query(sqlTx, [], (err4, resTx) => {
          if (err4) return res.status(500).json({ error: 'Gagal mengambil total transaksi' });

          const total_revenue = parseFloat(resRevenue[0].total_revenue) || 0;
          const total_receivable = parseFloat(resReceivable[0].total_receivable) || 0;
          const total_cash_in_bank = parseFloat(resCash[0].total_cash_in_bank) || 0;
          const total_tx = resTx[0].total_tx || 0;

          // Piutang Berjalan = Total Receivable (sisa yang belum dibayar)
          const piutang_berjalan = total_receivable;

          // Persentase terbayar = (Total Penerimaan / Total Revenue) × 100%
          let piutang_terbayar_persen = total_revenue > 0 ? (total_cash_in_bank / total_revenue) * 100 : 0;
          piutang_terbayar_persen = Math.min(piutang_terbayar_persen, 100);

          res.status(200).json({
            total_revenue,
            total_receivable,
            total_cash_in_bank,
            total_tx,
            piutang_terbayar_persen: parseFloat(piutang_terbayar_persen.toFixed(2)),
            piutang_berjalan: parseFloat(piutang_berjalan.toFixed(2))
          });
        });
      });
    });
  });
};

// GET purchase finance summary: total payable (hutang), total purchase (all), cash paid out (sudah dibayar)
exports.getPurchaseFinanceSummary = (req, res) => {
  // 1. Total Payable = SUM sisa hutang yang belum lunas
  const sqlPayable = `SELECT COALESCE(SUM(sisa), 0) as total_payable FROM hutang WHERE status NOT IN ('Paid','Void')`;

  // 2. Total Purchase = SUM semua nominal hutang (termasuk yang sudah lunas)
  const sqlPurchase = `SELECT COALESCE(SUM(nominal), 0) as total_purchase, COUNT(*) as total_tx FROM hutang WHERE status != 'Void'`;

  // 3. Cash Paid Out = SUM yang sudah terbayar dari hutang
  const sqlPaid = `SELECT COALESCE(SUM(terbayar), 0) as cash_paid_out FROM hutang WHERE status != 'Void'`;

  db.query(sqlPayable, [], (err1, resPayable) => {
    if (err1) return res.status(500).json({ error: 'Gagal mengambil data payable' });

    db.query(sqlPurchase, [], (err2, resPurchase) => {
      if (err2) return res.status(500).json({ error: 'Gagal mengambil data purchase' });

      db.query(sqlPaid, [], (err3, resPaid) => {
        if (err3) return res.status(500).json({ error: 'Gagal mengambil data cash paid' });

        const total_payable = parseFloat(resPayable[0].total_payable) || 0;
        const total_purchase = parseFloat(resPurchase[0].total_purchase) || 0;
        const cash_paid_out = parseFloat(resPaid[0].cash_paid_out) || 0;
        const total_tx = resPurchase[0].total_tx || 0;

        res.status(200).json({
          total_payable,
          total_purchase,
          cash_paid_out,
          total_tx
        });
      });
    });
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
