import { Router, Response } from 'express';
import { dbEngine } from '../services/db-engine.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { validateChildPayload } from '../middleware/validation.js';
import { Child } from '../types.js';

const router = Router();

// List children
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const includeArchived = req.query.archived === 'true';
  const groupId = req.query.groupId as string;
  const search = (req.query.search as string || '').trim().toLowerCase();

  let list = dbEngine.getChildren(nurseryId, includeArchived);

  // Filter for educators if assigned to specific group
  if (req.user?.role === 'EDUCATOR' && req.user.assignedGroupId) {
    list = list.filter((c) => c.groupId === req.user?.assignedGroupId);
  } else if (groupId) {
    list = list.filter((c) => c.groupId === groupId);
  }

  if (search) {
    list = list.filter((c) =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search) ||
      c.parentPhone.includes(search) ||
      (c.parentName && c.parentName.toLowerCase().includes(search))
    );
  }

  return res.json({ success: true, children: list });
});

// Single child full profile with financial and attendance summary
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const child = dbEngine.getChildById(nurseryId, req.params.id);

  if (!child) {
    return res.status(404).json({ success: false, message: 'ملف الطفل غير موجود' });
  }

  const parent = child.parentId ? dbEngine.getParentById(nurseryId, child.parentId) : null;
  const group = child.groupId ? dbEngine.getGroupById(nurseryId, child.groupId) : null;
  const payments = dbEngine.getPaymentsByChild(nurseryId, child.id);

  return res.json({
    success: true,
    child: {
      ...child,
      parent,
      group
    },
    payments
  });
});

// Create new child
router.post('/', requireRole(['ADMIN', 'ACCOUNTANT']), validateChildPayload, (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
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
  } = req.body;

  let finalParentId = parentId;
  let finalParentName = parentName || '';

  // If no parentId provided but parent info supplied, create parent record
  if (!finalParentId && parentName && parentPhone) {
    const newParent = dbEngine.saveParent(nurseryId, {
      id: `parent_${Date.now()}`,
      nurseryId,
      fullName: parentName,
      phone: parentPhone,
      address: address || '',
      childrenIds: [],
      createdAt: new Date().toISOString()
    });
    finalParentId = newParent.id;
  } else if (finalParentId) {
    const parent = dbEngine.getParentById(nurseryId, finalParentId);
    if (parent) {
      finalParentName = parent.fullName;
    }
  }

  let groupName = '';
  if (groupId) {
    const grp = dbEngine.getGroupById(nurseryId, groupId);
    if (grp) groupName = grp.name;
  }

  const newChild: Child = {
    id: `child_${Date.now()}`,
    nurseryId,
    firstName,
    lastName,
    birthDate,
    gender,
    groupId: groupId || '',
    groupName,
    registrationDate: new Date().toISOString().split('T')[0],
    parentId: finalParentId || '',
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

  dbEngine.saveChild(nurseryId, newChild);
  dbEngine.logAction(nurseryId, req.user!.id, req.user!.name, 'تسجيل طفل', `إضافة الطفل ${firstName} ${lastName}`);

  return res.status(201).json({ success: true, child: newChild });
});

// Update child
router.put('/:id', requireRole(['ADMIN', 'ACCOUNTANT']), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const child = dbEngine.getChildById(nurseryId, req.params.id);

  if (!child) {
    return res.status(404).json({ success: false, message: 'ملف الطفل غير موجود' });
  }

  const {
    firstName,
    lastName,
    birthDate,
    gender,
    groupId,
    parentId,
    parentPhone,
    address,
    healthNotes,
    authorizedPickups,
    notes,
    monthlyFee,
    status
  } = req.body;

  if (firstName) child.firstName = firstName;
  if (lastName) child.lastName = lastName;
  if (birthDate) child.birthDate = birthDate;
  if (gender) child.gender = gender;
  if (groupId !== undefined) {
    child.groupId = groupId;
    const grp = dbEngine.getGroupById(nurseryId, groupId);
    child.groupName = grp ? grp.name : '';
  }
  if (parentId !== undefined) {
    child.parentId = parentId;
    const parent = dbEngine.getParentById(nurseryId, parentId);
    if (parent) child.parentName = parent.fullName;
  }
  if (parentPhone !== undefined) child.parentPhone = parentPhone;
  if (address !== undefined) child.address = address;
  if (healthNotes !== undefined) child.healthNotes = healthNotes;
  if (authorizedPickups !== undefined) child.authorizedPickups = Array.isArray(authorizedPickups) ? authorizedPickups : [];
  if (notes !== undefined) child.notes = notes;
  if (monthlyFee !== undefined) child.monthlyFee = Number(monthlyFee);
  if (status !== undefined) child.status = status;

  child.updatedAt = new Date().toISOString();

  dbEngine.saveChild(nurseryId, child);
  dbEngine.logAction(nurseryId, req.user!.id, req.user!.name, 'تعديل طفل', `تحديث بيانات الطفل ${child.firstName} ${child.lastName}`);

  return res.json({ success: true, child });
});

// Archive / Delete child
router.delete('/:id', requireRole(['ADMIN', 'ACCOUNTANT']), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const child = dbEngine.getChildById(nurseryId, req.params.id);

  if (!child) {
    return res.status(404).json({ success: false, message: 'ملف الطفل غير موجود' });
  }

  const force = req.query.force === 'true';
  dbEngine.deleteChild(nurseryId, child.id, !force);

  const actionText = force ? 'حذف نهائي' : 'أرشفة ملف';
  dbEngine.logAction(nurseryId, req.user!.id, req.user!.name, `${actionText} طفل`, `إجراء ${actionText} للطفل ${child.firstName} ${child.lastName}`);

  return res.json({ success: true, message: `تم ${actionText} الطفل بنجاح دون المساس بالسجلات المالية التاريخية` });
});

export default router;
