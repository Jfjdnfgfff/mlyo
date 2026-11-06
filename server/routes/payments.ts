import { Router, Response } from 'express';
import { dbEngine } from '../services/db-engine.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { validatePaymentPayload } from '../middleware/validation.js';
import { Payment } from '../types.js';

const router = Router();

// Only ADMIN and ACCOUNTANT can access payments and subscriptions
router.use(requireRole(['ADMIN', 'ACCOUNTANT']));

// List payments
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const month = req.query.month as string;
  const childId = req.query.childId as string;

  let payments = dbEngine.getPayments(nurseryId);

  if (month) {
    payments = payments.filter((p) => p.month === month);
  }
  if (childId) {
    payments = payments.filter((p) => p.childId === childId);
  }

  // Sort descending by date
  payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return res.json({ success: true, payments });
});

// Record new payment & issue receipt
router.post('/', validatePaymentPayload, (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const { childId, month, amount, discount, paymentMethod, notes } = req.body;

  const child = dbEngine.getChildById(nurseryId, childId);
  if (!child) {
    return res.status(404).json({ success: false, message: 'تعذر العثور على ملف الطفل' });
  }

  const parent = child.parentId ? dbEngine.getParentById(nurseryId, child.parentId) : null;
  const parentName = parent ? parent.fullName : child.parentName || 'غير محدد';

  const allPayments = dbEngine.getPayments(nurseryId);
  const currentYear = new Date().getFullYear();
  const yearSeq = allPayments.filter((p) => p.createdAt.startsWith(String(currentYear))).length + 1;
  const receiptNumber = `REC-${currentYear}-${String(yearSeq).padStart(4, '0')}`;

  const payment: Payment = {
    id: `pay_${Date.now()}`,
    nurseryId,
    receiptNumber,
    childId: child.id,
    childName: `${child.firstName} ${child.lastName}`,
    parentId: child.parentId,
    parentName,
    month,
    amount: Number(amount),
    discount: Number(discount) || 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: paymentMethod || 'CASH',
    receivedBy: req.user!.id,
    receivedByName: req.user!.name,
    notes: notes || '',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  dbEngine.savePayment(nurseryId, payment);

  dbEngine.logAction(
    nurseryId,
    req.user!.id,
    req.user!.name,
    'استلام دفعة',
    `إصدار وصل ${receiptNumber} بمبلغ ${amount} دج للطفل ${child.firstName} ${child.lastName}`
  );

  return res.status(201).json({
    success: true,
    message: 'تم تسجيل عملية الدفع وإصدار الوصل بنجاح',
    payment
  });
});

// Void payment receipt
router.post('/:id/void', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const success = dbEngine.voidPayment(nurseryId, req.params.id);

  if (!success) {
    return res.status(404).json({ success: false, message: 'وصل الدفع غير موجود' });
  }

  dbEngine.logAction(nurseryId, req.user!.id, req.user!.name, 'إلغاء وصل', `إلغاء وصل الدفع ID: ${req.params.id}`);

  return res.json({ success: true, message: 'تم إلغاء وصل الدفع بنجاح' });
});

// Subscriptions & balance summary per child
router.get('/subscriptions/summary', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const selectedMonth = (req.query.month as string) || new Date().toISOString().substring(0, 7);

  const children = dbEngine.getChildren(nurseryId, true);
  const payments = dbEngine.getPayments(nurseryId);

  const summary = children.map((c) => {
    const childPayments = payments.filter((p) => p.childId === c.id && p.month === selectedMonth);
    const totalPaid = childPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalDiscount = childPayments.reduce((sum, p) => sum + p.discount, 0);
    const effectiveFee = Math.max(0, c.monthlyFee - totalDiscount);
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
      groupName: c.groupName,
      parentName: c.parentName,
      parentPhone: c.parentPhone,
      month: selectedMonth,
      monthlyFee: c.monthlyFee,
      totalDiscount,
      effectiveFee,
      totalPaid,
      balance: Math.max(0, balance),
      status,
      paymentsCount: childPayments.length
    };
  });

  return res.json({ success: true, month: selectedMonth, summary });
});

export default router;
