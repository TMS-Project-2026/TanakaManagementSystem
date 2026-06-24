const db = require('../config/db');

// DASHBOARD
exports.getDashboard = (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    const startOfMonth = firstDayOfMonth.toISOString().split('T')[0];
    
    const queries = {
        revenueToday: `SELECT SUM(actual) as revenue FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' AND order_date = ?`,
        ordersToday: `SELECT COUNT(id) as total_orders FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' AND order_date = ?`,
        monthlySummary: `SELECT 
                            SUM(actual) as totalRevenue,
                            SUM(profit) as totalProfit,
                            SUM(total_hpp_aktual) as totalHpp,
                            SUM(qty) as totalQty,
                            SUM(potongan_shopee) as totalPotongan
                         FROM marketing_orders_online 
                         WHERE type = 'online' AND branch = 'Banua' 
                         AND order_date >= ?`,
        topProducts: `SELECT product_name, SUM(qty) as total_qty, SUM(actual) as total_sales FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' GROUP BY product_name ORDER BY total_qty DESC LIMIT 5`,
        salesChart: `SELECT order_date, SUM(actual) as revenue, COUNT(id) as orders FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' AND order_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) GROUP BY order_date ORDER BY order_date ASC`,
        topToko: `SELECT akun_toko, SUM(actual) as total_revenue, COUNT(id) as total_orders, SUM(qty) as total_qty FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' AND akun_toko IS NOT NULL AND akun_toko != '' AND akun_toko != '-' GROUP BY akun_toko ORDER BY total_revenue DESC`
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
        salesChart: [],
        topToko: []
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

                        db.query(queries.topToko, [], (err5, res5) => {
                            if (err5) return res.status(500).json({ error: err5.message });
                            resultData.topToko = res5 || [];
                            res.json(resultData);
                        });
                    });
                });
            });
        });
    });
};

// GET ORDERS
exports.getOrders = (req, res) => {
    const sql = `SELECT id, branch, type, customer_name, akun_toko, kode_produk, product_name, qty, price_unit, address, total_price, potongan_shopee, hpp_aktual, hpp, total_hpp_aktual, actual_satuan, actual, profit, order_date, status, catatan FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' ORDER BY order_date DESC`;
    db.query(sql, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

// UPDATE ORDER (edit HPP, qty, harga, dll)
exports.updateOrder = (req, res) => {
    const { id } = req.params;
    const {
        akun_toko, kode_produk, product_name, qty, price_unit,
        potongan_shopee, hpp_aktual, order_date, status, catatan
    } = req.body;

    // Hitung ulang semua field turunan
    const q   = parseInt(qty) || 0;
    const pu  = parseFloat(price_unit) || 0;
    const ps  = parseFloat(potongan_shopee) || 0;
    const hpp = parseFloat(hpp_aktual) || 0;

    const total_price      = q * pu;
    const hpp_total        = q * hpp;
    const total_hpp_aktual = hpp_total + ps;
    const actual           = total_price - ps;
    const actual_satuan    = q > 0 ? actual / q : 0;
    const profit           = actual - hpp_total;

    const sql = `
        UPDATE marketing_orders_online SET
            akun_toko = ?, kode_produk = ?, product_name = ?, qty = ?, price_unit = ?,
            total_price = ?, potongan_shopee = ?, hpp_aktual = ?,
            hpp = ?, total_hpp_aktual = ?, actual_satuan = ?,
            actual = ?, profit = ?, order_date = ?, status = ?, catatan = ?
        WHERE id = ?
    `;
    const values = [
        akun_toko, kode_produk || null, product_name, q, pu,
        total_price, ps, hpp,
        hpp_total, total_hpp_aktual, actual_satuan,
        actual, profit, order_date, status, catatan || null,
        id
    ];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ message: 'Gagal update: ' + err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Data tidak ditemukan' });
        res.json({ message: 'Order berhasil diperbarui' });
    });
};

// IMPORT SHOPEE
exports.importShopee = async (req, res) => {
    const orders = req.body; // Expecting an array of objects

    if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ message: "Data import kosong atau tidak valid." });
    }

    const promiseDb = db.promise();
    try {
        await promiseDb.query("START TRANSACTION");

        const values = [];
        const barangKeluarValues = [];

        for (const order of orders) {
            const productName = order.product_name || '-';
            const qty = parseInt(order.qty) || 1;
            
            // Check stock in inventory for branch 'Banua'
            let stokResult = [];
            if (order.stok_id) {
                [stokResult] = await promiseDb.query(
                    "SELECT id, jumlah FROM stok WHERE id = ? AND cabang_id = 'Banua'",
                    [order.stok_id]
                );
            } else {
                [stokResult] = await promiseDb.query(
                    "SELECT id, jumlah FROM stok WHERE nama_barang = ? AND cabang_id = 'Banua'",
                    [productName]
                );
            }

            if (stokResult.length === 0) {
                await promiseDb.query("ROLLBACK");
                return res.status(404).json({ message: `Barang tidak ditemukan di gudang Banua: ${productName}. Tidak dapat membuat pesanan.` });
            }

            const stok = stokResult[0];
            if (stok.jumlah < qty) {
                await promiseDb.query("ROLLBACK");
                return res.status(400).json({ message: `Stok tidak mencukupi untuk barang: ${productName}. Stok saat ini: ${stok.jumlah}, Dibutuhkan: ${qty}` });
            }

            // Deduct stock
            await promiseDb.query("UPDATE stok SET jumlah = jumlah - ? WHERE id = ?", [qty, stok.id]);

            // Add to barang_keluar log
            const orderDate = order.order_date || new Date().toISOString().split('T')[0];
            barangKeluarValues.push([
                null, // transaksi_id
                stok.id, // barang_id
                qty,
                orderDate,
                'Marketing Online' // tujuan
            ]);

            const price_unit = parseFloat(order.price_unit) || 0;
            const total_price = parseFloat(order.total_price) || (qty * price_unit);
            const potongan_shopee = parseFloat(order.potongan_shopee) || 0;
            const hpp_aktual = parseFloat(order.hpp_aktual) || 0;
            const hpp = parseFloat(order.hpp) || (qty * hpp_aktual);
            const total_hpp_aktual = parseFloat(order.total_hpp_aktual) || (hpp + potongan_shopee);
            const actual = parseFloat(order.actual) || (total_price - potongan_shopee);
            const actual_satuan = parseFloat(order.actual_satuan) || (qty > 0 ? actual / qty : 0);
            const profit = parseFloat(order.profit) || (actual - hpp);

            values.push([
                'Banua',
                'online',
                order.customer_name || '-',
                order.akun_toko || '-',
                order.kode_produk || null,
                productName,
                qty,
                price_unit,
                order.address || '-',
                total_price,
                potongan_shopee,
                hpp_aktual,
                hpp,
                total_hpp_aktual,
                actual_satuan,
                actual,
                profit,
                orderDate,
                order.status || 'draft',
                order.catatan || '-'
            ]);
        }

        const sqlOrders = `INSERT INTO marketing_orders_online 
                     (branch, type, customer_name, akun_toko, kode_produk, product_name, qty, price_unit, address, total_price, potongan_shopee, hpp_aktual, hpp, total_hpp_aktual, actual_satuan, actual, profit, order_date, status, catatan) 
                     VALUES ?`;
        const [resultOrders] = await promiseDb.query(sqlOrders, [values]);

        if (barangKeluarValues.length > 0) {
            const sqlBarangKeluar = `INSERT INTO barang_keluar (transaksi_id, barang_id, jumlah, tanggal, tujuan) VALUES ?`;
            await promiseDb.query(sqlBarangKeluar, [barangKeluarValues]);
        }

        await promiseDb.query("COMMIT");
        res.status(201).json({ message: `Berhasil menambahkan ${resultOrders.affectedRows} pesanan. Stok gudang otomatis dikurangi.` });
    } catch (error) {
        await promiseDb.query("ROLLBACK");
        console.error("Error import Shopee:", error);
        res.status(500).json({ message: "Gagal menyimpan pesanan: " + error.message });
    }
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
        harian: `SELECT order_date as date, SUM(actual) as revenue, COUNT(id) as orders FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' GROUP BY order_date ORDER BY order_date DESC LIMIT 30`,
        bulanan: `SELECT DATE_FORMAT(order_date, '%Y-%m') as month, SUM(actual) as revenue, COUNT(id) as orders FROM marketing_orders_online WHERE type = 'online' AND branch = 'Banua' GROUP BY DATE_FORMAT(order_date, '%Y-%m') ORDER BY month DESC LIMIT 12`,
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

// GET MARKETING TARGETS (Harian, Bulanan, Tahunan) dari database
exports.getTargets = (req, res) => {
    const sql = `SELECT account_name, target_type, target_value FROM marketing_targets WHERE branch = 'Banua' ORDER BY target_type, account_name`;
    db.query(sql, [], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // Group by type
        const targets = { harian: {}, bulanan: {}, tahunan: {} };
        results.forEach(row => {
            if (targets[row.target_type]) {
                targets[row.target_type][row.account_name] = parseFloat(row.target_value);
            }
        });
        res.json(targets);
    });
};

// UPDATE / INSERT MARKETING TARGET (single)
exports.updateTarget = (req, res) => {
    const { account_name, target_type, target_value } = req.body;
    if (!account_name || !target_type) {
        return res.status(400).json({ message: 'account_name dan target_type wajib diisi' });
    }
    // Bulatkan ke jutaan terdekat (misal 4.569.982 → 5.000.000)
    const rawValue = parseFloat(target_value) || 0;
    const roundedValue = Math.ceil(rawValue / 1000000) * 1000000;

    const sql = `INSERT INTO marketing_targets (account_name, target_type, target_value, branch) 
                 VALUES (?, ?, ?, 'Banua')
                 ON DUPLICATE KEY UPDATE target_value = VALUES(target_value), updated_at = CURRENT_TIMESTAMP`;
    db.query(sql, [account_name, target_type, roundedValue], (err, result) => {
        if (err) return res.status(500).json({ message: 'Gagal update target: ' + err.message });
        res.json({ message: 'Target berhasil diperbarui', rounded: roundedValue });
    });
};

// GET PROMO STOCK (Dead Stock >= 60 days / Mengendap >= 2 bulan)
exports.getPromoStock = (req, res) => {
    const sql = `
        SELECT
            s.id,
            s.nama_brand,
            s.nama_barang       AS product_name,
            s.jumlah            AS stock_qty,
            s.kategori,
            s.cabang_id,
            s.kode_rak,
            s.ukuran,
            s.created_at,
            DATEDIFF(CURDATE(), s.created_at) AS hari_mengendap
        FROM stok s
        WHERE
            s.jumlah > 0
            AND s.cabang_id = 'Banua'
            AND s.created_at <= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
            AND s.nama_barang NOT IN (
                SELECT DISTINCT product_name
                FROM marketing_orders_online
                WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
                  AND branch = 'Banua'
            )
        ORDER BY hari_mengendap DESC
    `;
    db.query(sql, [], (err, results) => {
        if (err) {
            console.error('Error get promo stock:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};
