const db = require('../config/db');

// READ: Ambil semua data prospek
exports.getLeads = (req, res) => {
    const sql = "SELECT * FROM marketing_leads ORDER BY tanggal_followup DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

// CREATE: Tambah prospek baru
exports.addLead = (req, res) => {
    const { nama_instansi, pic_kontak, tanggal_followup } = req.body;
    
    if (!nama_instansi || !pic_kontak || !tanggal_followup) {
        return res.status(400).json({ message: "Semua data harus diisi!" });
    }

    const sql = "INSERT INTO marketing_leads (nama_instansi, pic_kontak, tanggal_followup, status) VALUES (?, ?, ?, 'Follow Up')";
    db.query(sql, [nama_instansi, pic_kontak, tanggal_followup], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal menyimpan ke database: " + err.message });
        res.status(201).json({ message: "Prospek baru berhasil ditambahkan!" });
    });
};

// UPDATE: Ubah status prospek (Deal/Negosiasi dll)
exports.updateStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatus = ['Follow Up', 'Negosiasi', 'Deal', 'Batal'];
    if (!validStatus.includes(status)) {
        return res.status(400).json({ message: "Status tidak valid!" });
    }

    const sql = "UPDATE marketing_leads SET status = ? WHERE id = ?";
    db.query(sql, [status, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal update status: " + err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Data tidak ditemukan." });
        res.json({ message: "Status negosiasi diperbarui!" });
    });
};

// DELETE: Hapus prospek
exports.deleteLead = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM marketing_leads WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Data prospek dihapus." });
    });
};