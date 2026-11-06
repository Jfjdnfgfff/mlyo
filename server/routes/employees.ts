import { Router, Response } from 'express';
import { dbEngine } from '../services/db-engine.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { Employee, SalaryPayment, Expense } from '../types.js';

const router = Router();

// Only ADMIN and ACCOUNTANT can manage staff & salary
router.use(requireRole(['ADMIN', 'ACCOUNTANT']));

// List employees
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const employees = dbEngine.getEmployees(nurseryId);
  return res.json({ success: true, employees });
});

// Create employee
router.post('/', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const { fullName, phone, jobTitle, monthlySalary, hireDate, notes } = req.body;

  if (!fullName || !jobTitle || !monthlySalary) {
    return res.status(400).json({ success: false, message: 'الرجاء إدخال اسم الموظف والوظيفة والراتب الشهري' });
  }

  const employee: Employee = {
    id: `emp_${Date.now()}`,
    nurseryId,
    fullName,
    phone: phone || '',
    jobTitle,
    monthlySalary: Number(monthlySalary),
    hireDate: hireDate || new Date().toISOString().split('T')[0],
    status: 'ACTIVE',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  dbEngine.saveEmployee(nurseryId, employee);
  dbEngine.logAction(nurseryId, req.user!.id, req.user!.name, 'إضافة موظف', `توظيف: ${fullName} (${jobTitle})`);

  return res.status(201).json({ success: true, employee });
});

// Update employee
router.put('/:id', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const employees = dbEngine.getEmployees(nurseryId);
  const employee = employees.find((e) => e.id === req.params.id);

  if (!employee) {
    return res.status(404).json({ success: false, message: 'ملف الموظف غير موجود' });
  }

  const { fullName, phone, jobTitle, monthlySalary, status, notes } = req.body;

  if (fullName) employee.fullName = fullName;
  if (phone !== undefined) employee.phone = phone;
  if (jobTitle) employee.jobTitle = jobTitle;
  if (monthlySalary !== undefined) employee.monthlySalary = Number(monthlySalary);
  if (status) employee.status = status;
  if (notes !== undefined) employee.notes = notes;

  dbEngine.saveEmployee(nurseryId, employee);
  return res.json({ success: true, employee });
});

// Delete employee
router.delete('/:id', requireRole('ADMIN'), (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const success = dbEngine.deleteEmployee(nurseryId, req.params.id);

  if (!success) {
    return res.status(404).json({ success: false, message: 'ملف الموظف غير موجود' });
  }

  return res.json({ success: true, message: 'تم حذف ملف الموظف بنجاح' });
});

// List salary payouts
router.get('/salaries', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const month = req.query.month as string;

  let salaries = dbEngine.getSalaryPayments(nurseryId);
  if (month) {
    salaries = salaries.filter((s) => s.month === month);
  }

  salaries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return res.json({ success: true, salaries });
});

// Record salary payment
router.post('/salaries', (req: AuthenticatedRequest, res: Response) => {
  const nurseryId = req.user?.nurseryId || 'nursery_algiers_01';
  const { employeeId, month, baseSalary, bonus, deductions, notes } = req.body;

  if (!employeeId || !month) {
    return res.status(400).json({ success: false, message: 'الرجاء اختيار الموظف والشهر المعني بالراتب' });
  }

  const employees = dbEngine.getEmployees(nurseryId);
  const employee = employees.find((e) => e.id === employeeId);

  if (!employee) {
    return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
  }

  const bSalary = Number(baseSalary) || employee.monthlySalary;
  const bBonus = Number(bonus) || 0;
  const bDeductions = Number(deductions) || 0;
  const netPaid = Math.max(0, bSalary + bBonus - bDeductions);
  const todayDate = new Date().toISOString().split('T')[0];

  const salaryRecord: SalaryPayment = {
    id: `sal_${Date.now()}`,
    nurseryId,
    employeeId,
    employeeName: employee.fullName,
    month,
    baseSalary: bSalary,
    bonus: bBonus,
    deductions: bDeductions,
    netPaid,
    paymentDate: todayDate,
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  dbEngine.saveSalaryPayment(nurseryId, salaryRecord);

  // Also log into expenses automatically as SALARY category
  const salaryExpense: Expense = {
    id: `exp_sal_${salaryRecord.id}`,
    nurseryId,
    title: `راتب شهر ${month} - ${employee.fullName}`,
    category: 'SALARY',
    amount: netPaid,
    date: todayDate,
    recipient: employee.fullName,
    description: `تسديد راتب الموظف (${employee.jobTitle}) لشهر ${month}`,
    paymentMethod: 'CASH',
    recordedBy: req.user!.id,
    recordedByName: req.user!.name,
    createdAt: new Date().toISOString()
  };
  dbEngine.saveExpense(nurseryId, salaryExpense);

  dbEngine.logAction(
    nurseryId,
    req.user!.id,
    req.user!.name,
    'تسديد راتب',
    `صرف راتب شهر ${month} للموظف ${employee.fullName} بمبلغ صافي ${netPaid} دج`
  );

  return res.status(201).json({ success: true, salary: salaryRecord });
});

export default router;
