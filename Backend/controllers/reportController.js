const db = require('../config/db');

const getFilterQuery = (startDate, endDate, cabang, dateColumn, cabangColumn = 'branch') => {
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

// 1. Laba Rugi
exports.getLabaRugi = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;

    try {
        const filter = getFilterQuery(startDate, endDate, cabang, 'transaction_date', 'branch');
        const sql = `SELECT branch as cabang, category, SUM(amount) as total FROM journals WHERE 1=1 ${filter.sql} GROUP BY branch, category`;
        
        const [results] = await db.promise().query(sql, filter.params);

        let totalRevenue = 0;
        let totalExpense = 0;
        const cabangData = { 
            Banua: { revenue: 0, expense: 0 }, 
            Tanaka: { revenue: 0, expense: 0 }, 
            Acestreet: { revenue: 0, expense: 0 } 
        };

        results.forEach(r => {
            const amount = Number(r.total);
            const cab = r.cabang || 'Banua'; // Default if null
            if (!cabangData[cab]) cabangData[cab] = { revenue: 0, expense: 0 };

            if (r.category === 'Income') {
                totalRevenue += amount;
                cabangData[cab].revenue += amount;
            } else if (r.category === 'Expense') {
                totalExpense += amount;
                cabangData[cab].expense += amount;
            }
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

// 2. Expense Report
exports.getExpenseReport = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const filter = getFilterQuery(startDate, endDate, cabang, 'transaction_date', 'branch');
        const sql = `SELECT * FROM journals WHERE category = 'Expense' ${filter.sql} ORDER BY transaction_date DESC`;
        const [results] = await db.promise().query(sql, filter.params);

        const byCategory = {};
        let total = 0;
        results.forEach(r => {
            total += Number(r.amount);
            // using account_name as sub-category of expense
            const kat = r.account_name || 'Uncategorized';
            if (!byCategory[kat]) byCategory[kat] = 0;
            byCategory[kat] += Number(r.amount);
        });

        // Map fields for frontend expected structure (kategori, jumlah, tanggal, keterangan, cabang)
        const mappedList = results.map(r => ({
            id: r.id,
            tanggal: r.transaction_date,
            kategori: r.account_name,
            keterangan: r.description,
            jumlah: r.amount,
            cabang: r.branch
        }));

        res.json({
            status: 'success',
            data: {
                list: mappedList,
                total,
                byCategory
            }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// 3. Income vs Expense
exports.getIncomeExpense = async (req, res) => {
    const { cabang } = req.query;
    try {
        let cabangFilter = cabang && cabang !== 'Semua Cabang' ? `AND branch = '${cabang}'` : '';
        const sql = `SELECT DATE_FORMAT(transaction_date, '%Y-%m') as month, category, SUM(amount) as total FROM journals WHERE 1=1 ${cabangFilter} GROUP BY month, category`;
        
        const [results] = await db.promise().query(sql);

        const monthlyData = {};
        results.forEach(r => {
            if (!monthlyData[r.month]) monthlyData[r.month] = { month: r.month, income: 0, expense: 0 };
            
            if (r.category === 'Income') {
                monthlyData[r.month].income += Number(r.total);
            } else if (r.category === 'Expense') {
                monthlyData[r.month].expense += Number(r.total);
            }
        });

        res.json({ status: 'success', data: Object.values(monthlyData).sort((a,b) => a.month.localeCompare(b.month)) });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// 4. Arus Kas
exports.getArusKas = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const filter = getFilterQuery(startDate, endDate, cabang, 'transaction_date', 'branch');
        
        // Simulating Arus Kas using Journals
        const sql = `SELECT category, SUM(amount) as total FROM journals WHERE 1=1 ${filter.sql} GROUP BY category`;
        const [results] = await db.promise().query(sql, filter.params);

        let operasionalMasuk = 0;
        let operasionalKeluar = 0;
        let investasi = 0;
        let pendanaan = 0;

        results.forEach(r => {
            if (r.category === 'Income') operasionalMasuk += Number(r.total);
            else if (r.category === 'Expense') operasionalKeluar += Number(r.total);
            // Currently no tags for investasi/pendanaan in journals, so kept 0
        });

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

// 5. Semua Transaksi
exports.getSemuaTransaksi = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const filter = getFilterQuery(startDate, endDate, cabang, 'transaction_date', 'branch');
        const sql = `
            SELECT 
                transaction_date as tanggal, 
                account_name as klien, 
                description as deskripsi_pemesanan, 
                amount as jumlah, 
                category as raw_status,
                branch as cabang,
                transaction_id
            FROM journals 
            WHERE 1=1 ${filter.sql}
            ORDER BY transaction_date DESC
        `;
        const [results] = await db.promise().query(sql, filter.params);

        const data = results.map(r => {
            let status_bayar = r.raw_status === 'Income' ? 'paid' : 'paid'; // simplify
            let keterangan = r.raw_status; 
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
