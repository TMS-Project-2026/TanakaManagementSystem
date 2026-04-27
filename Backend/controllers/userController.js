const db = require('../config/db');

exports.getUsers = async (req, res) => {
    try {
        const [users] = await db.promise().query(
            "SELECT id_user as id, nama_lengkap as nama, username, role, status, created_at FROM users ORDER BY created_at DESC"
        );

        res.status(200).json({
            status: "success",
            data: users
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { nama, username, password, role, status } = req.body;

        const sql = `
            INSERT INTO users 
            (nama_lengkap, username, password, role, status, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;

        await db.promise().query(sql, [
            nama,
            username,
            password,
            role,
            status || 'aktif'
        ]);

        await db.promise().query(
            "INSERT INTO activity_logs (username, aktivitas, ip_address, created_at) VALUES (?, ?, ?, NOW())",
            ['admin_it', `Menambah user baru: ${username}`, req.ip]
        );

        res.status(201).json({
            status: "success",
            message: "User berhasil ditambahkan"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, username, password, role, status } = req.body;

        let sql =
            "UPDATE users SET nama_lengkap=?, username=?, role=?, status=? WHERE id_user=?";

        let params = [nama, username, role, status, id];

        if (password) {
            sql =
                "UPDATE users SET nama_lengkap=?, username=?, password=?, role=?, status=? WHERE id_user=?";

            params = [nama, username, password, role, status, id];
        }

        await db.promise().query(sql, params);

        await db.promise().query(
            "INSERT INTO activity_logs (username, aktivitas, ip_address, created_at) VALUES (?, ?, ?, NOW())",
            ['admin_it', `Memperbarui user: ${username}`, req.ip]
        );

        res.status(200).json({
            status: "success",
            message: "User berhasil diperbarui"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        await db.promise().query(
            "DELETE FROM users WHERE id_user=?",
            [id]
        );

        await db.promise().query(
            "INSERT INTO activity_logs (username, aktivitas, ip_address, created_at) VALUES (?, ?, ?, NOW())",
            ['admin_it', `Menghapus user ID: ${id}`, req.ip]
        );

        res.status(200).json({
            status: "success",
            message: "User berhasil dihapus"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};