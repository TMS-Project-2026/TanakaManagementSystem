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
    db.query("SELECT * FROM marketing_quotations WHERE type = 'offline' AND branch = 'Banua' ORDER BY created_at DESC", (err, results) => {
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
    db.query("SELECT * FROM marketing_orders_offline WHERE type = 'offline' AND branch = 'Banua' ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.createOrder = (req, res) => {
    const { customer, produk, qty, harga, deadline, status } = req.body;
    db.query(
        "INSERT INTO marketing_orders_offline (customer, produk, qty, harga, deadline, status, type, branch) VALUES (?, ?, ?, ?, ?, ?, 'offline', 'Banua')",
        [customer, produk, qty, harga, deadline || null, status || 'Pending'],
        (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(201).json({ id: result.insertId, message: "Order manual berhasil ditambahkan" });
        }
    );
};

exports.updateOrder = (req, res) => {
    const { customer, produk, qty, harga, deadline, status } = req.body;
    db.query(
        "UPDATE marketing_orders_offline SET customer=?, produk=?, qty=?, harga=?, deadline=?, status=? WHERE id=? AND type='offline' AND branch='Banua'",
        [customer, produk, qty, harga, deadline || null, status, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: "Order manual berhasil diupdate" });
        }
    );
};

exports.deleteOrder = (req, res) => {
    db.query("DELETE FROM marketing_orders_offline WHERE id=? AND type='offline' AND branch='Banua'", [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Order manual berhasil dihapus" });
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
        'offline',
        'Banua'
    ]);

    const sql = "INSERT INTO marketing_orders_offline (customer, produk, qty, harga, deadline, status, type, branch) VALUES ?";
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
    const queries = {
        harian: `
            SELECT DATE(created_at) as tanggal, SUM(total) as pendapatan, COUNT(id) as jumlah_quotation
            FROM marketing_quotations 
            WHERE type = 'offline' AND branch = 'Banua' AND status = 'approved'
            GROUP BY DATE(created_at) 
            ORDER BY tanggal DESC LIMIT 7
        `,
        bulanan: `
            SELECT DATE_FORMAT(created_at, '%Y-%m') as bulan, SUM(total) as pendapatan, COUNT(id) as jumlah_quotation
            FROM marketing_quotations 
            WHERE type = 'offline' AND branch = 'Banua' AND status = 'approved'
            GROUP BY DATE_FORMAT(created_at, '%Y-%m') 
            ORDER BY bulan DESC LIMIT 6
        `,
        dashboardSummary: `
            SELECT 
                (SELECT COUNT(*) FROM marketing_customers WHERE type='offline' AND branch='Banua') as total_customers,
                (SELECT COUNT(*) FROM marketing_orders_offline WHERE type='offline' AND branch='Banua') as total_orders,
                (SELECT COUNT(*) FROM marketing_quotations WHERE type='offline' AND branch='Banua' AND status='pending') as pending_quotations
        `,
        comparisons: `
            SELECT 
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total ELSE 0 END) as revenue_today,
                SUM(CASE WHEN DATE(created_at) = CURDATE() - INTERVAL 1 DAY THEN total ELSE 0 END) as revenue_yesterday,
                SUM(CASE WHEN DATE(created_at) = CURDATE() - INTERVAL 1 MONTH THEN total ELSE 0 END) as revenue_sameday_lastmonth,
                SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) THEN total ELSE 0 END) as revenue_this_month,
                SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) THEN total ELSE 0 END) as revenue_last_month,
                SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) - 1 AND MONTH(created_at) = MONTH(CURDATE()) THEN total ELSE 0 END) as revenue_thismonth_lastyear,
                SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) THEN total ELSE 0 END) as revenue_this_year,
                SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) - 1 THEN total ELSE 0 END) as revenue_last_year
            FROM marketing_quotations
            WHERE type = 'offline' AND branch = 'Banua' AND status = 'approved'
        `
    };

    let reports = { harian: [], bulanan: [], summary: {}, comparisons: {} };

    db.query(queries.dashboardSummary, (err, res1) => {
        if (!err && res1.length > 0) reports.summary = res1[0];

        db.query(queries.comparisons, (errCmp, resCmp) => {
            if (!errCmp && resCmp.length > 0) reports.comparisons = resCmp[0];

            db.query(queries.harian, (err2, res2) => {
                if (!err2) reports.harian = res2;

                db.query(queries.bulanan, (err3, res3) => {
                    if (!err3) reports.bulanan = res3;

                    res.json(reports);
                });
            });
        });
    });
};
