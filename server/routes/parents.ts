import { Router, Response } from 'express';
import { dbEngine } from '../services/db-engine.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// List parents with their associated children and financial debt summary
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const parents = dbEngine.getParents(nurseryId);
  const children = dbEngine.getChildren(nurseryId, true);
  const payments = dbEngine.getPayments(nurseryId);
  const currentMonth = new Date().toISOString().substring(0, 7);

  const result = parents.map((p) => {
    const parentChildren = children.filter((c) => c.parentId === p.id && c.status === 'ACTIVE');
    const totalMonthlyFees = parentChildren.reduce((sum, c) => sum + c.monthlyFee, 0);

    // Sum paid this month for these children
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

  return res.json({ success: true, parents: result });
});

// Single parent profile
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const parent = dbEngine.getParentById(nurseryId, req.params.id);

  if (!parent) {
    return res.status(404).json({ success: false, message: 'بيانات الولي غير موجودة' });
  }

  const children = dbEngine.getChildren(nurseryId, true).filter((c) => c.parentId === parent.id);
  const payments = dbEngine.getPayments(nurseryId).filter((pay) => pay.parentId === parent.id);

  return res.json({
    success: true,
    parent: {
      ...parent,
      children,
      payments
    }
  });
});

// Create parent
router.post('/', requireRole(['ADMIN', 'ACCOUNTANT']), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const { fullName, phone, altPhone, email, address, nationalId, notes } = req.body;

  if (!fullName || !phone) {
    return res.status(400).json({ success: false, message: 'الرجاء إدخال الاسم الكامل ورقم الهاتف على الأقل' });
  }

  const newParent = dbEngine.saveParent(nurseryId, {
    id: `parent_${Date.now()}`,
    nurseryId,
    fullName,
    phone,
    altPhone: altPhone || '',
    email: email || '',
    address: address || '',
    nationalId: nationalId || '',
    childrenIds: [],
    notes: notes || '',
    createdAt: new Date().toISOString()
  });

  dbEngine.logAction(nurseryId, req.user!.id, req.user!.name, 'تسجيل ولي أمر', `إضافة الولي: ${fullName}`);

  return res.status(201).json({ success: true, parent: newParent });
});

// Update parent
router.put('/:id', requireRole(['ADMIN', 'ACCOUNTANT']), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const parent = dbEngine.getParentById(nurseryId, req.params.id);

  if (!parent) {
    return res.status(404).json({ success: false, message: 'بيانات الولي غير موجودة' });
  }

  const { fullName, phone, altPhone, email, address, nationalId, notes } = req.body;

  if (fullName) parent.fullName = fullName;
  if (phone) parent.phone = phone;
  if (altPhone !== undefined) parent.altPhone = altPhone;
  if (email !== undefined) parent.email = email;
  if (address !== undefined) parent.address = address;
  if (nationalId !== undefined) parent.nationalId = nationalId;
  if (notes !== undefined) parent.notes = notes;

  dbEngine.saveParent(nurseryId, parent);
  return res.json({ success: true, parent });
});

// Delete parent
router.delete('/:id', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const success = dbEngine.deleteParent(nurseryId, req.params.id);

  if (!success) {
    return res.status(404).json({ success: false, message: 'تعذر العثور على بيانات الولي' });
  }

  return res.json({ success: true, message: 'تم حذف بيانات الولي بنجاح' });
});

export default router;
