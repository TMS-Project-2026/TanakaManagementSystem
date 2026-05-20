import React, { useEffect, useState } from 'react';
import { getBarangKeluar, createBarangKeluar, getStok } from '../api/gudangApi';
import { PlusCircle, CheckCircle, AlertCircle, Trash2, Plus, X, Upload, Search, UserCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const BarangKeluar = () => {
    const [history, setHistory] = useState([]);
    const [stokList, setStokList] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [namaBrand, setNamaBrand] = useState('');
    const [namaBarang, setNamaBarang] = useState('');
    const [cabangId, setCabangId] = useState('Tanaka'); // Tanaka / Banua / Acestreet
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [tujuan, setTujuan] = useState(''); // diisi manual: shopee, tiktok, offline dll
    const [items, setItems] = useState([{ ukuran: 'S', jumlah: '' }]);

    const sizesArray = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'XXXXXL', 'All Size'];

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

    const uniqueBrands = Array.from(new Set(stokList.map(s => s.nama_brand).filter(Boolean)));
    const uniqueBarang = Array.from(new Set(stokList.map(s => s.nama_barang).filter(Boolean)));

    const handleAddItem = () => {
        setItems([...items, { ukuran: 'S', jumlah: '' }]);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        
        // Validasi produk
        if (!namaBarang.trim()) {
            setErrorMsg("Nama barang wajib diisi!");
            return;
        }

        // Filter out empty rows
        const validItems = items.filter(i => i.ukuran && Number(i.jumlah) > 0);
        if (validItems.length === 0) {
            setErrorMsg("Harap masukkan setidaknya satu ukuran beserta jumlah keluar.");
            return;
        }

        // Validasi lokal terlebih dahulu (opsional untuk kecepatan, tapi full-check ada di backend)
        for (const item of validItems) {
            const size = item.ukuran;
            const qty = Number(item.jumlah);

            const matchStok = stokList.find(s => 
                s.nama_barang.toLowerCase().trim() === namaBarang.toLowerCase().trim() &&
                s.cabang_id.toLowerCase().trim() === cabangId.toLowerCase().trim() &&
                s.ukuran === size &&
                (namaBrand.trim() === '' || (s.nama_brand || '').toLowerCase().trim() === namaBrand.toLowerCase().trim())
            );

            if (!matchStok) {
                setErrorMsg(`Barang "${namaBrand} - ${namaBarang}" ukuran ${size} tidak ditemukan di cabang ${cabangId}!`);
                return;
            }

            if (matchStok.jumlah < qty) {
                setErrorMsg(`Stok tidak cukup! Tersedia untuk ukuran ${size} di cabang ${cabangId} hanya ada ${matchStok.jumlah} Pcs.`);
                return;
            }
        }

        try {
            await createBarangKeluar({
                nama_brand: namaBrand.trim(),
                nama_barang: namaBarang.trim(),
                cabang_id: cabangId,
                tanggal,
                tujuan: tujuan.trim(),
                items: validItems.map(item => ({
                    ukuran: item.ukuran,
                    jumlah: Number(item.jumlah)
                }))
            });

            setSuccessMsg('Barang keluar berhasil dicatat! Stok otomatis berkurang.');
            setTimeout(() => setSuccessMsg(''), 5000);
            fetchData();
            setShowAddModal(false);
            
            // Reset form
            setNamaBrand('');
            setNamaBarang('');
            setCabangId('Tanaka');
            setTujuan('');
            setItems([{ ukuran: 'S', jumlah: '' }]);
        } catch (error) {
            console.error("Gagal catat barang keluar", error);
            setErrorMsg(error.response?.data?.message || "Terjadi kesalahan saat memproses barang keluar!");
        }
    };

    // Grouping history by transaksi_id or fallback
    const groupedHistory = history.reduce((acc, curr) => {
        const key = curr.transaksi_id || `${curr.tanggal}|${curr.nama_barang}|${curr.cabang_id}|${curr.tujuan}`;
        if (!acc[key]) {
            acc[key] = {
                id: curr.id,
                transaksi_id: curr.transaksi_id,
                tanggal: curr.tanggal,
                nama_brand: curr.nama_brand || '-',
                nama_barang: curr.nama_barang,
                cabang_id: curr.cabang_id,
                tujuan: curr.tujuan || '-',
                total_jumlah: 0,
                details: []
            };
        }
        acc[key].total_jumlah += curr.jumlah;
        acc[key].details.push(`${curr.ukuran || 'Default'}: ${curr.jumlah}`);
        return acc;
    }, {});

    const historyList = Object.values(groupedHistory).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    const filteredHistory = historyList.filter((item) => {
        const q = searchTerm.toLowerCase();
        return (
            item.nama_barang.toLowerCase().includes(q) ||
            (item.nama_brand || '').toLowerCase().includes(q) ||
            item.cabang_id.toLowerCase().includes(q) ||
            item.tujuan.toLowerCase().includes(q) ||
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
                      placeholder="Cari brand, barang, cabang atau tujuan..."
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
                                    <Upload className="text-red-600" size={20} />
                                </div>
                                Barang Keluar
                            </h1>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Catat pengeluaran stok barang massal dengan validasi instan level stok</p>
                        </div>
                        <button
                            onClick={() => {
                                setNamaBrand('');
                                setNamaBarang('');
                                setCabangId('Tanaka');
                                setTujuan('');
                                setItems([{ ukuran: 'S', jumlah: '' }]);
                                setErrorMsg('');
                                setShowAddModal(true);
                            }}
                            className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-red-700 hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={18} className="text-white" /> Catat Barang Keluar
                        </button>
                    </div>

                    {successMsg && (
                        <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 flex items-center gap-2">
                            <CheckCircle size={20} /> {successMsg}
                        </div>
                    )}
                    {errorMsg && (
                        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 flex items-center gap-2 font-semibold text-sm">
                            <AlertCircle size={20} /> {errorMsg}
                        </div>
                    )}

                    {/* MODAL INPUT DATA */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                            <div className="bg-white w-full max-w-4xl rounded-2xl p-6 sm:p-8 shadow-xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Catat Barang Keluar Baru</h2>
                                        <p className="text-xs text-gray-500 mt-1">Isi form di bawah ini. Sistem otomatis mencocokkan stok dan memotong jumlah barang yang keluar.</p>
                                    </div>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><X size={20} /></button>
                                </div>
                                
                                <form onSubmit={handleCreate}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Brand</label>
                                            <input 
                                                list="brand-list" 
                                                type="text" 
                                                placeholder="Contoh: Adidas" 
                                                value={namaBrand} 
                                                onChange={e => setNamaBrand(e.target.value)} 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all" 
                                            />
                                            <datalist id="brand-list">
                                                {uniqueBrands.map(b => <option key={b} value={b} />)}
                                            </datalist>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Barang</label>
                                            <input 
                                                list="barang-list" 
                                                type="text" 
                                                placeholder="Contoh: Kaos Keren" 
                                                required 
                                                value={namaBarang} 
                                                onChange={e => setNamaBarang(e.target.value)} 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all" 
                                            />
                                            <datalist id="barang-list">
                                                {uniqueBarang.map(b => <option key={b} value={b} />)}
                                            </datalist>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Cabang Asal</label>
                                            <select 
                                                required 
                                                value={cabangId} 
                                                onChange={e => setCabangId(e.target.value)} 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none bg-white transition-all"
                                            >
                                                <option value="Tanaka">Tanaka</option>
                                                <option value="Banua">Banua</option>
                                                <option value="Acestreet">Acestreet</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Keluar</label>
                                            <input 
                                                type="date" 
                                                required 
                                                value={tanggal} 
                                                onChange={e => setTanggal(e.target.value)} 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tujuan / Channel</label>
                                            <input 
                                                type="text" 
                                                placeholder="Contoh: Shopee / TikTok / Offline" 
                                                required 
                                                value={tujuan} 
                                                onChange={e => setTujuan(e.target.value)} 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all" 
                                            />
                                        </div>
                                    </div>

                                    {/* DYNAMIC SIZES INPUT */}
                                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mb-6">
                                        <h4 className="font-bold text-gray-800 mb-1 text-sm text-center">Masukkan Ukuran & Jumlah Keluar</h4>
                                        <p className="text-xs text-gray-400 mb-4 text-center">Tambahkan ukuran satu per satu dan masukkan kuantitas keluar.</p>
                                        
                                        <div className="max-w-md mx-auto space-y-3">
                                            {items.map((item, index) => (
                                                <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                    <div className="flex-1">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ukuran</label>
                                                        <select 
                                                            value={item.ukuran} 
                                                            onChange={e => handleItemChange(index, 'ukuran', e.target.value)}
                                                            className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none bg-white text-sm"
                                                        >
                                                            {sizesArray.map(sz => (
                                                                <option key={sz} value={sz}>{sz}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="w-28">
                                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Jumlah</label>
                                                        <input 
                                                            type="number" 
                                                            min="1" 
                                                            placeholder="0" 
                                                            required
                                                            value={item.jumlah} 
                                                            onChange={e => handleItemChange(index, 'jumlah', e.target.value)}
                                                            className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none text-sm font-bold"
                                                        />
                                                    </div>
                                                    {items.length > 1 && (
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleRemoveItem(index)}
                                                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors mt-5"
                                                            title="Hapus ukuran"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}

                                            <button 
                                                type="button" 
                                                onClick={handleAddItem}
                                                className="w-full py-2 border-2 border-dashed border-gray-200 hover:border-red-500 rounded-xl flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-red-600 font-semibold bg-white transition-all active:scale-[0.98]"
                                            >
                                                <Plus size={16} /> Tambah Ukuran Lain
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-5 border-t border-gray-100 flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">
                                            Batal
                                        </button>
                                        <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-sm transition-all active:scale-95">
                                            Simpan Keluar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Table Riwayat */}
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Riwayat Barang Keluar</h3>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-4 font-semibold">Tanggal</th>
                                        <th className="p-4 font-semibold">Brand</th>
                                        <th className="p-4 font-semibold">Nama Barang</th>
                                        <th className="p-4 font-semibold">Cabang</th>
                                        <th className="p-4 font-semibold">Detail Ukuran</th>
                                        <th className="p-4 font-semibold text-center w-36">Total Keluar</th>
                                        <th className="p-4 font-semibold">Tujuan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                            <td className="p-4 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                            <td className="p-4 font-medium text-gray-600">{item.nama_brand}</td>
                                            <td className="p-4 font-bold text-gray-800">{item.nama_barang}</td>
                                            <td className="p-4">{item.cabang_id}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {item.details.map((detail, idx) => (
                                                        <span key={idx} className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-md border border-gray-200">
                                                            {detail}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center font-extrabold text-red-600 text-base">-{item.total_jumlah} Pcs</td>
                                            <td className="p-4">
                                                <span className="bg-blue-50 border border-blue-100 text-blue-700 font-extrabold px-3 py-1 rounded-full text-xs">
                                                    {item.tujuan}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredHistory.length === 0 && (
                                        <tr><td colSpan={7} className="p-6 text-center text-gray-500">Barang keluar tidak ditemukan</td></tr>
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

export default BarangKeluar;
