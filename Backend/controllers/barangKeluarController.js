const db = require('../config/db');

exports.getAllBarangKeluar = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const sql = `
            SELECT bk.*, s.nama_barang, s.cabang_id 
            FROM barang_keluar bk
            JOIN stok s ON bk.barang_id = s.id
            ORDER BY bk.tanggal DESC, bk.id DESC
        `;
        const [results] = await promiseDb.query(sql);
        res.status(200).json({ status: "success", data: results });
    } catch (error) {
        console.error("Error get barang_keluar:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.createBarangKeluar = async (req, res) => {
    try {
        const { barang_id, jumlah, tanggal, tujuan } = req.body;
        if (!barang_id || !jumlah || !tanggal) {
            return res.status(400).json({ message: "Data tidak lengkap!" });
        }

        const promiseDb = db.promise();

        // Cek stok saat ini
        const [stokResult] = await promiseDb.query("SELECT jumlah FROM stok WHERE id = ?", [barang_id]);
        if (stokResult.length === 0) return res.status(404).json({ message: "Barang tidak ditemukan!" });
        
        const stokSaatIni = stokResult[0].jumlah;
        if (stokSaatIni < jumlah) {
            return res.status(400).json({ message: `Stok tidak cukup! Stok saat ini: ${stokSaatIni}` });
        }
        
        // 1. Insert into barang_keluar
        const sqlInsert = "INSERT INTO barang_keluar (barang_id, jumlah, tanggal, tujuan) VALUES (?, ?, ?, ?)";
        await promiseDb.query(sqlInsert, [barang_id, jumlah, tanggal, tujuan]);
        
        // 2. Update stok
        const sqlUpdate = "UPDATE stok SET jumlah = jumlah - ? WHERE id = ?";
        await promiseDb.query(sqlUpdate, [jumlah, barang_id]);

        res.status(201).json({ message: "Barang keluar berhasil dicatat dan stok berkurang!" });
    } catch (error) {
        console.error("Error create barang_keluar:", error);
        res.status(500).json({ message: error.message });
    }
};
