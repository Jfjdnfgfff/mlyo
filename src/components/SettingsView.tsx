import React, { useState, useEffect } from 'react';
import {
  Settings,
  Users,
  Shield,
  Download,
  Upload,
  UserPlus,
  Building2,
  FileText,
  X,
  CheckCircle2,
  Lock,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { User, AuditLog, UserRole } from '../types';

interface SettingsViewProps {
  currentUser: User;
  onRefresh: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'backup' | 'logs'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Add User Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('EDUCATOR');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadData();
  }, [activeSubTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeSubTab === 'users') {
        const res = await api.getUsers();
        if (res.success) setUsers(res.users);
      } else if (activeSubTab === 'logs') {
        const res = await api.getAuditLogs();
        if (res.success) setAuditLogs(res.logs);
      }
    } catch (err) {
      console.error('فشل تحميل بيانات الإعدادات:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportBackup = () => {
    window.open('/api/backup/export', '_blank');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const res = await api.restoreBackup(json);
          if (res.success) {
            setMsg('تمت استعادة قاعدة البيانات والنسخة الاحتياطية بنجاح!');
            setTimeout(() => setMsg(''), 4000);
            onRefresh();
          }
        } catch (err: any) {
          alert('ملف النسخة الاحتياطية غير صالح أو معطوب');
        }
      };
      reader.readAsText(file);
    } catch (err: any) {
      alert('فشل قراءة الملف');
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !email.trim()) {
      setFormError('الرجاء إدخال الاسم الكامل والبريد الإلكتروني');
      return;
    }

    try {
      setSubmitting(true);
      await api.createUser({ name: name.trim(), email: email.trim(), role, phone: phone.trim() });
      setIsUserModalOpen(false);
      setMsg('تم إنشاء حساب المستخدم بنجاح');
      setTimeout(() => setMsg(''), 3000);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'فشل إضافة المستخدم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('هل أنت تأكد من حذف حساب هذا المستخدم؟')) {
      try {
        const res = await api.deleteUser(userId);
        if (res.success) {
          setMsg('تم حذف الحساب بنجاح');
          setTimeout(() => setMsg(''), 3000);
          loadData();
        }
      } catch (err: any) {
        alert(err.message || 'فشل حذف المستخدم');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'users' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            المستخدمون والصلاحيات
          </button>
          <button
            onClick={() => setActiveSubTab('backup')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'backup' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            النسخ الاحتياطي والاسترجاع
          </button>
          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'logs' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            سجل العمليات Audit Logs
          </button>
        </div>

        {msg && (
          <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold">
            {msg}
          </span>
        )}
      </div>

      {/* TAB 1: USERS & RBAC */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">حسابات مستخدمي المنصة المعتمدين</h3>
            <button
              onClick={() => {
                setName('');
                setEmail('');
                setRole('EDUCATOR');
                setPhone('');
                setFormError('');
                setIsUserModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              إضافة حساب مستخدم جديد
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-4">اسم المستخدم</th>
                  <th className="py-3.5 px-3">البريد الإلكتروني</th>
                  <th className="py-3.5 px-3">رقم الهاتف</th>
                  <th className="py-3.5 px-3">الدور / الصلاحية</th>
                  <th className="py-3.5 px-3">تاريخ الإنشاء</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-600 dir-ltr text-right">{u.email}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-600">{u.phone || '-'}</td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : u.role === 'EDUCATOR'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {u.role === 'ADMIN' ? 'المدير' : u.role === 'EDUCATOR' ? 'مربية' : 'محاسب'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-400 font-mono">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-DZ') : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {u.id !== currentUser.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف هذا الحساب"
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
        </div>
      )}

      {/* TAB 2: BACKUP & RESTORE */}
      {activeSubTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">تصدير وتنزيل نسخة احتياطية</h3>
              <p className="text-xs text-slate-500 mt-1">
                تنزيل ملف JSON يحتوي على كافة بيانات الأطفال، الحضور، الأولياء، المعاملات المالية والمصاريف لحفظها بأمان.
              </p>
            </div>
            <button
              onClick={handleExportBackup}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل النسخة الاحتياطية (JSON)
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">استعادة نسخة احتياطية</h3>
              <p className="text-xs text-slate-500 mt-1">
                رفع ملف JSON لنسخة احتياطية سابقة واسترجاع كافة البيانات والسجلات كاملة إلى النظام.
              </p>
            </div>
            <label className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              اختيار واسترجاع ملف (JSON)
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">سجل التدقيق والعمليات الأمنية (Audit Trail)</h3>
            <span className="text-xs text-slate-500">عدد الأحداث: {auditLogs.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-4">تاريخ ووقت الإجراء</th>
                  <th className="py-3.5 px-3">المستخدم</th>
                  <th className="py-3.5 px-3">نوع العملية</th>
                  <th className="py-3.5 px-3">التفاصيل والوصف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString('ar-DZ')}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900">{log.userName}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-700">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">إضافة حساب جديد للمنصة</h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: ياسمين حماني"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">البريد الإلكتروني (للتسجيل) *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@creche.dz"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden dir-ltr text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">الصلاحية *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    <option value="EDUCATOR">مربية (Educator)</option>
                    <option value="ACCOUNTANT">محاسب (Accountant)</option>
                    <option value="ADMIN">مدير (Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">رقم الهاتف</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0550123456"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-600 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'جاري الحفظ...' : 'إنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
