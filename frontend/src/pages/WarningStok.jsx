import React, { useEffect, useState } from 'react';
import { getWarningStok } from '../api/gudangApi';
import { AlertTriangle, AlertCircle, CheckCircle, Search, UserCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const WarningStok = () => {
    const [warnings, setWarnings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchWarnings();
    }, []);

    const fetchWarnings = async () => {
        try {
            const res = await getWarningStok();
            if (res.data.status === 'success') {
                setWarnings(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat warning stok", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredWarnings = warnings.filter((item) => {
        const q = searchTerm.toLowerCase();
        return (
            (item.nama_barang || '').toLowerCase().includes(q) ||
            (item.cabang_id || '').toLowerCase().includes(q) ||
            (item.kategori || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* TOPBAR */}
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-4 z-50 shrink-0">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Cari nama barang, cabang, atau kategori..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100" onClick={() => setShowProfile(!showProfile)}>
                      <UserCircle size={32} className="text-gray-400 hover:text-red-600 transition-colors" />
                    </div>
                    {showProfile && (
                      <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                        <div className="p-4 bg-red-50/50">
                          <p className="text-sm font-black text-gray-900">Admin</p>
                          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-0.5">Gudang</p>
                        </div>
                      </div>
                    )}
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight flex items-center gap-3">
                                <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                                    <AlertTriangle className="text-[#990000]" size={20} />
                                </div>
                                Warning Stok
                            </h1>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Pantau dan kelola barang yang jumlah stoknya menipis atau habis</p>
                        </div>
                    </div>

                    <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>Perhatian!</strong> Daftar barang di bawah ini memiliki jumlah stok yang kurang dari atau sama dengan batas minimum stok yang telah ditentukan. Segera lakukan pengadaan ulang (restock) untuk menghindari kehabisan barang di gudang.
                        </p>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-4 font-semibold">Nama Barang</th>
                                        <th className="p-4 font-semibold">Kategori</th>
                                        <th className="p-4 font-semibold">Cabang</th>
                                        <th className="p-4 font-semibold text-center">Stok Saat Ini</th>
                                        <th className="p-4 font-semibold text-center">Batas Minimum</th>
                                        <th className="p-4 font-semibold text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={6} className="p-6 text-center text-gray-500">Memuat data...</td></tr>
                                    ) : filteredWarnings.length > 0 && filteredWarnings.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-yellow-50 transition-colors">
                                            <td className="p-4 font-bold text-gray-800">{item.nama_barang}</td>
                                            <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{item.kategori}</span></td>
                                            <td className="p-4 font-medium text-gray-600">{item.cabang_id}</td>
                                            <td className="p-4 text-center">
                                                <span className={`text-xl font-black ${item.jumlah === 0 ? 'text-red-600' : 'text-orange-500'}`}>
                                                    {item.jumlah}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-gray-500">{item.minimum_stok}</td>
                                            <td className="p-4 text-center">
                                                {item.jumlah === 0 ? (
                                                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-max mx-auto">
                                                        <AlertCircle size={14} /> HABIS TOTAL
                                                    </span>
                                                ) : (
                                                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center justify-center gap-1 w-max mx-auto">
                                                        <AlertTriangle size={14} /> HAMPIR HABIS
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {!loading && filteredWarnings.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                                                        <CheckCircle size={32} />
                                                    </div>
                                                    <p className="font-bold text-lg text-gray-700">Semua Stok Aman!</p>
                                                    <p className="text-sm">Tidak ada barang yang perlu di-restock saat ini.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WarningStok;
