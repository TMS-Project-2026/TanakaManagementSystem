import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Search, Bell, User, Calendar, Plus } from 'lucide-react';

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nama_pelanggan: '',
    total_item: '',
    deadline: ''
  });

  // 🔥 FETCH DATA
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/po', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrders(res.data.data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // 🔥 CREATE
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      await axios.post('http://localhost:3000/api/po', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Berhasil!");
      setIsModalOpen(false);
      fetchOrders();

      setFormData({
        nama_pelanggan: '',
        total_item: '',
        deadline: ''
      });

    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  // 🔥 UPDATE STATUS
  const handleUpdateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');

      await axios.put(
        `http://localhost:3000/api/po/${id}/status`,
        { status_produksi: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchOrders();
    } catch (err) {
      alert("Gagal update status");
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />

      <main className="flex-1 p-8">

        {/* HEADER */}
        <header className="flex justify-between mb-10">
          <input placeholder="Search..." className="border p-2 rounded-full w-80" />

          <div className="flex gap-4 items-center">
            <Calendar size={16} />
            <Bell />
            <User />
          </div>
        </header>

        {/* TITLE */}
        <div className="flex justify-between mb-4">
          <h2>Purchase Order</h2>

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-red-800 text-white px-4 py-2 rounded flex gap-2"
          >
            <Plus size={16} /> Tambah
          </button>
        </div>

        {/* TABLE */}
        <table className="w-full bg-white rounded-xl overflow-hidden">
          <thead className="bg-red-800 text-white">
            <tr>
              <th>Nama</th>
              <th>Total</th>
              <th>Status</th>
              <th>Deadline</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr><td colSpan={4}>Loading...</td></tr>
            ) : orders.map((item) => (
              <tr key={item.id_po} className="border-b">

                <td>{item.nama_pelanggan}</td>

                <td>{item.total_item} pcs</td>

                {/* 🔥 STATUS DROPDOWN */}
                <td>
                  <select
                    value={item.status_produksi}
                    onChange={(e) =>
                      handleUpdateStatus(item.id_po, e.target.value)
                    }
                    className="border p-1 rounded"
                  >
                    <option value="Antre">Antre</option>
                    <option value="Penjahit">Penjahit</option>
                    <option value="Packing">Packing</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </td>

                <td>
                  {new Date(item.deadline).toLocaleDateString()}
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {/* MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl w-96">

              <form onSubmit={handleSubmit} className="space-y-3">

                <input
                  placeholder="Nama"
                  value={formData.nama_pelanggan}
                  onChange={(e) =>
                    setFormData({ ...formData, nama_pelanggan: e.target.value })
                  }
                  className="border p-2 w-full"
                />

                <input
                  type="number"
                  placeholder="Total"
                  value={formData.total_item}
                  onChange={(e) =>
                    setFormData({ ...formData, total_item: e.target.value })
                  }
                  className="border p-2 w-full"
                />

                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className="border p-2 w-full"
                />

                <button className="bg-red-800 text-white w-full p-2 rounded">
                  Simpan
                </button>

              </form>

            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Order;