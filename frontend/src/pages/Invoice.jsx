import NotificationBell from '../components/NotificationBell';
import { Bell } from 'lucide-react';
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
        <div className="flex bg-gray-50 min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
                {/* TOPBAR */}
                <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Cari No. Invoice / Nama PT..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-6">

          <NotificationBell />
                    <div className="relative">
                      <div className="bg-white p-1.5 rounded-full shadow-sm cursor-pointer hover:shadow-md transition-all border border-gray-100" onClick={() => setShowProfile(!showProfile)}>
                        <UserCircle size={32} className="text-gray-400 hover:text-[#990000] transition-colors" />
                      </div>
                      
                      {showProfile && (
                        <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                          <div className="p-4 bg-red-50/50">
                            <p className="text-sm font-black text-gray-900">Admin</p>
                            <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">Finance</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
                    <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    Data Invoice
                                </h1>
                                <p className="text-gray-500 mt-2 text-sm font-medium">Kelola seluruh tagihan perusahaan dari berbagai cabang.</p>
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
            </div>
        </main>
    </div>
  );

};

export default Invoice;
