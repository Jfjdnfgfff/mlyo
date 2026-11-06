import React, { useState, useEffect } from 'react';
import { X, Heart, ShieldCheck, Phone, Calendar, CreditCard, User, Building } from 'lucide-react';
import { api } from '../services/api';
import { Child, Parent, Group, Payment } from '../types';

interface ChildDetailsModalProps {
  child: Child;
  onClose: () => void;
}

export const ChildDetailsModal: React.FC<ChildDetailsModalProps> = ({ child, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<{
    child: Child & { parent?: Parent; group?: Group };
    payments: Payment[];
  } | null>(null);

  useEffect(() => {
    loadDetails();
  }, [child.id]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await api.getChildById(child.id);
      if (res.success) {
        setDetails(res);
      }
    } catch (err) {
      console.error('فشل تحميل السجل الكامل للطفل:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-5 my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                child.gender === 'M' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
              }`}
            >
              {child.firstName.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                السجل الكامل للطفل: {child.firstName} {child.lastName}
              </h3>
              <p className="text-xs text-slate-500">مسجل بتاريخ: {child.registrationDate}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !details ? (
          <div className="py-12 text-center text-slate-400 text-xs">جاري تحميل بيانات السجل الكامل...</div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Personal Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  البيانات الشخصية والتعليمية
                </h4>
                <p>
                  <span className="text-slate-500">تاريخ الميلاد: </span>
                  <span className="font-bold text-slate-900">{child.birthDate}</span>
                </p>
                <p>
                  <span className="text-slate-500">الجنس: </span>
                  <span className="font-bold text-slate-900">{child.gender === 'M' ? 'ذكر' : 'أنثى'}</span>
                </p>
                <p>
                  <span className="text-slate-500">القسم: </span>
                  <span className="font-bold text-slate-900">{child.groupName || 'غير معين'}</span>
                </p>
                <p>
                  <span className="text-slate-500">مبلغ الاشتراك الشهري: </span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {child.monthlyFee.toLocaleString('ar-DZ')} دج
                  </span>
                </p>
              </div>

              {/* Parent Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  معلومات ولي الأمر والتواصل
                </h4>
                <p>
                  <span className="text-slate-500">اسم الولي: </span>
                  <span className="font-bold text-slate-900">{child.parentName || 'غير مسجل'}</span>
                </p>
                <p>
                  <span className="text-slate-500">رقم الهاتف: </span>
                  <span className="font-bold text-slate-900 font-mono dir-ltr text-right">{child.parentPhone}</span>
                </p>
                <p>
                  <span className="text-slate-500">العنوان: </span>
                  <span className="font-bold text-slate-900">{child.address || 'غير مدون'}</span>
                </p>
              </div>
            </div>

            {/* Health & Pickups */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-1">
                <h4 className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-rose-600" />
                  الحالة الصحية والاحتياجات
                </h4>
                <p className="text-rose-900 font-medium">{child.healthNotes || 'لا توجد أية ملاحظات صحية خاصة'}</p>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-1">
                <h4 className="font-bold text-blue-800 text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  المصرح لهم بالمغادرة والاستلام
                </h4>
                {child.authorizedPickups && child.authorizedPickups.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5 text-blue-900 font-medium">
                    {child.authorizedPickups.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-blue-900 font-medium">الوالدان فقط</p>
                )}
              </div>
            </div>

            {/* Historic Financial Payments */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                سجل المدفوعات والاشتراكات المالية للطفل ({details.payments.length} وصل)
              </h4>

              {details.payments.length === 0 ? (
                <p className="text-slate-400 text-xs italic">لا توجد تسديدات مسجلة للطفل بعد</p>
              ) : (
                <div className="overflow-x-auto max-h-48 border border-slate-200 rounded-xl">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <th className="py-2 px-3">رقم الوصل</th>
                        <th className="py-2 px-3">الشهر</th>
                        <th className="py-2 px-3">المبلغ</th>
                        <th className="py-2 px-3">التاريخ</th>
                        <th className="py-2 px-3">طريقة الدفع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {details.payments.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 px-3 font-mono font-bold text-blue-600">{p.receiptNumber}</td>
                          <td className="py-2 px-3 font-mono text-slate-700">{p.month}</td>
                          <td className="py-2 px-3 font-bold text-emerald-600 tabular-nums">
                            {p.amount.toLocaleString('ar-DZ')} دج
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-mono">{p.paymentDate}</td>
                          <td className="py-2 px-3 text-slate-600">{p.paymentMethod}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
