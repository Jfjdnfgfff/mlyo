export type UserRole = 'ADMIN' | 'EDUCATOR' | 'ACCOUNTANT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  nurseryId: string;
  assignedGroupId?: string;
  phone?: string;
  createdAt: string;
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
  updatedAt?: string;
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
  notes?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  nurseryId: string;
  childId: string;
  childName?: string;
  groupId?: string;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // HH:MM
  checkOutTime?: string; // HH:MM
  status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
  pickupPerson?: string;
  recordedBy: string;
  recordedByName?: string;
  notes?: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  nurseryId: string;
  name: string;
  maxCapacity: number;
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
  month: string; // YYYY-MM
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
