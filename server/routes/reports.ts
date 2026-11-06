import { Router, Response } from 'express';
import { dbEngine } from '../services/db-engine.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Dashboard summary stats
router.get('/dashboard', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const todayDate = new Date().toISOString().split('T')[0];
  const currentMonth = todayDate.substring(0, 7);

  const activeChildren = dbEngine.getChildren(nurseryId, false);
  const attendanceToday = dbEngine.getAttendanceByDate(nurseryId, todayDate);
  const payments = dbEngine.getPayments(nurseryId);
  const expenses = dbEngine.getExpenses(nurseryId);

  // Present & absent today
  const presentToday = attendanceToday.filter((a) => a.status === 'PRESENT').length;
  const absentToday = attendanceToday.filter((a) => a.status === 'ABSENT' || a.status === 'EXCUSED').length;

  // Monthly financials
  const monthlySubscriptionsTotal = activeChildren.reduce((sum, c) => sum + c.monthlyFee, 0);

  const currentMonthPayments = payments.filter((p) => p.month === currentMonth);
  const paymentsReceived = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalDiscounts = currentMonthPayments.reduce((sum, p) => sum + p.discount, 0);

  const pendingDebt = Math.max(0, monthlySubscriptionsTotal - totalDiscounts - paymentsReceived);

  const currentMonthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
  const expensesTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const netRevenue = paymentsReceived - expensesTotal;

  // Recent 6 transactions
  const recentTransactions = payments
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      childName: p.childName,
      amount: p.amount,
      date: p.paymentDate,
      paymentMethod: p.paymentMethod
    }));

  // Expense breakdown by category
  const expenseCategories: Record<string, number> = {};
  currentMonthExpenses.forEach((e) => {
    expenseCategories[e.category] = (expenseCategories[e.category] || 0) + e.amount;
  });

  return res.json({
    success: true,
    data: {
      totalChildren: activeChildren.length,
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
    }
  });
});

// Full financial report
router.get('/financial', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);

  const payments = dbEngine.getPayments(nurseryId).filter((p) => p.month === month);
  const expenses = dbEngine.getExpenses(nurseryId).filter((e) => e.date.startsWith(month));
  const salaryPayments = dbEngine.getSalaryPayments(nurseryId).filter((s) => s.month === month);

  const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSalaries = salaryPayments.reduce((sum, s) => sum + s.netPaid, 0);
  const netProfit = totalIncome - totalExpenses;

  return res.json({
    success: true,
    month,
    totalIncome,
    totalExpenses,
    totalSalaries,
    netProfit,
    payments,
    expenses,
    salaryPayments
  });
});

export default router;
