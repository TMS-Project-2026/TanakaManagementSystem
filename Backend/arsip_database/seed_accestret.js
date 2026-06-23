const db = require('./config/db');

const seedAccestret = async () => {
    try {
        console.log("Seeding data for Accestret...");

        // Insert Quotation Data
        const items1 = JSON.stringify([{rincian: "Cotton Combed 30s + DTF A3", ukuran: "L", qty: 50, satuan: "Pcs", harga_satuan: 75000}]);
        const items2 = JSON.stringify([{rincian: "Poloshirt Pique CVC + Bordir", ukuran: "M", qty: 24, satuan: "Pcs", harga_satuan: 110000}]);

        await db.promise().query(`
            INSERT INTO marketing_quotations 
            (no_quotation, cabang, tanggal_quotation, tanggal_berlaku, nama_pt, alamat_pt, cp_penagihan, items_detail, subtotal, grand_total_quo, status)
            VALUES 
            ('QUO/AC/2026/05/0001', 'Acestreet', '2026-05-20', '2026-06-20', 'BEM Universitas Terbuka', 'Jl. Merdeka No 1', '081234567890', ?, 3750000, 3750000, 'Draft'),
            ('QUO/AC/2026/05/0002', 'Acestreet', '2026-05-21', '2026-06-21', 'PT. Maju Mundur', 'Gedung Sudirman', '081987654321', ?, 2640000, 2640000, 'Sent')
        `, [items1, items2]);

        // Insert Order / SPK Data
        await db.promise().query(`
            INSERT INTO marketing_orders_offline 
            (customer, produk, qty, harga, deadline, status, type, branch, items, subtotal, grand_total)
            VALUES 
            ('BEM Universitas Terbuka', 'Kaos Custom', 50, 75000, '2026-06-10', 'Diproses Produksi', 'offline', 'Acestreet', ?, 3750000, 3750000),
            ('PT. Maju Mundur', 'Poloshirt Custom', 24, 110000, '2026-06-15', 'Pending', 'offline', 'Acestreet', ?, 2640000, 2640000)
        `, [items1, items2]);

        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAccestret();
