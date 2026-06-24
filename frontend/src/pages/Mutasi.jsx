import React, { useEffect, useState } from 'react';
import { getMutasi, createMutasi, getStok } from '../api/gudangApi';
import { ArrowRightLeft, CheckCircle, AlertCircle, Plus, Search, X, UserCircle, Trash, Layers } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const Mutasi = () => {
    const [history, setHistory] = useState([]);
    const [stokList, setStokList] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const userRole = (JSON.parse(localStorage.getItem('user')) || {}).role || '';

    // Form header inputs (Tulis Manual)
    const [form, setForm] = useState({
        nama_barang: '',
        dari_cabang: userRole === 'gudang_accestret' ? 'Acestreet' : '',
        ke_cabang: '',
        tanggal: new Date().toISOString().split('T')[0]
    });

    // Form dynamic size rows
    const [formItems, setFormItems] = useState([
        { ukuran: 'S', jumlah: 1 }
    ]);

    const sizesArray = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'XXXXXL', 'All Size'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const resMutasi = await getMutasi();
            if (resMutasi.data.status === 'success') {
                let data = resMutasi.data.data;
                if (userRole === 'gudang_accestret') data = data.filter(d => ['Accestret', 'Acestreet'].includes(d.dari_cabang) || ['Accestret', 'Acestreet'].includes(d.ke_cabang));
                setHistory(data);
            }
            
            const resStok = await getStok();
            if (resStok.data.status === 'success') {
                let data = resStok.data.data;
                if (userRole === 'gudang_accestret') data = data.filter(d => ['Accestret', 'Acestreet'].includes(d.cabang_id));
                setStokList(data);
            }
        } catch (error) {
            console.error("Gagal memuat data", error);
        }
    };

    // Extract unique product and branch lists for autocomplete suggestions
    const uniqueProducts = Array.from(new Set(stokList.map(s => s.nama_barang).filter(Boolean)));
    const uniqueBranches = Array.from(new Set(stokList.map(s => s.cabang_id).filter(Boolean)));

    // Manage Dynamic Rows
    const handleAddRow = () => {
        setFormItems([...formItems, { ukuran: 'S', jumlah: 1 }]);
    };

    const handleRemoveRow = (index) => {
        if (formItems.length > 1) {
            setFormItems(formItems.filter((_, i) => i !== index));
        }
    };

    const handleRowChange = (index, field, value) => {
        const updated = [...formItems];
        updated[index][field] = value;
        setFormItems(updated);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!form.nama_barang || !form.dari_cabang || !form.ke_cabang) {
            setErrorMsg("Lengkapi data nama barang, cabang asal, dan cabang tujuan!");
            return;
        }
        
        if (form.dari_cabang.trim().toLowerCase() === form.ke_cabang.trim().toLowerCase()) {
            setErrorMsg("Cabang asal dan tujuan tidak boleh sama!");
            return;
        }

        // Validate and map typed items to stock database IDs
        const payloadList = [];
        
        for (let i = 0; i < formItems.length; i++) {
            const row = formItems[i];
            if (!row.ukuran) {
                setErrorMsg(`Silakan pilih ukuran pada baris ke-${i + 1}!`);
                return;
            }
            if (row.jumlah <= 0) {
                setErrorMsg(`Jumlah barang untuk ukuran ${row.ukuran} harus lebih besar dari 0!`);
                return;
            }

            // Find matching stok record in database (case-insensitive and trim spaces)
            const matchedStok = stokList.find(s => 
                (s.nama_barang || '').trim().toLowerCase() === form.nama_barang.trim().toLowerCase() &&
                (s.cabang_id || '').trim().toLowerCase() === form.dari_cabang.trim().toLowerCase() &&
                (s.ukuran || '').trim().toUpperCase() === row.ukuran.trim().toUpperCase()
            );

            if (!matchedStok) {
                setErrorMsg(`Barang "${form.nama_barang}" dengan ukuran "${row.ukuran}" tidak ditemukan atau belum pernah didaftarkan di cabang asal "${form.dari_cabang}"!`);
                return;
            }

            if (row.jumlah > matchedStok.jumlah) {
                setErrorMsg(`Stok tidak mencukupi untuk ukuran ${row.ukuran}! Stok tersedia saat ini: ${matchedStok.jumlah} Pcs`);
                return;
            }

            payloadList.push({
                barang_id: matchedStok.id,
                dari_cabang: form.dari_cabang,
                ke_cabang: form.ke_cabang,
                jumlah: Number(row.jumlah),
                tanggal: form.tanggal
            });
        }

        try {
            // Run all mutations sequentially
            await Promise.all(payloadList.map(payload => createMutasi(payload)));

            setSuccessMsg('Mutasi stok berhasil! Stok antar cabang telah disesuaikan.');
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchData();
            
            // Reset form
            setForm({ nama_barang: '', dari_cabang: userRole === 'gudang_accestret' ? 'Acestreet' : '', ke_cabang: '', tanggal: new Date().toISOString().split('T')[0] });
            setFormItems([{ ukuran: 'S', jumlah: 1 }]);
            setShowAddModal(false);
        } catch (error) {
            console.error("Gagal catat mutasi", error);
            setErrorMsg(error.response?.data?.message || "Gagal mencatat mutasi!");
        }
    };

    const filteredHistory = history
        .filter((item) => {
            const q = searchTerm.toLowerCase();
            return (
                (item.nama_barang || '').toLowerCase().includes(q) ||
                (item.dari_cabang || '').toLowerCase().includes(q) ||
                (item.ke_cabang || '').toLowerCase().includes(q) ||
                (item.ukuran || '').toLowerCase().includes(q)
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
                      placeholder="Cari nama barang, cabang, atau ukuran..."
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
                          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mt-0.5">{userRole === 'gudang_accestret' ? 'Gudang Accestret' : 'Gudang'}</p>
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
                                Mutasi Barang
                            </h1>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Catat perpindahan stok barang antar cabang dengan sebaran ukuran dinamis</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-blue-700 hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={18} className="text-white" /> Buat Mutasi Baru
                        </button>
                    </div>

                    {successMsg && (
                        <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-200">
                            <CheckCircle size={20} /> {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-200">
                            <AlertCircle size={20} /> {errorMsg}
                        </div>
                    )}

                    {/* MODAL INPUT DATA */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-white w-full max-w-2xl rounded-2xl p-6 sm:p-8 shadow-xl overflow-y-auto max-h-[92vh] animate-in zoom-in-95 duration-200 border border-gray-100">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Form Mutasi Barang</h2>
                                        <p className="text-xs text-gray-500 mt-1">Lengkapi form perpindahan stok barang antar cabang di bawah ini.</p>
                                    </div>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><X size={20} /></button>
                                </div>
                                
                                <form onSubmit={handleCreate} className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nama Barang (Tulis Manual)</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ketik nama barang..."
                                                list="items-datalist"
                                                value={form.nama_barang}
                                                onChange={e => setForm({...form, nama_barang: e.target.value})}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                                            />
                                            <datalist id="items-datalist">
                                                {uniqueProducts.map(p => (
                                                    <option key={p} value={p} />
                                                ))}
                                            </datalist>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Dari Cabang (Tulis Manual)</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Ketik cabang asal..."
                                                list="branches-datalist"
                                                value={form.dari_cabang}
                                                onChange={e => setForm({...form, dari_cabang: e.target.value})}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm bg-white"
                                            />
                                            <datalist id="branches-datalist">
                                                {uniqueBranches.map(br => (
                                                    <option key={br} value={br} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ke Cabang (Tujuan)</label>
                                            <input
                                                type="text"
                                                required
                                                list="branches-datalist"
                                                value={form.ke_cabang}
                                                onChange={e => setForm({...form, ke_cabang: e.target.value})}
                                                placeholder="Contoh: Cabang 2, Store A, dll"
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tanggal</label>
                                            <input
                                                type="date"
                                                required
                                                value={form.tanggal}
                                                onChange={e => setForm({...form, tanggal: e.target.value})}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Dynamic Size & Qty Section */}
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                                <Layers size={14} className="text-blue-600" />
                                                Detail Ukuran & Jumlah
                                            </span>
                                            <button
                                                type="button"
                                                onClick={handleAddRow}
                                                className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold py-1 px-3 rounded-lg border border-blue-200 transition-all active:scale-95 flex items-center gap-1"
                                            >
                                                + Tambah Ukuran
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {formItems.map((sz, index) => (
                                                <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end bg-white p-3 rounded-lg border border-gray-200 relative group">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Ukuran</label>
                                                        <select
                                                            required
                                                            value={sz.ukuran}
                                                            onChange={e => handleRowChange(index, 'ukuran', e.target.value)}
                                                            className="w-full border border-gray-300 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-100 outline-none bg-white text-xs font-bold text-gray-800"
                                                        >
                                                            {sizesArray.map(szOption => (
                                                                <option key={szOption} value={szOption}>{szOption}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">Jumlah Mutasi</label>
                                                        <input
                                                            type="number"
                                                            required
                                                            min="1"
                                                            value={sz.jumlah}
                                                            onChange={e => handleRowChange(index, 'jumlah', Number(e.target.value))}
                                                            className="w-full border border-gray-300 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-100 outline-none text-xs font-semibold text-center"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveRow(index)}
                                                            disabled={formItems.length === 1}
                                                            className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors border border-red-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold ml-auto"
                                                            title="Hapus baris ukuran"
                                                        >
                                                            <Trash size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-5 mt-2 border-t border-gray-100 flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors text-sm">
                                            Batal
                                        </button>
                                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2 text-sm">
                                            <ArrowRightLeft size={18} /> Proses Mutasi
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Table Riwayat */}
                    <h3 className="text-xl font-bold text-gray-800 mb-4 mt-6">Riwayat Mutasi</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-4 font-semibold">Tanggal</th>
                                        <th className="p-4 font-semibold">Nama Barang</th>
                                        <th className="p-4 font-semibold text-center">Ukuran</th>
                                        <th className="p-4 font-semibold text-center">Dari Cabang</th>
                                        <th className="p-4 font-semibold text-center">Ke Cabang</th>
                                        <th className="p-4 font-semibold text-center">Jumlah</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredHistory.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4">
                                                {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="p-4 font-black text-gray-800">{item.nama_barang}</td>
                                            <td className="p-4 text-center">
                                                <span className="bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded text-xs font-extrabold">
                                                    {item.ukuran || '-'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center"><span className="bg-red-50 text-red-700 px-2.5 py-1 rounded text-xs font-extrabold">{item.dari_cabang}</span></td>
                                            <td className="p-4 text-center"><span className="bg-green-50 text-green-700 px-2.5 py-1 rounded text-xs font-extrabold">{item.ke_cabang}</span></td>
                                            <td className="p-4 text-center font-extrabold text-blue-600 text-base">{item.jumlah} Pcs</td>
                                        </tr>
                                    ))}
                                    {filteredHistory.length === 0 && (
                                        <tr><td colSpan={6} className="p-6 text-center text-gray-500">Riwayat mutasi tidak ditemukan</td></tr>
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
