import React, { useEffect, useState } from 'react';
import { getProduksiOrders } from '../api/produksiApi';
import { CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const ProduksiSelesai = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await getProduksiOrders();
                if (res.data.status === 'success') {
                    setOrders(res.data.data.filter(o => o.status === 'selesai'));
                }
            } catch (error) { console.error(error); }
        };
        fetch();
    }, []);

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8 border-l-4 border-green-600 pl-4">
                        <h1 className="text-3xl font-black text-gray-900">Produksi <span className="text-green-600">Selesai</span></h1>
                        <p className="text-gray-500 font-medium mt-1">Daftar semua order yang telah 100% selesai dan siap kirim/diambil.</p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="p-4 font-bold">Kode / Customer</th>
                                    <th className="p-4 font-bold">Produk</th>
                                    <th className="p-4 font-bold">Qty</th>
                                    <th className="p-4 font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(o => (
                                    <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                                        <td className="p-4">
                                            <p className="font-black text-gray-900">{o.kode_order}</p>
                                            <p className="text-xs text-gray-500">{o.nama_customer}</p>
                                        </td>
                                        <td className="p-4 font-bold text-gray-800">{o.nama_produk}</td>
                                        <td className="p-4 font-bold text-gray-800">{o.qty} pcs</td>
                                        <td className="p-4">
                                            <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase inline-flex">
                                                <CheckCircle size={14} /> Selesai
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && <tr><td colSpan="4" className="p-10 text-center text-gray-500 font-bold">Belum ada order selesai.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProduksiSelesai;
