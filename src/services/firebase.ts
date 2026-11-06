/**
 * Firebase client initialization — Crèche Manager DZ
 *
 * ملاحظة أمنية مهمة:
 * إعدادات Firebase Web (apiKey …) ليست أسراراً ولا تُخفى — هي معرّف عام للمشروع
 * ومضمّنة عمداً في كود الواجهة. الحماية الحقيقية تتم عبر:
 *   1. Firebase Authentication (كل عملية تتطلب مستخدم مسجل الدخول)
 *   2. Realtime Database Security Rules (ملف database.rules.json في المستودع)
 *
 * يجب نشر database.rules.json في مشروع mlyo-789e7 قبل الاستعمال.
 */
import { initializeApp, getApp, getApps } from 'firebase/app';
import {
  getAuth,
  browserLocalPersistence,
  setPersistence
} from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

// Your web app's Firebase configuration (mlyo-789e7)
const firebaseConfig = {
  apiKey: 'AIzaSyB43Vf3yfvGC81sqqQNabYeiMNLeyq-3co',
  authDomain: 'mlyo-789e7.firebaseapp.com',
  // نسخة أوروبا الغربية (بلجيكا) من Realtime Database
  databaseURL: 'https://mlyo-789e7-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'mlyo-789e7',
  storageBucket: 'mlyo-789e7.firebasestorage.app',
  messagingSenderId: '575599721753',
  appId: '1:575599721753:web:d2faa0516dccae463c9988',
  measurementId: 'G-DVBFRT259L'
};

// تطبيق أساسي للاستعمال داخل كامل الواجهة
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// تطبيق ثانوي — يُستعمل فقط لإنشاء حسابات مستخدمين جدد (من شاشة الإعدادات)
// دون تسجيل خروج المدير الحالي من جلسته.
export const secondaryFirebaseApp =
  getApps().find((a) => a.name === 'secondary-user-factory') ??
  initializeApp(firebaseConfig, 'secondary-user-factory');

export const auth = getAuth(firebaseApp);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('تعذر تفعيل حفظ جلسة Firebase:', err);
});

export const secondaryAuth = getAuth(secondaryFirebaseApp);

export const database = getDatabase(firebaseApp);

// Analytics — لا تعمل إلا في المتصفح ومع دعم كامل (تتجاهل أي فشل بصمت)
export const analyticsReady: Promise<Analytics | null> =
  typeof window !== 'undefined'
    ? isSupported()
        .then((ok) => (ok ? getAnalytics(firebaseApp) : null))
        .catch(() => null)
    : Promise.resolve(null);

export const DEMO_ACCOUNTS: Array<{
  email: string;
  name: string;
  role: 'ADMIN' | 'EDUCATOR' | 'ACCOUNTANT';
  assignedGroupId?: string;
  phone: string;
}> = [
  {
    email: 'admin@creche.dz',
    name: 'أحمد بن علي (المدير)',
    role: 'ADMIN',
    phone: '0550123456'
  },
  {
    email: 'educator@creche.dz',
    name: 'مريم حداد (مربية)',
    role: 'EDUCATOR',
    phone: '0661234567'
  },
  {
    email: 'accountant@creche.dz',
    name: 'كريم براهيمي (محاسب)',
    role: 'ACCOUNTANT',
    phone: '0770345678'
  }
];

/** كلمة المرور الافتراضية لحسابات العرض التجريبية — يجب تغييرها بعد أول دخول */
export const DEMO_PASSWORD = 'Creche@2026';
