const db = require('../config/db');

exports.getApprovals = async (req, res) => {
    try {
        const [approvals] = await db.promise().query("SELECT * FROM approvals ORDER BY tanggal_pengajuan DESC");
        res.status(200).json({ status: "success", data: approvals });
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
        res.status(200).json({ status: "success", message: `Pengajuan berhasil di-${status}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
