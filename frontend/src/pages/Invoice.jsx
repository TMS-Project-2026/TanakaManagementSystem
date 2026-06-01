import React, { useEffect, useState } from 'react';
import { getInvoices, deleteInvoice, updateInvoice } from '../api/invoiceApi';
import { PlusCircle, Edit, Trash2, Eye, Printer, Download, Search, Filter, Receipt, UserCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const Invoice = () => {
    const [invoices, setInvoices] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCabang, setFilterCabang] = useState('');
    const [loading, setLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        fetchInvoices();
    }, [filterStatus, filterCabang]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await getInvoices({ status: filterStatus, cabang: filterCabang });
            if (res.data.status === 'success') {
                setInvoices(res.data.data);
            }
        } catch (error) {
            console.error("Gagal memuat invoice", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus invoice ini?")) {
            try {
                await deleteInvoice(id);
                fetchInvoices();
            } catch (error) {
                console.error("Gagal menghapus invoice", error);
                alert("Gagal menghapus invoice");
            }
        }
    };

    const formatRupiah = (number) => 'Rp ' + Number(number || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.no_invoice?.toLowerCase().includes(search.toLowerCase()) ||
            inv.nama_pt?.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Lunas': return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">LUNAS</span>;
            case 'Terbit': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">TERBIT</span>;
            case 'Overdue': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">OVERDUE</span>;
            default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">DRAFT</span>;
        }
    };

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div className="border-l-4 border-[#990000] pl-4">
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                                Data <span className="text-[#990000]">Invoice</span>
                            </h1>
                            <p className="text-gray-500 font-medium mt-1">Kelola seluruh tagihan perusahaan dari berbagai cabang.</p>
                        </div>
                        <button
                            onClick={() => navigate('/invoice/create')}
                            className="bg-[#990000] hover:bg-red-800 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 font-semibold"
                        >
                            <PlusCircle size={20} />
                            Buat Invoice
                        </button>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex flex-wrap gap-3 w-full md:w-auto items-center">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari No. Invoice / Nama PT..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none text-sm w-64"
                                />
                            </div>
                            <select
                                value={filterCabang}
                                onChange={(e) => setFilterCabang(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-[#990000] outline-none text-gray-700 bg-gray-50 text-sm"
                            >
                                <option value="">Semua Cabang</option>
                                <option value="PT Banua Mitra Lestari">PT Banua Mitra Lestari</option>
                                <option value="PT Tanaka Rizqi Barokah">PT Tanaka Rizqi Barokah</option>
                                <option value="Accestreet">Accestreet</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-[#990000] outline-none text-gray-700 bg-gray-50 text-sm"
                            >
                                <option value="">Semua Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Terbit">Terbit</option>
                                <option value="Lunas">Lunas</option>
                                <option value="Overdue">Over due</option>
                                <option value="Duedate">Due date</option>
                            </select>
                        </div>
                        <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                            <Receipt size={16} />
                            Total: <span className="font-bold text-gray-900">{filteredInvoices.length} Invoice</span>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold">
                                        <th className="p-4">No Invoice</th>
                                        <th className="p-4">Cabang</th>
                                        <th className="p-4">Customer</th>
                                        <th className="p-4">Tanggal</th>
                                        <th className="p-4">Grand Total</th>
                                        <th className="p-4 text-center">Status</th>
                                        <th className="p-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-400">Memuat data...</td>
                                        </tr>
                                    ) : filteredInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Receipt size={40} className="text-gray-300" />
                                                    <p className="font-medium">Belum ada data invoice</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInvoices.map((item) => (
                                            <tr key={item.id} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                                                <td className="p-4 font-semibold text-gray-800">{item.no_invoice}</td>
                                                <td className="p-4 text-gray-600 text-sm">{item.cabang}</td>
                                                <td className="p-4 text-gray-800 font-medium">{item.nama_pt}</td>
                                                <td className="p-4 text-gray-600 text-sm">
                                                    {new Date(item.tanggal_terbit).toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="p-4 font-bold text-gray-800">{formatRupiah(item.grand_total)}</td>
                                                <td className="p-4 text-center">
                                                    {getStatusBadge(item.status)}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => navigate(`/invoice/preview/${item.id}`)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Preview">
                                                            <Eye size={18} />
                                                        </button>
                                                        <button onClick={() => navigate(`/invoice/edit/${item.id}`)} className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Edit">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
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

export default Invoice;
