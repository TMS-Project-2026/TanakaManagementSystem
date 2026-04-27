const db = require('../config/db');

// Mengambil semua data offline dengan hitungan sisa hari
exports.getAllOfflineSales = (req, res) => {
    const sql = `
        SELECT *, 
        DATEDIFF(deadline_final, CURDATE()) as sisa_hari 
        FROM sales_offline 
        ORDER BY deadline_final ASC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

// Menambah order baru dengan logika otomatis 21 hari
exports.addOfflineSale = (req, res) => {
    const { customer_name, produk, qty, jenis_pembayaran, tgl_order, lokasi_proses } = req.body;
    
    // Hitung otomatis deadline: Tanggal Order + 21 Hari
    const date = new Date(tgl_order);
    date.setDate(date.getDate() + 21);
    const deadline_final = date.toISOString().split('T')[0];

    const sql = `INSERT INTO sales_offline 
        (customer_name, produk, qty, jenis_pembayaran, tgl_order, deadline_final, lokasi_proses) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(sql, [customer_name, produk, qty, jenis_pembayaran, tgl_order, deadline_final, lokasi_proses], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Order Offline Berhasil! Deadline diset 21 hari." });
    });
};

// Update order dengan raw SQL
exports.updateOfflineSale = (req, res) => {
    const { id } = req.params;
    const { customer_name, produk, qty, jenis_pembayaran, lokasi_proses, tgl_masuk, deadline_final, status_produksi, foto_update } = req.body;
    
    const sql = `UPDATE sales_offline SET 
        customer_name = ?, produk = ?, qty = ?, jenis_pembayaran = ?, lokasi_proses = ?, tgl_masuk = ?, deadline_final = ?, status_produksi = ?, foto_update = ? 
        WHERE id = ?`;
    
    db.query(sql, [customer_name, produk, qty, jenis_pembayaran, lokasi_proses, tgl_masuk, deadline_final, status_produksi, foto_update, id], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Sale not found' });
        res.json({ message: 'Sale updated successfully' });
    });
};

// Delete order dengan raw SQL
exports.deleteOfflineSale = (req, res) => {
    const { id } = req.params;
    
    const sql = `DELETE FROM sales_offline WHERE id = ?`;
    
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Sale not found' });
        res.json({ message: 'Sale deleted successfully' });
    });
};