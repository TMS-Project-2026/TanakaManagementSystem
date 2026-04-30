import React, { useEffect, useState } from 'react';
import { getBarangMasuk, createBarangMasuk, getStok } from '../api/gudangApi';
import { PlusCircle, CheckCircle, Trash2, Plus, X, Download, Search, UserCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const BarangMasuk = () => {
    const [history, setHistory] = useState([]);
    const [stokList, setStokList] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [supplier, setSupplier] = useState('');
    const [items, setItems] = useState([{ stok_id: '', jumlah: '' }]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const resBM = await getBarangMasuk();
            if (resBM.data.status === 'success') setHistory(resBM.data.data);
            
            const resStok = await getStok();
            if (resStok.data.status === 'success') setStokList(resStok.data.data);
        } catch (error) {
            console.error("Gagal memuat data", error);
        }
    };

    const uniqueBrands = Array.from(new Set(stokList.map(s => s.nama_brand).filter(Boolean)));
    const filteredStokList = selectedBrand ? stokList.filter(s => s.nama_brand === selectedBrand) : stokList;
    const uniqueGroups = Array.from(new Set(filteredStokList.map(s => `${s.nama_barang}|${s.cabang_id}`)));
    const availableSizes = stokList.filter(s => `${s.nama_barang}|${s.cabang_id}` === selectedGroup);

    const handleAddItem = () => {
        setItems([...items, { stok_id: '', jumlah: '' }]);
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        
        // Validasi
        const validItems = items.filter(i => i.stok_id && i.jumlah > 0);
        if (validItems.length === 0) {
            alert("Harap masukkan setidaknya satu ukuran beserta jumlahnya.");
            return;
        }

        const transaksi_id = 'TRX-IN-' + Date.now() + Math.floor(Math.random() * 1000);

        try {
            const promises = validItems.map(item => 
                createBarangMasuk({
                    barang_id: item.stok_id,
                    jumlah: item.jumlah,
                    tanggal: tanggal,
                    supplier: supplier,
                    transaksi_id: transaksi_id
                })
            );
            
            await Promise.all(promises);

            setSuccessMsg('Barang masuk berhasil dicatat! Stok otomatis bertambah.');
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchData();
            setShowAddModal(false);
            
            // Reset form
            setSelectedGroup('');
            setSupplier('');
            setItems([{ stok_id: '', jumlah: '' }]);
        } catch (error) {
            console.error("Gagal catat barang masuk", error);
            alert("Terjadi kesalahan saat mencatat barang masuk!");
        }
    };

    // Grouping history
    const groupedHistory = history.reduce((acc, curr) => {
        const key = curr.transaksi_id || `${curr.tanggal}|${curr.nama_barang}|${curr.cabang_id}|${curr.supplier}`;
        if (!acc[key]) {
            acc[key] = {
                id: curr.id,
                tanggal: curr.tanggal,
                nama_barang: curr.nama_barang,
                cabang_id: curr.cabang_id,
                supplier: curr.supplier,
                total_jumlah: 0,
                details: []
            };
        }
        acc[key].total_jumlah += curr.jumlah;
        acc[key].details.push(`${curr.ukuran || '-'}: ${curr.jumlah}`);
        return acc;
    }, {});

    const historyList = Object.values(groupedHistory).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    const filteredHistory = historyList.filter((item) => {
        const q = searchTerm.toLowerCase();
        return (
            item.nama_barang.toLowerCase().includes(q) ||
            item.cabang_id.toLowerCase().includes(q) ||
            (item.supplier || '').toLowerCase().includes(q) ||
            item.details.join(' ').toLowerCase().includes(q)
        );
    });

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
                                    <Download className="text-[#990000]" size={20} />
                                </div>
                                Barang <span className="text-[#990000]">Masuk</span>
                            </h1>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Catat penambahan stok barang dari supplier</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-green-700 hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={18} className="text-white" /> Catat Barang Masuk
                        </button>
                    </div>

                    {successMsg && (
                        <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 flex items-center gap-2">
                            <CheckCircle size={20} /> {successMsg}
                        </div>
                    )}

                    {/* MODAL INPUT DATA */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-white w-full max-w-4xl rounded-2xl p-6 sm:p-8 shadow-xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Catat Barang Masuk Baru</h2>
                                        <p className="text-xs text-gray-500 mt-1">Lengkapi form di bawah ini untuk mencatat penambahan stok.</p>
                                    </div>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"><X size={20} /></button>
                                </div>
                                <form onSubmit={handleCreate}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Brand</label>
                                    <select value={selectedBrand} onChange={e => { setSelectedBrand(e.target.value); setSelectedGroup(''); }} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-200 focus:border-green-600 outline-none bg-white transition-all">
                                        <option value="">-- Semua Brand --</option>
                                        {uniqueBrands.map(brand => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Produk & Cabang</label>
                                    <select required value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-200 focus:border-green-600 outline-none bg-white transition-all">
                                        <option value="" disabled>-- Pilih Produk --</option>
                                        {uniqueGroups.map(key => {
                                            const [nama, cabang] = key.split('|');
                                            return <option key={key} value={key}>{nama} ({cabang})</option>
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
                                    <input type="date" required value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-200 focus:border-green-600 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Supplier (Opsional)</label>
                                    <input type="text" placeholder="Nama Supplier" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-200 focus:border-green-600 outline-none transition-all" />
                                </div>
                            </div>

                            {selectedGroup && (
                                <div className="bg-white p-5 rounded-xl border border-green-100 mb-6 shadow-sm">
                                    <h4 className="font-semibold text-gray-700 mb-4">Input Ukuran & Jumlah</h4>
                                    
                                    {items.map((item, index) => (
                                        <div key={index} className="flex flex-wrap items-end gap-3 mb-3">
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Pilih Ukuran</label>
                                                <select required value={item.stok_id} onChange={e => handleItemChange(index, 'stok_id', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-200 focus:border-green-600 outline-none bg-white">
                                                    <option value="" disabled>-- Pilih Ukuran --</option>
                                                    {availableSizes.map(s => (
                                                        <option key={s.id} value={s.id} disabled={items.some((i, idx) => i.stok_id == s.id && idx !== index)}>
                                                            {s.ukuran || 'Default'} - (Sisa Stok: {s.jumlah})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Jml Masuk</label>
                                                <input type="number" required min="1" placeholder="Qty" value={item.jumlah} onChange={e => handleItemChange(index, 'jumlah', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-200 focus:border-green-600 outline-none" />
                                            </div>
                                            {items.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveItem(index)} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus baris">
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <button type="button" onClick={handleAddItem} className="mt-2 flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-800 transition-colors">
                                        <Plus size={16} /> Tambah Ukuran Lain
                                    </button>
                                </div>
                            )}

                            <div className="pt-5 mt-2 border-t border-gray-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={!selectedGroup} className={`font-bold py-2.5 px-8 rounded-xl shadow-sm transition-all ${selectedGroup ? 'bg-green-600 hover:bg-green-700 text-white active:scale-95' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                                    Simpan Masuk
                                </button>
                            </div>
                        </form>
                            </div>
                        </div>
                    )}

                    {/* Table Riwayat */}
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Riwayat Barang Masuk</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-4 font-semibold">Tanggal</th>
                                        <th className="p-4 font-semibold">Nama Barang</th>
                                        <th className="p-4 font-semibold">Cabang</th>
                                        <th className="p-4 font-semibold">Detail Ukuran</th>
                                        <th className="p-4 font-semibold text-center">Total Masuk</th>
                                        <th className="p-4 font-semibold">Supplier</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                            <td className="p-4 font-medium text-gray-800">{item.nama_barang}</td>
                                            <td className="p-4">{item.cabang_id}</td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {item.details.join(', ')}
                                            </td>
                                            <td className="p-4 text-center font-bold text-green-600">+{item.total_jumlah}</td>
                                            <td className="p-4">{item.supplier || '-'}</td>
                                        </tr>
                                    ))}
                                    {filteredHistory.length === 0 && (
                                        <tr><td colSpan={6} className="p-6 text-center text-gray-500">Barang masuk tidak ditemukan</td></tr>
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

export default BarangMasuk;
