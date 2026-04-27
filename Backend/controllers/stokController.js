const db = require('../config/db');

exports.getAllStok = async (req, res) => {
    try {
        const promiseDb = db.promise();
        let query = "SELECT * FROM stok";
        const queryParams = [];

        if (req.query.cabang_id) {
            query += " WHERE cabang_id = ?";
            queryParams.push(req.query.cabang_id);
        }

        query += " ORDER BY nama_barang ASC";
        
        const [results] = await promiseDb.query(query, queryParams);
        res.status(200).json({ status: "success", data: results });
    } catch (error) {
        console.error("Error get stok:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createStok = async (req, res) => {
    try {
        const { nama_barang, jumlah, kategori, cabang_id, minimum_stok } = req.body;
        if (!nama_barang || !kategori || !cabang_id) {
            return res.status(400).json({ message: "Data tidak lengkap!" });
        }

        const promiseDb = db.promise();
        const sql = "INSERT INTO stok (nama_barang, jumlah, kategori, cabang_id, minimum_stok) VALUES (?, ?, ?, ?, ?)";
        const [result] = await promiseDb.query(sql, [nama_barang, jumlah || 0, kategori, cabang_id, minimum_stok || 5]);
        
        res.status(201).json({ message: "Barang berhasil ditambahkan!", id: result.insertId });
    } catch (error) {
        console.error("Error create stok:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateStok = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_barang, jumlah, kategori, cabang_id, minimum_stok } = req.body;

        const promiseDb = db.promise();
        const sql = "UPDATE stok SET nama_barang=?, jumlah=?, kategori=?, cabang_id=?, minimum_stok=? WHERE id=?";
        const [result] = await promiseDb.query(sql, [nama_barang, jumlah, kategori, cabang_id, minimum_stok, id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: "Barang tidak ditemukan!" });
        res.status(200).json({ message: "Barang berhasil diperbarui!" });
    } catch (error) {
        console.error("Error update stok:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteStok = async (req, res) => {
    try {
        const { id } = req.params;
        const promiseDb = db.promise();
        const sql = "DELETE FROM stok WHERE id = ?";
        const [result] = await promiseDb.query(sql, [id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ message: "Barang tidak ditemukan!" });
        res.status(200).json({ message: "Barang berhasil dihapus!" });
    } catch (error) {
        console.error("Error delete stok:", error);
        res.status(500).json({ message: error.message });
    }
};
