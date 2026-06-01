const db = require('../config/db');

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;

exports.getAll = (req, res) => {
  const { search, kategori, status, cabang, startDate, endDate } = req.query;
  let q = 'SELECT * FROM petty_cash WHERE 1=1';
  const p = [];
  if (search) { q += ' AND (nama_penerima LIKE ? OR transaksi_id LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
  if (kategori) { q += ' AND kategori = ?'; p.push(kategori); }
  if (status) { q += ' AND status = ?'; p.push(status); }
  if (cabang) { q += ' AND cabang = ?'; p.push(cabang); }
  if (startDate) { q += ' AND tanggal_transaksi >= ?'; p.push(startDate); }
  if (endDate) { q += ' AND tanggal_transaksi <= ?'; p.push(endDate); }
  q += ' ORDER BY tanggal_transaksi DESC';
  db.query(q, p, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: results });
  });
};

exports.getSaldoPerCabang = (req, res) => {
  db.query('SELECT * FROM petty_cash_saldo ORDER BY cabang', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: results });
  });
};

exports.getSummary = (req, res) => {
  const queries = [
    `SELECT COALESCE(SUM(nominal),0) as val FROM petty_cash WHERE DATE(tanggal_transaksi)=CURDATE() AND status!='Void' AND is_replenishment=0`,
    `SELECT COALESCE(SUM(nominal),0) as val FROM petty_cash WHERE status='Pending' AND is_replenishment=0`,
    `SELECT COALESCE(SUM(nominal),0) as val FROM petty_cash WHERE status='Approved' AND is_replenishment=0`,
    `SELECT * FROM petty_cash_saldo`,
    `SELECT DATE_FORMAT(tanggal_transaksi,'%b') as month, COALESCE(SUM(nominal),0) as total FROM petty_cash WHERE status!='Void' AND is_replenishment=0 AND tanggal_transaksi >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) GROUP BY month`,
    `SELECT kategori, COALESCE(SUM(nominal),0) as total FROM petty_cash WHERE status!='Void' AND is_replenishment=0 GROUP BY kategori`,
    `SELECT cabang, COALESCE(SUM(nominal),0) as total FROM petty_cash WHERE status!='Void' AND is_replenishment=0 GROUP BY cabang`,
  ];
  Promise.all(queries.map(q => new Promise((resolve, reject) => db.query(q, [], (err, r) => err ? reject(err) : resolve(r)))))
    .then(([today, pending, approved, saldo, trend, byKategori, byCabang]) => {
      res.json({
        summary: { total_today: today[0].val, total_pending: pending[0].val, total_approved: approved[0].val, saldo_per_cabang: saldo },
        charts: { trend, byKategori, byCabang }
      });
    }).catch(err => res.status(500).json({ error: err.message }));
};

exports.create = (req, res) => {
  const { tanggal_transaksi, nama_penerima, cabang, kategori, nominal, keterangan, status, catatan } = req.body;
  const transaksi_id = generateId('PC');
  // Check saldo & batas
  db.query('SELECT * FROM petty_cash_saldo WHERE cabang=?', [cabang], (err, saldoRows) => {
    if (err) return res.status(500).json({ error: err.message });
    const saldo = saldoRows[0];
    if (saldo && parseFloat(nominal) > parseFloat(saldo.batas_per_transaksi)) {
      return res.status(400).json({ error: `Nominal melebihi batas per transaksi (Rp ${Number(saldo.batas_per_transaksi).toLocaleString('id-ID')})` });
    }
    const q = `INSERT INTO petty_cash (transaksi_id,tanggal_transaksi,nama_penerima,cabang,kategori,nominal,keterangan,status,catatan,is_replenishment) VALUES (?,?,?,?,?,?,?,?,?,0)`;
    db.query(q, [transaksi_id,tanggal_transaksi,nama_penerima,cabang,kategori||'ATK',nominal||0,keterangan,status||'Pending',catatan], (err2, r) => {
      if (err2) return res.status(500).json({ error: err2.message });
      // Kurangi saldo jika approved
      if (status === 'Approved') {
        db.query('UPDATE petty_cash_saldo SET saldo = saldo - ? WHERE cabang=?', [nominal, cabang]);
      }
      res.status(201).json({ message: 'Berhasil', id: r.insertId, transaksi_id, saldo_warning: saldo && (parseFloat(saldo.saldo) - parseFloat(nominal)) < parseFloat(saldo.saldo_minimum) });
    });
  });
};

exports.replenishment = (req, res) => {
  const { cabang, nominal, tanggal_transaksi, keterangan } = req.body;
  const transaksi_id = generateId('PCR');
  const q = `INSERT INTO petty_cash (transaksi_id,tanggal_transaksi,nama_penerima,cabang,kategori,nominal,keterangan,status,is_replenishment) VALUES (?,?,?,?,'Replenishment',?,?,'Approved',1)`;
  db.query(q, [transaksi_id, tanggal_transaksi||new Date().toISOString().split('T')[0], 'Isi Ulang Petty Cash', cabang, nominal||0, keterangan||'Replenishment Petty Cash'], (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query('UPDATE petty_cash_saldo SET saldo = saldo + ? WHERE cabang=?', [nominal, cabang], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json({ message: 'Replenishment berhasil', id: r.insertId });
    });
  });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { tanggal_transaksi, nama_penerima, cabang, kategori, nominal, keterangan, status, catatan } = req.body;
  
  db.query('SELECT * FROM petty_cash WHERE id=?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const oldItem = rows[0];
    const q = `UPDATE petty_cash SET tanggal_transaksi=?,nama_penerima=?,cabang=?,kategori=?,nominal=?,keterangan=?,status=?,catatan=? WHERE id=?`;
    db.query(q, [tanggal_transaksi,nama_penerima,cabang,kategori,nominal,keterangan,status,catatan,id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      
      // Handle saldo logic if status changed
      if (oldItem.status !== 'Approved' && status === 'Approved') {
        db.query('UPDATE petty_cash_saldo SET saldo = saldo - ? WHERE cabang=?', [nominal, cabang]);
      } else if (oldItem.status === 'Approved' && status !== 'Approved') {
        db.query('UPDATE petty_cash_saldo SET saldo = saldo + ? WHERE cabang=?', [oldItem.nominal, oldItem.cabang]);
      } else if (oldItem.status === 'Approved' && status === 'Approved' && Number(oldItem.nominal) !== Number(nominal)) {
        // Adjust the difference
        const diff = Number(nominal) - Number(oldItem.nominal);
        db.query('UPDATE petty_cash_saldo SET saldo = saldo - ? WHERE cabang=?', [diff, cabang]);
      }
      
      res.json({ message: 'Updated' });
    });
  });
};

exports.remove = (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM petty_cash WHERE id=?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    
    const item = rows[0];
    db.query('UPDATE petty_cash SET status=? WHERE id=?', ['Void', id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      
      // If it was Approved, refund the saldo
      if (item.status === 'Approved' || item.status === 'Paid') {
        db.query('UPDATE petty_cash_saldo SET saldo = saldo + ? WHERE cabang=?', [item.nominal, item.cabang]);
      }
      res.json({ message: 'Voided' });
    });
  });
};
