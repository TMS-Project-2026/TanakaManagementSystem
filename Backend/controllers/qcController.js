const db = require('../config/db');

exports.getQc = async (req, res) => {
    try {
        const [orders] = await db.promise().query("SELECT * FROM produksi_order WHERE status = 'qc' OR status = 'jahit' ORDER BY deadline ASC");
        const [qcHistory] = await db.promise().query("SELECT * FROM produksi_qc ORDER BY created_at DESC");
        
        res.status(200).json({ 
            status: "success", 
            data: { orders, history: qcHistory } 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.submitQc = async (req, res) => {
    try {
        const { id } = req.params; // order_id
        const { status_qc, catatan, updated_by } = req.body;

        await db.promise().query("INSERT INTO produksi_qc (order_id, status_qc, catatan) VALUES (?, ?, ?)", [id, status_qc, catatan]);
        
        let newStatus = status_qc === 'lolos' ? 'packing' : 'jahit';
        let progress = status_qc === 'lolos' ? 80 : 50;

        await db.promise().query("UPDATE produksi_order SET status=?, progress=? WHERE id=?", [newStatus, progress, id]);
        await db.promise().query("INSERT INTO produksi_history (order_id, status, updated_by) VALUES (?, ?, ?)", [id, newStatus, updated_by || 'System']);

        res.status(201).json({ status: "success", message: `QC berhasil disubmit: ${status_qc}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
