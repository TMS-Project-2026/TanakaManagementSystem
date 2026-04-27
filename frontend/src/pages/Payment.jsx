import React, { useEffect, useState } from 'react';
import { getPayments, createPayment, updatePaymentStatus } from '../api/financeApi';
import { PlusCircle, Edit } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Payment = () => {
    const [payments, setPayments] = useState([]);
    const [form, setForm] = useState({ transaksi_id: '', jumlah: '', tanggal: '' });

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await getPayments();
            if (res.data.status === 'success') {
                setPayments(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat payment", error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createPayment(form);
            fetchPayments();
            setForm({ transaksi_id: '', jumlah: '', tanggal: '' });
        } catch (error) {
            console.error("Gagal tambah payment", error);
        }
    };

    const handleUpdateStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'pending' ? 'success' : (currentStatus === 'success' ? 'failed' : 'pending');
        try {
            await updatePaymentStatus(id, newStatus);
            fetchPayments();
        } catch (error) {
            console.error("Gagal update status", error);
        }
    };

    const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-red-600 pl-4">Manajemen Payment</h1>

            {/* Form Create */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><PlusCircle className="text-red-600" /> Tambah Payment</h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Transaksi ID</label>
                        <input type="text" required value={form.transaksi_id} onChange={e => setForm({...form, transaksi_id: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" placeholder="TRX-123" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                        <input type="number" required value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" placeholder="500000" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input type="date" required value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div>
                        <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">Simpan</button>
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-red-50 border-b border-red-100 text-gray-700">
                                <th className="p-4 font-semibold">ID</th>
                                <th className="p-4 font-semibold">Transaksi ID</th>
                                <th className="p-4 font-semibold">Jumlah</th>
                                <th className="p-4 font-semibold">Tanggal</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((item, index) => (
                                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4">{index + 1}</td>
                                    <td className="p-4 font-medium text-gray-800">{item.transaksi_id}</td>
                                    <td className="p-4 text-red-600 font-medium">{formatRupiah(item.jumlah)}</td>
                                    <td className="p-4">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'success' ? 'bg-green-100 text-green-700' : item.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {item.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleUpdateStatus(item.id, item.status)} className="text-blue-600 hover:text-blue-800 mx-auto block" title="Ubah Status">
                                            <Edit className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {payments.length === 0 && (
                                <tr><td colSpan="6" className="p-6 text-center text-gray-500">Belum ada data payment</td></tr>
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

export default Payment;
