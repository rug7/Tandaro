
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reservation } from "@/api/entities";
import { useTranslation } from "@/components/utils/translations";
import { 
  DollarSign, 
  CreditCard, 
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  Edit
} from "lucide-react";
import { format } from "date-fns";

const paymentStatusColors = {
  unpaid: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  partial: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
};

export default function PaymentManager({ 
  reservations, 
  vehicles, 
  users, 
  language, 
  onPaymentUpdate 
}) {
  const { t } = useTranslation(language);
  const [processingPayment, setProcessingPayment] = useState(null);

  const getUserById = (userId) => {
    return users.find(u => u.id === userId);
  };

  const getVehicleById = (vehicleId) => {
    return vehicles.find(v => v.id === vehicleId);
  };
  const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all spaces and special characters except digits
  let cleaned = phoneNumber.replace(/[^\d]/g, '');
  
  // Remove country codes (972 or 970) if they exist at the beginning
  if (cleaned.startsWith('972')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('970')) {
    cleaned = cleaned.substring(3);
  }
  
  // If the number doesn't start with 0, add it
  if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  return cleaned;
};

  const updatePayment = async (reservationId, newAmountPaid) => {
    setProcessingPayment(reservationId);
    try {
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) return;

      const totalAmount = reservation.total_amount;
      let paymentStatus = 'unpaid';
      
      if (newAmountPaid >= totalAmount && totalAmount > 0) {
        paymentStatus = 'paid';
        newAmountPaid = totalAmount; // Don't allow overpayment
      } else if (newAmountPaid > 0) {
        paymentStatus = 'partial';
      }

      await Reservation.update(reservationId, {
        amount_paid: newAmountPaid,
        payment_status: paymentStatus
      });
      
      onPaymentUpdate();
    } catch (error) {
      console.error('Error updating payment:', error);
    } finally {
      setProcessingPayment(null);
    }
  };

  const markAsPaid = async (reservationId) => {
    const reservation = reservations.find(r => r.id === reservationId);
    if (reservation) {
      await updatePayment(reservationId, reservation.total_amount);
    }
  };

  if (reservations.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          {language === 'ar' ? 'جميع المدفوعات مكتملة' : language === 'he' ? 'כל התשלומים הושלמו' : 'All Payments Complete'}
        </h3>
        <p className="text-gray-500">
          {language === 'ar' ? 'لا توجد مدفوعات معلقة' : language === 'he' ? 'אין תשלומים ממתינים' : 'No pending payments found'}
        </p>
      </div>
    );
  }

  return (
  <div className="space-y-6" dir={language === 'ar' || language === 'he' ? 'rtl' : 'ltr'}>
      {reservations.map((reservation) => {
        const user = getUserById(reservation.user_id);
        const vehicle = getVehicleById(reservation.vehicle_id);
        const startDateTime = new Date(reservation.start_datetime);
        const remainingAmount = reservation.total_amount - (reservation.amount_paid || 0);
        
        return (
          <div key={reservation.id} className="card-premium p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
  <div className="flex items-center gap-6"> {/* Changed from space-x-4 to gap-6 for more spacing */}
    <div className="w-14 h-14 gradient-red rounded-xl flex items-center justify-center shadow-premium">
      <CreditCard className="w-7 h-7 text-white" />
    </div>
    <div>
      <h3 className="text-xl font-bold text-gray-900">
        {user?.full_name}
      </h3>
      <p className="text-gray-600">
        #{reservation.id.slice(-8)} • {format(startDateTime, 'yyyy/MM/dd')}
      </p>
    </div>
  </div>
  
  <Badge 
    className={`${paymentStatusColors[reservation.payment_status]?.bg} ${paymentStatusColors[reservation.payment_status]?.text} ${paymentStatusColors[reservation.payment_status]?.border} border px-4 py-2 font-bold`}
  >
    {language === 'ar' ? 'مدفوع جزئياً' : 
     language === 'he' ? 'שולם חלקית' : 
     t(reservation.payment_status)}
  </Badge>
</div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payment Details */}
              <div>
                <h4 className="font-bold text-gray-900 mb-6 flex items-center text-lg">
                  <DollarSign className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                  {language === 'ar' ? 'تفاصيل المدفوعات' : language === 'he' ? 'פרטי תשלום' : 'Payment Details'}
                </h4>
                
                <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-semibold">{t('total_amount')}</span>
                    <span className="font-bold text-gray-900 text-xl">
                      {reservation.total_amount} {t('currency')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 font-semibold">{t('amount_paid')}</span>
                    <span className="font-bold text-green-600 text-xl">
                      {reservation.amount_paid || 0} {t('currency')}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t-2 border-white">
                    <span className="font-bold text-gray-900 text-lg">{t('remaining')}</span>
                    <span className={`font-bold text-2xl ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {remainingAmount} {t('currency')}
                    </span>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      min="0"
                      max={reservation.total_amount}
                      placeholder={language === 'ar' ? 'مبلغ الدفعة' : language === 'he' ? 'סכום תשלום' : 'Payment amount'}
                      className="flex-1 rounded-xl h-12 text-lg border-gray-300"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const amount = parseFloat(e.target.value) || 0;
                          updatePayment(reservation.id, (reservation.amount_paid || 0) + amount);
                          e.target.value = '';
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      className="px-6 py-3 rounded-xl border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={(e) => {
                        const input = e.target.closest('.space-y-4').querySelector('input');
                        const amount = parseFloat(input.value) || 0;
                        updatePayment(reservation.id, (reservation.amount_paid || 0) + amount);
                        input.value = '';
                      }}
                      disabled={processingPayment === reservation.id}
                    >
                      {language === 'ar' ? 'إضافة' : language === 'he' ? 'הוסף' : 'Add'}
                    </Button>
                  </div>
                  
                  <Button
                    className="w-full gradient-red text-white hover:opacity-90 rounded-xl h-12 text-lg font-bold shadow-premium"
                    onClick={() => markAsPaid(reservation.id)}
                    disabled={reservation.payment_status === 'paid' || processingPayment === reservation.id}
                  >
                    {processingPayment === reservation.id ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 rtl:ml-2 rtl:mr-0"></div>
                        {language === 'ar' ? 'جاري المعالجة...' : language === 'he' ? 'מעבד...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                        {language === 'ar' ? 'تحديد كمدفوع بالكامل' : language === 'he' ? 'סמן כשולם במלואו' : 'Mark as Fully Paid'}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Reservation Summary */}
              <div>
                <h4 className="font-bold text-gray-900 mb-6 flex items-center text-lg">
                  <User className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                  {language === 'ar' ? 'ملخص الحجز' : language === 'he' ? 'סיכום הזמנה' : 'Reservation Summary'}
                </h4>
                
                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">{language === 'ar' ? 'العمييل' : language === 'he' ? 'לקוח' : 'Customer'}</span>
                      <span className="font-bold text-gray-900">{user?.full_name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">{t('phone')}</span>
                      <span className="font-bold text-gray-900" dir="ltr">{normalizePhoneNumber(user?.phone)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">{language === 'ar' ? 'المركبة' : language === 'he' ? 'רכב' : 'Vehicle'}</span>
                      <span className="font-bold text-gray-900">{vehicle?.name}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">{t('date')}</span>
                      <span className="font-bold text-gray-900">
                        {format(startDateTime, 'yyyy/MM/dd HH:mm')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 font-medium">{t('duration')}</span>
                      <span className="font-bold text-gray-900">
                        {reservation.duration_hours} {language === 'ar' ? 'ساعات' : language === 'he' ? 'שעות' : 'hours'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-gray-700 mb-2 font-semibold">
                          <span className="font-bold">{t('from')}:</span> {reservation.pickup_location}
                        </p>
                        <p className="text-gray-700 font-semibold">
                          <span className="font-bold">{t('to')}:</span> {reservation.delivery_location}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
