const db = require('../config/db');

// GET semua pricelist
exports.getAll = (req, res) => {
  const sql = 'SELECT * FROM pricelist_online ORDER BY grup_produk ASC, kode ASC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(200).json({ status: 'success', data: results });
  });
};

// GET 1 item by kode (untuk autofill di form order)
exports.getByKode = (req, res) => {
  const { kode } = req.params;
  const sql = 'SELECT * FROM pricelist_online WHERE kode = ?';
  db.query(sql, [kode.toUpperCase()], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Kode tidak ditemukan' });
    res.status(200).json({ status: 'success', data: results[0] });
  });
};

// POST tambah item baru
exports.create = (req, res) => {
  const { kode, grup_produk, jenis, nama_produk, bahan, harga_jual, hpp, pot_shopee, margin } = req.body;
  if (!kode || !nama_produk || !harga_jual || !hpp) {
    return res.status(400).json({ message: 'Kode, nama_produk, harga_jual, dan hpp wajib diisi.' });
  }
  // Cek duplikat kode
  db.query('SELECT id FROM pricelist_online WHERE kode = ?', [kode.toUpperCase()], (err, exist) => {
    if (err) return res.status(500).json({ message: err.message });
    if (exist.length > 0) return res.status(409).json({ message: `Kode "${kode.toUpperCase()}" sudah ada.` });

    const sql = `INSERT INTO pricelist_online (kode, grup_produk, jenis, nama_produk, bahan, harga_jual, hpp, pot_shopee, margin)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
      kode.toUpperCase(), grup_produk || '', jenis ? jenis.toUpperCase() : '',
      nama_produk.toUpperCase(), bahan ? bahan.toUpperCase() : '-',
      Number(harga_jual) || 0, Number(hpp) || 0, Number(pot_shopee) || 0, Number(margin) || 0
    ];
    db.query(sql, values, (err2, result) => {
      if (err2) return res.status(500).json({ message: err2.message });
      res.status(201).json({ message: 'Produk berhasil ditambahkan!', id: result.insertId });
    });
  });
};

// PUT update harga by ID
exports.update = (req, res) => {
  const { id } = req.params;
  const { kode, grup_produk, jenis, nama_produk, bahan, harga_jual, hpp, pot_shopee, margin } = req.body;
  const sql = `UPDATE pricelist_online SET
    kode=?, grup_produk=?, jenis=?, nama_produk=?, bahan=?,
    harga_jual=?, hpp=?, pot_shopee=?, margin=?, updated_at=NOW()
    WHERE id=?`;
  const values = [
    kode ? kode.toUpperCase() : '', grup_produk || '', jenis ? jenis.toUpperCase() : '',
    nama_produk ? nama_produk.toUpperCase() : '', bahan ? bahan.toUpperCase() : '-',
    Number(harga_jual) || 0, Number(hpp) || 0, Number(pot_shopee) || 0, Number(margin) || 0, id
  ];
  db.query(sql, values, (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(200).json({ message: 'Produk berhasil diupdate!' });
  });
};

// DELETE by ID
exports.remove = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM pricelist_online WHERE id=?', [id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(200).json({ message: 'Produk berhasil dihapus!' });
  });
};

// POST bulk seed / import
exports.bulkInsert = (req, res) => {
  const data = req.body;
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ message: 'Data kosong atau tidak valid.' });
  }
  const sql = `INSERT IGNORE INTO pricelist_online (kode, grup_produk, jenis, nama_produk, bahan, harga_jual, hpp, pot_shopee, margin)
               VALUES ?`;
  const values = data.map(i => [
    (i.kode || '').toUpperCase(),
    i.grup_produk || '',
    (i.jenis || '').toUpperCase(),
    (i.nama_produk || '').toUpperCase(),
    (i.bahan || '-').toUpperCase(),
    Number(i.harga_jual) || 0,
    Number(i.hpp) || 0,
    Number(i.pot_shopee) || 0,
    Number(i.margin) || 0
  ]);
  db.query(sql, [values], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json({ message: `${result.affectedRows} produk berhasil diseed!` });
  });
};
