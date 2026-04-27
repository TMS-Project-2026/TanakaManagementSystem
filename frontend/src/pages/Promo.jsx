import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { Gift, Plus, X, AlertTriangle, Trash2, Tag, AlertCircle } from 'lucide-react';

const Promo = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRekomendasiModal, setShowRekomendasiModal] = useState(false);

  // State untuk menampung inputan form
  const [formData, setFormData] = useState({
    produk: '',
    harga_awal: '',
    diskon: '',
    harga_promo: '',
    status: 'Aktif'
  });

  // Ambil data promo dari backend
  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:3000/api/promo');
      setPromos(res.data);
    } catch (err) {
      console.error("Gagal mengambil data promo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  // Fungsi untuk handle submit form
  const handleSimpan = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/promo', formData);
      setShowAddModal(false);
      setFormData({ produk: '', harga_awal: '', diskon: '', harga_promo: '', status: 'Aktif' });
      fetchPromos();
      alert("Promo berhasil ditambahkan!");
    } catch (err) {
      alert("Gagal menyimpan promo: " + (err.response?.data?.message || err.message));
    }
  };

  const handleHapus = async (id) => {
    if (window.confirm("Yakin ingin menghapus promo ini?")) {
      try {
        await axios.delete(`http://localhost:3000/api/promo/${id}`);
        fetchPromos();
      } catch (err) {
        alert("Gagal menghapus promo");
      }
    }
  };

  return (
    <div className="flex bg-[#f3f4f6] min-h-screen font-sans relative">
      <Sidebar />

      <main className="flex-1 flex flex-col pt-16 md:pt-0">
        <div className="p-4 sm:p-10">
          {/* HEADER HALAMAN */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                  <Tag className="text-[#990000]" size={20} />
                </div>
                Barang Promo (Mengendap)
              </h2>
              <p className="text-sm text-gray-500 mt-2 font-medium">Jual cepat barang yang sudah berada di gudang lebih dari 90 hari</p>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowRekomendasiModal(true)}
                className="flex-1 sm:flex-none bg-orange-50 text-orange-600 border border-orange-200 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors whitespace-nowrap"
              >
                <AlertCircle size={18} /> Cek Rekomendasi
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 sm:flex-none bg-[#990000] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-[#7a0000] hover:shadow-md transition-all whitespace-nowrap"
              >
                <Plus size={18} className="text-white" /> Buat Promo
              </button>
            </div>
          </div>

        {/* TABEL DATA */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-4 px-6">Produk</th>
                <th className="py-4 px-6">Harga Asli</th>
                <th className="py-4 px-6 text-center">Diskon</th>
                <th className="py-4 px-6">Harga Promo</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700 divide-y divide-gray-100">
              {promos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-gray-400 font-medium">
                    Belum ada data barang mengendap.
                  </td>
                </tr>
              ) : (
                promos.map((p) => (
                  <tr key={p.id} className="hover:bg-red-50/20 transition-colors">
                    <td className="py-4 px-6 font-semibold text-gray-900">{p.nama_produk}</td>
                    <td className="py-4 px-6 font-medium text-gray-600">Rp {Number(p.harga_awal).toLocaleString('id-ID')}</td>
                    <td className="py-4 px-6 text-center font-bold text-orange-600 bg-orange-50/30">{p.diskon_persen}%</td>
                    <td className="py-4 px-6 font-bold text-[#990000]">Rp {Number(p.harga_promo).toLocaleString('id-ID')}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider ${p.status === 'Aktif' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button onClick={() => handleHapus(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL POP-UP TAMBAH PROMO */}
        {showAddModal && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-xl animate-in zoom-in-95 duration-200 border border-gray-100 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Input Barang Mengendap</h2>
                  <p className="text-xs text-gray-500 mt-1">Lengkapi form di bawah ini untuk merilis promo.</p>
                </div>
                <button className="p-2 text-gray-400 hover:text-[#990000] hover:bg-red-50 rounded-xl transition-colors" onClick={() => setShowAddModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSimpan} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nama Produk</label>
                  <input type="text" required placeholder="Contoh: Kemeja PDH Ukuran S"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                    value={formData.produk} onChange={(e) => setFormData({ ...formData, produk: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Harga Asli (Rp)</label>
                  <input type="number" required placeholder="Contoh: 150000"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                    value={formData.harga_awal} onChange={(e) => setFormData({ ...formData, harga_awal: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Diskon (%)</label>
                    <input type="number" required placeholder="Contoh: 50"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                      value={formData.diskon} onChange={(e) => setFormData({ ...formData, diskon: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#990000] mb-1.5 block">Harga Promo (Rp)</label>
                    <input type="number" required placeholder="Contoh: 75000"
                      className="w-full p-3 bg-red-50 border border-red-100 rounded-xl text-sm font-semibold text-[#990000] focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all"
                      value={formData.harga_promo} onChange={(e) => setFormData({ ...formData, harga_promo: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Status Promo</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-[#990000] focus:ring-1 focus:ring-[#990000] outline-none transition-all cursor-pointer"
                    value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Draft">Draft (Belum Rilis)</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div className="pt-5 mt-2 border-t border-gray-100">
                  <button type="submit" className="w-full bg-[#990000] text-white py-3.5 rounded-xl font-bold tracking-wide shadow-sm hover:bg-[#7a0000] transition-colors">
                    SIMPAN PROMO
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
};

export default Promo;