const fs = require('fs');

const filesToUpdate = [
    'frontend/src/pages/MarketingOfflineTanaka.jsx',
    'frontend/src/pages/MarketingOfflineBanua.jsx'
];

filesToUpdate.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    content = content.replace(/>Nama Akun</g, ">Kategori Produk<");
    content = content.replace(/'Pencapaian Target Akun'/g, "'Pencapaian Target Kategori'");
    content = content.replace(/'Perbandingan Performa Akun'/g, "'Perbandingan Performa Kategori'");
    content = content.replace(/Cari akun\.\.\./g, "Cari kategori...");

    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
});
