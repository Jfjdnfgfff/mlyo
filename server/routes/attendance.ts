import { Router, Response } from 'express';
import { dbEngine } from '../services/db-engine.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AttendanceRecord } from '../types.js';

const router = Router();

// Get attendance records by date (defaults to today YYYY-MM-DD)
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const groupId = req.query.groupId as string;

  const records = dbEngine.getAttendanceByDate(nurseryId, date);
  const children = dbEngine.getChildren(nurseryId, false);

  // Merge active children with attendance records so every child displays state
  let result = children.map((child) => {
    const rec = records.find((r) => r.childId === child.id);
    return {
      childId: child.id,
      childName: `${child.firstName} ${child.lastName}`,
      groupId: child.groupId,
      groupName: child.groupName,
      date,
      status: rec ? rec.status : 'ABSENT',
      checkInTime: rec?.checkInTime || '',
      checkOutTime: rec?.checkOutTime || '',
      pickupPerson: rec?.pickupPerson || '',
      notes: rec?.notes || '',
      authorizedPickups: child.authorizedPickups || [],
      recordedBy: rec?.recordedBy || '',
      recordedByName: rec?.recordedByName || ''
    };
  });

  if (req.user?.role === 'EDUCATOR' && req.user.assignedGroupId) {
    result = result.filter((r) => r.groupId === req.user?.assignedGroupId);
  } else if (groupId) {
    result = result.filter((r) => r.groupId === groupId);
  }

  return res.json({ success: true, date, attendance: result });
});

// Single child check-in or update status
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const { childId, date, status, checkInTime, checkOutTime, pickupPerson, notes } = req.body;

  if (!childId) {
    return res.status(400).json({ success: false, message: 'الرجاء اختيار الطفل' });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];
  const child = dbEngine.getChildById(nurseryId, childId);

  if (!child) {
    return res.status(404).json({ success: false, message: 'ملف الطفل غير موجود' });
  }

  const existingRecords = dbEngine.getAttendanceByDate(nurseryId, targetDate);
  const existing = existingRecords.find((r) => r.childId === childId);

  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const updatedRecord: AttendanceRecord = {
    id: existing ? existing.id : `${targetDate}_${childId}`,
    nurseryId,
    childId,
    childName: `${child.firstName} ${child.lastName}`,
    groupId: child.groupId,
    date: targetDate,
    status: status || 'PRESENT',
    checkInTime: checkInTime || existing?.checkInTime || (status === 'PRESENT' ? nowTime : ''),
    checkOutTime: checkOutTime !== undefined ? checkOutTime : existing?.checkOutTime || '',
    pickupPerson: pickupPerson !== undefined ? pickupPerson : existing?.pickupPerson || '',
    notes: notes !== undefined ? notes : existing?.notes || '',
    recordedBy: req.user?.id || 'system',
    recordedByName: req.user?.name || 'النظام',
    updatedAt: new Date().toISOString()
  };

  dbEngine.saveAttendance(nurseryId, updatedRecord);

  return res.json({
    success: true,
    message: 'تم تسجيل الحضور/الغياب بنجاح',
    record: updatedRecord
  });
});

// Batch attendance update for a group
router.post('/batch', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const { date, records } = req.body;

  if (!Array.isArray(records)) {
    return res.status(400).json({ success: false, message: 'قائمة الحضور غير صحيحة' });
  }

  const targetDate = date || new Date().toISOString().split('T')[0];
  const saved: AttendanceRecord[] = [];

  records.forEach((r: { childId: string; status: 'PRESENT' | 'ABSENT' | 'EXCUSED'; checkInTime?: string; notes?: string }) => {
    const child = dbEngine.getChildById(nurseryId, r.childId);
    if (child) {
      const existing = dbEngine.getAttendanceByDate(nurseryId, targetDate).find((item) => item.childId === r.childId);
      const rec: AttendanceRecord = {
        id: existing ? existing.id : `${targetDate}_${r.childId}`,
        nurseryId,
        childId: r.childId,
        childName: `${child.firstName} ${child.lastName}`,
        groupId: child.groupId,
        date: targetDate,
        status: r.status,
        checkInTime: r.checkInTime || existing?.checkInTime || (r.status === 'PRESENT' ? '08:00' : ''),
        checkOutTime: existing?.checkOutTime || '',
        pickupPerson: existing?.pickupPerson || '',
        notes: r.notes || existing?.notes || '',
        recordedBy: req.user?.id || 'system',
        recordedByName: req.user?.name || 'النظام',
        updatedAt: new Date().toISOString()
      };
      dbEngine.saveAttendance(nurseryId, rec);
      saved.push(rec);
    }
  });

  return res.json({ success: true, count: saved.length, message: 'تم حفظ سجل الحضور الجماعي بنجاح' });
});

export default router;
