const db = require('../config/db');

exports.getAllPayment = (req, res) => {
    const sql = "SELECT * FROM payment ORDER BY tanggal DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json({ status: "success", data: results });
    });
};

exports.createPayment = (req, res) => {
    const { transaksi_id, jumlah, status, tanggal } = req.body;
    
    if (!transaksi_id || !jumlah || !tanggal) {
        return res.status(400).json({ message: "Data payment tidak lengkap!" });
    }

    const sql = "INSERT INTO payment (transaksi_id, jumlah, status, tanggal) VALUES (?, ?, ?, ?)";
    db.query(sql, [transaksi_id, jumlah, status || 'pending', tanggal], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ message: "Payment berhasil ditambahkan!", id: result.insertId });
    });
};

exports.updatePayment = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ message: "Status harus diisi!" });
    }

    const sql = "UPDATE payment SET status = ? WHERE id = ?";
    db.query(sql, [status, id], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Payment tidak ditemukan!" });
        res.status(200).json({ message: "Status payment berhasil diperbarui!" });
    });
};
