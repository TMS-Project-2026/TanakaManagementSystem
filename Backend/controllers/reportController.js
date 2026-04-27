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

exports.getLabaRugi = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;

    try {
        // Revenue from invoices (excluding drafts)
        const revFilter = getFilterQuery(startDate, endDate, cabang, 'tanggal_terbit', 'cabang');
        const revSql = `SELECT cabang, SUM(grand_total) as total FROM invoice WHERE status != 'Draft' ${revFilter.sql} GROUP BY cabang`;
        
        // Expense from expense table
        const expFilter = getFilterQuery(startDate, endDate, cabang, 'tanggal', 'cabang');
        const expSql = `SELECT cabang, SUM(jumlah) as total FROM expense WHERE 1=1 ${expFilter.sql} GROUP BY cabang`;

        const [revResults] = await db.promise().query(revSql, revFilter.params);
        const [expResults] = await db.promise().query(expSql, expFilter.params);

        let totalRevenue = 0;
        let totalExpense = 0;
        const cabangData = { Banua: { revenue: 0, expense: 0 }, Tanaka: { revenue: 0, expense: 0 }, Acestreet: { revenue: 0, expense: 0 } };

        revResults.forEach(r => {
            totalRevenue += Number(r.total);
            if(cabangData[r.cabang]) cabangData[r.cabang].revenue += Number(r.total);
        });

        expResults.forEach(r => {
            totalExpense += Number(r.total);
            if(cabangData[r.cabang]) cabangData[r.cabang].expense += Number(r.total);
        });

        const labaBersih = totalRevenue - totalExpense;
        const margin = totalRevenue > 0 ? ((labaBersih / totalRevenue) * 100).toFixed(2) : 0;

        res.json({
            status: 'success',
            data: {
                totalRevenue,
                totalExpense,
                labaBersih,
                margin: Number(margin),
                cabangData
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getExpenseReport = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const filter = getFilterQuery(startDate, endDate, cabang, 'tanggal', 'cabang');
        const sql = `SELECT * FROM expense WHERE 1=1 ${filter.sql} ORDER BY tanggal DESC`;
        const [results] = await db.promise().query(sql, filter.params);

        // Group by kategori
        const byCategory = {};
        let total = 0;
        results.forEach(r => {
            total += Number(r.jumlah);
            if (!byCategory[r.kategori]) byCategory[r.kategori] = 0;
            byCategory[r.kategori] += Number(r.jumlah);
        });

        res.json({
            status: 'success',
            data: {
                list: results,
                total,
                byCategory
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getIncomeExpense = async (req, res) => {
    // A simplified monthly aggregation
    const { cabang } = req.query;
    try {
        let cabangFilterRev = cabang && cabang !== 'Semua Cabang' ? `AND cabang = '${cabang}'` : '';
        let cabangFilterExp = cabang && cabang !== 'Semua Cabang' ? `AND cabang = '${cabang}'` : '';

        const revSql = `SELECT DATE_FORMAT(tanggal_terbit, '%Y-%m') as month, SUM(grand_total) as total FROM invoice WHERE status != 'Draft' ${cabangFilterRev} GROUP BY month`;
        const expSql = `SELECT DATE_FORMAT(tanggal, '%Y-%m') as month, SUM(jumlah) as total FROM expense WHERE 1=1 ${cabangFilterExp} GROUP BY month`;

        const [revResults] = await db.promise().query(revSql);
        const [expResults] = await db.promise().query(expSql);

        const monthlyData = {};
        revResults.forEach(r => {
            if (!monthlyData[r.month]) monthlyData[r.month] = { month: r.month, income: 0, expense: 0 };
            monthlyData[r.month].income += Number(r.total);
        });
        expResults.forEach(r => {
            if (!monthlyData[r.month]) monthlyData[r.month] = { month: r.month, income: 0, expense: 0 };
            monthlyData[r.month].expense += Number(r.total);
        });

        res.json({ status: 'success', data: Object.values(monthlyData).sort((a,b) => a.month.localeCompare(b.month)) });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getArusKas = async (req, res) => {
    // In a real system, this queries the Jurnal Umum where account is Cash/Bank.
    // We will simulate it using invoices (as operating in) and expenses (as operating out).
    const { startDate, endDate, cabang } = req.query;
    try {
        const revFilter = getFilterQuery(startDate, endDate, cabang, 'tanggal_terbit', 'cabang');
        const expFilter = getFilterQuery(startDate, endDate, cabang, 'tanggal', 'cabang');

        const [[revRow]] = await db.promise().query(`SELECT SUM(grand_total) as total FROM invoice WHERE status = 'Lunas' ${revFilter.sql}`, revFilter.params);
        const [[expRow]] = await db.promise().query(`SELECT SUM(jumlah) as total FROM expense WHERE 1=1 ${expFilter.sql}`, expFilter.params);

        const operasionalMasuk = Number(revRow.total || 0);
        const operasionalKeluar = Number(expRow.total || 0);
        
        // Dummy values for Investasi & Pendanaan to show structure
        const investasi = 0;
        const pendanaan = 0;

        const netCashflow = operasionalMasuk - operasionalKeluar + investasi + pendanaan;

        res.json({
            status: 'success',
            data: {
                operasionalMasuk,
                operasionalKeluar,
                investasi,
                pendanaan,
                netCashflow
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getSemuaTransaksi = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const filter = getFilterQuery(startDate, endDate, cabang, 'tanggal_terbit', 'cabang');
        // invoice holds nama klien, deskripsi pemesanan, jumlah, status, dll.
        const sql = `
            SELECT 
                tanggal_terbit as tanggal, 
                nama_pt as klien, 
                deskripsi as deskripsi_pemesanan, 
                grand_total as jumlah, 
                status as raw_status,
                tanggal_jatuh_tempo,
                cabang
            FROM invoice 
            WHERE status != 'Draft' ${filter.sql}
            ORDER BY tanggal_terbit DESC
        `;
        const [results] = await db.promise().query(sql, filter.params);

        const data = results.map(r => {
            let status_bayar = r.raw_status === 'Lunas' ? 'paid' : 'unpaid';
            let keterangan = r.raw_status === 'Lunas' ? 'lunas' : 
                             (new Date(r.tanggal_jatuh_tempo) < new Date() ? 'overdue' : 'due date');
            return {
                ...r,
                status_bayar,
                keterangan
            };
        });

        res.json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getReport = async (req, res) => {
    res.json({ status: 'success', data: [] });
};
