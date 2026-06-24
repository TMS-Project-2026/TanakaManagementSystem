import React, { useEffect, useState } from 'react';
import { getPermintaanStok, approvePermintaanStok, rejectPermintaanStok } from '../api/gudangApi';
import { Check, X, ClipboardList, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const PermintaanStok = () => {
    const [permintaan, setPermintaan] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const userRole = (JSON.parse(localStorage.getItem('user')) || {}).role || '';

    useEffect(() => {
        fetchPermintaan();
    }, []);

    const fetchPermintaan = async () => {
        try {
            const res = await getPermintaanStok();
            if (res.data.status === 'success') {
                let data = res.data.data;
                if (userRole === 'gudang_accestret') data = data.filter(d => ['Accestret', 'Acestreet'].includes(d.cabang_id));
                setPermintaan(data);
            }
        } catch (error) {
            console.error("Gagal memuat permintaan stok", error);
        }
    };

    const handleApprove = async (id) => {
        if (window.confirm('Setujui permintaan stok ini? Stok akan otomatis berkurang.')) {
            try {
                await approvePermintaanStok(id);
                fetchPermintaan();
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal menyetujui permintaan.');
            }
        }
    };

    const handleReject = async (id) => {
        if (window.confirm('Tolak permintaan stok ini?')) {
            try {
                await rejectPermintaanStok(id);
                fetchPermintaan();
            } catch (error) {
                alert(error.response?.data?.message || 'Gagal menolak permintaan.');
            }
        }
    };

    const filteredPermintaan = permintaan.filter(p => 
        (p.nama_barang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.nama_pengambil || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.divisi || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-4 z-50 shrink-0 border-b border-gray-200 bg-white">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari nama barang, pengambil, divisi..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-full">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg shadow-sm">
                                        <ClipboardList className="text-blue-600" size={20} />
                                    </div>
                                    Approval Permintaan Stok
                                </h1>
                                <p className="text-sm text-gray-500 mt-2 font-medium">Setujui atau tolak permintaan pengambilan stok dari divisi Marketing</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead className="bg-gray-900 text-white text-[11px] uppercase tracking-wider sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-3 border-r border-gray-700 whitespace-nowrap">TANGGAL</th>
                                            <th className="px-3 py-3 border-r border-gray-700">PENGAMBIL</th>
                                            <th className="px-3 py-3 border-r border-gray-700">DIVISI</th>
                                            <th className="px-3 py-3 border-r border-gray-700">BARANG</th>
                                            <th className="px-3 py-3 border-r border-gray-700 text-center">UKURAN</th>
                                            <th className="px-3 py-3 border-r border-gray-700 text-center">QTY</th>
                                            <th className="px-3 py-3 border-r border-gray-700">KETERANGAN</th>
                                            <th className="px-3 py-3 border-r border-gray-700 text-center">STATUS</th>
                                            <th className="px-3 py-3 text-center">AKSI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPermintaan.map((item, idx) => (
                                            <tr key={item.id} className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                                                <td className="px-3 py-2.5 whitespace-nowrap text-gray-600 border-r border-gray-100">{new Date(item.tanggal_request).toLocaleDateString('id-ID')}</td>
                                                <td className="px-3 py-2.5 font-bold text-gray-800 border-r border-gray-100">{item.nama_pengambil}</td>
                                                <td className="px-3 py-2.5 text-gray-600 border-r border-gray-100">{item.divisi}</td>
                                                <td className="px-3 py-2.5 font-semibold text-gray-800 border-r border-gray-100">{item.nama_brand} - {item.nama_barang}</td>
                                                <td className="px-3 py-2.5 text-center font-bold border-r border-gray-100">{item.ukuran}</td>
                                                <td className="px-3 py-2.5 text-center font-black text-red-600 border-r border-gray-100">{item.jumlah}</td>
                                                <td className="px-3 py-2.5 text-gray-500 max-w-xs truncate border-r border-gray-100" title={item.keterangan}>{item.keterangan || '-'}</td>
                                                <td className="px-3 py-2.5 text-center border-r border-gray-100">
                                                    {item.status === 'pending' ? (
                                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Pending</span>
                                                    ) : item.status === 'approved' ? (
                                                        <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Approved</span>
                                                    ) : (
                                                        <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Rejected</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {item.status === 'pending' && (
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button 
                                                                onClick={() => handleApprove(item.id)}
                                                                className="w-8 h-8 rounded-xl bg-green-50 text-green-600 hover:bg-green-600 hover:text-white flex items-center justify-center transition-colors shadow-sm"
                                                                title="Approve"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleReject(item.id)}
                                                                className="w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors shadow-sm"
                                                                title="Reject"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {item.status !== 'pending' && <span className="text-gray-300 font-normal">-</span>}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredPermintaan.length === 0 && (
                                            <tr>
                                                <td colSpan={9} className="p-8 text-center text-gray-400">Belum ada permintaan stok.</td>
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

export default PermintaanStok;
