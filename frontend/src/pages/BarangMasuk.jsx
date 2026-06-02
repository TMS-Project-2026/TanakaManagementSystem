import React, { useEffect, useState } from 'react';
import { getBarangMasuk, createBarangMasuk, updateBarangMasuk, deleteBarangMasuk, getStok } from '../api/gudangApi';
import { CheckCircle, Plus, X, Search, UserCircle, Download, Upload, Edit, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';

const BarangMasuk = () => {
    const [history, setHistory] = useState([]);
    const [stokList, setStokList] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState(null);

    // Form state
    const [namaBrand, setNamaBrand] = useState('');
    const [namaBarang, setNamaBarang] = useState('');
    const [kategori, setKategori] = useState('Reguler'); // Reguler / Utama
    const [cabangId, setCabangId] = useState('Banua'); // Banua / Tanaka / Acestreet
    const [kodeRak, setKodeRak] = useState('');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [minimumStok, setMinimumStok] = useState('5'); // Default minimal stok untuk transaksi ini

    const initialSizes = [
        { ukuran: 'XS', jumlah: '' },
        { ukuran: 'S', jumlah: '' },
        { ukuran: 'M', jumlah: '' },
        { ukuran: 'L', jumlah: '' },
        { ukuran: 'XL', jumlah: '' },
        { ukuran: 'XXL', jumlah: '' },
        { ukuran: 'XXXL', jumlah: '' },
        { ukuran: 'XXXXL', jumlah: '' },
        { ukuran: 'XXXXXL', jumlah: '' },
        { ukuran: 'All Size', jumlah: '' },
    ];
    const [sizeItems, setSizeItems] = useState(initialSizes);

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
    const uniqueBarang = Array.from(new Set(stokList.map(s => s.nama_barang).filter(Boolean)));

    const handleCreate = async (e) => {
        e.preventDefault();
        
        // Validasi: setidaknya satu size harus punya jumlah masuk > 0
        const validItems = sizeItems.filter(item => Number(item.jumlah) > 0);
        if (validItems.length === 0) {
            alert("Harap masukkan jumlah masuk untuk setidaknya satu ukuran.");
            return;
        }

        try {
            await createBarangMasuk({
                nama_brand: namaBrand.trim(),
                nama_barang: namaBarang.trim(),
                kategori,
                cabang_id: cabangId,
                kode_rak: kodeRak.trim() || null,
                tanggal,
                supplier: null, // supplier dihapus
                items: validItems.map(item => ({
                    ukuran: item.ukuran,
                    jumlah: Number(item.jumlah),
                    minimum_stok: Number(minimumStok) || 5 // Menggunakan minimal stok global tunggal
                }))
            });

            setSuccessMsg('Barang masuk berhasil dicatat! Stok otomatis bertambah.');
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchData();
            setShowAddModal(false);
            
            // Reset form
            setNamaBrand('');
            setNamaBarang('');
            setKategori('Reguler');
            setCabangId('Banua');
            setKodeRak('');
            setMinimumStok('5');
            setSizeItems(initialSizes);
        } catch (error) {
            console.error("Gagal catat barang masuk", error);
            alert("Terjadi kesalahan saat mencatat barang masuk!");
        }
    };

    const handleEdit = (item) => {
        setEditForm(JSON.parse(JSON.stringify(item)));
        setShowEditModal(true);
    };

    const handleDelete = async (transaksi_id) => {
        if (!transaksi_id) {
            alert("Tidak bisa menghapus data lama yang tidak memiliki ID Transaksi. Hubungi admin.");
            return;
        }
        if (window.confirm("Yakin ingin menghapus transaksi ini? Stok barang akan dikurangi sesuai dengan jumlah yang dihapus.")) {
            try {
                await deleteBarangMasuk(transaksi_id);
                setSuccessMsg("Transaksi berhasil dihapus!");
                setTimeout(() => setSuccessMsg(''), 3000);
                fetchData();
            } catch (error) {
                console.error("Gagal hapus", error);
                alert("Gagal menghapus transaksi.");
            }
        }
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        try {
            const items = sizesArray.map(size => ({
                ukuran: size,
                jumlah: Number(editForm.sizes[size]?.jumlah) || 0,
                minimum_stok: Number(editForm.sizes[size]?.min) || 5
            })).filter(item => item.jumlah > 0);

            if (items.length === 0) {
                alert("Harap masukkan setidaknya satu ukuran dengan kuantitas lebih dari 0.");
                return;
            }

            if (!editForm.transaksi_id) {
                alert("Data lama tidak dapat diedit karena tidak memiliki ID transaksi.");
                return;
            }

            await updateBarangMasuk(editForm.transaksi_id, {
                tanggal: editForm.tanggal,
                cabang_id: editForm.cabang_id,
                nama_brand: editForm.nama_brand,
                nama_barang: editForm.nama_barang,
                kategori: editForm.kategori,
                items
            });
            
            setSuccessMsg("Transaksi berhasil diubah!");
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchData();
            setShowEditModal(false);
            setEditForm(null);
        } catch (error) {
            console.error("Gagal update", error);
            alert("Gagal menyimpan perubahan transaksi.");
        }
    };

    // Fungsi membaca / import dari excel
    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                let mainHeaderIdx = -1;
                for (let i = 0; i < Math.min(rawRows.length, 15); i++) {
                    const strRow = rawRows[i].join('').toLowerCase();
                    if (strRow.includes('nama barang') || strRow.includes('brand') || strRow.includes('kategori')) {
                        mainHeaderIdx = i;
                        break;
                    }
                }

                if (mainHeaderIdx === -1) {
                    alert("Format Excel tidak dikenali! Pastikan ada kolom 'Nama Barang' atau 'Brand'.");
                    return;
                }

                const mainHeaders = rawRows[mainHeaderIdx];
                const subHeaders = rawRows[mainHeaderIdx + 1] || [];
                
                // Normalize headers by combining main and sub headers (for merged SIZE cells)
                const finalHeaders = mainHeaders.map((h, i) => {
                    const sub = String(subHeaders[i] || '').trim();
                    const main = String(h || '').trim();
                    // If subheader is a recognized size, prioritize it
                    if (sub && ['xs','s','m','l','xl','xxl','xxxl','xxxxl','xxxxxl','all size'].includes(sub.toLowerCase())) {
                        return sub;
                    }
                    if (main) return main;
                    if (sub) return sub;
                    return `__EMPTY_${i}`;
                });

                const isSubHeaderSizes = finalHeaders.some(h => ['xs','s','m','l','xl'].includes(h.toLowerCase()));
                const dataStartIdx = isSubHeaderSizes ? mainHeaderIdx + 2 : mainHeaderIdx + 1;

                const jsonData = [];
                for (let i = dataStartIdx; i < rawRows.length; i++) {
                    const row = rawRows[i];
                    // Skip completely empty rows
                    if (row.every(c => c === '')) continue;
                    
                    const obj = {};
                    finalHeaders.forEach((h, idx) => {
                        obj[h] = row[idx];
                    });
                    jsonData.push(obj);
                }

                if (jsonData.length === 0) {
                    alert("File Excel kosong atau tidak ada data baris yang valid!");
                    return;
                }

                let successCount = 0;
                let failCount = 0;

                for (const row of jsonData) {
                    // Cari column headers secara fleksibel (case-insensitive)
                    const getVal = (keys, defaultVal = '') => {
                        const foundKey = Object.keys(row).find(k => keys.some(key => k.toLowerCase().trim() === key.toLowerCase()));
                        return foundKey ? row[foundKey] : defaultVal;
                    };

                    const nama_brand = String(getVal(['brand', 'nama brand', 'nama_brand', 'merk'], '')).trim();
                    const nama_barang = String(getVal(['nama barang', 'nama_barang', 'barang', 'item', 'produk'], '')).trim();
                    
                    let kategoriRaw = String(getVal(['kategori', 'category'], 'Reguler')).trim();
                    const kategori = (kategoriRaw.toLowerCase() === 'utama') ? 'Utama' : 'Reguler';

                    let cabangRaw = String(getVal(['cabang', 'cabang_id', 'branch'], 'Banua')).trim();
                    let cabang_id = 'Banua';
                    if (cabangRaw.toLowerCase().includes('tanaka')) cabang_id = 'Tanaka';
                    else if (cabangRaw.toLowerCase().includes('acestreet') || cabangRaw.toLowerCase().includes('ace')) cabang_id = 'Acestreet';

                    const tanggalRaw = getVal(['tanggal', 'date', 'tgl'], new Date().toISOString().split('T')[0]);
                    let tanggal = String(tanggalRaw).trim();
                    if (!isNaN(tanggal) && tanggal.length > 4) {
                        // Mengonversi format tanggal serial Excel
                        const dateObj = new Date((Number(tanggal) - 25569) * 86400 * 1000);
                        if (!isNaN(dateObj.getTime())) {
                            tanggal = dateObj.toISOString().split('T')[0];
                        }
                    }

                    const kode_rak = String(getVal(['kode rak', 'kode_rak', 'rak', 'shelf'], '')).trim();
                    const minStokRaw = Number(getVal(['minimal stok', 'minimal_stok', 'min stok', 'min_stok', 'minimum_stok'], 5));
                    const minimum_stok = isNaN(minStokRaw) ? 5 : minStokRaw;

                    // Mengambil kuantitas ukuran
                    const items = [];
                    const sizeHeadersMap = {
                        'XS': ['xs'],
                        'S': ['s'],
                        'M': ['m'],
                        'L': ['l'],
                        'XL': ['xl'],
                        'XXL': ['xxl'],
                        'XXXL': ['xxxl'],
                        'XXXXL': ['xxxxl'],
                        'XXXXXL': ['xxxxxl'],
                        'All Size': ['all size', 'allsize', 'all_size']
                    };

                    Object.entries(sizeHeadersMap).forEach(([size, aliases]) => {
                        const val = Number(getVal(aliases, 0));
                        if (!isNaN(val) && val > 0) {
                            items.push({
                                ukuran: size,
                                jumlah: val,
                                minimum_stok: minimum_stok
                            });
                        }
                    });

                    if (!nama_barang) {
                        failCount++;
                        continue;
                    }

                    if (items.length === 0) {
                        failCount++;
                        continue;
                    }

                    try {
                        await createBarangMasuk({
                            nama_brand: nama_brand || null,
                            nama_barang,
                            kategori,
                            cabang_id,
                            kode_rak: kode_rak || null,
                            tanggal,
                            supplier: null,
                            items
                        });
                        successCount++;
                    } catch (err) {
                        console.error("Gagal impor baris:", row, err);
                        failCount++;
                    }
                }

                setSuccessMsg(`Berhasil mengimpor ${successCount} produk dari Excel!${failCount > 0 ? ` (${failCount} baris tidak valid)` : ''}`);
                setTimeout(() => setSuccessMsg(''), 5000);
                fetchData();
            } catch (error) {
                console.error("Gagal membaca file Excel", error);
                alert("Terjadi kesalahan saat membaca file Excel!");
            }
        };
        reader.readAsBinaryString(file);
        // Reset input file agar file yang sama bisa dimasukkan kembali jika perlu
        e.target.value = null;
    };

    // Grouping history by transaksi_id or fallback
    const groupedHistory = history.reduce((acc, curr) => {
        const key = curr.transaksi_id || `${curr.tanggal}|${curr.nama_barang}|${curr.cabang_id}`;
        if (!acc[key]) {
            acc[key] = {
                id: curr.id,
                transaksi_id: curr.transaksi_id,
                tanggal: curr.tanggal,
                nama_brand: curr.nama_brand || '-',
                nama_barang: curr.nama_barang,
                kategori: curr.kategori || '-',
                cabang_id: curr.cabang_id,
                total_jumlah: 0,
                sizes: {
                    XS: { jumlah: 0, min: 0 },
                    S: { jumlah: 0, min: 0 },
                    M: { jumlah: 0, min: 0 },
                    L: { jumlah: 0, min: 0 },
                    XL: { jumlah: 0, min: 0 },
                    XXL: { jumlah: 0, min: 0 },
                    XXXL: { jumlah: 0, min: 0 },
                    XXXXL: { jumlah: 0, min: 0 },
                    XXXXXL: { jumlah: 0, min: 0 },
                    'All Size': { jumlah: 0, min: 0 }
                }
            };
        }
        acc[key].total_jumlah += curr.jumlah;
        if (curr.ukuran && acc[key].sizes[curr.ukuran] !== undefined) {
            acc[key].sizes[curr.ukuran].jumlah += curr.jumlah;
            acc[key].sizes[curr.ukuran].min = curr.minimum_stok || 0;
        }
        return acc;
    }, {});

    const historyList = Object.values(groupedHistory).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    const filteredHistory = historyList.filter((item) => {
        const q = searchTerm.toLowerCase();
        return (
            item.nama_barang.toLowerCase().includes(q) ||
            (item.nama_brand || '').toLowerCase().includes(q) ||
            item.cabang_id.toLowerCase().includes(q) ||
            (item.kategori || '').toLowerCase().includes(q)
        );
    });

    const sizesArray = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'XXXXXL', 'All Size'];

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
                      placeholder="Cari brand, barang, kategori atau cabang..."
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
                                <div className="bg-green-50 border border-green-100 p-2 rounded-lg shadow-sm">
                                    <Download className="text-green-600" size={20} />
                                </div>
                                Barang Masuk
                            </h1>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Catat penambahan stok barang langsung dengan ukuran XS - All Size</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <label className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all active:scale-95 whitespace-nowrap">
                                <Upload size={18} className="text-white" /> Impor Excel
                                <input 
                                    type="file" 
                                    accept=".xlsx,.xls" 
                                    onChange={handleImportExcel} 
                                    className="hidden" 
                                />
                            </label>
                            <button
                                onClick={() => {
                                    setNamaBrand('');
                                    setNamaBarang('');
                                    setKategori('Reguler');
                                    setCabangId('Banua');
                                    setKodeRak('');
                                    setMinimumStok('5');
                                    setSizeItems(initialSizes);
                                    setShowAddModal(true);
                                }}
                                className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-green-700 hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
                            >
                                <Plus size={18} className="text-white" /> Catat Barang Masuk
                            </button>
                        </div>
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
                                        <p className="text-xs text-gray-500 mt-1">Isi form di bawah ini. Sistem otomatis mendeteksi atau membuat stok ukuran baru jika belum terdaftar.</p>
                                    </div>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"><X size={20} /></button>
                                </div>
                                
                                <form onSubmit={handleCreate}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Brand</label>
                                            <input 
                                                list="brand-list" 
                                                type="text" 
                                                placeholder="Contoh: Honda" 
                                                required 
                                                value={namaBrand} 
                                                onChange={e => setNamaBrand(e.target.value)} 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none transition-all" 
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
                                                placeholder="Contoh: Kemeja Alisan" 
                                                required 
                                                value={namaBarang} 
                                                onChange={e => setNamaBarang(e.target.value)} 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none transition-all" 
                                            />
                                            <datalist id="barang-list">
                                                {uniqueBarang.map(b => <option key={b} value={b} />)}
                                            </datalist>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
                                            <select 
                                                required 
                                                value={kategori} 
                                                onChange={e => setKategori(e.target.value)} 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none bg-white transition-all"
                                            >
                                                <option value="Reguler">Reguler</option>
                                                <option value="Utama">Utama</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Cabang Tujuan</label>
                                            <select 
                                                required 
                                                value={cabangId} 
                                                onChange={e => setCabangId(e.target.value)} 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none bg-white transition-all"
                                            >
                                                <option value="Banua">Banua</option>
                                                <option value="Tanaka">Tanaka</option>
                                                <option value="Acestreet">Acestreet</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Masuk</label>
                                            <input 
                                                type="date" 
                                                required 
                                                value={tanggal} 
                                                onChange={e => setTanggal(e.target.value)} 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none transition-all" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Kode Rak (Opsional)</label>
                                            <input 
                                                type="text" 
                                                placeholder="Contoh: A1-02" 
                                                value={kodeRak} 
                                                onChange={e => setKodeRak(e.target.value)} 
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none transition-all" 
                                            />
                                        </div>
                                        <div className="lg:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1 text-green-700 font-bold">Minimal Stok (Semua Ukuran)</label>
                                            <input 
                                                type="number" 
                                                min="0" 
                                                placeholder="Contoh: 50" 
                                                required 
                                                value={minimumStok} 
                                                onChange={e => setMinimumStok(e.target.value)} 
                                                className="w-full border border-green-300 bg-green-50/20 rounded-lg p-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none font-bold transition-all" 
                                            />
                                        </div>
                                    </div>

                                    {/* TABEL GRID UKURAN */}
                                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mb-6">
                                        <h4 className="font-bold text-gray-800 mb-1 text-sm text-center">Rincian Ukuran & Jumlah Masuk</h4>
                                        <p className="text-xs text-gray-400 mb-4 text-center">Masukkan kuantitas barang masuk untuk masing-masing ukuran di bawah ini.</p>
                                        
                                        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm max-w-md mx-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                                                    <tr>
                                                        <th className="p-3 pl-6">Ukuran</th>
                                                        <th className="p-3 pr-6">Jumlah Masuk (Pcs)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 text-sm">
                                                    {sizeItems.map((item, idx) => (
                                                        <tr key={item.ukuran} className="hover:bg-gray-50/30 transition-colors">
                                                            <td className="p-3 pl-6 font-bold text-gray-700">Ukuran {item.ukuran}</td>
                                                            <td className="p-3 pr-6">
                                                                <input 
                                                                    type="number" 
                                                                    min="0" 
                                                                    placeholder="0" 
                                                                    value={item.jumlah} 
                                                                    onChange={e => {
                                                                        const newSizes = [...sizeItems];
                                                                        newSizes[idx].jumlah = e.target.value;
                                                                        setSizeItems(newSizes);
                                                                    }} 
                                                                    className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none transition-all"
                                                                />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-gray-50/50">
                                                    <tr className="font-bold text-gray-800">
                                                        <td className="p-4 pl-6 text-right">TOTAL MASUK:</td>
                                                        <td className="p-4 pr-6 text-green-600 text-base">
                                                            {sizeItems.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0)} Pcs
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="pt-5 border-t border-gray-100 flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">
                                            Batal
                                        </button>
                                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-sm transition-all active:scale-95">
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
                                        <th className="p-4 font-semibold">Brand</th>
                                        <th className="p-4 font-semibold">Nama Barang</th>
                                        <th className="p-4 font-semibold">Kategori</th>
                                        <th className="p-4 font-semibold">Cabang</th>
                                        {sizesArray.map(size => (
                                            <th key={size} className="p-4 font-semibold text-center w-20">{size}</th>
                                        ))}
                                        <th className="p-4 font-semibold text-center w-28">Total Masuk</th>
                                        <th className="p-4 font-semibold text-center w-32">Minimal Stok</th>
                                        <th className="p-4 font-semibold text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((item) => {
                                        // Cari minimal stok dari salah satu ukuran yang aktif di transaksi ini
                                        const activeMin = Object.values(item.sizes).find(data => data.jumlah > 0)?.min || 5;

                                        return (
                                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 text-sm">
                                                <td className="p-4 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                                <td className="p-4 font-medium text-gray-600">{item.nama_brand}</td>
                                                <td className="p-4 font-bold text-gray-800">{item.nama_barang}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${item.kategori === 'Utama' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-600'}`}>
                                                        {item.kategori}
                                                    </span>
                                                </td>
                                                <td className="p-4">{item.cabang_id}</td>
                                                {sizesArray.map(size => {
                                                    const sizeData = item.sizes[size] || { jumlah: 0, min: 0 };
                                                    return (
                                                        <td key={size} className="p-4 text-center bg-gray-50/10 border-x border-gray-100 font-extrabold text-gray-800">
                                                            {sizeData.jumlah > 0 ? (
                                                                sizeData.jumlah
                                                            ) : (
                                                                <span className="text-gray-300 font-normal">-</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="p-4 text-center font-extrabold text-green-600 text-base">+{item.total_jumlah}</td>
                                                <td className="p-4 text-center bg-gray-50/10 border-l border-gray-100">
                                                    <span className="bg-red-50 border border-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                        {activeMin} Pcs
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleEdit(item)}
                                                            className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                                                            title="Edit Transaksi"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(item.transaksi_id)}
                                                            className="w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"
                                                            title="Hapus Transaksi"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredHistory.length === 0 && (
                                        <tr><td colSpan={8 + sizesArray.length} className="p-6 text-center text-gray-500">Barang masuk tidak ditemukan</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    </div>
                </div>

                {/* MODAL EDIT BARANG MASUK */}
                {showEditModal && editForm && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white w-full max-w-xl rounded-2xl p-6 sm:p-8 shadow-xl overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-200 border border-gray-100">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Edit Transaksi Barang Masuk</h2>
                                    <p className="text-xs text-gray-500 mt-1">{editForm.nama_barang} - {editForm.cabang_id}</p>
                                </div>
                                <button type="button" onClick={() => setShowEditModal(false)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><X size={20} /></button>
                            </div>
                            <form onSubmit={saveEdit}>
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Cabang Tujuan</label>
                                    <select 
                                        required 
                                        value={editForm.cabang_id} 
                                        onChange={e => setEditForm({...editForm, cabang_id: e.target.value})} 
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none bg-white transition-all"
                                    >
                                        <option value="Banua">Banua</option>
                                        <option value="Tanaka">Tanaka</option>
                                        <option value="Acestreet">Acestreet</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {sizesArray.map(size => (
                                        <div key={size} className="flex items-center gap-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                            <label className="w-16 font-bold text-gray-700 text-sm">Ukuran {size}</label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 outline-none transition-all"
                                                value={editForm.sizes[size]?.jumlah || 0}
                                                onChange={e => {
                                                    const newForm = { ...editForm };
                                                    if (!newForm.sizes[size]) newForm.sizes[size] = { jumlah: 0, min: 5 };
                                                    newForm.sizes[size].jumlah = Number(e.target.value) || 0;
                                                    setEditForm(newForm);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center">
                                    <span className="font-bold text-blue-800 text-sm">Total Masuk Baru:</span>
                                    <span className="font-black text-blue-600 text-xl">
                                        {sizesArray.reduce((acc, size) => acc + (Number(editForm.sizes[size]?.jumlah) || 0), 0)} Pcs
                                    </span>
                                </div>
                                <div className="pt-6 mt-2 border-t border-gray-100 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">
                                        Batal
                                    </button>
                                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-8 rounded-xl shadow-sm transition-all active:scale-95">
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default BarangMasuk;
