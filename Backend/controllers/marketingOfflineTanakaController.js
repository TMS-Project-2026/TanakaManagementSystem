const db = require('../config/db');

// Helper: trim ISO datetime to YYYY-MM-DD for MySQL DATE columns
const parseDate = (val) => {
    if (!val) return null;
    // Handles '2026-07-03T17:00:00.000Z' → '2026-07-03'
    return String(val).substring(0, 10);
};

// ================= CUSTOMER =================
exports.getCustomers = (req, res) => {
    db.query("SELECT * FROM marketing_customers WHERE type = 'offline' AND branch = 'Tanaka' ORDER BY created_at DESC", (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.createCustomer = (req, res) => {
    const { nama_customer, no_hp, alamat, catatan } = req.body;
    db.query(
        "INSERT INTO marketing_customers (nama_customer, no_hp, alamat, catatan, type, branch) VALUES (?, ?, ?, ?, 'offline', 'Tanaka')",
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
        "UPDATE marketing_customers SET nama_customer=?, no_hp=?, alamat=?, catatan=? WHERE id=? AND type='offline' AND branch='Tanaka'",
        [nama_customer, no_hp, alamat, catatan, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: "Customer berhasil diupdate" });
        }
    );
};

exports.deleteCustomer = (req, res) => {
    db.query("DELETE FROM marketing_customers WHERE id=? AND type='offline' AND branch='Tanaka'", [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Customer berhasil dihapus" });
    });
};

// ================= QUOTATION =================
exports.getQuotations = (req, res) => {
    const { start, end } = req.query;
    let sql = "SELECT * FROM marketing_quotations WHERE type = 'offline' AND branch = 'Tanaka'";
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
        "INSERT INTO marketing_quotations (customer_name, product_name, qty, price, total, note, status, type, branch) VALUES (?, ?, ?, ?, ?, ?, 'draft', 'offline', 'Tanaka')",
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
        "UPDATE marketing_quotations SET customer_name=?, product_name=?, qty=?, price=?, total=?, note=? WHERE id=? AND type='offline' AND branch='Tanaka'",
        [customer_name, product_name, qty, price, total, note, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.json({ message: "Quotation berhasil diupdate" });
        }
    );
};

exports.deleteQuotation = (req, res) => {
    db.query("DELETE FROM marketing_quotations WHERE id=? AND type='offline' AND branch='Tanaka'", [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Quotation berhasil dihapus" });
    });
};

exports.ajukanQuotation = (req, res) => {
    const { id } = req.params;
    
    db.query("SELECT * FROM marketing_quotations WHERE id = ? AND type='offline' AND branch='Tanaka'", [id], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error: " + err.message });
        if (results.length === 0) return res.status(404).json({ message: "Quotation tidak ditemukan" });
        
        const q = results[0];
        if (q.status !== 'draft') {
            return res.status(400).json({ message: "Hanya Quotation dengan status 'draft' yang bisa diajukan." });
        }

        const keterangan = `Quotation Offline Tanaka untuk ${q.customer_name} - Produk: ${q.product_name} (${q.qty} pcs)`;
        const nominal = q.total;
        
        const sqlApproval = `INSERT INTO approvals (tipe, keterangan, nominal, diajukan_oleh, status, tanggal_pengajuan, reference_id) 
                             VALUES ('quotation_to_invoice', ?, ?, 'Marketing Offline Tanaka', 'pending', CURRENT_TIMESTAMP, ?)`;
                             
        db.query(sqlApproval, [keterangan, nominal, id], (errApprove) => {
            if (errApprove) return res.status(500).json({ message: "Gagal mengajukan: " + errApprove.message });
            
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
    let sql = `
        SELECT o.*, o.jenis_pembayaran as payment_type, DATEDIFF(o.deadline, CURDATE()) as sisa_hari,
            q.id as quotation_id, q.status as quotation_status, q.no_quotation, q.file_uploads as quotation_files,
            q.alasan_penolakan as quotation_alasan_penolakan,
            inv.id as invoice_id, inv.no_invoice as invoice_no
        FROM marketing_orders_offline o
        LEFT JOIN (
            SELECT mq1.* FROM marketing_quotations mq1
            INNER JOIN (
                SELECT order_id, MAX(id) as max_id 
                FROM marketing_quotations 
                GROUP BY order_id
            ) mq2 ON mq1.id = mq2.max_id
        ) q ON o.id = q.order_id
        LEFT JOIN invoice inv ON q.id = inv.quotation_id
        WHERE o.type = 'offline' AND o.branch = 'Tanaka'
    `;
    const params = [];

    if (start && end) {
        sql += " AND DATE(o.created_at) BETWEEN ? AND ?";
        params.push(start, end);
    }

    sql += " ORDER BY o.created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json(results);
    });
};

exports.createOrder = (req, res) => {
    const { 
        customer, alamat_pt, up_penagihan, cp_penagihan, email,
        items, subtotal, ppn_persen, jumlah_ppn, diskon, diskon_persen, grand_total, 
        deadline, status, payment_type, status_produksi, lokasi_proses, catatan,
        approval_status, kategori_pelanggan 
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

    let isNeedOwnerApproval = false;
    let diskonKeterangan = [];
    if (items && items.length > 0) {
        items.forEach(i => {
            const hSatuan = Number(i.harga_satuan || 0);
            const hSpv = Number(i.harga_spv || 0);
            if (hSpv > 0 && hSatuan < hSpv) {
                isNeedOwnerApproval = true;
                diskonKeterangan.push(`${i.rincian} (Harga: Rp ${hSatuan}, SPV: Rp ${hSpv})`);
            }
        });
    }

    let initialStatus = status || 'New Order';
    if (isNeedOwnerApproval) {
        initialStatus = 'Menunggu Approval Owner';
    } else if (payment_type === 'Non DP') {
        initialStatus = 'Menunggu Approval Non DP';
    }

    db.query(
        "INSERT INTO marketing_orders_offline (customer, alamat_pt, up_penagihan, cp_penagihan, email, items, subtotal, ppn_persen, jumlah_ppn, diskon, diskon_persen, grand_total, produk, qty, harga, deadline, status, jenis_pembayaran, status_produksi, lokasi_proses, catatan, approval_status, kategori_pelanggan, type, branch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'offline', 'Tanaka')",
        [
            customer, alamat_pt, up_penagihan, cp_penagihan, email,
            itemsJson, subtotal || 0, ppn_persen || 0, jumlah_ppn || 0, diskon || 0, diskon_persen || 0, grand_total || (harga * qty),
            produk, qty, harga, parseDate(deadline), initialStatus, payment_type || 'DP', 
            status_produksi || 'Beli Kain', lokasi_proses || 'Internal', catatan,
            approval_status || 'Belum Disetujui', kategori_pelanggan || 'Pelanggan Baru'
        ],
        (err, result) => {
            if (err) return res.status(500).json({ message: err.message });
            
            // Auto save customer
            if (customer) {
                db.query("SELECT id FROM marketing_customers WHERE nama_customer = ? AND type = 'offline' AND branch = 'Tanaka'", [customer], (errCust, resCust) => {
                    if (!errCust && resCust.length === 0) {
                        db.query("INSERT INTO marketing_customers (nama_customer, alamat, no_hp, email, up_penagihan, type, branch) VALUES (?, ?, ?, ?, ?, 'offline', 'Tanaka')", 
                        [customer, alamat_pt || '', cp_penagihan || '', email || '', up_penagihan || '']);
                    }
                });
            }

            if (isNeedOwnerApproval) {
                const ket = `Pengajuan Diskon - Order Offline Tanaka | Customer: ${customer} | Item: ${diskonKeterangan.join(', ')}`;
                db.query("INSERT INTO approvals (tipe, keterangan, nominal, diajukan_oleh, status, tanggal_pengajuan, reference_id) VALUES ('diskon_order', ?, ?, 'Marketing Offline Tanaka', 'pending', CURRENT_TIMESTAMP, ?)", [ket, grand_total || (harga * qty), result.insertId]);
            } else if (payment_type === 'Non DP') {
                const ket = `Pengajuan Order NON DP - Cabang Tanaka | Customer: ${customer} | Total: Rp ${Number(grand_total || (harga * qty)).toLocaleString('id-ID')}`;
                db.query("INSERT INTO approvals (tipe, keterangan, nominal, diajukan_oleh, status, tanggal_pengajuan, reference_id) VALUES ('nondp_order', ?, ?, 'Marketing Offline Tanaka', 'pending', CURRENT_TIMESTAMP, ?)", [ket, grand_total || (harga * qty), result.insertId]);
            }

            res.status(201).json({ id: result.insertId, message: "Order berhasil ditambahkan" });
        }
    );
};

exports.updateOrder = (req, res) => {
    const { 
        customer, alamat_pt, up_penagihan, cp_penagihan, email,
        items, subtotal, ppn_persen, jumlah_ppn, diskon, diskon_persen, grand_total, 
        deadline, status, payment_type, status_produksi, lokasi_proses, catatan,
        approval_status, kategori_pelanggan 
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

    let isNeedOwnerApproval = false;
    let diskonKeterangan = [];
    if (items && items.length > 0) {
        items.forEach(i => {
            const hSatuan = Number(i.harga_satuan || 0);
            const hSpv = Number(i.harga_spv || 0);
            if (hSpv > 0 && hSatuan < hSpv) {
                isNeedOwnerApproval = true;
                diskonKeterangan.push(`${i.rincian} (Harga: Rp ${hSatuan}, SPV: Rp ${hSpv})`);
            }
        });
    }

    let nextStatus = status;
    if (isNeedOwnerApproval && status !== 'Approved by Owner') {
        nextStatus = 'Menunggu Approval Owner';
    }

    db.query(
        "UPDATE marketing_orders_offline SET customer=?, alamat_pt=?, up_penagihan=?, cp_penagihan=?, email=?, items=?, subtotal=?, ppn_persen=?, jumlah_ppn=?, diskon=?, diskon_persen=?, grand_total=?, produk=?, qty=?, harga=?, deadline=?, status=?, jenis_pembayaran=?, status_produksi=?, lokasi_proses=?, catatan=?, approval_status=?, kategori_pelanggan=? WHERE id=? AND type='offline' AND branch='Tanaka'",
        [
            customer, alamat_pt, up_penagihan, cp_penagihan, email,
            itemsJson, subtotal || 0, ppn_persen || 0, jumlah_ppn || 0, diskon || 0, diskon_persen || 0, grand_total || (harga * qty),
            produk, qty, harga, parseDate(deadline), nextStatus, payment_type, 
            status_produksi, lokasi_proses, catatan, approval_status || 'Belum Disetujui', kategori_pelanggan || 'Pelanggan Baru', req.params.id
        ],
        (err) => {
            if (err) return res.status(500).json({ message: err.message });
            
            if (isNeedOwnerApproval && nextStatus === 'Menunggu Approval Owner') {
                db.query("SELECT id FROM approvals WHERE tipe='diskon_order' AND reference_id=? AND status='pending'", [req.params.id], (errApp, resApp) => {
                    if (!errApp && resApp.length === 0) {
                        const ket = `Pengajuan Diskon - Order Offline Tanaka | Customer: ${customer} | Item: ${diskonKeterangan.join(', ')}`;
                        db.query("INSERT INTO approvals (tipe, keterangan, nominal, diajukan_oleh, status, tanggal_pengajuan, reference_id) VALUES ('diskon_order', ?, ?, 'Marketing Offline Tanaka', 'pending', CURRENT_TIMESTAMP, ?)", [ket, grand_total || (harga * qty), req.params.id]);
                    }
                });
            }

            if (customer) {
                db.query("SELECT id FROM marketing_customers WHERE nama_customer = ? AND type = 'offline' AND branch = 'Tanaka'", [customer], (errCust, resCust) => {
                    if (!errCust && resCust.length === 0) {
                        db.query("INSERT INTO marketing_customers (nama_customer, alamat, no_hp, email, up_penagihan, type, branch) VALUES (?, ?, ?, ?, ?, 'offline', 'Tanaka')", 
                        [customer, alamat_pt || '', cp_penagihan || '', email || '', up_penagihan || '']);
                    }
                });
            }

            res.json({ message: "Order berhasil diupdate" });
        }
    );
};

exports.deleteOrder = (req, res) => {
    db.query("DELETE FROM marketing_orders_offline WHERE id=? AND type='offline' AND branch='Tanaka'", [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: err.message });
        res.json({ message: "Order berhasil dihapus" });
    });
};

exports.ajukanOrder = (req, res) => {
    const { id } = req.params;
    
    db.query("SELECT * FROM marketing_orders_offline WHERE id = ? AND type='offline' AND branch='Tanaka'", [id], (err, results) => {
        if (err) return res.status(500).json({ message: "Database error: " + err.message });
        if (results.length === 0) return res.status(404).json({ message: "Order tidak ditemukan" });
        
        const order = results[0];
        if (order.status !== 'Pending' && order.status !== 'New Order') {
            return res.status(400).json({ message: "Hanya Order dengan status 'Pending' atau 'New Order' yang bisa diajukan." });
        }

        const keterangan = `Pembuatan Invoice dari Order Offline Tanaka untuk ${order.customer} - Total: ${order.grand_total}`;
        const nominal = order.grand_total || (order.harga * order.qty);
        
        const sqlApproval = `INSERT INTO approvals (tipe, keterangan, nominal, diajukan_oleh, status, tanggal_pengajuan, reference_id) 
                             VALUES ('order_to_invoice', ?, ?, 'Marketing Offline Tanaka', 'pending', CURRENT_TIMESTAMP, ?)`;
                             
        db.query(sqlApproval, [keterangan, nominal, id], (errApprove) => {
            if (errApprove) return res.status(500).json({ message: "Gagal mengajukan: " + errApprove.message });
            
            db.query("UPDATE marketing_orders_offline SET status = 'Pending Finance' WHERE id = ?", [id], (errUpdate) => {
                if (errUpdate) return res.status(500).json({ message: "Berhasil diajukan tapi gagal update status." });
                res.json({ message: "Order berhasil diajukan ke Finance." });
            });
        });
    });
};

// ================= DISCOUNT APPROVAL =================
exports.requestDiscountApproval = (req, res) => {
    const { nama_produk, harga_satuan, diskon_item, harga_setelah_diskon, harga_spv, harga_jual } = req.body;

    if (!nama_produk) {
        return res.status(400).json({ message: "Nama produk harus diisi" });
    }

    if (harga_setelah_diskon >= harga_spv) {
        return res.status(400).json({ message: "Harga masih di atas Harga SPV. Tidak perlu approval." });
    }

    const keterangan = `Diskon Produk: ${nama_produk} | Harga Jual: Rp ${Number(harga_jual).toLocaleString('id-ID')} | Diskon: Rp ${Number(diskon_item).toLocaleString('id-ID')} | Harga Setelah Diskon: Rp ${Number(harga_setelah_diskon).toLocaleString('id-ID')} | Batas SPV: Rp ${Number(harga_spv).toLocaleString('id-ID')}`;
    const nominal = harga_setelah_diskon;

    const sqlApproval = `INSERT INTO approvals (tipe, keterangan, nominal, diajukan_oleh, status, tanggal_pengajuan) 
                         VALUES ('diskon_produk', ?, ?, 'Marketing Offline Tanaka', 'pending', CURRENT_TIMESTAMP)`;

    db.query(sqlApproval, [keterangan, nominal], (err, result) => {
        if (err) return res.status(500).json({ message: "Gagal mengajukan approval diskon: " + err.message });
        res.status(201).json({ 
            id: result.insertId, 
            message: `Approval diskon untuk "${nama_produk}" berhasil dikirim ke Owner.` 
        });
    });
};

exports.bulkCreateOrders = (req, res) => {
    const orders = req.body;
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
        'Tanaka'
    ]);

    const sql = "INSERT INTO marketing_orders_offline (customer, produk, qty, harga, deadline, status, jenis_pembayaran, status_produksi, lokasi_proses, catatan, type, branch) VALUES ?";
    db.query(sql, [values], (err, result) => {
        if (err) return res.status(500).json({ message: err.message });
        res.status(201).json({ message: `${result.affectedRows} Order berhasil diimport` });
    });
};

// ================= INVENTORY =================
exports.getInventory = (req, res) => {
    // Inventory view from stok table for branch Tanaka (case-insensitive)
    db.query("SELECT id, nama_brand, nama_barang, nama_barang as product_name, jumlah, jumlah as stock_qty, kategori, kode_rak, ukuran, cabang_id, minimum_stok, created_at FROM stok WHERE LOWER(cabang_id) = 'tanaka'", (err, results) => {
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
            SELECT DATE(created_at) as tanggal, SUM(grand_total) as pendapatan, COUNT(*) as jumlah_quotation
            FROM marketing_orders_offline
            WHERE type = 'offline' AND branch = 'Tanaka' ${dateFilter}
            GROUP BY DATE(created_at)
            ORDER BY tanggal DESC
        `,
        bulanan: `
            SELECT DATE_FORMAT(created_at, '%Y-%m') as bulan, SUM(grand_total) as pendapatan, COUNT(*) as jumlah_quotation
            FROM marketing_orders_offline
            WHERE type = 'offline' AND branch = 'Tanaka' ${dateFilter}
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY bulan DESC
        `,
        tahunan: `
            SELECT YEAR(created_at) as tahun, SUM(grand_total) as pendapatan, COUNT(*) as jumlah_quotation
            FROM marketing_orders_offline
            WHERE type = 'offline' AND branch = 'Tanaka'
            GROUP BY YEAR(created_at)
            ORDER BY tahun DESC
        `,
        dashboardSummary: `
            SELECT 
                (SELECT COUNT(*) FROM marketing_customers WHERE type='offline' AND branch='Tanaka') as total_customers,
                (SELECT COUNT(*) FROM marketing_orders_offline WHERE type='offline' AND branch='Tanaka' ${dateFilter}) as total_orders,
                (SELECT COUNT(*) FROM marketing_quotations WHERE type='offline' AND branch='Tanaka' AND status='pending' ${dateFilter}) as pending_quotations,
                (
                    SELECT SUM(grand_total) 
                    FROM marketing_orders_offline 
                    WHERE type = 'offline' AND branch = 'Tanaka' ${dateFilter}
                ) as range_revenue
        `,
        comparisons: `
            SELECT 
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN grand_total ELSE 0 END) as revenue_today,
                SUM(CASE WHEN DATE(created_at) = CURDATE() - INTERVAL 1 DAY THEN grand_total ELSE 0 END) as revenue_yesterday,
                SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) THEN grand_total ELSE 0 END) as revenue_this_month,
                SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) THEN grand_total ELSE 0 END) as revenue_last_month,
                SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) - 1 AND MONTH(created_at) = MONTH(CURDATE()) THEN grand_total ELSE 0 END) as revenue_thismonth_lastyear
            FROM marketing_orders_offline
            WHERE type = 'offline' AND branch = 'Tanaka'
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

// GET PROMO STOCK (Dead Stock >= 60 days) - identik dengan Marketing Offline Banua tapi cabang Tanaka
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
            AND LOWER(s.cabang_id) = 'tanaka'
            AND s.created_at <= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
            AND s.nama_barang NOT IN (
                SELECT DISTINCT produk
                FROM marketing_orders_offline
                WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
                  AND LOWER(branch) = 'tanaka'
            )
        ORDER BY hari_mengendap DESC
    `;
    db.query(sql, [], (err, results) => {
        if (err) {
            console.error("Error get promo stock:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
};
