const db = require('../config/db');

// DASHBOARD
exports.getDashboard = (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    const startOfMonth = firstDayOfMonth.toISOString().split('T')[0];
    
    const queries = {
        revenueToday: `SELECT SUM(total_price) as revenue FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' AND order_date = ?`,
        ordersToday: `SELECT COUNT(id) as total_orders FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' AND order_date = ?`,
        monthlySummary: `SELECT 
                            SUM(total_price) as totalRevenue,
                            SUM(profit) as totalProfit,
                            SUM(total_hpp_aktual) as totalHpp,
                            SUM(qty) as totalQty,
                            SUM(potongan_shopee) as totalPotongan
                         FROM marketing_orders_online 
                         WHERE type = 'online' AND branch = 'Banua' 
                         AND order_date >= ?`,
        topProducts: `SELECT product_name, SUM(qty) as total_qty, SUM(total_price) as total_sales FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' GROUP BY product_name ORDER BY total_qty DESC LIMIT 10`,
        salesChart: `SELECT order_date, SUM(total_price) as revenue, COUNT(id) as orders FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' AND order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY order_date ORDER BY order_date ASC`
    };

    let resultData = {
        revenueToday: 0,
        ordersToday: 0,
        monthlySummary: {
            totalRevenue: 0,
            totalProfit: 0,
            totalHpp: 0,
            totalQty: 0,
            totalPotongan: 0
        },
        topProducts: [],
        salesChart: []
    };

    db.query(queries.revenueToday, [today], (err1, res1) => {
        if (err1) return res.status(500).json({ error: err1.message });
        resultData.revenueToday = res1[0]?.revenue || 0;

        db.query(queries.ordersToday, [today], (err2, res2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            resultData.ordersToday = res2[0]?.total_orders || 0;

            db.query(queries.monthlySummary, [startOfMonth], (errM, resM) => {
                if (errM) return res.status(500).json({ error: errM.message });
                resultData.monthlySummary = resM[0] || resultData.monthlySummary;

                db.query(queries.topProducts, [], (err3, res3) => {
                    if (err3) return res.status(500).json({ error: err3.message });
                    resultData.topProducts = res3 || [];

                    db.query(queries.salesChart, [], (err4, res4) => {
                        if (err4) return res.status(500).json({ error: err4.message });
                        resultData.salesChart = res4 || [];

                        res.json(resultData);
                    });
                });
            });
        });
    });
};

// GET ORDERS
exports.getOrders = (req, res) => {
    const sql = `SELECT * FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' ORDER BY order_date DESC`;
    db.query(sql, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// IMPORT SHOPEE
exports.importShopee = (req, res) => {
    const orders = req.body; // Expecting an array of objects

    if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ message: "Data import kosong atau tidak valid." });
    }

    const sql = `INSERT INTO marketing_orders_online 
                 (branch, type, customer_name, akun_toko, product_name, qty, price_unit, address, total_price, potongan_shopee, hpp_aktual, total_hpp_aktual, profit, order_date, status) 
                 VALUES ?`;
                 
    const values = orders.map(order => [
        'Banua',
        'online',
        order.customer_name || '-',
        order.akun_toko || '-',
        order.product_name || '-',
        parseInt(order.qty) || 1,
        parseFloat(order.price_unit) || 0,
        order.address || '-',
        parseFloat(order.total_price) || 0,
        parseFloat(order.potongan_shopee) || 0,
        parseFloat(order.hpp_aktual) || 0,
        parseFloat(order.total_hpp_aktual) || 0,
        parseFloat(order.profit) || 0,
        order.order_date || new Date().toISOString().split('T')[0],
        order.status || 'draft'
    ]);

    db.query(sql, [values], (err, result) => {
        if (err) {
            console.error("Error import Shopee:", err);
            return res.status(500).json({ message: "Gagal menyimpan data import: " + err.message });
        }
        res.status(201).json({ message: `Berhasil mengimport ${result.affectedRows} data.` });
    });
};

// GET INVENTORY (Integrated with Warehouse Stock)
exports.getInventory = (req, res) => {
    // We join with the branch information if needed, but here we'll just fetch all main stocks
    const sql = `SELECT id, nama_barang as product_name, jumlah as stock_qty, kategori, minimum_stok FROM stok ORDER BY nama_barang ASC`;
    db.query(sql, [], (err, results) => {
        if (err) {
            console.error("Error get inventory:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};

// GET REPORTS (Harian, Bulanan, Berjalan)
exports.getReports = (req, res) => {
    const queries = {
        harian: `SELECT order_date as date, SUM(total_price) as revenue, COUNT(id) as orders FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' GROUP BY order_date ORDER BY order_date DESC LIMIT 30`,
        bulanan: `SELECT DATE_FORMAT(order_date, '%Y-%m') as month, SUM(total_price) as revenue, COUNT(id) as orders FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' GROUP BY DATE_FORMAT(order_date, '%Y-%m') ORDER BY month DESC LIMIT 12`,
    };

    let reports = {
        harian: [],
        bulanan: []
    };

    db.query(queries.harian, [], (err1, res1) => {
        if (err1) return res.status(500).json({ error: err1.message });
        reports.harian = res1 || [];

        db.query(queries.bulanan, [], (err2, res2) => {
            if (err2) return res.status(500).json({ error: err2.message });
            reports.bulanan = res2 || [];
            
            res.json(reports);
        });
    });
};

exports.ajukanKeFinance = (req, res) => {
    const { id } = req.params;
    
    // 1. Ambil data order online
    db.query("SELECT * FROM marketing_orders_online WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error: " + err.message });
        if (results.length === 0) return res.status(404).json({ message: "Data pesanan tidak ditemukan" });
        
        const order = results[0];

        // 2. Insert ke approvals
        // Karena order dari shopee biasanya sudah lunas, nominal = total_price
        const keterangan = `Invoice Pesanan Online untuk ${order.customer_name} - Produk: ${order.product_name} (${order.qty} pcs)`;
        const nominal = order.total_price;
        
        const sqlApproval = `INSERT INTO approvals (tipe, keterangan, nominal, diajukan_oleh, status, tanggal_pengajuan, reference_id) 
                             VALUES ('quotation_to_invoice', ?, ?, 'Marketing Online', 'pending', CURRENT_TIMESTAMP, ?)`;
                             
        db.query(sqlApproval, [keterangan, nominal, id], (errApprove, resultApprove) => {
            if (errApprove) return res.status(500).json({ message: "Gagal mengajukan: " + errApprove.message });
            
            // Simpan perubahan status agar marketing tau sudah diajukan
            db.query("UPDATE marketing_orders_online SET status = 'Menunggu Finance' WHERE id = ?", [id], (errUpdate) => {
                if (errUpdate) return res.status(500).json({ message: "Berhasil diajukan tapi gagal update status order." });
                res.json({ message: "Pesanan berhasil diajukan ke Finance untuk pembuatan Invoice." });
            });
        });
    });
};

// GET PROMO STOCK (Dead Stock > 60 days)
exports.getPromoStock = (req, res) => {
    const sql = `
        SELECT s.id, s.nama_barang as product_name, s.jumlah as stock_qty, s.kategori
        FROM stok s
        WHERE s.jumlah > 0
        AND s.nama_barang NOT IN (
            SELECT DISTINCT product_name 
            FROM marketing_orders_online 
            WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
        )
        ORDER BY s.jumlah DESC
    `;
    db.query(sql, [], (err, results) => {
        if (err) {
            console.error("Error get promo stock:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};
