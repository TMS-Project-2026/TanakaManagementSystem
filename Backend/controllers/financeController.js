const db = require('../config/db');

exports.getDashboard = async (req, res) => {
    try {
        const promiseDb = db.promise();

        // 1. Total Piutang (Accounts Receivable) from invoice 'Terbit' / 'Overdue'
        const [piutangResult] = await promiseDb.query("SELECT SUM(grand_total) AS total FROM invoice WHERE status IN ('Terbit', 'Overdue')");
        const totalPiutang = piutangResult[0].total || 0;
        
        const [unpaidCountRes] = await promiseDb.query("SELECT COUNT(*) as count FROM invoice WHERE status IN ('Terbit', 'Overdue')");
        const unpaidInvoiceCount = unpaidCountRes[0].count || 0;

        const [unpaidInvoicesList] = await promiseDb.query(`
            SELECT no_invoice, nama_pt as klien, tanggal_jatuh_tempo, grand_total, status 
            FROM invoice 
            WHERE status IN ('Terbit', 'Overdue') 
            ORDER BY tanggal_jatuh_tempo ASC 
            LIMIT 5
        `);

        // 2. Tagihan Belum Dibayar (Accounts Payable) from cash_out_bank 'Pending'
        const [hutangResult] = await promiseDb.query("SELECT SUM(total) AS total FROM cash_out_bank WHERE status = 'Pending'");
        const totalHutang = hutangResult[0].total || 0;
        
        const [unpaidBillsList] = await promiseDb.query(`
            SELECT transaksi_id, nama_vendor, tanggal_transaksi, total as nominal, status 
            FROM cash_out_bank 
            WHERE status = 'Pending' 
            ORDER BY tanggal_transaksi ASC 
            LIMIT 5
        `);

        // 3. Kas & Bank Available
        const [paymentIn] = await promiseDb.query("SELECT SUM(jumlah) AS total FROM payment WHERE status = 'success'");
        let cashInTotal = 0;
        try {
            const [cashIn] = await promiseDb.query("SELECT SUM(total) AS total FROM cash_in_bank WHERE status = 'Paid'");
            cashInTotal = cashIn[0].total || 0;
        } catch(e) {} // Ignore if table missing/different
        
        const [expenseOut] = await promiseDb.query("SELECT SUM(jumlah) AS total FROM expense");
        const [cashOut] = await promiseDb.query("SELECT SUM(total) AS total FROM cash_out_bank WHERE status = 'Paid'");
        
        const totalIn = (paymentIn[0].total || 0) + cashInTotal;
        const totalOut = (expenseOut[0].total || 0) + (cashOut[0].total || 0);
        const cashAvailable = totalIn - totalOut;
        
        // 4. Profit
        const [revenueResult] = await promiseDb.query("SELECT SUM(grand_total) AS total FROM invoice WHERE status = 'Lunas'");
        const totalRevenue = revenueResult[0].total || totalIn;
        const totalExpense = totalOut;
        const profit = totalRevenue - totalExpense;

        // 5. Arus Kas Bulanan
        const chartMap = {};
        const addMap = (data, key) => {
            data.forEach(d => {
                if(!chartMap[d.month]) chartMap[d.month] = { name: d.month, revenue: 0, expense: 0, profit: 0 };
                chartMap[d.month][key] += Number(d.total);
            });
        };

        const [monthlyPay] = await promiseDb.query(`SELECT DATE_FORMAT(tanggal, '%Y-%m') as month, SUM(jumlah) as total FROM payment WHERE status = 'success' GROUP BY month ORDER BY month DESC LIMIT 6`);
        addMap(monthlyPay, 'revenue');

        try {
            const [monthlyIn] = await promiseDb.query(`SELECT DATE_FORMAT(tanggal_transaksi, '%Y-%m') as month, SUM(total) as total FROM cash_in_bank WHERE status = 'Paid' GROUP BY month ORDER BY month DESC LIMIT 6`);
            addMap(monthlyIn, 'revenue');
        } catch(e) {}

        const [monthlyOut] = await promiseDb.query(`SELECT DATE_FORMAT(tanggal_transaksi, '%Y-%m') as month, SUM(total) as total FROM cash_out_bank WHERE status = 'Paid' GROUP BY month ORDER BY month DESC LIMIT 6`);
        addMap(monthlyOut, 'expense');

        const [monthlyExp] = await promiseDb.query(`SELECT DATE_FORMAT(tanggal, '%Y-%m') as month, SUM(jumlah) as total FROM expense GROUP BY month ORDER BY month DESC LIMIT 6`);
        addMap(monthlyExp, 'expense');

        const chartData = Object.values(chartMap).sort((a, b) => a.name.localeCompare(b.name)).map(c => {
            c.profit = c.revenue - c.expense;
            const d = new Date(c.name + '-01');
            c.name = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' });
            return c;
        });

        // 6. Monitored Accounts
        let monitoredAccounts = [];
        try {
            const [saldoPetty] = await promiseDb.query("SELECT cabang as account_name, saldo as balance FROM petty_cash_saldo");
            monitoredAccounts = saldoPetty.map(s => ({ account_name: 'Petty Cash ' + s.account_name, balance: s.balance }));
            // Add Bank BCA/Mandiri placeholder for demo
            monitoredAccounts.push({ account_name: '1-10002 Rekening Bank', balance: cashAvailable > 0 ? cashAvailable * 0.8 : 0 });
            monitoredAccounts.push({ account_name: '1-10001 Kas', balance: cashAvailable > 0 ? cashAvailable * 0.2 : 0 });
        } catch(e) {}

        // 7. Biaya Operasional
        const [biayaOperasional] = await promiseDb.query("SELECT kategori as name, SUM(total) as value FROM cash_out_bank WHERE status='Paid' GROUP BY kategori LIMIT 5");

        // 8. Recent Journals (if exists)
        let recentJournals = [];
        try {
            const [j] = await promiseDb.query("SELECT transaction_id, account_name, category, amount, transaction_date, description FROM journals ORDER BY transaction_date DESC LIMIT 5");
            recentJournals = j;
        } catch(e) {}

        res.status(200).json({
            status: "success",
            data: {
                totalRevenue, totalExpense, profit, cashAvailable, 
                totalPiutang, totalHutang, unpaidInvoiceCount, 
                unpaidInvoicesList, unpaidBillsList, chartData, 
                monitoredAccounts, biayaOperasional, recentJournals
            }
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getReport = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const { startDate, endDate } = req.query;

        let revenueQuery = "SELECT SUM(jumlah) AS total FROM payment WHERE status = 'success'";
        let expenseQuery = "SELECT SUM(jumlah) AS total FROM expense";
        const queryParams = [];

        if (startDate && endDate) {
            revenueQuery += " AND tanggal BETWEEN ? AND ?";
            expenseQuery += " WHERE tanggal BETWEEN ? AND ?";
            queryParams.push(startDate, endDate);
        }

        const [revenueResult] = await promiseDb.query(revenueQuery, queryParams);
        const [expenseResult] = await promiseDb.query(expenseQuery, queryParams);

        const totalRevenue = revenueResult[0].total || 0;
        const totalExpense = expenseResult[0].total || 0;
        const profit = totalRevenue - totalExpense;

        res.status(200).json({
            status: "success",
            data: {
                totalRevenue, totalExpense, profit,
                periode: (startDate && endDate) ? `${startDate} to ${endDate}` : 'Semua Waktu'
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
