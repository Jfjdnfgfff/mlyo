import { Request, Response, NextFunction } from 'express';

// Clean inputs against XSS/HTML Injection
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function validateChildPayload(req: Request, res: Response, next: NextFunction) {
  const { firstName, lastName, birthDate, gender, monthlyFee } = req.body;

  if (!firstName || typeof firstName !== 'string' || firstName.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'الرجاء إدخال اسم الطفل' });
  }

  if (!lastName || typeof lastName !== 'string' || lastName.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'الرجاء إدخال لقب الطفل' });
  }

  if (!birthDate) {
    return res.status(400).json({ success: false, message: 'الرجاء تحديد تاريخ ميلاد الطفل' });
  }

  if (!gender || !['M', 'F'].includes(gender)) {
    return res.status(400).json({ success: false, message: 'الرجاء تحديد جنس الطفل' });
  }

  if (monthlyFee !== undefined && (isNaN(Number(monthlyFee)) || Number(monthlyFee) < 0)) {
    return res.status(400).json({ success: false, message: 'مبلغ الاشتراك الشهري غير صحيح' });
  }

  next();
}

export function validatePaymentPayload(req: Request, res: Response, next: NextFunction) {
  const { childId, month, amount } = req.body;

  if (!childId) {
    return res.status(400).json({ success: false, message: 'الرجاء اختيار الطفل المعني بالدفع' });
  }

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ success: false, message: 'الرجاء تحديد شهر التسديد بالشكل الصحيح (YYYY-MM)' });
  }

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'مبلغ التسديد يجب أن يكون أكبر من 0 دج' });
  }

  next();
}

export function validateExpensePayload(req: Request, res: Response, next: NextFunction) {
  const { title, category, amount, date } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'الرجاء إدخال عنوان أو بيان المصروف' });
  }

  if (!category) {
    return res.status(400).json({ success: false, message: 'الرجاء اختيار تصنيف المصروف' });
  }

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: 'مبلغ المصروف يجب أن يكون رقماً موجباً' });
  }

  if (!date) {
    return res.status(400).json({ success: false, message: 'الرجاء تحديد تاريخ المصروف' });
  }

  next();
}
