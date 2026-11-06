import React, { useState } from 'react';
import { School, Plus, Users, UserCheck, Edit3, Trash2, X, AlertCircle } from 'lucide-react';
import { Group, Employee, User } from '../types';

interface GroupsViewProps {
  groups: Group[];
  employees: Employee[];
  currentUser: User;
  onRefresh: () => void;
  onCreateGroup: (data: Partial<Group>) => Promise<void>;
  onUpdateGroup: (id: string, data: Partial<Group>) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
}

export const GroupsView: React.FC<GroupsViewProps> = ({
  groups,
  employees,
  currentUser,
  onRefresh,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);

  const [name, setName] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('15');
  const [educatorId, setEducatorId] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const educators = employees.filter((e) => e.jobTitle === 'EDUCATOR');

  const openAddModal = () => {
    setEditingGroup(null);
    setName('');
    setMaxCapacity('15');
    setEducatorId(educators[0]?.id || '');
    setAgeRange('');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (grp: Group) => {
    setEditingGroup(grp);
    setName(grp.name);
    setMaxCapacity(String(grp.maxCapacity));
    setEducatorId(grp.educatorId || '');
    setAgeRange(grp.ageRange || '');
    setDescription(grp.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !maxCapacity) {
      setFormError('الرجاء إدخال اسم القسم والطاقة الاستيعابية القصوى');
      return;
    }

    const selectedEdu = educators.find((e) => e.id === educatorId);

    try {
      setSubmitting(true);
      const payload: Partial<Group> = {
        name: name.trim(),
        maxCapacity: Number(maxCapacity),
        educatorId,
        educatorName: selectedEdu ? selectedEdu.fullName : '',
        ageRange: ageRange.trim(),
        description: description.trim()
      };

      if (editingGroup) {
        await onUpdateGroup(editingGroup.id, payload);
      } else {
        await onCreateGroup(payload);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'فشل حفظ بيانات القسم');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">إدارة الأقسام والمجموعات التعليمية</h2>
          <p className="text-xs text-slate-500 mt-0.5">تنظيم وتوزيع الأطفال حسب الفئات العمرية والطاقة الاستيعابية</p>
        </div>

        {currentUser.role === 'ADMIN' && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إنشاء قسم جديد
          </button>
        )}
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groups.map((g) => {
          const enrolled = g.enrolledCount || 0;
          const pct = Math.min(100, Math.round((enrolled / g.maxCapacity) * 100));

          return (
            <div
              key={g.id}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center">
                    <School className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{g.name}</h3>
                    <p className="text-xs text-slate-500">{g.ageRange || 'فئة عمرية عامة'}</p>
                  </div>
                </div>

                {currentUser.role === 'ADMIN' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      title="تعديل القسم"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteGroup(g.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف القسم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Progress bar capacity */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">الأطفال المسجلون</span>
                  <span className={g.isFull ? 'text-rose-600' : 'text-slate-900'}>
                    {enrolled} / {g.maxCapacity} طفل
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      g.isFull ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>

              {/* Details */}
              <div className="pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <p>
                  <span className="font-semibold text-slate-700">المربية المسؤولة: </span>
                  {g.educatorName || 'غير معينة'}
                </p>
                {g.description && <p className="text-slate-400 text-[11px] mt-1">{g.description}</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT GROUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">{editingGroup ? 'تعديل القسم' : 'إنشاء قسم جديد'}</h3>
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
                <label className="block text-slate-700 font-semibold mb-1">اسم القسم / المجموعة *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: قسم البراعم (2 - 3 سنوات)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الطاقة الاستيعابية القصوى *</label>
                  <input
                    type="number"
                    required
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    placeholder="15"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الفئة العمرية</label>
                  <input
                    type="text"
                    value={ageRange}
                    onChange={(e) => setAgeRange(e.target.value)}
                    placeholder="مثال: 2 - 3 سنوات"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">تنسيق وتعيين المربية المسؤولة</label>
                <select
                  value={educatorId}
                  onChange={(e) => setEducatorId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="">اختر المربية...</option>
                  {educators.map((edu) => (
                    <option key={edu.id} value={edu.id}>
                      {edu.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">الوصف والأنشطة المقررة</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر للمجموعة..."
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : editingGroup ? 'تحديث القسم' : 'حفظ وإنشاء القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
