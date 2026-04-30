import React, { useEffect, useState } from 'react';
import { getMutasi, createMutasi, getStok } from '../api/gudangApi';
import { ArrowRightLeft, CheckCircle, AlertCircle, Plus, Search, X, UserCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Mutasi = () => {
    const [history, setHistory] = useState([]);
    const [stokList, setStokList] = useState([]);
    const [form, setForm] = useState({ barang_id: '', dari_cabang: '', ke_cabang: '', jumlah: '', tanggal: new Date().toISOString().split('T')[0] });
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
            setShowAddModal(false);
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

    const filteredHistory = history
        .filter((item) => {
            const q = searchTerm.toLowerCase();
            return (
                item.nama_barang.toLowerCase().includes(q) ||
                item.dari_cabang.toLowerCase().includes(q) ||
                item.ke_cabang.toLowerCase().includes(q) ||
                (item.details || []).join(' ').toLowerCase().includes(q)
            );
        })
        .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* TOPBAR */}
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 gap-4 z-50 shrink-0">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Cari nama barang atau cabang..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100" onClick={() => setShowProfile(!showProfile)}>
                      <UserCircle size={32} className="text-gray-400 hover:text-red-600 transition-colors" />
                    </div>
                    {showProfile && (
                      <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                        <div className="p-4 bg-red-50/50">
                          <p className="text-sm font-black text-gray-900">Admin</p>
                          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-0.5">Gudang</p>
                        </div>
                      </div>
                    )}
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 pb-6">
                    <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight flex items-center gap-3">
                                <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                                    <ArrowRightLeft className="text-[#990000]" size={20} />
                                </div>
                                Mutasi <span className="text-[#990000]">Barang</span>
                            </h1>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Catat perpindahan stok barang antar cabang</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-blue-700 hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={18} className="text-white" /> Buat Mutasi Baru
                        </button>
                    </div>

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

                    {/* MODAL INPUT DATA */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-white w-full max-w-4xl rounded-2xl p-6 sm:p-8 shadow-xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Form Mutasi Barang</h2>
                                        <p className="text-xs text-gray-500 mt-1">Lengkapi form di bawah ini untuk mutasi stok.</p>
                                    </div>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><X size={20} /></button>
                                </div>
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
                            <div className="lg:col-span-6 pt-5 mt-2 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">
                                    Batal
                                </button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2">
                                    <ArrowRightLeft size={18} /> Proses Mutasi
                                </button>
                            </div>
                        </form>
                            </div>
                        </div>
                    )}

                    {/* Table Riwayat */}
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Riwayat Mutasi</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-4 font-semibold">Tanggal</th>
                                        <th className="p-4 font-semibold">Nama Barang</th>
                                        <th className="p-4 font-semibold text-center">Dari Cabang</th>
                                        <th className="p-4 font-semibold text-center">Ke Cabang</th>
                                        <th className="p-4 font-semibold text-center">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                            <td className="p-4 font-medium text-gray-800">{item.nama_barang}</td>
                                            <td className="p-4 text-center"><span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold">{item.dari_cabang}</span></td>
                                            <td className="p-4 text-center"><span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold">{item.ke_cabang}</span></td>
                                            <td className="p-4 text-center font-bold text-blue-600">{item.jumlah}</td>
                                        </tr>
                                    ))}
                                    {filteredHistory.length === 0 && (
                                        <tr><td colSpan={5} className="p-6 text-center text-gray-500">Mutasi tidak ditemukan</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Mutasi;
