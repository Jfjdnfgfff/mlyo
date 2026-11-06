import React, { useState, useEffect } from 'react';
import { FileBarChart, Printer, Download, Calendar, TrendingUp, TrendingDown, DollarSign, Filter } from 'lucide-react';
import { api } from '../services/api';
import { Payment, Expense, SalaryPayment } from '../types';

interface ReportsViewProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ selectedMonth, setSelectedMonth }) => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<{
    totalIncome: number;
    totalExpenses: number;
    totalSalaries: number;
    netProfit: number;
    payments: Payment[];
    expenses: Expense[];
    salaryPayments: SalaryPayment[];
  } | null>(null);

  useEffect(() => {
    loadReport();
  }, [selectedMonth]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await api.getFinancialReport(selectedMonth);
      if (res.success) {
        setReportData(res);
      }
    } catch (err) {
      console.error('فشل تحميل التقرير:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF';
    csvContent += 'النوع,البيان,المبلغ (دج),التاريخ\n';

    reportData.payments.forEach((p) => {
      csvContent += `إيراد/اشتراك,وصل ${p.receiptNumber} - ${p.childName},${p.amount},${p.paymentDate}\n`;
    });

    reportData.expenses.forEach((e) => {
      csvContent += `مصروف,${e.title},${e.amount},${e.date}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !reportData) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[300px]">
        <p className="text-slate-500 font-semibold text-sm">جاري إعداد وتحليل التقارير الماليّة...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-slate-500 font-semibold">الشهر:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden font-mono"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">الجمهورية الجزائرية - تقرير نشاط الحضانة</span>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-600" />
            تصدير ملف Excel / CSV
          </button>
          <button
            onClick={handlePrintReport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            طباعة التقرير الشامل
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">إجمالي المداخيل والاشتراكات</span>
          <p className="text-2xl font-black text-emerald-600 tabular-nums">
            {reportData.totalIncome.toLocaleString('ar-DZ')} دج
          </p>
          <span className="text-[11px] text-slate-400 font-medium">مستلمة نقداً وبواسطة بريدي موب</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">المصاريف التشغيلية العامة</span>
          <p className="text-2xl font-black text-rose-600 tabular-nums">
            {reportData.totalExpenses.toLocaleString('ar-DZ')} دج
          </p>
          <span className="text-[11px] text-slate-400 font-medium">تشمل الإيجار، الكهرباء، التغذية</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500">كتلة رواتب الموظفين والمربيات</span>
          <p className="text-2xl font-black text-purple-600 tabular-nums">
            {reportData.totalSalaries.toLocaleString('ar-DZ')} دج
          </p>
          <span className="text-[11px] text-slate-400 font-medium">الرواتب الصافية المصروفة</span>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl shadow-xs space-y-1">
          <span className="text-xs font-bold text-blue-800">صافي الأرباح لشهر {selectedMonth}</span>
          <p className="text-2xl font-black text-blue-900 tabular-nums">
            {reportData.netProfit.toLocaleString('ar-DZ')} دج
          </p>
          <span className="text-[11px] text-blue-700 font-medium">الحصيلة الصافية للنشاط</span>
        </div>
      </div>

      {/* Income Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3 p-5">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          بيان إيرادات الاشتراكات المفوترة ({reportData.payments.length} معاملة)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <th className="py-2.5 px-3">رقم الوصل</th>
                <th className="py-2.5 px-3">الطفل</th>
                <th className="py-2.5 px-3">الولي</th>
                <th className="py-2.5 px-3">المبلغ</th>
                <th className="py-2.5 px-3">طريقة الدفع</th>
                <th className="py-2.5 px-3">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{p.receiptNumber}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{p.childName}</td>
                  <td className="py-2.5 px-3 text-slate-700">{p.parentName}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600 tabular-nums">
                    {p.amount.toLocaleString('ar-DZ')} دج
                  </td>
                  <td className="py-2.5 px-3">{p.paymentMethod}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{p.paymentDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-3 p-5">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
          بيان المصاريف التفصيلية ({reportData.expenses.length} بند)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <th className="py-2.5 px-3">بيان المصروف</th>
                <th className="py-2.5 px-3">التصنيف</th>
                <th className="py-2.5 px-3">المبلغ</th>
                <th className="py-2.5 px-3">المستفيد</th>
                <th className="py-2.5 px-3">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportData.expenses.map((e) => (
                <tr key={e.id}>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{e.title}</td>
                  <td className="py-2.5 px-3 text-slate-700">{e.category}</td>
                  <td className="py-2.5 px-3 font-bold text-rose-600 tabular-nums">
                    {e.amount.toLocaleString('ar-DZ')} دج
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{e.recipient || '-'}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">{e.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
