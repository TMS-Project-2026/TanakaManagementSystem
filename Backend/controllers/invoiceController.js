const db = require('../config/db');

exports.getAllInvoice = (req, res) => {
    // Optional filtering
    const { status, cabang } = req.query;
    
    let sql = "SELECT * FROM invoice WHERE 1=1";
    const params = [];

    if (status) {
        sql += " AND status = ?";
        params.push(status);
    }
    if (cabang) {
        sql += " AND cabang = ?";
        params.push(cabang);
    }

    sql += " ORDER BY created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(200).json({ status: "success", data: results });
    });
};

exports.getInvoiceById = (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM invoice WHERE id = ?";
    
    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (results.length === 0) return res.status(404).json({ status: "error", message: "Invoice tidak ditemukan!" });
        res.status(200).json({ status: "success", data: results[0] });
    });
};

exports.createInvoice = (req, res) => {
    const {
        no_invoice, cabang, tanggal_transaksi, tanggal_terbit, tanggal_jatuh_tempo,
        nama_pt, alamat_pt, cp_penagihan, email,
        deskripsi, detail_pekerjaan, qty, harga_satuan, subtotal, ppn_persen, jumlah_ppn, grand_total, keterangan,
        note, materai, ttd, nama_accounting, penanggung_jawab, jabatan, status
    } = req.body;
    
    let generatedNoInvoice = no_invoice;
    if (!generatedNoInvoice) {
        const dateObj = new Date();
        generatedNoInvoice = `INV/${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const sql = `
        INSERT INTO invoice (
            no_invoice, cabang, tanggal_transaksi, tanggal_terbit, tanggal_jatuh_tempo,
            nama_pt, alamat_pt, cp_penagihan, email,
            deskripsi, detail_pekerjaan, qty, harga_satuan, subtotal, ppn_persen, jumlah_ppn, grand_total, keterangan,
            note, materai, ttd, nama_accounting, penanggung_jawab, jabatan, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        generatedNoInvoice, cabang, tanggal_transaksi, tanggal_terbit, tanggal_jatuh_tempo,
        nama_pt, alamat_pt, cp_penagihan, email,
        deskripsi, detail_pekerjaan, qty || 1, harga_satuan || 0, subtotal || 0, ppn_persen || 0, jumlah_ppn || 0, grand_total || 0, keterangan,
        note, materai ? 1 : 0, ttd ? 1 : 0, nama_accounting, penanggung_jawab, jabatan, status || 'Draft'
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(201).json({ status: "success", message: "Invoice berhasil dibuat!", id: result.insertId });
    });
};

exports.updateInvoice = (req, res) => {
    const { id } = req.params;
    
    const fields = req.body;
    
    if (Object.keys(fields).length === 0) {
        return res.status(400).json({ status: "error", message: "Data update kosong!" });
    }

    let setClause = [];
    let values = [];

    for (const [key, value] of Object.entries(fields)) {
        setClause.push(`${key} = ?`);
        values.push(value);
    }
    values.push(id);

    const sql = `UPDATE invoice SET ${setClause.join(', ')} WHERE id = ?`;

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ status: "error", message: "Invoice tidak ditemukan!" });
        res.status(200).json({ status: "success", message: "Invoice berhasil diperbarui!" });
    });
};

exports.deleteInvoice = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM invoice WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ status: "error", message: "Invoice tidak ditemukan!" });
        res.status(200).json({ status: "success", message: "Invoice berhasil dihapus!" });
    });
};
