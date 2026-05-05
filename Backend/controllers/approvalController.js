const db = require('../config/db');

exports.getApprovals = async (req, res) => {
    try {
        const [approvals] = await db.promise().query("SELECT * FROM approvals ORDER BY tanggal_pengajuan DESC");
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

exports.updateApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'approved' or 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Status tidak valid" });
        }

        await db.promise().query("UPDATE approvals SET status=?, tanggal_keputusan=NOW() WHERE id=?", [status, id]);
        
        // Cek apakah ini approval quotation ke invoice dan statusnya approved
        const [appData] = await db.promise().query("SELECT * FROM approvals WHERE id=?", [id]);
        if (appData.length > 0 && appData[0].tipe === 'quotation_to_invoice' && status === 'approved') {
            const leadId = appData[0].reference_id;
            const diajukanOleh = appData[0].diajukan_oleh;
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
                    // Ambil data quotation offline
                    const [leadData] = await db.promise().query("SELECT * FROM marketing_quotations WHERE id=? AND type='offline' AND branch='Banua'", [leadId]);
                    if (leadData.length > 0) {
                        const q = leadData[0];
                        const no_invoice = `INV/${new Date().getFullYear()}/` + Math.floor(Math.random() * 10000);
                        const items = JSON.stringify([{
                            rincian: q.product_name,
                            qty: q.qty,
                            harga_satuan: q.price || 0,
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
                        `, [no_invoice, 'Banua', q.customer_name, items, q.total, q.total]);
                        
                        await db.promise().query("UPDATE marketing_quotations SET status='approved' WHERE id=?", [leadId]);
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

        res.status(200).json({ status: "success", message: `Pengajuan berhasil di-${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
