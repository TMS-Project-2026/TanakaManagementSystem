import NotificationBell from '../components/NotificationBell';
import { Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, AlertTriangle, FileText, UserCircle, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { accountApi } from '../api/accountApi';

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    id: null,
    account_code: '',
    account_name: '',
    category: 'Current Assets',
    normal_balance: 'Debit',
    branch: 'All Branches',
    status: 'Active'
  });

  const categories = ['Current Assets', 'Fixed Assets', 'Liabilities', 'Equity', 'Revenue', 'Cost of Goods Sold', 'Expenses'];
  const categoryLabels = {
    'Current Assets': '1 — ASET LANCAR',
    'Fixed Assets': '1 — ASET TETAP',
    'Liabilities': '2 — KEWAJIBAN',
    'Equity': '3 — MODAL (EKUITAS)',
    'Revenue': '4 — PENDAPATAN / PENJUALAN',
    'Cost of Goods Sold': '5 — HARGA POKOK PENJUALAN',
    'Expenses': '6 — BIAYA-BIAYA'
  };
  const categoryColors = {
    'Current Assets': 'bg-blue-50 text-blue-800 border-blue-200',
    'Fixed Assets': 'bg-indigo-50 text-indigo-800 border-indigo-200',
    'Liabilities': 'bg-orange-50 text-orange-800 border-orange-200',
    'Equity': 'bg-purple-50 text-purple-800 border-purple-200',
    'Revenue': 'bg-green-50 text-green-800 border-green-200',
    'Cost of Goods Sold': 'bg-yellow-50 text-yellow-800 border-yellow-200',
    'Expenses': 'bg-red-50 text-red-800 border-red-200'
  };
  const branches = ['All Branches', 'Banua', 'Tanaka', 'Acestreet'];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await accountApi.getAllAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to fetch accounts', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await accountApi.updateAccount(formData.id, formData);
      } else {
        await accountApi.createAccount(formData);
      }
      setShowModal(false);
      fetchAccounts();
      setFormData({
        id: null, account_code: '', account_name: '', category: 'Current Assets', 
        normal_balance: 'Debit', branch: 'All Branches', status: 'Active'
      });
    } catch (error) {
      alert(error.response?.data?.error || 'Terjadi kesalahan');
    }
  };

  const handleEdit = (acc) => {
    setFormData(acc);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus akun ini?')) {
      try {
        await accountApi.deleteAccount(id);
        fetchAccounts();
      } catch (error) {
        console.error('Failed to delete', error);
      }
    }
  };

  const handleToggleStatus = async (acc) => {
    try {
      const updated = { ...acc, status: acc.status === 'Active' ? 'Inactive' : 'Active' };
      await accountApi.updateAccount(acc.id, updated);
      fetchAccounts();
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const query = searchTerm.toLowerCase();
    return (
      acc.account_code?.toLowerCase().includes(query) ||
      acc.account_name?.toLowerCase().includes(query) ||
      acc.category?.toLowerCase().includes(query) ||
      acc.branch?.toLowerCase().includes(query)
    );
  });

  // Group filtered accounts by category (after filteredAccounts is defined)
  const groupedAccounts = categories.reduce((grp, cat) => {
    const items = filteredAccounts.filter(a => a.category === cat);
    if (items.length > 0) grp[cat] = items;
    return grp;
  }, {});

  const stats = {
    total: accounts.length,
    assets: accounts.filter(a => a.category.includes('Assets')).length,
    liabilities: accounts.filter(a => a.category === 'Liabilities').length,
    revenue: accounts.filter(a => a.category === 'Revenue').length,
    expenses: accounts.filter(a => a.category === 'Expenses').length,
    hpp: accounts.filter(a => a.category === 'Cost of Goods Sold').length,
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans relative">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR */}
        <header className="h-auto flex flex-col md:flex-row items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari kode akun, nama akun, kategori, cabang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                    <p className="text-sm font-black text-gray-900">{JSON.parse(localStorage.getItem('user'))?.nama || JSON.parse(localStorage.getItem('user'))?.username || 'Admin'}</p>
                    <p className="text-[10px] font-bold text-[#990000] uppercase tracking-wider mt-0.5">{(JSON.parse(localStorage.getItem('user'))?.role || '').replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-10 pb-10">
          <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex flex-col items-start gap-1 w-full md:max-w-2xl">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                Chart of Accounts
              </h1>
              <p className="text-gray-500 font-medium mt-1">Manage company financial accounts</p>
            </div>
            <button 
              onClick={() => {
                setFormData({id: null, account_code: '', account_name: '', category: 'Current Assets', normal_balance: 'Debit', branch: 'All Branches', status: 'Active'});
                setShowModal(true);
              }}
              className="bg-red-800 hover:bg-red-900 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus size={20} /> Add Account
            </button>
          </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-[6px] border-l-blue-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[11px] text-gray-500 font-medium mb-1 truncate" title="Total Akun">Total Akun</p>
          <h3 className="text-sm lg:text-base font-black text-gray-900 truncate" title={stats.total}>{stats.total}</h3>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-[6px] border-l-indigo-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[11px] text-gray-500 font-medium mb-1 truncate" title="Aset">Aset</p>
          <h3 className="text-sm lg:text-base font-black text-gray-900 truncate" title={stats.assets}>{stats.assets}</h3>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-[6px] border-l-orange-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[11px] text-gray-500 font-medium mb-1 truncate" title="Kewajiban">Kewajiban</p>
          <h3 className="text-sm lg:text-base font-black text-gray-900 truncate" title={stats.liabilities}>{stats.liabilities}</h3>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-[6px] border-l-emerald-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[11px] text-gray-500 font-medium mb-1 truncate" title="Pendapatan">Pendapatan</p>
          <h3 className="text-sm lg:text-base font-black text-gray-900 truncate" title={stats.revenue}>{stats.revenue}</h3>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-[6px] border-l-amber-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[11px] text-gray-500 font-medium mb-1 truncate" title="HPP">HPP</p>
          <h3 className="text-sm lg:text-base font-black text-gray-900 truncate" title={stats.hpp}>{stats.hpp}</h3>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-[6px] border-l-red-500 flex flex-col justify-center transition-all hover:-translate-y-0.5 hover:shadow-md">
          <p className="text-[11px] text-gray-500 font-medium mb-1 truncate" title="Biaya">Biaya</p>
          <h3 className="text-sm lg:text-base font-black text-gray-900 truncate" title={stats.expenses}>{stats.expenses}</h3>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Daftar Akun</h2>
          <span className="text-xs text-gray-400 font-medium">{filteredAccounts.length} akun ditemukan</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">Nomor Akun</th>
                <th className="px-5 py-3.5">Nama Akun</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Normal Balance</th>
                <th className="px-5 py-3.5">Cabang</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">Memuat data...</td></tr>
              ) : Object.keys(groupedAccounts).length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-400"><AlertTriangle size={18} className="inline mr-2"/>Tidak ada akun ditemukan.</td></tr>
              ) : (
                Object.entries(groupedAccounts).map(([cat, items]) => (
                  <React.Fragment key={cat}>
                    {/* Category Header Row */}
                    <tr className={`border-l-4 ${categoryColors[cat]}`}>
                      <td colSpan="7" className="px-5 py-2.5 font-black text-sm uppercase tracking-wider">
                        {categoryLabels[cat] || cat}
                        <span className="ml-2 text-xs font-medium opacity-60">({items.length} akun)</span>
                      </td>
                    </tr>
                    {/* Account Rows */}
                    {items.map((acc) => {
                      // Detect if this is a group header account (e.g. 1-1000, 2-1000)
                      const isGroupHeader = /^\d-\d000$/.test(acc.account_code);
                      return (
                        <tr key={acc.id} className={`hover:bg-gray-50 transition-colors ${isGroupHeader ? 'font-semibold bg-gray-50/50' : ''}`}>
                          <td className="px-5 py-3">
                            <span className={`font-mono text-sm ${isGroupHeader ? 'text-gray-900 font-bold' : 'text-[#990000]'}`}>
                              {isGroupHeader ? '' : <span className="text-gray-300 mr-1">└</span>}
                              {acc.account_code}
                            </span>
                          </td>
                          <td className={`px-5 py-3 ${isGroupHeader ? 'text-gray-700 font-bold' : 'text-gray-700'}`}>
                            {isGroupHeader ? (
                              <span className="text-xs uppercase tracking-wide text-gray-500">{acc.account_name}</span>
                            ) : acc.account_name}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${categoryColors[acc.category] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                              {acc.category}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${acc.normal_balance === 'Debit' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                              {acc.normal_balance}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-sm">{acc.branch}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${acc.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {acc.status}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex justify-center gap-1">
                              <button onClick={() => handleEdit(acc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                <Edit2 size={15} />
                              </button>
                              <button onClick={() => handleToggleStatus(acc)} className={`p-1.5 rounded-lg transition-colors ${acc.status === 'Active' ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`} title={acc.status === 'Active' ? 'Nonaktifkan' : 'Aktifkan'}>
                                <Power size={15} />
                              </button>
                              <button onClick={() => handleDelete(acc.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
          </div>
        </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">{formData.id ? 'Edit Account' : 'Add Account'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Code</label>
                  <input type="text" name="account_code" value={formData.account_code} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="e.g. 1-1110" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input type="text" name="account_name" value={formData.account_name} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="e.g. Cash in Bank" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Normal Balance</label>
                  <select name="normal_balance" value={formData.normal_balance} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                    <option value="Debit">Debit</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <select name="branch" value={formData.branch} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 text-white bg-red-800 hover:bg-red-900 rounded-xl font-medium shadow-sm transition-colors">
                  Save Account
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

export default ChartOfAccounts;
