const db = require('../config/db');

// Menambahkan Pesanan Baru (PO)
exports.buatPO = (req, res) => {
    const { nama_pelanggan, total_item, tanggal_pesan, deadline } = req.body;
    
    // req.user.id_user didapat dari token JWT orang yang sedang login (Admin)
    const id_user = req.user.id_user; 

    if (!nama_pelanggan || !total_item || !deadline) {
        return res.status(400).json({ message: "Data pesanan tidak lengkap!" });
    }

    const sql = `INSERT INTO transaksi_po 
                 (id_user, nama_pelanggan, total_item, status_produksi, tanggal_pesan, deadline) 
                 VALUES (?, ?, ?, 'Antre', ?, ?)`;

    db.query(sql, [id_user, nama_pelanggan, total_item, tanggal_pesan, deadline], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal membuat PO: " + err.message });
        
        res.status(201).json({ 
            message: "Purchase Order (PO) berhasil dibuat!",
            id_po: result.insertId
        });
    });
};

// Mengubah Status Produksi (Misal: dari 'Antre' menjadi 'Penjahit')
exports.updateStatusProduksi = (req, res) => {
    const { id_po } = req.params;
    const { status_produksi } = req.body;

    const validStatus = ['Antre', 'Penjahit', 'Packing', 'Pengiriman', 'Selesai'];
    if (!validStatus.includes(status_produksi)) {
        return res.status(400).json({ message: "Status produksi tidak valid!" });
    }

    const sql = "UPDATE transaksi_po SET status_produksi = ? WHERE id_po = ?";
    
    db.query(sql, [status_produksi, id_po], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal update status: " + err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Data PO tidak ditemukan." });

        res.json({ message: `Status PO #${id_po} berhasil diperbarui menjadi: ${status_produksi}` });
    });
};

// Menampilkan semua PO untuk dipantau di Dashboard
exports.getAllPO = (req, res) => {
    // Kita lakukan JOIN dengan tabel users agar tahu Admin mana yang menginput
    const sql = `
        SELECT p.*, u.nama_lengkap as admin_pencatat 
        FROM transaksi_po p
        LEFT JOIN users u ON p.id_user = u.id_user
        ORDER BY p.deadline ASC
    `;
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(200).json({ data: results });
    });
};
exports.updateStatusProduksi = (req, res) => {
    const { id_po } = req.params;
    const { status_produksi } = req.body;

    const sql = "UPDATE transaksi_po SET status_produksi = ? WHERE id_po = ?";
    db.query(sql, [status_produksi, id_po], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Status berhasil diperbarui!" });
    });
};
