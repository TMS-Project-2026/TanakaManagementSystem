const db = require('../config/db');
const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
    const { username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username = ?";
    db.query(sql, [username], (err, results) => {
        if (err) return res.status(500).json({ message: "Error di server database" });
        if (results.length === 0) return res.status(404).json({ message: "Akun tidak ditemukan!" });

        const user = results[0];
        
        // Cek status aktif
        if (user.status && user.status === 'nonaktif') {
            return res.status(403).json({ message: "Akun Anda dinonaktifkan!" });
        }
        
        // Pengecekan password sementara tanpa bcrypt (bisa diupgrade nanti)
        if (password !== user.password) {
            return res.status(401).json({ message: "Password salah!" });
        }

        // Buat Token
        const token = jwt.sign(
            { id_user: user.id_user, role: user.role, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: "Login Berhasil!",
            token: token,
            user: { id_user: user.id_user, username: user.username, role: user.role, nama_lengkap: user.nama_lengkap }
        });
    });
};