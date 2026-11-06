import fs from 'fs';
import path from 'path';
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
  AuditLog
} from '../types.js';

interface DatabaseSchema {
  users: Record<string, User>;
  children: Record<string, Record<string, Child>>; // nurseryId -> childId -> Child
  parents: Record<string, Record<string, Parent>>; // nurseryId -> parentId -> Parent
  attendance: Record<string, Record<string, Record<string, AttendanceRecord>>>; // nurseryId -> date -> childId -> AttendanceRecord
  groups: Record<string, Record<string, Group>>; // nurseryId -> groupId -> Group
  payments: Record<string, Record<string, Payment>>; // nurseryId -> paymentId -> Payment
  expenses: Record<string, Record<string, Expense>>; // nurseryId -> expenseId -> Expense
  employees: Record<string, Record<string, Employee>>; // nurseryId -> employeeId -> Employee
  salaryPayments: Record<string, Record<string, SalaryPayment>>; // nurseryId -> salaryPaymentId -> SalaryPayment
  auditLogs: Record<string, Record<string, AuditLog>>; // nurseryId -> logId -> AuditLog
}

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

const DEFAULT_NURSERY_ID = 'nursery_algiers_01';

// Seed initial realistic Algerian nursery data
function getInitialSeedData(): DatabaseSchema {
  const now = new Date().toISOString();
  const todayDate = new Date().toISOString().split('T')[0];
  const currentMonth = todayDate.substring(0, 7);

  const users: Record<string, User> = {
    'user_admin_01': {
      id: 'user_admin_01',
      name: 'أحمد بن علي (المدير)',
      email: 'admin@creche.dz',
      role: 'ADMIN',
      nurseryId: DEFAULT_NURSERY_ID,
      phone: '0550123456',
      createdAt: now
    },
    'user_educator_01': {
      id: 'user_educator_01',
      name: 'مريم حداد (مربية)',
      email: 'educator@creche.dz',
      role: 'EDUCATOR',
      nurseryId: DEFAULT_NURSERY_ID,
      assignedGroupId: 'group_01',
      phone: '0661234567',
      createdAt: now
    },
    'user_accountant_01': {
      id: 'user_accountant_01',
      name: 'كريم براهيمي (محاسب)',
      email: 'accountant@creche.dz',
      role: 'ACCOUNTANT',
      nurseryId: DEFAULT_NURSERY_ID,
      phone: '0770345678',
      createdAt: now
    }
  };

  const groups: Record<string, Record<string, Group>> = {
    [DEFAULT_NURSERY_ID]: {
      'group_01': {
        id: 'group_01',
        nurseryId: DEFAULT_NURSERY_ID,
        name: 'قسم الرضع (6 أشهر - 1.5 سنة)',
        maxCapacity: 10,
        educatorId: 'user_educator_01',
        educatorName: 'مريم حداد',
        description: 'عناية خاصة بالأطفال الرضع وتوفير بيئة آمنة ونظيفة',
        ageRange: '6 - 18 شهر',
        createdAt: now
      },
      'group_02': {
        id: 'group_02',
        nurseryId: DEFAULT_NURSERY_ID,
        name: 'مجموعة البراعم (2 - 3 سنوات)',
        maxCapacity: 15,
        educatorId: 'emp_02',
        educatorName: 'سارة بوجمعة',
        description: 'أنشطة حركية ولغوية وتطوير الحواس',
        ageRange: '2 - 3 سنوات',
        createdAt: now
      },
      'group_03': {
        id: 'group_03',
        nurseryId: DEFAULT_NURSERY_ID,
        name: 'القسم التحضيري (4 - 5 سنوات)',
        maxCapacity: 20,
        educatorId: 'emp_03',
        educatorName: 'نادية مزياني',
        description: 'تحضير للمدرسة، تعلم الحروف والأرقام والأنشطة اليدوية',
        ageRange: '4 - 5 سنوات',
        createdAt: now
      }
    }
  };

  const parents: Record<string, Record<string, Parent>> = {
    [DEFAULT_NURSERY_ID]: {
      'parent_01': {
        id: 'parent_01',
        nurseryId: DEFAULT_NURSERY_ID,
        fullName: 'عمر بلقاسم',
        phone: '0555112233',
        altPhone: '0666223344',
        email: 'omar.belkacem@gmail.com',
        address: 'حي 500 مسكن، باب الزوار، الجزائر العاصمة',
        nationalId: '109283746501',
        childrenIds: ['child_01', 'child_02'],
        notes: 'ولي أمر ملتزم بالدفع في بداية كل شهر',
        createdAt: now
      },
      'parent_02': {
        id: 'parent_02',
        nurseryId: DEFAULT_NURSERY_ID,
        fullName: 'فاطمة الزهراء قاسمي',
        phone: '0777334455',
        altPhone: '0552998877',
        email: 'fz.kassmi@yahoo.fr',
        address: 'حي الجرف، درارية، الجزائر العاصمة',
        nationalId: '108475930211',
        childrenIds: ['child_03'],
        notes: 'تفضل الاتصال على الرقم الثاني في الحالات الطارئة',
        createdAt: now
      },
      'parent_03': {
        id: 'parent_03',
        nurseryId: DEFAULT_NURSERY_ID,
        fullName: 'عبد القادر بن داهان',
        phone: '0661998844',
        email: 'a.bendahan@gmail.com',
        address: 'حي زيغود يوسف، بئر خادم، الجزائر العاصمة',
        nationalId: '107382910482',
        childrenIds: ['child_04'],
        notes: 'الأم هي من تقوم باستلام الطفل يومياً',
        createdAt: now
      }
    }
  };

  const children: Record<string, Record<string, Child>> = {
    [DEFAULT_NURSERY_ID]: {
      'child_01': {
        id: 'child_01',
        nurseryId: DEFAULT_NURSERY_ID,
        firstName: 'أمير',
        lastName: 'بلقاسم',
        birthDate: '2024-03-15',
        gender: 'M',
        groupId: 'group_01',
        groupName: 'قسم الرضع (6 أشهر - 1.5 سنة)',
        registrationDate: '2024-09-01',
        parentId: 'parent_01',
        parentName: 'عمر بلقاسم',
        parentPhone: '0555112233',
        address: 'حي 500 مسكن، باب الزوار، الجزائر العاصمة',
        healthNotes: 'حساسية خفيفة من الحليب البقري',
        authorizedPickups: ['الأب: عمر بلقاسم (0555112233)', 'الجدة: زهرة بلقاسم (0550001122)'],
        notes: 'طفل هادئ ومحب للألعاب الموسيقية',
        monthlyFee: 14000,
        status: 'ACTIVE',
        createdAt: now
      },
      'child_02': {
        id: 'child_02',
        nurseryId: DEFAULT_NURSERY_ID,
        firstName: 'ليندة',
        lastName: 'بلقاسم',
        birthDate: '2022-06-20',
        gender: 'F',
        groupId: 'group_02',
        groupName: 'مجموعة البراعم (2 - 3 سنوات)',
        registrationDate: '2023-09-01',
        parentId: 'parent_01',
        parentName: 'عمر بلقاسم',
        parentPhone: '0555112233',
        address: 'حي 500 مسكن، باب الزوار، الجزائر العاصمة',
        healthNotes: 'لا توجد ملاحظات صحية خاصة',
        authorizedPickups: ['الأب: عمر بلقاسم (0555112233)'],
        notes: 'تشارك بفعالية في الرسم والأناشيد',
        monthlyFee: 13000,
        status: 'ACTIVE',
        createdAt: now
      },
      'child_03': {
        id: 'child_03',
        nurseryId: DEFAULT_NURSERY_ID,
        firstName: 'يوسف',
        lastName: 'قاسمي',
        birthDate: '2021-11-10',
        gender: 'M',
        groupId: 'group_03',
        groupName: 'القسم التحضيري (4 - 5 سنوات)',
        registrationDate: '2024-01-15',
        parentId: 'parent_02',
        parentName: 'فاطمة الزهراء قاسمي',
        parentPhone: '0777334455',
        address: 'حي الجرف، درارية، الجزائر العاصمة',
        healthNotes: 'يرتدي نظارات طبية للقراءة',
        authorizedPickups: ['الأم: فاطمة الزهراء قاسمي (0777334455)', 'الخال: سمير قاسمي (0662334455)'],
        notes: 'ممتاز في حفظ الأرقام والحروف',
        monthlyFee: 15000,
        status: 'ACTIVE',
        createdAt: now
      },
      'child_04': {
        id: 'child_04',
        nurseryId: DEFAULT_NURSERY_ID,
        firstName: 'سارة',
        lastName: 'بن داهان',
        birthDate: '2023-01-05',
        gender: 'F',
        groupId: 'group_02',
        groupName: 'مجموعة البراعم (2 - 3 سنوات)',
        registrationDate: '2024-02-01',
        parentId: 'parent_03',
        parentName: 'عبد القادر بن داهان',
        parentPhone: '0661998844',
        address: 'حي زيغود يوسف، بئر خادم، الجزائر العاصمة',
        healthNotes: 'لا توجد أية حساسية',
        authorizedPickups: ['الأم: مريم بن داهان (0554332211)'],
        notes: 'تصل في الساعة 08:00 صباحاً وتغادر 16:30',
        monthlyFee: 13500,
        status: 'ACTIVE',
        createdAt: now
      }
    }
  };

  const attendance: Record<string, Record<string, Record<string, AttendanceRecord>>> = {
    [DEFAULT_NURSERY_ID]: {
      [todayDate]: {
        'child_01': {
          id: `${todayDate}_child_01`,
          nurseryId: DEFAULT_NURSERY_ID,
          childId: 'child_01',
          childName: 'أمير بلقاسم',
          groupId: 'group_01',
          date: todayDate,
          checkInTime: '07:45',
          checkOutTime: '16:15',
          status: 'PRESENT',
          pickupPerson: 'عمر بلقاسم (الأب)',
          recordedBy: 'user_educator_01',
          recordedByName: 'مريم حداد',
          notes: 'تناول وجبة الغداء كاملة',
          updatedAt: now
        },
        'child_02': {
          id: `${todayDate}_child_02`,
          nurseryId: DEFAULT_NURSERY_ID,
          childId: 'child_02',
          childName: 'ليندة بلقاسم',
          groupId: 'group_02',
          date: todayDate,
          checkInTime: '07:50',
          status: 'PRESENT',
          recordedBy: 'user_educator_01',
          recordedByName: 'مريم حداد',
          updatedAt: now
        },
        'child_03': {
          id: `${todayDate}_child_03`,
          nurseryId: DEFAULT_NURSERY_ID,
          childId: 'child_03',
          childName: 'يوسف قاسمي',
          groupId: 'group_03',
          date: todayDate,
          status: 'ABSENT',
          recordedBy: 'user_admin_01',
          recordedByName: 'أحمد بن علي',
          notes: 'اتصلت الأم للتنبيه بزيارة الطبيب',
          updatedAt: now
        },
        'child_04': {
          id: `${todayDate}_child_04`,
          nurseryId: DEFAULT_NURSERY_ID,
          childId: 'child_04',
          childName: 'سارة بن داهان',
          groupId: 'group_02',
          date: todayDate,
          checkInTime: '08:10',
          status: 'PRESENT',
          recordedBy: 'user_educator_01',
          recordedByName: 'مريم حداد',
          updatedAt: now
        }
      }
    }
  };

  const payments: Record<string, Record<string, Payment>> = {
    [DEFAULT_NURSERY_ID]: {
      'pay_01': {
        id: 'pay_01',
        nurseryId: DEFAULT_NURSERY_ID,
        receiptNumber: 'REC-2026-0001',
        childId: 'child_01',
        childName: 'أمير بلقاسم',
        parentId: 'parent_01',
        parentName: 'عمر بلقاسم',
        month: currentMonth,
        amount: 14000,
        discount: 0,
        paymentDate: todayDate,
        paymentMethod: 'CASH',
        receivedBy: 'user_accountant_01',
        receivedByName: 'كريم براهيمي',
        notes: 'تسديد اشتراك شهر كامل نقداً',
        status: 'ACTIVE',
        createdAt: now
      },
      'pay_02': {
        id: 'pay_02',
        nurseryId: DEFAULT_NURSERY_ID,
        receiptNumber: 'REC-2026-0002',
        childId: 'child_02',
        childName: 'ليندة بلقاسم',
        parentId: 'parent_01',
        parentName: 'عمر بلقاسم',
        month: currentMonth,
        amount: 11000,
        discount: 2000,
        paymentDate: todayDate,
        paymentMethod: 'BARIDIMOB',
        receivedBy: 'user_accountant_01',
        receivedByName: 'كريم براهيمي',
        notes: 'خصم الأخ الثاني (2000 دج) - دفع عبر بريدي موب',
        status: 'ACTIVE',
        createdAt: now
      },
      'pay_03': {
        id: 'pay_03',
        nurseryId: DEFAULT_NURSERY_ID,
        receiptNumber: 'REC-2026-0003',
        childId: 'child_04',
        childName: 'سارة بن داهان',
        parentId: 'parent_03',
        parentName: 'عبد القادر بن داهان',
        month: currentMonth,
        amount: 8000,
        discount: 0,
        paymentDate: todayDate,
        paymentMethod: 'CASH',
        receivedBy: 'user_accountant_01',
        receivedByName: 'كريم براهيمي',
        notes: 'دفع جزئي من اشتراك 13,500 دج (متبقي 5,500 دج)',
        status: 'ACTIVE',
        createdAt: now
      }
    }
  };

  const expenses: Record<string, Record<string, Expense>> = {
    [DEFAULT_NURSERY_ID]: {
      'exp_01': {
        id: 'exp_01',
        nurseryId: DEFAULT_NURSERY_ID,
        title: 'فاتورة الكهرباء والغاز (Sonelgaz)',
        category: 'UTILITIES',
        amount: 18500,
        date: todayDate,
        recipient: 'شركة سونلغاز - وكالة باب الزوار',
        description: 'تسديد سداسي الكهرباء والغاز لمقر الحضانة',
        paymentMethod: 'CASH',
        recordedBy: 'user_accountant_01',
        recordedByName: 'كريم براهيمي',
        createdAt: now
      },
      'exp_02': {
        id: 'exp_02',
        nurseryId: DEFAULT_NURSERY_ID,
        title: 'شراء مواد تنظيف ومعقمات',
        category: 'CLEANING',
        amount: 9400,
        date: todayDate,
        recipient: 'محل البركة لتجارة الجملة',
        description: 'معقمات أيدي، صابون سائل، أكياس ومساحيق تنظيف الأرضيات',
        paymentMethod: 'CASH',
        recordedBy: 'user_accountant_01',
        recordedByName: 'كريم براهيمي',
        createdAt: now
      },
      'exp_03': {
        id: 'exp_03',
        nurseryId: DEFAULT_NURSERY_ID,
        title: 'وجبات غذائية وحليب للأطفال (أسبوعي)',
        category: 'FOOD',
        amount: 24500,
        date: todayDate,
        recipient: 'مخبزة وسوبرماركت الوفاء',
        description: 'خضر، فواكه، حليب، بسكويت وأجبان للأطفال',
        paymentMethod: 'CASH',
        recordedBy: 'user_accountant_01',
        recordedByName: 'كريم براهيمي',
        createdAt: now
      }
    }
  };

  const employees: Record<string, Record<string, Employee>> = {
    [DEFAULT_NURSERY_ID]: {
      'emp_01': {
        id: 'emp_01',
        nurseryId: DEFAULT_NURSERY_ID,
        fullName: 'مريم حداد',
        phone: '0661234567',
        jobTitle: 'EDUCATOR',
        monthlySalary: 38000,
        hireDate: '2023-01-10',
        status: 'ACTIVE',
        notes: 'مربية قسم الرضع، خبيرة وتعامُلها راقٍ',
        createdAt: now
      },
      'emp_02': {
        id: 'emp_02',
        nurseryId: DEFAULT_NURSERY_ID,
        fullName: 'سارة بوجمعة',
        phone: '0554998877',
        jobTitle: 'EDUCATOR',
        monthlySalary: 35000,
        hireDate: '2023-09-01',
        status: 'ACTIVE',
        notes: 'مربية قسم البراعم',
        createdAt: now
      },
      'emp_03': {
        id: 'emp_03',
        nurseryId: DEFAULT_NURSERY_ID,
        fullName: 'نادية مزياني',
        phone: '0771889900',
        jobTitle: 'EDUCATOR',
        monthlySalary: 37000,
        hireDate: '2022-09-15',
        status: 'ACTIVE',
        notes: 'مسؤولة القسم التحضيري',
        createdAt: now
      },
      'emp_04': {
        id: 'emp_04',
        nurseryId: DEFAULT_NURSERY_ID,
        fullName: 'خديجة شريف',
        phone: '0663445566',
        jobTitle: 'COOK',
        monthlySalary: 30000,
        hireDate: '2023-03-01',
        status: 'ACTIVE',
        notes: 'طباخة الحضانة، مسؤولة عن إعداد الوجبات اليومية الصحبة',
        createdAt: now
      }
    }
  };

  const salaryPayments: Record<string, Record<string, SalaryPayment>> = {
    [DEFAULT_NURSERY_ID]: {
      'sal_01': {
        id: 'sal_01',
        nurseryId: DEFAULT_NURSERY_ID,
        employeeId: 'emp_01',
        employeeName: 'مريم حداد',
        month: currentMonth,
        baseSalary: 38000,
        bonus: 2000,
        deductions: 0,
        netPaid: 40000,
        paymentDate: todayDate,
        notes: 'راتب الشهر + مكافأة الالتزام',
        createdAt: now
      }
    }
  };

  const auditLogs: Record<string, Record<string, AuditLog>> = {
    [DEFAULT_NURSERY_ID]: {
      'log_01': {
        id: 'log_01',
        nurseryId: DEFAULT_NURSERY_ID,
        userId: 'user_admin_01',
        userName: 'أحمد بن علي',
        action: 'تثبيت النظام',
        details: 'تم إطلاق منصة Crèche Manager DZ وتفعيل قاعدة البيانات',
        timestamp: now
      }
    }
  };

  return {
    users,
    children,
    parents,
    attendance,
    groups,
    payments,
    expenses,
    employees,
    salaryPayments,
    auditLogs
  };
}

class RealtimeDatabaseEngine {
  private db: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.db = this.loadDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw) as DatabaseSchema;
      }
    } catch (err) {
      console.error('Failed to parse database file, re-initializing seed data:', err);
    }
    const seed = getInitialSeedData();
    this.saveDatabase(seed);
    return seed;
  }

  private saveDatabase(data?: DatabaseSchema) {
    try {
      const target = data || this.db;
      fs.writeFileSync(DB_FILE, JSON.stringify(target, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // AUDIT LOG HELPER
  public logAction(nurseryId: string, userId: string, userName: string, action: string, details: string) {
    if (!this.db.auditLogs[nurseryId]) {
      this.db.auditLogs[nurseryId] = {};
    }
    const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const log: AuditLog = {
      id,
      nurseryId,
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.db.auditLogs[nurseryId][id] = log;
    this.saveDatabase();
    return log;
  }

  // USERS
  public getUsers(nurseryId?: string): User[] {
    const all = Object.values(this.db.users);
    if (!nurseryId) return all;
    return all.filter((u) => u.nurseryId === nurseryId);
  }

  public getUserById(id: string): User | null {
    return this.db.users[id] || null;
  }

  public getUserByEmail(email: string): User | null {
    return Object.values(this.db.users).find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  public createUser(user: User): User {
    this.db.users[user.id] = user;
    this.saveDatabase();
    return user;
  }

  public deleteUser(id: string): boolean {
    if (this.db.users[id]) {
      delete this.db.users[id];
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // CHILDREN
  public getChildren(nurseryId: string, includeArchived = false): Child[] {
    const nurseryChildren = Object.values(this.db.children[nurseryId] || {});
    if (includeArchived) return nurseryChildren;
    return nurseryChildren.filter((c) => c.status !== 'ARCHIVED');
  }

  public getChildById(nurseryId: string, childId: string): Child | null {
    return this.db.children[nurseryId]?.[childId] || null;
  }

  public saveChild(nurseryId: string, child: Child): Child {
    if (!this.db.children[nurseryId]) {
      this.db.children[nurseryId] = {};
    }
    this.db.children[nurseryId][child.id] = child;

    // Maintain parent's children list
    if (child.parentId) {
      const parent = this.getParentById(nurseryId, child.parentId);
      if (parent && !parent.childrenIds.includes(child.id)) {
        parent.childrenIds.push(child.id);
        this.saveParent(nurseryId, parent);
      }
    }

    this.saveDatabase();
    return child;
  }

  public deleteChild(nurseryId: string, childId: string, archive = true): boolean {
    const child = this.getChildById(nurseryId, childId);
    if (!child) return false;

    if (archive) {
      child.status = 'ARCHIVED';
      child.updatedAt = new Date().toISOString();
      this.saveChild(nurseryId, child);
    } else {
      delete this.db.children[nurseryId][childId];
      this.saveDatabase();
    }
    return true;
  }

  // PARENTS
  public getParents(nurseryId: string): Parent[] {
    return Object.values(this.db.parents[nurseryId] || {});
  }

  public getParentById(nurseryId: string, parentId: string): Parent | null {
    return this.db.parents[nurseryId]?.[parentId] || null;
  }

  public saveParent(nurseryId: string, parent: Parent): Parent {
    if (!this.db.parents[nurseryId]) {
      this.db.parents[nurseryId] = {};
    }
    this.db.parents[nurseryId][parent.id] = parent;
    this.saveDatabase();
    return parent;
  }

  public deleteParent(nurseryId: string, parentId: string): boolean {
    if (this.db.parents[nurseryId]?.[parentId]) {
      delete this.db.parents[nurseryId][parentId];
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // GROUPS
  public getGroups(nurseryId: string): Group[] {
    return Object.values(this.db.groups[nurseryId] || {});
  }

  public getGroupById(nurseryId: string, groupId: string): Group | null {
    return this.db.groups[nurseryId]?.[groupId] || null;
  }

  public saveGroup(nurseryId: string, group: Group): Group {
    if (!this.db.groups[nurseryId]) {
      this.db.groups[nurseryId] = {};
    }
    this.db.groups[nurseryId][group.id] = group;
    this.saveDatabase();
    return group;
  }

  public deleteGroup(nurseryId: string, groupId: string): boolean {
    if (this.db.groups[nurseryId]?.[groupId]) {
      delete this.db.groups[nurseryId][groupId];
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // ATTENDANCE
  public getAttendanceByDate(nurseryId: string, date: string): AttendanceRecord[] {
    const dayRecords = this.db.attendance[nurseryId]?.[date] || {};
    return Object.values(dayRecords);
  }

  public saveAttendance(nurseryId: string, record: AttendanceRecord): AttendanceRecord {
    if (!this.db.attendance[nurseryId]) {
      this.db.attendance[nurseryId] = {};
    }
    if (!this.db.attendance[nurseryId][record.date]) {
      this.db.attendance[nurseryId][record.date] = {};
    }
    this.db.attendance[nurseryId][record.date][record.childId] = record;
    this.saveDatabase();
    return record;
  }

  // PAYMENTS
  public getPayments(nurseryId: string): Payment[] {
    return Object.values(this.db.payments[nurseryId] || {}).filter((p) => p.status === 'ACTIVE');
  }

  public getPaymentsByChild(nurseryId: string, childId: string): Payment[] {
    return this.getPayments(nurseryId).filter((p) => p.childId === childId);
  }

  public savePayment(nurseryId: string, payment: Payment): Payment {
    if (!this.db.payments[nurseryId]) {
      this.db.payments[nurseryId] = {};
    }
    this.db.payments[nurseryId][payment.id] = payment;
    this.saveDatabase();
    return payment;
  }

  public voidPayment(nurseryId: string, paymentId: string): boolean {
    const payment = this.db.payments[nurseryId]?.[paymentId];
    if (payment) {
      payment.status = 'VOID';
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // EXPENSES
  public getExpenses(nurseryId: string): Expense[] {
    return Object.values(this.db.expenses[nurseryId] || {});
  }

  public saveExpense(nurseryId: string, expense: Expense): Expense {
    if (!this.db.expenses[nurseryId]) {
      this.db.expenses[nurseryId] = {};
    }
    this.db.expenses[nurseryId][expense.id] = expense;
    this.saveDatabase();
    return expense;
  }

  public deleteExpense(nurseryId: string, expenseId: string): boolean {
    if (this.db.expenses[nurseryId]?.[expenseId]) {
      delete this.db.expenses[nurseryId][expenseId];
      this.saveDatabase();
      return true;
    }
    return false;
  }

  // EMPLOYEES & SALARIES
  public getEmployees(nurseryId: string): Employee[] {
    return Object.values(this.db.employees[nurseryId] || {});
  }

  public saveEmployee(nurseryId: string, employee: Employee): Employee {
    if (!this.db.employees[nurseryId]) {
      this.db.employees[nurseryId] = {};
    }
    this.db.employees[nurseryId][employee.id] = employee;
    this.saveDatabase();
    return employee;
  }

  public deleteEmployee(nurseryId: string, employeeId: string): boolean {
    if (this.db.employees[nurseryId]?.[employeeId]) {
      delete this.db.employees[nurseryId][employeeId];
      this.saveDatabase();
      return true;
    }
    return false;
  }

  public getSalaryPayments(nurseryId: string): SalaryPayment[] {
    return Object.values(this.db.salaryPayments[nurseryId] || {});
  }

  public saveSalaryPayment(nurseryId: string, salary: SalaryPayment): SalaryPayment {
    if (!this.db.salaryPayments[nurseryId]) {
      this.db.salaryPayments[nurseryId] = {};
    }
    this.db.salaryPayments[nurseryId][salary.id] = salary;
    this.saveDatabase();
    return salary;
  }

  // AUDIT LOGS
  public getAuditLogs(nurseryId: string): AuditLog[] {
    return Object.values(this.db.auditLogs[nurseryId] || {}).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  // BACKUP & RESTORE
  public getFullBackup(nurseryId: string): DatabaseSchema {
    return JSON.parse(JSON.stringify(this.db));
  }

  public restoreBackup(data: DatabaseSchema): boolean {
    try {
      this.db = data;
      this.saveDatabase();
      return true;
    } catch (err) {
      console.error('Failed to restore backup:', err);
      return false;
    }
  }
}

export const dbEngine = new RealtimeDatabaseEngine();
