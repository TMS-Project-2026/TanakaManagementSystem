const db = require('../config/db');

// ================= CUSTOMER =================
exports.getCustomers = (req, res) => {
    db.query("SELECT * FROM marketing_customers WHERE type = 'offline' AND branch = 'Banua' ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.createCustomer = (req, res) => {
    const { nama_customer, no_hp, alamat, catatan } = req.body;
    db.query(
        "INSERT INTO marketing_customers (nama_customer, no_hp, alamat, catatan, type, branch) VALUES (?, ?, ?, ?, 'offline', 'Banua')",
        [nama_customer, no_hp, alamat, catatan],
        (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: result.insertId, message: "Customer berhasil ditambahkan" });
        }
    );
};

exports.updateCustomer = (req, res) => {
    const { nama_customer, no_hp, alamat, catatan } = req.body;
    db.query(
        "UPDATE marketing_customers SET nama_customer=?, no_hp=?, alamat=?, catatan=? WHERE id=? AND type='offline' AND branch='Banua'",
        [nama_customer, no_hp, alamat, catatan, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: "Customer berhasil diupdate" });
        }
    );
};

exports.deleteCustomer = (req, res) => {
    db.query("DELETE FROM marketing_customers WHERE id=? AND type='offline' AND branch='Banua'", [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Customer berhasil dihapus" });
    });
};

// ================= QUOTATION =================
exports.getQuotations = (req, res) => {
    const { start, end } = req.query;
    let sql = "SELECT * FROM marketing_quotations WHERE type = 'offline' AND branch = 'Banua'";
    const params = [];

    if (start && end) {
        sql += " AND DATE(created_at) BETWEEN ? AND ?";
        params.push(start, end);
    }

    sql += " ORDER BY created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.createQuotation = (req, res) => {
    const { customer_name, product_name, qty, price, note } = req.body;
    const total = qty * price;
    db.query(
        "INSERT INTO marketing_quotations (customer_name, product_name, qty, price, total, note, status, type, branch) VALUES (?, ?, ?, ?, ?, ?, 'draft', 'offline', 'Banua')",
        [customer_name, product_name, qty, price, total, note],
        (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: result.insertId, message: "Quotation berhasil dibuat" });
        }
    );
};

exports.updateQuotation = (req, res) => {
    const { customer_name, product_name, qty, price, note } = req.body;
    const total = qty * price;
    db.query(
        "UPDATE marketing_quotations SET customer_name=?, product_name=?, qty=?, price=?, total=?, note=? WHERE id=? AND type='offline' AND branch='Banua'",
        [customer_name, product_name, qty, price, total, note, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: "Quotation berhasil diupdate" });
        }
    );
};

exports.deleteQuotation = (req, res) => {
    db.query("DELETE FROM marketing_quotations WHERE id=? AND type='offline' AND branch='Banua'", [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Quotation berhasil dihapus" });
    });
};

exports.ajukanQuotation = (req, res) => {
    const { id } = req.params;
    
    // Ambil data quotation
    db.query("SELECT * FROM marketing_quotations WHERE id = ? AND type='offline' AND branch='Banua'", [id], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error: " + err.message });
        if (results.length === 0) return res.status(404).json({ message: "Quotation tidak ditemukan" });
        
        const q = results[0];
        if (q.status !== 'draft') {
            return res.status(400).json({ message: "Hanya Quotation dengan status 'draft' yang bisa diajukan." });
        }

        const keterangan = `Quotation Offline Banua untuk ${q.customer_name} - Produk: ${q.product_name} (${q.qty} pcs)`;
        const nominal = q.total;
        
        const sqlApproval = `INSERT INTO approvals (tipe, keterangan, nominal, diajukan_oleh, status, tanggal_pengajuan, reference_id) 
                             VALUES ('quotation_to_invoice', ?, ?, 'Marketing Offline Banua', 'pending', CURRENT_TIMESTAMP, ?)`;
                             
        db.query(sqlApproval, [keterangan, nominal, id], (errApprove) => {
            if (errApprove) return res.status(500).json({ message: "Gagal mengajukan: " + errApprove.message });
            
            // Update status quotation jadi pending
            db.query("UPDATE marketing_quotations SET status = 'pending' WHERE id = ?", [id], (errUpdate) => {
                if (errUpdate) return res.status(500).json({ message: "Berhasil diajukan tapi gagal update status." });
                res.json({ message: "Quotation berhasil diajukan ke Finance." });
            });
        });
    });
};

// ================= ORDER MANUAL =================
exports.getOrders = (req, res) => {
    const { start, end } = req.query;
    let sql = "SELECT *, jenis_pembayaran as payment_type, DATEDIFF(deadline, CURDATE()) as sisa_hari FROM marketing_orders_offline WHERE type = 'offline' AND branch = 'Banua'";
    const params = [];

    if (start && end) {
        sql += " AND DATE(created_at) BETWEEN ? AND ?";
        params.push(start, end);
    }

    sql += " ORDER BY created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.createOrder = (req, res) => {
    const { 
        customer, alamat_pt, up_penagihan, cp_penagihan, email, kategori_pasar,
        items, subtotal, ppn_persen, jumlah_ppn, grand_total, 
        deadline, status, payment_type, status_produksi, lokasi_proses, catatan 
    } = req.body;
    
    const itemsJson = items ? JSON.stringify(items) : null;
    let produk = '';
    let qty = 1;
    let harga = 0;
    
    if (items && items.length > 0) {
        produk = items.map(i => i.rincian || i.nama_barang || '').join(', ');
        qty = items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0), 0);
        harga = subtotal || items.reduce((acc, curr) => acc + (parseFloat(curr.harga_satuan) || 0), 0);
    } else {
        // Fallback to old format if submitted
        produk = req.body.produk || '';
        qty = req.body.qty || 1;
        harga = req.body.harga || 0;
    }

    db.query(
        "INSERT INTO marketing_orders_offline (customer, alamat_pt, up_penagihan, cp_penagihan, email, kategori_pasar, items, subtotal, ppn_persen, jumlah_ppn, grand_total, produk, qty, harga, deadline, status, jenis_pembayaran, status_produksi, lokasi_proses, catatan, type, branch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'offline', 'Banua')",
        [
            customer, alamat_pt, up_penagihan, cp_penagihan, email, kategori_pasar || null,
            itemsJson, subtotal || 0, ppn_persen || 0, jumlah_ppn || 0, grand_total || (harga * qty),
            produk, qty, harga, deadline || null, status || 'New Order', payment_type || 'DP', 
            status_produksi || 'Beli Kain', lokasi_proses || 'Internal', catatan
        ],
        (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            
            // Auto save customer
            if (customer) {
                db.query("SELECT id FROM marketing_customers WHERE nama_customer = ? AND type = 'offline' AND branch = 'Banua'", [customer], (errCust, resCust) => {
                    if (!errCust && resCust.length === 0) {
                        db.query("INSERT INTO marketing_customers (nama_customer, alamat, no_hp, email, up_penagihan, type, branch) VALUES (?, ?, ?, ?, ?, 'offline', 'Banua')", 
                        [customer, alamat_pt || '', cp_penagihan || '', email || '', up_penagihan || '']);
                    }
                });
            }

            res.status(201).json({ id: result.insertId, message: "Order berhasil ditambahkan" });
        }
    );
};

exports.updateOrder = (req, res) => {
    const { 
        customer, alamat_pt, up_penagihan, cp_penagihan, email, kategori_pasar,
        items, subtotal, ppn_persen, jumlah_ppn, grand_total, 
        deadline, status, payment_type, status_produksi, lokasi_proses, catatan 
    } = req.body;

    const itemsJson = items ? JSON.stringify(items) : null;
    let produk = '';
    let qty = 1;
    let harga = 0;
    
    if (items && items.length > 0) {
        produk = items.map(i => i.rincian || i.nama_barang || '').join(', ');
        qty = items.reduce((acc, curr) => acc + (parseInt(curr.qty) || 0), 0);
        harga = subtotal || items.reduce((acc, curr) => acc + (parseFloat(curr.harga_satuan) || 0), 0);
    } else {
        produk = req.body.produk || '';
        qty = req.body.qty || 1;
        harga = req.body.harga || 0;
    }

    db.query(
        "UPDATE marketing_orders_offline SET customer=?, alamat_pt=?, up_penagihan=?, cp_penagihan=?, email=?, kategori_pasar=?, items=?, subtotal=?, ppn_persen=?, jumlah_ppn=?, grand_total=?, produk=?, qty=?, harga=?, deadline=?, status=?, jenis_pembayaran=?, status_produksi=?, lokasi_proses=?, catatan=? WHERE id=? AND type='offline' AND branch='Banua'",
        [
            customer, alamat_pt, up_penagihan, cp_penagihan, email, kategori_pasar || null,
            itemsJson, subtotal || 0, ppn_persen || 0, jumlah_ppn || 0, grand_total || (harga * qty),
            produk, qty, harga, deadline || null, status, payment_type, 
            status_produksi, lokasi_proses, catatan, req.params.id
        ],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: "Order berhasil diupdate" });
        }
    );
};

exports.deleteOrder = (req, res) => {
    db.query("DELETE FROM marketing_orders_offline WHERE id=? AND type='offline' AND branch='Banua'", [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Order berhasil dihapus" });
    });
};

exports.ajukanOrder = (req, res) => {
    const { id } = req.params;
    
    db.query("SELECT * FROM marketing_orders_offline WHERE id = ? AND type='offline' AND branch='Banua'", [id], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error: " + err.message });
        if (results.length === 0) return res.status(404).json({ message: "Order tidak ditemukan" });
        
        const order = results[0];
        if (order.status !== 'Pending' && order.status !== 'New Order') {
            return res.status(400).json({ message: "Hanya Order dengan status 'Pending' atau 'New Order' yang bisa diajukan." });
        }

        const keterangan = `Pembuatan Invoice dari Order Offline Banua untuk ${order.customer} - Total: ${order.grand_total}`;
        const nominal = order.grand_total || (order.harga * order.qty);
        
        const sqlApproval = `INSERT INTO approvals (tipe, keterangan, nominal, diajukan_oleh, status, tanggal_pengajuan, reference_id) 
                             VALUES ('order_to_invoice', ?, ?, 'Marketing Offline Banua', 'pending', CURRENT_TIMESTAMP, ?)`;
                             
        db.query(sqlApproval, [keterangan, nominal, id], (errApprove) => {
            if (errApprove) return res.status(500).json({ message: "Gagal mengajukan: " + errApprove.message });
            
            db.query("UPDATE marketing_orders_offline SET status = 'Pending Finance' WHERE id = ?", [id], (errUpdate) => {
                if (errUpdate) return res.status(500).json({ message: "Berhasil diajukan tapi gagal update status." });
                res.json({ message: "Order berhasil diajukan ke Finance." });
            });
        });
    });
};

exports.bulkCreateOrders = (req, res) => {
    const orders = req.body; // Expecting an array of objects
    if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ message: "Data tidak valid atau kosong" });
    }

    const values = orders.map(o => [
        o.customer,
        o.produk,
        o.qty,
        o.harga,
        o.deadline || null,
        o.status || 'Pending',
        o.payment_type || 'DP',
        o.status_produksi || 'Beli Kain',
        o.lokasi_proses || 'Internal',
        o.catatan || '',
        'offline',
        'Banua'
    ]);

    const sql = "INSERT INTO marketing_orders_offline (customer, produk, qty, harga, deadline, status, jenis_pembayaran, status_produksi, lokasi_proses, catatan, type, branch) VALUES ?";
    db.query(sql, [values], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ message: `${result.affectedRows} Order berhasil diimport` });
    });
};

// ================= INVENTORY =================
exports.getInventory = (req, res) => {
    // Inventory view only from stok table for branch Banua
    db.query("SELECT id, nama_barang as product_name, jumlah as stock_qty, minimum_stok FROM stok WHERE cabang_id = 'Banua'", (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

// ================= REPORTS =================
exports.getReports = (req, res) => {
    const { start, end } = req.query;
    let dateFilter = "";
    const params = [];
    if (start && end) {
        dateFilter = " AND DATE(created_at) BETWEEN ? AND ?";
        params.push(start, end);
    }

    const queries = {
        harian: `
            SELECT tanggal, SUM(pendapatan) as pendapatan, SUM(jumlah_quotation) as jumlah_quotation
            FROM (
                SELECT DATE(created_at) as tanggal, total as pendapatan, 1 as jumlah_quotation
                FROM marketing_quotations 
                WHERE type = 'offline' AND branch = 'Banua' AND status = 'approved'
                UNION ALL
                SELECT DATE(created_at) as tanggal, 
                       COALESCE(JSON_UNQUOTE(JSON_EXTRACT(items, '$[0].qty')) * JSON_UNQUOTE(JSON_EXTRACT(items, '$[0].harga_satuan')), 0) as pendapatan, 
                       1 as jumlah_quotation
                FROM marketing_orders_offline 
                WHERE type = 'offline' AND branch = 'Banua'
            ) t
            WHERE 1=1 ${dateFilter ? dateFilter.replace('AND DATE(created_at)', 'AND tanggal') : ''}
            GROUP BY tanggal 
            ORDER BY tanggal DESC
        `,
        bulanan: `
            SELECT bulan, SUM(pendapatan) as pendapatan, SUM(jumlah_quotation) as jumlah_quotation
            FROM (
                SELECT DATE_FORMAT(created_at, '%Y-%m') as bulan, total as pendapatan, 1 as jumlah_quotation
                FROM marketing_quotations 
                WHERE type = 'offline' AND branch = 'Banua' AND status = 'approved'
                UNION ALL
                SELECT DATE_FORMAT(created_at, '%Y-%m') as bulan, 
                       COALESCE(JSON_UNQUOTE(JSON_EXTRACT(items, '$[0].qty')) * JSON_UNQUOTE(JSON_EXTRACT(items, '$[0].harga_satuan')), 0) as pendapatan, 
                       1 as jumlah_quotation
                FROM marketing_orders_offline 
                WHERE type = 'offline' AND branch = 'Banua'
            ) t
            WHERE 1=1 ${dateFilter ? `AND bulan BETWEEN DATE_FORMAT(?, '%Y-%m') AND DATE_FORMAT(?, '%Y-%m')` : ''}
            GROUP BY bulan 
            ORDER BY bulan DESC
        `,
        tahunan: `
            SELECT tahun, SUM(pendapatan) as pendapatan, SUM(jumlah_quotation) as jumlah_quotation
            FROM (
                SELECT YEAR(created_at) as tahun, total as pendapatan, 1 as jumlah_quotation
                FROM marketing_quotations 
                WHERE type = 'offline' AND branch = 'Banua' AND status = 'approved'
                UNION ALL
                SELECT YEAR(created_at) as tahun, 
                       COALESCE(JSON_UNQUOTE(JSON_EXTRACT(items, '$[0].qty')) * JSON_UNQUOTE(JSON_EXTRACT(items, '$[0].harga_satuan')), 0) as pendapatan, 
                       1 as jumlah_quotation
                FROM marketing_orders_offline 
                WHERE type = 'offline' AND branch = 'Banua'
            ) t
            GROUP BY tahun 
            ORDER BY tahun DESC
        `,
        dashboardSummary: `
            SELECT 
                (SELECT COUNT(*) FROM marketing_customers WHERE type='offline' AND branch='Banua') as total_customers,
                (SELECT COUNT(*) FROM marketing_orders_offline WHERE type='offline' AND branch='Banua' ${dateFilter}) as total_orders,
                (SELECT COUNT(*) FROM marketing_quotations WHERE type='offline' AND branch='Banua' AND status='pending' ${dateFilter}) as pending_quotations,
                (
                    SELECT SUM(pendapatan) FROM (
                        SELECT total as pendapatan, created_at FROM marketing_quotations WHERE type = 'offline' AND branch = 'Banua' AND status = 'approved'
                        UNION ALL
                        SELECT JSON_UNQUOTE(JSON_EXTRACT(items, '$[0].qty')) * JSON_UNQUOTE(JSON_EXTRACT(items, '$[0].harga_satuan')) as pendapatan, created_at FROM marketing_orders_offline WHERE type = 'offline' AND branch = 'Banua'
                    ) combined
                    WHERE 1=1 ${dateFilter}
                ) as range_revenue
        `,
        comparisons: `
            SELECT 
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN revenue ELSE 0 END) as revenue_today,
                SUM(CASE WHEN DATE(created_at) = CURDATE() - INTERVAL 1 DAY THEN revenue ELSE 0 END) as revenue_yesterday,
                SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) THEN revenue ELSE 0 END) as revenue_this_month,
                SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) THEN revenue ELSE 0 END) as revenue_last_month,
                SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) - 1 AND MONTH(created_at) = MONTH(CURDATE()) THEN revenue ELSE 0 END) as revenue_thismonth_lastyear
            FROM (
                SELECT created_at, total as revenue FROM marketing_quotations WHERE type = 'offline' AND branch = 'Banua' AND status = 'approved'
                UNION ALL
                SELECT created_at, COALESCE(JSON_UNQUOTE(JSON_EXTRACT(items, '$[0].qty')) * JSON_UNQUOTE(JSON_EXTRACT(items, '$[0].harga_satuan')), 0) as revenue FROM marketing_orders_offline WHERE type = 'offline' AND branch = 'Banua'
            ) combined
        `
    };

    let reports = { harian: [], bulanan: [], tahunan: [], summary: {}, comparisons: {} };

    db.query(queries.dashboardSummary, [...params, ...params, ...params], (err, res1) => {
        if (err) console.error("Error dashboardSummary:", err);
        if (!err && res1.length > 0) reports.summary = res1[0];

        db.query(queries.comparisons, (errCmp, resCmp) => {
            if (errCmp) console.error("Error comparisons:", errCmp);
            if (!errCmp && resCmp.length > 0) reports.comparisons = resCmp[0];

            db.query(queries.harian, params, (err2, res2) => {
                if (err2) console.error("Error harian:", err2);
                if (!err2) reports.harian = res2;

                db.query(queries.bulanan, params, (err3, res3) => {
                    if (err3) console.error("Error bulanan:", err3);
                    if (!err3) reports.bulanan = res3;

                    db.query(queries.tahunan, (err4, res4) => {
                        if (err4) console.error("Error tahunan:", err4);
                        if (!err4) reports.tahunan = res4;
                        res.json(reports);
                    });
                });
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
            FROM marketing_quotations 
            WHERE type = 'offline' AND branch = 'Banua' AND status = 'approved'
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
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
