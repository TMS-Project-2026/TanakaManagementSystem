exports.checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Akses Ditolak! Jabatan ${req.user.role} tidak berhak masuk ke menu ini.` 
            });
        }
        next();
    };
};