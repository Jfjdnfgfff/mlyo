import {
  User,
  Child,
  Parent,
  AttendanceRecord,
  Group,
  Payment,
  Expense,
  Employee,
  SalaryPayment,
  DashboardStats,
  SubscriptionSummary,
  AuditLog
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const token = localStorage.getItem('creche_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  });

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || 'حدث خطأ في الاتصال بالسيرفر');
  }

  return data;
}

export const api = {
  // AUTH
  login: (email: string) => request<{ success: boolean; token: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),
  getMe: () => request<{ success: boolean; user: User }>('/auth/me'),
  getUsers: () => request<{ success: boolean; users: User[] }>('/auth/users'),
  createUser: (userData: Partial<User>) => request<{ success: boolean; user: User }>('/auth/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  deleteUser: (id: string) => request<{ success: boolean; message: string }>(`/auth/users/${id}`, {
    method: 'DELETE'
  }),

  // DASHBOARD & REPORTS
  getDashboardStats: () => request<{ success: boolean; data: DashboardStats }>('/reports/dashboard'),
  getFinancialReport: (month?: string) =>
    request<{
      success: boolean;
      month: string;
      totalIncome: number;
      totalExpenses: number;
      totalSalaries: number;
      netProfit: number;
      payments: Payment[];
      expenses: Expense[];
      salaryPayments: SalaryPayment[];
    }>(`/reports/financial?month=${month || ''}`),

  // CHILDREN
  getChildren: (params?: { archived?: boolean; groupId?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.archived) query.set('archived', 'true');
    if (params?.groupId) query.set('groupId', params.groupId);
    if (params?.search) query.set('search', params.search);
    return request<{ success: boolean; children: Child[] }>(`/children?${query.toString()}`);
  },
  getChildById: (id: string) => request<{ success: boolean; child: Child & { parent?: Parent; group?: Group }; payments: Payment[] }>(`/children/${id}`),
  createChild: (data: Partial<Child>) => request<{ success: boolean; child: Child }>('/children', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateChild: (id: string, data: Partial<Child>) => request<{ success: boolean; child: Child }>(`/children/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteChild: (id: string, force = false) => request<{ success: boolean; message: string }>(`/children/${id}?force=${force}`, {
    method: 'DELETE'
  }),

  // PARENTS
  getParents: () => request<{ success: boolean; parents: Parent[] }>('/parents'),
  getParentById: (id: string) => request<{ success: boolean; parent: Parent }>(`/parents/${id}`),
  createParent: (data: Partial<Parent>) => request<{ success: boolean; parent: Parent }>('/parents', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateParent: (id: string, data: Partial<Parent>) => request<{ success: boolean; parent: Parent }>(`/parents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteParent: (id: string) => request<{ success: boolean; message: string }>(`/parents/${id}`, {
    method: 'DELETE'
  }),

  // ATTENDANCE
  getAttendance: (date?: string, groupId?: string) => {
    const query = new URLSearchParams();
    if (date) query.set('date', date);
    if (groupId) query.set('groupId', groupId);
    return request<{ success: boolean; date: string; attendance: AttendanceRecord[] }>(`/attendance?${query.toString()}`);
  },
  saveAttendance: (data: {
    childId: string;
    date?: string;
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
    checkInTime?: string;
    checkOutTime?: string;
    pickupPerson?: string;
    notes?: string;
  }) => request<{ success: boolean; record: AttendanceRecord }>('/attendance', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  saveBatchAttendance: (date: string, records: Array<{ childId: string; status: 'PRESENT' | 'ABSENT' | 'EXCUSED'; notes?: string }>) =>
    request<{ success: boolean; count: number }>('/attendance/batch', {
      method: 'POST',
      body: JSON.stringify({ date, records })
    }),

  // GROUPS
  getGroups: () => request<{ success: boolean; groups: Group[] }>('/groups'),
  createGroup: (data: Partial<Group>) => request<{ success: boolean; group: Group }>('/groups', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateGroup: (id: string, data: Partial<Group>) => request<{ success: boolean; group: Group }>(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteGroup: (id: string) => request<{ success: boolean; message: string }>(`/groups/${id}`, {
    method: 'DELETE'
  }),

  // PAYMENTS & SUBSCRIPTIONS
  getPayments: (month?: string, childId?: string) => {
    const query = new URLSearchParams();
    if (month) query.set('month', month);
    if (childId) query.set('childId', childId);
    return request<{ success: boolean; payments: Payment[] }>(`/payments?${query.toString()}`);
  },
  createPayment: (data: {
    childId: string;
    month: string;
    amount: number;
    discount?: number;
    paymentMethod?: string;
    notes?: string;
  }) => request<{ success: boolean; payment: Payment; message: string }>('/payments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  voidPayment: (id: string) => request<{ success: boolean; message: string }>(`/payments/${id}/void`, {
    method: 'POST'
  }),
  getSubscriptionsSummary: (month?: string) =>
    request<{ success: boolean; month: string; summary: SubscriptionSummary[] }>(`/payments/subscriptions/summary?month=${month || ''}`),

  // EXPENSES
  getExpenses: (month?: string, category?: string) => {
    const query = new URLSearchParams();
    if (month) query.set('month', month);
    if (category) query.set('category', category);
    return request<{ success: boolean; expenses: Expense[] }>(`/expenses?${query.toString()}`);
  },
  createExpense: (data: Partial<Expense>) => request<{ success: boolean; expense: Expense }>('/expenses', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  deleteExpense: (id: string) => request<{ success: boolean; message: string }>(`/expenses/${id}`, {
    method: 'DELETE'
  }),

  // EMPLOYEES & SALARIES
  getEmployees: () => request<{ success: boolean; employees: Employee[] }>('/employees'),
  createEmployee: (data: Partial<Employee>) => request<{ success: boolean; employee: Employee }>('/employees', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateEmployee: (id: string, data: Partial<Employee>) => request<{ success: boolean; employee: Employee }>(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteEmployee: (id: string) => request<{ success: boolean; message: string }>(`/employees/${id}`, {
    method: 'DELETE'
  }),
  getSalaryPayments: (month?: string) => request<{ success: boolean; salaries: SalaryPayment[] }>(`/employees/salaries?month=${month || ''}`),
  createSalaryPayment: (data: {
    employeeId: string;
    month: string;
    baseSalary?: number;
    bonus?: number;
    deductions?: number;
    notes?: string;
  }) => request<{ success: boolean; salary: SalaryPayment }>('/employees/salaries', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // BACKUP & AUDIT LOGS
  getAuditLogs: () => request<{ success: boolean; logs: AuditLog[] }>('/backup/audit-logs'),
  restoreBackup: (backupData: object) => request<{ success: boolean; message: string }>('/backup/import', {
    method: 'POST',
    body: JSON.stringify(backupData)
  })
};
