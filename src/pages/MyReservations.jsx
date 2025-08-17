import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Reservation } from "@/api/entities";
import { Vehicle } from "@/api/entities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Truck, 
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Filter,
  ChevronDown,
  X
} from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, isThisMonth } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTranslation, getDirection } from "@/components/utils/translations";

const statusColors = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  in_progress: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  completed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' }
};

const paymentStatusColors = {
  unpaid: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
};

export default function MyReservations() {
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('ar');
  const [reservations, setReservations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const { t } = useTranslation(language);
  const direction = getDirection(language);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!reservations) return;
    
    let filtered = [...reservations];
    
    // Filter by date
    if (dateFilter !== 'all') {
      filtered = filtered.filter(res => {
        const reservationDate = new Date(res.start_datetime);
        
        switch (dateFilter) {
          case 'today':
            return isToday(reservationDate);
          case 'tomorrow':
            return isTomorrow(reservationDate);
          case 'this_week':
            return isThisWeek(reservationDate);
          case 'this_month':
            return isThisMonth(reservationDate);
          default:
            return true;
        }
      });
    }
    
    // Sort by newest first
    filtered.sort((a, b) => {
      const dateA = new Date(a.start_datetime);
      const dateB = new Date(b.start_datetime);
      return dateB - dateA;
    });
    
    setFilteredReservations(filtered);
  }, [reservations, dateFilter]);

  // Add these to your translations file
  const dateFilterLabels = {
    all: { ar: 'الكل', he: 'הכל', en: 'All' },
    today: { ar: 'اليوم', he: 'היום', en: 'Today' },
    tomorrow: { ar: 'غداً', he: 'מחר', en: 'Tomorrow' },
    this_week: { ar: 'هذا الأسبوع', he: 'השבוע', en: 'This Week' },
    this_month: { ar: 'هذا الشهر', he: 'החודש', en: 'This Month' }
  };

  const FilterButton = () => {
    const hasActiveFilter = dateFilter !== 'all';
    
    return (
      <div className="relative">
        <Button
          onClick={() => setShowFilters(!showFilters)}
          variant="outline"
          className={`
            flex items-center gap-2 rounded-full border-2 transition-all
            ${hasActiveFilter 
              ? 'border-red-500 bg-red-50 text-red-700' 
              : 'border-slate-200 hover:border-slate-300'
            }
          `}
        >
          <Filter className="w-4 h-4" />
          <span>
            {language === 'ar' ? 'فلترة' : 
             language === 'he' ? 'סינון' : 
             'Filter'}
          </span>
          {hasActiveFilter && (
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </Button>

        {/* Filter Dropdown */}
        {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 z-50 min-w-[300px]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {language === 'ar' ? 'فلترة حسب التاريخ' : 
                   language === 'he' ? 'סינון לפי תאריך' : 
                   'Filter by Date'}
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {[
                  { id: 'all', count: reservations.length },
                  { id: 'today', count: reservations.filter(r => isToday(new Date(r.start_datetime))).length },
                  { id: 'tomorrow', count: reservations.filter(r => isTomorrow(new Date(r.start_datetime))).length },
                  { id: 'this_week', count: reservations.filter(r => isThisWeek(new Date(r.start_datetime))).length },
                  { id: 'this_month', count: reservations.filter(r => isThisMonth(new Date(r.start_datetime))).length }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => {
                      setDateFilter(filter.id);
                      setShowFilters(false);
                    }}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg text-right rtl:text-right ltr:text-left
                      transition-all hover:bg-slate-50
                      ${dateFilter === filter.id
                        ? 'bg-red-50 border-2 border-red-500 text-red-700'
                        : 'border-2 border-transparent'
                      }
                    `}
                  >
                    <span className="font-medium">
                      {dateFilterLabels[filter.id][language]}
                    </span>
                    {filter.count > 0 && (
                      <span className={`
                        px-2 py-1 rounded-full text-xs font-semibold
                        ${dateFilter === filter.id
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                        }
                      `}>
                        {filter.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Clear Filter */}
              {dateFilter !== 'all' && (
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setDateFilter('all');
                      setShowFilters(false);
                    }}
                    className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium"
                  >
                    {language === 'ar' ? 'مسح الفلتر' : 
                     language === 'he' ? 'נקה מסנן' : 
                     'Clear Filter'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const loadData = async () => {
    try {
      const userData = await User.me();
      if (!userData) {
        console.error('No user data found');
        setIsLoading(false);
        return;
      }
      
      setUser(userData);
      setLanguage(userData.preferred_language || 'ar');

      if (!userData.phone) {
        console.error('User phone number not found');
        setReservations([]);
        setIsLoading(false);
        return;
      }

      const [reservationData, vehicleData] = await Promise.all([
        Reservation.listByPhone(userData.phone),
        Vehicle.list()
      ]);

      setReservations(reservationData);
      setVehicles(vehicleData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVehicleById = (vehicleId) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilters && !event.target.closest('.relative')) {
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilters]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4" dir={direction}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {t('my_reservations')}
            </h1>
            <p className="text-slate-600">
              {language === 'ar' ? 'تتبع وإدارة حجوزاتك' : 
               language === 'he' ? 'עקוב ונהל את ההזמנות שלך' : 
               'Track and manage your bookings'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <FilterButton />
            <Link to={createPageUrl("Booking")}>
              <Button className="bg-red-500 hover:bg-red-600 text-white">
                <Plus className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('new_booking')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Active Filter Display */}
        {dateFilter !== 'all' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">
                  {language === 'ar' ? 'الفلتر النشط:' : 
                   language === 'he' ? 'מסנן פעיל:' : 
                   'Active Filter:'}
                </span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {dateFilterLabels[dateFilter][language]}
                </Badge>
              </div>
              <button
                onClick={() => setDateFilter('all')}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mb-6 text-sm text-slate-600 bg-white rounded-lg p-4 shadow-sm">
          {language === 'ar' ? 'عرض' : language === 'he' ? 'מציג' : 'Showing'}{' '}
          <span className="font-semibold text-slate-900">{filteredReservations.length}</span>{' '}
          {language === 'ar' ? 'من' : language === 'he' ? 'מתוך' : 'of'}{' '}
          <span className="font-semibold text-slate-900">{reservations.length}</span>{' '}
          {language === 'ar' ? 'حجوزات' : language === 'he' ? 'הזמנות' : 'reservations'}
        </div>

        {/* Reservations List */}
        {filteredReservations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {language === 'ar' ? 'لا توجد حجوزات' : 
               language === 'he' ? 'לא נמצאו הזמנות' : 
               'No reservations found'}
            </h3>
            <p className="text-slate-600 mb-4">
              {dateFilter !== 'all' 
                ? (language === 'ar' ? 'لا توجد حجوزات في هذه الفترة' : 
                   language === 'he' ? 'לא נמצאו הזמנות בתקופה זו' : 
                   'No reservations found for this period')
                : (language === 'ar' ? 'لم تقم بأي حجوزات بعد' : 
                   language === 'he' ? 'עדיין לא ביצעת הזמנות' : 
                   'You haven\'t made any reservations yet')
              }
            </p>
            {dateFilter !== 'all' && (
              <Button
                variant="outline"
                onClick={() => setDateFilter('all')}
              >
                {language === 'ar' ? 'عرض جميع الحجوزات' : 
                 language === 'he' ? 'הצג את כל ההזמנות' : 
                 'Show All Reservations'}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReservations.map((reservation) => {
              const vehicle = getVehicleById(reservation.vehicle_id);
              const startDateTime = new Date(reservation.start_datetime);
              const endDateTime = new Date(startDateTime.getTime() + (reservation.duration_hours * 60 * 60 * 1000));
              const remainingAmount = reservation.total_amount - (reservation.amount_paid || 0);
              
              return (
                <Card key={reservation.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                          <Truck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {t(reservation.service_type)}
                          </h3>
                          <p className="text-sm text-slate-600">
                            {vehicle?.name} ({vehicle?.license_plate})
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          className={`${statusColors[reservation.status]?.bg} ${statusColors[reservation.status]?.text} ${statusColors[reservation.status]?.border} border`}
                        >
                          {t(reservation.status)}
                        </Badge>
                        <Badge 
                          className={`${paymentStatusColors[reservation.payment_status]?.bg} ${paymentStatusColors[reservation.payment_status]?.text} ${paymentStatusColors[reservation.payment_status]?.border} border`}
                        >
                          {t(reservation.payment_status)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-600">{t('date')}</p>
                          <p className="font-medium text-slate-900">
                            {format(startDateTime, 'yyyy/MM/dd')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-600">{t('time')}</p>
                          <p className="font-medium text-slate-900">
                            {format(startDateTime, 'HH:mm')} - {format(endDateTime, 'HH:mm')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <CreditCard className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-600">
                            {language === 'ar' ? 'التكلفة' : language === 'he' ? 'עלות' : 'Cost'}
                          </p>
                          <p className="font-medium text-slate-900">
                            {reservation.total_amount} {t('currency')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-slate-600">{t('from')}</p>
                          <p className="font-medium text-slate-900">{reservation.pickup_location}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-slate-600">{t('to')}</p>
                                                    <p className="font-medium text-slate-900">{reservation.delivery_location}</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    {reservation.payment_status !== 'paid' && (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                          <CreditCard className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                          {language === 'ar' ? 'تفاصيل الدفع' : 
                           language === 'he' ? 'פרטי תשלום' : 
                           'Payment Details'}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-600">{t('total_amount')}</span>
                            <p className="font-medium text-slate-900">
                              {reservation.total_amount} {t('currency')}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-slate-600">{t('amount_paid')}</span>
                            <p className="font-medium text-green-600">
                              {reservation.amount_paid || 0} {t('currency')}
                            </p>
                          </div>
                          
                          <div className="col-span-2">
                            <span className="text-slate-600">{t('remaining')}</span>
                            <p className="font-bold text-red-600">
                              {remainingAmount} {t('currency')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {reservation.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium text-slate-900 mb-2">
                          {t('notes')}
                        </h4>
                        <p className="text-slate-600">{reservation.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}