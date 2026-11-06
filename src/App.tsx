/**
 * Crèche Manager DZ - منصة احترافية لتسيير الحضانات ورياض الأطفال في الجزائر
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref as dbRef, onValue } from 'firebase/database';
import { api, setCurrentProfile, subscribeToNurseryChanges } from './services/api';
import { auth, database } from './services/firebase';
import {
  User,
  UserRole,
  Child,
  Parent,
  Group,
  AttendanceRecord,
  Payment,
  Expense,
  Employee,
  SalaryPayment,
  DashboardStats,
  SubscriptionSummary
} from './types';

import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { ChildrenView } from './components/ChildrenView';
import { ParentsView } from './components/ParentsView';
import { AttendanceView } from './components/AttendanceView';
import { PaymentsView } from './components/PaymentsView';
import { ExpensesView } from './components/ExpensesView';
import { EmployeesView } from './components/EmployeesView';
import { GroupsView } from './components/GroupsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ChildDetailsModal } from './components/ChildDetailsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  // جلسة Firebase Auth: loading → ready | signedOut
  const [authState, setAuthState] = useState<'loading' | 'ready' | 'signedOut'>('loading');
  const [authError, setAuthError] = useState('');
  const [isLive, setIsLive] = useState(false);

  // المستخدم الحالي (من /users/{uid} في Realtime Database)
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [todayDate, setTodayDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  // Global Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptionsSummary, setSubscriptionsSummary] = useState<SubscriptionSummary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>([]);

  // Child Details Modal
  const [inspectChild, setInspectChild] = useState<Child | null>(null);

  // Load All Data (Firebase Realtime Database — عبر طبقة api)
  const refreshAllData = async () => {
    if (!currentUser) return;
    try {
      setLoadingStats(true);

      // Load Stats
      const statsRes = await api.getDashboardStats().catch(() => null);
      if (statsRes?.success) setStats(statsRes.data);

      // Load Groups
      const groupsRes = await api.getGroups().catch(() => null);
      if (groupsRes?.success) setGroups(groupsRes.groups);

      // Load Children
      const childRes = await api.getChildren({ archived: true }).catch(() => null);
      if (childRes?.success) setChildrenList(childRes.children);

      // Load Parents
      const parentsRes = await api.getParents().catch(() => null);
      if (parentsRes?.success) setParents(parentsRes.parents);

      // Load Attendance
      const attRes = await api.getAttendance(todayDate).catch(() => null);
      if (attRes?.success) setAttendanceList(attRes.attendance);

      // Load Payments & Subscriptions
      const payRes = await api.getPayments(selectedMonth).catch(() => null);
      if (payRes?.success) setPayments(payRes.payments);

      const subRes = await api.getSubscriptionsSummary(selectedMonth).catch(() => null);
      if (subRes?.success) setSubscriptionsSummary(subRes.summary);

      // Load Expenses
      const expRes = await api.getExpenses(selectedMonth).catch(() => null);
      if (expRes?.success) setExpenses(expRes.expenses);

      // Load Employees & Salaries
      const empRes = await api.getEmployees().catch(() => null);
      if (empRes?.success) setEmployees(empRes.employees);

      const salRes = await api.getSalaryPayments(selectedMonth).catch(() => null);
      if (salRes?.success) setSalaryPayments(salRes.salaries);
    } catch (err) {
      console.error('Error refreshing app data:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      refreshAllData();
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, selectedMonth, todayDate]);

  // تحميل البيانات عند تبديل الشهر/التاريخ (بعد جاهزية الجلسة فقط)
  useEffect(() => {
    if (authState === 'ready') refreshAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, todayDate, authState]);

  // 1) ربط جلسة Firebase Auth بملف المستخدم في RTDB
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setAuthError('');
      if (!fbUser) {
        setCurrentProfile(null);
        setCurrentUser(null);
        setAuthState('signedOut');
        return;
      }
      try {
        const profile = await api.getUserProfile(fbUser.uid);
        if (!profile) {
          // حساب Auth موجود لكن بدون ملف في RTDB — نرفض الدخول
          setCurrentProfile(null);
          setCurrentUser(null);
          setAuthError('هذا الحساب غير مهيأ في قاعدة البيانات (users/' + fbUser.uid + ')');
          await auth.signOut();
          setAuthState('signedOut');
          return;
        }
        setCurrentProfile(profile);
        setCurrentUser(profile);
        setAuthState('ready');
      } catch (err: any) {
        console.error('تعذر تحميل ملف المستخدم:', err);
        setCurrentProfile(null);
        setCurrentUser(null);
        setAuthError(err?.message || 'تعذر تحميل بيانات الحساب');
        setAuthState('signedOut');
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2) مزامنة فورية: أي تغيير في RTDB يُعيد تحميل الواجهة تلقائياً
  useEffect(() => {
    if (authState !== 'ready' || !currentUser) return;

    const nid = currentUser.nurseryId;
    const unsubscribe = subscribeToNurseryChanges(
      nid,
      () => debouncedRefresh(),
      (path, err) => console.warn(`اشتراك RTDB (${path}):`, err?.message || err)
    );

    return () => {
      unsubscribe();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, currentUser?.nurseryId]);

  // 3) مؤشر الاتصال المباشر (.info/connected)
  useEffect(() => {
    const unref = onValue(
      dbRef(database, '.info/connected'),
      (snap) => setIsLive(!!snap.val()),
      () => setIsLive(false)
    );
    return () => unref();
  }, []);

  // تسجيل الخروج
  const handleSignOut = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('signOut:', err);
    } finally {
      setCurrentUser(null);
      setAuthState('signedOut');
    }
  };

  // Handle Role Switching for Testing RBAC (حسابات العرض عبر Firebase Auth)
  const handleSwitchUserRole = async (role: UserRole) => {
    try {
      await api.loginDemoRole(role);
      // onAuthStateChanged يتكفل بتحديث currentUser وإعادة التحميل
    } catch (err: any) {
      console.warn('تعذر تبديل الحساب:', err);
      alert(err?.message || 'تعذر تبديل الحساب — تأكد من تهيئة حسابات العرض (زر التهيئة في شاشة الدخول)');
    }
  };

  // Handlers for Children Actions
  const handleCreateChild = async (data: Partial<Child>) => {
    await api.createChild(data);
    refreshAllData();
  };

  const handleUpdateChild = async (id: string, data: Partial<Child>) => {
    await api.updateChild(id, data);
    refreshAllData();
  };

  const handleArchiveChild = async (id: string) => {
    await api.deleteChild(id, false);
    refreshAllData();
  };

  // Handlers for Parents Actions
  const handleCreateParent = async (data: Partial<Parent>) => {
    await api.createParent(data);
    refreshAllData();
  };

  const handleUpdateParent = async (id: string, data: Partial<Parent>) => {
    await api.updateParent(id, data);
    refreshAllData();
  };

  const handleDeleteParent = async (id: string) => {
    if (confirm('هل أنت تأكد من حذف بيانات هذا الولي؟')) {
      await api.deleteParent(id);
      refreshAllData();
    }
  };

  // Handlers for Attendance
  const handleSaveAttendance = async (record: any) => {
    await api.saveAttendance(record);
    refreshAllData();
  };

  const handleBatchSaveAttendance = async (records: any[]) => {
    await api.saveBatchAttendance(todayDate, records);
    refreshAllData();
  };

  // Handlers for Payments
  const handleCreatePayment = async (data: any) => {
    await api.createPayment(data);
    refreshAllData();
  };

  const handleVoidPayment = async (id: string) => {
    await api.voidPayment(id);
    refreshAllData();
  };

  // Handlers for Expenses
  const handleCreateExpense = async (data: any) => {
    await api.createExpense(data);
    refreshAllData();
  };

  const handleDeleteExpense = async (id: string) => {
    await api.deleteExpense(id);
    refreshAllData();
  };

  // Handlers for Employees & Salaries
  const handleCreateEmployee = async (data: any) => {
    await api.createEmployee(data);
    refreshAllData();
  };

  const handleUpdateEmployee = async (id: string, data: any) => {
    await api.updateEmployee(id, data);
    refreshAllData();
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('هل أنت تأكد من حذف هذا الموظف؟')) {
      await api.deleteEmployee(id);
      refreshAllData();
    }
  };

  const handleCreateSalaryPayment = async (data: any) => {
    await api.createSalaryPayment(data);
    refreshAllData();
  };

  // Handlers for Groups
  const handleCreateGroup = async (data: any) => {
    await api.createGroup(data);
    refreshAllData();
  };

  const handleUpdateGroup = async (id: string, data: any) => {
    await api.updateGroup(id, data);
    refreshAllData();
  };

  const handleDeleteGroup = async (id: string) => {
    if (confirm('هل أنت تأكد من حذف هذا القسم؟')) {
      await api.deleteGroup(id);
      refreshAllData();
    }
  };

  // ---- بوابة المصادقة: تحميل / تسجيل خروج / جاهزة ----
  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4 dir-rtl">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white text-2xl font-extrabold">ح</span>
        </div>
        <p className="text-sm font-bold text-slate-500">جارٍ الاتصال بقاعدة بيانات Firebase…</p>
      </div>
    );
  }

  if (authState === 'signedOut' || !currentUser) {
    return <LoginView notice={authError || undefined} onSignedIn={() => { /* onAuthStateChanged يتكفل بالباقي */ }} />;
  }

  const tabTitles: Record<ActiveTab, string> = {
    dashboard: 'لوحة التحكم والإحصائيات الرئيسية',
    children: 'إدارة أطفال الحضانة والملفات',
    parents: 'إدارة وسجل الأولياء',
    attendance: 'تسجيل وسجل الحضور والغياب اليومي',
    payments: 'إدارة الاشتراكات والمدفوعات والوصولات',
    expenses: 'إدارة المصاريف والنفقات',
    employees: 'إدارة الموظفين والرواتب',
    groups: 'إدارة الأقسام والمجموعات',
    reports: 'التقارير الماليّة والإدارية الشاملة',
    settings: 'إعدادات النظام، المستخدمين والنسخ الاحتياطي'
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col lg:flex-row dir-rtl">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTabTitle={tabTitles[activeTab]}
          currentUser={currentUser}
          onSwitchUser={handleSwitchUserRole}
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
          onRefreshData={refreshAllData}
          onSignOut={handleSignOut}
          isLive={isLive}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              loading={loadingStats}
              currentUser={currentUser}
              onNavigate={setActiveTab}
              onOpenAddChild={() => setActiveTab('children')}
              onOpenAddPayment={() => setActiveTab('payments')}
              onOpenAddExpense={() => setActiveTab('expenses')}
            />
          )}

          {activeTab === 'children' && (
            <ChildrenView
              childrenList={childrenList}
              groups={groups}
              parents={parents}
              currentUser={currentUser}
              onRefresh={refreshAllData}
              onCreateChild={handleCreateChild}
              onUpdateChild={handleUpdateChild}
              onArchiveChild={handleArchiveChild}
              onOpenChildDetails={(c) => setInspectChild(c)}
            />
          )}

          {activeTab === 'parents' && (
            <ParentsView
              parents={parents}
              onRefresh={refreshAllData}
              onCreateParent={handleCreateParent}
              onUpdateParent={handleUpdateParent}
              onDeleteParent={handleDeleteParent}
              onSelectParentForDetails={(p) => {
                if (p.children && p.children.length > 0) {
                  setInspectChild(p.children[0]);
                }
              }}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceView
              attendanceList={attendanceList}
              groups={groups}
              selectedDate={todayDate}
              setSelectedDate={setTodayDate}
              currentUser={currentUser}
              onSaveAttendance={handleSaveAttendance}
              onBatchSaveAttendance={handleBatchSaveAttendance}
              onRefresh={refreshAllData}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsView
              payments={payments}
              subscriptionsSummary={subscriptionsSummary}
              childrenList={childrenList.filter((c) => c.status === 'ACTIVE')}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              currentUser={currentUser}
              onRefresh={refreshAllData}
              onCreatePayment={handleCreatePayment}
              onVoidPayment={handleVoidPayment}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              currentUser={currentUser}
              onRefresh={refreshAllData}
              onCreateExpense={handleCreateExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'employees' && (
            <EmployeesView
              employees={employees}
              salaryPayments={salaryPayments}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              currentUser={currentUser}
              onRefresh={refreshAllData}
              onCreateEmployee={handleCreateEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
              onCreateSalaryPayment={handleCreateSalaryPayment}
            />
          )}

          {activeTab === 'groups' && (
            <GroupsView
              groups={groups}
              employees={employees}
              currentUser={currentUser}
              onRefresh={refreshAllData}
              onCreateGroup={handleCreateGroup}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
          )}

          {activeTab === 'settings' && <SettingsView currentUser={currentUser} onRefresh={refreshAllData} />}
        </main>
      </div>

      {/* Child Full Details Inspector Modal */}
      {inspectChild && <ChildDetailsModal child={inspectChild} onClose={() => setInspectChild(null)} />}
    </div>
  );
}
