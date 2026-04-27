import React, { useEffect, useState } from 'react';
import { getBarangKeluar, createBarangKeluar, getStok } from '../api/gudangApi';
import { PlusCircle, CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const BarangKeluar = () => {
    const [history, setHistory] = useState([]);
    const [stokList, setStokList] = useState([]);
    const [form, setForm] = useState({ barang_id: '', jumlah: '', tanggal: new Date().toISOString().split('T')[0], tujuan: '' });
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const resBK = await getBarangKeluar();
            if (resBK.data.status === 'success') setHistory(resBK.data.data);
            
            const resStok = await getStok();
            if (resStok.data.status === 'success') setStokList(resStok.data.data);
        } catch (error) {
            console.error("Gagal memuat data", error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        
        // Find selected stok to validate locally before sending to API
        const selectedStok = stokList.find(s => s.id.toString() === form.barang_id);
        if (selectedStok && parseInt(form.jumlah) > selectedStok.jumlah) {
            setErrorMsg(`Stok tidak cukup! Maksimal keluar: ${selectedStok.jumlah}`);
            return;
        }

        try {
            await createBarangKeluar(form);
            setSuccessMsg('Barang keluar berhasil dicatat! Stok otomatis berkurang.');
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchData();
            setForm({ barang_id: '', jumlah: '', tanggal: new Date().toISOString().split('T')[0], tujuan: '' });
        } catch (error) {
            console.error("Gagal catat barang keluar", error);
            setErrorMsg(error.response?.data?.message || "Gagal mencatat barang keluar!");
        }
    };

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-orange-500 pl-4">Barang Keluar (Outbound)</h1>

                    {successMsg && (
                        <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 flex items-center gap-2">
                            <CheckCircle size={20} /> {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2">
                            <AlertCircle size={20} /> {errorMsg}
                        </div>
                    )}

                    {/* Form Create */}
                    <div className="bg-orange-50 p-6 rounded-2xl shadow-sm border border-orange-100 mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <PlusCircle className="text-orange-600" /> Catat Barang Keluar Baru
                        </h3>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Barang</label>
                                <select required value={form.barang_id} onChange={e => setForm({...form, barang_id: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500">
                                    <option value="">-- Pilih Barang --</option>
                                    {stokList.map(s => (
                                        <option key={s.id} value={s.id}>{s.nama_barang} ({s.cabang_id}) - Stok: {s.jumlah}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Keluar</label>
                                <input type="number" required min="1" value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                <input type="date" required value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan / Catatan</label>
                                <input type="text" value={form.tujuan} onChange={e => setForm({...form, tujuan: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-orange-500 focus:border-orange-500" />
                            </div>
                            <div className="lg:col-span-5 flex justify-end mt-2">
                                <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-8 rounded-lg transition-colors">Catat Keluar</button>
                            </div>
                        </form>
                    </div>

                    {/* Table Riwayat */}
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Riwayat Barang Keluar</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
                                        <th className="p-4 font-semibold">Tanggal</th>
                                        <th className="p-4 font-semibold">Nama Barang</th>
                                        <th className="p-4 font-semibold">Cabang</th>
                                        <th className="p-4 font-semibold text-center">Jumlah Keluar</th>
                                        <th className="p-4 font-semibold">Tujuan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                            <td className="p-4 font-medium text-gray-800">{item.nama_barang}</td>
                                            <td className="p-4">{item.cabang_id}</td>
                                            <td className="p-4 text-center font-bold text-orange-600">-{item.jumlah}</td>
                                            <td className="p-4">{item.tujuan || '-'}</td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr><td colSpan={5} className="p-6 text-center text-gray-500">Belum ada riwayat barang keluar</td></tr>
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

export default BarangKeluar;
