const db = require('../config/db');

// Ambil semua notifikasi pending berdasarkan role
exports.getNotifications = async (req, res) => {
    try {
        const promiseDb = db.promise();

        // 1. Approval quotation/invoice pending (untuk Finance & Owner)
        const [approvals] = await promiseDb.query(`
            SELECT 
                a.id, a.tipe, a.diajukan_oleh, a.nominal, a.tanggal_pengajuan, a.status, a.reference_id,
                COALESCE(q.no_quotation, CONCAT('#', a.reference_id)) as referensi,
                COALESCE(q.nama_pt, q.customer_name, '-') as nama_customer
            FROM approvals a
            LEFT JOIN marketing_quotations q ON a.tipe = 'quotation_to_invoice' AND a.reference_id = q.id
            WHERE a.status = 'pending'
            ORDER BY a.tanggal_pengajuan DESC
            LIMIT 20
        `);

        // 1.b Approval yang sudah diproses (approved/rejected)
        const [resolvedApprovals] = await promiseDb.query(`
            SELECT 
                a.id, a.tipe, a.diajukan_oleh, a.nominal, a.tanggal_pengajuan, a.status, a.reference_id,
                COALESCE(q.no_quotation, CONCAT('#', a.reference_id)) as referensi,
                COALESCE(q.nama_pt, q.customer_name, '-') as nama_customer
            FROM approvals a
            LEFT JOIN marketing_quotations q ON a.tipe = 'quotation_to_invoice' AND a.reference_id = q.id
            WHERE a.status IN ('approved', 'rejected')
            ORDER BY a.id DESC
            LIMIT 10
        `);

        // 2. Permintaan stok pending (untuk Gudang & Owner)
        const [permintaanStok] = await promiseDb.query(`
            SELECT 
                p.id, p.nama_pengambil, p.divisi, p.jumlah, p.tanggal_request, p.status, p.keterangan,
                s.nama_barang, s.nama_brand, s.ukuran
            FROM permintaan_stok p
            JOIN stok s ON p.stok_id = s.id
            WHERE p.status = 'pending'
            ORDER BY p.tanggal_request DESC
            LIMIT 20
        `);

        // 2.b Permintaan stok yang sudah diproses
        const [resolvedPermintaan] = await promiseDb.query(`
            SELECT 
                p.id, p.nama_pengambil, p.divisi, p.jumlah, p.tanggal_request, p.status, p.keterangan,
                s.nama_barang, s.nama_brand, s.ukuran
            FROM permintaan_stok p
            JOIN stok s ON p.stok_id = s.id
            WHERE p.status IN ('approved', 'rejected', 'selesai', 'Selesai')
            ORDER BY p.id DESC
            LIMIT 10
        `);

        // 3. Invoice overdue (untuk Finance & Owner)
        const [overdueInvoice] = await promiseDb.query(`
            SELECT id, no_invoice, nama_pt, grand_total, tanggal_jatuh_tempo, status
            FROM invoice
            WHERE (status != 'Lunas' AND tanggal_jatuh_tempo < CURDATE())
            ORDER BY tanggal_jatuh_tempo ASC
            LIMIT 10
        `);

        // 4. Warning stok rendah (untuk Gudang & Owner)
        const [lowStok] = await promiseDb.query(`
            SELECT id, nama_barang, nama_brand, jumlah, minimum_stok, cabang_id
            FROM stok
            WHERE jumlah <= minimum_stok
            ORDER BY jumlah ASC
            LIMIT 10
        `);

        // 5. Order marketing offline baru yang perlu ditindak (untuk Marketing Offline/Online)
        const [newOrders] = await promiseDb.query(`
            SELECT id, customer, branch, status, created_at, grand_total
            FROM marketing_orders_offline
            WHERE status IN ('Pending', 'New Order')
            ORDER BY created_at DESC
            LIMIT 10
        `).catch(() => [[]]);

        // 6. Invoice baru dibuat oleh Finance (untuk Marketing)
        const [newInvoices] = await promiseDb.query(`
            SELECT id, no_invoice, nama_pt, tanggal_terbit, status
            FROM invoice
            WHERE status IN ('Draft', 'Terbit') AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            ORDER BY created_at DESC
            LIMIT 10
        `).catch(() => [[]]);

        res.status(200).json({
            status: 'success',
            data: {
                approvals,
                resolvedApprovals,
                permintaanStok,
                resolvedPermintaan,
                overdueInvoice,
                lowStok,
                newOrders,
                newInvoices,
                counts: {
                    approvals: approvals.length,
                    resolvedApprovals: resolvedApprovals.length,
                    permintaanStok: permintaanStok.length,
                    resolvedPermintaan: resolvedPermintaan.length,
                    overdueInvoice: overdueInvoice.length,
                    lowStok: lowStok.length,
                    newOrders: newOrders.length,
                    newInvoices: newInvoices.length,
                    total: approvals.length + permintaanStok.length
                }
            }
        });
    } catch (error) {
        console.error('Notification Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Ringkasan count notifikasi per kategori
exports.getNotificationCount = async (req, res) => {
    try {
        const promiseDb = db.promise();

        const [[{ approvals }]] = await promiseDb.query("SELECT COUNT(*) as approvals FROM approvals WHERE status='pending'");
        const [[{ permintaan }]] = await promiseDb.query("SELECT COUNT(*) as permintaan FROM permintaan_stok WHERE status='pending'");
        const [[{ overdue }]] = await promiseDb.query("SELECT COUNT(*) as overdue FROM invoice WHERE status != 'Lunas' AND tanggal_jatuh_tempo < CURDATE()");
        const [[{ lowstok }]] = await promiseDb.query("SELECT COUNT(*) as lowstok FROM stok WHERE jumlah <= minimum_stok");

        res.status(200).json({
            status: 'success',
            data: {
                approvals: Number(approvals),
                permintaan: Number(permintaan),
                overdue: Number(overdue),
                lowstok: Number(lowstok),
                total: Number(approvals) + Number(permintaan)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
