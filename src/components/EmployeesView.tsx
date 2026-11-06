import React, { useState } from 'react';
import { UserCog, Plus, Search, DollarSign, Calendar, Phone, Edit3, Trash2, X, CheckCircle } from 'lucide-react';
import { Employee, SalaryPayment, User } from '../types';

interface EmployeesViewProps {
  employees: Employee[];
  salaryPayments: SalaryPayment[];
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  currentUser: User;
  onRefresh: () => void;
  onCreateEmployee: (data: Partial<Employee>) => Promise<void>;
  onUpdateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;
  onDeleteEmployee: (id: string) => Promise<void>;
  onCreateSalaryPayment: (data: {
    employeeId: string;
    month: string;
    baseSalary?: number;
    bonus?: number;
    deductions?: number;
    notes?: string;
  }) => Promise<void>;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  employees,
  salaryPayments,
  selectedMonth,
  setSelectedMonth,
  currentUser,
  onRefresh,
  onCreateEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onCreateSalaryPayment
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'salaries'>('employees');

  // Add / Edit Employee Modal
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState<Employee['jobTitle']>('EDUCATOR');
  const [monthlySalary, setMonthlySalary] = useState('35000');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Salary Payment Modal
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [bonus, setBonus] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [salaryMonth, setSalaryMonth] = useState(selectedMonth);
  const [salaryNotes, setSalaryNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const jobLabels: Record<Employee['jobTitle'], string> = {
    EDUCATOR: 'مربية فئوية',
    ASSISTANT: 'مساعدة مربية',
    COOK: 'طباخة الحضانة',
    CLEANER: 'عاملة نظافة',
    DRIVER: 'سائق حافلة النقل',
    OTHER: 'موظف آخر'
  };

  const openAddEmpModal = () => {
    setEditingEmp(null);
    setFullName('');
    setPhone('');
    setJobTitle('EDUCATOR');
    setMonthlySalary('35000');
    setHireDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError('');
    setIsEmpModalOpen(true);
  };

  const openEditEmpModal = (emp: Employee) => {
    setEditingEmp(emp);
    setFullName(emp.fullName);
    setPhone(emp.phone);
    setJobTitle(emp.jobTitle);
    setMonthlySalary(String(emp.monthlySalary));
    setHireDate(emp.hireDate);
    setNotes(emp.notes || '');
    setFormError('');
    setIsEmpModalOpen(true);
  };

  const openSalaryModal = (emp?: Employee) => {
    const target = emp || employees[0];
    if (target) {
      setSelectedEmpId(target.id);
      setBaseSalary(String(target.monthlySalary));
    }
    setBonus('0');
    setDeductions('0');
    setSalaryMonth(selectedMonth);
    setSalaryNotes('');
    setFormError('');
    setIsSalaryModalOpen(true);
  };

  const handleEmpSelectForSalary = (id: string) => {
    setSelectedEmpId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp) {
      setBaseSalary(String(emp.monthlySalary));
    }
  };

  const handleEmpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim() || !monthlySalary) {
      setFormError('الرجاء إدخال اسم الموظف والراتب الشهري الأساسي');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<Employee> = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        jobTitle,
        monthlySalary: Number(monthlySalary),
        hireDate,
        notes: notes.trim()
      };

      if (editingEmp) {
        await onUpdateEmployee(editingEmp.id, payload);
      } else {
        await onCreateEmployee(payload);
      }
      setIsEmpModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'فشل حفظ بيانات الموظف');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedEmpId || !salaryMonth) {
      setFormError('الرجاء اختيار الموظف وشهر الراتب المعني');
      return;
    }

    try {
      setSubmitting(true);
      await onCreateSalaryPayment({
        employeeId: selectedEmpId,
        month: salaryMonth,
        baseSalary: Number(baseSalary),
        bonus: Number(bonus) || 0,
        deductions: Number(deductions) || 0,
        notes: salaryNotes.trim()
      });
      setIsSalaryModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'فشل تسديد راتب الموظف');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Sub-tabs */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'employees' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سجل الموظفين والمربيات
            </button>
            <button
              onClick={() => setActiveTab('salaries')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'salaries' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              جدول تسديد الرواتب
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

        {currentUser.role === 'ADMIN' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openSalaryModal()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              تسديد راتب شهري
            </button>
            <button
              onClick={openAddEmpModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              توظيف شخص جديد
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: EMPLOYEES GRID */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-700 font-bold flex items-center justify-center text-sm border border-purple-100">
                    {emp.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{emp.fullName}</h3>
                    <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {jobLabels[emp.jobTitle] || emp.jobTitle}
                    </span>
                  </div>
                </div>

                {currentUser.role === 'ADMIN' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditEmpModal(emp)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      title="تعديل الموظف"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteEmployee(emp.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono dir-ltr text-right">{emp.phone || 'بدون رقم'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>تاريخ التوظيف: {emp.hireDate}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">الراتب الشهري: </span>
                  <span className="font-extrabold text-slate-900 tabular-nums">
                    {emp.monthlySalary.toLocaleString('ar-DZ')} دج
                  </span>
                </div>

                <button
                  onClick={() => openSalaryModal(emp)}
                  className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-xs transition-colors"
                >
                  صرف الراتب
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SALARY PAYOUTS */}
      {activeTab === 'salaries' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">سجل الرواتب المدفوعة لشهر {selectedMonth}</h3>
            <span className="text-xs text-slate-500">إجمالي الرواتب: {salaryPayments.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-4">اسم الموظف</th>
                  <th className="py-3.5 px-3">الشهر</th>
                  <th className="py-3.5 px-3">الراتب الأساسي</th>
                  <th className="py-3.5 px-3">المكافآت (+)</th>
                  <th className="py-3.5 px-3">الخصومات (-)</th>
                  <th className="py-3.5 px-3">الصافي المدفوع</th>
                  <th className="py-3.5 px-3">تاريخ الدفع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {salaryPayments.map((sal) => (
                  <tr key={sal.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{sal.employeeName}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">{sal.month}</td>
                    <td className="py-3.5 px-3 text-slate-700 tabular-nums">
                      {sal.baseSalary.toLocaleString('ar-DZ')} دج
                    </td>
                    <td className="py-3.5 px-3 text-emerald-600 font-bold tabular-nums">
                      {sal.bonus > 0 ? `+${sal.bonus.toLocaleString('ar-DZ')} دج` : '-'}
                    </td>
                    <td className="py-3.5 px-3 text-rose-600 font-bold tabular-nums">
                      {sal.deductions > 0 ? `-${sal.deductions.toLocaleString('ar-DZ')} دج` : '-'}
                    </td>
                    <td className="py-3.5 px-3 font-black text-slate-900 text-sm tabular-nums">
                      {sal.netPaid.toLocaleString('ar-DZ')} دج
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 font-mono">{sal.paymentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {isEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingEmp ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد إلى الحضانة'}
              </h3>
              <button onClick={() => setIsEmpModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleEmpSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب الكامل *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: مريم حداد"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الوظيفة / المهمة *</label>
                  <select
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    {Object.entries(jobLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الراتب الشهري (دج) *</label>
                  <input
                    type="number"
                    required
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    placeholder="35000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0661234567"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">تاريخ التوظيف</label>
                  <input
                    type="date"
                    value={hireDate}
                    onChange={(e) => setHireDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : editingEmp ? 'تحديث البيانات' : 'حفظ الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD SALARY PAYOUT MODAL */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">تسديد وصرف راتب موظف</h3>
              <button onClick={() => setIsSalaryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSalarySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">اختر الموظف المعني *</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => handleEmpSelectForSalary(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="">اختر الموظف...</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} ({jobLabels[e.jobTitle]}) - {e.monthlySalary} دج
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">شهر التسديد *</label>
                <input
                  type="month"
                  required
                  value={salaryMonth}
                  onChange={(e) => setSalaryMonth(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الأساسي (دج)</label>
                  <input
                    type="number"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-emerald-700 font-semibold mb-1">مكافأة (+)</label>
                  <input
                    type="number"
                    value={bonus}
                    onChange={(e) => setBonus(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-emerald-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-rose-700 font-semibold mb-1">خصومات (-)</label>
                  <input
                    type="number"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-rose-700 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between border border-slate-200">
                <span className="font-bold text-slate-800">الصافي الذي سيتم صرفه:</span>
                <span className="font-black text-xl text-slate-900 tabular-nums">
                  {(
                    Math.max(0, Number(baseSalary) + Number(bonus) - Number(deductions))
                  ).toLocaleString('ar-DZ')}{' '}
                  دج
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'جاري الصرف...' : 'تأكيد وصرف الراتب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
