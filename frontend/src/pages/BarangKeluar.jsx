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

    const userRole = (JSON.parse(localStorage.getItem('user')) || {}).role || '';

    // Form state
    const [namaBrand, setNamaBrand] = useState('');
    const [namaBarang, setNamaBarang] = useState('');
    const [cabangId, setCabangId] = useState(userRole === 'gudang_accestret' ? 'Acestreet' : 'Tanaka');
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
            if (resBK.data.status === 'success') {
                let data = resBK.data.data;
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
            setCabangId(userRole === 'gudang_accestret' ? 'Acestreet' : 'Tanaka');
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
                                    <Upload className="text-red-600" size={20} />
                                </div>
                                Barang Keluar
                            </h1>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Catat pengeluaran stok barang massal dengan validasi instan level stok</p>
                        </div>

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
