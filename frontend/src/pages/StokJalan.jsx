import React, { useEffect, useState } from 'react';
import { getStokJalan, createStokJalan, updateStokJalan, deleteStokJalan } from '../api/stokJalanApi';
import { Search, Filter, Plus, Edit, Trash2, X, Layers, Calendar, UserCircle, Trash } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

const StokJalan = () => {
    const [dataStokJalan, setDataStokJalan] = useState([]);
    const [pricelist, setPricelist] = useState([]);
    const [offlinePricelist, setOfflinePricelist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [showProfile, setShowProfile] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    
    const [form, setForm] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        nama_barang: '',
        nomer_barang: '',
        status: 'Dalam Proses',
        rawItems: []
    });

    const [formSizes, setFormSizes] = useState([
        { ukuran: 'S', stok_total: 0, wo: 0, proses_jahit: 0, bordir: 0, finishing: 0 }
    ]);

    const sizesArray = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

    useEffect(() => {
        fetchStokJalan();
        fetchPricelist();
    }, []);

    const fetchStokJalan = async () => {
        setLoading(true);
        try {
            const res = await getStokJalan();
            if (res.data.status === 'success') {
                setDataStokJalan(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat data stok jalan:", error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                // Delete all old raw items to prevent size duplicates, then re-insert updated values
                await Promise.all(form.rawItems.map(item => deleteStokJalan(item.id)));
            }
            
            // Insert all entered sizes
            const promises = formSizes.map(sz => {
                const payload = {
                    tanggal: form.tanggal,
                    nama_barang: form.nama_barang,
                    nomer_barang: form.nomer_barang,
                    ukuran: sz.ukuran,
                    stok_total: Number(sz.stok_total) || 0,
                    wo: Number(sz.wo) || 0,
                    proses_jahit: Number(sz.proses_jahit) || 0,
                    bordir: Number(sz.bordir) || 0,
                    finishing: Number(sz.finishing) || 0,
                    status: form.status
                };
                return createStokJalan(payload);
            });
            await Promise.all(promises);
            
            await fetchStokJalan();
            resetForm();
        } catch (error) {
            console.error("Gagal menyimpan data stok jalan:", error);
            alert("Gagal menyimpan data! Periksa koneksi atau inputan Anda.");
        }
    };

    const handleEditGroup = (item) => {
        setIsEdit(true);
        setForm({
            tanggal: item.tanggal ? item.tanggal.split('T')[0] : new Date().toISOString().split('T')[0],
            nama_barang: item.nama_barang || '',
            nomer_barang: item.nomer_barang || '',
            status: item.status || 'Dalam Proses',
            rawItems: item.rawItems
        });
        
        // Map raw database items to formSizes array
        const mappedSizes = item.rawItems.map(r => ({
            ukuran: r.ukuran || 'S',
            stok_total: r.stok_total || 0,
            wo: r.wo || 0,
            proses_jahit: r.proses_jahit || 0,
            bordir: r.bordir || 0,
            finishing: r.finishing || 0
        }));
        
        setFormSizes(mappedSizes.length > 0 ? mappedSizes : [{ ukuran: 'S', stok_total: 0, wo: 0, proses_jahit: 0, bordir: 0, finishing: 0 }]);
        setShowModal(true);
    };

    const handleDeleteGroup = async (item) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus seluruh data produksi untuk barang "${item.nama_barang}"?`)) {
            try {
                await Promise.all(item.rawItems.map(r => deleteStokJalan(r.id)));
                fetchStokJalan();
            } catch (error) {
                console.error("Gagal menghapus data stok jalan:", error);
            }
        }
    };

    const resetForm = () => {
        setIsEdit(false);
        setForm({
            tanggal: new Date().toISOString().split('T')[0],
            nama_barang: '',
            nomer_barang: '',
            status: 'Dalam Proses',
            rawItems: []
        });
        setFormSizes([
            { ukuran: 'S', stok_total: 0, wo: 0, proses_jahit: 0, bordir: 0, finishing: 0 }
        ]);
        setShowModal(false);
    };

    // Form Sizes Row Management
    const handleAddSizeRow = () => {
        setFormSizes([...formSizes, { ukuran: 'S', stok_total: 0, wo: 0, proses_jahit: 0, bordir: 0, finishing: 0 }]);
    };

    const handleRemoveSizeRow = (index) => {
        if (formSizes.length > 1) {
            setFormSizes(formSizes.filter((_, i) => i !== index));
        }
    };

    const handleSizeFieldChange = (index, field, value) => {
        const updated = [...formSizes];
        updated[index][field] = value;
        setFormSizes(updated);
    };

    // Group database rows by Name + SKU
    const groupedData = Object.values(dataStokJalan.reduce((acc, curr) => {
        const nameKey = (curr.nama_barang || '').trim().toLowerCase();
        const codeKey = (curr.nomer_barang || '').trim().toLowerCase();
        const key = `${nameKey}|${codeKey}`;
        
        if (!acc[key]) {
            acc[key] = {
                id: curr.id,
                tanggal: curr.tanggal,
                nama_barang: curr.nama_barang,
                nomer_barang: curr.nomer_barang,
                status: curr.status,
                rawItems: [],
                stok_total: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 },
                wo: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 },
                proses_jahit: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 },
                bordir: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 },
                finishing: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 },
                total_stok_all: 0
            };
        }
        acc[key].rawItems.push(curr);
        
        const sz = (curr.ukuran || '').toUpperCase();
        if (acc[key].stok_total[sz] !== undefined) {
            acc[key].stok_total[sz] = Number(curr.stok_total) || 0;
            acc[key].wo[sz] = Number(curr.wo) || 0;
            acc[key].proses_jahit[sz] = Number(curr.proses_jahit) || 0;
            acc[key].bordir[sz] = Number(curr.bordir) || 0;
            acc[key].finishing[sz] = Number(curr.finishing) || 0;
            acc[key].total_stok_all += Number(curr.stok_total) || 0;
        }
        
        // Take latest date
        if (new Date(curr.tanggal) > new Date(acc[key].tanggal)) {
            acc[key].tanggal = curr.tanggal;
        }
        // Take latest status
        acc[key].status = curr.status;
        return acc;
    }, {}));

    const allPricelistItems = [...pricelist, ...offlinePricelist];
    const finalStokJalanList = groupedData;

    const filteredData = finalStokJalanList.filter(item => {
        const matchesSearch = 
            (item.nama_barang || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.nomer_barang || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus ? item.status === filterStatus : true;
        return matchesSearch && matchesStatus;
    });

    // Recommendations lists from official pricelist
    const uniqueItems = Array.from(new Set(allPricelistItems.map(item => item.nama_produk).filter(Boolean)));
    const uniqueCodes = Array.from(new Set(allPricelistItems.map(item => item.kode).filter(Boolean)));
    const uniqueStatuses = Array.from(new Set(dataStokJalan.map(item => item.status).filter(Boolean)));

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
                            placeholder="Cari nama atau nomor barang..."
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
                        {/* Header Title & Add Button */}
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight flex items-center gap-3">
                                    <div className="bg-red-50 border border-red-100 p-2 rounded-lg shadow-sm">
                                        <Layers className="text-red-600" size={20} />
                                    </div>
                                    Stok Jalan & Produksi
                                </h1>
                                <p className="text-sm text-gray-500 mt-2 font-medium">Pelacakan sebaran ukuran proses produksi seragam (Work Order, Jahit, Bordir, Finishing) di semua cabang</p>
                            </div>
                            <button
                                onClick={() => { resetForm(); setShowModal(true); }}
                                className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-red-700 hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
                            >
                                <Plus size={18} className="text-white" /> Tambah Stok Jalan
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap gap-4 items-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <div className="flex items-center gap-2">
                                <Filter size={16} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filter Status:</span>
                            </div>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="border border-gray-300 rounded-lg py-1.5 px-3 focus:ring-red-500 focus:border-red-500 bg-white text-xs font-semibold text-gray-700"
                            >
                                <option value="">Semua Status</option>
                                {uniqueStatuses.map(st => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                        </div>

                        {/* Main Grid Table (Sama Persis Spreadsheet) */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-center border-collapse whitespace-nowrap">
                                    <thead className="bg-gray-900 text-[10px] text-white uppercase tracking-wider font-semibold sticky top-0 z-10 shadow-sm text-center">
                                        {/* Row 1 */}
                                        <tr>
                                            <th rowSpan="2" className="p-3 font-bold text-center border-b border-gray-800">No</th>
                                            <th rowSpan="2" className="p-3 font-bold border-b border-gray-800 text-left">Tanggal</th>
                                            <th rowSpan="2" className="p-3 font-bold border-b border-gray-800 text-left">KODE</th>
                                            <th rowSpan="2" className="p-3 font-bold border-b border-gray-800 text-left">JENIS / KATEGORI</th>
                                            <th rowSpan="2" className="p-3 font-bold border-b border-gray-800 text-left">NAMA PRODUK</th>
                                            <th rowSpan="2" className="p-3 font-bold border-b border-gray-800 text-left">BAHAN</th>
                                            
                                            {/* Sections */}
                                            <th colSpan="8" className="p-2 text-center bg-red-800 text-white border-x border-red-700 text-[11px] font-black">STOK TOTAL</th>
                                            <th colSpan="7" className="p-2 text-center bg-green-800 text-white border-x border-green-700 text-[11px] font-black">WO Target</th>
                                            <th colSpan="7" className="p-2 text-center bg-yellow-600 text-white border-x border-yellow-500 text-[11px] font-black">PROSES JAHIT</th>
                                            <th colSpan="7" className="p-2 text-center bg-purple-800 text-white border-x border-purple-700 text-[11px] font-black">BORDIR</th>
                                            <th colSpan="7" className="p-2 text-center bg-blue-800 text-white border-x border-blue-700 text-[11px] font-black">FINISHING</th>
                                            
                                            <th rowSpan="2" className="p-3 font-bold text-center border-b border-gray-800">Status</th>
                                            <th rowSpan="2" className="p-3 font-bold text-center border-b border-gray-800">Aksi</th>
                                        </tr>
                                        {/* Row 2 */}
                                        <tr>
                                            {/* STOK TOTAL sub-headers */}
                                            {sizesArray.map(sz => (
                                                <th key={`st-${sz}`} className="p-1.5 text-center bg-red-900/90 text-red-100 border-x border-red-800 w-10 font-black">{sz}</th>
                                            ))}
                                            <th className="p-1.5 text-center bg-red-950 text-white font-black border-x border-red-900 w-16">TOTAL</th>

                                            {/* WO sub-headers */}
                                            {sizesArray.map(sz => (
                                                <th key={`wo-${sz}`} className="p-1.5 text-center bg-green-900 text-green-100 border-x border-green-800 w-10 font-black">{sz}</th>
                                            ))}

                                            {/* JAHIT sub-headers */}
                                            {sizesArray.map(sz => (
                                                <th key={`jh-${sz}`} className="p-1.5 text-center bg-yellow-700 text-yellow-100 border-x border-yellow-600 w-10 font-black">{sz}</th>
                                            ))}

                                            {/* BORDIR sub-headers */}
                                            {sizesArray.map(sz => (
                                                <th key={`bd-${sz}`} className="p-1.5 text-center bg-purple-900 text-purple-100 border-x border-purple-800 w-10 font-black">{sz}</th>
                                            ))}

                                            {/* FINISHING sub-headers */}
                                            {sizesArray.map(sz => (
                                                <th key={`fn-${sz}`} className="p-1.5 text-center bg-blue-900 text-blue-100 border-x border-blue-800 w-10 font-black">{sz}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[11px]">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6 + 7 * 5 + 3} className="p-8 text-center text-gray-500 font-medium">Memuat data stok jalan...</td>
                                            </tr>
                                        ) : filteredData.length === 0 ? (
                                            <tr>
                                                <td colSpan={6 + 7 * 5 + 3} className="p-8 text-center text-gray-500 font-medium">Tidak ada data stok jalan ditemukan.</td>
                                            </tr>
                                        ) : (
                                            filteredData.map((item, idx) => {
                                                let statusColor = "bg-gray-100 text-gray-700 border-gray-200";
                                                const lowerStatus = (item.status || '').toLowerCase();
                                                
                                                if (lowerStatus.includes('selesai')) {
                                                    statusColor = "bg-green-100 text-green-800 border-green-200 font-black";
                                                } else if (lowerStatus.includes('jahit')) {
                                                    statusColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
                                                } else if (lowerStatus.includes('bordir')) {
                                                    statusColor = "bg-purple-100 text-purple-800 border-purple-200";
                                                } else if (lowerStatus.includes('finishing')) {
                                                    statusColor = "bg-blue-100 text-blue-800 border-blue-200";
                                                } else if (lowerStatus.includes('proses')) {
                                                    statusColor = "bg-red-100 text-red-800 border-red-200";
                                                } else {
                                                    statusColor = "bg-red-50 text-red-700 border-red-100";
                                                }

                                                const itemKode = item.nomer_barang?.toUpperCase().trim();
                                                const itemNama = item.nama_barang?.toLowerCase().trim();

                                                const matchOnline = pricelist.find(p => 
                                                    (itemKode && p.kode?.toUpperCase().trim() === itemKode) ||
                                                    (itemNama && p.nama_produk?.toLowerCase().trim() === itemNama)
                                                );
                                                const matchOffline = offlinePricelist.find(p => 
                                                    (itemKode && p.kode?.toUpperCase().trim() === itemKode) ||
                                                    (itemNama && p.nama_produk?.toLowerCase().trim() === itemNama)
                                                );
                                                const match = matchOnline || matchOffline;
                                                
                                                const displayKode = match ? match.kode : (item.nomer_barang || '-');
                                                const displayJenis = match ? (match.jenis || match.kategori) : '-';
                                                const displayNama = match ? match.nama_produk : item.nama_barang;
                                                const displayBahan = match ? (match.bahan || '-') : '-';

                                                return (
                                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-2 text-center font-bold text-gray-400 border-r border-gray-100">{idx + 1}</td>
                                                        <td className="p-2 font-semibold text-gray-700 text-left border-r border-gray-100">
                                                            {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                        </td>
                                                        <td className="p-2 font-bold text-[#990000] text-left border-r border-gray-100">{displayKode}</td>
                                                        <td className="p-2 text-gray-600 text-left border-r border-gray-100">
                                                            <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{displayJenis}</span>
                                                        </td>
                                                        <td className="p-2 font-black text-gray-900 text-left border-r border-gray-100 max-w-xs overflow-hidden text-ellipsis">{displayNama}</td>
                                                        <td className="p-2 text-gray-500 text-left border-r border-gray-100">{displayBahan}</td>
                                                        
                                                        {/* STOK TOTAL columns */}
                                                        {sizesArray.map(sz => {
                                                            const val = item.stok_total[sz] || 0;
                                                            return (
                                                                <td key={`st-${sz}`} className="p-2 text-center bg-red-50/10 border-x border-gray-100 font-extrabold text-red-700">
                                                                    {val > 0 ? val : <span className="text-gray-300 font-normal">-</span>}
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-2 text-center bg-red-100 font-black text-red-900 border-r border-gray-200 text-xs">
                                                            {item.total_stok_all > 0 ? item.total_stok_all : '-'}
                                                        </td>

                                                        {/* WO TARGET columns */}
                                                        {sizesArray.map(sz => {
                                                            const val = item.wo[sz] || 0;
                                                            return (
                                                                <td key={`wo-${sz}`} className="p-2 text-center bg-green-50/10 border-x border-gray-100 font-extrabold text-green-700">
                                                                    {val > 0 ? val : <span className="text-gray-300 font-normal">-</span>}
                                                                </td>
                                                            );
                                                        })}

                                                        {/* PROSES JAHIT columns */}
                                                        {sizesArray.map(sz => {
                                                            const val = item.proses_jahit[sz] || 0;
                                                            return (
                                                                <td key={`jh-${sz}`} className="p-2 text-center bg-yellow-50/10 border-x border-gray-100 font-extrabold text-yellow-700">
                                                                    {val > 0 ? val : <span className="text-gray-300 font-normal">-</span>}
                                                                </td>
                                                            );
                                                        })}

                                                        {/* BORDIR columns */}
                                                        {sizesArray.map(sz => {
                                                            const val = item.bordir[sz] || 0;
                                                            return (
                                                                <td key={`bd-${sz}`} className="p-2 text-center bg-purple-50/10 border-x border-gray-100 font-extrabold text-purple-700">
                                                                    {val > 0 ? val : <span className="text-gray-300 font-normal">-</span>}
                                                                </td>
                                                            );
                                                        })}

                                                        {/* FINISHING columns */}
                                                        {sizesArray.map(sz => {
                                                            const val = item.finishing[sz] || 0;
                                                            return (
                                                                <td key={`fn-${sz}`} className="p-2 text-center bg-blue-50/10 border-x border-gray-100 font-extrabold text-blue-700">
                                                                    {val > 0 ? val : <span className="text-gray-300 font-normal">-</span>}
                                                                </td>
                                                            );
                                                        })}
                                                        
                                                        {/* Status Badge */}
                                                        <td className="p-2 text-center border-l border-gray-200">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusColor}`}>
                                                                {item.status}
                                                            </span>
                                                        </td>
                                                        
                                                        {/* Actions */}
                                                        <td className="p-2 text-center border-l border-gray-100">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => handleEditGroup(item)}
                                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                                                                    title="Edit Data"
                                                                >
                                                                    <Edit size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteGroup(item)}
                                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                                                                    title="Hapus Data"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL ADD / EDIT DATA */}
                {showModal && (
                    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white w-full max-w-4xl rounded-2xl p-6 sm:p-8 shadow-xl overflow-y-auto max-h-[95vh] animate-in zoom-in-95 duration-200 border border-gray-100">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Data Stok Jalan' : 'Tambah Stok Jalan Baru'}</h2>
                                    <p className="text-xs text-gray-500 mt-1">Isi kuantitas pengerjaan untuk setiap ukuran.</p>
                                </div>
                                <button type="button" onClick={resetForm} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><X size={20} /></button>
                            </div>
                            
                            <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="date"
                                                required
                                                value={form.tanggal}
                                                onChange={e => setForm({...form, tanggal: e.target.value})}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Barang</label>
                                        <input
                                            type="text"
                                            placeholder="Nama seragam / produk"
                                            required
                                            list="item-list"
                                            value={form.nama_barang}
                                            onChange={e => setForm({...form, nama_barang: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all text-sm"
                                        />
                                        <datalist id="item-list">
                                            {uniqueItems.map(item => <option key={item} value={item} />)}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">No Barang (SKU Code)</label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: TAN0062"
                                            list="sku-list"
                                            value={form.nomer_barang}
                                            onChange={e => setForm({...form, nomer_barang: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all text-sm"
                                        />
                                        <datalist id="sku-list">
                                            {uniqueCodes.map(code => <option key={code} value={code} />)}
                                        </datalist>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                            <Layers size={14} className="text-red-600" />
                                            Detail Ukuran & Tahapan Produksi
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleAddSizeRow}
                                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-1 px-3 rounded-lg border border-red-200 transition-all active:scale-95 flex items-center gap-1"
                                        >
                                            + Tambah Ukuran
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {formSizes.map((sz, index) => (
                                            <div key={index} className="grid grid-cols-2 sm:grid-cols-7 gap-3 items-end bg-white p-3 rounded-lg border border-gray-200 relative group">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Ukuran</label>
                                                    <select
                                                        value={sz.ukuran}
                                                        onChange={e => handleSizeFieldChange(index, 'ukuran', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg p-1.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none bg-white text-xs font-bold text-gray-800"
                                                    >
                                                        {sizesArray.map(szOption => (
                                                            <option key={szOption} value={szOption}>{szOption}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-red-600 mb-1">Stok Total</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={sz.stok_total}
                                                        onChange={e => handleSizeFieldChange(index, 'stok_total', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg p-1.5 focus:ring-2 focus:ring-red-100 outline-none text-xs font-semibold text-red-700 text-center"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-green-600 mb-1">WO Target</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={sz.wo}
                                                        onChange={e => handleSizeFieldChange(index, 'wo', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg p-1.5 focus:ring-2 focus:ring-green-100 outline-none text-xs font-semibold text-green-700 text-center"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-yellow-600 mb-1">Jahit</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={sz.proses_jahit}
                                                        onChange={e => handleSizeFieldChange(index, 'proses_jahit', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg p-1.5 focus:ring-2 focus:ring-yellow-100 outline-none text-xs font-semibold text-yellow-600 text-center"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-purple-600 mb-1">Bordir</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={sz.bordir}
                                                        onChange={e => handleSizeFieldChange(index, 'bordir', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg p-1.5 focus:ring-2 focus:ring-purple-100 outline-none text-xs font-semibold text-purple-600 text-center"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-blue-600 mb-1">Finishing</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={sz.finishing}
                                                        onChange={e => handleSizeFieldChange(index, 'finishing', e.target.value)}
                                                        className="w-full border border-gray-300 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-100 outline-none text-xs font-semibold text-blue-600 text-center"
                                                    />
                                                </div>
                                                <div className="flex justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSizeRow(index)}
                                                        disabled={formSizes.length === 1}
                                                        className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors border border-red-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold w-full sm:w-auto"
                                                        title="Hapus baris ukuran"
                                                    >
                                                        <Trash size={14} className="mx-auto" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status Produksi (Ketik Manual)</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Proses Jahit, Kirim ke Tanaka, WO 8DES 2025"
                                        required
                                        list="status-list"
                                        value={form.status}
                                        onChange={e => setForm({...form, status: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-100 focus:border-red-600 outline-none transition-all text-sm font-bold text-gray-700 bg-white"
                                    />
                                    <datalist id="status-list">
                                        <option value="Dalam Proses" />
                                        <option value="Proses Jahit" />
                                        <option value="Bordir" />
                                        <option value="Finishing" />
                                        <option value="Selesai" />
                                    </datalist>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-5 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors text-sm"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl shadow-sm transition-all active:scale-95 text-sm"
                                    >
                                        {isEdit ? 'Simpan Perubahan' : 'Simpan Barang'}
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

export default StokJalan;
