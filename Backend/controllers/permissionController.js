const db = require('../config/db');

exports.getPermissions = async (req, res) => {
    try {
        const [permissions] = await db.promise().query("SELECT * FROM permissions ORDER BY role ASC, menu ASC");
        
        // Group by role
        const grouped = permissions.reduce((acc, curr) => {
            if (!acc[curr.role]) {
                acc[curr.role] = [];
            }
            acc[curr.role].push(curr);
            return acc;
        }, {});

        res.status(200).json({ status: "success", data: grouped });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updatePermission = async (req, res) => {
    try {
        const { role } = req.params;
        const permissionsArray = req.body.permissions; // array of objects { menu, can_read, can_create, can_update, can_delete }
        
        const promiseDb = db.promise();
        
        for (const p of permissionsArray) {
            // Check if permission exists
            const [existing] = await promiseDb.query("SELECT id FROM permissions WHERE role=? AND menu=?", [role, p.menu]);
            
            if (existing.length > 0) {
                // Update
                await promiseDb.query("UPDATE permissions SET can_read=?, can_create=?, can_update=?, can_delete=? WHERE role=? AND menu=?", 
                [p.can_read, p.can_create, p.can_update, p.can_delete, role, p.menu]);
            } else {
                // Insert
                await promiseDb.query("INSERT INTO permissions (role, menu, can_read, can_create, can_update, can_delete) VALUES (?, ?, ?, ?, ?, ?)", 
                [role, p.menu, p.can_read, p.can_create, p.can_update, p.can_delete]);
            }
        }

        await promiseDb.query("INSERT INTO activity_logs (user, aktivitas, ip_address, created_at) VALUES (?, ?, ?, NOW())", ['admin_it', `Memperbarui permission untuk role: ${role}`, req.ip]);

        res.status(200).json({ status: "success", message: "Permission berhasil diperbarui" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
