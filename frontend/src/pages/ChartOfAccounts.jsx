import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Power, Search, AlertTriangle, FileText } from 'lucide-react';
import { accountApi } from '../api/accountApi';

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Chart of Accounts</h1>
          <p className="text-gray-500 mt-1">Manage company financial accounts</p>
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Accounts</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <FileText size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Assets</p>
            <p className="text-2xl font-bold text-green-600">{stats.assets}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-xl text-green-600">
            <FileText size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Revenue</p>
            <p className="text-2xl font-bold text-purple-600">{stats.revenue}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
            <FileText size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Expenses</p>
            <p className="text-2xl font-bold text-red-600">{stats.expenses}</p>
          </div>
          <div className="bg-red-100 p-3 rounded-xl text-red-600">
            <FileText size={24} />
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
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="px-6 py-4 font-semibold">Account Code</th>
                <th className="px-6 py-4 font-semibold">Account Name</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">Normal Balance</th>
                <th className="px-6 py-4 font-semibold">Branch</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Action</th>
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
    </div>
  );
};

export default ChartOfAccounts;
