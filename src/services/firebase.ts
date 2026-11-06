/**
 * Firebase client — Crèche Manager DZ
 *
 * الوضع الحالي: دخول مباشر بدون كلمة مرور (بطلب المستخدم).
 * الواجهة تعمل بدون Firebase Auth وتقرأ/تكتب Realtime Database مباشرة.
 * لهذا يجب أن تكون قواعد RTDB منشورة بنسخة database.rules.json المفتوحة.
 *
 * ⚠️ تجعل هذه النسخة القاعدة مفتوحة للقراءة والكتابة للجميع —
 * راجع FIREBASE_SETUP.md قبل نشر المنصة على الإنترنت.
 */
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// إعدادات Firebase Web (mlyo-789e7) — عامة بطبيعتها وليست سراً
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

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const database = getDatabase(firebaseApp);

// Analytics تعمل عبر مقتطف CDN في index.html (كما في مقتطف Firebase Console) —
// لا نهيئها هنا حتى لا تُحتسب مشاهدات الصفحة مرتين.
