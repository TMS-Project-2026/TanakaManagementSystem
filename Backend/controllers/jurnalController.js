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

// 1. Hutang (Accounts Payable)
exports.getHutang = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        // Hutang is cash_in_bank where status is Unpaid or Pending or Overdue
        const filter = getFilterQuery(startDate, endDate, cabang, 'tanggal_transaksi', 'cabang');
        const sql = `SELECT * FROM cash_in_bank WHERE status != 'Paid' ${filter.sql} ORDER BY due_date ASC`;
        const [results] = await db.promise().query(sql, filter.params);
        res.json({ status: 'success', data: results });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// 2. Piutang (Accounts Receivable)
exports.getPiutang = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const filter = getFilterQuery(startDate, endDate, cabang, 'tanggal_terbit', 'cabang');
        const sql = `SELECT id, no_invoice, cabang, nama_pt as customer, deskripsi as deskripsi_pemasaran, grand_total as nominal, tanggal_jatuh_tempo as jatuh_tempo, status FROM invoice WHERE status != 'Lunas' AND status != 'Draft' ${filter.sql} ORDER BY tanggal_jatuh_tempo ASC`;
        const [results] = await db.promise().query(sql, filter.params);
        res.json({ status: 'success', data: results });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// 3. Rekap Jurnal
exports.getJurnal = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const filter = getFilterQuery(startDate, endDate, cabang, 'transaction_date', 'branch');
        const sql = `
            SELECT * 
            FROM journals 
            WHERE 1=1 ${filter.sql} 
            ORDER BY transaction_date DESC, id DESC
        `;
        const [results] = await db.promise().query(sql, filter.params);
        res.json({ status: 'success', data: results });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// 4. Buku Besar
exports.getBukuBesar = async (req, res) => {
    const { akun_id, startDate, endDate, cabang } = req.query;
    try {
        const filter = getFilterQuery(startDate, endDate, cabang, 'transaction_date', 'branch');
        let sql = `
            SELECT * 
            FROM journals 
            WHERE 1=1 ${filter.sql} 
        `;
        const params = [...filter.params];
        
        // akun_id is passed as account_name from the new system
        if (akun_id) {
            sql += ` AND account_name = ?`;
            params.push(akun_id);
        }
        
        sql += ` ORDER BY transaction_date ASC, id ASC`;

        const [results] = await db.promise().query(sql, params);
        
        // Extract unique account names
        const [akunRows] = await db.promise().query("SELECT DISTINCT account_name as nama_akun, account_name as kode_akun FROM journals ORDER BY account_name");
        
        const akunList = akunRows.map(a => ({
            id: a.nama_akun,
            kode_akun: a.kode_akun,
            nama_akun: a.nama_akun
        }));

        res.json({ status: 'success', data: { transaksi: results, akunList } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
