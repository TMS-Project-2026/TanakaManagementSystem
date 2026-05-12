const db = require('../config/db');

exports.getApprovals = async (req, res) => {
    try {
        const [approvals] = await db.promise().query(`
            SELECT a.*, 
                q.no_quotation, q.nama_pt AS quo_nama_pt, q.tanggal_quotation, 
                q.items_detail AS quo_items, q.file_uploads AS quo_files,
                q.customer_name AS quo_customer_name
            FROM approvals a
            LEFT JOIN marketing_quotations q ON a.tipe = 'quotation_to_invoice' AND a.reference_id = q.id
            ORDER BY a.tanggal_pengajuan DESC
        `);
        res.status(200).json({ status: "success", data: approvals });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPendingCount = async (req, res) => {
    try {
        const [results] = await db.promise().query("SELECT COUNT(*) as count FROM approvals WHERE status='pending'");
        res.status(200).json({ count: results[0].count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getApprovalDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const [appRows] = await db.promise().query("SELECT * FROM approvals WHERE id = ?", [id]);
        if (appRows.length === 0) return res.status(404).json({ message: "Approval tidak ditemukan" });
        
        const approval = appRows[0];
        let detailData = null;

        if (approval.tipe === 'order_to_invoice') {
            const [refRows] = await db.promise().query("SELECT * FROM marketing_orders_offline WHERE id = ?", [approval.reference_id]);
            detailData = refRows.length > 0 ? refRows[0] : null;
        } else if (approval.tipe === 'quotation_to_invoice') {
            if (approval.diajukan_oleh === 'Marketing Online') {
                const [refRows] = await db.promise().query("SELECT * FROM marketing_orders_online WHERE id = ?", [approval.reference_id]);
                detailData = refRows.length > 0 ? refRows[0] : null;
            } else if (approval.diajukan_oleh === 'Marketing Offline Banua') {
                const [refRows] = await db.promise().query("SELECT * FROM marketing_quotations WHERE id = ?", [approval.reference_id]);
                detailData = refRows.length > 0 ? refRows[0] : null;
            } else {
                const [refRows] = await db.promise().query("SELECT * FROM marketing_leads WHERE id = ?", [approval.reference_id]);
                detailData = refRows.length > 0 ? refRows[0] : null;
            }
        }

        res.status(200).json({ status: "success", data: { approval, detail: detailData } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, alasan_penolakan } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Status tidak valid" });
        }

        await db.promise().query("UPDATE approvals SET status=?, tanggal_keputusan=NOW() WHERE id=?", [status, id]);
        
        // Cek apakah ini approval quotation ke invoice
        const [appData] = await db.promise().query("SELECT * FROM approvals WHERE id=?", [id]);
        if (appData.length > 0 && appData[0].tipe === 'quotation_to_invoice') {
            const leadId = appData[0].reference_id;
            const diajukanOleh = appData[0].diajukan_oleh;
            
            if (status === 'rejected') {
                if (diajukanOleh === 'Marketing Offline Banua') {
                    await db.promise().query("UPDATE marketing_quotations SET status='Rejected', alasan_penolakan=? WHERE id=?", [alasan_penolakan || null, leadId]);
                    await db.promise().query("UPDATE marketing_orders_offline SET status='Rejected' WHERE id=(SELECT order_id FROM marketing_quotations WHERE id=?)", [leadId]);
                }
            } else if (status === 'approved') {
                if (leadId) {
                    if (diajukanOleh === 'Marketing Online') {
                        // Ambil data order online
                        const [leadData] = await db.promise().query("SELECT * FROM marketing_orders_online WHERE id=?", [leadId]);
                        if (leadData.length > 0) {
                            const order = leadData[0];
                            const no_invoice = `INV/${new Date().getFullYear()}/` + Math.floor(Math.random() * 10000);
                            const items = JSON.stringify([{
                                rincian: order.product_name,
                                qty: order.qty,
                                harga_satuan: (order.total_price / order.qty) || 0,
                                satuan: 'Pcs'
                            }]);
                            
                            await db.promise().query(`
                                INSERT INTO invoice (
                                    no_invoice, cabang, tanggal_transaksi, tanggal_terbit, tanggal_jatuh_tempo, 
                                    nama_pt, alamat_pt, up_penagihan, cp_penagihan, email,
                                    deskripsi, detail_pekerjaan, items, qty, harga_satuan, subtotal, 
                                    ppn_persen, jumlah_ppn, grand_total, keterangan, note, materai, ttd, 
                                    nama_accounting, penanggung_jawab, jabatan, status
                                )
                                VALUES (?, ?, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), ?, '', '', '', '', '', '', ?, 1, 0, ?, 0, 0, ?, '', '', 0, 0, '', '', '', 'Draft')
                            `, [no_invoice, 'Banua', order.customer_name, items, order.total_price, order.total_price]);
                            
                            await db.promise().query("UPDATE marketing_orders_online SET status='Invoice Created' WHERE id=?", [leadId]);
                        }
                    } else if (diajukanOleh === 'Marketing Offline Banua') {
                        // Ambil data quotation offline (new schema)
                        const [leadData] = await db.promise().query("SELECT * FROM marketing_quotations WHERE id=?", [leadId]);
                        if (leadData.length > 0) {
                            const q = leadData[0];
                            
                            // Generate Invoice Draft untuk semua tipe pembayaran (DP & Fullpayment)
                                const cabang = q.cabang || 'Banua';
                                const codes = { 'Tanaka': 'TRB', 'Banua': 'BML', 'Acestreet': 'AC' };
                                const branchCode = codes[cabang] || 'BML';
                                const year = new Date().getFullYear();
                                const month = String(new Date().getMonth() + 1).padStart(2, '0');
                                const [countRes] = await db.promise().query("SELECT COUNT(*) as total FROM invoice WHERE cabang = ?", [cabang]);
                                const nextNum = ((countRes[0].total || 0) + 1).toString().padStart(4, '0');
                                const no_invoice = `INV/${branchCode}/${year}/${month}/${nextNum}`;
                                
                                const items = q.items_detail || JSON.stringify([{
                                    rincian: q.product_name || '',
                                    qty: q.qty || 1,
                                    harga_satuan: q.price || 0,
                                    satuan: 'Pcs'
                                }]);
                                
                                const invoiceKeterangan = q.payment_type === 'DP' ? 'DP (Down Payment)' : 'Fullpayment';
                                
                                await db.promise().query(`
                                    INSERT INTO invoice (
                                        no_invoice, cabang, tanggal_transaksi, tanggal_terbit, tanggal_jatuh_tempo, 
                                        nama_pt, alamat_pt, up_penagihan, cp_penagihan, email,
                                        deskripsi, detail_pekerjaan, items, qty, harga_satuan, subtotal, 
                                        ppn_persen, jumlah_ppn, diskon, diskon_persen, grand_total, keterangan, note, 
                                        no_po_kontrak, deskripsi_pesanan, quotation_id,
                                        materai, ttd, nama_accounting, penanggung_jawab, jabatan, status
                                    )
                                    VALUES (?, ?, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), ?, ?, ?, ?, ?, '', '', ?, 1, 0, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?, 0, 0, '', '', '', 'Draft')
                                `, [
                                    no_invoice, cabang,
                                    q.nama_pt || q.customer_name || '', q.alamat_pt || '', q.up_penagihan || '', q.cp_penagihan || '', q.email_customer || '',
                                    items, q.subtotal || q.total || 0,
                                    q.ppn_persen || 0, q.jumlah_ppn || 0, q.diskon || 0, q.diskon_persen || 0, q.grand_total_quo || q.total || 0,
                                    invoiceKeterangan, q.payment_note || '', q.deskripsi_pesanan || '', leadId
                                ]);
                            
                            // Update status to 'Diproses Produksi'
                            await db.promise().query("UPDATE marketing_quotations SET status='Diproses Produksi' WHERE id=?", [leadId]);
                            if (q.order_id) {
                                await db.promise().query("UPDATE marketing_orders_offline SET status='Diproses Produksi' WHERE id=?", [q.order_id]);
                                
                                const [orderInfoRows] = await db.promise().query("SELECT deadline FROM marketing_orders_offline WHERE id=?", [q.order_id]);
                                const orderDeadline = orderInfoRows.length > 0 ? orderInfoRows[0].deadline : null;
                                
                                const qtyTotal = q.qty || 1;
                                const prodName = q.product_name || q.deskripsi_pesanan || 'Produk Custom';
                                const custName = q.nama_pt || q.customer_name || 'Customer';
                                
                                await db.promise().query(
                                    "INSERT IGNORE INTO produksi_order (kode_order, nama_customer, nama_produk, qty, deadline, prioritas, status) VALUES (?, ?, ?, ?, ?, 'normal', 'antre')",
                                    [q.no_quotation, custName, prodName, qtyTotal, orderDeadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)]
                                );
                            }
                        }
                    } else {
                    // Ambil data lead offline
                    const [leadData] = await db.promise().query("SELECT * FROM marketing_leads WHERE id=?", [leadId]);
                    if (leadData.length > 0) {
                        const lead = leadData[0];
                        // Insert ke tabel invoice
                        const no_invoice = `INV/${new Date().getFullYear()}/` + Math.floor(Math.random() * 10000);
                        const items = JSON.stringify([{
                            rincian: lead.produk,
                            qty: lead.qty,
                            harga_satuan: lead.harga_awal || 0,
                            satuan: 'Pcs'
                        }]);
                        const grandTotal = lead.harga_potongan || (lead.harga_awal * lead.qty);
                        
                        await db.promise().query(`
                            INSERT INTO invoice (
                                no_invoice, cabang, tanggal_transaksi, tanggal_terbit, tanggal_jatuh_tempo, 
                                nama_pt, alamat_pt, up_penagihan, cp_penagihan, email,
                                deskripsi, detail_pekerjaan, items, qty, harga_satuan, subtotal, 
                                ppn_persen, jumlah_ppn, grand_total, keterangan, note, materai, ttd, 
                                nama_accounting, penanggung_jawab, jabatan, status
                            )
                            VALUES (?, ?, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), ?, '', '', '', '', '', '', ?, 1, 0, ?, 0, 0, ?, '', '', 0, 0, '', '', '', 'Draft')
                        `, [no_invoice, lead.type === 'online' ? 'Banua' : 'Banua', lead.nama_customer, items, grandTotal, grandTotal]);
                        
                        // Update status lead
                        await db.promise().query("UPDATE marketing_leads SET status='Invoice Created' WHERE id=?", [leadId]);
                    }
                }
            }
        }
        } else if (appData.length > 0 && appData[0].tipe === 'order_to_invoice') {
            const orderId = appData[0].reference_id;
            if (orderId) {
                if (status === 'approved') {
                    const [orderData] = await db.promise().query("SELECT * FROM marketing_orders_offline WHERE id=?", [orderId]);
                    if (orderData.length > 0) {
                        const order = orderData[0];
                        const no_invoice = `INV/${new Date().getFullYear()}/` + Math.floor(Math.random() * 10000);
                        
                        await db.promise().query(`
                            INSERT INTO invoice (
                                no_invoice, cabang, tanggal_transaksi, tanggal_terbit, tanggal_jatuh_tempo, 
                                nama_pt, alamat_pt, up_penagihan, cp_penagihan, email,
                                deskripsi, detail_pekerjaan, items, qty, harga_satuan, subtotal, 
                                ppn_persen, jumlah_ppn, grand_total, keterangan, note, materai, ttd, 
                                nama_accounting, penanggung_jawab, jabatan, status
                            )
                            VALUES (?, ?, NOW(), NOW(), DATE_ADD(NOW(), INTERVAL 14 DAY), ?, ?, ?, ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, '', '', '', 'Draft')
                        `, [
                            no_invoice, order.branch || 'Banua', order.customer, order.alamat_pt || '', order.up_penagihan || '', order.cp_penagihan || '', order.email || '', 
                            order.items || '[]', order.qty || 1, order.harga || 0, order.subtotal || 0, 
                            order.ppn_persen || 0, order.jumlah_ppn || 0, order.grand_total || 0, order.catatan || '', order.catatan || ''
                        ]);
                        
                        await db.promise().query("UPDATE marketing_orders_offline SET status='Invoice Created' WHERE id=?", [orderId]);
                    }
                } else if (status === 'rejected') {
                    await db.promise().query("UPDATE marketing_orders_offline SET status='Rejected' WHERE id=?", [orderId]);
                }
            }
        }

        res.status(200).json({ status: "success", message: `Pengajuan berhasil di-${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteApproval = async (req, res) => {
    try {
        const { id } = req.params;
        await db.promise().query("DELETE FROM approvals WHERE id = ?", [id]);
        res.status(200).json({ status: "success", message: "Approval berhasil dihapus!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
