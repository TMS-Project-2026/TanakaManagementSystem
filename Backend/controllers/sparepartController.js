const db = require('../config/db');

exports.getAllSparepart = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const [results] = await promiseDb.query("SELECT * FROM sparepart ORDER BY nama_part ASC");
        res.status(200).json({ status: "success", data: results });
    } catch (error) {
        console.error("Error get sparepart:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createSparepart = async (req, res) => {
    try {
        const { nama_part, jumlah, kategori, supplier } = req.body;
        if (!nama_part || !kategori) {
            return res.status(400).json({ message: "Data tidak lengkap!" });
        }

        const promiseDb = db.promise();
        const sql = "INSERT INTO sparepart (nama_part, jumlah, kategori, supplier) VALUES (?, ?, ?, ?)";
        const [result] = await promiseDb.query(sql, [nama_part, jumlah || 0, kategori, supplier]);
        
        res.status(201).json({ message: "Sparepart berhasil ditambahkan!", id: result.insertId });
    } catch (error) {
        console.error("Error create sparepart:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateSparepart = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_part, jumlah, kategori, supplier } = req.body;

        const promiseDb = db.promise();
        const sql = "UPDATE sparepart SET nama_part=?, jumlah=?, kategori=?, supplier=? WHERE id=?";
        const [result] = await promiseDb.query(sql, [nama_part, jumlah, kategori, supplier, id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: "Sparepart tidak ditemukan!" });
        res.status(200).json({ message: "Sparepart berhasil diperbarui!" });
    } catch (error) {
        console.error("Error update sparepart:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteSparepart = async (req, res) => {
    try {
        const { id } = req.params;
        const promiseDb = db.promise();
        const sql = "DELETE FROM sparepart WHERE id = ?";
        const [result] = await promiseDb.query(sql, [id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: "Sparepart tidak ditemukan!" });
        res.status(200).json({ message: "Sparepart berhasil dihapus!" });
    } catch (error) {
        console.error("Error delete sparepart:", error);
        res.status(500).json({ message: error.message });
    }
};
