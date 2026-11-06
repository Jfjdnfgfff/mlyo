/**
 * Crèche Manager DZ - منصة احترافية لتسيير الحضانات ورياض الأطفال في الجزائر
 */

import React, { useState, useEffect } from 'react';
import { api } from './services/api';
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

  // Default initial active user is Admin
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user_admin_01',
    name: 'أحمد بن علي (المدير)',
    email: 'admin@creche.dz',
    role: 'ADMIN',
    nurseryId: 'nursery_algiers_01',
    phone: '0550123456'
  });

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

  // Load All Data
  const refreshAllData = async () => {
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

  useEffect(() => {
    refreshAllData();
  }, [selectedMonth, todayDate]);

  // Handle Role Switching for Testing RBAC
  const handleSwitchUserRole = async (role: UserRole) => {
    let email = 'admin@creche.dz';
    if (role === 'EDUCATOR') email = 'educator@creche.dz';
    if (role === 'ACCOUNTANT') email = 'accountant@creche.dz';

    try {
      const res = await api.login(email);
      if (res.token) {
        localStorage.setItem('creche_token', res.token);
        setCurrentUser(res.user);
        refreshAllData();
      }
    } catch (err) {
      console.warn('Fallback local role switch:', err);
      const mockUsers: Record<UserRole, User> = {
        ADMIN: {
          id: 'user_admin_01',
          name: 'أحمد بن علي (المدير)',
          email: 'admin@creche.dz',
          role: 'ADMIN',
          nurseryId: 'nursery_algiers_01'
        },
        EDUCATOR: {
          id: 'user_educator_01',
          name: 'مريم حداد (مربية)',
          email: 'educator@creche.dz',
          role: 'EDUCATOR',
          nurseryId: 'nursery_algiers_01',
          assignedGroupId: 'group_01'
        },
        ACCOUNTANT: {
          id: 'user_accountant_01',
          name: 'كريم براهيمي (محاسب)',
          email: 'accountant@creche.dz',
          role: 'ACCOUNTANT',
          nurseryId: 'nursery_algiers_01'
        }
      };
      setCurrentUser(mockUsers[role]);
      refreshAllData();
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
