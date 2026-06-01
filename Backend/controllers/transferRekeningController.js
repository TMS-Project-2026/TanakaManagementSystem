const db = require('../config/db');

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2,5).toUpperCase()}`;

exports.getAll = (req, res) => {
  const { search, status, dari_cabang, ke_cabang, startDate, endDate } = req.query;
  let q = 'SELECT * FROM transfer_rekening WHERE 1=1';
  const p = [];
  if (search) { q += ' AND (transaksi_id LIKE ? OR keterangan LIKE ?)'; p.push(`%${search}%`, `%${search}%`); }
  if (status) { q += ' AND status = ?'; p.push(status); }
  if (dari_cabang) { q += ' AND dari_cabang = ?'; p.push(dari_cabang); }
  if (ke_cabang) { q += ' AND ke_cabang = ?'; p.push(ke_cabang); }
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
    `SELECT COALESCE(SUM(nominal),0) as val FROM transfer_rekening WHERE DATE(tanggal_transaksi)=CURDATE() AND status!='Void'`,
    `SELECT COALESCE(SUM(nominal),0) as val FROM transfer_rekening WHERE status='Pending'`,
    `SELECT COALESCE(SUM(nominal),0) as val FROM transfer_rekening WHERE status='Completed'`,
    `SELECT COALESCE(SUM(biaya_transfer),0) as val FROM transfer_rekening WHERE status!='Void'`,
    `SELECT DATE_FORMAT(tanggal_transaksi,'%b') as month, COALESCE(SUM(nominal),0) as total FROM transfer_rekening WHERE status!='Void' AND tanggal_transaksi >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) GROUP BY month`,
    `SELECT dari_bank as bank, COALESCE(SUM(nominal),0) as total FROM transfer_rekening WHERE status!='Void' GROUP BY dari_bank`,
  ];
  Promise.all(queries.map(q => new Promise((resolve, reject) => db.query(q, [], (err, r) => err ? reject(err) : resolve(r)))))
    .then(([today, pending, completed, biaya, trend, byBank]) => {
      res.json({
        summary: { total_today: today[0].val, total_pending: pending[0].val, total_completed: completed[0].val, total_biaya: biaya[0].val },
        charts: { trend, byBank }
      });
    }).catch(err => res.status(500).json({ error: err.message }));
};

exports.create = (req, res) => {
  const { tanggal_transaksi, dari_bank, ke_bank, dari_cabang, ke_cabang, nominal, biaya_transfer, keterangan, status, catatan } = req.body;
  if (dari_bank === ke_bank && dari_cabang === ke_cabang) return res.status(400).json({ error: 'Tidak bisa transfer ke rekening yang sama' });
  const transaksi_id = generateId('TRF');
  const q = `INSERT INTO transfer_rekening (transaksi_id,tanggal_transaksi,dari_bank,ke_bank,dari_cabang,ke_cabang,nominal,biaya_transfer,keterangan,status,catatan) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
  db.query(q, [transaksi_id,tanggal_transaksi,dari_bank,ke_bank,dari_cabang,ke_cabang,nominal||0,biaya_transfer||0,keterangan,status||'Pending',catatan], (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Berhasil', id: r.insertId, transaksi_id });
  });
};

exports.update = (req, res) => {
  const { id } = req.params;
  const { tanggal_transaksi, dari_bank, ke_bank, dari_cabang, ke_cabang, nominal, biaya_transfer, keterangan, status, catatan } = req.body;
  const q = `UPDATE transfer_rekening SET tanggal_transaksi=?,dari_bank=?,ke_bank=?,dari_cabang=?,ke_cabang=?,nominal=?,biaya_transfer=?,keterangan=?,status=?,catatan=? WHERE id=?`;
  db.query(q, [tanggal_transaksi,dari_bank,ke_bank,dari_cabang,ke_cabang,nominal,biaya_transfer,keterangan,status,catatan,id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Updated' });
  });
};

exports.remove = (req, res) => {
  db.query('UPDATE transfer_rekening SET status=? WHERE id=?', ['Void', req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Voided' });
  });
};
