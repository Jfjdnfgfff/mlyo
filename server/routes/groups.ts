import { Router, Response } from 'express';
import { dbEngine } from '../services/db-engine.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { Group } from '../types.js';

const router = Router();

// List classroom groups with enrolled child count
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const groups = dbEngine.getGroups(nurseryId);
  const children = dbEngine.getChildren(nurseryId, false);

  const result = groups.map((g) => {
    const enrolledCount = children.filter((c) => c.groupId === g.id && c.status === 'ACTIVE').length;
    return {
      ...g,
      enrolledCount,
      isFull: enrolledCount >= g.maxCapacity
    };
  });

  return res.json({ success: true, groups: result });
});

// Single group
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const group = dbEngine.getGroupById(nurseryId, req.params.id);

  if (!group) {
    return res.status(404).json({ success: false, message: 'القسم غير موجود' });
  }

  const groupChildren = dbEngine.getChildren(nurseryId, false).filter((c) => c.groupId === group.id);
  return res.json({ success: true, group: { ...group, children: groupChildren } });
});

// Create group
router.post('/', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const { name, maxCapacity, educatorId, educatorName, description, ageRange } = req.body;

  if (!name || !maxCapacity) {
    return res.status(400).json({ success: false, message: 'الرجاء تحديد اسم القسم والطاقة الاستيعابية القصوى' });
  }

  const group: Group = {
    id: `group_${Date.now()}`,
    nurseryId,
    name,
    maxCapacity: Number(maxCapacity),
    educatorId: educatorId || '',
    educatorName: educatorName || '',
    description: description || '',
    ageRange: ageRange || '',
    createdAt: new Date().toISOString()
  };

  dbEngine.saveGroup(nurseryId, group);
  dbEngine.logAction(nurseryId, req.user!.id, req.user!.name, 'إنشاء قسم', `إضافة مجموعة جديدة: ${name}`);

  return res.status(201).json({ success: true, group });
});

// Update group
router.put('/:id', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const group = dbEngine.getGroupById(nurseryId, req.params.id);

  if (!group) {
    return res.status(404).json({ success: false, message: 'القسم غير موجود' });
  }

  const { name, maxCapacity, educatorId, educatorName, description, ageRange } = req.body;

  if (name) group.name = name;
  if (maxCapacity !== undefined) group.maxCapacity = Number(maxCapacity);
  if (educatorId !== undefined) group.educatorId = educatorId;
  if (educatorName !== undefined) group.educatorName = educatorName;
  if (description !== undefined) group.description = description;
  if (ageRange !== undefined) group.ageRange = ageRange;

  dbEngine.saveGroup(nurseryId, group);
  return res.json({ success: true, group });
});

// Delete group
router.delete('/:id', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const success = dbEngine.deleteGroup(nurseryId, req.params.id);

  if (!success) {
    return res.status(404).json({ success: false, message: 'القسم غير موجود' });
  }

  return res.json({ success: true, message: 'تم حذف القسم بنجاح' });
});

export default router;
