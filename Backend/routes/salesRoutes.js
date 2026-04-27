const express = require('express');
const router = express.Router();
const db = require('../config/db');

// --- 1. Ambil Semua Data Order ---
router.get('/', (req, res) => {
    const sql = "SELECT * FROM sales ORDER BY tanggal DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
});

// --- 2. Tambah Data Order Baru ---
router.post('/', (req, res) => {
    const { customer_name, instansi, produk, qty, total_harga, status, tanggal } = req.body;
    const sql = "INSERT INTO sales (customer_name, instansi, produk, qty, total_harga, status, tanggal) VALUES (?, ?, ?, ?, ?, ?, ?)";
    
    db.query(sql, [customer_name, instansi, produk, qty, total_harga, status, tanggal], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal menyimpan data order: " + err.message });
        res.status(201).json({ message: "Data Order Berhasil Disimpan!" });
    });
});

// --- 3. Update Status Order ---
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const sql = "UPDATE sales SET status = ? WHERE id = ?";
    db.query(sql, [status, id], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Status order diperbarui!" });
    });
});

// --- 4. Hapus Order ---
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM sales WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Data order dihapus." });
    });
});

module.exports = router;