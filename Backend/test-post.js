const http = require('http');

const data = JSON.stringify({
    barang_id: 1,
    jumlah: 10,
    tanggal: '2026-06-04',
    supplier: 'Test Supplier'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/barang-masuk',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    let responseData = '';
    res.on('data', chunk => responseData += chunk);
    res.on('end', () => console.log('Status Code:', res.statusCode, 'Response:', responseData));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
