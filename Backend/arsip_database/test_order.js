(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/marketing-offline/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: 'Test',
        ppn_persen: ''
      })
    });
    const data = await res.json();
    console.log(data);
  } catch(e) {
    console.error(e);
  }
})();
