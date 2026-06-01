const db = require('../config/db');

exports.getAll = async (req, res) => {
    try {
        const [rows] = await db.promise().query("SELECT * FROM hutang ORDER BY jatuh_tempo ASC");
        res.status(200).json({ status: "success", data: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { no_ref, supplier, invoice_id, cabang, nominal, jatuh_tempo, keterangan } = req.body;
        const sisa = nominal;
        const q = `INSERT INTO hutang (no_ref, supplier, invoice_id, cabang, nominal, terbayar, sisa, jatuh_tempo, status, keterangan) 
                   VALUES (?, ?, ?, ?, ?, 0, ?, ?, 'Unpaid', ?)`;
        await db.promise().query(q, [no_ref, supplier, invoice_id || null, cabang, nominal, sisa, jatuh_tempo, keterangan]);
        res.status(201).json({ status: "success", message: "Hutang created" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.pay = async (req, res) => {
    try {
        const { id } = req.params;
        const { nominal_bayar } = req.body;
        const [rows] = await db.promise().query("SELECT * FROM hutang WHERE id=?", [id]);
        if(!rows.length) return res.status(404).json({ message: "Not found" });
        
        const p = rows[0];
        const terbayar = Number(p.terbayar) + Number(nominal_bayar);
        const sisa = Number(p.nominal) - terbayar;
        const status = sisa <= 0 ? 'Paid' : 'Unpaid';
        
        await db.promise().query("UPDATE hutang SET terbayar=?, sisa=?, status=? WHERE id=?", [terbayar, sisa, status, id]);
        res.status(200).json({ status: "success", message: "Pembayaran dicatat" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.void = async (req, res) => {
    try {
        const { id } = req.params;
        await db.promise().query("UPDATE hutang SET status='Void' WHERE id=?", [id]);
        res.status(200).json({ status: "success", message: "Hutang divoid" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
