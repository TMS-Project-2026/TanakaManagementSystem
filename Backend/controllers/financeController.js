const db = require('../config/db');

exports.getDashboard = async (req, res) => {
    try {
        const promiseDb = db.promise();

        // 1. Total Revenue (Payment dengan status 'success')
        const [revenueResult] = await promiseDb.query("SELECT SUM(jumlah) AS total FROM payment WHERE status = 'success'");
        const totalRevenue = revenueResult[0].total || 0;

        // 2. Total Expense
        const [expenseResult] = await promiseDb.query("SELECT SUM(jumlah) AS total FROM expense");
        const totalExpense = expenseResult[0].total || 0;

        // 3. Profit
        const profit = totalRevenue - totalExpense;

        // 4. Total Transaksi (Banyaknya data payment)
        const [trxResult] = await promiseDb.query("SELECT COUNT(*) AS total FROM payment");
        const totalTransaksi = trxResult[0].total || 0;

        // 5. Grafik Bulanan (Tahun Berjalan)
        const [monthlyRevenue] = await promiseDb.query(`
            SELECT MONTH(tanggal) as month, SUM(jumlah) as total 
            FROM payment 
            WHERE status = 'success' AND YEAR(tanggal) = YEAR(CURDATE()) 
            GROUP BY MONTH(tanggal)
        `);

        const [monthlyExpense] = await promiseDb.query(`
            SELECT MONTH(tanggal) as month, SUM(jumlah) as total 
            FROM expense 
            WHERE YEAR(tanggal) = YEAR(CURDATE()) 
            GROUP BY MONTH(tanggal)
        `);

        // Format chart data (Jan - Dec)
        const chartData = Array.from({ length: 12 }, (_, i) => ({
            name: new Date(0, i).toLocaleString('id-ID', { month: 'short' }),
            revenue: 0,
            expense: 0
        }));

        monthlyRevenue.forEach(item => {
            chartData[item.month - 1].revenue = Number(item.total);
        });

        monthlyExpense.forEach(item => {
            chartData[item.month - 1].expense = Number(item.total);
        });

        res.status(200).json({
            status: "success",
            data: {
                totalRevenue,
                totalExpense,
                profit,
                totalTransaksi,
                chartData
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
            const dateFilter = " AND tanggal BETWEEN ? AND ?";
            revenueQuery += dateFilter;
            // Expense doesn't have WHERE yet, so we use WHERE instead of AND
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
                totalRevenue,
                totalExpense,
                profit,
                periode: (startDate && endDate) ? `${startDate} to ${endDate}` : 'Semua Waktu'
            }
        });

    } catch (error) {
        console.error("Report Error:", error);
        res.status(500).json({ message: error.message });
    }
};