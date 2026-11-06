/**
 * طبقة الوصول للبيانات — Crèche Manager DZ
 *
 * مقترحة بالكامل على Firebase Authentication + Realtime Database.
 * تُبقي نفس واجهة `api` المستعملة سابقاً مع Express (الـ views لا تتغير)
 * مع فرض الصلاحيات (RBAC) في العميل، إلى جانب قواعد الأمان في
 * database.rules.json التي تفرضها قاعدة البيانات نفسها.
 *
 * مسارات RTDB (مطابقة لـ database.rules.json):
 *   /users/{uid}
 *   /children/{nurseryId}/{childId}
 *   /parents/{nurseryId}/{parentId}
 *   /attendance/{nurseryId}/{date}/{childId}
 *   /groups/{nurseryId}/{groupId}
 *   /payments/{nurseryId}/{paymentId}
 *   /expenses/{nurseryId}/{expenseId}
 *   /employees/{nurseryId}/{employeeId}
 *   /salaryPayments/{nurseryId}/{salaryId}
 *   /auditLogs/{nurseryId}/{logId}
 *
 * ملاحظة: سيرفر Express في مجلد server/ أُبقي عليه كاحتياط ولم يعد
 * يستدعى من الواجهة. للعودة إليه يكفي استبدال هذا الملف.
 */
import {
  ref,
  get,
  set,
  update,
  remove,
  onValue
} from 'firebase/database';
import { database } from './firebase';
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
  AuditLog,
  UserRole
} from '../types';

const DEFAULT_NURSERY_ID = 'nursery_algiers_01';

// ---------------------------------------------------------------------------
// الملف الشخصي المحلي — لا توجد مصادقة: الملف الافتراضي هو مدير الحضانة،
// ويمكن تبديل الدور محلياً من الواجهة لاختبار الصلاحيات (بدون كلمات مرور).
// ---------------------------------------------------------------------------
export const LOCAL_ADMIN_PROFILE: User = {
  id: 'local_admin',
  name: 'أحمد بن علي (المدير)',
  email: 'admin@creche.dz',
  role: 'ADMIN',
  nurseryId: DEFAULT_NURSERY_ID,
  phone: '0550123456',
  createdAt: '2024-09-01T00:00:00.000Z'
};

export const LOCAL_DEMO_PROFILES: Record<UserRole, User> = {
  ADMIN: LOCAL_ADMIN_PROFILE,
  EDUCATOR: {
    id: 'local_educator',
    name: 'مريم حداد (مربية)',
    email: 'educator@creche.dz',
    role: 'EDUCATOR',
    nurseryId: DEFAULT_NURSERY_ID,
    assignedGroupId: undefined,
    phone: '0661234567',
    createdAt: '2024-09-01T00:00:00.000Z'
  },
  ACCOUNTANT: {
    id: 'local_accountant',
    name: 'كريم براهيمي (محاسب)',
    email: 'accountant@creche.dz',
    role: 'ACCOUNTANT',
    nurseryId: DEFAULT_NURSERY_ID,
    phone: '0770345678',
    createdAt: '2024-09-01T00:00:00.000Z'
  }
};

let currentProfile: User = LOCAL_ADMIN_PROFILE;

export function setCurrentProfile(profile: User | null) {
  currentProfile = profile || LOCAL_ADMIN_PROFILE;
}

export function getCurrentProfile(): User {
  return currentProfile;
}

function requireProfile(): User {
  return currentProfile;
}

function nurseryId(): string {
  return currentProfile?.nurseryId || DEFAULT_NURSERY_ID;
}

function requireRole(roles: UserRole[]): User {
  const me = requireProfile();
  if (!roles.includes(me.role)) {
    throw new Error('ليست لديك صلاحية للقيام بهذه العملية');
  }
  return me;
}

// ---------------------------------------------------------------------------
// أدوات مساعدة للوصول إلى RTDB
// ---------------------------------------------------------------------------
async function getNode<T>(path: string): Promise<Record<string, T>> {
  const snap = await get(ref(database, path));
  if (!snap.exists()) return {};
  return snap.val() as Record<string, T>;
}

async function getPath<T>(path: string): Promise<T | null> {
  const snap = await get(ref(database, path));
  return snap.exists() ? (snap.val() as T) : null;
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

async function logAction(userId: string, userName: string, action: string, details: string) {
  try {
    const id = newId('log');
    const entry: AuditLog = {
      id,
      nurseryId: nurseryId(),
      userId,
      userName,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    await set(ref(database, `auditLogs/${nurseryId()}/${id}`), entry);
    return entry;
  } catch (err) {
    console.warn('تعذر تسجيل حدث التدقيق (السجل غير حرج):', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// واجهة api — نفس التواقيع السابقة قدر الإمكان
// ---------------------------------------------------------------------------
export const api = {
  // ---------------------------------------------------- USERS (بدون مصادقة)
  getMe: async () => {
    return { success: true, user: requireProfile() };
  },

  /** قائمة ملفات مستخدمي الحضانة (ADMIN فقط) — سجلات عادية في RTDB بدون كلمات مرور */
  getUsers: async () => {
    requireRole(['ADMIN']);
    const all = await getNode<User>('users');
    const users = Object.values(all).filter((u) => u.nurseryId === nurseryId());
    return { success: true, users };
  },

  /** إنشاء ملف مستخدم محلي جديد (ADMIN فقط) — مجرد سجل في RTDB، بلا كلمة مرور */
  createUser: async (userData: Partial<User> & { assignedGroupId?: string }) => {
    const me = requireRole(['ADMIN']);
    const { name, email, role, phone, assignedGroupId } = userData;

    if (!name || !email || !role) {
      throw new Error('الرجاء ملء كافة البيانات الأساسية (الاسم، البريد، الصلاحية)');
    }

    const emailNorm = email.trim().toLowerCase();
    const all = await getNode<User>('users');
    const existingByEmail = Object.values(all).find((u) => u.email?.toLowerCase() === emailNorm);
    if (existingByEmail) {
      throw new Error('البريد الإلكتروني مستخدم بالفعل');
    }

    const id = newId('user');
    const newUser: User = {
      id,
      name: name.trim(),
      email: emailNorm,
      role: role as UserRole,
      nurseryId: nurseryId(),
      assignedGroupId: assignedGroupId || undefined,
      phone: phone || '',
      createdAt: new Date().toISOString()
    };
    await set(ref(database, `users/${id}`), newUser);
    await logAction(me.id, me.name, 'إنشاء حساب مستخدم', `إضافة المستخدم: ${newUser.name} (${newUser.role})`);
    return { success: true, user: newUser };
  },

  /** حذف ملف مستخدم من RTDB (ADMIN فقط) */
  deleteUser: async (id: string) => {
    const me = requireRole(['ADMIN']);
    if (id === me.id) {
      throw new Error('لا يمكنك حذف حسابك أثناء التصفح');
    }
    await remove(ref(database, `users/${id}`));
    await logAction(me.id, me.name, 'حذف حساب مستخدم', `حذف ملف المستخدم ID: ${id}`);
    return { success: true, message: 'تم حذف ملف المستخدم من قاعدة البيانات' };
  },

  // ------------------------------------------------------------- REPORTS
  getDashboardStats: async () => {
    const me = requireProfile();
    const todayDate = new Date().toISOString().split('T')[0];
    const currentMonth = todayDate.substring(0, 7);
    const nid = nurseryId();

    const childrenMap = await getNode<Child>(`children/${nid}`);
    const allChildren = Object.values(childrenMap);
    const activeChildren = allChildren.filter((c) => c.status !== 'ARCHIVED');

    let visibleChildren = activeChildren;
    if (me.role === 'EDUCATOR' && me.assignedGroupId) {
      visibleChildren = activeChildren.filter((c) => c.groupId === me.assignedGroupId);
    }

    const attendanceMap = await getNode<AttendanceRecord>(`attendance/${nid}/${todayDate}`);
    const attendanceToday = Object.values(attendanceMap);
    const presentToday = attendanceToday.filter((a) => a.status === 'PRESENT').length;
    const absentToday = attendanceToday.filter((a) => a.status === 'ABSENT' || a.status === 'EXCUSED').length;

    const payments = Object.values(await getNode<Payment>(`payments/${nid}`)).filter((p) => p.status === 'ACTIVE');
    const expenses = Object.values(await getNode<Expense>(`expenses/${nid}`));

    const monthlySubscriptionsTotal = visibleChildren.reduce((sum, c) => sum + (c.monthlyFee || 0), 0);

    const currentMonthPayments = payments.filter((p) => p.month === currentMonth);
    const paymentsReceived = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalDiscounts = currentMonthPayments.reduce((sum, p) => sum + (p.discount || 0), 0);

    const pendingDebt = Math.max(0, monthlySubscriptionsTotal - totalDiscounts - paymentsReceived);

    const currentMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
    const expensesTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const netRevenue = paymentsReceived - expensesTotal;

    const recentTransactions = [...payments]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        childName: p.childName,
        amount: p.amount,
        date: p.paymentDate,
        paymentMethod: p.paymentMethod
      }));

    const expenseCategories: Record<string, number> = {};
    currentMonthExpenses.forEach((e) => {
      expenseCategories[e.category] = (expenseCategories[e.category] || 0) + e.amount;
    });

    const data: DashboardStats = {
      totalChildren: visibleChildren.length,
      presentToday,
      absentToday,
      monthlySubscriptionsTotal,
      paymentsReceived,
      pendingDebt,
      expensesTotal,
      netRevenue,
      recentTransactions,
      expenseCategories,
      currentMonth
    };
    return { success: true, data };
  },

  getFinancialReport: async (month?: string) => {
    requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    const m = month || new Date().toISOString().substring(0, 7);

    const payments = Object.values(await getNode<Payment>(`payments/${nid}`)).filter(
      (p) => p.status === 'ACTIVE' && p.month === m
    );
    const expenses = Object.values(await getNode<Expense>(`expenses/${nid}`)).filter((e) =>
      e.date.startsWith(m)
    );
    const salaryPayments = Object.values(await getNode<SalaryPayment>(`salaryPayments/${nid}`)).filter(
      (s) => s.month === m
    );

    const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalSalaries = salaryPayments.reduce((sum, s) => sum + s.netPaid, 0);
    const netProfit = totalIncome - totalExpenses;

    return {
      success: true,
      month: m,
      totalIncome,
      totalExpenses,
      totalSalaries,
      netProfit,
      payments,
      expenses,
      salaryPayments
    };
  },

  // ------------------------------------------------------------- CHILDREN
  getChildren: async (params?: { archived?: boolean; groupId?: string; search?: string }) => {
    const me = requireProfile();
    const nid = nurseryId();
    const includeArchived = !!params?.archived;
    const groupId = params?.groupId;
    const search = (params?.search || '').trim().toLowerCase();

    let list = Object.values(await getNode<Child>(`children/${nid}`));
    if (includeArchived) {
      // return everything (matches old behaviour of archived=true listing all)
    } else {
      list = list.filter((c) => c.status !== 'ARCHIVED');
    }

    if (me.role === 'EDUCATOR' && me.assignedGroupId) {
      list = list.filter((c) => c.groupId === me.assignedGroupId);
    } else if (groupId) {
      list = list.filter((c) => c.groupId === groupId);
    }

    if (search) {
      list = list.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(search) ||
          (c.parentPhone || '').includes(search) ||
          (c.parentName || '').toLowerCase().includes(search)
      );
    }

    return { success: true, children: list };
  },

  getChildById: async (id: string) => {
    requireProfile();
    const nid = nurseryId();
    const child = await getPath<Child>(`children/${nid}/${id}`);
    if (!child) {
      throw new Error('ملف الطفل غير موجود');
    }
    const parent = child.parentId ? await getPath<Parent>(`parents/${nid}/${child.parentId}`) : null;
    const group = child.groupId ? await getPath<Group>(`groups/${nid}/${child.groupId}`) : null;
    const allPayments = Object.values(await getNode<Payment>(`payments/${nid}`));
    const payments = allPayments
      .filter((p) => p.status === 'ACTIVE' && p.childId === child.id)
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    return { success: true, child: { ...child, parent: parent || undefined, group: group || undefined }, payments };
  },

  createChild: async (data: Partial<Child>) => {
    const me = requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    const {
      firstName,
      lastName,
      birthDate,
      gender,
      groupId,
      parentId,
      parentName,
      parentPhone,
      address,
      healthNotes,
      authorizedPickups,
      notes,
      monthlyFee
    } = data;

    if (!firstName || !lastName || !birthDate) {
      throw new Error('الرجاء إدخال اسم الطفل وتاريخ الميلاد');
    }

    let finalParentId = parentId || '';
    let finalParentName = parentName || '';

    if (!finalParentId && parentName && parentPhone) {
      const newParentId = newId('parent');
      const newParent: Parent = {
        id: newParentId,
        nurseryId: nid,
        fullName: parentName,
        phone: parentPhone,
        address: address || '',
        childrenIds: [],
        createdAt: new Date().toISOString()
      };
      await set(ref(database, `parents/${nid}/${newParentId}`), newParent);
      finalParentId = newParentId;
    } else if (finalParentId) {
      const parent = await getPath<Parent>(`parents/${nid}/${finalParentId}`);
      if (parent) finalParentName = parent.fullName;
    }

    let groupName = '';
    if (groupId) {
      const grp = await getPath<Group>(`groups/${nid}/${groupId}`);
      if (grp) groupName = grp.name;
    }

    const id = newId('child');
    const newChild: Child = {
      id,
      nurseryId: nid,
      firstName: firstName!,
      lastName: lastName!,
      birthDate: birthDate!,
      gender: (gender || 'M') as 'M' | 'F',
      groupId: groupId || '',
      groupName,
      registrationDate: new Date().toISOString().split('T')[0],
      parentId: finalParentId,
      parentName: finalParentName,
      parentPhone: parentPhone || '',
      address: address || '',
      healthNotes: healthNotes || '',
      authorizedPickups: Array.isArray(authorizedPickups) ? authorizedPickups : [],
      notes: notes || '',
      monthlyFee: Number(monthlyFee) || 12000,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    await set(ref(database, `children/${nid}/${id}`), newChild);

    // ربط الطفل بقائمة ولي الأمر
    if (newChild.parentId) {
      const parent = await getPath<Parent>(`parents/${nid}/${newChild.parentId}`);
      if (parent && !(parent.childrenIds || []).includes(id)) {
        await update(ref(database, `parents/${nid}/${parent.id}`), {
          childrenIds: [...(parent.childrenIds || []), id]
        });
      }
    }

    await logAction(me.id, me.name, 'تسجيل طفل', `إضافة الطفل ${firstName} ${lastName}`);
    return { success: true, child: newChild };
  },

  updateChild: async (id: string, data: Partial<Child>) => {
    const me = requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    const child = await getPath<Child>(`children/${nid}/${id}`);
    if (!child) {
      throw new Error('ملف الطفل غير موجود');
    }

    const patch: Partial<Child> = { ...data } as any;
    // معالجة الحقول المشتقة
    if (data.groupId !== undefined) {
      const grp = data.groupId ? await getPath<Group>(`groups/${nid}/${data.groupId}`) : null;
      patch.groupName = grp ? grp.name : '';
    }
    if (data.parentId !== undefined) {
      const parent = data.parentId ? await getPath<Parent>(`parents/${nid}/${data.parentId}`) : null;
      if (parent) patch.parentName = parent.fullName;
    }
    if (data.monthlyFee !== undefined) patch.monthlyFee = Number(data.monthlyFee);
    if (data.authorizedPickups !== undefined && !Array.isArray(data.authorizedPickups)) {
      patch.authorizedPickups = [];
    }
    // لا نسمح باستبدال المعرفات الأساسية
    delete (patch as any).id;
    delete (patch as any).nurseryId;
    (patch as any).updatedAt = new Date().toISOString();

    await update(ref(database, `children/${nid}/${id}`), patch as any);
    const updated = { ...child, ...patch } as Child;
    await logAction(me.id, me.name, 'تعديل طفل', `تحديث بيانات الطفل ${updated.firstName} ${updated.lastName}`);
    return { success: true, child: updated };
  },

  deleteChild: async (id: string, force = false) => {
    const me = requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    const child = await getPath<Child>(`children/${nid}/${id}`);
    if (!child) {
      throw new Error('ملف الطفل غير موجود');
    }

    if (force) {
      await remove(ref(database, `children/${nid}/${id}`));
    } else {
      await update(ref(database, `children/${nid}/${id}`), {
        status: 'ARCHIVED',
        updatedAt: new Date().toISOString()
      } as any);
    }

    const actionText = force ? 'حذف نهائي' : 'أرشفة ملف';
    await logAction(me.id, me.name, `${actionText} طفل`, `إجراء ${actionText} للطفل ${child.firstName} ${child.lastName}`);
    return {
      success: true,
      message: `تم ${actionText} الطفل بنجاح دون المساس بالسجلات المالية التاريخية`
    };
  },

  // -------------------------------------------------------------- PARENTS
  getParents: async () => {
    requireProfile();
    const nid = nurseryId();
    const parents = Object.values(await getNode<Parent>(`parents/${nid}`));
    const children = Object.values(await getNode<Child>(`children/${nid}`));
    const payments = Object.values(await getNode<Payment>(`payments/${nid}`)).filter(
      (p) => p.status === 'ACTIVE'
    );
    const currentMonth = new Date().toISOString().substring(0, 7);

    const result = parents.map((p) => {
      const parentChildren = children.filter((c) => c.parentId === p.id && c.status === 'ACTIVE');
      const totalMonthlyFees = parentChildren.reduce((sum, c) => sum + (c.monthlyFee || 0), 0);
      const paidThisMonth = payments
        .filter((pay) => pay.month === currentMonth && parentChildren.some((c) => c.id === pay.childId))
        .reduce((sum, pay) => sum + pay.amount, 0);
      const pendingDebt = Math.max(0, totalMonthlyFees - paidThisMonth);

      return {
        ...p,
        children: parentChildren,
        totalMonthlyFees,
        paidThisMonth,
        pendingDebt
      };
    });

    return { success: true, parents: result };
  },

  getParentById: async (id: string) => {
    requireProfile();
    const nid = nurseryId();
    const parent = await getPath<Parent>(`parents/${nid}/${id}`);
    if (!parent) {
      throw new Error('بيانات الولي غير موجودة');
    }
    const children = Object.values(await getNode<Child>(`children/${nid}`)).filter(
      (c) => c.parentId === parent.id
    );
    const payments = Object.values(await getNode<Payment>(`payments/${nid}`)).filter(
      (p) => p.status === 'ACTIVE' && p.parentId === parent.id
    );
    return { success: true, parent: { ...parent, children, payments } };
  },

  createParent: async (data: Partial<Parent>) => {
    const me = requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    const { fullName, phone, altPhone, email, address, nationalId, notes } = data;

    if (!fullName || !phone) {
      throw new Error('الرجاء إدخال الاسم الكامل ورقم الهاتف على الأقل');
    }

    const id = newId('parent');
    const newParent: Parent = {
      id,
      nurseryId: nid,
      fullName: fullName!.trim(),
      phone: phone!.trim(),
      altPhone: altPhone || '',
      email: email || '',
      address: address || '',
      nationalId: nationalId || '',
      childrenIds: [],
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    await set(ref(database, `parents/${nid}/${id}`), newParent);
    await logAction(me.id, me.name, 'تسجيل ولي أمر', `إضافة الولي: ${fullName}`);
    return { success: true, parent: newParent };
  },

  updateParent: async (id: string, data: Partial<Parent>) => {
    requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    const parent = await getPath<Parent>(`parents/${nid}/${id}`);
    if (!parent) {
      throw new Error('بيانات الولي غير موجودة');
    }

    const patch: Record<string, any> = {};
    const fields: Array<keyof Parent> = ['fullName', 'phone', 'altPhone', 'email', 'address', 'nationalId', 'notes'];
    for (const f of fields) {
      if (data[f] !== undefined) patch[f] = data[f];
    }

    await update(ref(database, `parents/${nid}/${id}`), patch);
    return { success: true, parent: { ...parent, ...patch } };
  },

  deleteParent: async (id: string) => {
    const me = requireRole(['ADMIN']);
    const nid = nurseryId();
    const parent = await getPath<Parent>(`parents/${nid}/${id}`);
    if (!parent) {
      throw new Error('تعذر العثور على بيانات الولي');
    }
    await remove(ref(database, `parents/${nid}/${id}`));
    await logAction(me.id, me.name, 'حذف ولي أمر', `حذف الولي: ${parent.fullName}`);
    return { success: true, message: 'تم حذف بيانات الولي بنجاح' };
  },

  // ------------------------------------------------------------ ATTENDANCE
  getAttendance: async (date?: string, groupId?: string) => {
    const me = requireProfile();
    const nid = nurseryId();
    const targetDate = date || new Date().toISOString().split('T')[0];

    const records = Object.values(await getNode<AttendanceRecord>(`attendance/${nid}/${targetDate}`));
    const children = Object.values(await getNode<Child>(`children/${nid}`)).filter(
      (c) => c.status !== 'ARCHIVED'
    );

    // دمج الأطفال النشطين مع سجل الحضور لتظهر كل الخانات
    let result = children.map((child) => {
      const rec = records.find((r) => r.childId === child.id);
      return {
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        groupId: child.groupId,
        groupName: child.groupName,
        date: targetDate,
        status: rec ? rec.status : ('ABSENT' as const),
        checkInTime: rec?.checkInTime || '',
        checkOutTime: rec?.checkOutTime || '',
        pickupPerson: rec?.pickupPerson || '',
        notes: rec?.notes || '',
        authorizedPickups: child.authorizedPickups || [],
        recordedBy: rec?.recordedBy || '',
        recordedByName: rec?.recordedByName || ''
      };
    });

    if (me.role === 'EDUCATOR' && me.assignedGroupId) {
      result = result.filter((r) => r.groupId === me.assignedGroupId);
    } else if (groupId) {
      result = result.filter((r) => r.groupId === groupId);
    }

    return { success: true, date: targetDate, attendance: result };
  },

  saveAttendance: async (data: {
    childId: string;
    date?: string;
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
    checkInTime?: string;
    checkOutTime?: string;
    pickupPerson?: string;
    notes?: string;
  }) => {
    const me = requireProfile();
    const nid = nurseryId();
    const { childId, date, status, checkInTime, checkOutTime, pickupPerson, notes } = data;

    if (!childId) {
      throw new Error('الرجاء اختيار الطفل');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    const child = await getPath<Child>(`children/${nid}/${childId}`);
    if (!child) {
      throw new Error('ملف الطفل غير موجود');
    }

    const existing = await getPath<AttendanceRecord>(`attendance/${nid}/${targetDate}/${childId}`);
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const record: AttendanceRecord = {
      ...(existing as any),
      id: (existing as any)?.id || `${targetDate}_${childId}`,
      nurseryId: nid,
      childId,
      childName: `${child.firstName} ${child.lastName}`,
      groupId: child.groupId,
      date: targetDate,
      status: status || 'PRESENT',
      checkInTime: checkInTime || existing?.checkInTime || (status === 'PRESENT' ? nowTime : ''),
      checkOutTime: checkOutTime !== undefined ? checkOutTime : existing?.checkOutTime || '',
      pickupPerson: pickupPerson !== undefined ? pickupPerson : existing?.pickupPerson || '',
      notes: notes !== undefined ? notes : existing?.notes || '',
      recordedBy: me.id,
      recordedByName: me.name,
      updatedAt: new Date().toISOString()
    } as AttendanceRecord;

    await set(ref(database, `attendance/${nid}/${targetDate}/${childId}`), record);
    return { success: true, message: 'تم تسجيل الحضور/الغياب بنجاح', record };
  },

  saveBatchAttendance: async (
    date: string,
    records: Array<{ childId: string; status: 'PRESENT' | 'ABSENT' | 'EXCUSED'; checkInTime?: string; notes?: string }>
  ) => {
    const me = requireProfile();
    const nid = nurseryId();

    if (!Array.isArray(records)) {
      throw new Error('قائمة الحضور غير صحيحة');
    }

    const targetDate = date || new Date().toISOString().split('T')[0];
    let count = 0;

    for (const r of records) {
      const child = await getPath<Child>(`children/${nid}/${r.childId}`);
      if (!child) continue;
      const existing = await getPath<AttendanceRecord>(`attendance/${nid}/${targetDate}/${r.childId}`);

      const rec: AttendanceRecord & { id: string } = {
        ...(existing as any),
        id: (existing as any)?.id || `${targetDate}_${r.childId}`,
        nurseryId: nid,
        childId: r.childId,
        childName: `${child.firstName} ${child.lastName}`,
        groupId: child.groupId,
        date: targetDate,
        status: r.status,
        checkInTime: r.checkInTime || existing?.checkInTime || (r.status === 'PRESENT' ? '08:00' : ''),
        checkOutTime: existing?.checkOutTime || '',
        pickupPerson: existing?.pickupPerson || '',
        notes: r.notes || existing?.notes || '',
        recordedBy: me.id,
        recordedByName: me.name,
        updatedAt: new Date().toISOString()
      } as any;

      await set(ref(database, `attendance/${nid}/${targetDate}/${r.childId}`), rec);
      count += 1;
    }

    return { success: true, count, message: 'تم حفظ سجل الحضور الجماعي بنجاح' };
  },

  // ---------------------------------------------------------------- GROUPS
  getGroups: async () => {
    requireProfile();
    const nid = nurseryId();
    const groups = Object.values(await getNode<Group>(`groups/${nid}`));
    const children = Object.values(await getNode<Child>(`children/${nid}`)).filter(
      (c) => c.status !== 'ARCHIVED'
    );

    const result = groups.map((g) => {
      const enrolledCount = children.filter((c) => c.groupId === g.id && c.status === 'ACTIVE').length;
      return {
        ...g,
        enrolledCount,
        isFull: enrolledCount >= (g.maxCapacity || 0)
      };
    });

    return { success: true, groups: result };
  },

  createGroup: async (data: Partial<Group>) => {
    const me = requireRole(['ADMIN']);
    const nid = nurseryId();
    const { name, maxCapacity, educatorId, educatorName, description, ageRange } = data;

    if (!name || !maxCapacity) {
      throw new Error('الرجاء تحديد اسم القسم والطاقة الاستيعابية القصوى');
    }

    const id = newId('group');
    const group: Group = {
      id,
      nurseryId: nid,
      name: name!.trim(),
      maxCapacity: Number(maxCapacity),
      educatorId: educatorId || '',
      educatorName: educatorName || '',
      description: description || '',
      ageRange: ageRange || '',
      createdAt: new Date().toISOString()
    };

    await set(ref(database, `groups/${nid}/${id}`), group);
    await logAction(me.id, me.name, 'إنشاء قسم', `إضافة مجموعة جديدة: ${name}`);
    return { success: true, group };
  },

  updateGroup: async (id: string, data: Partial<Group>) => {
    requireRole(['ADMIN']);
    const nid = nurseryId();
    const group = await getPath<Group>(`groups/${nid}/${id}`);
    if (!group) {
      throw new Error('القسم غير موجود');
    }

    const patch: Record<string, any> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.maxCapacity !== undefined) patch.maxCapacity = Number(data.maxCapacity);
    if (data.educatorId !== undefined) patch.educatorId = data.educatorId;
    if (data.educatorName !== undefined) patch.educatorName = data.educatorName;
    if (data.description !== undefined) patch.description = data.description;
    if (data.ageRange !== undefined) patch.ageRange = data.ageRange;

    await update(ref(database, `groups/${nid}/${id}`), patch);
    return { success: true, group: { ...group, ...patch } };
  },

  deleteGroup: async (id: string) => {
    const me = requireRole(['ADMIN']);
    const nid = nurseryId();
    const group = await getPath<Group>(`groups/${nid}/${id}`);
    if (!group) {
      throw new Error('القسم غير موجود');
    }
    await remove(ref(database, `groups/${nid}/${id}`));
    await logAction(me.id, me.name, 'حذف قسم', `حذف القسم: ${group.name}`);
    return { success: true, message: 'تم حذف القسم بنجاح' };
  },

  // -------------------------------------------------------------- PAYMENTS
  getPayments: async (month?: string, childId?: string) => {
    requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    let payments = Object.values(await getNode<Payment>(`payments/${nid}`)).filter(
      (p) => p.status === 'ACTIVE'
    );

    if (month) payments = payments.filter((p) => p.month === month);
    if (childId) payments = payments.filter((p) => p.childId === childId);

    payments.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return { success: true, payments };
  },

  createPayment: async (data: {
    childId: string;
    month: string;
    amount: number;
    discount?: number;
    paymentMethod?: string;
    notes?: string;
  }) => {
    const me = requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    const { childId, month, amount, discount, paymentMethod, notes } = data;

    if (!childId || !month || !amount || Number(amount) <= 0) {
      throw new Error('الرجاء اختيار الطفل والشهر والمبلغ');
    }

    const child = await getPath<Child>(`children/${nid}/${childId}`);
    if (!child) {
      throw new Error('تعذر العثور على ملف الطفل');
    }

    const parent = child.parentId ? await getPath<Parent>(`parents/${nid}/${child.parentId}`) : null;
    const parentName = parent ? parent.fullName : child.parentName || 'غير محدد';

    const allPayments = Object.values(await getNode<Payment>(`payments/${nid}`)).filter(
      (p) => p.status === 'ACTIVE'
    );
    const currentYear = new Date().getFullYear();
    const yearSeq = allPayments.filter((p) => (p.createdAt || '').startsWith(String(currentYear))).length + 1;
    const receiptNumber = `REC-${currentYear}-${String(yearSeq).padStart(4, '0')}`;

    const id = newId('pay');
    const payment: Payment = {
      id,
      nurseryId: nid,
      receiptNumber,
      childId: child.id,
      childName: `${child.firstName} ${child.lastName}`,
      parentId: child.parentId || '',
      parentName,
      month,
      amount: Number(amount),
      discount: Number(discount) || 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: (paymentMethod || 'CASH') as Payment['paymentMethod'],
      receivedBy: me.id,
      receivedByName: me.name,
      notes: notes || '',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    await set(ref(database, `payments/${nid}/${id}`), payment);
    await logAction(
      me.id,
      me.name,
      'استلام دفعة',
      `إصدار وصل ${receiptNumber} بمبلغ ${amount} دج للطفل ${child.firstName} ${child.lastName}`
    );

    return {
      success: true,
      message: 'تم تسجيل عملية الدفع وإصدار الوصل بنجاح',
      payment
    };
  },

  voidPayment: async (id: string) => {
    const me = requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    const payment = await getPath<Payment>(`payments/${nid}/${id}`);
    if (!payment) {
      throw new Error('وصل الدفع غير موجود');
    }
    await update(ref(database, `payments/${nid}/${id}`), { status: 'VOID' });
    await logAction(me.id, me.name, 'إلغاء وصل', `إلغاء وصل الدفع ID: ${id}`);
    return { success: true, message: 'تم إلغاء وصل الدفع بنجاح' };
  },

  getSubscriptionsSummary: async (month?: string) => {
    requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    const selectedMonth = month || new Date().toISOString().substring(0, 7);

    const children = Object.values(await getNode<Child>(`children/${nid}`));
    const payments = Object.values(await getNode<Payment>(`payments/${nid}`)).filter(
      (p) => p.status === 'ACTIVE'
    );

    const summary: SubscriptionSummary[] = children.map((c) => {
      const childPayments = payments.filter((p) => p.childId === c.id && p.month === selectedMonth);
      const totalPaid = childPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalDiscount = childPayments.reduce((sum, p) => sum + (p.discount || 0), 0);
      const effectiveFee = Math.max(0, (c.monthlyFee || 0) - totalDiscount);
      const balance = effectiveFee - totalPaid;

      let status: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
      if (balance <= 0 && totalPaid > 0) {
        status = 'PAID';
      } else if (totalPaid > 0 && balance > 0) {
        status = 'PARTIAL';
      }

      return {
        childId: c.id,
        childName: `${c.firstName} ${c.lastName}`,
        childStatus: c.status,
        groupName: c.groupName || '',
        parentName: c.parentName || '',
        parentPhone: c.parentPhone || '',
        month: selectedMonth,
        monthlyFee: c.monthlyFee || 0,
        totalDiscount,
        effectiveFee,
        totalPaid,
        balance: Math.max(0, balance),
        status,
        paymentsCount: childPayments.length
      };
    });

    return { success: true, month: selectedMonth, summary };
  },

  // -------------------------------------------------------------- EXPENSES
  getExpenses: async (month?: string, category?: string) => {
    requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    let expenses = Object.values(await getNode<Expense>(`expenses/${nid}`));

    if (category) expenses = expenses.filter((e) => e.category === category);
    if (month) expenses = expenses.filter((e) => e.date.startsWith(month));

    expenses.sort((a, b) => b.date.localeCompare(a.date));
    return { success: true, expenses };
  },

  createExpense: async (data: Partial<Expense>) => {
    const me = requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    const { title, category, amount, date, recipient, description, paymentMethod } = data;

    if (!title || !category || !amount || Number(amount) <= 0 || !date) {
      throw new Error('الرجاء إدخال عنوان المصروف والفئة والمبلغ والتاريخ');
    }

    const id = newId('exp');
    const expense: Expense = {
      id,
      nurseryId: nid,
      title: title!.trim(),
      category: category!,
      amount: Number(amount),
      date: date!,
      recipient: recipient || '',
      description: description || '',
      paymentMethod: paymentMethod || 'CASH',
      recordedBy: me.id,
      recordedByName: me.name,
      createdAt: new Date().toISOString()
    };

    await set(ref(database, `expenses/${nid}/${id}`), expense);
    await logAction(me.id, me.name, 'إضافة مصروف', `تسجيل مصروف: ${title} بمبلغ ${amount} دج`);
    return { success: true, expense };
  },

  deleteExpense: async (id: string) => {
    const me = requireRole(['ADMIN']);
    const nid = nurseryId();
    const expense = await getPath<Expense>(`expenses/${nid}/${id}`);
    if (!expense) {
      throw new Error('سجل المصروف غير موجود');
    }
    await remove(ref(database, `expenses/${nid}/${id}`));
    await logAction(me.id, me.name, 'حذف مصروف', `حذف المصروف ID: ${id}`);
    return { success: true, message: 'تم حذف المصروف بنجاح' };
  },

  // --------------------------------------------------- EMPLOYEES & SALARIES
  getEmployees: async () => {
    requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    const employees = Object.values(await getNode<Employee>(`employees/${nid}`));
    return { success: true, employees };
  },

  createEmployee: async (data: Partial<Employee>) => {
    const me = requireRole(['ADMIN']);
    const nid = nurseryId();
    const { fullName, phone, jobTitle, monthlySalary, hireDate, notes } = data;

    if (!fullName || !jobTitle || !monthlySalary) {
      throw new Error('الرجاء إدخال اسم الموظف والوظيفة والراتب الشهري');
    }

    const id = newId('emp');
    const employee: Employee = {
      id,
      nurseryId: nid,
      fullName: fullName!.trim(),
      phone: phone || '',
      jobTitle: jobTitle!,
      monthlySalary: Number(monthlySalary),
      hireDate: hireDate || new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    await set(ref(database, `employees/${nid}/${id}`), employee);
    await logAction(me.id, me.name, 'إضافة موظف', `توظيف: ${fullName} (${jobTitle})`);
    return { success: true, employee };
  },

  updateEmployee: async (id: string, data: Partial<Employee>) => {
    requireRole(['ADMIN']);
    const nid = nurseryId();
    const employee = await getPath<Employee>(`employees/${nid}/${id}`);
    if (!employee) {
      throw new Error('ملف الموظف غير موجود');
    }

    const patch: Record<string, any> = {};
    if (data.fullName !== undefined) patch.fullName = data.fullName;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (data.jobTitle !== undefined) patch.jobTitle = data.jobTitle;
    if (data.monthlySalary !== undefined) patch.monthlySalary = Number(data.monthlySalary);
    if (data.status !== undefined) patch.status = data.status;
    if (data.notes !== undefined) patch.notes = data.notes;

    await update(ref(database, `employees/${nid}/${id}`), patch);
    return { success: true, employee: { ...employee, ...patch } };
  },

  deleteEmployee: async (id: string) => {
    const me = requireRole(['ADMIN']);
    const nid = nurseryId();
    const employee = await getPath<Employee>(`employees/${nid}/${id}`);
    if (!employee) {
      throw new Error('ملف الموظف غير موجود');
    }
    await remove(ref(database, `employees/${nid}/${id}`));
    await logAction(me.id, me.name, 'حذف موظف', `حذف الموظف: ${employee.fullName}`);
    return { success: true, message: 'تم حذف ملف الموظف بنجاح' };
  },

  getSalaryPayments: async (month?: string) => {
    requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    let salaries = Object.values(await getNode<SalaryPayment>(`salaryPayments/${nid}`));
    if (month) salaries = salaries.filter((s) => s.month === month);
    salaries.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return { success: true, salaries };
  },

  createSalaryPayment: async (data: {
    employeeId: string;
    month: string;
    baseSalary?: number;
    bonus?: number;
    deductions?: number;
    notes?: string;
  }) => {
    const me = requireRole(['ADMIN', 'ACCOUNTANT']);
    const nid = nurseryId();
    const { employeeId, month, baseSalary, bonus, deductions, notes } = data;

    if (!employeeId || !month) {
      throw new Error('الرجاء اختيار الموظف والشهر المعني بالراتب');
    }

    const employees = Object.values(await getNode<Employee>(`employees/${nid}`));
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) {
      throw new Error('الموظف غير موجود');
    }

    const bSalary = Number(baseSalary) || employee.monthlySalary;
    const bBonus = Number(bonus) || 0;
    const bDeductions = Number(deductions) || 0;
    const netPaid = Math.max(0, bSalary + bBonus - bDeductions);
    const todayDate = new Date().toISOString().split('T')[0];

    const id = newId('sal');
    const salaryRecord: SalaryPayment = {
      id,
      nurseryId: nid,
      employeeId,
      employeeName: employee.fullName,
      month,
      baseSalary: bSalary,
      bonus: bBonus,
      deductions: bDeductions,
      netPaid,
      paymentDate: todayDate,
      notes: notes || '',
      createdAt: new Date().toISOString()
    };

    await set(ref(database, `salaryPayments/${nid}/${id}`), salaryRecord);

    // تسجيل الراتب تلقائياً كمصروف SALARY
    const expenseId = `exp_sal_${id}`;
    const salaryExpense: Expense = {
      id: expenseId,
      nurseryId: nid,
      title: `راتب شهر ${month} - ${employee.fullName}`,
      category: 'SALARY',
      amount: netPaid,
      date: todayDate,
      recipient: employee.fullName,
      description: `تسديد راتب الموظف (${employee.jobTitle}) لشهر ${month}`,
      paymentMethod: 'CASH',
      recordedBy: me.id,
      recordedByName: me.name,
      createdAt: new Date().toISOString()
    };
    await set(ref(database, `expenses/${nid}/${expenseId}`), salaryExpense);

    await logAction(
      me.id,
      me.name,
      'تسديد راتب',
      `صرف راتب شهر ${month} للموظف ${employee.fullName} بمبلغ صافي ${netPaid} دج`
    );

    return { success: true, salary: salaryRecord };
  },

  // ------------------------------------------- BACKUP & AUDIT LOGS (ADMIN)
  getAuditLogs: async () => {
    requireRole(['ADMIN']);
    const nid = nurseryId();
    const logs = Object.values(await getNode<AuditLog>(`auditLogs/${nid}`)).sort((a, b) =>
      (b.timestamp || '').localeCompare(a.timestamp || '')
    );
    return { success: true, logs };
  },

  /** نسخة احتياطية كاملة بصيغة JSON (تشمل بيانات الحضانة الحالية) */
  exportBackup: async () => {
    requireRole(['ADMIN']);
    const nid = nurseryId();
    const [
      children,
      parents,
      attendance,
      groups,
      payments,
      expenses,
      employees,
      salaryPayments,
      auditLogs
    ] = await Promise.all([
      getNode<Child>(`children/${nid}`),
      getNode<Parent>(`parents/${nid}`),
      getNode<Record<string, AttendanceRecord>>(`attendance/${nid}`),
      getNode<Group>(`groups/${nid}`),
      getNode<Payment>(`payments/${nid}`),
      getNode<Expense>(`expenses/${nid}`),
      getNode<Employee>(`employees/${nid}`),
      getNode<SalaryPayment>(`salaryPayments/${nid}`),
      getNode<AuditLog>(`auditLogs/${nid}`)
    ]);

    return {
      app: 'creche-manager-dz',
      exportedAt: new Date().toISOString(),
      nurseryId: nid,
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
  },

  /** استعادة نسخة احتياطية — يستبدل العقد المعنية في RTDB */
  restoreBackup: async (backupData: any) => {
    const me = requireRole(['ADMIN']);

    if (!backupData || typeof backupData !== 'object') {
      throw new Error('ملف النسخة الاحتياطية غير صالح');
    }

    const nid = nurseryId();
    const asObject = (v: any) => (v && typeof v === 'object' ? v : {});

    const writes: Promise<void>[] = [];
    const simpleKeys = [
      'children',
      'parents',
      'groups',
      'payments',
      'expenses',
      'employees',
      'salaryPayments',
      'auditLogs'
    ] as const;

    for (const key of simpleKeys) {
      if (backupData[key] !== undefined) {
        writes.push(set(ref(database, `${key}/${nid}`), asObject(backupData[key])));
      }
    }
    if (backupData.attendance !== undefined) {
      writes.push(set(ref(database, `attendance/${nid}`), asObject(backupData.attendance)));
    }

    await Promise.all(writes);
    await logAction(me.id, me.name, 'استعادة نسخة احتياطية', 'تم استيراد نسخة احتياطية بنجاح');

    return { success: true, message: 'تمت استعادة قاعدة البيانات بنجاح' };
  }
};

/**
 * الاشتراك في تغييرات الحضانة لتحديث الواجهة لحظياً.
 * يمرر مسارات RTDB الأساسية إلى callback (debounced عند الاستدعاء).
 * يعيد دالة إلغاء الاشتراك.
 */
export function subscribeToNurseryChanges(
  nid: string,
  onChange: () => void,
  onError?: (path: string, error: Error) => void
): () => void {
  const paths = [
    `children/${nid}`,
    `parents/${nid}`,
    `attendance/${nid}`,
    `groups/${nid}`,
    `payments/${nid}`,
    `expenses/${nid}`,
    `employees/${nid}`,
    `salaryPayments/${nid}`
  ];

  const unsub = paths.map((path) =>
    onValue(
      ref(database, path),
      () => onChange(),
      (err) => onError?.(path, err as Error)
    )
  );

  return () => unsub.forEach((u) => u());
}

export { DEFAULT_NURSERY_ID };
