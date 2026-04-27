import React, { useEffect, useState } from 'react';
import { getProduksiOrders, getTimProduksi, assignTimProduksi } from '../api/produksiApi';
import { Users, UserPlus } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const TimProduksi = () => {
    const [tim, setTim] = useState([]);
    const [orders, setOrders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ order_id: '', nama_tim: '', target_selesai: '' });

    const fetchTim = async () => {
        try {
            const res = await getTimProduksi();
            if (res.data.status === 'success') setTim(res.data.data);
        } catch (error) { console.error(error); }
    };

    const fetchOrders = async () => {
        try {
            const res = await getProduksiOrders();
            if (res.data.status === 'success') setOrders(res.data.data.filter(o => o.status !== 'selesai'));
        } catch (error) { console.error(error); }
    };

    useEffect(() => { fetchTim(); fetchOrders(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await assignTimProduksi(form);
            alert('Berhasil assign tim');
            setShowModal(false);
            fetchTim();
        } catch (error) { alert('Gagal assign tim'); }
    };

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-end mb-8">
                        <div className="border-l-4 border-indigo-600 pl-4">
                            <h1 className="text-3xl font-black text-gray-900">Penjahit & <span className="text-indigo-600">Tim Produksi</span></h1>
                            <p className="text-gray-500 font-medium mt-1">Delegasi tugas (Assign) order ke tim/penjahit.</p>
                        </div>
                        <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                            <UserPlus size={16} /> Assign Tim
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tim.map((t) => (
                            <div key={t.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex justify-center items-center font-black"><Users size={24} /></div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900">{t.nama_tim}</h3>
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-3">{t.kode_order} - {t.nama_produk}</p>
                                    <div className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">
                                        Target: {new Date(t.target_selesai).toLocaleDateString('id-ID')}
                                    </div>
                                    <p className="text-[10px] text-indigo-600 uppercase font-black mt-2 bg-indigo-50 inline-block px-2 py-0.5 rounded">Status Order: {t.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {showModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                            <h2 className="text-xl font-black text-gray-900 mb-4">Assign Kerja ke Tim</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Pilih Order</label>
                                    <select required className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-indigo-600" value={form.order_id} onChange={e=>setForm({...form, order_id: e.target.value})}>
                                        <option value="">-- Pilih Order --</option>
                                        {orders.map(o => <option key={o.id} value={o.id}>{o.kode_order} - {o.nama_produk}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Nama Tim / Penjahit</label>
                                    <input required className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-indigo-600" value={form.nama_tim} onChange={e=>setForm({...form, nama_tim: e.target.value})} placeholder="Misal: Tim Jahit A" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Target Selesai</label>
                                    <input type="date" required className="w-full border border-gray-200 rounded-lg p-2 outline-none focus:border-indigo-600" value={form.target_selesai} onChange={e=>setForm({...form, target_selesai: e.target.value})} />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <button type="button" onClick={()=>setShowModal(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg font-bold">Batal</button>
                                    <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold">Assign</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TimProduksi;
