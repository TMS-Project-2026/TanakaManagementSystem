import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, FileText, Download, Printer, Activity } from 'lucide-react';
import { journalApi } from '../api/journalApi';
import { accountApi } from '../api/accountApi';

const Journal = () => {
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [formData, setFormData] = useState({
    id: null,
    branch: 'Banua',
    transaction_date: new Date().toISOString().split('T')[0],
    category: 'Expense',
    from_account: '',
    to_account: '',
    account_name: '',
    description: '',
    unit: 'pcs',
    qty: 1,
    unit_price: 0,
    amount: 0,
    debit: 0,
    credit: 0,
    notes: ''
  });

  const branches = ['Banua', 'Tanaka', 'Acestreet'];
  const categories = ['Revenue', 'Expense', 'Transfer', 'Liability', 'Receivable', 'Capital', 'Operational'];
  const units = ['pcs', 'day', 'pckg', 'unit'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [journalData, accountData] = await Promise.all([
        journalApi.getAllJournals(),
        accountApi.getAllAccounts()
      ]);
      setJournals(journalData);
      setAccounts(accountData.filter(a => a.status === 'Active'));
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto calculate amount when qty or unit_price changes
  useEffect(() => {
    const amount = formData.qty * formData.unit_price;
    setFormData(prev => ({ ...prev, amount }));
  }, [formData.qty, formData.unit_price]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.debit) !== parseFloat(formData.credit)) {
      if(!window.confirm("Debit and Credit are not balanced. Are you sure you want to continue?")) {
        return;
      }
    }

    try {
      if (formData.id) {
        await journalApi.updateJournal(formData.id, formData);
      } else {
        await journalApi.createJournal(formData);
      }
      setShowModal(false);
      fetchData();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.error || 'Terjadi kesalahan');
    }
  };

  const resetForm = () => {
    setFormData({
      id: null, branch: 'Banua', transaction_date: new Date().toISOString().split('T')[0], category: 'Expense',
      from_account: '', to_account: '', account_name: '', description: '', unit: 'pcs', qty: 1, unit_price: 0, amount: 0,
      debit: 0, credit: 0, notes: ''
    });
  };

  const handleEdit = (journal) => {
    setFormData({...journal, transaction_date: journal.transaction_date.split('T')[0]});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus jurnal ini?')) {
      try {
        await journalApi.deleteJournal(id);
        fetchData();
      } catch (error) {
        console.error('Failed to delete', error);
      }
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
  };

  // Apply filters
  const filteredJournals = journals.filter(j => {
    const matchSearch = j.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        j.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDate = filterDate ? j.transaction_date.startsWith(filterDate) : true;
    const matchBranch = filterBranch ? j.branch === filterBranch : true;
    const matchCategory = filterCategory ? j.category === filterCategory : true;
    return matchSearch && matchDate && matchBranch && matchCategory;
  });

  const today = new Date().toISOString().split('T')[0];
  const stats = {
    debitToday: journals.filter(j => j.transaction_date.startsWith(today)).reduce((sum, j) => sum + parseFloat(j.debit), 0),
    creditToday: journals.filter(j => j.transaction_date.startsWith(today)).reduce((sum, j) => sum + parseFloat(j.credit), 0),
    totalTx: journals.length,
    balance: journals.reduce((sum, j) => sum + parseFloat(j.debit) - parseFloat(j.credit), 0)
  };

  return (
    <div className="p-6 md:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Journal</h1>
          <p className="text-gray-500 mt-1">Central accounting transaction center</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-all">
            <Printer size={18} /> Print
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-all">
            <Download size={18} /> Excel
          </button>
          <button 
            onClick={() => { resetForm(); setShowModal(true); }}
            className="bg-red-800 hover:bg-red-900 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={20} /> Add Journal
          </button>
        </div>
      </div>

      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Debit Today</p>
            <p className="text-2xl font-bold text-blue-600">{formatRupiah(stats.debitToday)}</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <Activity size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Credit Today</p>
            <p className="text-2xl font-bold text-orange-600">{formatRupiah(stats.creditToday)}</p>
          </div>
          <div className="bg-orange-100 p-3 rounded-xl text-orange-600">
            <Activity size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTx}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-xl text-gray-600">
            <FileText size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-medium">Ending Balance</p>
            <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatRupiah(Math.abs(stats.balance))}</p>
          </div>
          <div className={`${stats.balance >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} p-3 rounded-xl`}>
            <Activity size={24} />
          </div>
        </div>
      </div>

      {/* Filter & Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Journal Entries</h2>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none w-48" />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            </div>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" title="Filter Date" />
            <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none">
              <option value="">All Branches</option>
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Transaction ID</th>
                <th className="px-6 py-4 font-semibold">Branch</th>
                <th className="px-6 py-4 font-semibold">Category</th>
                <th className="px-6 py-4 font-semibold">From</th>
                <th className="px-6 py-4 font-semibold">To</th>
                <th className="px-6 py-4 font-semibold text-right">Debit</th>
                <th className="px-6 py-4 font-semibold text-right">Credit</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan="11" className="text-center py-8 text-gray-500">Loading data...</td></tr>
              ) : filteredJournals.length === 0 ? (
                <tr><td colSpan="11" className="text-center py-8 text-gray-500">No journal entries found.</td></tr>
              ) : (
                filteredJournals.map((j) => (
                  <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">{new Date(j.transaction_date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{j.transaction_id}</td>
                    <td className="px-6 py-4 text-gray-600">{j.branch}</td>
                    <td className="px-6 py-4 text-gray-600">{j.category}</td>
                    <td className="px-6 py-4 text-gray-700">{j.from_account}</td>
                    <td className="px-6 py-4 text-gray-700">{j.to_account}</td>
                    <td className="px-6 py-4 text-right text-blue-600 font-medium">{formatRupiah(j.debit)}</td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">{formatRupiah(j.credit)}</td>
                    <td className="px-6 py-4 text-right text-gray-900 font-bold">{formatRupiah(j.amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">{j.status}</span>
                    </td>
                    <td className="px-6 py-4 flex justify-center gap-2">
                      <button onClick={() => handleEdit(j)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(j.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Add Journal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden my-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">{formData.id ? 'Edit Journal Entry' : 'Add New Journal'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                  <input type="text" value={formData.id ? formData.transaction_id : 'Auto Generated'} disabled className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <select name="branch" value={formData.branch} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                    {branches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date</label>
                  <input type="date" name="transaction_date" value={formData.transaction_date} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input type="text" name="description" value={formData.description} onChange={handleChange} required placeholder="Transaction description..." className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Account (Credit)</label>
                  <select name="from_account" value={formData.from_account} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                    <option value="">Select Account</option>
                    {accounts.map(acc => <option key={acc.account_code} value={`${acc.account_code} - ${acc.account_name}`}>{acc.account_code} - {acc.account_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Account (Debit)</label>
                  <select name="to_account" value={formData.to_account} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                    <option value="">Select Account</option>
                    {accounts.map(acc => <option key={acc.account_code} value={`${acc.account_code} - ${acc.account_name}`}>{acc.account_code} - {acc.account_name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Related Account Name (e.g. Vendor/Customer Name)</label>
                  <input type="text" name="account_name" value={formData.account_name} onChange={handleChange} placeholder="Name" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select name="unit" value={formData.unit} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500">
                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
                  <input type="number" name="qty" value={formData.qty} onChange={handleChange} min="1" required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (Rp)</label>
                  <input type="number" name="unit_price" value={formData.unit_price} onChange={handleChange} min="0" required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (Rp)</label>
                  <input type="number" name="amount" value={formData.amount} readOnly className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
                <div>
                  <label className="block text-sm font-medium text-blue-800 mb-1">Debit (Rp)</label>
                  <input type="number" name="debit" value={formData.debit} onChange={handleChange} min="0" required className="w-full p-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-800 font-bold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">Credit (Rp)</label>
                  <input type="number" name="credit" value={formData.credit} onChange={handleChange} min="0" required className="w-full p-2.5 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 text-orange-800 font-bold" />
                </div>
                {parseFloat(formData.debit) !== parseFloat(formData.credit) && (
                  <div className="md:col-span-2 text-red-600 text-sm font-medium flex items-center gap-1">
                    <AlertTriangle size={16} /> Warning: Debit and Credit are not balanced!
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="2" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Additional notes..."></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 text-white bg-red-800 hover:bg-red-900 rounded-xl font-medium shadow-sm transition-colors">
                  Save Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;
