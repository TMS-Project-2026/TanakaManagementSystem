const db = require('../config/db');

const buildFilter = (startDate, endDate, cabang, dateCol, cabangCol) => {
    let sql = '';
    const p = [];
    if (startDate && endDate) { sql += ` AND ${dateCol} >= ? AND ${dateCol} <= ?`; p.push(startDate, endDate); }
    if (cabang && cabang !== 'Semua Cabang') { sql += ` AND ${cabangCol} = ?`; p.push(cabang); }
    return { sql, p };
};

const q = (query, params = []) => new Promise((resolve, reject) =>
    db.query(query, params, (err, r) => err ? reject(err) : resolve(r))
);

// Normalize any branch/company name to standard cabang name
const normalizeCabang = (branch) => {
    if (!branch) return 'Banua';
    const b = branch.toLowerCase();
    if (b.includes('tanaka')) return 'Tanaka';
    if (b.includes('acestreet') || b.includes('acestra') || b.includes('acees')) return 'Acestreet';
    if (b.includes('banua') || b.includes('bml') || b.includes('mitra')) return 'Banua';
    // If already a standard name
    if (b === 'banua') return 'Banua';
    if (b === 'tanaka') return 'Tanaka';
    if (b === 'acestreet') return 'Acestreet';
    return 'Banua'; // default
};

// 1. LABA RUGI — from journals + cash_in_bank + invoice
exports.getLabaRugi = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const f1 = buildFilter(startDate, endDate, cabang, 'transaction_date', 'branch');
        const f2 = buildFilter(startDate, endDate, cabang, 'tanggal_transaksi', 'cabang');
        const f3 = buildFilter(startDate, endDate, cabang, 'tanggal_terbit', 'cabang');

        const [jRevenue, iRevenue, cashIn, jExpense, cobExpense] = await Promise.all([
            q(`SELECT branch as cabang, SUM(amount) as total FROM journals WHERE category IN ('Revenue','Income') ${f1.sql} GROUP BY branch`, f1.p),
            q(`SELECT cabang, SUM(grand_total) as total FROM invoice WHERE status NOT IN ('Draft','Void') ${f3.sql} GROUP BY cabang`, f3.p),
            q(`SELECT cabang, SUM(total) as total FROM cash_in_bank WHERE status='Paid' ${f2.sql} GROUP BY cabang`, f2.p),
            q(`SELECT branch as cabang, SUM(amount) as total FROM journals WHERE category IN ('Expense','Purchase') ${f1.sql} GROUP BY branch`, f1.p),
            q(`SELECT cabang, SUM(nominal) as total FROM cash_out_bank WHERE status='Paid' ${f2.sql} GROUP BY cabang`, f2.p),
        ]);

        const cabangData = {
            Banua: { revenue: 0, expense: 0 },
            Tanaka: { revenue: 0, expense: 0 },
            Acestreet: { revenue: 0, expense: 0 }
        };

        // Revenue — normalize all cabang names
        [...jRevenue, ...iRevenue, ...cashIn].forEach(r => {
            const cab = normalizeCabang(r.cabang);
            cabangData[cab].revenue += Number(r.total || 0);
        });

        // Expense — normalize all cabang names
        [...jExpense, ...cobExpense].forEach(r => {
            const cab = normalizeCabang(r.cabang);
            cabangData[cab].expense += Number(r.total || 0);
        });

        const totalRevenue = Object.values(cabangData).reduce((s, c) => s + c.revenue, 0);
        const totalExpense = Object.values(cabangData).reduce((s, c) => s + c.expense, 0);
        const labaBersih = totalRevenue - totalExpense;
        const margin = totalRevenue > 0 ? ((labaBersih / totalRevenue) * 100).toFixed(2) : 0;

        res.json({ status: 'success', data: { totalRevenue, totalExpense, labaBersih, margin: Number(margin), cabangData } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};


// 2. EXPENSE REPORT — from journals (Expense) + cash_out_bank
exports.getExpenseReport = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const f1 = buildFilter(startDate, endDate, cabang, 'transaction_date', 'branch');
        const f2 = buildFilter(startDate, endDate, cabang, 'tanggal_transaksi', 'cabang');

        const jExpense = await q(`SELECT id, transaction_date as tanggal, account_name as kategori, description as keterangan, amount as jumlah, branch as cabang FROM journals WHERE category IN ('Expense','Purchase') ${f1.sql} ORDER BY transaction_date DESC`, f1.p);
        const cobExpense = await q(`SELECT id, tanggal_transaksi as tanggal, kategori, keterangan, nominal as jumlah, cabang FROM cash_out_bank WHERE status != 'Void' ${f2.sql} ORDER BY tanggal_transaksi DESC`, f2.p);

        const list = [...jExpense, ...cobExpense].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        const total = list.reduce((s, r) => s + Number(r.jumlah || 0), 0);

        const byCategory = {};
        list.forEach(r => {
            const kat = r.kategori || 'Lainnya';
            if (!byCategory[kat]) byCategory[kat] = 0;
            byCategory[kat] += Number(r.jumlah || 0);
        });

        res.json({ status: 'success', data: { list, total, byCategory } });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// 3. INCOME vs EXPENSE per bulan
exports.getIncomeExpense = async (req, res) => {
    const { cabang } = req.query;
    try {
        const cabFilter = cabang && cabang !== 'Semua Cabang' ? `AND branch = '${cabang}'` : '';
        const cabFilter2 = cabang && cabang !== 'Semua Cabang' ? `AND cabang = '${cabang}'` : '';

        const [jData, cashInData, invoiceData, cobData] = await Promise.all([
            q(`SELECT DATE_FORMAT(transaction_date,'%Y-%m') as month, category, SUM(amount) as total FROM journals WHERE 1=1 ${cabFilter} GROUP BY month, category`),
            q(`SELECT DATE_FORMAT(tanggal_transaksi,'%Y-%m') as month, SUM(total) as total FROM cash_in_bank WHERE status='Paid' ${cabFilter2} GROUP BY month`),
            q(`SELECT DATE_FORMAT(tanggal_terbit,'%Y-%m') as month, SUM(grand_total) as total FROM invoice WHERE status NOT IN ('Draft','Void') ${cabFilter2} GROUP BY month`),
            q(`SELECT DATE_FORMAT(tanggal_transaksi,'%Y-%m') as month, SUM(nominal) as total FROM cash_out_bank WHERE status='Paid' ${cabFilter2} GROUP BY month`),
        ]);

        const monthly = {};
        const ensure = (m) => { if (!monthly[m]) monthly[m] = { month: m, income: 0, expense: 0 }; };

        jData.forEach(r => {
            ensure(r.month);
            if (r.category === 'Income' || r.category === 'Revenue') monthly[r.month].income += Number(r.total);
            else if (r.category === 'Expense' || r.category === 'Purchase') monthly[r.month].expense += Number(r.total);
        });
        cashInData.forEach(r => { ensure(r.month); monthly[r.month].income += Number(r.total || 0); });
        invoiceData.forEach(r => { ensure(r.month); monthly[r.month].income += Number(r.total || 0); });
        cobData.forEach(r => { ensure(r.month); monthly[r.month].expense += Number(r.total || 0); });

        res.json({ status: 'success', data: Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month)) });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// 4. ARUS KAS — cash_in_bank + cash_out_bank + transfer_rekening
exports.getArusKas = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const f = buildFilter(startDate, endDate, cabang, 'tanggal_transaksi', 'cabang');

        const [cashIn, cashOut, transfer] = await Promise.all([
            q(`SELECT COALESCE(SUM(total),0) as val FROM cash_in_bank WHERE status='Paid' ${f.sql}`, f.p),
            q(`SELECT COALESCE(SUM(nominal),0) as val FROM cash_out_bank WHERE status='Paid' ${f.sql}`, f.p),
            q(`SELECT COALESCE(SUM(nominal),0) as val, COALESCE(SUM(biaya_transfer),0) as biaya FROM transfer_rekening WHERE status='Completed' ${f.sql}`, f.p),
        ]);

        // Also include invoice revenue
        const fInv = buildFilter(startDate, endDate, cabang, 'tanggal_terbit', 'cabang');
        const invoiceRev = await q(`SELECT COALESCE(SUM(grand_total),0) as val FROM invoice WHERE status NOT IN ('Draft','Void') ${fInv.sql}`, fInv.p);

        const operasionalMasuk = Number(cashIn[0].val) + Number(invoiceRev[0].val);
        const operasionalKeluar = Number(cashOut[0].val);
        const transferBiaya = Number(transfer[0].biaya || 0);
        const netCashflow = operasionalMasuk - operasionalKeluar - transferBiaya;

        // Monthly cashflow trend
        const trend = await q(`
            SELECT DATE_FORMAT(tanggal_transaksi,'%b') as month,
                   SUM(CASE WHEN status='Paid' THEN total ELSE 0 END) as masuk
            FROM cash_in_bank GROUP BY month
        `);

        res.json({
            status: 'success',
            data: { operasionalMasuk, operasionalKeluar, investasi: 0, pendanaan: 0, netCashflow, transferBiaya, trend }
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

// 5. SEMUA TRANSAKSI — journals + cash_in_bank + invoice
exports.getSemuaTransaksi = async (req, res) => {
    const { startDate, endDate, cabang } = req.query;
    try {
        const f1 = buildFilter(startDate, endDate, cabang, 'transaction_date', 'branch');
        const f2 = buildFilter(startDate, endDate, cabang, 'tanggal_transaksi', 'cabang');
        const f3 = buildFilter(startDate, endDate, cabang, 'tanggal_terbit', 'cabang');

        const [jRows, cashRows, invRows] = await Promise.all([
            q(`SELECT transaction_id, transaction_date as tanggal, account_name as klien, description as deskripsi_pemesanan, amount as jumlah, category as keterangan, branch as cabang, 'Jurnal' as sumber FROM journals WHERE 1=1 ${f1.sql} ORDER BY transaction_date DESC`, f1.p),
            q(`SELECT transaksi_id as transaction_id, tanggal_transaksi as tanggal, nama_vendor as klien, keterangan as deskripsi_pemesanan, total as jumlah, status as keterangan, cabang, 'Cash In Bank' as sumber FROM cash_in_bank WHERE 1=1 ${f2.sql} ORDER BY tanggal_transaksi DESC`, f2.p),
            q(`SELECT no_invoice as transaction_id, tanggal_terbit as tanggal, nama_pt as klien, deskripsi as deskripsi_pemesanan, grand_total as jumlah, status as keterangan, cabang, 'Invoice' as sumber FROM invoice WHERE status NOT IN ('Draft') ${f3.sql} ORDER BY tanggal_terbit DESC`, f3.p),
        ]);

        const data = [...jRows, ...cashRows, ...invRows]
            .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
            .map(r => ({
                ...r,
                status_bayar: ['Paid','Lunas','Completed'].includes(r.keterangan) ? 'paid' : 'pending'
            }));

        res.json({ status: 'success', data });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
};

exports.getReport = async (req, res) => res.json({ status: 'success', data: [] });
