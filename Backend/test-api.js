const http = require('http');
console.log('Sending request...');
http.get('http://localhost:3000/api/barang-masuk', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Status Code:', res.statusCode, 'Response:', data));
}).on('error', (err) => console.log('Error:', err.message));
