import React, { useEffect, useState } from 'react';
import { getMutasi, createMutasi, getStok } from '../api/gudangApi';
import { ArrowRightLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Mutasi = () => {
    const [history, setHistory] = useState([]);
    const [stokList, setStokList] = useState([]);
    const [form, setForm] = useState({ barang_id: '', dari_cabang: '', ke_cabang: '', jumlah: '', tanggal: new Date().toISOString().split('T')[0] });
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const resMutasi = await getMutasi();
            if (resMutasi.data.status === 'success') setHistory(resMutasi.data.data);
            
            const resStok = await getStok();
            if (resStok.data.status === 'success') setStokList(resStok.data.data);
        } catch (error) {
            console.error("Gagal memuat data", error);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        
        if (form.dari_cabang === form.ke_cabang) {
            setErrorMsg("Cabang asal dan tujuan tidak boleh sama!");
            return;
        }

        try {
            await createMutasi(form);
            setSuccessMsg('Mutasi stok berhasil! Stok antar cabang telah disesuaikan.');
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchData();
            setForm({ barang_id: '', dari_cabang: '', ke_cabang: '', jumlah: '', tanggal: new Date().toISOString().split('T')[0] });
        } catch (error) {
            console.error("Gagal catat mutasi", error);
            setErrorMsg(error.response?.data?.message || "Gagal mencatat mutasi!");
        }
    };

    // Filter unique branch names from current stock for the dropdowns
    const branches = Array.from(new Set(stokList.map(s => s.cabang_id)));

    // When selecting a barang, filter available from branches
    const availableFromBranches = form.barang_id 
        ? stokList.filter(s => s.id.toString() === form.barang_id || s.nama_barang === stokList.find(x => x.id.toString() === form.barang_id)?.nama_barang).map(s => s.cabang_id)
        : branches;

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-blue-500 pl-4">Mutasi Barang Antar Cabang</h1>

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
                    <div className="bg-blue-50 p-6 rounded-2xl shadow-sm border border-blue-100 mb-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <ArrowRightLeft className="text-blue-600" /> Form Mutasi
                        </h3>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Barang (Asal)</label>
                                <select required value={form.barang_id} onChange={e => {
                                    const selected = stokList.find(s => s.id.toString() === e.target.value);
                                    setForm({...form, barang_id: e.target.value, dari_cabang: selected ? selected.cabang_id : ''});
                                }} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500">
                                    <option value="">-- Pilih Barang --</option>
                                    {stokList.map(s => (
                                        <option key={s.id} value={s.id}>{s.nama_barang} ({s.cabang_id}) - Stok: {s.jumlah}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dari Cabang</label>
                                <input type="text" readOnly value={form.dari_cabang} className="w-full bg-gray-100 border border-gray-300 rounded-lg p-2 text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ke Cabang</label>
                                <input type="text" required value={form.ke_cabang} onChange={e => setForm({...form, ke_cabang: e.target.value})} placeholder="Contoh: Cabang 2" className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                                <input type="number" required min="1" value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                                <input type="date" required value={form.tanggal} onChange={e => setForm({...form, tanggal: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-blue-500 focus:border-blue-500" />
                            </div>
                            <div className="lg:col-span-6 flex justify-end mt-2">
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-lg transition-colors flex items-center gap-2">
                                    <ArrowRightLeft size={18} /> Proses Mutasi
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table Riwayat */}
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Riwayat Mutasi</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
                                        <th className="p-4 font-semibold">Tanggal</th>
                                        <th className="p-4 font-semibold">Nama Barang</th>
                                        <th className="p-4 font-semibold text-center">Dari Cabang</th>
                                        <th className="p-4 font-semibold text-center">Ke Cabang</th>
                                        <th className="p-4 font-semibold text-center">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                            <td className="p-4 font-medium text-gray-800">{item.nama_barang}</td>
                                            <td className="p-4 text-center"><span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold">{item.dari_cabang}</span></td>
                                            <td className="p-4 text-center"><span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold">{item.ke_cabang}</span></td>
                                            <td className="p-4 text-center font-bold text-blue-600">{item.jumlah}</td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr><td colSpan={5} className="p-6 text-center text-gray-500">Belum ada riwayat mutasi</td></tr>
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

export default Mutasi;
