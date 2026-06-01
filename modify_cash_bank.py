import re

with open('frontend/src/pages/CashBank.jsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { \n    getAllCashInBank, getCashInBankSummary, createCashInBank, \n    updateCashInBank, deleteCashInBank \n} from '../api/cashInBankApi';", 
"import { \n    getAllCashInBank, getCashInBankSummary, createCashInBank, \n    updateCashInBank, deleteCashInBank \n} from '../api/cashInBankApi';\nimport { \n    getAllCashOut, createCashOut, updateCashOut, voidCashOut \n} from '../api/cashOutBankApi';")

# 2. Component Name
content = content.replace("const CashInBank = () => {", "const CashBank = () => {")
content = content.replace("export default CashInBank;", "export default CashBank;")

# 3. Fetch Data
fetch_old = """        try {
            const [listRes, summaryRes] = await Promise.all([
                getAllCashInBank({...filters}),
                getCashInBankSummary()
            ]);
            setData(listRes.data.data);
            setSummary(summaryRes.data.summary);
            setCharts(summaryRes.data.charts);"""

fetch_new = """        try {
            const [listIn, listOut, summaryRes] = await Promise.all([
                getAllCashInBank({...filters}),
                getAllCashOut({...filters}),
                getCashInBankSummary()
            ]);
            const combined = [
                ...(listIn.data.data || []).map(d => ({...d, type: 'IN'})),
                ...(listOut.data.data || []).map(d => ({...d, type: 'OUT'}))
            ];
            combined.sort((a, b) => new Date(a.tanggal_transaksi) - new Date(b.tanggal_transaksi));
            setData(combined);
            
            // We can still use the summary from CashInBank for now, or just calculate it from combined
            const summary = summaryRes.data.summary;
            setSummary(summary);
            setCharts(summaryRes.data.charts);"""
content = content.replace(fetch_old, fetch_new)

# 4. Table Logic & Render
# Re-writing the running balance loop in the UI
# Let's just do a regex replace for the map loop
content = re.sub(
    r"const masuk = item\.status === 'Paid' \? parseFloat\(item\.total \|\| 0\) : 0;\s*const pending = item\.status !== 'Paid' \? parseFloat\(item\.total \|\| 0\) : 0;\s*runningBal \+= masuk;",
    "const masuk = (item.status === 'Paid' && item.type === 'IN') ? parseFloat(item.total || 0) : 0;\nconst keluar = (item.status === 'Paid' && item.type === 'OUT') ? parseFloat(item.total || 0) : 0;\nconst pending = item.status !== 'Paid' ? parseFloat(item.total || 0) : 0;\nrunningBal += masuk - keluar;",
    content
)

# And similarly for the table headers
content = content.replace("<th className=\"py-3.5 px-4 text-right text-green-300\">Masuk (Paid)</th>\n                                                <th className=\"py-3.5 px-4 text-right text-yellow-300\">Pending</th>",
"<th className=\"py-3.5 px-4 text-right text-green-300\">Masuk (Paid)</th>\n<th className=\"py-3.5 px-4 text-right text-red-300\">Keluar (Paid)</th>\n<th className=\"py-3.5 px-4 text-right text-yellow-300\">Pending</th>")

# And table rows
content = content.replace("<td className=\"py-3 px-4 text-right font-semibold text-green-700\">\n                                                                {masuk > 0 ? formatRupiah(masuk) : <span className=\"text-gray-200\">—</span>}\n                                                            </td>\n                                                            <td className=\"py-3 px-4 text-right font-semibold text-yellow-600\">\n                                                                {pending > 0 ? formatRupiah(pending) : <span className=\"text-gray-200\">—</span>}\n                                                            </td>",
"""<td className="py-3 px-4 text-right font-semibold text-green-700">
    {masuk > 0 ? formatRupiah(masuk) : <span className="text-gray-200">—</span>}
</td>
<td className="py-3 px-4 text-right font-semibold text-red-700">
    {keluar > 0 ? formatRupiah(keluar) : <span className="text-gray-200">—</span>}
</td>
<td className="py-3 px-4 text-right font-semibold text-yellow-600">
    {pending > 0 ? formatRupiah(pending) : <span className="text-gray-200">—</span>}
</td>""")

# Laporan Koran Logic similarly
content = re.sub(
    r"const totalMasuk = sortedData\.filter\(r => r\.status === 'Paid'\)\.reduce\(\(s, r\) => s \+ parseFloat\(r\.total \|\| 0\), 0\);",
    "const totalMasuk = sortedData.filter(r => r.status === 'Paid' && r.type === 'IN').reduce((s, r) => s + parseFloat(r.total || 0), 0);",
    content
)
# Wait, also add totalKeluar
content = re.sub(
    r"const totalMasuk = sortedData\.filter\(r => r\.status === 'Paid' && r\.type === 'IN'\)\.reduce\(\(s, r\) => s \+ parseFloat\(r\.total \|\| 0\), 0\);",
    "const totalMasuk = sortedData.filter(r => r.status === 'Paid' && r.type === 'IN').reduce((s, r) => s + parseFloat(r.total || 0), 0);\nconst totalKeluar = sortedData.filter(r => r.status === 'Paid' && r.type === 'OUT').reduce((s, r) => s + parseFloat(r.total || 0), 0);",
    content
)

with open('frontend/src/pages/CashBank.jsx', 'w') as f:
    f.write(content)

