import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Printer,
  AlertTriangle,
  CheckCircle,
  X,
  FileText,
  DollarSign,
  Ban
} from 'lucide-react';
import { Child, Payment, SubscriptionSummary, User } from '../types';
import { PrintReceiptModal } from './PrintReceiptModal';

interface PaymentsViewProps {
  payments: Payment[];
  subscriptionsSummary: SubscriptionSummary[];
  childrenList: Child[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  currentUser: User;
  onRefresh: () => void;
  onCreatePayment: (data: {
    childId: string;
    month: string;
    amount: number;
    discount?: number;
    paymentMethod?: string;
    notes?: string;
  }) => Promise<void>;
  onVoidPayment: (id: string) => Promise<void>;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments,
  subscriptionsSummary,
  childrenList,
  selectedMonth,
  setSelectedMonth,
  currentUser,
  onRefresh,
  onCreatePayment,
  onVoidPayment
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'receipts' | 'subscriptions'>('subscriptions');
  const [search, setSearch] = useState('');

  // Print Modal
  const [printingPayment, setPrintingPayment] = useState<Payment | null>(null);

  // Add Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [childId, setChildId] = useState('');
  const [month, setMonth] = useState(selectedMonth || new Date().toISOString().substring(0, 7));
  const [amount, setAmount] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BARIDIMOB' | 'CHECK' | 'TRANSFER'>('CASH');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleChildSelect = (id: string) => {
    setChildId(id);
    const child = childrenList.find((c) => c.id === id);
    if (child) {
      setAmount(String(child.monthlyFee));
    }
  };

  const openAddModal = (defaultChildId?: string) => {
    const targetId = defaultChildId || childrenList[0]?.id || '';
    handleChildSelect(targetId);
    setMonth(selectedMonth || new Date().toISOString().substring(0, 7));
    setDiscount('0');
    setPaymentMethod('CASH');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!childId) {
      setFormError('الرجاء اختيار الطفل المعني بالدفع');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setFormError('مبلغ الاشتراك يجب أن يكون أكبر من 0 دج');
      return;
    }

    try {
      setSubmitting(true);
      await onCreatePayment({
        childId,
        month,
        amount: Number(amount),
        discount: Number(discount) || 0,
        paymentMethod,
        notes: notes.trim()
      });
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'فشل تسجيل عملية الدفع');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubscriptions = subscriptionsSummary.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.childName.toLowerCase().includes(q) || s.parentName.toLowerCase().includes(q);
  });

  const filteredPayments = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.receiptNumber.toLowerCase().includes(q) ||
      p.childName.toLowerCase().includes(q) ||
      p.parentName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {/* Sub tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSubTab('subscriptions')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'subscriptions'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              متابعة الاشتراكات والديون
            </button>
            <button
              onClick={() => setActiveSubTab('receipts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'receipts'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سجل وصولات الدفع
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-500 font-semibold">الشهر:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث بالاسم أو رقم الوصل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>

          <button
            onClick={() => openAddModal()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            استلام دفعة / إقرار وصل
          </button>
        </div>
      </div>

      {/* TAB 1: SUBSCRIPTIONS & DEBT TRACKER */}
      {activeSubTab === 'subscriptions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">متابعة الاشتراكات الشهرية لشهر {selectedMonth}</h3>
            <span className="text-xs text-slate-500">إجمالي الأطفال: {filteredSubscriptions.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-4">اسم الطفل</th>
                  <th className="py-3.5 px-3">القسم</th>
                  <th className="py-3.5 px-3">الولي</th>
                  <th className="py-3.5 px-3">الاشتراك المستحق</th>
                  <th className="py-3.5 px-3">الخصومات</th>
                  <th className="py-3.5 px-3">المدفوع</th>
                  <th className="py-3.5 px-3">المتبقي (الدين)</th>
                  <th className="py-3.5 px-3">حالة السداد</th>
                  <th className="py-3.5 px-4 text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSubscriptions.map((item) => (
                  <tr key={item.childId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{item.childName}</td>
                    <td className="py-3.5 px-3 text-slate-600">{item.groupName || 'غير معين'}</td>
                    <td className="py-3.5 px-3 text-slate-800">{item.parentName}</td>
                    <td className="py-3.5 px-3 font-bold tabular-nums text-slate-900">
                      {item.monthlyFee.toLocaleString('ar-DZ')} دج
                    </td>
                    <td className="py-3.5 px-3 text-amber-600 font-bold tabular-nums">
                      {item.totalDiscount > 0 ? `${item.totalDiscount.toLocaleString('ar-DZ')} دج` : '-'}
                    </td>
                    <td className="py-3.5 px-3 text-emerald-600 font-bold tabular-nums">
                      {item.totalPaid.toLocaleString('ar-DZ')} دج
                    </td>
                    <td className="py-3.5 px-3 font-black tabular-nums">
                      {item.balance > 0 ? (
                        <span className="text-rose-600">{item.balance.toLocaleString('ar-DZ')} دج</span>
                      ) : (
                        <span className="text-slate-400">0 دج</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      {item.status === 'PAID' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                          خالص بالكامل
                        </span>
                      ) : item.status === 'PARTIAL' ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200">
                          دفع جزئي
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                          غير مدفوع
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => openAddModal(item.childId)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg font-semibold transition-colors"
                      >
                        تسديد
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECEIPTS HISTORY */}
      {activeSubTab === 'receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">سجل وصولات والمعاملات المالية المسجلة</h3>
            <span className="text-xs text-slate-500">إجمالي الوصولات: {filteredPayments.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-4">رقم الوصل</th>
                  <th className="py-3.5 px-3">الطفل</th>
                  <th className="py-3.5 px-3">الولي</th>
                  <th className="py-3.5 px-3">الشهر</th>
                  <th className="py-3.5 px-3">المبلغ المدفوع</th>
                  <th className="py-3.5 px-3">طريقة الدفع</th>
                  <th className="py-3.5 px-3">التاريخ</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{p.receiptNumber}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{p.childName}</td>
                    <td className="py-3 px-3 text-slate-700">{p.parentName}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{p.month}</td>
                    <td className="py-3 px-3 font-black text-emerald-600 tabular-nums">
                      {p.amount.toLocaleString('ar-DZ')} دج
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {p.paymentMethod === 'BARIDIMOB'
                          ? 'بريدي موب BaridiMob'
                          : p.paymentMethod === 'CASH'
                          ? 'نقداً'
                          : p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{p.paymentDate}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPrintingPayment(p)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors flex items-center gap-1"
                          title="طباعة الوصل الرسمي"
                        >
                          <Printer className="w-3.5 h-3.5 text-blue-600" />
                          طباعة
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('هل أنت تأكد من إلغاء هذا الوصل المالي؟')) {
                              onVoidPayment(p.id);
                            }
                          }}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                          title="إلغاء الوصل"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD PAYMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">تسجيل دفعة جديدة وإصدار وصل</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اختر الطفل المعني *</label>
                <select
                  value={childId}
                  onChange={(e) => handleChildSelect(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="">اختر الطفل...</option>
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.parentName || 'ولي غير محدد'}) - {c.monthlyFee} دج
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">شهر الاستحقاق *</label>
                  <input
                    type="month"
                    required
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">طريقة الدفع *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    <option value="CASH">نقداً (Cash)</option>
                    <option value="BARIDIMOB">بريدي موب (BaridiMob)</option>
                    <option value="CHECK">شيك بنكي / بريدي</option>
                    <option value="TRANSFER">تحويل بنكي CCP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبلغ المدفوع (دج) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="13000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">خصم ممنوح (دج)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">ملاحظات على الدفعة</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: دفعة كاملة للشهر"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'جاري الإصدار...' : 'حفظ واستخراج الوصل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      {printingPayment && (
        <PrintReceiptModal payment={printingPayment} onClose={() => setPrintingPayment(null)} />
      )}
    </div>
  );
};
