
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslation } from "@/components/utils/translations";
import { 
  BarChart3, 
  DollarSign, 
  Calendar, 
  Users,
  Truck,
  CreditCard,
  TrendingUp,
  Clock
} from "lucide-react";

export default function AdminStats({ reservations, vehicles, users, language }) {
  const { t } = useTranslation(language);

  const totalRevenue = reservations.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
  const pendingPayments = reservations.reduce((sum, r) => sum + (r.total_amount - (r.amount_paid || 0)), 0);
  const todayReservations = reservations.filter(r => {
    const today = new Date().toDateString();
    const reservationDate = new Date(r.start_datetime).toDateString();
    return today === reservationDate;
  }).length;

  const completedReservations = reservations.filter(r => r.status === 'completed').length;
  const inProgressReservations = reservations.filter(r => r.status === 'in_progress').length;
  const availableVehicles = vehicles.filter(v => v.is_available).length;

  const stats = [
    {
      title: language === 'ar' ? 'إجمالي الحجوزات' : language === 'he' ? 'סך הזמנות' : 'Total Reservations',
      value: reservations.length,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: language === 'ar' ? 'حجوزات اليوم' : language === 'he' ? 'הזמנות היום' : "Today's Reservations",
      value: todayReservations,
      icon: Clock,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: language === 'ar' ? 'إجمالي الإيرادات' : language === 'he' ? 'סך הכנסות' : 'Total Revenue',
      value: `${totalRevenue} ${t('currency')}`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: language === 'ar' ? 'المدفوعات المعلقة' : language === 'he' ? 'תשלומים ממתינים' : 'Pending Payments',
      value: `${pendingPayments} ${t('currency')}`,
      icon: CreditCard,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      title: language === 'ar' ? 'قيد التنفيذ' : language === 'he' ? 'בביצוע' : 'In Progress',
      value: inProgressReservations,
      icon: TrendingUp,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      title: language === 'ar' ? 'المركبات المتاحة' : language === 'he' ? 'רכבים זמינים' : 'Available Vehicles',
      value: `${availableVehicles}/${vehicles.length}`,
      icon: Truck,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="card-premium p-6 hover:shadow-premium-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </p>
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500">
                    {language === 'ar' ? 'نشط' : language === 'he' ? 'פעיל' : 'Active'}
                  </span>
                </div>
              </div>
              <div className={`w-16 h-16 ${stat.bgColor} rounded-2xl flex items-center justify-center shadow-premium`}>
                <Icon className={`w-8 h-8 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
