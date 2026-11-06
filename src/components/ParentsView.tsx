import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  AlertTriangle,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  HeartHandshake
} from 'lucide-react';
import { Parent, Child } from '../types';

interface ParentsViewProps {
  parents: Parent[];
  onRefresh: () => void;
  onCreateParent: (data: Partial<Parent>) => Promise<void>;
  onUpdateParent: (id: string, data: Partial<Parent>) => Promise<void>;
  onDeleteParent: (id: string) => Promise<void>;
  onSelectParentForDetails: (parent: Parent) => void;
}

export const ParentsView: React.FC<ParentsViewProps> = ({
  parents,
  onRefresh,
  onCreateParent,
  onUpdateParent,
  onDeleteParent,
  onSelectParentForDetails
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingParent(null);
    setFullName('');
    setPhone('');
    setAltPhone('');
    setEmail('');
    setAddress('');
    setNationalId('');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (parent: Parent) => {
    setEditingParent(parent);
    setFullName(parent.fullName);
    setPhone(parent.phone);
    setAltPhone(parent.altPhone || '');
    setEmail(parent.email || '');
    setAddress(parent.address || '');
    setNationalId(parent.nationalId || '');
    setNotes(parent.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim() || !phone.trim()) {
      setFormError('الرجاء إدخال الاسم الكامل ورقم الهاتف الرئيسي');
      return;
    }

    const payload: Partial<Parent> = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      altPhone: altPhone.trim(),
      email: email.trim(),
      address: address.trim(),
      nationalId: nationalId.trim(),
      notes: notes.trim()
    };

    try {
      setSubmitting(true);
      if (editingParent) {
        await onUpdateParent(editingParent.id, payload);
      } else {
        await onCreateParent(payload);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'فشل حفظ بيانات الولي');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredParents = parents.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="البحث باسم الولي، رقم الهاتف أو البريد..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden transition-all"
          />
        </div>

        <button
          onClick={openAddModal}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          تسجيل ولي أمر جديد
        </button>
      </div>

      {/* Parents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParents.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold">لم يتم العثور على أية سجلات للأولياء</p>
          </div>
        ) : (
          filteredParents.map((parent) => {
            const childrenCount = parent.children ? parent.children.length : 0;

            return (
              <div
                key={parent.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-base border border-blue-100">
                        {parent.fullName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{parent.fullName}</h3>
                        <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-0.5 dir-ltr text-right">
                          <Phone className="w-3 h-3 text-blue-600 inline" />
                          {parent.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(parent)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                        title="تعديل البيانات"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteParent(parent.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف الولي"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Children tags */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                      الأطفال التابعون ({childrenCount}):
                    </p>
                    {childrenCount === 0 ? (
                      <span className="text-slate-400 text-xs italic">لا يوجد أطفال مرتبطون حالياً</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {parent.children?.map((child) => (
                          <span
                            key={child.id}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-medium border border-blue-100"
                          >
                            {child.firstName} {child.lastName} ({child.groupName || 'قسم غير محدد'})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Debt Status */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">مستحقات الشهر: </span>
                    <span
                      className={`font-bold tabular-nums ${
                        (parent.pendingDebt || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {(parent.pendingDebt || 0) > 0
                        ? `متأخر: ${(parent.pendingDebt || 0).toLocaleString('ar-DZ')} دج`
                        : 'خالص بنجاح'}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectParentForDetails(parent)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    السجل المالي ←
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD / EDIT PARENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingParent ? 'تعديل بيانات ولي الأمر' : 'تسجيل ولي أمر جديد'}
              </h3>
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
                <label className="block text-slate-700 font-semibold mb-1">الاسم واللقب الكامل *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="مثال: عبد القادر بن عيسى"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم الهاتف الرئيسي *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0550123456"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم هاتف ثانٍ (اختياري)</label>
                  <input
                    type="text"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    placeholder="0661998877"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@email.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">العنوان السكني</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="البلدية، الولاية..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">رقم بطاقة الهوية الوطنية NIN</label>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="1092837465..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : editingParent ? 'تحديث البيانات' : 'حفظ ولي الأمر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
