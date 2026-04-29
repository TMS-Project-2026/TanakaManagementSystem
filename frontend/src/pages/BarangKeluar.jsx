import React, { useEffect, useState } from 'react';
import { getBarangKeluar, createBarangKeluar, getStok } from '../api/gudangApi';
import { PlusCircle, CheckCircle, AlertCircle, Trash2, Plus } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const BarangKeluar = () => {
    const [history, setHistory] = useState([]);
    const [stokList, setStokList] = useState([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // Form state
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedGroup, setSelectedGroup] = useState('');
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
    const [tujuan, setTujuan] = useState('');
    const [items, setItems] = useState([{ stok_id: '', jumlah: '' }]);

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
        setErrorMsg('');
        
        // Filter out empty rows
        const validItems = items.filter(i => i.stok_id && i.jumlah > 0);
        if (validItems.length === 0) {
            setErrorMsg("Harap masukkan setidaknya satu ukuran beserta jumlahnya.");
            return;
        }

        // Validate local stock limits
        for (const item of validItems) {
            const selectedStok = stokList.find(s => s.id.toString() === item.stok_id);
            if (selectedStok && parseInt(item.jumlah) > selectedStok.jumlah) {
                setErrorMsg(`Stok ukuran ${selectedStok.ukuran || 'Default'} tidak cukup! Maksimal: ${selectedStok.jumlah}`);
                return;
            }
        }

        const transaksi_id = 'TRX-OUT-' + Date.now() + Math.floor(Math.random() * 1000);

        try {
            const promises = validItems.map(item => 
                createBarangKeluar({
                    barang_id: item.stok_id,
                    jumlah: item.jumlah,
                    tanggal: tanggal,
                    tujuan: tujuan,
                    transaksi_id: transaksi_id
                })
            );

            await Promise.all(promises);

            setSuccessMsg('Barang keluar berhasil dicatat! Stok otomatis berkurang.');
            setTimeout(() => setSuccessMsg(''), 3000);
            fetchData();
            
            // Reset form
            setSelectedGroup('');
            setTujuan('');
            setItems([{ stok_id: '', jumlah: '' }]);
        } catch (error) {
            console.error("Gagal catat barang keluar", error);
            setErrorMsg(error.response?.data?.message || "Gagal mencatat barang keluar! (Mungkin stok tidak cukup di database)");
        }
    };

    // Grouping history
    const groupedHistory = history.reduce((acc, curr) => {
        const key = curr.transaksi_id || `${curr.tanggal}|${curr.nama_barang}|${curr.cabang_id}|${curr.tujuan}`;
        if (!acc[key]) {
            acc[key] = {
                id: curr.id,
                tanggal: curr.tanggal,
                nama_barang: curr.nama_barang,
                cabang_id: curr.cabang_id,
                tujuan: curr.tujuan,
                total_jumlah: 0,
                details: []
            };
        }
        acc[key].total_jumlah += curr.jumlah;
        acc[key].details.push(`${curr.ukuran || '-'}: ${curr.jumlah}`);
        return acc;
    }, {});

    const historyList = Object.values(groupedHistory).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

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
                        <form onSubmit={handleCreate}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Brand</label>
                                    <select value={selectedBrand} onChange={e => { setSelectedBrand(e.target.value); setSelectedGroup(''); }} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none bg-white transition-all">
                                        <option value="">-- Semua Brand --</option>
                                        {uniqueBrands.map(brand => (
                                            <option key={brand} value={brand}>{brand}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pilih Produk & Cabang</label>
                                    <select required value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none bg-white transition-all">
                                        <option value="" disabled>-- Pilih Produk --</option>
                                        {uniqueGroups.map(key => {
                                            const [nama, cabang] = key.split('|');
                                            return <option key={key} value={key}>{nama} ({cabang})</option>
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
                                    <input type="date" required value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tujuan / Catatan</label>
                                    <input type="text" placeholder="Catatan Pengeluaran" value={tujuan} onChange={e => setTujuan(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none transition-all" />
                                </div>
                            </div>

                            {selectedGroup && (
                                <div className="bg-white p-5 rounded-xl border border-orange-100 mb-6 shadow-sm">
                                    <h4 className="font-semibold text-gray-700 mb-4">Input Ukuran & Jumlah Keluar</h4>
                                    
                                    {items.map((item, index) => (
                                        <div key={index} className="flex flex-wrap items-end gap-3 mb-3">
                                            <div className="flex-1 min-w-[200px]">
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Pilih Ukuran</label>
                                                <select required value={item.stok_id} onChange={e => handleItemChange(index, 'stok_id', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none bg-white">
                                                    <option value="" disabled>-- Pilih Ukuran --</option>
                                                    {availableSizes.map(s => (
                                                        <option key={s.id} value={s.id} disabled={items.some((i, idx) => i.stok_id == s.id && idx !== index) || s.jumlah === 0}>
                                                            {s.ukuran || 'Default'} - (Sisa Stok: {s.jumlah})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Jml Keluar</label>
                                                <input type="number" required min="1" placeholder="Qty" value={item.jumlah} onChange={e => handleItemChange(index, 'jumlah', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-orange-200 focus:border-orange-500 outline-none" />
                                            </div>
                                            {items.length > 1 && (
                                                <button type="button" onClick={() => handleRemoveItem(index)} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Hapus baris">
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <button type="button" onClick={handleAddItem} className="mt-2 flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-800 transition-colors">
                                        <Plus size={16} /> Tambah Ukuran Lain
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-end pt-4 border-t border-orange-200">
                                <button type="submit" disabled={!selectedGroup} className={`font-bold py-2.5 px-8 rounded-xl shadow-sm transition-all ${selectedGroup ? 'bg-orange-600 hover:bg-orange-700 text-white active:scale-95' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}>
                                    Catat Keluar
                                </button>
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
                                        <th className="p-4 font-semibold">Detail Ukuran</th>
                                        <th className="p-4 font-semibold text-center">Total Keluar</th>
                                        <th className="p-4 font-semibold">Tujuan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyList.map((item) => (
                                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 whitespace-nowrap">{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                            <td className="p-4 font-medium text-gray-800">{item.nama_barang}</td>
                                            <td className="p-4">{item.cabang_id}</td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {item.details.join(', ')}
                                            </td>
                                            <td className="p-4 text-center font-bold text-orange-600">-{item.total_jumlah}</td>
                                            <td className="p-4">{item.tujuan || '-'}</td>
                                        </tr>
                                    ))}
                                    {historyList.length === 0 && (
                                        <tr><td colSpan={6} className="p-6 text-center text-gray-500">Belum ada riwayat barang keluar</td></tr>
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
