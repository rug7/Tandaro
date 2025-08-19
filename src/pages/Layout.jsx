import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import AuthModal from '@/components/auth/AuthModal';
import { Toaster } from "@/components/ui/toaster";

import { useTranslation, getDirection } from "@/components/utils/translations";
import { 
  Menu, 
  X, 
  LogOut, 
  Calendar, 
  Settings,
  Globe,
  Truck,
  Shield,
  Users, // Added Users icon for driver management
  LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import FeedbackSection from "./FeedbackSection";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState('ar');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation(language);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      if (userData && userData.preferred_language) {
        setLanguage(userData.preferred_language);
      }
    } catch (error) {
      console.log('User not authenticated');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      toast({
        title: language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 
              language === 'he' ? 'התנתקת בהצלחה' : 
              'Logged out successfully',
        variant: "default",
      });
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ في تسجيل الخروج' : 
              language === 'he' ? 'שגיאה בהתנתקות' : 
              'Logout error',
        variant: "destructive",
      });
    }
  };

  const switchLanguage = async (newLang) => {
    setLanguage(newLang);
    if (user) {
      try {
        await User.updateMyUserData({ preferred_language: newLang });
      } catch (error) {
        console.error("Failed to update language preference:", error);
      }
    }
    document.documentElement.dir = getDirection(newLang);
    localStorage.setItem('preferred_language', newLang);
    window.location.reload();
  };

  // Load language preference on startup
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred_language');
    if (savedLanguage && savedLanguage !== language) {
      setLanguage(savedLanguage);
      document.documentElement.dir = getDirection(savedLanguage);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">
            {language === 'ar' ? 'جاري التحميل...' : language === 'he' ? 'טוען...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir={getDirection(language)}>
      <style>{`
        :root {
          --primary: #EF4444;
          --primary-dark: #DC2626;
          --secondary: #1F2937;
          --accent: #F59E0B;
          --success: #10B981;
          --background: #FAFBFC;
          --surface: #FFFFFF;
          --border: #E5E7EB;
        }
        
        body {
          font-family: 'Inter', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', sans-serif;
          line-height: 1.6;
        }
        
        .gradient-red {
          background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
        }
        
        .gradient-tandaro {
          background: linear-gradient(135deg, #EF4444 0%, #F59E0B 100%);
        }
        
        .shadow-premium {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        
        .shadow-premium-lg {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        .card-premium {
          background: var(--surface);
          border-radius: 16px;
          border: 1px solid var(--border);
          transition: all 0.3s ease;
        }
        
        .card-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        /* RTL support */
        [dir="rtl"] .space-x-reverse > * + * {
          margin-right: 1rem;
          margin-left: 0;
        }
        
        [dir="rtl"] .text-left {
          text-align: right;
        }
        
        [dir="rtl"] .text-right {
          text-align: left;
        }
      `}</style>

      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 round">
            {/* Logo */}
            <Link to={user ? createPageUrl("Booking") : "/"} className="flex items-center space-x-3 rtl:space-x-reverse">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2efdb0e4f_image.png"
                alt="Tandaro"
                className="h-12 w-auto"
              />
            </Link>

            {/* Desktop Navigation */}
            {user && (
              <nav className="hidden lg:flex items-center space-x-8 rtl:space-x-reverse">
                <Link 
                  to={createPageUrl("Booking")}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    currentPageName === 'Booking' 
                      ? 'text-red-600 bg-red-50 shadow-premium' 
                      : 'text-gray-600 hover:text-red-500 hover:bg-gray-50'
                  }`}
                >
                  {language === 'ar' ? 'حجز جديد' : language === 'he' ? 'הזמנה חדשה' : 'New Booking'}
                </Link>
                <Link 
                  to={createPageUrl("MyReservations")}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    currentPageName === 'MyReservations' 
                      ? 'text-red-600 bg-red-50 shadow-premium' 
                      : 'text-gray-600 hover:text-red-500 hover:bg-gray-50'
                  }`}
                >
                  {language === 'ar' ? 'حجوزاتي' : language === 'he' ? 'ההזמנות שלי' : 'My Reservations'}
                </Link>
                
                {/* Driver Jobs Link - NEW */}
                {user?.role === 'driver' && (
                  <Link
                    to={createPageUrl("DriverJobs")}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 rtl:space-x-reverse ${
                      currentPageName === 'DriverJobs'
                        ? 'text-red-600 bg-red-50 shadow-premium'
                        : 'text-gray-600 hover:text-red-500 hover:bg-gray-50'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>{language === 'ar' ? 'وظائفي' : language === 'he' ? 'העבודות שלי' : 'My Jobs'}</span>
                  </Link>
                )}
                
                {/* Admin Links - UPDATED */}
                {user?.is_admin && (
                  <>
                    <Link 
                      to={createPageUrl("AdminDashboard")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 rtl:space-x-reverse ${
                        currentPageName === 'AdminDashboard' 
                          ? 'text-red-600 bg-red-50 shadow-premium' 
                          : 'text-gray-600 hover:text-red-500 hover:bg-gray-50'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      <span>{language === 'ar' ? 'لوحة الإدارة' : language === 'he' ? 'פאנל ניהול' : 'Admin Dashboard'}</span>
                    </Link>
                    
                    {/* Admin Driver Panel Link - NEW */}
                    <Link
                      to={createPageUrl("AdminDriverPanel")}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center space-x-2 rtl:space-x-reverse ${
                        currentPageName === 'AdminDriverPanel'
                          ? 'text-red-600 bg-red-50 shadow-premium'
                          : 'text-gray-600 hover:text-red-500 hover:bg-gray-50'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>{language === 'ar' ? 'إدارة السائقين' : language === 'he' ? 'ניהול נהגים' : 'Driver Management'}</span>
                    </Link>
                  </>
                )}
              </nav>
            )}

            {/* Right Side Controls */}
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2.5 hover:bg-gray-100 rounded-xl">
                    <Globe className="h-5 w-5 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 rounded-xl">
                  <DropdownMenuItem 
                    onClick={() => switchLanguage('ar')} 
                    className={`flex items-center justify-center rounded-lg ${language === 'ar' ? 'bg-red-50 text-red-600' : ''}`}
                  >
                    العربية
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => switchLanguage('he')} 
                    className={`flex items-center justify-center rounded-lg ${language === 'he' ? 'bg-red-50 text-red-600' : ''}`}
                  >
                    עברית
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => switchLanguage('en')} 
                    className={`flex items-center justify-center rounded-lg ${language === 'en' ? 'bg-red-50 text-red-600' : ''}`}
                  >
                    English
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu or Login */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-3 rtl:space-x-reverse px-3 py-2 rounded-xl hover:bg-gray-100">
                      <div className="w-10 h-10 gradient-tandaro rounded-full flex items-center justify-center shadow-premium">
                        <span className="text-white text-sm font-bold">
                          {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="hidden md:block text-left rtl:text-right">
                        <p className="text-sm font-semibold text-gray-900">{user?.full_name}</p>
                        <p className="text-xs text-gray-500">
                          {user?.is_admin 
                            ? (language === 'ar' ? 'مدير' : language === 'he' ? 'מנהל' : 'Admin')
                            : (language === 'ar' ? 'مستخدم' : language === 'he' ? 'משתמש' : 'User')
                          }
                        </p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <LogOut className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                      {language === 'ar' ? 'تسجيل الخروج' : language === 'he' ? 'התנתקות' : 'Logout'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={handleLogin} 
                  className="gradient-tandaro text-white hover:opacity-90 rounded-xl px-6 py-2.5 font-semibold shadow-premium flex items-center space-x-2 rtl:space-x-reverse"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تسجيل الدخول' : language === 'he' ? 'התחברות' : 'Login'}</span>
                </Button>
              )}

              {/* Mobile Menu Button */}
              {user && (
                <Button
                  variant="ghost"
                  className="lg:hidden p-2.5 hover:bg-gray-100 rounded-xl"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-4 py-4 space-y-2">
              <Link 
                to={createPageUrl("Booking")}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {language === 'ar' ? 'حجز جديد' : language === 'he' ? 'הזמנה חדשה' : 'New Booking'}
              </Link>
              <Link 
                to={createPageUrl("MyReservations")}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {language === 'ar' ? 'حجوزاتي' : language === 'he' ? 'ההזמנות שלי' : 'My Reservations'}
              </Link>
              
              {/* Driver Jobs Mobile Link - NEW */}
              {user?.role === 'driver' && (
                <Link
                  to={createPageUrl("DriverJobs")}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Truck className="w-4 h-4" />
                    <span>{language === 'ar' ? 'وظائفي' : language === 'he' ? 'העבודות שלי' : 'My Jobs'}</span>
                  </div>
                </Link>
              )}
              
              {/* Admin Mobile Links - UPDATED */}
              {user?.is_admin && (
                <>
                  <Link 
                    to={createPageUrl("AdminDashboard")}
                    className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Shield className="w-4 h-4" />
                      <span>{language === 'ar' ? 'لوحة الإدارة' : language === 'he' ? 'פאנל ניהול' : 'Admin Dashboard'}</span>
                    </div>
                  </Link>
                  
                  {/* Admin Driver Panel Mobile Link - NEW */}
                  <Link
                    to={createPageUrl("AdminDriverPanel")}
                    className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Users className="w-4 h-4" />
                      <span>{language === 'ar' ? 'إدارة السائقين' : language === 'he' ? 'ניהול נהגים' : 'Driver Management'}</span>
                    </div>
                  </Link>
                </>
              )}
              
              {/* Mobile Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {language === 'ar' ? 'تسجيل الخروج' : language === 'he' ? 'התנתקות' : 'Logout'}
              </button>
            </div>
          </div>
        )}
      </header>

{/* Welcome Page for Non-Authenticated Users */}
{!user ? (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
    {/* ULTRA MODERN Background System with Visible Logos */}
    <div className="absolute inset-0 pointer-events-none">
      {/* Modern Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50/30 to-orange-50/20" />
      <div className="absolute inset-0 bg-gradient-to-tl from-purple-50/20 via-transparent to-green-50/15" />
      
      {/* VISIBLE Large Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-[120vw] h-[120vh] opacity-[0.08] animate-logo-breathe-modern"
          style={{
            backgroundImage: `url(https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2efdb0e4f_image.png)`,
            backgroundSize: '60vw auto',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            filter: 'grayscale(70%) contrast(1.2) brightness(1.1)'
          }}
        />
      </div>
      
      {/* VISIBLE Floating Logo Elements - Modern Layout */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="absolute animate-modern-float opacity-[0.12]"
            style={{
              left: `${8 + (i * 6)}%`,
              top: `${12 + ((i % 5) * 16)}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${12 + (i % 4) * 3}s`
            }}
          >
            {/* <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2efdb0e4f_image.png" 
              alt="" 
              className="object-contain filter grayscale-60 brightness-110 contrast-105"
              style={{
                width: `${20 + (i % 3) * 8}px`,
                height: `${20 + (i % 3) * 8}px`,
                transform: `rotate(${i * 12}deg)`
              }}
            /> */}
            <img 
              src="6e2d2f5b-7eed-41c1-89c3-687c7f4f2608.jpeg" 
              alt="" 
              className="object-contain filter grayscale-60 brightness-110 contrast-105"
              style={{
                width: `${40 + (i % 3) * 8}px`,
                height: `${40 + (i % 3) * 8}px`,
                transform: `rotate(${i * 12}deg)`
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Modern Geometric Shapes */}
      <div className="absolute inset-0">
        <div className="absolute top-1/5 left-1/12 w-48 h-48 bg-gradient-to-br from-red-200/15 to-orange-300/20 rounded-full blur-3xl animate-modern-shape-1" />
        <div className="absolute top-1/4 right-1/8 w-40 h-40 bg-gradient-to-br from-blue-200/12 to-purple-300/18 rounded-3xl rotate-45 blur-2xl animate-modern-shape-2" />
        <div className="absolute bottom-1/3 left-1/6 w-44 h-44 bg-gradient-to-br from-green-200/10 to-teal-300/15 rounded-full blur-2xl animate-modern-shape-3" />
        <div className="absolute bottom-1/5 right-1/5 w-36 h-36 bg-gradient-to-br from-purple-200/8 to-pink-300/12 rounded-2xl rotate-12 blur-xl animate-modern-shape-4" />
      </div>
      
      {/* Modern Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Floating Particles - More Visible */}
      {Array.from({ length: 25 }, (_, i) => (
        <div
          key={i}
          className="absolute animate-particle-modern opacity-30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 15}s`,
            animationDuration: `${8 + Math.random() * 12}s`
          }}
        >
          <div className={`w-1 h-1 rounded-full ${
            i % 4 === 0 ? 'bg-red-400/40' :
            i % 4 === 1 ? 'bg-blue-400/40' :
            i % 4 === 2 ? 'bg-green-400/40' : 'bg-purple-400/40'
          }`} />
        </div>
      ))}
    </div>

    {/* Clean Main Content - Fixed Structure */}
    <div className="flex-1 flex items-center justify-center p-4 relative z-10">
      <div className="text-center max-w-5xl mx-auto">
        <div className="mb-16 relative">
          {/* Modern Logo Container */}
          <div className="relative inline-block mb-12 group">
            <div className="absolute -inset-6 bg-white/20 rounded-3xl blur-2xl group-hover:bg-white/30 transition-all duration-700" />
            <div className="relative bg-white/70 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/50 group-hover:shadow-3xl transition-all duration-500">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/2efdb0e4f_image.png"
                alt="Tandaro"
                className="h-32 w-auto mx-auto drop-shadow-xl group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
          
          {/* Modern Typography */}
          <div className="space-y-6">
            <h1 className="text-6xl lg:text-7xl font-bold text-slate-900 mb-8 leading-tight">
              {language === 'ar' ? 'مرحباً بك في تندرو' : language === 'he' ? 'ברוכים הבאים לטנדרו' : 'Welcome to Tandaro'}
            </h1>
            
            <div className="bg-white/60 backdrop-blur-md rounded-2xl px-8 py-6 shadow-xl border border-white/50">
              <span className="text-xl text-slate-700 leading-relaxed font-medium">
                {language === 'ar' ? 'خدمة توصيل موثوقة داخل القدس وضواحيها' : 
                 language === 'he' ? 'שירות משלוחים אמין בירושלים והסביבה' : 
                 'Reliable delivery service in Jerusalem and surroundings'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Modern Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Truck,
              color: 'red',
              title: language === 'ar' ? 'مركبات متنوعة' : language === 'he' ? 'רכבים מגוונים' : 'Various Vehicles',
              desc: language === 'ar' ? 'بيك أب، شاحنات صغيرة وكبيرة لجميع احتياجاتك' : 
                    language === 'he' ? 'טנדרים, משאיות קטנות וגדולות לכל הצרכים' : 
                    'Pickup trucks, small and large trucks for all your needs'
            },
            {
              icon: Calendar,
              color: 'green',
              title: language === 'ar' ? 'حجز سهل وسريع' : language === 'he' ? 'הזמנה קלה ומהירה' : 'Easy & Fast Booking',
              desc: language === 'ar' ? 'احجز بسهولة واختر الوقت المناسب لك' : 
                    language === 'he' ? 'הזמן בקלות ובחר את הזמן הנוח לך' : 
                    'Book easily and choose the convenient time for you'
            },
            {
              icon: Settings,
              color: 'dark',
              title: language === 'ar' ? 'خدمة موثوقة' : language === 'he' ? 'שירות אמין' : 'Reliable Service',
              desc: language === 'ar' ? 'مواعيد دقيقة وأسعار واضحة وشفافة' : 
                    language === 'he' ? 'זמנים מדויקים ומחירים ברורים ושקופים' : 
                    'Precise timing and clear, transparent prices'
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white/60 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/50 hover:bg-white/70 hover:shadow-2xl transition-all duration-300 group">
              <div className={`w-16 h-16 bg-${feature.color}-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                {feature.title}
              </h3>
              <div className="text-slate-600 leading-relaxed">
                {feature.desc}
              </div>
            </div>
          ))}
        </div>
        
        {/* Simple, Clean CTA - Unchanged */}
        <div className="space-y-6">
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="bg-red-500 hover:bg-red-600 text-white px-12 py-4 text-xl font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <LogIn className="w-6 h-6 mr-3 rtl:ml-3 rtl:mr-0" />
            {language === 'ar' ? 'ابدأ الآن' : language === 'he' ? 'התחל עכשיו' : 'Get Started'}
          </Button>
          
          <div className="bg-white/50 backdrop-blur-md rounded-xl px-6 py-3 inline-block shadow-md border border-white/50">
            <div className="text-slate-600 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>
                {language === 'ar' ? 'للمساعدة واتساب: 0539364800' : 
                 language === 'he' ? 'לעזרה בוואטסאפ: 0539364800' : 
                 'Help via WhatsApp: 0539364800'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="relative z-10">
      <FeedbackSection language={language} />
    </div>
  </div>
) : (
        /* Main Content for Authenticated Users */
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      )}
      
      {/* Modals and Toast */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        language={language} 
      />
      <Toaster />
    </div>
  );
}