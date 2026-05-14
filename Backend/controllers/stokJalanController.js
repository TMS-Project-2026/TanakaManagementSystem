const db = require('../config/db');

// Get all Stok Jalan records
exports.getAllStokJalan = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const sql = `SELECT * FROM stok_jalan ORDER BY tanggal DESC, id DESC`;
        const [results] = await promiseDb.query(sql);
        res.status(200).json({ status: "success", data: results });
    } catch (error) {
        console.error("Error get stok_jalan:", error);
        res.status(500).json({ message: error.message });
    }
};

// Create a new Stok Jalan record
exports.createStokJalan = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const { tanggal, nama_barang, nomer_barang, ukuran, stok_total, wo, proses_jahit, bordir, finishing, status } = req.body;
        
        if (!tanggal || !nama_barang || !ukuran) {
            return res.status(400).json({ message: "Data tanggal, nama barang, dan ukuran wajib diisi!" });
        }

        const sql = `
            INSERT INTO stok_jalan 
            (tanggal, nama_barang, nomer_barang, ukuran, stok_total, wo, proses_jahit, bordir, finishing, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await promiseDb.query(sql, [
            tanggal, 
            nama_barang, 
            nomer_barang || '', 
            ukuran, 
            Number(stok_total) || 0, 
            Number(wo) || 0, 
            Number(proses_jahit) || 0, 
            Number(bordir) || 0, 
            Number(finishing) || 0, 
            status || 'Dalam Proses'
        ]);

        res.status(201).json({ status: "success", message: "Stok jalan berhasil dicatat!" });
    } catch (error) {
        console.error("Error create stok_jalan:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update an existing Stok Jalan record
exports.updateStokJalan = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const { id } = req.params;
        const { tanggal, nama_barang, nomer_barang, ukuran, stok_total, wo, proses_jahit, bordir, finishing, status } = req.body;

        if (!tanggal || !nama_barang || !ukuran) {
            return res.status(400).json({ message: "Data tanggal, nama barang, dan ukuran wajib diisi!" });
        }

        const sql = `
            UPDATE stok_jalan 
            SET tanggal = ?, 
                nama_barang = ?, 
                nomer_barang = ?, 
                ukuran = ?, 
                stok_total = ?, 
                wo = ?, 
                proses_jahit = ?, 
                bordir = ?, 
                finishing = ?, 
                status = ?
            WHERE id = ?
        `;

        await promiseDb.query(sql, [
            tanggal, 
            nama_barang, 
            nomer_barang || '', 
            ukuran, 
            Number(stok_total) || 0, 
            Number(wo) || 0, 
            Number(proses_jahit) || 0, 
            Number(bordir) || 0, 
            Number(finishing) || 0, 
            status, 
            id
        ]);

        res.status(200).json({ status: "success", message: "Stok jalan berhasil diperbarui!" });
    } catch (error) {
        console.error("Error update stok_jalan:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete a Stok Jalan record
exports.deleteStokJalan = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const { id } = req.params;

        await promiseDb.query("DELETE FROM stok_jalan WHERE id = ?", [id]);
        res.status(200).json({ status: "success", message: "Stok jalan berhasil dihapus!" });
    } catch (error) {
        console.error("Error delete stok_jalan:", error);
        res.status(500).json({ message: error.message });
    }
};
