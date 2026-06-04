import React, { useEffect, useState } from 'react';
import { getPermintaanStok, approvePermintaanStok, rejectPermintaanStok } from '../api/gudangApi';
import { Check, X, ClipboardList, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const PermintaanStok = () => {
    const [permintaan, setPermintaan] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchPermintaan();
    }, []);

    const fetchPermintaan = async () => {
        try {
            const res = await getPermintaanStok();
            if (res.data.status === 'success') {
                setPermintaan(res.data.data);
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

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold sticky top-0">
                                    <tr>
                                        <th className="p-4">Tanggal</th>
                                        <th className="p-4">Pengambil</th>
                                        <th className="p-4">Divisi</th>
                                        <th className="p-4">Barang</th>
                                        <th className="p-4">Ukuran</th>
                                        <th className="p-4 text-center">Qty</th>
                                        <th className="p-4">Keterangan</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPermintaan.map(item => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                            <td className="p-4 text-gray-600">{new Date(item.tanggal_request).toLocaleDateString('id-ID')}</td>
                                            <td className="p-4 font-bold text-gray-800">{item.nama_pengambil}</td>
                                            <td className="p-4 text-gray-600">{item.divisi}</td>
                                            <td className="p-4 font-medium text-gray-900">{item.nama_brand} - {item.nama_barang}</td>
                                            <td className="p-4 text-center font-bold">{item.ukuran}</td>
                                            <td className="p-4 text-center font-black text-red-600">{item.jumlah}</td>
                                            <td className="p-4 text-gray-500 max-w-xs truncate" title={item.keterangan}>{item.keterangan || '-'}</td>
                                            <td className="p-4 text-center">
                                                {item.status === 'pending' ? (
                                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold uppercase">Pending</span>
                                                ) : item.status === 'approved' ? (
                                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold uppercase">Approved</span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold uppercase">Rejected</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.status === 'pending' && (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleApprove(item.id)}
                                                            className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-lg transition-colors"
                                                            title="Approve"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleReject(item.id)}
                                                            className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg transition-colors"
                                                            title="Reject"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                                {item.status !== 'pending' && <span className="text-gray-400">-</span>}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPermintaan.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="p-8 text-center text-gray-500 font-medium">Belum ada permintaan stok.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PermintaanStok;
