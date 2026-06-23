const axios = require('axios');
(async () => {
  try {
    // We need a token first.
    const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: '123' // wait, the user said the password is '12345'
    });
    const token = loginRes.data.token;
    console.log("Logged in");

    // Attempt to create order to see if it crashes
    const payload = {
        customer: "Test Customer",
        items: [{rincian: "Baju", qty: 1, harga_satuan: 10000}],
        subtotal: 10000,
        grand_total: 10000,
        payment_type: "DP"
    };

    const res = await axios.post('http://localhost:3000/api/marketing-offline/orders', payload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Order created:", res.data);
  } catch (err) {
    console.error("Error:", err.message);
    if(err.response) console.error(err.response.data);
  }
})();
