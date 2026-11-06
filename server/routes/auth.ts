import { Router, Response } from 'express';
import { dbEngine } from '../services/db-engine.js';
import { AuthenticatedRequest, generateToken, requireRole } from '../middleware/auth.js';
import { UserRole } from '../types.js';

const router = Router();

// Login endpoint
router.post('/login', (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'الرجاء إدخال البريد الإلكتروني' });
  }

  // Find user in database
  const user = dbEngine.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
  }

  // Generate token & log audit
  const token = generateToken(user);
  dbEngine.logAction(user.nurseryId, user.id, user.name, 'تسجيل دخول', 'تسجيل الدخول إلى منصة تسيير الحضانة');

  return res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      nurseryId: user.nurseryId,
      assignedGroupId: user.assignedGroupId,
      phone: user.phone
    }
  });
});

// Current user profile
router.get('/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'غير تسجيل الدخول' });
  }
  return res.json({ success: true, user: req.user });
});

// ADMIN: Get all users
router.get('/users', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const users = dbEngine.getUsers(nurseryId);
  return res.json({ success: true, users });
});

// ADMIN: Create new user
router.post('/users', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const { name, email, role, phone, assignedGroupId } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'الرجاء ملء كافة البيانات الأساسية (الاسم، البريد، الصلاحية)' });
  }

  const existing = dbEngine.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
  }

  const newUser = dbEngine.createUser({
    id: `user_${Date.now()}`,
    name,
    email,
    role: role as UserRole,
    nurseryId,
    phone,
    assignedGroupId,
    createdAt: new Date().toISOString()
  });

  dbEngine.logAction(nurseryId, req.user!.id, req.user!.name, 'إنشاء مستخدم', `إضافة حساب جديد: ${name} (${role})`);

  return res.status(201).json({ success: true, user: newUser });
});

// ADMIN: Delete user
router.delete('/users/:id', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const userId = req.params.id;

  if (userId === req.user?.id) {
    return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك الشخصي الخاطئ بيدك' });
  }

  const success = dbEngine.deleteUser(userId);
  if (!success) {
    return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
  }

  dbEngine.logAction(nurseryId, req.user!.id, req.user!.name, 'حذف مستخدم', `حذف الحساب ID: ${userId}`);

  return res.json({ success: true, message: 'تم حذف حساب المستخدم بنجاح' });
});

export default router;
