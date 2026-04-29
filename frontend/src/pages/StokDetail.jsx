import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getStok, getBarangMasuk, getBarangKeluar } from '../api/gudangApi';
import { ArrowLeft } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const StokDetail = () => {
    const [searchParams] = useSearchParams();
    const brandParam = searchParams.get('brand') || '';
    const nama_barang = searchParams.get('barang') || '';
    const cabang_id = searchParams.get('cabang') || '';
    
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    
    const [stokData, setStokData] = useState([]);
    const [historyMasuk, setHistoryMasuk] = useState([]);
    const [historyKeluar, setHistoryKeluar] = useState([]);

    useEffect(() => {
        fetchData();
    }, [nama_barang, cabang_id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [resStok, resMasuk, resKeluar] = await Promise.all([
                getStok(),
                getBarangMasuk(),
                getBarangKeluar()
            ]);

            if (resStok.data.status === 'success') {
                const filteredStok = resStok.data.data.filter(s => 
                    (s.nama_brand || '').toLowerCase() === brandParam.toLowerCase() &&
                    (s.nama_barang || '').toLowerCase() === nama_barang.toLowerCase() && 
                    (s.cabang_id || '').toLowerCase() === cabang_id.toLowerCase()
                );
                setStokData(filteredStok);
            }
            if (resMasuk.data.status === 'success') {
                const filteredMasuk = resMasuk.data.data.filter(s => 
                    (s.nama_brand || '').toLowerCase() === brandParam.toLowerCase() &&
                    (s.nama_barang || '').toLowerCase() === nama_barang.toLowerCase() && 
                    (s.cabang_id || '').toLowerCase() === cabang_id.toLowerCase()
                );
                setHistoryMasuk(filteredMasuk);
            }
            if (resKeluar.data.status === 'success') {
                const filteredKeluar = resKeluar.data.data.filter(s => 
                    (s.nama_brand || '').toLowerCase() === brandParam.toLowerCase() &&
                    (s.nama_barang || '').toLowerCase() === nama_barang.toLowerCase() && 
                    (s.cabang_id || '').toLowerCase() === cabang_id.toLowerCase()
                );
                setHistoryKeluar(filteredKeluar);
            }
        } catch (error) {
            console.error("Gagal memuat data detail", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex bg-[#f3f4f6] min-h-screen items-center justify-center">Loading...</div>;
    }

    const firstItem = stokData[0] || {};
    const brand = firstItem.nama_brand || '-';
    const rak = firstItem.kode_rak || '-';

    // 1. Identify all unique sizes
    // We sort sizes logically: XS, S, M, L, XL, XXL, XXXL...
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL', 'XXXXXL'];
    const uniqueSizes = Array.from(new Set(stokData.map(s => s.ukuran).filter(Boolean)));
    uniqueSizes.sort((a, b) => {
        const indexA = sizeOrder.indexOf(a);
        const indexB = sizeOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    // 2. Build STOK AKHIR map
    const stokAkhir = {};
    uniqueSizes.forEach(size => {
        const item = stokData.find(s => s.ukuran === size);
        stokAkhir[size] = item ? item.jumlah : 0;
    });

    // 3. Build Timeline (History)
    const timelineMap = {}; // Key: "tanggal|keterangan"

    // Process Masuk
    historyMasuk.forEach(item => {
        const dateStr = new Date(item.tanggal).toISOString().split('T')[0];
        const key = `${dateStr}|${item.supplier || '-'}`;
        if (!timelineMap[key]) {
            timelineMap[key] = { tanggal: dateStr, keterangan: item.supplier || 'Barang Masuk', sizes: {} };
        }
        if (!timelineMap[key].sizes[item.ukuran]) {
            timelineMap[key].sizes[item.ukuran] = { M: 0, K: 0 };
        }
        timelineMap[key].sizes[item.ukuran].M += item.jumlah;
    });

    // Process Keluar
    historyKeluar.forEach(item => {
        const dateStr = new Date(item.tanggal).toISOString().split('T')[0];
        const key = `${dateStr}|${item.tujuan || '-'}`;
        if (!timelineMap[key]) {
            timelineMap[key] = { tanggal: dateStr, keterangan: item.tujuan || 'Barang Keluar', sizes: {} };
        }
        if (!timelineMap[key].sizes[item.ukuran]) {
            timelineMap[key].sizes[item.ukuran] = { M: 0, K: 0 };
        }
        timelineMap[key].sizes[item.ukuran].K += item.jumlah;
    });

    const timelineData = Object.values(timelineMap).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); // Terbaru di atas

    return (
        <div className="flex bg-[#f3f4f6] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100">
                    <button onClick={() => navigate('/stok')} className="mb-6 flex items-center gap-2 text-gray-600 hover:text-red-600 font-semibold transition-colors">
                        <ArrowLeft size={20} /> Kembali ke Stok
                    </button>

                    <div className="mb-6 flex justify-between items-end border-b border-gray-200 pb-4">
                        <div>
                            <h2 className="text-xl text-gray-500 font-semibold">{brand}</h2>
                            <h1 className="text-3xl font-bold text-gray-800">{nama_barang} ({cabang_id})</h1>
                        </div>
                        <div className="text-right">
                            <span className="text-gray-500 font-semibold block">Kode Rak</span>
                            <span className="text-2xl font-bold text-red-600">{rak}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-center border-collapse">
                                <thead>
                                    {/* Header Row 1 */}
                                    <tr className="bg-black text-white">
                                        <th className="p-2 border border-gray-700" colSpan={2}>
                                            {(brandParam || brand).toUpperCase()} - {nama_barang.toUpperCase()}
                                        </th>
                                        {uniqueSizes.length > 0 && (
                                            <th className="p-2 border border-gray-700" colSpan={uniqueSizes.length * 2}>
                                                UKURAN
                                            </th>
                                        )}
                                    </tr>
                                    {/* Header Row 2 */}
                                    <tr className="bg-black text-white text-sm">
                                        <th className="p-2 border border-gray-700">Keterangan</th>
                                        <th className="p-2 border border-gray-700">TANGGAL</th>
                                        {uniqueSizes.map(size => (
                                            <th key={size} className="p-2 border border-gray-700" colSpan={2}>{size}</th>
                                        ))}
                                    </tr>
                                    {/* Header Row 3 (K/M) */}
                                    <tr className="bg-gray-200 text-gray-800 text-xs">
                                        <th className="p-1 border border-gray-400 bg-gray-400 text-white" colSpan={2}>STOK AKHIR</th>
                                        {uniqueSizes.map(size => (
                                            <React.Fragment key={`${size}-km`}>
                                                <th className="p-1 border border-gray-400 w-12">K</th>
                                                <th className="p-1 border border-gray-400 w-12">M</th>
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Row: STOK AKHIR */}
                                    <tr className="font-bold text-lg bg-gray-50">
                                        <td className="p-2 border border-gray-300 text-left" colSpan={2}>{rak}</td>
                                        {uniqueSizes.map(size => (
                                            <React.Fragment key={`${size}-akhir`}>
                                                <td className="p-2 border border-gray-300"></td>
                                                <td className="p-2 border border-gray-300">{stokAkhir[size]}</td>
                                            </React.Fragment>
                                        ))}
                                    </tr>

                                    {/* Rows: History */}
                                    {timelineData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-red-50 transition-colors">
                                            <td className="p-2 border border-gray-300 text-left text-sm text-gray-600">{row.keterangan}</td>
                                            <td className="p-2 border border-gray-300 font-semibold">{new Date(row.tanggal).toLocaleDateString('id-ID')}</td>
                                            {uniqueSizes.map(size => {
                                                const data = row.sizes[size];
                                                const valK = data && data.K > 0 ? data.K : '';
                                                const valM = data && data.M > 0 ? data.M : '';
                                                
                                                // Warna dari Excel
                                                const bgK = valK ? 'bg-red-300 font-bold' : '';
                                                const bgM = valM ? 'bg-green-300 font-bold' : '';

                                                return (
                                                    <React.Fragment key={`${size}-data`}>
                                                        <td className={`p-2 border border-gray-300 ${bgK}`}>{valK}</td>
                                                        <td className={`p-2 border border-gray-300 ${bgM}`}>{valM}</td>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </tr>
                                    ))}

                                    {timelineData.length === 0 && (
                                        <tr>
                                            <td colSpan={2 + (uniqueSizes.length * 2)} className="p-6 text-center text-gray-500">
                                                Belum ada riwayat transaksi masuk atau keluar.
                                            </td>
                                        </tr>
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

export default StokDetail;
