import React from 'react';
import { Printer, X, CheckCircle, Building2 } from 'lucide-react';
import { Payment } from '../types';

interface PrintReceiptModalProps {
  payment: Payment;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({ payment, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedAmount = payment.amount.toLocaleString('ar-DZ') + ' دج';
  const formattedDiscount = payment.discount > 0 ? payment.discount.toLocaleString('ar-DZ') + ' دج' : 'بدون خصم';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto no-print-bg">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-6 relative border border-slate-200">
        {/* Header Controls (Hidden during print) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 no-print">
          <h3 className="font-bold text-slate-900 text-sm">معاينة وصل الدفع القابل للطباعة</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              طباعة الوصل
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTAINER */}
        <div className="printable-receipt p-6 border-2 border-slate-800 rounded-2xl space-y-6 text-slate-900 font-sans">
          {/* Receipt Top Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-700 text-white font-black rounded-xl flex items-center justify-center text-xl shadow-sm">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-extrabold text-xl text-slate-900 tracking-tight">حضانة وروضة الأطفال "رواد الغد"</h2>
                <p className="text-xs text-slate-600 font-medium">باب الزوار - الجزائر العاصمة 🇩🇿</p>
                <p className="text-[11px] text-slate-500 font-mono dir-ltr text-right">الهاتف: 0550 12 34 56</p>
              </div>
            </div>

            <div className="text-left font-mono">
              <span className="px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded-md block">وصل تسديد</span>
              <p className="text-xs font-bold text-blue-700 mt-1">{payment.receiptNumber}</p>
              <p className="text-[11px] text-slate-500">{payment.paymentDate}</p>
            </div>
          </div>

          {/* Body Content */}
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 font-medium">اسم الطفل:</span>
                <p className="font-bold text-sm text-slate-900 mt-0.5">{payment.childName}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">ولي الأمر:</span>
                <p className="font-bold text-sm text-slate-900 mt-0.5">{payment.parentName}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">الشهر المستحق:</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{payment.month}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">طريقة الدفع:</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {payment.paymentMethod === 'BARIDIMOB'
                    ? 'بريدي موب (BaridiMob)'
                    : payment.paymentMethod === 'CASH'
                    ? 'نقداً'
                    : payment.paymentMethod}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">الخصم الممنوح:</span>
                <p className="font-bold text-slate-900 mt-0.5">{formattedDiscount}</p>
              </div>
            </div>

            {/* Total Paid Box */}
            <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-500 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800">المبلغ المستلم المستحق:</span>
                <p className="text-2xl font-black text-emerald-900 tabular-nums mt-0.5">{formattedAmount}</p>
              </div>
              <div className="text-emerald-700 flex items-center gap-1 font-bold text-xs bg-white px-3 py-1.5 rounded-lg border border-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                سداد مؤكد
              </div>
            </div>

            {payment.notes && (
              <div className="p-3 bg-slate-50 rounded-xl text-slate-700">
                <span className="font-bold">ملاحظات: </span> {payment.notes}
              </div>
            )}
          </div>

          {/* Footer & Signatures */}
          <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-[11px] text-slate-600">
            <div>
              <p>توقيع وختم مصلحة المحاسبة والمالية</p>
              <div className="h-14 w-32 border border-dashed border-slate-300 rounded-lg mt-1 flex items-center justify-center text-slate-400">
                [ختم الحضانة]
              </div>
            </div>

            <div className="text-left font-mono">
              <p>المستلم: {payment.receivedByName || 'محاسب الحضانة'}</p>
              <p className="text-[10px] text-slate-400">طبع عبر منصة Crèche Manager DZ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
