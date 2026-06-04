const db = require('../config/db');

exports.createPermintaan = async (req, res) => {
    try {
        const { stok_id, jumlah, nama_pengambil, divisi, keterangan } = req.body;
        
        await db.promise().query(
            "INSERT INTO permintaan_stok (stok_id, jumlah, nama_pengambil, divisi, keterangan, status) VALUES (?, ?, ?, ?, ?, 'pending')",
            [stok_id, jumlah, nama_pengambil, divisi, keterangan]
        );
        
        res.status(201).json({ status: 'success', message: 'Permintaan stok berhasil diajukan.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getPermintaan = async (req, res) => {
    try {
        const [rows] = await db.promise().query(`
            SELECT p.*, s.nama_barang, s.nama_brand, s.kategori, s.ukuran, s.cabang_id, s.kode_rak
            FROM permintaan_stok p
            JOIN stok s ON p.stok_id = s.id
            ORDER BY p.tanggal_request DESC
        `);
        res.status(200).json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.approvePermintaan = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Cek permintaan
        const [permintaanRows] = await db.promise().query("SELECT * FROM permintaan_stok WHERE id = ?", [id]);
        if (permintaanRows.length === 0) return res.status(404).json({ message: 'Permintaan tidak ditemukan.' });
        
        const permintaan = permintaanRows[0];
        if (permintaan.status !== 'pending') return res.status(400).json({ message: 'Permintaan sudah diproses.' });
        
        // Cek stok
        const [stokRows] = await db.promise().query("SELECT * FROM stok WHERE id = ?", [permintaan.stok_id]);
        if (stokRows.length === 0) return res.status(404).json({ message: 'Stok barang tidak ditemukan.' });
        
        const stok = stokRows[0];
        if (stok.jumlah < permintaan.jumlah) {
            return res.status(400).json({ message: 'Stok tidak mencukupi untuk memenuhi permintaan.' });
        }
        
        // Approve
        await db.promise().query(
            "UPDATE permintaan_stok SET status = 'approved', tanggal_approval = CURRENT_TIMESTAMP WHERE id = ?",
            [id]
        );
        
        // Kurangi stok
        await db.promise().query(
            "UPDATE stok SET jumlah = jumlah - ? WHERE id = ?",
            [permintaan.jumlah, permintaan.stok_id]
        );
        
        // Catat di barang keluar
        await db.promise().query(
            "INSERT INTO barang_keluar (barang_id, jumlah, tanggal, tujuan) VALUES (?, ?, CURRENT_DATE, ?)",
            [permintaan.stok_id, permintaan.jumlah, `Diambil oleh ${permintaan.nama_pengambil} (${permintaan.divisi})`]
        );
        
        res.status(200).json({ status: 'success', message: 'Permintaan disetujui dan stok berhasil dikurangi.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.rejectPermintaan = async (req, res) => {
    try {
        const { id } = req.params;
        await db.promise().query("UPDATE permintaan_stok SET status = 'rejected', tanggal_approval = CURRENT_TIMESTAMP WHERE id = ?", [id]);
        res.status(200).json({ status: 'success', message: 'Permintaan berhasil ditolak.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.getPendingCount = async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT COUNT(*) as count FROM permintaan_stok WHERE status = 'pending'");
        res.status(200).json({ status: 'success', count: rows[0].count });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
