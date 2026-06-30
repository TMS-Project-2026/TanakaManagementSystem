import React, { useEffect, useState } from 'react';
import { getBarangMasuk, createBarangMasuk, updateBarangMasuk, deleteBarangMasuk, getStok } from '../api/gudangApi';
import { CheckCircle, Plus, X, Search, UserCircle, Download, Upload, Edit, Trash2, ChevronDown } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import * as XLSX from 'xlsx';
import api from '../api/axios';


const BarangMasuk = () => {
    const [history, setHistory] = useState([]);
    const [stokList, setStokList] = useState([]);
    const [pricelist, setPricelist] = useState([]);
    const [offlinePricelist, setOfflinePricelist] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showKodeSuggest, setShowKodeSuggest] = useState(false);
    const [openRejectId, setOpenRejectId] = useState(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState(null);

    const userRole = (JSON.parse(localStorage.getItem('user')) || {}).role || '';

    // Form state
    const [kodeProduk, setKodeProduk] = useState('');
    const [namaBrand, setNamaBrand] = useState('');
    const [namaBarang, setNamaBarang] = useState('');
    const [kategori, setKategori] = useState('Reguler');
    const [cabangId, setCabangId] = useState(userRole === 'gudang_accestret' ? 'Acestreet' : 'Banua');
    const [kodeRak, setKodeRak] = useState('');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [minimumStok, setMinimumStok] = useState('5'); // Default minimal stok untuk transaksi ini

    const initialSizes = [
        { ukuran: 'XS', jumlah: '', jumlah_reject: '' },
        { ukuran: 'S', jumlah: '', jumlah_reject: '' },
        { ukuran: 'M', jumlah: '', jumlah_reject: '' },
        { ukuran: 'L', jumlah: '', jumlah_reject: '' },
        { ukuran: 'XL', jumlah: '', jumlah_reject: '' },
        { ukuran: 'XXL', jumlah: '', jumlah_reject: '' },
        { ukuran: 'XXXL', jumlah: '', jumlah_reject: '' },
        { ukuran: 'XXXXL', jumlah: '', jumlah_reject: '' },
        { ukuran: 'XXXXXL', jumlah: '', jumlah_reject: '' },
        { ukuran: 'All Size', jumlah: '', jumlah_reject: '' },
    ];
    const [sizeItems, setSizeItems] = useState(initialSizes);

    useEffect(() => {
        fetchData();
        fetchPricelist();
    }, []);

    const fetchPricelist = async () => {
        try {
            const [onlineRes, offlineRes] = await Promise.all([
                api.get('/pricelist-online'),
                api.get('/produk')
            ]);
            setPricelist(onlineRes.data.data || []);
            setOfflinePricelist(offlineRes.data.data || []);
        } catch (e) { console.error(e); }
    };

    // Autofill saat kode dipilih
    const handleKodeChange = (kode) => {
        const uppercaseKode = kode.toUpperCase();
        setKodeProduk(uppercaseKode);
        const found = pricelist.find(p => p.kode === uppercaseKode) || offlinePricelist.find(p => p.kode === uppercaseKode);
        if (found) {
            setNamaBarang(found.nama_produk);
            setNamaBrand(found.grup_produk || '');
            setKategori(found.jenis || found.kategori || 'Reguler');
        } else {
            setNamaBarang('');
            setNamaBrand('');
            setKategori('Reguler');
        }
    };

    const fetchData = async () => {
        try {
            const resBM = await getBarangMasuk();
            if (resBM.data.status === 'success') {
                let data = resBM.data.data;
                if (userRole === 'gudang_accestret') data = data.filter(d => ['Accestret', 'Acestreet'].includes(d.cabang_id));
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
        // Validasi: jumlah reject tidak boleh melebihi jumlah masuk
        const invalidReject = validItems.find(item => Number(item.jumlah_reject) > Number(item.jumlah));
        if (invalidReject) {
            alert(`Jumlah reject ukuran ${invalidReject.ukuran} tidak boleh melebihi jumlah masuk!`);
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
                supplier: null,
                items: validItems.map(item => ({
                    ukuran: item.ukuran,
                    jumlah: Number(item.jumlah),
                    jumlah_reject: Number(item.jumlah_reject) || 0,
                    minimum_stok: Number(minimumStok) || 5
                }))
            });

            setSuccessMsg('Barang masuk berhasil dicatat! Stok otomatis bertambah.');
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchData();
            setShowAddModal(false);
            
            // Reset form
            setKodeProduk('');
            setNamaBrand('');
            setNamaBarang('');
            setKategori('Reguler');
            setCabangId(userRole === 'gudang_accestret' ? 'Acestreet' : 'Banua');
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
                jumlah_reject: Number(editForm.sizes[size]?.reject) || 0,
                minimum_stok: Number(editForm.sizes[size]?.min) || 5
            })).filter(item => item.jumlah > 0 || item.jumlah_reject > 0);

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
                kode_produk: curr.kode_produk || '-',
                nama_brand: curr.nama_brand || '-',
                nama_barang: curr.nama_barang,
                bahan: curr.bahan || '-',
                kategori: curr.kategori || '-',
                cabang_id: curr.cabang_id,
                total_jumlah: 0,
                total_reject: 0,
                sizes: {
                    XS: { jumlah: 0, reject: 0, min: 0 },
                    S: { jumlah: 0, reject: 0, min: 0 },
                    M: { jumlah: 0, reject: 0, min: 0 },
                    L: { jumlah: 0, reject: 0, min: 0 },
                    XL: { jumlah: 0, reject: 0, min: 0 },
                    XXL: { jumlah: 0, reject: 0, min: 0 },
                    XXXL: { jumlah: 0, reject: 0, min: 0 },
                    XXXXL: { jumlah: 0, reject: 0, min: 0 },
                    XXXXXL: { jumlah: 0, reject: 0, min: 0 },
                    'All Size': { jumlah: 0, reject: 0, min: 0 }
                }
            };
        }
        acc[key].total_jumlah += curr.jumlah;
        acc[key].total_reject += (curr.jumlah_reject || 0);
        if (curr.ukuran && acc[key].sizes[curr.ukuran] !== undefined) {
            acc[key].sizes[curr.ukuran].jumlah += curr.jumlah;
            acc[key].sizes[curr.ukuran].reject += (curr.jumlah_reject || 0);
            acc[key].sizes[curr.ukuran].min = curr.minimum_stok || 0;
        }
        return acc;
    }, {});

    const historyList = Object.values(groupedHistory).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    const filteredHistory = historyList.filter((item) => {
        const q = searchTerm.toLowerCase();
        return (
            item.nama_barang.toLowerCase().includes(q) ||
            (item.kode_produk || '').toLowerCase().includes(q) ||
            (item.bahan || '').toLowerCase().includes(q) ||
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
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight flex items-center gap-3">
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
                                    setKodeProduk('');
                                    setKategori('Reguler');
                                    setCabangId(userRole === 'gudang_accestret' ? 'Acestreet' : 'Banua');
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                        {/* KODE PRODUK — bisa ketik atau pilih */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                Kode Produk
                                                <span className="ml-2 text-xs text-gray-400 font-normal">(ketik atau pilih untuk autofill nama barang)</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={kodeProduk}
                                                    onChange={e => {
                                                        handleKodeChange(e.target.value);
                                                        setShowKodeSuggest(true);
                                                    }}
                                                    onFocus={() => setShowKodeSuggest(true)}
                                                    onBlur={() => setTimeout(() => setShowKodeSuggest(false), 150)}
                                                    placeholder="Ketik kode produk..."
                                                    autoComplete="off"
                                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none bg-white text-sm font-mono uppercase"
                                                />
                                                {showKodeSuggest && (
                                                    <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-52 overflow-y-auto">
                                                        {[...pricelist, ...offlinePricelist]
                                                            .filter(p =>
                                                                !kodeProduk ||
                                                                p.kode?.toLowerCase().includes(kodeProduk.toLowerCase()) ||
                                                                p.nama_produk?.toLowerCase().includes(kodeProduk.toLowerCase())
                                                            )
                                                            .map(p => (
                                                                <li
                                                                    key={p.kode}
                                                                    onMouseDown={() => {
                                                                        handleKodeChange(p.kode);
                                                                        setShowKodeSuggest(false);
                                                                    }}
                                                                    className="px-4 py-2.5 cursor-pointer hover:bg-green-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                                                                >
                                                                    <span className="font-mono font-black text-[#990000] text-sm min-w-[80px]">{p.kode}</span>
                                                                    <span className="text-gray-700 text-sm truncate">{p.nama_produk}</span>
                                                                </li>
                                                            ))
                                                        }
                                                        {[...pricelist, ...offlinePricelist].filter(p =>
                                                            !kodeProduk ||
                                                            p.kode?.toLowerCase().includes(kodeProduk.toLowerCase()) ||
                                                            p.nama_produk?.toLowerCase().includes(kodeProduk.toLowerCase())
                                                        ).length === 0 && (
                                                            <li className="px-4 py-3 text-xs text-gray-400 italic text-center">Kode tidak ditemukan di pricelist</li>
                                                        )}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>

                                        {/* Info autofill — readonly */}
                                        {namaBarang && (
                                            <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex flex-wrap gap-4 text-sm">
                                                <div><span className="text-gray-500 text-xs font-semibold">NAMA PRODUK</span><p className="font-bold text-gray-800 mt-0.5">{namaBarang}</p></div>
                                                <div><span className="text-gray-500 text-xs font-semibold">GRUP / BRAND</span><p className="font-bold text-gray-800 mt-0.5">{namaBrand}</p></div>
                                                <div><span className="text-gray-500 text-xs font-semibold">JENIS</span><p className="font-bold text-gray-800 mt-0.5">{kategori}</p></div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Masuk</label>
                                            <input type="date" required value={tanggal} onChange={e => setTanggal(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none transition-all" />
                                        </div>
                                    </div>

                                    {/* TABEL GRID UKURAN */}
                                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mb-6">
                                        <h4 className="font-bold text-gray-800 mb-1 text-sm text-center">Rincian Ukuran, Jumlah Masuk & Reject</h4>
                                        <p className="text-xs text-gray-400 mb-4 text-center">Masukkan kuantitas masuk dan reject (jika ada) untuk masing-masing ukuran.</p>
                                        
                                        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                                                    <tr>
                                                        <th className="p-3 pl-4">Ukuran</th>
                                                        <th className="p-3 text-green-700">Masuk Bersih (Pcs)</th>
                                                        <th className="p-3 pr-4 text-red-600">Reject (Pcs)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 text-sm">
                                                    {sizeItems.map((item, idx) => {
                                                        const existingStock = stokList.find(s => s.nama_barang === namaBarang && s.ukuran === item.ukuran && s.cabang_id === cabangId)?.jumlah || 0;
                                                        return (
                                                            <tr key={item.ukuran} className="hover:bg-gray-50/30 transition-colors">
                                                                <td className="p-3 pl-4 font-bold text-gray-700">
                                                                    {item.ukuran}
                                                                    {namaBarang && (
                                                                        <span className="ml-1 text-[10px] font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full border border-gray-200">
                                                                            Stok: {existingStock}
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="p-3">
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
                                                                        className="w-full border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none transition-all text-green-700 font-bold"
                                                                    />
                                                                </td>
                                                                <td className="p-3 pr-4">
                                                                    <input 
                                                                        type="number" 
                                                                        min="0"
                                                                        max={Number(item.jumlah) || 0}
                                                                        placeholder="0"
                                                                        value={item.jumlah_reject}
                                                                        onChange={e => {
                                                                            const newSizes = [...sizeItems];
                                                                            newSizes[idx].jumlah_reject = e.target.value;
                                                                            setSizeItems(newSizes);
                                                                        }}
                                                                        className="w-full border border-red-200 rounded-lg p-2 focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition-all text-red-600 font-bold"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="bg-gray-50/50">
                                                    <tr className="font-bold text-gray-800 border-t border-gray-200">
                                                        <td className="p-3 pl-4 text-right text-xs uppercase tracking-wider">TOTAL</td>
                                                        <td className="p-3 text-green-600 font-black">
                                                            +{sizeItems.reduce((acc, curr) => acc + (Number(curr.jumlah) || 0), 0)} Pcs
                                                        </td>
                                                        <td className="p-3 pr-4 text-red-600 font-black">
                                                            -{sizeItems.reduce((acc, curr) => acc + (Number(curr.jumlah_reject) || 0), 0)} Pcs
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
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-gray-900 text-white text-[11px] uppercase tracking-wider sticky top-0 z-10">
                                    <tr>
                                        <th className="px-3 py-3 border-r border-gray-700 whitespace-nowrap">TANGGAL</th>
                                        <th className="px-3 py-3 border-r border-gray-700">KODE</th>
                                        <th className="px-3 py-3 border-r border-gray-700">JENIS</th>
                                        <th className="px-3 py-3 border-r border-gray-700">NAMA PRODUK</th>
                                        <th className="px-3 py-3 border-r border-gray-700">BAHAN</th>
                                        {sizesArray.map(sz => (
                                            <th key={sz} className="px-2 py-3 text-center border-r border-gray-700 w-14">{sz}</th>
                                        ))}
                                        <th className="px-3 py-3 text-center border-r border-gray-700 text-green-400">BAGUS</th>
                                        <th className="px-3 py-3 text-center border-r border-gray-700 text-red-400">REJECT</th>
                                        <th className="px-3 py-3 text-center">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredHistory.map((item, idx) => (
                                        <tr key={item.id} className={`border-b border-gray-100 hover:bg-green-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                                            <td className="px-3 py-2.5 whitespace-nowrap text-gray-600 border-r border-gray-100">
                                                {new Date(item.tanggal).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-3 py-2.5 font-bold text-[#990000] border-r border-gray-100 whitespace-nowrap">
                                                {item.kode_produk}
                                            </td>
                                            <td className="px-3 py-2.5 border-r border-gray-100">
                                                <span className="bg-gray-100 text-gray-700 text-[11px] font-bold px-2 py-0.5 rounded-full">{item.kategori}</span>
                                            </td>
                                            <td className="px-3 py-2.5 font-semibold text-gray-800 border-r border-gray-100 whitespace-nowrap">{item.nama_barang}</td>
                                            <td className="px-3 py-2.5 text-gray-500 border-r border-gray-100">{item.bahan}</td>
                                            {sizesArray.map(sz => {
                                                const s = item.sizes[sz];
                                                const bagus = s?.jumlah || 0;
                                                return (
                                                    <td key={sz} className="px-2 py-2.5 text-center border-r border-gray-100 font-bold text-gray-800">
                                                        {bagus > 0 ? <span className="text-green-600">+{bagus}</span> : <span className="text-gray-300 font-normal">-</span>}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-3 py-2.5 text-center font-black text-green-600 text-base border-r border-gray-100">
                                                +{item.total_jumlah}
                                            </td>
                                            <td className="px-3 py-2.5 text-center border-r border-gray-100 relative">
                                                {item.total_reject > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <button 
                                                            onClick={() => setOpenRejectId(openRejectId === item.transaksi_id ? null : item.transaksi_id)}
                                                            className="text-red-600 font-black hover:bg-red-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                                                        >
                                                            -{item.total_reject}
                                                            <ChevronDown size={14} className={`transition-transform ${openRejectId === item.transaksi_id ? 'rotate-180' : ''}`} />
                                                        </button>
                                                        
                                                        {openRejectId === item.transaksi_id && (
                                                            <div className="absolute z-50 bg-white border border-gray-200 shadow-sm rounded px-2 py-1.5 top-full left-1/2 -translate-x-1/2 mt-1 w-max">
                                                                <div className="flex flex-col gap-0.5 text-[10px] text-red-600 font-semibold text-left">
                                                                    {sizesArray.filter(sz => item.sizes[sz]?.reject > 0).map(sz => (
                                                                        <div key={sz}>{sz}: {item.sizes[sz].reject}</div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 font-normal">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button onClick={() => handleEdit(item)}
                                                        className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                                                        title="Edit">
                                                        <Edit size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredHistory.length === 0 && (
                                        <tr><td colSpan={6 + sizesArray.length + 2} className="p-8 text-center text-gray-400">Tidak ada riwayat barang masuk.</td></tr>
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

                                <div className="space-y-2 mb-4">
                                    <div className="grid grid-cols-[80px_1fr_1fr] gap-4 px-2 font-bold text-gray-500 text-[11px] uppercase tracking-wider">
                                        <div>Ukuran</div>
                                        <div className="text-green-700">Masuk Bersih (Pcs)</div>
                                        <div className="text-red-600">Reject (Pcs)</div>
                                    </div>
                                    <div className="max-h-[40vh] overflow-y-auto pr-1">
                                        {sizesArray.map(size => (
                                            <div key={size} className="grid grid-cols-[80px_1fr_1fr] items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2">
                                                <label className="font-bold text-gray-700 text-sm">Ukuran {size}</label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    placeholder="0"
                                                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-100 focus:border-green-600 outline-none transition-all text-green-700 font-bold"
                                                    value={editForm.sizes[size]?.jumlah || ''}
                                                    onChange={e => {
                                                        const newForm = { ...editForm };
                                                        if (!newForm.sizes[size]) newForm.sizes[size] = { jumlah: 0, reject: 0, min: 5 };
                                                        newForm.sizes[size].jumlah = e.target.value;
                                                        setEditForm(newForm);
                                                    }}
                                                />
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    placeholder="0"
                                                    className="w-full border border-red-200 rounded-lg p-2 focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition-all text-red-600 font-bold"
                                                    value={editForm.sizes[size]?.reject || ''}
                                                    onChange={e => {
                                                        const newForm = { ...editForm };
                                                        if (!newForm.sizes[size]) newForm.sizes[size] = { jumlah: 0, reject: 0, min: 5 };
                                                        newForm.sizes[size].reject = e.target.value;
                                                        setEditForm(newForm);
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-500 text-xs uppercase">Total Masuk</span>
                                        <span className="font-black text-green-600 text-lg">
                                            +{sizesArray.reduce((acc, size) => acc + (Number(editForm.sizes[size]?.jumlah) || 0), 0)} Pcs
                                        </span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="font-bold text-gray-500 text-xs uppercase">Total Reject</span>
                                        <span className="font-black text-red-600 text-lg">
                                            -{sizesArray.reduce((acc, size) => acc + (Number(editForm.sizes[size]?.reject) || 0), 0)} Pcs
                                        </span>
                                    </div>
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
