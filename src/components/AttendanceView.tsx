import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
  Building,
  Users
} from 'lucide-react';
import { AttendanceRecord, Group, User } from '../types';

interface AttendanceViewProps {
  attendanceList: AttendanceRecord[];
  groups: Group[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  currentUser: User;
  onSaveAttendance: (record: {
    childId: string;
    date?: string;
    status: 'PRESENT' | 'ABSENT' | 'EXCUSED';
    checkInTime?: string;
    checkOutTime?: string;
    pickupPerson?: string;
    notes?: string;
  }) => Promise<void>;
  onBatchSaveAttendance: (records: Array<{ childId: string; status: 'PRESENT' | 'ABSENT' | 'EXCUSED'; notes?: string }>) => Promise<void>;
  onRefresh: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendanceList,
  groups,
  selectedDate,
  setSelectedDate,
  currentUser,
  onSaveAttendance,
  onBatchSaveAttendance,
  onRefresh
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [localAttendance, setLocalAttendance] = useState<AttendanceRecord[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [batchSaving, setBatchSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setLocalAttendance(attendanceList);
  }, [attendanceList]);

  const handleStatusChange = (childId: string, status: 'PRESENT' | 'ABSENT' | 'EXCUSED') => {
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    setLocalAttendance((prev) =>
      prev.map((item) => {
        if (item.childId === childId) {
          return {
            ...item,
            status,
            checkInTime: status === 'PRESENT' ? item.checkInTime || nowTime : ''
          };
        }
        return item;
      })
    );
  };

  const handleFieldChange = (childId: string, field: keyof AttendanceRecord, value: string) => {
    setLocalAttendance((prev) =>
      prev.map((item) => {
        if (item.childId === childId) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const saveSingle = async (rec: AttendanceRecord) => {
    try {
      setSavingId(rec.childId);
      await onSaveAttendance({
        childId: rec.childId,
        date: selectedDate,
        status: rec.status,
        checkInTime: rec.checkInTime,
        checkOutTime: rec.checkOutTime,
        pickupPerson: rec.pickupPerson,
        notes: rec.notes
      });
      setMsg(`تم حفظ سجل الطفل (${rec.childName}) بنجاح`);
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ سجل الحضور');
    } finally {
      setSavingId(null);
    }
  };

  const saveAllBatch = async () => {
    try {
      setBatchSaving(true);
      const batchPayload = localAttendance.map((a) => ({
        childId: a.childId,
        status: a.status,
        checkInTime: a.checkInTime,
        notes: a.notes
      }));
      await onBatchSaveAttendance(batchPayload);
      setMsg('تم حفظ جميع سجلات الحضور اليومية بنجاح!');
      setTimeout(() => setMsg(''), 4000);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حفظ الحضور الجماعي');
    } finally {
      setBatchSaving(false);
    }
  };

  const filteredList = localAttendance.filter((rec) => {
    if (selectedGroupId && rec.groupId !== selectedGroupId) return false;
    return true;
  });

  const presentCount = filteredList.filter((r) => r.status === 'PRESENT').length;
  const absentCount = filteredList.filter((r) => r.status === 'ABSENT').length;
  const excusedCount = filteredList.filter((r) => r.status === 'EXCUSED').length;

  return (
    <div className="space-y-6">
      {/* Top Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden"
            >
              <option value="">كافة الأقسام</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          {msg && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold animate-pulse">
              {msg}
            </span>
          )}

          <button
            onClick={saveAllBatch}
            disabled={batchSaving || filteredList.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {batchSaving ? 'جاري التحديث...' : 'حفظ الجدول الجماعي كامل'}
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-3 gap-3 max-w-lg">
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-800">الحاضرون</span>
          <span className="text-xl font-black text-emerald-700 tabular-nums">{presentCount}</span>
        </div>
        <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-800">الغائبون</span>
          <span className="text-xl font-black text-rose-700 tabular-nums">{absentCount}</span>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-800">مبرر</span>
          <span className="text-xl font-black text-amber-700 tabular-nums">{excusedCount}</span>
        </div>
      </div>

      {/* Attendance Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">لا يوجد أطفال في هذا القسم أو لهذا اليوم</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3.5 px-4">اسم الطفل</th>
                  <th className="py-3.5 px-3">القسم</th>
                  <th className="py-3.5 px-3">حالة الحضور</th>
                  <th className="py-3.5 px-3">وقت الدخول / الخروج</th>
                  <th className="py-3.5 px-3">المستلم المصرح له</th>
                  <th className="py-3.5 px-3">ملاحظات</th>
                  <th className="py-3.5 px-4 text-center">حفظ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredList.map((rec) => (
                  <tr key={rec.childId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Name */}
                    <td className="py-3 px-4 font-bold text-slate-900">{rec.childName}</td>

                    {/* Group */}
                    <td className="py-3 px-3 text-slate-600">{rec.groupName || 'غير معين'}</td>

                    {/* Status Segmented Buttons */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rec.childId, 'PRESENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            rec.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          حاضر
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rec.childId, 'ABSENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            rec.status === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          غائب
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(rec.childId, 'EXCUSED')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            rec.status === 'EXCUSED'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          مبرر
                        </button>
                      </div>
                    </td>

                    {/* Check In / Check Out Times */}
                    <td className="py-3 px-3">
                      {rec.status === 'PRESENT' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={rec.checkInTime || '08:00'}
                            onChange={(e) => handleFieldChange(rec.childId, 'checkInTime', e.target.value)}
                            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                          />
                          <span className="text-slate-400">←</span>
                          <input
                            type="time"
                            value={rec.checkOutTime || ''}
                            onChange={(e) => handleFieldChange(rec.childId, 'checkOutTime', e.target.value)}
                            placeholder="الخروج"
                            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Pickup Person */}
                    <td className="py-3 px-3">
                      {rec.status === 'PRESENT' ? (
                        <input
                          type="text"
                          value={rec.pickupPerson || ''}
                          onChange={(e) => handleFieldChange(rec.childId, 'pickupPerson', e.target.value)}
                          placeholder="اسم واستلام..."
                          className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        />
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={rec.notes || ''}
                        onChange={(e) => handleFieldChange(rec.childId, 'notes', e.target.value)}
                        placeholder="ملاحظة..."
                        className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </td>

                    {/* Save Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => saveSingle(rec)}
                        disabled={savingId === rec.childId}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                      >
                        {savingId === rec.childId ? 'حفظ...' : 'حفظ'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
