import React, { useEffect, useState } from 'react';
import { getRiwayatProduksi } from '../api/produksiApi';
import { Activity } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const RiwayatProduksi = () => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getRiwayatProduksi();
                if (res.data.status === 'success') setHistory(res.data.data);
            } catch (error) { console.error(error); }
        };
        fetch();
    }, []);

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-gray-900 pl-4">
                        <h1 className="text-3xl font-black text-gray-900">Riwayat <span className="text-gray-500">Produksi</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Audit log untuk melacak perpindahan status tiap order.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="p-4 font-bold">Waktu</th>
                                    <th className="p-4 font-bold">Kode Order</th>
                                    <th className="p-4 font-bold">Produk</th>
                                    <th className="p-4 font-bold">Status Baru</th>
                                    <th className="p-4 font-bold">Diupdate Oleh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(h => (
                                    <tr key={h.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                                        <td className="p-4 text-xs font-bold text-gray-600 flex items-center gap-2">
                                            <Activity size={14} className="text-gray-400"/>
                                            {new Date(h.created_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="p-4 font-black text-gray-900">{h.kode_order}</td>
                                        <td className="p-4 font-bold text-gray-700">{h.nama_produk}</td>
                                        <td className="p-4">
                                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider">{h.status}</span>
                                        </td>
                                        <td className="p-4 text-xs font-bold text-gray-500">{h.updated_by}</td>
                                    </tr>
                                ))}
                                {history.length === 0 && <tr><td colSpan="5" className="p-10 text-center text-gray-500 font-bold">Belum ada riwayat aktivitas.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RiwayatProduksi;
