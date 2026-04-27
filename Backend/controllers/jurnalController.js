const db = require('../config/db');

const getFilterQuery = (startDate, endDate, cabang, dateColumn, cabangColumn = 'cabang') => {
    let sql = "";
    let params = [];
    if (startDate && endDate) {
        sql += ` AND ${dateColumn} >= ? AND ${dateColumn} <= ?`;
        params.push(startDate, endDate);
    }
    if (cabang && cabang !== 'Semua Cabang') {
        sql += ` AND ${cabangColumn} = ?`;
        params.push(cabang);
    }
    return { sql, params };
};

exports.getHutang = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const filter = getFilterQuery(startDate, endDate, cabang, 'created_at', 'cabang');
        const sql = `SELECT * FROM hutang WHERE 1=1 ${filter.sql} ORDER BY jatuh_tempo ASC`;
        const [results] = await db.promise().query(sql, filter.params);
        res.json({ status: 'success', data: results });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getPiutang = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        // Piutang usually comes from unpaid invoices
        const filter = getFilterQuery(startDate, endDate, cabang, 'tanggal_terbit', 'cabang');
        const sql = `SELECT id, no_invoice, cabang, nama_pt as customer, deskripsi as deskripsi_pemasaran, grand_total as nominal, tanggal_jatuh_tempo as jatuh_tempo, status FROM invoice WHERE status != 'Lunas' AND status != 'Draft' ${filter.sql} ORDER BY tanggal_jatuh_tempo ASC`;
        const [results] = await db.promise().query(sql, filter.params);
        res.json({ status: 'success', data: results });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getJurnal = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const filter = getFilterQuery(startDate, endDate, cabang, 'tanggal', 'cabang');
        const sql = `
            SELECT j.*, a.nama_akun, a.kode_akun 
            FROM jurnal_umum j 
            JOIN akun a ON j.akun_id = a.id 
            WHERE 1=1 ${filter.sql} 
            ORDER BY j.tanggal DESC, j.id DESC
        `;
        const [results] = await db.promise().query(sql, filter.params);
        res.json({ status: 'success', data: results });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getBukuBesar = async (req, res) => {
    const { akun_id, startDate, endDate, cabang } = req.query;
    try {
        const filter = getFilterQuery(startDate, endDate, cabang, 'tanggal', 'cabang');
        let sql = `
            SELECT j.*, a.nama_akun, a.kode_akun 
            FROM jurnal_umum j 
            JOIN akun a ON j.akun_id = a.id 
            WHERE 1=1 ${filter.sql} 
        `;
        const params = [...filter.params];
        
        if (akun_id) {
            sql += ` AND j.akun_id = ?`;
            params.push(akun_id);
        }
        
        sql += ` ORDER BY j.tanggal ASC, j.id ASC`;

        const [results] = await db.promise().query(sql, params);
        
        // Also fetch list of akun for dropdown
        const [akunList] = await db.promise().query("SELECT * FROM akun ORDER BY kode_akun");

        res.json({ status: 'success', data: { transaksi: results, akunList } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
