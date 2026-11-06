import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CreditCard,
  TrendingDown,
  UserCog,
  School,
  FileBarChart,
  Settings,
  HeartHandshake,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { UserRole, User } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'children'
  | 'parents'
  | 'attendance'
  | 'payments'
  | 'expenses'
  | 'employees'
  | 'groups'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  mobileOpen,
  setMobileOpen
}) => {
  const role = currentUser.role;

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'لوحة التحكم',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'EDUCATOR', 'ACCOUNTANT']
    },
    {
      id: 'children' as ActiveTab,
      label: 'إدارة الأطفال',
      icon: Users,
      roles: ['ADMIN', 'EDUCATOR', 'ACCOUNTANT']
    },
    {
      id: 'parents' as ActiveTab,
      label: 'إدارة الأولياء',
      icon: HeartHandshake,
      roles: ['ADMIN', 'ACCOUNTANT']
    },
    {
      id: 'attendance' as ActiveTab,
      label: 'الحضور والغياب',
      icon: UserCheck,
      roles: ['ADMIN', 'EDUCATOR', 'ACCOUNTANT']
    },
    {
      id: 'payments' as ActiveTab,
      label: 'الاشتراكات والمدفوعات',
      icon: CreditCard,
      roles: ['ADMIN', 'ACCOUNTANT']
    },
    {
      id: 'expenses' as ActiveTab,
      label: 'إدارة المصاريف',
      icon: TrendingDown,
      roles: ['ADMIN', 'ACCOUNTANT']
    },
    {
      id: 'employees' as ActiveTab,
      label: 'الموظفون والمربيات',
      icon: UserCog,
      roles: ['ADMIN', 'ACCOUNTANT']
    },
    {
      id: 'groups' as ActiveTab,
      label: 'الأقسام والمجموعات',
      icon: School,
      roles: ['ADMIN', 'EDUCATOR', 'ACCOUNTANT']
    },
    {
      id: 'reports' as ActiveTab,
      label: 'التقارير الشاملة',
      icon: FileBarChart,
      roles: ['ADMIN', 'ACCOUNTANT']
    },
    {
      id: 'settings' as ActiveTab,
      label: 'الإعدادات والنسخ',
      icon: Settings,
      roles: ['ADMIN']
    }
  ];

  const visibleNavItems = navItems.filter((item) => item.roles.includes(role));

  const roleLabels: Record<UserRole, { label: string; bg: string; color: string }> = {
    ADMIN: { label: 'مدير الحضانة', bg: 'bg-blue-50', color: 'text-blue-700' },
    EDUCATOR: { label: 'مربية فئوية', bg: 'bg-emerald-50', color: 'text-emerald-700' },
    ACCOUNTANT: { label: 'محاسب مالي', bg: 'bg-purple-50', color: 'text-purple-700' }
  };

  const roleInfo = roleLabels[role] || roleLabels.ADMIN;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 bg-white border-l border-slate-200 shadow-xl lg:shadow-none lg:static flex flex-col transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">Crèche Manager DZ</h1>
              <p className="text-xs text-slate-500 font-medium">حضانتي - تسيير رياض الأطفال</p>
            </div>
          </div>
        </div>

        {/* Current User Badge & Role */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-300">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <h2 className="text-sm font-semibold text-slate-900 truncate">{currentUser.name}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${roleInfo.bg} ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center font-medium">
          <p>Crèche Manager DZ v2.5</p>
          <p className="text-[10px] mt-0.5 text-slate-400">الجمهورية الجزائرية الديمقراطية الشعبية 🇩🇿</p>
        </div>
      </aside>
    </>
  );
};
