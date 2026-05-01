const db = require('../config/db');

exports.getDashboard = async (req, res) => {
    try {
        const promiseDb = db.promise();

        const [revenueResult] = await promiseDb.query("SELECT COALESCE(SUM(amount), 0) as total FROM journals WHERE category = 'Income' AND MONTH(transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(transaction_date) = YEAR(CURRENT_DATE())");
        const [expenseResult] = await promiseDb.query("SELECT COALESCE(SUM(amount), 0) as total FROM journals WHERE category = 'Expense' AND MONTH(transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(transaction_date) = YEAR(CURRENT_DATE())");
        const [cashResult] = await promiseDb.query("SELECT COALESCE(SUM(total), 0) as total FROM cash_in_bank WHERE status = 'Paid'");
        const [ordersResult] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline WHERE status != 'Selesai'");
        const [unpaidResult] = await promiseDb.query("SELECT COUNT(*) as total FROM invoice WHERE status = 'unpaid'");
        const [lowStockResult] = await promiseDb.query("SELECT COUNT(*) as total FROM stok WHERE jumlah <= minimum_stok");
        const [pendingApprovalResult] = await promiseDb.query("SELECT COUNT(*) as total FROM approvals WHERE status = 'pending'");
        const [overdueInvoiceResult] = await promiseDb.query("SELECT COUNT(*) as total FROM invoice WHERE (status = 'unpaid' OR status = 'Overdue' OR tanggal_jatuh_tempo < CURDATE())");
        const [delayedProductionResult] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline WHERE status = 'Proses' AND deadline_final < CURDATE()");
        const [lowStockItems] = await promiseDb.query("SELECT nama_barang, jumlah, minimum_stok, cabang_id FROM stok WHERE jumlah <= minimum_stok ORDER BY jumlah ASC LIMIT 5");

        const [revenueTrend] = await promiseDb.query(`
            SELECT DATE_FORMAT(transaction_date, '%d %b') as date, SUM(amount) as total
            FROM journals
            WHERE category = 'Income' AND transaction_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY DATE(transaction_date)
            ORDER BY DATE(transaction_date) ASC
        `);

        const [monthlyRevenue] = await promiseDb.query(`
            SELECT MONTH(transaction_date) as monthIndex, MONTHNAME(transaction_date) as monthName, SUM(amount) as total
            FROM journals
            WHERE category = 'Income' AND YEAR(transaction_date) = YEAR(CURDATE())
            GROUP BY MONTH(transaction_date)
            ORDER BY MONTH(transaction_date) ASC
        `);

        const [monthlyExpense] = await promiseDb.query(`
            SELECT MONTH(transaction_date) as monthIndex, MONTHNAME(transaction_date) as monthName, SUM(amount) as total
            FROM journals
            WHERE category = 'Expense' AND YEAR(transaction_date) = YEAR(CURDATE())
            GROUP BY MONTH(transaction_date)
            ORDER BY MONTH(transaction_date) ASC
        `);

        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const profitExpenseTrend = months.map((month) => ({ month, revenue: 0, expense: 0 }));

        monthlyRevenue.forEach(item => {
            const index = item.monthIndex - 1;
            if (profitExpenseTrend[index]) profitExpenseTrend[index].revenue = Number(item.total);
        });
        monthlyExpense.forEach(item => {
            const index = item.monthIndex - 1;
            if (profitExpenseTrend[index]) profitExpenseTrend[index].expense = Number(item.total);
        });

        const [branchContribution] = await promiseDb.query(`
            SELECT c.nama_cabang as name, COALESCE(SUM(i.grand_total), 0) as total
            FROM cabang c
            LEFT JOIN invoice i ON i.cabang = c.nama_cabang
            GROUP BY c.id, c.nama_cabang
        `);

        const totalContribution = branchContribution.reduce((sum, item) => sum + Number(item.total), 0);
        const branchData = branchContribution.map(item => ({
            name: item.name,
            total: Number(item.total),
            share: totalContribution > 0 ? Number(((item.total / totalContribution) * 100).toFixed(1)) : 0
        }));

        const [recentTrans] = await promiseDb.query("SELECT id, tanggal, nama_produk as nama_produk, total_harga FROM sales_online ORDER BY tanggal DESC LIMIT 5");

        res.status(200).json({
            status: 'success',
            data: {
                totalRevenue: Number(revenueResult[0].total),
                totalExpense: Number(expenseResult[0].total),
                netProfit: Number(revenueResult[0].total) - Number(expenseResult[0].total),
                cashAvailable: Number(cashResult[0].total),
                activeOrders: ordersResult[0].total,
                unpaidInvoice: unpaidResult[0].total,
                lowStock: lowStockResult[0].total,
                alerts: {
                    overdueInvoice: overdueInvoiceResult[0].total,
                    delayedProduction: delayedProductionResult[0].total,
                    lowStock: lowStockResult[0].total,
                    pendingApproval: pendingApprovalResult[0].total
                },
                lowStockItems,
                chartData: {
                    revenueTrend,
                    profitExpenseTrend: profitExpenseTrend.slice(Math.max(profitExpenseTrend.length - 6, 0)),
                    branchContribution: branchData
                },
                recentTransactions: recentTrans
            }
        });
    } catch (error) {
        console.error('Owner Dashboard Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMarketing = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const [leads] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline");
        const [completed] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline WHERE status = 'Selesai'");
        const [pending] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline WHERE status = 'Proses'");

        const totalLeads = leads[0].total;
        const closingRate = totalLeads > 0 ? `${Math.round((completed[0].total / totalLeads) * 100)}%` : '0%';

        res.status(200).json({
            status: 'success',
            data: {
                totalLeads,
                completedOrders: completed[0].total,
                pendingOrders: pending[0].total,
                closingRate,
                topMarketing: 'Budi Santoso',
                salesByMarketing: [
                    { name: 'Budi Santoso', sales: 45 },
                    { name: 'Siti Aminah', sales: 38 },
                    { name: 'Andi Wijaya', sales: 30 }
                ]
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getFinance = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const [incomeResult] = await promiseDb.query("SELECT COALESCE(SUM(amount), 0) as total FROM journals WHERE category = 'Income'");
        const [expenseResult] = await promiseDb.query("SELECT COALESCE(SUM(amount), 0) as total FROM journals WHERE category = 'Expense'");
        const [cashAvailableResult] = await promiseDb.query("SELECT COALESCE(SUM(total), 0) as total FROM cash_in_bank WHERE status = 'Paid'");
        const [receivablesResult] = await promiseDb.query("SELECT COALESCE(SUM(grand_total), 0) as total FROM invoice WHERE status != 'Lunas'");
        const [payablesResult] = await promiseDb.query("SELECT COALESCE(SUM(total), 0) as total FROM cash_in_bank WHERE status IN ('Pending', 'Unpaid', 'Overdue')");
        const [unpaidInvoice] = await promiseDb.query("SELECT COUNT(*) as total FROM invoice WHERE status = 'unpaid'");
        const [journalCount] = await promiseDb.query("SELECT COUNT(*) as total FROM journals");

        const [monthlyRevenue] = await promiseDb.query(`
            SELECT MONTHNAME(transaction_date) as month, SUM(amount) as total
            FROM journals
            WHERE category = 'Income' AND YEAR(transaction_date) = YEAR(CURDATE())
            GROUP BY MONTH(transaction_date)
            ORDER BY MONTH(transaction_date)
        `);

        const [monthlyExpense] = await promiseDb.query(`
            SELECT MONTHNAME(transaction_date) as month, SUM(amount) as total
            FROM journals
            WHERE category = 'Expense' AND YEAR(transaction_date) = YEAR(CURDATE())
            GROUP BY MONTH(transaction_date)
            ORDER BY MONTH(transaction_date)
        `);

        const monthsData = {};
        monthlyRevenue.forEach(r => { monthsData[r.month] = { month: r.month, in: Number(r.total), out: 0 } });
        monthlyExpense.forEach(r => { 
            if (!monthsData[r.month]) monthsData[r.month] = { month: r.month, in: 0, out: 0 };
            monthsData[r.month].out = Number(r.total);
        });
        const cashflow = Object.values(monthsData);

        res.status(200).json({
            status: 'success',
            data: {
                totalIncome: Number(incomeResult[0].total),
                totalExpense: Number(expenseResult[0].total),
                netProfit: Number(incomeResult[0].total) - Number(expenseResult[0].total),
                cashAvailable: Number(cashAvailableResult[0].total),
                receivables: Number(receivablesResult[0].total),
                payables: Number(payablesResult[0].total),
                unpaidInvoiceCount: unpaidInvoice[0].total,
                journalCount: journalCount[0].total,
                cashflow: cashflow.length ? cashflow : [{ month: 'N/A', in: 0, out: 0 }],
                monthlyRevenue,
                monthlyExpense
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGudang = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const [stok] = await promiseDb.query("SELECT COALESCE(SUM(jumlah), 0) as total FROM stok");
        const [lowStock] = await promiseDb.query("SELECT COUNT(*) as total FROM stok WHERE jumlah <= minimum_stok");
        const [inToday] = await promiseDb.query("SELECT COALESCE(SUM(jumlah), 0) as total FROM barang_masuk WHERE DATE(tanggal) = CURDATE()");
        const [outToday] = await promiseDb.query("SELECT COALESCE(SUM(jumlah), 0) as total FROM barang_keluar WHERE DATE(tanggal) = CURDATE()");

        res.status(200).json({
            status: 'success',
            data: {
                totalStock: stok[0].total,
                lowStockItem: lowStock[0].total,
                inToday: inToday[0].total,
                outToday: outToday[0].total
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getProduksi = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const [ongoing] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline WHERE status = 'Proses'");
        const [completed] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline WHERE status = 'Selesai'");
        const [delayed] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline WHERE status = 'Proses' AND deadline_final < CURDATE()");
        const [lowStock] = await promiseDb.query("SELECT COUNT(*) as total FROM stok WHERE jumlah <= minimum_stok");
        const [inToday] = await promiseDb.query("SELECT COALESCE(SUM(jumlah), 0) as total FROM barang_masuk WHERE DATE(tanggal) = CURDATE()");
        const [outToday] = await promiseDb.query("SELECT COALESCE(SUM(jumlah), 0) as total FROM barang_keluar WHERE DATE(tanggal) = CURDATE()");
        const [leads] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline");

        const totalLeads = leads[0].total;
        const closingRate = totalLeads > 0 ? `${Math.round((completed[0].total / totalLeads) * 100)}%` : '0%';

        res.status(200).json({
            status: 'success',
            data: {
                ongoingOrders: ongoing[0].total,
                completedOrders: completed[0].total,
                delayedOrders: delayed[0].total,
                lowStockCount: lowStock[0].total,
                inToday: inToday[0].total,
                outToday: outToday[0].total,
                marketingLeads: totalLeads,
                closingRate,
                productionOverview: {
                    queueCount: ongoing[0].total,
                    completedToday: completed[0].total,
                    delayedCount: delayed[0].total
                }
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCabang = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const [branches] = await promiseDb.query(`
            SELECT c.id, c.nama_cabang, c.target_revenue,
                COALESCE(SUM(i.grand_total), 0) as revenue,
                COUNT(i.id) as orders,
                COALESCE(SUM(CASE WHEN MONTH(i.tanggal_transaksi) = MONTH(CURDATE()) AND YEAR(i.tanggal_transaksi) = YEAR(CURDATE()) THEN i.grand_total ELSE 0 END), 0) as current_month,
                COALESCE(SUM(CASE WHEN MONTH(i.tanggal_transaksi) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(i.tanggal_transaksi) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN i.grand_total ELSE 0 END), 0) as previous_month
            FROM cabang c
            LEFT JOIN invoice i ON i.cabang = c.nama_cabang
            GROUP BY c.id, c.nama_cabang, c.target_revenue
        `);

        const [profitByBranch] = await promiseDb.query(`
            SELECT branch, SUM(CASE WHEN category = 'Income' THEN amount ELSE -amount END) as totalProfit
            FROM journals
            WHERE category IN ('Income', 'Expense')
            GROUP BY branch
        `);

        const [topProducts] = await promiseDb.query(`
            SELECT akun_toko as branch, nama_produk as product, SUM(total_harga) as total
            FROM sales_online
            GROUP BY akun_toko, nama_produk
            ORDER BY akun_toko, total DESC
        `);

        const profitMap = {};
        profitByBranch.forEach(item => {
            profitMap[item.branch] = Number(item.totalProfit);
        });

        const bestSellerMap = {};
        topProducts.forEach(item => {
            if (!bestSellerMap[item.branch]) {
                bestSellerMap[item.branch] = item.product;
            }
        });

        const finalBranches = branches.map(item => {
            const growth = item.previous_month > 0 ? Number((((item.current_month - item.previous_month) / item.previous_month) * 100).toFixed(1)) : item.current_month > 0 ? 10 : 0;
            return {
                id: item.id,
                name: item.nama_cabang,
                targetRevenue: Number(item.target_revenue),
                revenue: Number(item.revenue),
                orders: Number(item.orders),
                profit: profitMap[item.nama_cabang] || 0,
                growthPercent: growth,
                bestSeller: bestSellerMap[item.nama_cabang] || 'N/A'
            };
        });

        res.status(200).json({ status: 'success', data: finalBranches });
    } catch (error) {
        console.error('Owner Cabang Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const [total] = await promiseDb.query("SELECT COUNT(*) as count FROM users");
        const [aktif] = await promiseDb.query("SELECT COUNT(*) as count FROM users WHERE status = 'aktif'");
        const [nonaktif] = await promiseDb.query("SELECT COUNT(*) as count FROM users WHERE status = 'nonaktif'");
        const [roles] = await promiseDb.query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
        const [loginHistory] = await promiseDb.query("SELECT username, aktivitas, created_at FROM activity_logs WHERE aktivitas LIKE '%login%' ORDER BY created_at DESC LIMIT 5");

        res.status(200).json({
            status: 'success',
            data: {
                totalUsers: total[0].count,
                activeUsers: aktif[0].count,
                inactiveUsers: nonaktif[0].count,
                usersByRole: roles,
                loginHistory
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
