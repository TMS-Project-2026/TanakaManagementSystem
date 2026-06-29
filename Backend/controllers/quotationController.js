const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'quotations');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

exports.getAllQuotations = (req, res) => {
    const { status, cabang } = req.query;
    let sql = "SELECT * FROM marketing_quotations WHERE 1=1";
    const params = [];
    if (status) { sql += " AND status = ?"; params.push(status); }
    if (cabang) { sql += " AND cabang = ?"; params.push(cabang); }
    sql += " ORDER BY created_at DESC";
    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(200).json({ status: "success", data: results });
    });
};

exports.getQuotationById = (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM marketing_quotations WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (results.length === 0) return res.status(404).json({ status: "error", message: "Quotation tidak ditemukan!" });
        res.status(200).json({ status: "success", data: results[0] });
    });
};

exports.getNextQuotationNumber = (req, res) => {
    const { cabang } = req.query;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const codes = { 'Tanaka': 'TRB', 'Banua': 'BML', 'Acestreet': 'AC' };
    const branchCode = codes[cabang] || 'BML';
    const prefix = `QUO/${branchCode}/${year}/${month}/`;
    const sql = "SELECT no_quotation FROM marketing_quotations WHERE no_quotation LIKE ? ORDER BY no_quotation DESC LIMIT 1";
    db.query(sql, [`${prefix}%`], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        let nextNum = 1;
        if (results.length > 0 && results[0].no_quotation) {
            const lastNum = parseInt(results[0].no_quotation.split('/').pop(), 10);
            if (!isNaN(lastNum)) nextNum = lastNum + 1;
        }
        const generatedNo = `${prefix}${nextNum.toString().padStart(4, '0')}`;
        res.status(200).json({ status: "success", no_quotation: generatedNo });
    });
};

exports.createQuotation = (req, res) => {
    const {
        no_quotation, cabang = 'Banua', order_id,
        tanggal_quotation, tanggal_berlaku,
        nama_pt = '', alamat_pt = '', up_penagihan = '', cp_penagihan = '', email_customer = '',
        deskripsi_pesanan = '', items_detail,
        subtotal = 0, ppn_persen = 0, jumlah_ppn = 0,
        diskon_persen = 0, diskon = 0, ongkos_kirim = 0, grand_total_quo = 0,
        payment_type = 'DP', jenis_pembayaran = '', term_of_payment = '', payment_note = '',
        nama_marketing = '', nama_client_ttd = '',
        status = 'Draft'
    } = req.body;

    const sql = `INSERT INTO marketing_quotations (
        no_quotation, cabang, order_id, tanggal_quotation, tanggal_berlaku,
        nama_pt, alamat_pt, up_penagihan, cp_penagihan, email_customer,
        deskripsi_pesanan, items_detail,
        subtotal, ppn_persen, jumlah_ppn, diskon_persen, diskon, ongkos_kirim, grand_total_quo,
        payment_type, jenis_pembayaran, term_of_payment, payment_note,
        nama_marketing, nama_client_ttd, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        no_quotation, cabang, order_id || null, tanggal_quotation || null, tanggal_berlaku || null,
        nama_pt, alamat_pt, up_penagihan, cp_penagihan, email_customer,
        deskripsi_pesanan, items_detail ? JSON.stringify(items_detail) : null,
        subtotal || 0, ppn_persen || 0, jumlah_ppn || 0,
        diskon_persen || 0, diskon || 0, ongkos_kirim || 0, grand_total_quo || 0,
        payment_type, jenis_pembayaran, term_of_payment, payment_note,
        nama_marketing, nama_client_ttd, status || 'Draft'
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        res.status(201).json({ status: "success", message: "Quotation berhasil dibuat!", id: result.insertId });
    });
};

exports.updateQuotation = (req, res) => {
    const { id } = req.params;
    const fields = { ...req.body };
    delete fields.id;
    delete fields.created_at;
    delete fields.updated_at;

    if (Object.keys(fields).length === 0) {
        return res.status(400).json({ status: "error", message: "Data update kosong!" });
    }

    let setClause = [];
    let values = [];
    for (const [key, value] of Object.entries(fields)) {
        if (value === undefined) continue;
        setClause.push(`${key} = ?`);
        if ((key === 'items_detail' || key === 'file_uploads') && typeof value === 'object') {
            values.push(JSON.stringify(value));
        } else if ((key === 'tanggal_quotation' || key === 'tanggal_berlaku') && value === '') {
            values.push(null);
        } else {
            values.push(value);
        }
    }
    values.push(id);
    const sql = `UPDATE marketing_quotations SET ${setClause.join(', ')} WHERE id = ?`;
    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ status: "error", message: "Quotation tidak ditemukan!" });
        res.status(200).json({ status: "success", message: "Quotation berhasil diperbarui!" });
    });
};

exports.deleteQuotation = (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM marketing_quotations WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ status: "error", message: "Quotation tidak ditemukan!" });
        res.status(200).json({ status: "success", message: "Quotation berhasil dihapus!" });
    });
};

exports.uploadFiles = (req, res) => {
    const { id } = req.params;
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ status: "error", message: "Tidak ada file yang diupload!" });
    }

    // Get existing files
    db.query("SELECT file_uploads FROM marketing_quotations WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (results.length === 0) return res.status(404).json({ status: "error", message: "Quotation tidak ditemukan!" });

        let existingFiles = [];
        try {
            existingFiles = JSON.parse(results[0].file_uploads) || [];
        } catch (e) { existingFiles = []; }

        const newFiles = req.files.map(f => ({
            filename: f.filename,
            originalname: f.originalname,
            path: `/uploads/quotations/${f.filename}`,
            size: f.size,
            uploaded_at: new Date().toISOString()
        }));

        const allFiles = [...existingFiles, ...newFiles];

        db.query("UPDATE marketing_quotations SET file_uploads = ? WHERE id = ?",
            [JSON.stringify(allFiles), id],
            (err2) => {
                if (err2) return res.status(500).json({ status: "error", message: err2.message });
                res.status(200).json({ status: "success", message: "File berhasil diupload!", files: allFiles });
            }
        );
    });
};

exports.submitToFinance = (req, res) => {
    const { id } = req.params;
    // First get quotation data
    db.query("SELECT * FROM marketing_quotations WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ status: "error", message: err.message });
        if (results.length === 0) return res.status(404).json({ status: "error", message: "Quotation tidak ditemukan!" });

        const q = results[0];

        // Update status quotation
        db.query("UPDATE marketing_quotations SET status = 'Submitted' WHERE id = ?", [id], (err2) => {
            if (err2) return res.status(500).json({ status: "error", message: err2.message });

            const diajukanOleh = q.cabang === 'Acestreet' ? 'Marketing Accestret' : (q.cabang === 'Tanaka' ? 'Marketing Offline Tanaka' : 'Marketing Offline Banua');
            const approvalSql = `INSERT INTO approvals (tipe, keterangan, nominal, diajukan_oleh, status, reference_id)
                VALUES ('quotation_to_invoice', ?, ?, ?, 'pending', ?)`;
            const keterangan = `Quotation ${q.no_quotation || ''} - ${q.nama_pt || q.customer_name || 'Customer'}`;
            
            db.query(approvalSql, [keterangan, q.grand_total_quo || q.total || 0, diajukanOleh, id], (err3) => {
                if (err3) return res.status(500).json({ status: "error", message: err3.message });
                res.status(200).json({ status: "success", message: "Quotation berhasil diajukan ke Finance!" });
            });
        });
    });
};
