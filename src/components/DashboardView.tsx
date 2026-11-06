import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  CreditCard,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { DashboardStats, User } from '../types';

interface DashboardViewProps {
  stats: DashboardStats | null;
  loading: boolean;
  currentUser: User;
  onNavigate: (tab: any) => void;
  onOpenAddChild: () => void;
  onOpenAddPayment: () => void;
  onOpenAddExpense: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  loading,
  currentUser,
  onNavigate,
  onOpenAddChild,
  onOpenAddPayment,
  onOpenAddExpense
}) => {
  if (loading || !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">جاري تحميل إحصائيات لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ar-DZ').format(val) + ' دج';
  };

  const isEducator = currentUser.role === 'EDUCATOR';

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-md mb-2">
            مرحباً بك، {currentUser.name}
          </span>
          <h2 className="text-2xl font-bold">منصة Crèche Manager DZ لتسيير الحضانة</h2>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            متابعة دقيقة للأطفال، الحضور والغياب اليومي، الاشتراكات والمدفوعات والمصاريف المالية.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate('attendance')}
            className="px-4 py-2.5 bg-white text-blue-700 font-semibold text-sm rounded-xl shadow-md hover:bg-blue-50 transition-all flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" />
            تسجيل الحضور
          </button>
          {!isEducator && (
            <>
              <button
                onClick={onOpenAddPayment}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl border border-white/20 transition-all flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                استلام دفعة
              </button>
              <button
                onClick={onOpenAddChild}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl backdrop-blur-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                تسجيل طفل
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registered Children */}
        <div
          onClick={() => onNavigate('children')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">الأطفال المسجلون</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.totalChildren}</span>
            <span className="text-xs text-slate-500 font-normal mr-2">طفل نشط</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>موزعون على الأقسام</span>
            <span className="text-blue-600 font-semibold flex items-center gap-1">عرض التراخيص ←</span>
          </div>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">حاضرون اليوم</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.presentToday}</span>
            <span className="text-xs text-slate-500 font-normal mr-2">من أصل {stats.totalChildren}</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-600 font-semibold">
            <span>نسبة الحضور: {stats.totalChildren > 0 ? Math.round((stats.presentToday / stats.totalChildren) * 100) : 0}%</span>
            <span>تفاصيل ←</span>
          </div>
        </div>

        {/* Absent Today */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">غائبون اليوم</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserX className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 tabular-nums">{stats.absentToday}</span>
            <span className="text-xs text-slate-500 font-normal mr-2">طفل غائب</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>يشمل الغياب المبرر</span>
            <span className="text-rose-600 font-semibold">متابعة ←</span>
          </div>
        </div>

        {/* Pending Debts */}
        {!isEducator && (
          <div
            onClick={() => onNavigate('payments')}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">الديون والمتأخرات</span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-amber-600 tabular-nums">{formatCurrency(stats.pendingDebt)}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-amber-700 font-semibold">
              <span>مستحقات هذا الشهر</span>
              <span>تحصيل ←</span>
            </div>
          </div>
        )}
      </div>

      {/* Financial Overview & Recent Transactions (for ADMIN and ACCOUNTANT) */}
      {!isEducator && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Financial Summary Box */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-5 lg:col-span-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                الحصيلة المالية لهذا الشهر
              </h3>
              <span className="text-xs text-slate-500 font-mono">{stats.currentMonth}</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ArrowDownRight className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">الاشتراكات المستلمة</p>
                    <p className="font-bold text-slate-900 tabular-nums">{formatCurrency(stats.paymentsReceived)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">المصاريف الكلية</p>
                    <p className="font-bold text-slate-900 tabular-nums">{formatCurrency(stats.expensesTotal)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-100">
                <div>
                  <p className="text-xs text-blue-700 font-semibold">صافي الإيرادات</p>
                  <p className="text-2xl font-black text-blue-900 tabular-nums mt-0.5">{formatCurrency(stats.netRevenue)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('reports')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors text-center"
            >
              عرض التقرير المالي التفصيلي
            </button>
          </div>

          {/* Recent Payment Receipts */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                آخر عمليات الدفع والوصولات
              </h3>
              <button
                onClick={() => onNavigate('payments')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                عرض كل المعاملات ←
              </button>
            </div>

            {stats.recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">لا توجد عمليات دفع مسجلة لهذا الشهر بعد</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-medium">
                      <th className="pb-3 pr-2">رقم الوصل</th>
                      <th className="pb-3">الطفل</th>
                      <th className="pb-3">المبلغ</th>
                      <th className="pb-3">التاريخ</th>
                      <th className="pb-3">طريقة الدفع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {stats.recentTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pr-2 font-mono text-blue-600 font-semibold">{tx.receiptNumber}</td>
                        <td className="py-3 font-semibold text-slate-900">{tx.childName}</td>
                        <td className="py-3 text-emerald-600 font-bold tabular-nums">{formatCurrency(tx.amount)}</td>
                        <td className="py-3 text-slate-500">{tx.date}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[11px]">
                            {tx.paymentMethod === 'BARIDIMOB'
                              ? 'بريدي موب BaridiMob'
                              : tx.paymentMethod === 'CASH'
                              ? 'نقداً'
                              : tx.paymentMethod}
                          </span>
                        </td>
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
  );
};
