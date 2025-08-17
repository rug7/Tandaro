
import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Reservation } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useTranslation, getDirection } from "@/components/utils/translations";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Truck, 
  User,
  Phone,
  Edit,
  Save,
  X,
  Upload,
  FileText,
  Image as ImageIcon,
  Camera
} from "lucide-react";
import { format } from "date-fns";

import SignaturePad from "../common/SignaturePad";
import PDFExporter from "../common/PDFExporter";

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

export default function ReservationsList({ 
  reservations, 
  vehicles, 
  users, 
  language, 
  onReservationUpdate 
}) {
  const { t } = useTranslation(language);
  const [editingReservation, setEditingReservation] = useState(null);
  const [editingFinancials, setEditingFinancials] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(null);
  

  const serviceTypes = {
    furniture_pickup: { ar: 'نقل أثاث', he: 'הובלת רהיטים', en: 'Furniture Pickup' },
    construction_tools: { ar: 'أدوات البناء', he: 'כלי בנייה', en: 'Construction Tools' },
    materials_transport: { ar: 'نقل مواد', he: 'הובלת חומרים', en: 'Materials Transport' },
    general_delivery: { ar: 'توصيل عام', he: 'משלוח כללי', en: 'General Delivery' },
    office_move: { ar: 'نقل مكاتب', he: 'העברת משרדים', en: 'Office Move' },
    other: { ar: 'أخرى', he: 'אחר', en: 'Other' }
  };

  const getVehicleById = (vehicleId) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const getUserById = (userId) => {
    return users.find(u => u.id === userId);
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

  const updateReservationStatus = async (reservationId, newStatus) => {
    try {
      await Reservation.update(reservationId, { status: newStatus });
      onReservationUpdate();
    } catch (error) {
      console.error('Error updating reservation status:', error);
    }
  };

  const updateFinancials = async (reservationId, updates) => {
    try {
      const totalAmount = parseFloat(updates.total_amount) || 0;
      const amountPaid = parseFloat(updates.amount_paid) || 0;
      
      let paymentStatus = 'unpaid';
      if (amountPaid >= totalAmount && totalAmount > 0) {
        paymentStatus = 'paid';
      } else if (amountPaid > 0) {
        paymentStatus = 'partial';
      }

      await Reservation.update(reservationId, {
        ...updates,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        payment_status: paymentStatus
      });
      
      setEditingFinancials(null);
      onReservationUpdate();
    } catch (error) {
      console.error('Error updating financials:', error);
    }
  };

  const handleImageUpload = async (reservationId, file) => {
    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const reservation = reservations.find(r => r.id === reservationId);
      const newImages = [...(reservation.images || []), file_url];
      
      await Reservation.update(reservationId, { images: newImages });
      onReservationUpdate();
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSignatureSave = async (reservationId, signatureUrl) => {
    try {
      await Reservation.update(reservationId, { signature_url: signatureUrl });
      setShowSignaturePad(null);
      onReservationUpdate();
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };

  const updateNotes = async (reservationId, notes) => {
    try {
      await Reservation.update(reservationId, { notes });
      onReservationUpdate();
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  if (reservations.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 rtl:space-x-reverse">
          <Calendar className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          {language === 'ar' ? 'لا توجد حجوزات' : language === 'he' ? 'אין הזמנות' : 'No Reservations'}
        </h3>
        <p className="text-gray-500">
          {language === 'ar' ? 'لم يتم العثور على حجوزات تطابق الفلاتر المحددة' : 
           language === 'he' ? 'לא נמצאו הזמנות התואמות את הפילטרים שנבחרו' :
           'No reservations found matching the selected filters'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={getDirection(language)}>
      {reservations.map((reservation) => {
        const vehicle = getVehicleById(reservation.vehicle_id);
        const user = getUserById(reservation.user_id);
        const startDateTime = new Date(reservation.start_datetime);
        const endDateTime = new Date(startDateTime.getTime() + (reservation.duration_hours * 60 * 60 * 1000));
        const remainingAmount = reservation.total_amount - (reservation.amount_paid || 0);
        
        return (
          <div key={reservation.id} className="card-premium p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 rtl:space-x-reverse">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="w-14 h-14 gradient-red rounded-xl flex items-center justify-center shadow-premium">
                  <Truck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {serviceTypes[reservation.service_type]?.[language] || reservation.service_type}
                  </h3>
                  <p className="text-gray-600">
                    #{reservation.id.slice(-8)}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 rtl:space-x-reverse">
                <Badge 
                  className={`${statusColors[reservation.status]?.bg} ${statusColors[reservation.status]?.text} ${statusColors[reservation.status]?.border} border px-3 py-1 font-semibold`}
                >
                  {t(reservation.status)}
                </Badge>
                <Badge 
                  className={`${paymentStatusColors[reservation.payment_status]?.bg} ${paymentStatusColors[reservation.payment_status]?.text} ${paymentStatusColors[reservation.payment_status]?.border} border px-3 py-1 font-semibold`}
                >
                  {t(reservation.payment_status)}
                </Badge>
                <PDFExporter 
                  reservation={reservation}
                  vehicle={vehicle}
                  user={user}
                  language={language}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Customer & Vehicle Info */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h4 className="font-bold text-gray-900 flex items-center mb-4 rtl:space-x-reverse">
                    <User className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                    {language === 'ar' ? 'معلومات العميل' : language === 'he' ? 'פרטי לקוח' : 'Customer Info'}
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rtl:space-x-reverse">
                      <span className="text-gray-600 font-medium">{t('name')}</span>
                      <span className="font-bold text-gray-900">{user?.full_name}</span>
                    </div>
                    <div className="flex items-center justify-between rtl:space-x-reverse">
                      <span className="text-gray-600 font-medium">{t('phone')}</span>
                      <span className="font-bold text-gray-900" dir="ltr">{normalizePhoneNumber(user?.phone)}</span>
                    </div>
                    {user?.company_name && (
                      <div className="flex items-center justify-between rtl:space-x-reverse">
                        <span className="text-gray-600 font-medium">{t('company')}</span>
                        <span className="font-bold text-gray-900">{user.company_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-5 rounded-xl">
                  <h5 className="font-bold text-gray-900 mb-3">
                    {language === 'ar' ? 'المركبة' : language === 'he' ? 'רכב' : 'Vehicle'}
                  </h5>
                  <div className="space-y-2">
                    <p className="font-bold text-lg">{vehicle?.name}</p>
                    <p className="text-gray-600">{vehicle?.license_plate}</p>
                    <p className="text-sm text-gray-500">{vehicle?.capacity}</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-6">
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h4 className="font-bold text-gray-900 flex items-center mb-4 rtl:space-x-reverse">
                    <Calendar className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
                    {language === 'ar' ? 'تفاصيل الحجز' : language === 'he' ? 'פרטי הזמנה' : 'Booking Details'}
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rtl:space-x-reverse">
                      <span className="text-gray-600 font-medium">{t('date')}</span>
                      <span className="font-bold text-gray-900">
                        {format(startDateTime, 'yyyy/MM/dd')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rtl:space-x-reverse">
                      <span className="text-gray-600 font-medium">{t('time')}</span>
                      <span className="font-bold text-gray-900">
                        {format(startDateTime, 'HH:mm')} - {format(endDateTime, 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rtl:space-x-reverse">
                      <span className="text-gray-600 font-medium">{t('duration')}</span>
                      <span className="font-bold text-gray-900">
                        {reservation.duration_hours} {language === 'ar' ? 'ساعات' : language === 'he' ? 'שעות' : 'hours'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start justify-between text-sm bg-green-50 p-4 rounded-xl rtl:space-x-reverse">
                    <span className="text-gray-700 flex items-center font-medium">
                      <MapPin className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                      {t('from')}
                    </span>
                    <span className="font-bold text-gray-900 text-right rtl:text-left max-w-40">
                      {reservation.pickup_location}
                    </span>
                  </div>
                  <div className="flex items-start justify-between text-sm bg-red-50 p-4 rounded-xl rtl:space-x-reverse">
                    <span className="text-gray-700 flex items-center font-medium rtl:space-x-reverse" >
                      <MapPin className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                      {t('to')}
                    </span>
                    <span className="font-bold text-gray-900 text-right rtl:text-left max-w-40">
                      {reservation.delivery_location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial & Actions */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-5 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-gray-900">
                      {language === 'ar' ? 'التفاصيل المالية' : language === 'he' ? 'פרטים פיננסים' : 'Financial Details'}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingFinancials(editingFinancials === reservation.id ? null : reservation.id)}
                      className="p-2 hover:bg-white/50 rounded-lg"
                    >
                      {editingFinancials === reservation.id ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  {editingFinancials === reservation.id ? (
                    <div className="space-y-3">
                      <Input
                        type="number"
                        defaultValue={reservation.total_amount}
                        placeholder={t('total_amount')}
                        className="rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateFinancials(reservation.id, {
                              total_amount: e.target.value,
                              amount_paid: reservation.amount_paid || 0
                            });
                          }
                        }}
                      />
                      <Input
                        type="number"
                        defaultValue={reservation.amount_paid || 0}
                        placeholder={t('amount_paid')}
                        className="rounded-lg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateFinancials(reservation.id, {
                              total_amount: reservation.total_amount,
                              amount_paid: e.target.value
                            });
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">{t('total_amount')}</span>
                        <span className="font-bold text-gray-900">
                          {reservation.total_amount} {t('currency')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">{t('amount_paid')}</span>
                        <span className="font-bold text-green-600">
                          {reservation.amount_paid || 0} {t('currency')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-bold text-gray-900">{t('remaining')}</span>
                        <span className={`font-bold text-xl ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {remainingAmount} {t('currency')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Management */}
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 font-semibold mb-2">
                    {language === 'ar' ? 'تحديث الحالة' : language === 'he' ? 'עדכון סטטוס' : 'Update Status'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {['confirmed', 'in_progress', 'completed', 'cancelled'].map(status => (
                      <Button
                        key={status}
                        variant={reservation.status === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => updateReservationStatus(reservation.id, status)}
                        className={`text-xs font-semibold ${reservation.status === status ? 'gradient-red text-white shadow-premium' : 'hover:bg-gray-50'}`}
                        disabled={reservation.status === status}
                      >
                        {t(status)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleImageUpload(reservation.id, e.target.files[0]);
                        }
                      }}
                    />
                    <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200">
                      <Camera className="w-5 h-5" />
                      <span className="font-semibold">
                        {language === 'ar' ? 'إضافة صورة' : language === 'he' ? 'הוסף תמונה' : 'Add Image'}
                      </span>
                    </div>
                  </label>

                  {/* Signature */}
                  <Button
                    variant="outline"
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => setShowSignaturePad(reservation.id)}
                  >
                    <Edit className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {language === 'ar' ? 'توقيع العميل' : language === 'he' ? 'חתימת לקוח' : 'Customer Signature'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="font-bold text-gray-900 mb-3">
                {t('notes')}
              </h4>
              <Textarea
                defaultValue={reservation.notes || ''}
                placeholder={language === 'ar' ? 'إضافة ملاحظات...' : language === 'he' ? 'הוסף הערות...' : 'Add notes...'}
                className="rounded-xl border-gray-200"
                rows={3}
                onBlur={(e) => updateNotes(reservation.id, e.target.value)}
              />
            </div>

            {/* Images Display */}
            {reservation.images && reservation.images.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4">
                  {language === 'ar' ? 'صور العمل' : language === 'he' ? 'תמונות עבודה' : 'Work Photos'}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {reservation.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Work ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 shadow-premium"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Signature Display */}
            {reservation.signature_url && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4">
                  {t('customer_approval')}
                </h4>
                <img
                  src={reservation.signature_url}
                  alt="Customer Signature"
                  className="max-w-sm h-24 border border-gray-300 rounded-lg bg-white shadow-premium"
                />
              </div>
            )}

            {uploading && (
              <div className="mt-4 flex items-center justify-center py-4 bg-blue-50 rounded-xl">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2 rtl:ml-2 rtl:mr-0"></div>
                <span className="text-blue-600 font-semibold">
                  {language === 'ar' ? 'جاري الرفع...' : language === 'he' ? 'מעלה...' : 'Uploading...'}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          isOpen={!!showSignaturePad}
          onClose={() => setShowSignaturePad(null)}
          onSave={(signatureUrl) => handleSignatureSave(showSignaturePad, signatureUrl)}
          language={language}
        />
      )}
    </div>
  );
}
