import { Router, Response } from 'express';
import { dbEngine } from '../services/db-engine.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { validateExpensePayload } from '../middleware/validation.js';
import { Expense } from '../types.js';

const router = Router();

// Only ADMIN and ACCOUNTANT can manage expenses
router.use(requireRole(['ADMIN', 'ACCOUNTANT']));

// List expenses
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const category = req.query.category as string;
  const month = req.query.month as string;

  let expenses = dbEngine.getExpenses(nurseryId);

  if (category) {
    expenses = expenses.filter((e) => e.category === category);
  }
  if (month) {
    expenses = expenses.filter((e) => e.date.startsWith(month));
  }

  expenses.sort((a, b) => b.date.localeCompare(a.date));

  return res.json({ success: true, expenses });
});

// Create expense
router.post('/', validateExpensePayload, (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const { title, category, amount, date, recipient, description, paymentMethod } = req.body;

  const expense: Expense = {
    id: `exp_${Date.now()}`,
    nurseryId,
    title,
    category,
    amount: Number(amount),
    date,
    recipient: recipient || '',
    description: description || '',
    paymentMethod: paymentMethod || 'CASH',
    recordedBy: req.user!.id,
    recordedByName: req.user!.name,
    createdAt: new Date().toISOString()
  };

  dbEngine.saveExpense(nurseryId, expense);
  dbEngine.logAction(nurseryId, req.user!.id, req.user!.name, 'إضافة مصروف', `تسجيل مصروف: ${title} بمبلغ ${amount} دج`);

  return res.status(201).json({ success: true, expense });
});

// Delete expense
router.delete('/:id', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const success = dbEngine.deleteExpense(nurseryId, req.params.id);

  if (!success) {
    return res.status(404).json({ success: false, message: 'سجل المصروف غير موجود' });
  }

  dbEngine.logAction(nurseryId, req.user!.id, req.user!.name, 'حذف مصروف', `حذف المصروف ID: ${req.params.id}`);

  return res.json({ success: true, message: 'تم حذف المصروف بنجاح' });
});

export default router;
