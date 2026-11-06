# ربط Crèche Manager DZ بـ Firebase (Auth + Realtime Database)

تمت ترحيل الواجهة بالكامل من API محلي (Express + ملف JSON) إلى **Firebase Authentication**
و **Firebase Realtime Database** (نسخة `europe-west1`).
سيرفر Express في مجلد `server/` أُبقي عليه **كاحتياط فقط** ولم يعد يُستدعى من الواجهة.

## ⚠️ خطوات مطلوبة في Firebase Console (مرة واحدة)

لن تعمل المنصة قبل تنفيذها:

1. **تفعيل المصادقة**
   - [Firebase Console](https://console.firebase.google.com/project/mlyo-789e7/authentication/providers) →
     `Authentication` → `Sign-in method` → فعّل **Email/Password** → Save.

2. **التأكد من قاعدة Realtime Database**
   - `Realtime Database` — يجب أن توجد النسخة في أوروبا الغربية بالرابط:
     `https://mlyo-789e7-default-rtdb.europe-west1.firebasedatabase.app`
     (مطابق لما هو مضبوط في `src/services/firebase.ts`).
   - إن لم تكن قد أُنشئت بعد: `Create Database` → الموقع **europe-west1** → ابدأ بقواعد مقفلة.

3. **نشر قواعد الأمان**
   - `Realtime Database` → `Rules` → الصق محتوى `database.rules.json` من جذر المستودع → **Publish**.
   - القواعد تعتمد على `/users/{uid}` وفيه `nurseryId` و `role` — لذلك يجب أن يُنشأ كل مستخدم
     مع ملف تعريف في `/users/{uid}` (يتم تلقائياً عبر زر «تهيئة حسابات العرض» أو عبر شاشة الإعدادات).

4. **(موصى به) Analytics** — يعمل تلقائياً بعد أول زيارة في متصفح حقيقي؛ يمكن تجاهله.

## أول تشغيل — تهيئة حسابات العرض

قاعدة البيانات **فارغة عمداً** (لا بيانات أطفال ولا أولياء). لتفعيل الدخول لأول مرة:

1. افتح المنصة (`http://localhost:3000` أو رابط المعاينة).
2. في شاشة الدخول اضغط **«تهيئة حسابات العرض في Firebase (أول مرة فقط)»**.
3. سيُنشئ النظام 3 حسابات في Firebase Auth + ملفاتها في `/users/{uid}`:

   | البريد | الدور | كلمة المرور |
   |---|---|---|
   | `admin@creche.dz` | مدير (ADMIN) | `Creche@2026` |
   | `educator@creche.dz` | مربية (EDUCATOR) | `Creche@2026` |
   | `accountant@creche.dz` | محاسب (ACCOUNTANT) | `Creche@2026` |

4. سجّل الدخول بـ `admin@creche.dz` / `Creche@2026` ثم **غيّر كلمات المرور فوراً**
   (من Firebase Console → Authentication أو عبر إنشاء حسابات جديدة من الإعدادات).

> ملاحظة: `ALL` عمليات الكتابة/القراءة تمر بقواعد `database.rules.json` — بدون نشرها ستظهر أخطاء
> `PERMISSION_DENIED` عند أي عملية.

## كيف تعمل المزامنة اللحظية (Realtime)

- بعد تسجيل الدخول تشترك الواجهة عبر `onValue` في عقد الحضانة:
  `children`, `parents`, `attendance`, `groups`, `payments`, `expenses`, `employees`, `salaryPayments`.
- أي تعديل من أي جهاز/علامة تبويب ينعكس تلقائياً في الجميع خلال أقل من ثانية (بدون زر تحديث).
- مؤشر **«مزامنة لحظية»** أعلى اليمين (نقطة خضراء نابضة) يعكس حالة اتصال Firebase (`.info/connected`).

## إنشاء المستخدمين الجدد (شاشة الإعدادات → المستخدمون)

- يُنشأ حساب Firebase Auth بكلمة مرور مؤقتة (يظهر بعد الإنشاء) **دون إخراج المدير الحالي من جلسته**
  (يُستخدم تطبيق Firebase ثانٍ داخلياً).
- يُكتب ملف التعريف في `/users/{uid}` بالدور المختار (EDUCATOR / ACCOUNTANT / ADMIN).
- عند حذف مستخدم من الإعدادات تُزال ملفاته من RTDB؛ **حساب Firebase Auth نفسه** يُحذف يدوياً
  من `Authentication → Users` في الكونسول (لا يمكن حذفه من العميل).

## النسخ الاحتياطي والاستعادة

- من **الإعدادات → النسخة الاحتياطية**: زر التنزيل يقرأ كامل عقد الحضانة من RTDB ويولّد JSON.
- زر الاستيراد يستبدل العقد في RTDB بالمفتاح `nurseryId` الخاصة بالحضانة الحالية.

## الصلاحيات (RBAC)

| العقدة | قراءة | كتابة |
|---|---|---|
| children / parents | أي مستخدم مسجل | ADMIN + ACCOUNTANT (حذف الولي: ADMIN فقط) |
| attendance | أي مستخدم مسجل | أي مستخدم مسجل |
| groups | أي مستخدم مسجل | ADMIN |
| payments / subscriptions / expenses / salaryPayments | ADMIN + ACCOUNTANT | ADMIN + ACCOUNTANT (حذف مصروف: ADMIN) |
| employees | ADMIN + ACCOUNTANT | ADMIN |
| auditLogs | ADMIN | أي مستخدم مسجل |
| users | مسجل | النفس، أو ADMIN |

نفس القواعد تُطبَّق في الواجهة (للتجربة السلسة) وتفرضها قاعدة البيانات (للحماية الفعلية).
المربية (EDUCATOR) ترى أطفال قسمها فقط (`assignedGroupId`) ولا ترى المالية إطلاقاً.

## الأمان

- `apiKey` الخاص بـ Firebase Web **عام بطبيعته** وليس سراً؛ الحماية تعتمد على:
  Firebase Auth + `database.rules.json`. لا تجعل القواعد `.read/.write: true` في الإنتاج.
- لا تضع Service Account أو مفاتيح Admin SDK داخل هذا المستودع.
- غيّر كلمات مرور حسابات العرض الافتراضية بعد أول دخول.

## التراجع إلى Express (احتياط)

سيرفر Express والـ JSON file لم يُمسّا (ما عدا esbuild في package.json):

```bash
git show HEAD~1:src/services/api.ts > src/services/api.ts   # استرجاع طبقة الـ API القديمة
```

ثم أعد تشغيل `npm run dev` — ستعود الواجهة تستعمل `/api/*` وقاعدة `server/data/db.json`.

## ملاحظات تقنية

- `databaseURL` مضبوط على `europe-west1` — إن كانت نسختك في `us-central1` غيّر الرابط في
  `src/services/firebase.ts` إلى `https://mlyo-789e7-default-rtdb.firebaseio.com`.
- المصادقة تبدأ بجلسة `browserLocalPersistence` — يبقى المستخدم مسجلاً بعد إغلاق المتصفح.
- آخر تسجيل دخول + كل العمليات المهمة تُسجَّل في `/auditLogs/{nurseryId}` (مرئية للمدير فقط).
