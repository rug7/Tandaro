import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Reservation } from "@/api/entities";
import { 
  Calendar, 
  Clock, 
  MapPin,
  ArrowRight, 
  ArrowLeft,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

const durationOptions = [
  { hours: 2, labelAr: 'ساعتان', labelEn: '2 hours', labelHe: 'שעתיים' },
  { hours: 4, labelAr: '4 ساعات', labelEn: '4 hours', labelHe: '4 שעות' },
  { hours: 6, labelAr: '6 ساعات', labelEn: '6 hours', labelHe: '6 שעות' },
  { hours: 8, labelAr: '8 ساعات', labelEn: '8 hours', labelHe: '8 שעות' }
];

export default function DateTimeSelector({ 
  language, 
  bookingData, 
  selectedVehicle,
  onDateTimeSelect, 
  onNext, 
  onBack 
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(4);
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [existingReservations, setExistingReservations] = useState([]);

  const t = (ar, en, he) => {
    if (language === 'ar') return ar;
    if (language === 'he') return he;
    return en;
  };

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (selectedVehicle?.id) {
      loadExistingReservations();
    }
  }, [selectedVehicle]);

  const loadExistingReservations = async () => {
    setChecking(true);
    try {
      const reservations = await Reservation.filter({ 
        vehicle_id: selectedVehicle.id,
        status: ['pending', 'confirmed', 'in_progress']
      });
      setExistingReservations(reservations);
    } catch (error) {
      console.error('Error loading reservations:', error);
      setError(t('حدث خطأ في تحميل الحجوزات', 'Error loading reservations', 'שגיאה בטעינת הזמנות'));
    } finally {
      setChecking(false);
    }
  };

  const isTimeSlotBooked = (time) => {
    if (!selectedDate) return false;

    const startDateTime = new Date(`${selectedDate}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + (selectedDuration * 60 * 60 * 1000));
    
    if (startDateTime <= new Date()) return true;

    return existingReservations.some(res => {
      const resStart = new Date(res.start_datetime);
      const resEnd = new Date(resStart.getTime() + (res.duration_hours * 60 * 60 * 1000));
      // Check for overlap
      return (startDateTime < resEnd && endDateTime > resStart);
    });
  };

  const handleNext = () => {
    setError('');
    
    if (!selectedDate || !selectedTime) {
      setError(t('يرجى اختيار التاريخ والوقت', 'Please select a date and time', 'אנא בחר תאריך ושעה'));
      return;
    }
    if (!pickupLocation.trim()) {
      setError(t('يرجى إدخال عنوان الاستلام', 'Please enter pickup location', 'אנא הזן כתובת איסוף'));
      return;
    }
    if (!deliveryLocation.trim()) {
      setError(t('يرجى إدخال عنوان التسليم', 'Please enter delivery location', 'אנא הזן כתובת משלוח'));
      return;
    }
    
    if (isTimeSlotBooked(selectedTime)) {
      setError(t(
          'هذا الوقت محجوز. يرجى اختيار وقت آخر.',
          'This time is booked. Please select another time.',
          'זמן זה תפוס. אנא בחר זמן אחר.'
      ));
      return;
    }

    const dateTimeData = {
      start_datetime: new Date(`${selectedDate}T${selectedTime}`).toISOString(),
      duration_hours: selectedDuration,
      pickup_location: pickupLocation.trim(),
      delivery_location: deliveryLocation.trim(),
      notes: notes.trim()
    };

    onDateTimeSelect(dateTimeData);
    onNext();
  };

  const calculateEndTime = () => {
    if (!selectedTime) return '';
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const endHours = (hours + selectedDuration) % 24;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const calculateTotalCost = () => {
  if (!selectedVehicle || typeof selectedVehicle.price_per_hour !== 'number') {
    return 0;
  }
  return selectedVehicle.price_per_hour * selectedDuration;
};

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {t('متى تحتاج الخدمة؟', 'When do you need the service?', 'מתי אתה צריך את השירות?')}
        </h2>
        <p className="text-slate-600">
          {t('حدد التاريخ والوقت المناسب لك', 'Select the date and time that works for you', 'בחר את התאריך והשעה שמתאימים לך')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Date and Time Selection */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('التاريخ والوقت', 'Date & Time', 'תאריך ושעה')}
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">
                  {t('التاريخ', 'Date', 'תאריך')}
                </Label>
                <Input
                  type="date"
                  min={today}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedTime(''); // Reset time when date changes
                    setError('');
                  }}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700">
                  {t('المدة', 'Duration', 'משך זמן')}
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {durationOptions.map((option) => (
                    <Button
                      key={option.hours}
                      variant={selectedDuration === option.hours ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedDuration(option.hours);
                        setSelectedTime(''); // Also reset time when duration changes
                        setError('');
                      }}
                      className={selectedDuration === option.hours ? "gradient-red text-white" : ""}
                      disabled={checking}
                    >
                      {language === 'ar' ? option.labelAr : language === 'he' ? option.labelHe : option.labelEn}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700">
                  {t('الوقت', 'Time', 'שעה')}
                </Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {timeSlots.map((time) => {
                    const isDisabled = isTimeSlotBooked(time);
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setSelectedTime(time);
                          setError('');
                        }}
                        className={`${selectedTime === time ? "gradient-red text-white" : ""} ${isDisabled ? "bg-gray-100 text-gray-400 line-through cursor-not-allowed" : ""}`}
                        disabled={isDisabled || checking || !selectedDate}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {selectedTime && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      {t('وقت البداية', 'Start Time', 'שעת התחלה')}
                    </span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-slate-600">
                      {t('وقت الانتهاء', 'End Time', 'שעת סיום')}
                    </span>
                    <span className="font-medium">{calculateEndTime()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t">
                    <span className="text-slate-600 font-medium">
                      {t('التكلفة الإجمالية', 'Total Cost', 'עלות כוללת')}
                    </span>
                    <span className="font-bold text-red-500">
                      {calculateTotalCost()} {t('شيكل', 'NIS', 'שקל')}
                    </span>
                  </div>
                </div>
              )}

              {checking && (
                <div className="flex items-center justify-center py-2">
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin mr-2 rtl:ml-2 rtl:mr-0"></div>
                  <span className="text-sm text-slate-600">
                    {t('جاري التحقق من التوفر...', 'Checking availability...', 'בודק זמינות...')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Details */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('تفاصيل المواقع', 'Location Details', 'פרטי המיקום')}
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-slate-700">
                  {t('عنوان الاستلام', 'Pickup Location', 'כתובת איסוף')} *
                </Label>
                <Input
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder={t('أدخل عنوان الاستلام', 'Enter pickup address', 'הזן כתובת איסוף')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700">
                  {t('عنوان التسليم', 'Delivery Location', 'כתובת משלוח')} *
                </Label>
                <Input
                  value={deliveryLocation}
                  onChange={(e) => setDeliveryLocation(e.target.value)}
                  placeholder={t('أدخل عنوان التسليم', 'Enter delivery address', 'הזן כתובת משלוח')}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-700">
                  {t('ملاحظات إضافية', 'Additional Notes', 'הערות נוספות')}
                </Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('أي تفاصيل إضافية...', 'Any additional details...', 'כל פרטים נוספים...')}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="px-6 py-3"
          size="lg"
        >
          <ArrowLeft className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 rtl:rotate-180" />
          <span>{t('السابق', 'Previous', 'הקודם')}</span>
        </Button>

        <Button
          onClick={handleNext}
          className="px-8 py-3 gradient-red text-white hover:opacity-90"
          size="lg"
          disabled={checking}
        >
          <span>{t('التالي', 'Next', 'הבא')}</span>
          <ArrowRight className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}