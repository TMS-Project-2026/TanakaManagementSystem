const db = require('../config/db');

// READ: Ambil semua data prospek (dengan filter tanggal optional)
exports.getLeads = (req, res) => {
    const { startDate, endDate } = req.query;
    let sql = "SELECT * FROM marketing_leads ORDER BY tanggal_masuk DESC";
    let params = [];

    // Filter berdasarkan tanggal jika dikirim
    if (startDate && endDate) {
        sql = "SELECT * FROM marketing_leads WHERE tanggal_masuk BETWEEN ? AND ? ORDER BY tanggal_masuk DESC";
        params = [startDate, endDate];
    }

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: `Database error: ${err.message}` });
        res.json(results);
    });
};

// CREATE: Tambah prospek baru dengan form data Sales Offline
exports.addLead = (req, res) => {
    const { nama_customer, produk, qty, harga_awal, diskon, harga_potongan, jenis_pembayaran, nominal_dp, tanggal_masuk, deadline_final, catatan } = req.body;

    // Validasi field required
    if (!nama_customer || !produk || !qty || !tanggal_masuk) {
        return res.status(400).json({ message: "Data required: nama_customer, produk, qty, tanggal_masuk" });
    }

    const sql = `INSERT INTO marketing_leads 
                 (nama_customer, produk, qty, harga_awal, diskon, harga_potongan, jenis_pembayaran, nominal_dp, tanggal_masuk, deadline_final, catatan, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`;

    const values = [
        nama_customer,
        produk,
        parseInt(qty) || 1,
        parseFloat(harga_awal) || null,
        parseFloat(diskon) || 0,
        parseFloat(harga_potongan) || null,
        jenis_pembayaran || 'Lunas',
        parseFloat(nominal_dp) || 0,
        tanggal_masuk,
        deadline_final || null,
        catatan || ''
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Database Insert Error:", err);
            return res.status(500).json({ message: `Gagal menyimpan data: ${err.message}` });
        }
        res.status(201).json({ message: "Data berhasil ditambahkan!", id: result.insertId });
    });
};


// UPDATE: Ubah status prospek
exports.updateStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatus = ['Pending', 'Follow Up', 'Negosiasi', 'Deal', 'Batal'];
    if (!validStatus.includes(status)) {
        return res.status(400).json({ message: "Status tidak valid! Gunakan: " + validStatus.join(", ") });
    }

    const sql = "UPDATE marketing_leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    db.query(sql, [status, id], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal update status: " + err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Data tidak ditemukan." });
        res.json({ message: "Status berhasil diperbarui!" });
    });
};

// DELETE: Hapus prospek
exports.deleteLead = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM marketing_leads WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ message: `Gagal menghapus data: ${err.message}` });
        if (result.affectedRows === 0) return res.status(404).json({ message: "Data tidak ditemukan." });
        res.json({ message: "Data berhasil dihapus." });
    });
};

// AJUKAN KE FINANCE: Memindahkan Deal menjadi approval
exports.ajukanKeFinance = (req, res) => {
    const { id } = req.params;
    
    // 1. Ambil data lead
    db.query("SELECT * FROM marketing_leads WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error: " + err.message });
        if (results.length === 0) return res.status(404).json({ message: "Data pesanan tidak ditemukan" });
        
        const lead = results[0];
        if (lead.status !== 'Deal') {
            return res.status(400).json({ message: "Hanya pesanan dengan status 'Deal' yang bisa diajukan ke Finance." });
        }

        // 2. Insert ke approvals
        const keterangan = `Quotation untuk ${lead.nama_customer} - Produk: ${lead.produk} (${lead.qty} pcs)`;
        const nominal = lead.harga_potongan || (lead.harga_awal * lead.qty);
        
        const sqlApproval = `INSERT INTO approvals (tipe, keterangan, nominal, diajukan_oleh, status, tanggal_pengajuan, reference_id) 
                             VALUES ('quotation_to_invoice', ?, ?, 'Marketing', 'pending', CURRENT_TIMESTAMP, ?)`;
                             
        db.query(sqlApproval, [keterangan, nominal, id], (errApprove, resultApprove) => {
            if (errApprove) return res.status(500).json({ message: "Gagal mengajukan: " + errApprove.message });
            
            // Simpan referensi id dari approval agar bisa dilacak nantinya (optional, saat ini update status saja)
            db.query("UPDATE marketing_leads SET status = 'Menunggu Finance' WHERE id = ?", [id], (errUpdate) => {
                if (errUpdate) return res.status(500).json({ message: "Berhasil diajukan tapi gagal update status lead." });
                res.json({ message: "Pesanan berhasil diajukan ke Finance." });
            });
        });
    });
};