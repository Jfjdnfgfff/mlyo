import { Router, Response } from 'express';
import { dbEngine } from '../services/db-engine.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// Only ADMIN can perform backup/restore and view security audit logs
router.use(requireRole('ADMIN'));

// Get audit logs
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const logs = dbEngine.getAuditLogs(nurseryId);
  return res.json({ success: true, logs });
});

// Export JSON backup
router.get('/export', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const backupData = dbEngine.getFullBackup(nurseryId);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=creche_backup_${new Date().toISOString().split('T')[0]}.json`);
  return res.send(JSON.stringify(backupData, null, 2));
});

// Restore database backup
router.post('/import', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const backupData = req.body;

  if (!backupData || typeof backupData !== 'object') {
    return res.status(400).json({ success: false, message: 'ملف النسخة الاحتياطية غير صالح' });
  }

  const success = dbEngine.restoreBackup(backupData);
  if (!success) {
    return res.status(500).json({ success: false, message: 'فشل استعادة البيانات' });
  }

  dbEngine.logAction(nurseryId, req.user!.id, req.user!.name, 'استعادة نسخة احتياطية', 'تم استيراد نسخة احتياطية بنجاح');

  return res.json({ success: true, message: 'تمت استعادة قاعدة البيانات بنجاح' });
});

export default router;
