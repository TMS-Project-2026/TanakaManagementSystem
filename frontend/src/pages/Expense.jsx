import React, { useEffect, useState } from 'react';
import { getExpenses, createExpense, deleteExpense } from '../api/financeApi';
import { PlusCircle, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Expense = () => {
    const [expenses, setExpenses] = useState([]);
    const [form, setForm] = useState({ nama_pengeluaran: '', jumlah: '', kategori: '', tanggal: '' });

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await getExpenses();
            if (res.data.status === 'success') {
                setExpenses(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat expense", error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createExpense(form);
            fetchExpenses();
            setForm({ nama_pengeluaran: '', jumlah: '', kategori: '', tanggal: '' });
        } catch (error) {
            console.error("Gagal tambah expense", error);
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm('Yakin ingin menghapus pengeluaran ini?')) {
            try {
                await deleteExpense(id);
                fetchExpenses();
            } catch (error) {
                console.error("Gagal hapus expense", error);
            }
        }
    };

    const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-red-600 pl-4">Manajemen Pengeluaran (Expense)</h1>

            {/* Form Create */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><PlusCircle className="text-red-600" /> Tambah Pengeluaran</h3>
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pengeluaran</label>
                        <input type="text" required value={form.nama_pengeluaran} onChange={e => setForm({...form, nama_pengeluaran: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" placeholder="Listrik, Air, Gaji, dll" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                        <input type="number" required value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" placeholder="1000000" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <input type="text" required value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" placeholder="Operasional" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                        <input type="date" required value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div className="md:col-span-5">
                        <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mt-2">Simpan Pengeluaran</button>
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
                                <th className="p-4 font-semibold">Nama Pengeluaran</th>
                                <th className="p-4 font-semibold">Kategori</th>
                                <th className="p-4 font-semibold">Jumlah</th>
                                <th className="p-4 font-semibold">Tanggal</th>
                                <th className="p-4 font-semibold text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((item, index) => (
                                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="p-4">{index + 1}</td>
                                    <td className="p-4 font-medium text-gray-800">{item.nama_pengeluaran}</td>
                                    <td className="p-4"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{item.kategori}</span></td>
                                    <td className="p-4 text-red-600 font-medium">{formatRupiah(item.jumlah)}</td>
                                    <td className="p-4">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 mx-auto block" title="Hapus">
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr><td colSpan="6" className="p-6 text-center text-gray-500">Belum ada data pengeluaran</td></tr>
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

export default Expense;
