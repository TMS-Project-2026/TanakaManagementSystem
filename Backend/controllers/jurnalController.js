const db = require('../config/db');

const q = (query, params = []) => new Promise((resolve, reject) =>
    db.query(query, params, (err, r) => err ? reject(err) : resolve(r))
);

const buildFilter = (startDate, endDate, cabang, dateCol, cabangCol) => {
    let sql = '';
    const p = [];
    if (startDate && endDate) { sql += ` AND ${dateCol} >= ? AND ${dateCol} <= ?`; p.push(startDate, endDate); }
    if (cabang && cabang !== 'Semua Cabang') { sql += ` AND ${cabangCol} = ?`; p.push(cabang); }
    return { sql, p };
};

// 1. Hutang (cash_out_bank unpaid)
exports.getHutang = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const f = buildFilter(startDate, endDate, cabang, 'tanggal_transaksi', 'cabang');
        // From cash_out_bank pending/overdue
        const cobRows = await q(
            `SELECT transaksi_id, nama_vendor as supplier, nominal, tanggal_transaksi as jatuh_tempo, status, cabang, 'Cash Out' as sumber
             FROM cash_out_bank WHERE status IN ('Pending') ${f.sql} ORDER BY tanggal_transaksi ASC`,
            f.p
        );
        // From cash_in_bank pending (money still owed to us)
        const cibRows = await q(
            `SELECT transaksi_id, nama_vendor as supplier, total as nominal, due_date as jatuh_tempo, status, cabang, 'Cash In' as sumber
             FROM cash_in_bank WHERE status IN ('Pending','Overdue') ${f.sql} ORDER BY due_date ASC`,
            f.p
        );
        const data = [...cobRows, ...cibRows].sort((a, b) => new Date(a.jatuh_tempo) - new Date(b.jatuh_tempo));
        res.json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// 2. Piutang (invoice not yet paid)
exports.getPiutang = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const f = buildFilter(startDate, endDate, cabang, 'tanggal_terbit', 'cabang');
        const data = await q(
            `SELECT id, no_invoice, cabang, nama_pt as customer, deskripsi as deskripsi_pemasaran,
                    grand_total as nominal, tanggal_jatuh_tempo as jatuh_tempo, status
             FROM invoice WHERE status NOT IN ('Lunas','Draft','Void') ${f.sql} ORDER BY tanggal_jatuh_tempo ASC`,
            f.p
        );
        res.json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// 3. Rekap Jurnal — from journals table with proper field aliases
exports.getJurnal = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const f = buildFilter(startDate, endDate, cabang, 'transaction_date', 'branch');
        const data = await q(
            `SELECT 
                id,
                transaction_id as referensi,
                transaction_date as tanggal,
                from_account as kode_akun,
                account_name as nama_akun,
                description as keterangan,
                debit,
                credit as kredit,
                amount,
                branch as cabang,
                category,
                journal_type,
                status
             FROM journals WHERE 1=1 ${f.sql} ORDER BY transaction_date DESC, id DESC`,
            f.p
        );
        res.json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// 4. Buku Besar — grouped by account with proper field aliases
exports.getBukuBesar = async (req, res) => {
    const { akun_id, startDate, endDate, cabang } = req.query;
    try {
        const f = buildFilter(startDate, endDate, cabang, 'transaction_date', 'branch');
        let sql = `SELECT 
            id,
            transaction_id as referensi,
            transaction_date as tanggal,
            from_account as kode_akun,
            account_name as nama_akun,
            description as keterangan,
            debit,
            credit as kredit,
            amount,
            branch as cabang,
            category,
            journal_type,
            status
        FROM journals WHERE 1=1 ${f.sql}`;
        const params = [...f.p];
        if (akun_id) { sql += ` AND account_name = ?`; params.push(akun_id); }
        sql += ` ORDER BY transaction_date ASC, id ASC`;

        const [transaksi, akunRows] = await Promise.all([
            q(sql, params),
            q(`SELECT DISTINCT account_name as nama_akun, from_account as kode_akun FROM journals ORDER BY account_name`)
        ]);

        const akunList = akunRows.map(a => ({ id: a.nama_akun, kode_akun: a.kode_akun || a.nama_akun, nama_akun: a.nama_akun }));
        res.json({ status: 'success', data: { transaksi, akunList } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};
