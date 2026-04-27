const db = require('../config/db');

exports.getDashboard = async (req, res) => {
    try {
        const promiseDb = db.promise();
        const [ordersMasukHariIni] = await promiseDb.query("SELECT COUNT(*) as total FROM produksi_order WHERE DATE(created_at) = CURDATE()");
        const [antre] = await promiseDb.query("SELECT COUNT(*) as total FROM produksi_order WHERE status = 'antre'");
        const [diproses] = await promiseDb.query("SELECT COUNT(*) as total FROM produksi_order WHERE status IN ('diproses', 'jahit', 'qc')");
        const [selesaiHariIni] = await promiseDb.query("SELECT COUNT(*) as total FROM produksi_order WHERE status = 'selesai' AND DATE(created_at) = CURDATE()"); // better query based on history if exact, but simple enough for now
        const [telatDeadline] = await promiseDb.query("SELECT COUNT(*) as total FROM produksi_order WHERE deadline < CURDATE() AND status != 'selesai'");
        const [packing] = await promiseDb.query("SELECT COUNT(*) as total FROM produksi_order WHERE status = 'packing'");

        const [weekly] = await promiseDb.query("SELECT DATE(created_at) as label, COUNT(*) as total FROM produksi_order GROUP BY DATE(created_at) ORDER BY DATE(created_at) DESC LIMIT 7");
        const [statusData] = await promiseDb.query("SELECT status as label, COUNT(*) as total FROM produksi_order GROUP BY status");
        
        const [deadlineDekat] = await promiseDb.query("SELECT * FROM produksi_order WHERE status != 'selesai' ORDER BY deadline ASC LIMIT 5");
        const [urgentOrders] = await promiseDb.query("SELECT * FROM produksi_order WHERE prioritas = 'urgent' AND status != 'selesai' ORDER BY deadline ASC LIMIT 5");

        res.status(200).json({
            status: "success",
            data: {
                totalMasukHariIni: ordersMasukHariIni[0].total,
                antre: antre[0].total,
                sedangDiproses: diproses[0].total,
                selesaiHariIni: selesaiHariIni[0].total,
                telatDeadline: telatDeadline[0].total,
                totalPacking: packing[0].total,
                chartWeekly: weekly.reverse(),
                chartStatus: statusData,
                deadlineDekat,
                urgentOrders
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const [orders] = await db.promise().query("SELECT * FROM produksi_order ORDER BY created_at DESC");
        res.status(200).json({ status: "success", data: orders });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const { kode_order, nama_customer, nama_produk, qty, deadline, prioritas } = req.body;
        const [result] = await db.promise().query(
            "INSERT INTO produksi_order (kode_order, nama_customer, nama_produk, qty, deadline, prioritas) VALUES (?, ?, ?, ?, ?, ?)",
            [kode_order, nama_customer, nama_produk, qty, deadline, prioritas || 'normal']
        );
        res.status(201).json({ status: "success", message: "Order produksi ditambahkan", id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_customer, nama_produk, qty, deadline, prioritas } = req.body;
        await db.promise().query(
            "UPDATE produksi_order SET nama_customer=?, nama_produk=?, qty=?, deadline=?, prioritas=? WHERE id=?",
            [nama_customer, nama_produk, qty, deadline, prioritas, id]
        );
        res.status(200).json({ status: "success", message: "Order berhasil diupdate" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, progress, updated_by } = req.body;
        
        await db.promise().query("UPDATE produksi_order SET status=?, progress=? WHERE id=?", [status, progress, id]);
        await db.promise().query("INSERT INTO produksi_history (order_id, status, updated_by) VALUES (?, ?, ?)", [id, status, updated_by || 'System']);
        
        res.status(200).json({ status: "success", message: "Status produksi diperbarui" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTim = async (req, res) => {
    try {
        const [tim] = await db.promise().query("SELECT a.*, o.kode_order, o.nama_produk, o.status FROM produksi_assign a JOIN produksi_order o ON a.order_id = o.id ORDER BY a.target_selesai ASC");
        res.status(200).json({ status: "success", data: tim });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.assignTim = async (req, res) => {
    try {
        const { order_id, nama_tim, target_selesai } = req.body;
        await db.promise().query("INSERT INTO produksi_assign (order_id, nama_tim, target_selesai) VALUES (?, ?, ?)", [order_id, nama_tim, target_selesai]);
        res.status(201).json({ status: "success", message: "Tim berhasil di-assign" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPacking = async (req, res) => {
    try {
        const [packing] = await db.promise().query("SELECT * FROM produksi_order WHERE status IN ('packing', 'selesai') ORDER BY deadline ASC");
        res.status(200).json({ status: "success", data: packing });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updatePacking = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, updated_by } = req.body; // status = 'selesai'
        await db.promise().query("UPDATE produksi_order SET status=?, progress=100 WHERE id=?", [status, id]);
        await db.promise().query("INSERT INTO produksi_history (order_id, status, updated_by) VALUES (?, ?, ?)", [id, status, updated_by || 'System']);
        res.status(200).json({ status: "success", message: "Packing selesai" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDeadline = async (req, res) => {
    try {
        const [deadlines] = await db.promise().query("SELECT * FROM produksi_order WHERE status != 'selesai' ORDER BY deadline ASC");
        res.status(200).json({ status: "success", data: deadlines });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const [history] = await db.promise().query("SELECT h.*, o.kode_order, o.nama_produk FROM produksi_history h JOIN produksi_order o ON h.order_id = o.id ORDER BY h.created_at DESC");
        res.status(200).json({ status: "success", data: history });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
