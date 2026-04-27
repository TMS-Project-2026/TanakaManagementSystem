// Bagian Table/List di SalesOffline.jsx
{
  sales.map((item) => (
    <tr key={item.id} className={`border-b ${item.sisa_hari < 5 ? 'bg-red-50' : ''}`}>
      <td className="p-4 font-bold">{item.customer_name}</td>
      <td className="p-4">{item.produk}</td>
      <td className="p-4">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">
          {item.jenis_pembayaran}
        </span>
      </td>
      <td className="p-4 font-medium text-red-600">
        {new Date(item.deadline_final).toLocaleDateString('id-ID')}
        <br />
        <span className="text-[10px] uppercase font-bold text-gray-500">
          ({item.sisa_hari} Hari Lagi)
        </span>
      </td>
      <td className="p-4">
        <select
          value={item.status_produksi}
          className="p-2 border rounded-lg text-sm bg-white shadow-sm"
        >
          <option>Beli Kain</option>
          <option>Proses Potong</option>
          <option>Proses Jahit</option>
          <option>Finishing</option>
          <option>Selesai</option>
        </select>
      </td>
      <td className="p-4">
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.lokasi_proses === 'Internal' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
          {item.lokasi_proses}
        </span>
      </td>
    </tr>
  ))
}