import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Search, AlertTriangle, FileText, UserCircle } from 'lucide-react';
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

  const filteredAccounts = accounts.filter(acc => 
    acc.account_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    acc.account_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: accounts.length,
    assets: accounts.filter(a => a.category.includes('Assets')).length,
    revenue: accounts.filter(a => a.category === 'Revenue').length,
    expenses: accounts.filter(a => a.category === 'Expenses').length
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans relative">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR */}
        <header className="h-auto flex flex-col sm:flex-row items-end justify-end px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
          <div className="flex items-center gap-6">
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex flex-col items-start gap-1">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                Chart of <span className="text-[#990000]">Accounts</span>
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

      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-50 p-6 rounded-3xl shadow-md border border-red-100 flex items-center justify-between hover:shadow-lg transition-all duration-300">
          <div>
            <p className="text-sm font-bold text-red-800">Total Accounts</p>
            <h3 className="text-lg md:text-xl font-black text-red-900 mt-2 break-words">{stats.total}</h3>
          </div>
        </div>
        <div className="bg-red-100 p-6 rounded-3xl shadow-md border border-red-200 flex items-center justify-between hover:shadow-lg transition-all duration-300">
          <div>
            <p className="text-sm font-bold text-red-800">Assets</p>
            <h3 className="text-lg md:text-xl font-black text-red-900 mt-2 break-words">{stats.assets}</h3>
          </div>
        </div>
        <div className="bg-red-500 p-6 rounded-3xl shadow-md flex items-center justify-between hover:shadow-lg transition-all duration-300">
          <div>
            <p className="text-sm font-bold text-white">Revenue</p>
            <h3 className="text-lg md:text-xl font-black text-white mt-2 break-words">{stats.revenue}</h3>
          </div>
        </div>
        <div className="bg-red-200 p-6 rounded-3xl shadow-md border border-red-300 flex items-center justify-between hover:shadow-lg transition-all duration-300">
          <div>
            <p className="text-sm font-bold text-red-900">Expenses</p>
            <h3 className="text-lg md:text-xl font-black text-red-900 mt-2 break-words">{stats.expenses}</h3>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Account List</h2>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search accounts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none w-64"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 text-xs text-white uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Account Code</th>
                <th className="px-6 py-4">Account Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Normal Balance</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">Loading data...</td></tr>
              ) : filteredAccounts.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500 flex justify-center items-center gap-2"><AlertTriangle size={18}/> No accounts found.</td></tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{acc.account_code}</td>
                    <td className="px-6 py-4 text-gray-700">{acc.account_name}</td>
                    <td className="px-6 py-4 text-gray-600">{acc.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${acc.normal_balance === 'Debit' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                        {acc.normal_balance}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{acc.branch}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${acc.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button onClick={() => handleEdit(acc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleToggleStatus(acc)} className={`p-2 rounded-lg transition-colors ${acc.status === 'Active' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`} title={acc.status === 'Active' ? 'Disable' : 'Enable'}>
                        <Power size={16} />
                      </button>
                      <button onClick={() => handleDelete(acc.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
