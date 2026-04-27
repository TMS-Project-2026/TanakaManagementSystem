import React, { useEffect, useState } from 'react';
import { getInvoices, deleteInvoice, updateInvoice } from '../api/invoiceApi';
import { PlusCircle, Edit, Trash2, Eye, Printer, Download, Search, Filter, Receipt } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';

const Invoice = () => {
    const [invoices, setInvoices] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCabang, setFilterCabang] = useState('');
    const [loading, setLoading] = useState(true);

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

    const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);

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
        <div className="flex bg-[#f8f9fa] min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 border-l-4 border-[#990000] pl-4">Data Invoice</h1>
                            <p className="text-gray-500 mt-2 ml-5">Kelola seluruh tagihan perusahaan dari berbagai cabang.</p>
                        </div>
                        <button
                            onClick={() => navigate('/invoice/create')}
                            className="bg-[#990000] hover:bg-red-800 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 font-semibold"
                        >
                            <PlusCircle size={20} />
                            Buat Invoice
                        </button>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex w-full md:w-auto items-center relative">
                            <Search className="absolute left-3 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari No. Invoice / Nama PT..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg w-full md:w-80 focus:ring-2 focus:ring-red-100 focus:border-[#990000] outline-none transition-all"
                            />
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                            <select
                                value={filterCabang}
                                onChange={(e) => setFilterCabang(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#990000] outline-none text-gray-700 bg-white"
                            >
                                <option value="">Semua Cabang</option>
                                <option value="Banua">Banua</option>
                                <option value="Tanaka">Tanaka</option>
                                <option value="Acestreet">Acestreet</option>
                            </select>

                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#990000] outline-none text-gray-700 bg-white"
                            >
                                <option value="">Semua Status</option>
                                <option value="Draft">Draft</option>
                                <option value="Terbit">Terbit</option>
                                <option value="Lunas">Lunas</option>
                                <option value="Overdue">Over due</option>
                                <option value="Duedate">Due date</option>
                            </select>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                                        <th className="p-4 font-semibold">NO INVOICE</th>
                                        <th className="p-4 font-semibold">CABANG</th>
                                        <th className="p-4 font-semibold">CUSTOMER</th>
                                        <th className="p-4 font-semibold">TANGGAL</th>
                                        <th className="p-4 font-semibold">GRAND TOTAL</th>
                                        <th className="p-4 font-semibold text-center">STATUS</th>
                                        <th className="p-4 font-semibold text-center">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-400">Memuat data...</td>
                                        </tr>
                                    ) : filteredInvoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="p-8 text-center text-gray-400 flex flex-col items-center">
                                                <Receipt size={40} className="mb-2 text-gray-300" />
                                                Belum ada data invoice
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredInvoices.map((item) => (
                                            <tr key={item.id} className="border-b border-gray-50 hover:bg-red-50/30 transition-colors">
                                                <td className="p-4 font-semibold text-gray-800">{item.no_invoice}</td>
                                                <td className="p-4 text-gray-600">{item.cabang}</td>
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
