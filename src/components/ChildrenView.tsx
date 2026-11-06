import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Archive,
  Phone,
  Heart,
  ShieldCheck,
  Calendar,
  X,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { Child, Group, Parent, Payment, User } from '../types';

interface ChildrenViewProps {
  childrenList: Child[];
  groups: Group[];
  parents: Parent[];
  currentUser: User;
  onRefresh: () => void;
  onCreateChild: (data: Partial<Child>) => Promise<void>;
  onUpdateChild: (id: string, data: Partial<Child>) => Promise<void>;
  onArchiveChild: (id: string) => Promise<void>;
  onOpenChildDetails: (child: Child) => void;
}

export const ChildrenView: React.FC<ChildrenViewProps> = ({
  childrenList,
  groups,
  parents,
  currentUser,
  onRefresh,
  onCreateChild,
  onUpdateChild,
  onArchiveChild,
  onOpenChildDetails
}) => {
  const [search, setSearch] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [groupId, setGroupId] = useState('');
  const [parentId, setParentId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [address, setAddress] = useState('');
  const [healthNotes, setHealthNotes] = useState('');
  const [authorizedPickupsText, setAuthorizedPickupsText] = useState('');
  const [notes, setNotes] = useState('');
  const [monthlyFee, setMonthlyFee] = useState('13000');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const isEducator = currentUser.role === 'EDUCATOR';

  const openAddModal = () => {
    setEditingChild(null);
    setFirstName('');
    setLastName('');
    setBirthDate('');
    setGender('M');
    setGroupId(groups[0]?.id || '');
    setParentId('');
    setParentName('');
    setParentPhone('');
    setAddress('');
    setHealthNotes('');
    setAuthorizedPickupsText('الأب والأم');
    setNotes('');
    setMonthlyFee('13000');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (child: Child) => {
    setEditingChild(child);
    setFirstName(child.firstName);
    setLastName(child.lastName);
    setBirthDate(child.birthDate);
    setGender(child.gender);
    setGroupId(child.groupId);
    setParentId(child.parentId);
    setParentName(child.parentName || '');
    setParentPhone(child.parentPhone || '');
    setAddress(child.address || '');
    setHealthNotes(child.healthNotes || '');
    setAuthorizedPickupsText((child.authorizedPickups || []).join('\n'));
    setNotes(child.notes || '');
    setMonthlyFee(String(child.monthlyFee));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!firstName.trim() || !lastName.trim()) {
      setFormError('الرجاء إدخال اسم ولقب الطفل');
      return;
    }

    if (!birthDate) {
      setFormError('الرجاء تحديد تاريخ الميلاد');
      return;
    }

    const pickupsArray = authorizedPickupsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload: Partial<Child> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthDate,
      gender,
      groupId,
      parentId,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      address: address.trim(),
      healthNotes: healthNotes.trim(),
      authorizedPickups: pickupsArray,
      notes: notes.trim(),
      monthlyFee: Number(monthlyFee) || 12000
    };

    try {
      setSubmitting(true);
      if (editingChild) {
        await onUpdateChild(editingChild.id, payload);
      } else {
        await onCreateChild(payload);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'فشل حفظ بيانات الطفل');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter children
  const filteredChildren = childrenList.filter((c) => {
    if (!showArchived && c.status === 'ARCHIVED') return false;
    if (showArchived && c.status !== 'ARCHIVED') return false;
    if (selectedGroupId && c.groupId !== selectedGroupId) return false;
    if (search) {
      const q = search.toLowerCase();
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const pName = (c.parentName || '').toLowerCase();
      const pPhone = c.parentPhone || '';
      return fullName.includes(q) || pName.includes(q) || pPhone.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث باسم الطفل، الولي أو رقم الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="py-2 px-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-hidden"
            >
              <option value="">جميع الأقسام</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              showArchived
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {showArchived ? 'عرض الأطفال النشطين' : 'الأرشيف والمستبعدين'}
          </button>

          {!isEducator && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة طفل جديد
            </button>
          )}
        </div>
      </div>

      {/* Children List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredChildren.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold">لم يتم العثور على أية ملفات للأطفال</p>
            <p className="text-xs text-slate-400">يمكنك تعديل معايير البحث أو إضافة طفل جديد إلى النظام</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-4">اسم ولقب الطفل</th>
                  <th className="py-3.5 px-3">الجنس / السن</th>
                  <th className="py-3.5 px-3">القسم</th>
                  <th className="py-3.5 px-3">الولي ورقم الهاتف</th>
                  <th className="py-3.5 px-3">الاشتراك الشهري</th>
                  <th className="py-3.5 px-3">ملاحظات صحية</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredChildren.map((child) => {
                  const birthYear = child.birthDate ? new Date(child.birthDate).getFullYear() : 2024;
                  const ageYears = new Date().getFullYear() - birthYear;

                  return (
                    <tr key={child.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Name */}
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                              child.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                            }`}
                          >
                            {child.firstName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">
                              {child.firstName} {child.lastName}
                            </p>
                            <p className="text-[11px] text-slate-500 font-normal">تسجيل: {child.registrationDate}</p>
                          </div>
                        </div>
                      </td>

                      {/* Gender / Age */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-700">
                          {child.gender === 'M' ? 'ذكر' : 'أنثى'} ({ageYears} سنة)
                        </span>
                      </td>

                      {/* Group */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {child.groupName || 'غير معين'}
                        </span>
                      </td>

                      {/* Parent */}
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-medium text-slate-900">{child.parentName || 'غير مسجل'}</p>
                          <p className="text-slate-500 text-[11px] font-mono dir-ltr text-right">{child.parentPhone}</p>
                        </div>
                      </td>

                      {/* Fee */}
                      <td className="py-3 px-3 font-bold text-slate-900 tabular-nums">
                        {child.monthlyFee.toLocaleString('ar-DZ')} دج
                      </td>

                      {/* Health */}
                      <td className="py-3 px-3">
                        {child.healthNotes ? (
                          <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md font-medium text-[11px] flex items-center gap-1 w-fit">
                            <Heart className="w-3 h-3 fill-rose-500" />
                            {child.healthNotes}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">سليم</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenChildDetails(child)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="عرض الملف الكامل"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isEducator && (
                            <>
                              <button
                                onClick={() => openEditModal(child)}
                                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="تعديل الملف"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onArchiveChild(child.id)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="أرشفة الطفل"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT CHILD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingChild ? `تعديل ملف الطفل: ${editingChild.firstName}` : 'إضافة طفل جديد إلى الحضانة'}
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

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الاسم الأول *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="مثال: أمين"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اللقب *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="مثال: بن علي"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">تاريخ الميلاد *</label>
                  <input
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الجنس *</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    <option value="M">ذكر</option>
                    <option value="F">أنثى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">القسم / الفئة العمرية</label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    <option value="">اختر القسم...</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.enrolledCount || 0}/{g.maxCapacity})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">اسم الولي الكامل</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="مثال: محمد بلقاسم"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم هاتف الولي</label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="0550123456"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">مبلغ الاشتراك الشهري (دج)</label>
                  <input
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    placeholder="13000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono"
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
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">معلومات وحالة صحية خاصة (حساسية، دواء...)</label>
                <input
                  type="text"
                  value={healthNotes}
                  onChange={(e) => setHealthNotes(e.target.value)}
                  placeholder="مثال: حساسية من الفول السوداني أو عدم تناول الحليب البقري"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الأشخاص المصرح لهم باستلام الطفل (سطر لكل شخص)</label>
                <textarea
                  rows={2}
                  value={authorizedPickupsText}
                  onChange={(e) => setAuthorizedPickupsText(e.target.value)}
                  placeholder="الأب: محمد بلقاسم (0550123456)&#10;الجدة: فاطمة بلقاسم"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                ></textarea>
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : editingChild ? 'تحديث البيانات' : 'حفظ وتسجيل الطفل'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
