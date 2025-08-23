import React, { useState } from 'react';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import PhoneInput from '@/components/ui/phone-input';
import { X, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/api/firebase.js";

export default function AuthModal({ isOpen, onClose, language = 'ar' }) {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('+972');
  const [name, setName] = useState('');
  const { toast } = useToast();

  const translations = {
    ar: {
      welcome: 'مرحباً بك في تندرو',
      welcomeBack: 'مرحباً بعودتك',
      subtitle: 'خدمة التوصيل الموثوقة',
      loginDesc: 'أدخل رقم هاتفك للمتابعة',
      signupDesc: 'أدخل بياناتك لإنشاء حساب جديد',
      fullName: 'الاسم الكامل',
      phoneNumber: 'رقم الهاتف',
      phonePlaceholder: '50-123-4567',
      namePlaceholder: 'أدخل اسمك الكامل',
      loginButton: 'دخول',
      signupButton: 'إنشاء حساب',
      switchToSignup: 'ليس لديك حساب؟ إنشاء حساب',
      switchToLogin: 'لديك حساب؟ تسجيل الدخول',
      phoneRequired: 'رقم الهاتف مطلوب',
          phoneInvalid: 'رقم الهاتف يجب أن يبدأ بـ 05 ويكون 10 أرقام', // ADD THIS

      nameRequired: 'الاسم الكامل مطلوب',
      userNotFound: 'المستخدم غير موجود. يرجى إنشاء حساب جديد.',
      userExists: 'يوجد مستخدم بهذا الرقم مسبقاً.',
      loginSuccess: 'تم تسجيل الدخول بنجاح!',
      signupSuccess: 'تم إنشاء الحساب بنجاح!',
      error: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
      processing: 'جاري المعالجة...'
    },
    he: {
      welcome: 'ברוכים הבאים לטנדרו',
      welcomeBack: 'ברוכים השבים',
      subtitle: 'שירות המשלוחים האמין',
      loginDesc: 'הכנס את מספר הטלפון שלך',
      signupDesc: 'הכנס את הפרטים שלך',
      fullName: 'שם מלא',
      phoneNumber: 'מספר טלפון',
      phonePlaceholder: '50-123-4567',
      namePlaceholder: 'הכנס את שמך המלא',
      loginButton: 'התחבר',
      signupButton: 'צור חשבון',
      switchToSignup: 'אין לך חשבון? הרשמה',
      switchToLogin: 'יש לך חשבון? התחברות',
      phoneRequired: 'מספר טלפון נדרש',
          phoneInvalid: 'מספר הטלפון חייב להתחיל ב-05 ולהיות 10 ספרות', // ADD THIS

      nameRequired: 'שם מלא נדרש',
      userNotFound: 'משתמש לא נמצא. אנא צור חשבון חדש.',
      userExists: 'משתמש עם מספר זה כבר קיים.',
      loginSuccess: 'התחברות הצליחה!',
      signupSuccess: 'החשבון נוצר בהצלחה!',
      error: 'אירעה שגיאה. אנא נסה שוב.',
      processing: 'מעבד...'
    },
    en: {
      welcome: 'Welcome to Tandaro',
      welcomeBack: 'Welcome Back',
      subtitle: 'Reliable Delivery Service',
      loginDesc: 'Enter your phone number to continue',
      signupDesc: 'Enter your details to get started',
      fullName: 'Full Name',
      phoneNumber: 'Phone Number',
      phonePlaceholder: '50-123-4567',
      namePlaceholder: 'Enter your full name',
      loginButton: 'Login',
      signupButton: 'Create Account',
      switchToSignup: 'Don\'t have an account? Sign up',
      switchToLogin: 'Have an account? Login',
      phoneRequired: 'Phone number is required',
          phoneInvalid: 'Phone number must start with 05 and be 10 digits', // ADD THIS

      nameRequired: 'Full name is required',
      userNotFound: 'User not found. Please create a new account.',
      userExists: 'User with this phone number already exists.',
      loginSuccess: 'Login successful!',
      signupSuccess: 'Account created successfully!',
      error: 'An error occurred. Please try again.',
      processing: 'Processing...'
    }
  };

  const t = translations[language] || translations.en;
  const isRTL = language === 'ar' || language === 'he';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Phone validation
let cleanPhone = phone.replace(/[^0-9]/g, ''); // Remove non-digits

// Handle Israeli format
if (cleanPhone.startsWith('972')) {
  cleanPhone = cleanPhone.substring(3); // Remove country code
}
if (cleanPhone.startsWith('0')) {
  cleanPhone = cleanPhone.substring(1); // Remove leading 0
}

// Validate format: must be 9 digits starting with 5
if (cleanPhone.length !== 9 || !cleanPhone.startsWith('5')) {
  toast({
    title: t.phoneInvalid,
    variant: "destructive",
  });
  return;
}

const finalPhone = `+972${cleanPhone}`;

    if (!isLogin && !name.trim()) {
      toast({
        title: t.nameRequired,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const snapshot = await getDocs(collection(db, "users"));
const existing = snapshot.docs.find(doc => doc.data().phone === finalPhone);

      if (isLogin) {
        if (existing) {
          const user = { id: existing.id, ...existing.data() };
          localStorage.setItem("currentUser", JSON.stringify(user));
          toast({
            title: t.loginSuccess,
            variant: "default",
          });
          onClose();
          window.location.reload();
        } else {
          toast({
            title: t.userNotFound,
            variant: "destructive",
          });
          setIsLogin(false);
        }
      } else {
        if (existing) {
          toast({
            title: t.userExists,
            variant: "destructive",
          });
          setIsLogin(true);
        } else {
          const docRef = await addDoc(collection(db, "users"), {
            full_name: name.trim(),
phone: finalPhone,
            created_at: new Date().toISOString(),
            is_admin: false
          });

          const user = {
            id: docRef.id,
            full_name: name.trim(),
phone: finalPhone,
            created_at: new Date().toISOString(),
            is_admin: false
          };

          localStorage.setItem("currentUser", JSON.stringify(user));
          toast({
            title: t.signupSuccess,
            variant: "default",
          });
          onClose();
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        title: t.error,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300"
        dir={isRTL ? 'ltr' : 'ltr'}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Tandaro colors */}
        <div className="relative px-8 pt-12 pb-8 bg-gradient-to-br from-red-500 via-red-500 to-orange-400">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                           <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2efdb0e4f_image.png"
                alt="Tandaro"
                className="w-12 h-12 object-contain filter brightness-0 invert"
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {isLogin ? t.welcomeBack : t.welcome}
            </h2>
            <p className="text-white/90 text-sm">
              {t.subtitle}
            </p>
            <p className="text-white/80 text-xs mt-1">
              {isLogin ? t.loginDesc : t.signupDesc}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name field for signup */}
            {!isLogin && (
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-red-500" />
                  {t.fullName}
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.namePlaceholder}
                  className="rounded-2xl border-gray-200 focus-visible:ring-red-500 focus-visible:border-red-500 py-6 text-lg"
                  disabled={loading}
                />
              </div>
            )}

            {/* Phone field */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <div className="w-4 h-4 text-red-500">📱</div>
                {t.phoneNumber}
              </label>
              <PhoneInput
                value={phone}
                onChange={setPhone}
                placeholder={t.phonePlaceholder}
                disabled={loading}
                language={language}
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 via-red-500 to-orange-400 hover:from-red-600 hover:via-red-600 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.processing}
                </>
              ) : (
                <>
                  {isLogin ? t.loginButton : t.signupButton}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setName('');
                setPhone('+972');
              }}
              className="text-gray-600 hover:text-red-600 font-medium transition-colors duration-200 text-sm"
            >
              {isLogin ? t.switchToSignup : t.switchToLogin}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}