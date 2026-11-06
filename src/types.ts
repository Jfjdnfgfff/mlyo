export type UserRole = 'ADMIN' | 'EDUCATOR' | 'ACCOUNTANT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  nurseryId: string;
  assignedGroupId?: string;
  phone?: string;
  createdAt?: string;
}

export interface Child {
  id: string;
  nurseryId: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: 'M' | 'F';
  photoUrl?: string;
  groupId: string;
  groupName?: string;
  registrationDate: string;
  parentId: string;
  parentName?: string;
  parentPhone: string;
  address: string;
  healthNotes?: string;
  authorizedPickups?: string[];
  notes?: string;
  monthlyFee: number;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
}

export interface Parent {
  id: string;
  nurseryId: string;
  fullName: string;
  phone: string;
  altPhone?: string;
  email?: string;
  address?: string;
  nationalId?: string;
  childrenIds: string[];
  children?: Child[];
  totalMonthlyFees?: number;
  paidThisMonth?: number;
  pendingDebt?: number;
  notes?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  childId: string;
  childName: string;
  groupId?: string;
  groupName?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  checkInTime?: string;
  checkOutTime?: string;
  pickupPerson?: string;
  notes?: string;
  authorizedPickups?: string[];
  recordedBy?: string;
  recordedByName?: string;
}

export interface Group {
  id: string;
  nurseryId: string;
  name: string;
  maxCapacity: number;
  enrolledCount?: number;
  isFull?: boolean;
  educatorId?: string;
  educatorName?: string;
  description?: string;
  ageRange?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  nurseryId: string;
  receiptNumber: string;
  childId: string;
  childName: string;
  parentId: string;
  parentName: string;
  month: string;
  amount: number;
  discount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'BARIDIMOB' | 'CHECK' | 'TRANSFER';
  receivedBy: string;
  receivedByName?: string;
  notes?: string;
  status: 'ACTIVE' | 'VOID';
  createdAt: string;
}

export interface Expense {
  id: string;
  nurseryId: string;
  title: string;
  category: 'SALARY' | 'RENT' | 'UTILITIES' | 'FOOD' | 'CLEANING' | 'MAINTENANCE' | 'SUPPLIES' | 'OTHER';
  amount: number;
  date: string;
  recipient?: string;
  description?: string;
  paymentMethod: string;
  recordedBy: string;
  recordedByName?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  nurseryId: string;
  fullName: string;
  phone: string;
  jobTitle: 'EDUCATOR' | 'ASSISTANT' | 'COOK' | 'CLEANER' | 'DRIVER' | 'OTHER';
  monthlySalary: number;
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes?: string;
  createdAt: string;
}

export interface SalaryPayment {
  id: string;
  nurseryId: string;
  employeeId: string;
  employeeName: string;
  month: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPaid: number;
  paymentDate: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  nurseryId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface DashboardStats {
  totalChildren: number;
  presentToday: number;
  absentToday: number;
  monthlySubscriptionsTotal: number;
  paymentsReceived: number;
  pendingDebt: number;
  expensesTotal: number;
  netRevenue: number;
  recentTransactions: Array<{
    id: string;
    receiptNumber: string;
    childName: string;
    amount: number;
    date: string;
    paymentMethod: string;
  }>;
  expenseCategories: Record<string, number>;
  currentMonth: string;
}

export interface SubscriptionSummary {
  childId: string;
  childName: string;
  childStatus: 'ACTIVE' | 'ARCHIVED';
  groupName: string;
  parentName: string;
  parentPhone: string;
  month: string;
  monthlyFee: number;
  totalDiscount: number;
  effectiveFee: number;
  totalPaid: number;
  balance: number;
  status: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentsCount: number;
}
