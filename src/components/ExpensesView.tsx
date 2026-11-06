import React, { useState } from 'react';
import { TrendingDown, Plus, Search, Filter, Trash2, X, DollarSign, Calendar } from 'lucide-react';
import { Expense, User } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  currentUser: User;
  onRefresh: () => void;
  onCreateExpense: (data: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  selectedMonth,
  setSelectedMonth,
  currentUser,
  onRefresh,
  onCreateExpense,
  onDeleteExpense
}) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  // Add Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('FOOD');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const categoryLabels: Record<Expense['category'], string> = {
    SALARY: 'رواتب الموظفين',
    RENT: 'إيجار المقر',
    UTILITIES: 'الكهرباء والغاز والماء',
    FOOD: 'الطعام والتغذية',
    CLEANING: 'أدوات ومواد التنظيف',
    MAINTENANCE: 'الصيانة والترميم',
    SUPPLIES: 'الأدوات التعليمية والألعاب',
    OTHER: 'مصاريف متنوعة'
  };

  const openAddModal = () => {
    setTitle('');
    setCategory('FOOD');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setRecipient('');
    setDescription('');
    setPaymentMethod('CASH');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !amount || Number(amount) <= 0) {
      setFormError('الرجاء إدخال عنوان المصروف والمبلغ المستحق بالشكل الصحيح');
      return;
    }

    try {
      setSubmitting(true);
      await onCreateExpense({
        title: title.trim(),
        category,
        amount: Number(amount),
        date,
        recipient: recipient.trim(),
        description: description.trim(),
        paymentMethod
      });
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'فشل إضافة المصروف');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    if (selectedCategory && e.category !== selectedCategory) return false;
    if (selectedMonth && !e.date.startsWith(selectedMonth)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.title.toLowerCase().includes(q) ||
        (e.recipient && e.recipient.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-500 font-semibold">الشهر:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-hidden font-mono"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden"
            >
              <option value="">جميع التصنيفات</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث بالبيان أو المستفيد..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>

          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة مصروف جديد
          </button>
        </div>
      </div>

      {/* KPI Total Expenses */}
      <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-rose-800">إجمالي المصاريف المسجلة لهذا الفلتر:</span>
          <p className="text-2xl font-black text-rose-900 tabular-nums mt-0.5">
            {totalExpenseAmount.toLocaleString('ar-DZ')} دج
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold">
          <TrendingDown className="w-5 h-5" />
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">لا توجد مصاريف مسجلة بهذا الفلتر</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-4">عنوان المصروف / البيان</th>
                  <th className="py-3.5 px-3">التصنيف</th>
                  <th className="py-3.5 px-3">المبلغ</th>
                  <th className="py-3.5 px-3">الجهة المستفيدة</th>
                  <th className="py-3.5 px-3">التاريخ</th>
                  <th className="py-3.5 px-3">المسجل</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>
                        <p>{exp.title}</p>
                        {exp.description && <p className="text-[11px] text-slate-400 font-normal">{exp.description}</p>}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-[11px]">
                        {categoryLabels[exp.category] || exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-extrabold text-rose-600 tabular-nums">
                      {exp.amount.toLocaleString('ar-DZ')} دج
                    </td>
                    <td className="py-3 px-3 text-slate-700">{exp.recipient || '-'}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{exp.date}</td>
                    <td className="py-3 px-3 text-slate-500">{exp.recordedByName || 'المحاسب'}</td>
                    <td className="py-3 px-4 text-center">
                      {currentUser.role === 'ADMIN' && (
                        <button
                          onClick={() => {
                            if (confirm('هل أنت تأكد من حذف هذا المصروف؟')) {
                              onDeleteExpense(exp.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف المصروف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">إضافة مصروف جديد إلى الحضانة</h3>
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
                <label className="block text-slate-700 font-semibold mb-1">عنوان أو بيان المصروف *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: فاتورة سونلغاز / شراء طعام للأطفال"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">التصنيف الرئيسي *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">المبلغ (دج) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="15000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">تاريخ الصرف *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">طريقة الدفع</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    <option value="CASH">نقداً</option>
                    <option value="CHECK">شيك</option>
                    <option value="BARIDIMOB">بريدي موب</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الجهة / المورد المستفيد</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="مثال: شركة سونلغاز / المحل التمويلي"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">تفاصيل إضافية</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف تفصيلي..."
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : 'تسديد وحفظ المصروف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
