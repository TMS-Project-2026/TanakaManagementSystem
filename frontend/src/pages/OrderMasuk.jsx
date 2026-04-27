import React, { useEffect, useState } from 'react';
import { getProduksiOrders, createProduksiOrder } from '../api/produksiApi';
import { Plus, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const OrderMasuk = () => {
    const [orders, setOrders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ kode_order: '', nama_customer: '', nama_produk: '', qty: '', deadline: '', prioritas: 'normal' });

    const fetch = async () => {
        try {
            const res = await getProduksiOrders();
            if (res.data.status === 'success') setOrders(res.data.data);
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetch(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createProduksiOrder(form);
            alert('Order berhasil ditambahkan');
            setShowModal(false);
            fetch();
        } catch (error) { alert('Gagal menambah order'); }
    };

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-end mb-8">
                        <div className="border-l-4 border-[#990000] pl-4">
                            <h1 className="text-3xl font-black text-gray-900">Order <span className="text-[#990000]">Masuk</span></h1>
                            <p className="text-gray-500 font-medium mt-1">Daftar semua pesanan dari divisi Marketing.</p>
                        </div>
                        <button onClick={() => setShowModal(true)} className="bg-[#990000] hover:bg-red-800 text-white flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                            <Plus size={16} /> Order Baru
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="p-4 font-bold">Kode / Customer</th>
                                    <th className="p-4 font-bold">Produk</th>
                                    <th className="p-4 font-bold">Qty</th>
                                    <th className="p-4 font-bold">Deadline</th>
                                    <th className="p-4 font-bold">Prioritas</th>
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
                                        <td className="p-4 text-sm text-gray-600">{new Date(o.deadline).toLocaleDateString('id-ID')}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${o.prioritas === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{o.prioritas}</span>
                                        </td>
                                        <td className="p-4 text-xs font-bold uppercase text-gray-500">{o.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-xl font-black text-gray-900 mb-4">Input Order Baru</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Kode Order</label>
                                    <input required className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-[#990000]" value={form.kode_order} onChange={e=>setForm({...form, kode_order: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Nama Customer</label>
                                    <input required className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-[#990000]" value={form.nama_customer} onChange={e=>setForm({...form, nama_customer: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Nama Produk</label>
                                    <input required className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-[#990000]" value={form.nama_produk} onChange={e=>setForm({...form, nama_produk: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Qty</label>
                                        <input type="number" required className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-[#990000]" value={form.qty} onChange={e=>setForm({...form, qty: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1">Prioritas</label>
                                        <select className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-[#990000]" value={form.prioritas} onChange={e=>setForm({...form, prioritas: e.target.value})}>
                                            <option value="normal">Normal</option>
                                            <option value="urgent">Urgent</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Deadline</label>
                                    <input type="date" required className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-[#990000]" value={form.deadline} onChange={e=>setForm({...form, deadline: e.target.value})} />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold hover:bg-gray-200">Batal</button>
                                    <button type="submit" className="flex-1 py-2 bg-[#990000] text-white rounded-lg font-bold hover:bg-red-800">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default OrderMasuk;
