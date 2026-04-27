const db = require('../config/db');

exports.getDashboard = async (req, res) => {
    try {
        const promiseDb = db.promise();
        
        // This month revenue
        const [revenue] = await promiseDb.query("SELECT COALESCE(SUM(total_harga), 0) as total FROM sales_online WHERE MONTH(tanggal) = MONTH(CURRENT_DATE()) AND YEAR(tanggal) = YEAR(CURRENT_DATE())");
        const totalRevenue = revenue[0].total;

        // This month expense
        const [expense] = await promiseDb.query("SELECT COALESCE(SUM(jumlah), 0) as total FROM expense WHERE MONTH(tanggal) = MONTH(CURRENT_DATE()) AND YEAR(tanggal) = YEAR(CURRENT_DATE())");
        const totalExpense = expense[0].total;

        const totalProfit = totalRevenue - totalExpense;

        // Total active orders
        const [orders] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline WHERE status != 'Selesai'");
        
        // Low stock
        const [lowStock] = await promiseDb.query("SELECT COUNT(*) as total FROM stok WHERE jumlah <= 10");

        // Unpaid invoice
        const [unpaid] = await promiseDb.query("SELECT COUNT(*) as total FROM invoice WHERE status = 'unpaid'");

        // Chart Data (Mockup based on actual queries if possible, here using simple aggregations)
        const [monthlyRev] = await promiseDb.query("SELECT MONTHNAME(tanggal) as month, SUM(total_harga) as revenue FROM sales_online GROUP BY MONTH(tanggal), MONTHNAME(tanggal) ORDER BY MONTH(tanggal) DESC LIMIT 6");
        
        // Cabang performance
        const [cabang] = await promiseDb.query("SELECT nama_cabang, target_revenue as revenue FROM cabang LIMIT 4");

        // Transaksi terbaru
        const [recentTrans] = await promiseDb.query("SELECT id, tanggal, nama_produk as nama_pelanggan, total_harga, 'Sales' as type FROM sales_online ORDER BY tanggal DESC LIMIT 5");

        res.status(200).json({
            status: "success",
            data: {
                totalRevenue,
                totalExpense,
                totalProfit,
                activeOrders: orders[0].total,
                totalCustomers: 124, // Example metric
                activeUsers: 45, // Example metric
                lowStock: lowStock[0].total,
                unpaidInvoice: unpaid[0].total,
                chartData: {
                    monthlyRevenue: monthlyRev.reverse(),
                    cabangPerformance: cabang
                },
                recentTransactions: recentTrans
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMarketing = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const [leads] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline");
        
        res.status(200).json({
            status: "success",
            data: {
                totalLeads: leads[0].total * 3, // mock multiplier for leads
                newCustomers: 28,
                closingRate: "68%",
                topMarketing: "Budi Santoso",
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
        const [incomes] = await promiseDb.query("SELECT COALESCE(SUM(jumlah), 0) as total FROM payment");
        const [expenses] = await promiseDb.query("SELECT COALESCE(SUM(jumlah), 0) as total FROM expense");
        
        const [unpaid] = await promiseDb.query("SELECT COUNT(*) as total FROM invoice WHERE status = 'unpaid'");

        res.status(200).json({
            status: "success",
            data: {
                totalIncome: incomes[0].total,
                totalExpense: expenses[0].total,
                netProfit: incomes[0].total - expenses[0].total,
                unpaidInvoiceCount: unpaid[0].total,
                cashflow: [
                    { month: 'Jan', in: 50000000, out: 30000000 },
                    { month: 'Feb', in: 65000000, out: 35000000 },
                    { month: 'Mar', in: 70000000, out: 40000000 }
                ]
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
        const [lowStock] = await promiseDb.query("SELECT COUNT(*) as total FROM stok WHERE jumlah <= 10");
        const [inToday] = await promiseDb.query("SELECT COALESCE(SUM(jumlah), 0) as total FROM barang_masuk WHERE DATE(tanggal) = CURDATE()");
        const [outToday] = await promiseDb.query("SELECT COALESCE(SUM(jumlah), 0) as total FROM barang_keluar WHERE DATE(tanggal) = CURDATE()");

        res.status(200).json({
            status: "success",
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
        const [antre] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline WHERE status = 'Proses'");
        const [proses] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline WHERE status = 'Proses'");
        const [selesai] = await promiseDb.query("SELECT COUNT(*) as total FROM order_offline WHERE status = 'Selesai' AND DATE(tanggal_masuk) = CURDATE()");

        res.status(200).json({
            status: "success",
            data: {
                queueCount: antre[0].total,
                processingCount: proses[0].total,
                packingCount: 12, // Dummy
                completedToday: selesai[0].total,
                lateDeadline: 3 // Dummy
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCabang = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const [cabangList] = await promiseDb.query("SELECT * FROM cabang");

        res.status(200).json({
            status: "success",
            data: cabangList
        });
    } catch (error) {
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

        res.status(200).json({
            status: "success",
            data: {
                totalUsers: total[0].count,
                activeUsers: aktif[0].count,
                inactiveUsers: nonaktif[0].count,
                usersByRole: roles
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
