import React, { useEffect, useState } from 'react';
import { getPackingList, updatePackingStatus } from '../api/produksiApi';
import { Package, CheckSquare } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Packing = () => {
    const [packing, setPacking] = useState([]);

    const fetch = async () => {
        try {
            const res = await getPackingList();
            if (res.data.status === 'success') setPacking(res.data.data.filter(p => p.status === 'packing'));
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetch(); }, []);

    const handleSelesai = async (id) => {
        if (window.confirm('Barang sudah di-packing dan siap dikirim?')) {
            try {
                await updatePackingStatus(id, 'Admin Packing');
                alert('Order Selesai!');
                fetch();
            } catch (error) { alert('Gagal update packing'); }
        }
    };

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-purple-600 pl-4">
                        <h1 className="text-3xl font-black text-gray-900">Proses <span className="text-purple-600">Packing</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Daftar order yang lolos QC dan sedang tahap pengemasan.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {packing.map(p => (
                            <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase">
                                    Packing
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-gray-900">{p.kode_order}</h3>
                                        <p className="text-xs font-bold text-gray-400">{p.nama_produk}</p>
                                    </div>
                                </div>
                                <div className="flex-1 mb-4">
                                    <p className="text-sm font-bold text-gray-800">Customer: {p.nama_customer}</p>
                                    <p className="text-xs text-gray-500">Qty: {p.qty} pcs</p>
                                </div>
                                <button onClick={() => handleSelesai(p.id)} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                    <CheckSquare size={18} /> Selesai Packing
                                </button>
                            </div>
                        ))}
                        {packing.length === 0 && <div className="col-span-full p-10 text-center text-gray-500 font-bold bg-white rounded-2xl border border-gray-100">Tidak ada order di area packing saat ini.</div>}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Packing;
