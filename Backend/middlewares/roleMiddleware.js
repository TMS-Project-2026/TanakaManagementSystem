exports.checkRole = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.user?.role?.toLowerCase();
        const normalizedRoles = allowedRoles.map(r => r.toLowerCase());
        
        if (!userRole || !normalizedRoles.includes(userRole)) {
            return res.status(403).json({ 
                message: `Akses Ditolak! Jabatan ${req.user?.role || 'Tidak Diketahui'} tidak berhak masuk ke menu ini.` 
            });
        }
        next();
    };
};