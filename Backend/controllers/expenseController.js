const db = require('../config/db');

exports.getAllExpense = (req, res) => {
    const sql = "SELECT * FROM expense ORDER BY tanggal DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json({ status: "success", data: results });
    });
};

exports.createExpense = (req, res) => {
    const { nama_pengeluaran, jumlah, kategori, tanggal } = req.body;
    
    if (!nama_pengeluaran || !jumlah || !kategori || !tanggal) {
        return res.status(400).json({ message: "Data pengeluaran tidak lengkap!" });
    }

    const sql = "INSERT INTO expense (nama_pengeluaran, jumlah, kategori, tanggal) VALUES (?, ?, ?, ?)";
    db.query(sql, [nama_pengeluaran, jumlah, kategori, tanggal], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ message: "Pengeluaran berhasil ditambahkan!", id: result.insertId });
    });
};

exports.updateExpense = (req, res) => {
    const { id } = req.params;
    const { nama_pengeluaran, jumlah, kategori, tanggal } = req.body;

    const sql = "UPDATE expense SET nama_pengeluaran = ?, jumlah = ?, kategori = ?, tanggal = ? WHERE id = ?";
    db.query(sql, [nama_pengeluaran, jumlah, kategori, tanggal, id], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Pengeluaran tidak ditemukan!" });
        res.status(200).json({ message: "Pengeluaran berhasil diperbarui!" });
    });
};

exports.deleteExpense = (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM expense WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Pengeluaran tidak ditemukan!" });
        res.status(200).json({ message: "Pengeluaran berhasil dihapus!" });
    });
};
