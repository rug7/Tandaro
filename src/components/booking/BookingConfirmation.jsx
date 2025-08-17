import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Calendar, 
  Clock,
  MapPin,
  Truck,
  DollarSign,
  User,
  Phone,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { format } from "date-fns";

const serviceTypes = {
  furniture_pickup: { ar: 'نقل أثاث', en: 'Furniture Pickup' },
  construction_tools: { ar: 'أدوات البناء', en: 'Construction Tools' },
  materials_transport: { ar: 'نقل مواد', en: 'Materials Transport' },
  general_delivery: { ar: 'توصيل عام', en: 'General Delivery' },
  office_move: { ar: 'نقل مكاتب', en: 'Office Move' },
  other: { ar: 'أخرى', en: 'Other' }
};

export default function BookingConfirmation({ 
  language, 
  bookingData, 
  selectedVehicle,
  user,
  onConfirm, 
  onBack,
  isLoading 
}) {
  const t = (ar, en) => language === 'ar' ? ar : en;

  const startDateTime = new Date(bookingData.start_datetime);
  const endDateTime = new Date(startDateTime.getTime() + (bookingData.duration_hours * 60 * 60 * 1000));
const totalCost = selectedVehicle ? selectedVehicle.price_per_hour * bookingData.duration_hours : 0;

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

  const handleConfirm = () => {
  const confirmationData = {
    ...bookingData,
    phone: user?.phone,
    total_amount: totalCost
  };
  onConfirm(confirmationData);
};

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          {t('جاري تأكيد الحجز...', 'Confirming reservation...')}
        </h2>
        <p className="text-slate-600">
          {t('يرجى الانتظار', 'Please wait')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t('تأكيد الحجز', 'Confirm Reservation')}
        </h2>
        <p className="text-slate-600">
          {t('يرجى مراجعة تفاصيل الحجز قبل التأكيد', 'Please review the booking details before confirming')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Details */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">
              {t('تفاصيل الحجز', 'Booking Details')}
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center">
                <Truck className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('نوع الخدمة', 'Service Type')}
              </span>
              <Badge variant="secondary">
                {serviceTypes[bookingData.service_type]?.[language] || bookingData.service_type}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('التاريخ', 'Date')}
              </span>
              <span className="font-medium">
                {format(startDateTime, 'yyyy/MM/dd')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600 flex items-center">
                <Clock className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {t('الوقت', 'Time')}
              </span>
              <span className="font-medium">
                {format(startDateTime, 'HH:mm')} - {format(endDateTime, 'HH:mm')}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-600">
                {t('المدة', 'Duration')}
              </span>
              <span className="font-medium">
                {bookingData.duration_hours} {t('ساعات', 'hours')}
              </span>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-start justify-between mb-2">
                <span className="text-slate-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('من', 'From')}
                </span>
                <span className="font-medium text-right rtl:text-left max-w-48">
                  {bookingData.pickup_location}
                </span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-slate-600 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('إلى', 'To')}
                </span>
                <span className="font-medium text-right rtl:text-left max-w-48">
                  {bookingData.delivery_location}
                </span>
              </div>
            </div>

            {bookingData.notes && (
              <div className="pt-4 border-t">
                <span className="text-slate-600 text-sm">
                  {t('ملاحظات', 'Notes')}:
                </span>
                <p className="text-slate-900 mt-1">{bookingData.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle & User Info */}
        <div className="space-y-6">
          {/* Vehicle Info */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900">
                {t('المركبة المختارة', 'Selected Vehicle')}
              </h3>
            </CardHeader>
            <CardContent>
              {selectedVehicle && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                      <Truck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{selectedVehicle.name}</h4>
                      <p className="text-sm text-slate-600">{selectedVehicle.capacity}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {t('رقم اللوحة', 'License Plate')}
                    </span>
                    <span className="font-medium">{selectedVehicle.license_plate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {t('السعر بالساعة', 'Hourly Rate')}
                    </span>
                    <span className="font-medium">{selectedVehicle.price_per_hour} {t('شيكل', 'NIS')}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Info */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-slate-900">
                {t('معلومات العميل', 'Customer Information')}
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center">
                    <User className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('الاسم', 'Name')}
                  </span>
                  <span className="font-medium">{user?.full_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 flex items-center">
                    <Phone className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('الهاتف', 'Phone')}
                  </span>
                  <span className="font-medium" dir="ltr">{normalizePhoneNumber(user?.phone)}</span>
                </div>
                {user?.company_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">
                      {t('الشركة', 'Company')}
                    </span>
                    <span className="font-medium">{user.company_name}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total Cost */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-900 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('إجمالي التكلفة', 'Total Cost')}
                </span>
                <span className="text-2xl font-bold text-red-600">
                  {totalCost} {t('شيكل', 'NIS')}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                {t('سيتم تحصيل الدفعة عند تأكيد الحجز', 'Payment will be collected upon booking confirmation')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-6 py-3"
          size="lg"
          disabled={isLoading}
        >
          <ArrowLeft className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 rtl:rotate-180" />
          <span>{t('السابق', 'Previous')}</span>
        </Button>

        <Button
          onClick={handleConfirm}
          className="px-8 py-3 gradient-red text-white hover:opacity-90"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 animate-spin" />
              <span>{t('جاري التأكيد...', 'Confirming...')}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
              <span>{t('تأكيد الحجز', 'Confirm Booking')}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}