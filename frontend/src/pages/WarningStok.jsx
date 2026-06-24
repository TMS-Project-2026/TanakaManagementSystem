import React, { useEffect, useState } from 'react';
import { getWarningStok } from '../api/gudangApi';
import { AlertTriangle, AlertCircle, CheckCircle, Search, UserCircle, Package } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const WarningStok = () => {
    const [warnings, setWarnings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const userRole = (JSON.parse(localStorage.getItem('user')) || {}).role || '';
    const user = JSON.parse(localStorage.getItem('user')) || {};

    useEffect(() => {
        fetchWarnings();
    }, []);

    const fetchWarnings = async () => {
        try {
            const res = await getWarningStok();
            if (res.data.status === 'success') {
                let data = res.data.data;
                if (userRole === 'gudang_accestret') {
                    data = data.filter(d => ['Accestret', 'Acestreet'].includes(d.cabang_id));
                }
                // Hanya tampilkan yang pernah punya stok (jumlah pernah > 0 = minimum_stok > 0)
                // Sembunyikan yang memang belum pernah ada barang masuk (jumlah=0 AND minimum_stok=5 default)
                setWarnings(data);
            }
        } catch (error) {
            console.error("Gagal memuat warning stok", error);
        } finally {
            setLoading(false);
        }
    };

    const q = searchTerm.toLowerCase();
    const filteredWarnings = warnings.filter(item =>
        (item.nama_barang || '').toLowerCase().includes(q) ||
        (item.kode_produk || '').toLowerCase().includes(q) ||
        (item.bahan || '').toLowerCase().includes(q) ||
        (item.cabang_id || '').toLowerCase().includes(q) ||
        (item.kategori || '').toLowerCase().includes(q)
    );

    // Pisah: benar-benar habis vs menipis
    const habisTotal = filteredWarnings.filter(i => Number(i.jumlah) === 0);
    const hampirHabis = filteredWarnings.filter(i => Number(i.jumlah) > 0);

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* TOPBAR */}
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-4 z-50 shrink-0">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" placeholder="Cari kode, nama, bahan, cabang..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all" />
                    </div>
                    <div className="relative">
                        <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md border border-gray-100" onClick={() => setShowProfile(p => !p)}>
                            <UserCircle size={32} className="text-gray-400 hover:text-red-600 transition-colors" />
                        </div>
                        {showProfile && (
                            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                <div className="p-4 bg-red-50/50">
                                    <p className="text-sm font-black text-gray-900">{user.nama || 'Admin'}</p>
                                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-0.5">
                                        {userRole === 'gudang_accestret' ? 'Gudang Accestret' : 'Gudang'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">

                        {/* PAGE HEADER */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                                        <AlertTriangle className="text-[#990000]" size={20} />
                                    </div>
                                    Warning Stok
                                </h1>
                                <p className="text-sm text-gray-500 mt-1 font-medium">
                                    {filteredWarnings.length} item stok menipis atau habis
                                </p>
                            </div>
                            {/* SUMMARY BADGES */}
                            <div className="flex gap-3">
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-bold">
                                    <AlertCircle size={16} /> {habisTotal.length} Habis Total
                                </div>
                                <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-xl text-sm font-bold">
                                    <AlertTriangle size={16} /> {hampirHabis.length} Hampir Habis
                                </div>
                            </div>
                        </div>

                        {/* BANNER INFO */}
                        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-xl">
                            <p className="text-sm text-yellow-800">
                                <strong>Perhatian!</strong> Barang berikut memiliki stok yang kurang dari atau sama dengan batas minimum.
                                Segera lakukan <strong>restock</strong> melalui menu <em>Barang Masuk</em>.
                            </p>
                        </div>

                        {/* TABLE */}
                        {loading ? (
                            <div className="text-center py-16 text-gray-400 font-medium">Memuat data...</div>
                        ) : filteredWarnings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
                                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircle size={40} />
                                </div>
                                <p className="font-bold text-xl text-gray-700">Semua Stok Aman!</p>
                                <p className="text-sm">Tidak ada barang yang perlu di-restock saat ini.</p>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead className="bg-gray-900 text-white text-[11px] uppercase tracking-wider sticky top-0 z-10">
                                            <tr>
                                                <th className="px-3 py-3 border-r border-gray-700">KODE</th>
                                                <th className="px-3 py-3 border-r border-gray-700">JENIS</th>
                                                <th className="px-3 py-3 border-r border-gray-700">NAMA PRODUK</th>
                                                <th className="px-3 py-3 border-r border-gray-700">BAHAN</th>
                                                <th className="px-3 py-3 border-r border-gray-700">CABANG</th>
                                                <th className="px-3 py-3 text-center border-r border-gray-700">STOK SAAT INI</th>
                                                <th className="px-3 py-3 text-center border-r border-gray-700">BATAS MIN</th>
                                                <th className="px-3 py-3 text-center">STATUS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredWarnings.map((item, idx) => {
                                                const isHabis = Number(item.jumlah) === 0;
                                                return (
                                                    <tr key={item.id} className={`border-b border-gray-100 transition-colors ${isHabis ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-orange-50/30'} ${idx % 2 === 0 && !isHabis ? 'bg-white' : ''}`}>
                                                        <td className="px-3 py-2.5 font-bold text-[#990000] border-r border-gray-100 whitespace-nowrap">
                                                            {item.kode_produk || '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 border-r border-gray-100">
                                                            <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                                                                {item.kategori || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 font-semibold text-gray-800 border-r border-gray-100 whitespace-nowrap">
                                                            {item.nama_barang}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-gray-500 border-r border-gray-100">
                                                            {item.bahan || '-'}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-gray-600 border-r border-gray-100">
                                                            {item.cabang_id}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center border-r border-gray-100">
                                                            <span className={`text-xl font-black ${isHabis ? 'text-red-600' : 'text-orange-500'}`}>
                                                                {item.jumlah}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center text-gray-500 border-r border-gray-100">
                                                            {item.minimum_stok}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-center">
                                                            {isHabis ? (
                                                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                                                                    <AlertCircle size={12} /> HABIS TOTAL
                                                                </span>
                                                            ) : (
                                                                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                                                                    <AlertTriangle size={12} /> HAMPIR HABIS
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WarningStok;
