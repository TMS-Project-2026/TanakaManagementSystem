import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, FileText, Download, Printer, Activity, AlertTriangle, UserCircle, RefreshCcw, DollarSign, TrendingUp, CreditCard, PiggyBank, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { journalApi } from '../api/journalApi';
import { accountApi } from '../api/accountApi';

const Journal = () => {
  const { type } = useParams();
  const activeTab = type === 'purchase' ? 'Purchase' : 'Sales';
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState({ total_tx: 0, total_debit: 0, total_credit: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [formData, setFormData] = useState({
    id: null,
    journal_type: 'Sales',
    branch: 'PT Banua Mitra Lestari',
    transaction_date: new Date().toISOString().split('T')[0],
    category: '',
    debit_account: '',
    credit_account: '',
    description: '',
    debit: 0,
    credit: 0,
    notes: ''
  });

  const branches = ['PT Banua Mitra Lestari', 'PT Tanaka Rizqi Barokah', 'Accestret'];

  const getCategories = (type) => {
    if (type === 'Sales') return ['Revenue', 'Receivable', 'Cash', 'Adjustment'];
    return ['Expense', 'Cost of Goods Sold', 'Payable', 'Asset', 'Adjustment'];
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        type: activeTab,
        branch: filterBranch,
        category: filterCategory,
        from: filterDateFrom,
        to: filterDateTo,
        search: searchTerm
      };

      const [journalData, accountData, statsData] = await Promise.all([
        journalApi.getAllJournals(params),
        accountApi.getAllAccounts(),
        journalApi.getStats(activeTab)
      ]);

      setJournals(journalData);
      setAccounts(accountData.filter(a => a.status === 'Active'));
      setStats(statsData || { total_tx: 0, total_debit: 0, total_credit: 0, balance: 0 });
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, filterBranch, filterCategory, filterDateFrom, filterDateTo]); // Auto fetch on filter change

  // Separate debounce for search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (parseFloat(formData.debit) !== parseFloat(formData.credit)) {
      if (!window.confirm("Debit and Credit are not balanced. Are you sure you want to continue?")) {
        return;
      }
    }

    setSaving(true);
    try {
      let journalId = formData.id;
      if (formData.id) {
        await journalApi.updateJournal(formData.id, formData);
      } else {
        const res = await journalApi.createJournal(formData);
        journalId = res.id;
      }

      if (files.length > 0 && journalId) {
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        await journalApi.uploadFiles(journalId, fd);
      }

      setShowModal(false);
      fetchData();
      resetForm();
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Terjadi kesalahan');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      journal_type: activeTab,
      branch: 'PT Banua Mitra Lestari',
      transaction_date: new Date().toISOString().split('T')[0],
      category: getCategories(activeTab)[0],
      debit_account: '',
      credit_account: '',
      description: '',
      debit: 0,
      credit: 0,
      notes: ''
    });
    setFiles([]);
  };

  const handleEdit = (journal) => {
    setFormData({
      ...journal,
      transaction_date: journal.transaction_date.split('T')[0]
    });
    setFiles([]);
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
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number || 0);
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans relative">
      <Sidebar />
      <main className="flex-1 flex flex-col pt-16 md:pt-0 h-screen overflow-hidden">
        {/* TOPBAR */}
        <header className="h-auto flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-10 py-4 gap-4 sm:gap-0 mb-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari transaksi jurnal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white rounded-full border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-[#990000] focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>
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
          <div className="bg-white p-6 min-h-full rounded-2xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex flex-col items-start gap-1">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                  Journal <span className="text-[#990000]">Ledger</span>
                </h1>
                <p className="text-gray-500 font-medium mt-1">Sales & Purchase Accounting</p>
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
                  <Plus size={20} /> New Journal
                </button>
              </div>
            </div>



            {/* Header Cards (Dynamic based on tab) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {activeTab === 'Sales' ? (
                <>
                  <div className="bg-red-50 p-6 rounded-3xl shadow-md border border-red-100 flex flex-col hover:shadow-lg transition-all duration-300">
                    <p className="text-sm font-bold text-red-800 flex items-center gap-2"><TrendingUp size={16} /> Total Revenue</p>
                    <h3 className="text-lg md:text-xl font-black text-red-900 mt-2 break-words">{formatRupiah(stats.total_credit)}</h3>
                  </div>
                  <div className="bg-red-100 p-6 rounded-3xl shadow-md border border-red-200 flex flex-col hover:shadow-lg transition-all duration-300">
                    <p className="text-sm font-bold text-red-800 flex items-center gap-2"><Activity size={16} /> Total Receivable</p>
                    <h3 className="text-lg md:text-xl font-black text-red-900 mt-2 break-words">{formatRupiah(stats.total_debit)}</h3>
                  </div>
                  <div className="bg-red-500 p-6 rounded-3xl shadow-md flex flex-col hover:shadow-lg transition-all duration-300">
                    <p className="text-sm font-bold text-white flex items-center gap-2"><DollarSign size={16} /> Cash Received</p>
                    <h3 className="text-lg md:text-xl font-black text-white mt-2 break-words">{formatRupiah(stats.balance)}</h3>
                  </div>
                  <div className="bg-red-200 p-6 rounded-3xl shadow-md border border-red-300 flex flex-col hover:shadow-lg transition-all duration-300">
                    <p className="text-sm font-bold text-red-900 flex items-center gap-2"><Activity size={16} /> Total Transactions</p>
                    <h3 className="text-lg md:text-xl font-black text-red-900 mt-2 break-words">{stats.total_tx}</h3>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-blue-50 p-6 rounded-3xl shadow-md border border-blue-100 flex flex-col hover:shadow-lg transition-all duration-300">
                    <p className="text-sm font-bold text-blue-800 flex items-center gap-2"><TrendingUp size={16} /> Total Purchase</p>
                    <h3 className="text-lg md:text-xl font-black text-blue-900 mt-2 break-words">{formatRupiah(stats.total_debit)}</h3>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-3xl shadow-md border border-orange-100 flex flex-col hover:shadow-lg transition-all duration-300">
                    <p className="text-sm font-bold text-orange-800 flex items-center gap-2"><CreditCard size={16} /> Total Payable</p>
                    <h3 className="text-lg md:text-xl font-black text-orange-900 mt-2 break-words">{formatRupiah(stats.total_credit)}</h3>
                  </div>
                  <div className="bg-indigo-500 p-6 rounded-3xl shadow-md flex flex-col hover:shadow-lg transition-all duration-300">
                    <p className="text-sm font-bold text-white flex items-center gap-2"><PiggyBank size={16} /> Cash Paid</p>
                    <h3 className="text-lg md:text-xl font-black text-white mt-2 break-words">{formatRupiah(stats.balance)}</h3>
                  </div>
                  <div className="bg-indigo-100 p-6 rounded-3xl shadow-md border border-indigo-200 flex flex-col hover:shadow-lg transition-all duration-300">
                    <p className="text-sm font-bold text-indigo-900 flex items-center gap-2"><Activity size={16} /> Total Transactions</p>
                    <h3 className="text-lg md:text-xl font-black text-indigo-900 mt-2 break-words">{stats.total_tx}</h3>
                  </div>
                </>
              )}
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 items-center justify-between mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <span className="text-gray-500">From:</span>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="outline-none" />
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <span className="text-gray-500">To:</span>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="outline-none" />
                </div>
                <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#990000] outline-none">
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#990000] outline-none">
                  <option value="">All Categories</option>
                  {getCategories(activeTab).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={() => fetchData()} className="p-2 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors" title="Refresh">
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-100 text-xs text-gray-600 uppercase tracking-wider font-bold border-b border-gray-200">
                    <th className="px-6 py-4">No</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Transaction ID</th>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Account Description</th>
                    <th className="px-6 py-4 text-right">Debit</th>
                    <th className="px-6 py-4 text-right">Credit</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {loading ? (
                    <tr><td colSpan="9" className="text-center py-8 text-gray-500">Loading data...</td></tr>
                  ) : journals.length === 0 ? (
                    <tr><td colSpan="9" className="text-center py-8 text-gray-500">No journal entries found.</td></tr>
                  ) : (
                    journals.map((j, index) => (
                      <tr key={j.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 text-gray-700">{new Date(j.transaction_date).toLocaleDateString('id-ID')}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{j.transaction_id}</div>
                          <div className="text-xs text-gray-500">{j.description}</div>
                          {j.attachment && (() => {
                            try {
                              const filesArr = JSON.parse(j.attachment);
                              if (Array.isArray(filesArr) && filesArr.length > 0) {
                                return (
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {filesArr.map((f, i) => (
                                      <a key={i} href={`http://localhost:3000${f.path}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 bg-red-50 text-[#990000] hover:bg-red-100 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-red-100 transition-colors">
                                        <FileText size={12} /> {f.originalname || 'Lampiran'}
                                      </a>
                                    ))}
                                  </div>
                                );
                              }
                            } catch(e) {}
                            return null;
                          })()}
                        </td>
                        <td className="px-6 py-4 text-gray-700">{j.branch}</td>
                        <td className="px-6 py-4 text-gray-700">
                          <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-semibold">{j.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          {/* Standard Accounting Format */}
                          <div className="flex flex-col gap-1">
                            <div className="font-medium text-gray-900">{j.debit_account || '-'}</div>
                            <div className="text-gray-600 pl-4">{j.credit_account || '-'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900 font-medium">
                          <div className="flex flex-col gap-1">
                            <div>{formatRupiah(j.debit)}</div>
                            <div className="text-transparent select-none">{formatRupiah(0)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900 font-medium">
                          <div className="flex flex-col gap-1">
                            <div className="text-transparent select-none">{formatRupiah(0)}</div>
                            <div>{formatRupiah(j.credit)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(j)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-100" title="Edit"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(j.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100" title="Delete"><Trash2 size={16} /></button>
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

        {/* Modal Form New/Edit Journal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto py-10">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden my-auto">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{formData.id ? 'Edit Journal Entry' : 'New Journal Entry'}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.journal_type === 'Sales' ? 'Jurnal Penjualan' : 'Jurnal Pembelian'}
                  </p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Transaction Type</label>
                    <select name="journal_type" value={formData.journal_type} onChange={(e) => {
                      handleChange(e);
                      setFormData(prev => ({ ...prev, category: getCategories(e.target.value)[0] }));
                    }} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none text-gray-700 font-medium">
                      <option value="Sales">Sales Journal</option>
                      <option value="Purchase">Purchase Journal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Branch</label>
                    <select name="branch" value={formData.branch} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none">
                      {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                    <input type="date" name="transaction_date" value={formData.transaction_date} onChange={handleChange} required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none">
                      {getCategories(formData.journal_type).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Transaction Description</label>
                    <input type="text" name="description" value={formData.description} onChange={handleChange} required placeholder="Cth: Penjualan seragam PT ABC" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none" />
                  </div>
                </div>

                {/* Accounting Entry Section */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Activity size={16} className="text-[#990000]" /> ACCOUNTING ENTRY</h3>

                  <div className="space-y-4">
                    {/* Debit Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b border-gray-200 pb-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Debit Account</label>
                        <select name="debit_account" value={formData.debit_account} onChange={handleChange} required className="w-full p-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                          <option value="">-- Select COA --</option>
                          {accounts.map(acc => <option key={acc.account_code} value={`${acc.account_code} ${acc.account_name}`}>{acc.account_code} - {acc.account_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount</label>
                        <input type="number" name="debit" value={formData.debit} onChange={handleChange} min="0" required className="w-full p-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-800 text-right bg-white" placeholder="0" />
                      </div>
                    </div>

                    {/* Credit Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
                      <div className="md:col-span-2 pl-8">
                        <label className="block text-xs font-bold text-orange-800 uppercase tracking-wider mb-1">Credit Account</label>
                        <select name="credit_account" value={formData.credit_account} onChange={handleChange} required className="w-full p-2.5 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white">
                          <option value="">-- Select COA --</option>
                          {accounts.map(acc => <option key={acc.account_code} value={`${acc.account_code} ${acc.account_name}`}>{acc.account_code} - {acc.account_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount</label>
                        <input type="number" name="credit" value={formData.credit} onChange={handleChange} min="0" required className="w-full p-2.5 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-bold text-orange-800 text-right bg-white" placeholder="0" />
                      </div>
                    </div>
                  </div>

                  {parseFloat(formData.debit) !== parseFloat(formData.credit) && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg text-red-700 text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle size={18} /> Error: Debit and Credit must be balanced!
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000]/20 focus:border-[#990000] outline-none resize-none" placeholder="Additional notes..."></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Attachment</label>
                    <div onClick={() => document.getElementById('journal_file_upload').click()} className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-white hover:bg-gray-50 transition-colors cursor-pointer min-h-[100px]">
                      <p className="text-sm text-gray-500 font-medium">Click to upload document</p>
                      <p className="text-xs text-gray-400 mt-1">Invoice, receipt, dll (Bisa lebih dari 1 file)</p>
                      <input type="file" id="journal_file_upload" multiple onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files)])} className="hidden" />
                    </div>
                    {files.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                        {files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-1.5 rounded border border-gray-100 text-xs">
                            <span className="text-gray-700 truncate flex-1 font-medium">{file.name}</span>
                            <button type="button" onClick={() => setFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 ml-1">
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {formData.attachment && (() => {
                      try {
                        const existingArr = JSON.parse(formData.attachment);
                        if (Array.isArray(existingArr) && existingArr.length > 0) {
                          return (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">File Tersimpan:</p>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {existingArr.map((f, i) => (
                                  <div key={i} className="flex items-center justify-between bg-red-50/50 p-1.5 rounded border border-red-100/50 text-xs">
                                    <a href={`http://localhost:3000${f.path}`} target="_blank" rel="noreferrer" className="text-[#990000] hover:underline truncate flex-1 font-medium flex items-center gap-1">
                                      <FileText size={12} /> {f.originalname || 'Lampiran'}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch(e) {}
                      return null;
                    })()}
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={parseFloat(formData.debit) !== parseFloat(formData.credit) || saving} className="px-8 py-2.5 text-white bg-[#990000] hover:bg-red-800 rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                    {saving ? 'Saving...' : 'Save Journal Entry'}
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

export default Journal;
