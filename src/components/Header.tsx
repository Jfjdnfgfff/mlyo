import React from 'react';
import { Menu, Calendar, Shield, UserCheck, RefreshCw } from 'lucide-react';
import { UserRole, User } from '../types';

interface HeaderProps {
  activeTabTitle: string;
  currentUser: User;
  onSwitchUser: (role: UserRole) => void;
  onToggleMobileMenu: () => void;
  onRefreshData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTabTitle,
  currentUser,
  onSwitchUser,
  onToggleMobileMenu,
  onRefreshData
}) => {
  const todayFormatted = new Date().toLocaleDateString('ar-DZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="فتح القائمة"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">{activeTabTitle}</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>{todayFormatted}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Refresh button */}
        {onRefreshData && (
          <button
            onClick={onRefreshData}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">تحديث</span>
          </button>
        )}

        {/* Current Active Account Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
          <Shield className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-semibold text-slate-700">{currentUser.name}</span>
        </div>
      </div>
    </header>
  );
};
