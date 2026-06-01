const db = require('../config/db');

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;

exports.getAll = (req, res) => {
  const { search, bank, status, cabang, startDate, endDate } = req.query;
  let q = 'SELECT * FROM cash_out_bank WHERE 1=1';
  const p = [];
  if (search) { q += ' AND (nama_vendor LIKE ? OR transaksi_id LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
  if (bank) { q += ' AND bank = ?'; p.push(bank); }
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

exports.getSummary = (req, res) => {
  const queries = [
    `SELECT COALESCE(SUM(total),0) as val FROM cash_out_bank WHERE DATE(tanggal_transaksi) = CURDATE() AND status != 'Void'`,
    `SELECT COALESCE(SUM(total),0) as val FROM cash_out_bank WHERE status='Pending'`,
    `SELECT COALESCE(SUM(total),0) as val FROM cash_out_bank WHERE status='Paid'`,
    `SELECT COALESCE(SUM(total),0) as val FROM cash_out_bank WHERE status='Overdue'`,
    `SELECT DATE_FORMAT(tanggal_transaksi,'%b') as month, COALESCE(SUM(total),0) as total FROM cash_out_bank WHERE status!='Void' AND tanggal_transaksi >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) GROUP BY month`,
    `SELECT bank, COALESCE(SUM(total),0) as total FROM cash_out_bank WHERE status!='Void' GROUP BY bank`,
    `SELECT cabang, status, COALESCE(SUM(total),0) as total FROM cash_out_bank WHERE status!='Void' GROUP BY cabang, status`,
  ];
  Promise.all(queries.map(q => new Promise((resolve, reject) => db.query(q, [], (err, r) => err ? reject(err) : resolve(r)))))
    .then(([today, pending, paid, overdue, trend, byBank, byCabang]) => {
      res.json({
        summary: { total_today: today[0].val, total_pending: pending[0].val, total_paid: paid[0].val, total_overdue: overdue[0].val },
        charts: { trend, byBank, byCabang }
      });
    }).catch(err => res.status(500).json({ error: err.message }));
};

exports.create = (req, res) => {
  const { tanggal_transaksi, nama_vendor, cabang, bank, keterangan, kategori, satuan, qty, harga_satuan, due_date, status, catatan } = req.body;
  const transaksi_id = generateId('COB');
  const total = (parseFloat(qty) || 1) * (parseFloat(harga_satuan) || 0);
  const q = `INSERT INTO cash_out_bank (transaksi_id,tanggal_transaksi,nama_vendor,cabang,bank,keterangan,kategori,satuan,qty,harga_satuan,total,due_date,status,catatan) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  db.query(q, [transaksi_id,tanggal_transaksi,nama_vendor,cabang,bank,keterangan,kategori||'Pembayaran Supplier',satuan||'pcs',qty||1,harga_satuan||0,total,due_date,status||'Pending',catatan], (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Berhasil', id: r.insertId, transaksi_id });
  });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { tanggal_transaksi, nama_vendor, cabang, bank, keterangan, kategori, satuan, qty, harga_satuan, due_date, status, catatan } = req.body;
  const total = (parseFloat(qty)||1) * (parseFloat(harga_satuan)||0);
  const q = `UPDATE cash_out_bank SET tanggal_transaksi=?,nama_vendor=?,cabang=?,bank=?,keterangan=?,kategori=?,satuan=?,qty=?,harga_satuan=?,total=?,due_date=?,status=?,catatan=? WHERE id=?`;
  db.query(q, [tanggal_transaksi,nama_vendor,cabang,bank,keterangan,kategori,satuan,qty,harga_satuan,total,due_date,status,catatan,id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Updated' });
  });
};

exports.remove = (req, res) => {
  const { id } = req.params;
  db.query('UPDATE cash_out_bank SET status=? WHERE id=?', ['Void', id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Voided' });
  });
};
