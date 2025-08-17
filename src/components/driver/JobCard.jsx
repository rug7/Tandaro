import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Reservation } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useTranslation } from "@/components/utils/translations";
import { 
  Calendar, 
  Clock, 
  Phone,
  MapPin,
  Truck,
  DollarSign,
  Play,
  CheckCircle,
  XCircle,
  Navigation,
  ExternalLink,
  FileSignature,
  StickyNote,
  Edit,
  Save,
  X,
  Camera,
  FileText,
  Upload
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

export default function JobCard({ job, language, onStatusUpdate, readonly = false }) {
  const { t } = useTranslation(language);
  const [editingFinancials, setEditingFinancials] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [expandedView, setExpandedView] = useState(false);

  const startDateTime = new Date(job.start_datetime);
  const endDateTime = new Date(startDateTime.getTime() + (job.duration_hours * 60 * 60 * 1000));
  const remainingAmount = (job.total_amount || 0) - (job.amount_paid || 0);

  // Status update handlers
  const handleStartJob = () => {
    onStatusUpdate(job.id, 'in_progress', { started_at: new Date().toISOString() });
  };

  const handleCompleteJob = () => {
    onStatusUpdate(job.id, 'completed', { completed_at: new Date().toISOString() });
  };

  const handleCancelJob = () => {
    onStatusUpdate(job.id, 'cancelled');
  };

  const handleStatusChange = (newStatus) => {
    const timestamps = {};
    if (newStatus === 'in_progress' && job.status !== 'in_progress') {
      timestamps.started_at = new Date().toISOString();
    }
    if (newStatus === 'completed' && job.status !== 'completed') {
      timestamps.completed_at = new Date().toISOString();
    }
    onStatusUpdate(job.id, newStatus, timestamps);
  };

  // Financial updates
  const updateFinancials = async (totalAmount, amountPaid) => {
    try {
      const total = parseFloat(totalAmount) || 0;
      const paid = parseFloat(amountPaid) || 0;
      
      let paymentStatus = 'unpaid';
      if (paid >= total && total > 0) {
        paymentStatus = 'paid';
      } else if (paid > 0) {
        paymentStatus = 'partial';
      }

      await Reservation.update(job.id, {
        total_amount: total,
        amount_paid: paid,
        payment_status: paymentStatus
      });
      
      setEditingFinancials(false);
      window.location.reload(); // Refresh to show updated data
    } catch (error) {
      console.error('Error updating financials:', error);
    }
  };

  // Image upload
  const handleImageUpload = async (file) => {
    setUploading(true);
    try {
      const imageUrl = await UploadFile(file, `job-photos`);
      const newImages = [...(job.images || []), imageUrl];
      
      await Reservation.update(job.id, { images: newImages });
      window.location.reload(); // Refresh to show new image
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  // Signature handling
  const handleSignatureSave = async (signatureUrl) => {
    try {
      await Reservation.update(job.id, { signature_url: signatureUrl });
      setShowSignaturePad(false);
      window.location.reload(); // Refresh to show signature
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };

  // Notes update
  const updateNotes = async (notes) => {
    try {
      await Reservation.update(job.id, { notes });
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  // Navigation helpers
  const getGoogleMapsUrl = (location) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  const getWazeUrl = (location) => {
    return `https://waze.com/ul?q=${encodeURIComponent(location)}`;
  };

  const makePhoneCall = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  return (
    <Card className="card-premium">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-12 h-12 gradient-red rounded-full flex items-center justify-center shadow-premium">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {job.vehicle_name}
              </h3>
              <p className="text-gray-600">{job.license_plate}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge className={`${statusColors[job.status]?.bg} ${statusColors[job.status]?.text} ${statusColors[job.status]?.border} border`}>
              {t(job.status)}
            </Badge>
            <Badge className={`${paymentStatusColors[job.payment_status || 'unpaid']?.bg} ${paymentStatusColors[job.payment_status || 'unpaid']?.text} ${paymentStatusColors[job.payment_status || 'unpaid']?.border} border`}>
              {t(job.payment_status || 'unpaid')}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedView(!expandedView)}
              className="p-1"
            >
              {expandedView ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Date & Time */}
        <div className="flex items-center justify-between text-sm bg-gray-50 p-4 rounded-xl">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="font-medium">{format(startDateTime, 'dd/MM/yyyy')}</span>
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="font-medium">
              {format(startDateTime, 'HH:mm')} - {format(endDateTime, 'HH:mm')}
            </span>
          </div>
          <div className="text-gray-600">
            {job.duration_hours}h
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-blue-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Phone className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t('معلومات العميل', 'Customer Info')}
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('الاسم', 'Name')}</span>
              <span className="font-medium">{job.user_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t('الهاتف', 'Phone')}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => makePhoneCall(job.user_phone)}
                className="text-blue-600 hover:bg-blue-100 p-1 h-auto"
                dir="ltr"
              >
                {job.user_phone}
              </Button>
            </div>
          </div>
        </div>

        {/* Locations */}
        <div className="space-y-4">
          {/* Pickup */}
          <div className="border border-green-200 bg-green-50 p-4 rounded-xl">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-800">{t('الاستلام من', 'Pickup from')}</span>
              </div>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(getGoogleMapsUrl(job.pickup_location), '_blank')}
                  className="text-green-600 hover:bg-green-100 p-1 h-auto"
                >
                  <Navigation className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(getWazeUrl(job.pickup_location), '_blank')}
                  className="text-green-600 hover:bg-green-100 p-1 h-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-green-700 font-medium">{job.pickup_location}</p>
          </div>

          {/* Delivery */}
          <div className="border border-red-200 bg-red-50 p-4 rounded-xl">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-red-800">{t('التسليم إلى', 'Deliver to')}</span>
              </div>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(getGoogleMapsUrl(job.delivery_location), '_blank')}
                  className="text-red-600 hover:bg-red-100 p-1 h-auto"
                >
                  <Navigation className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(getWazeUrl(job.delivery_location), '_blank')}
                  className="text-red-600 hover:bg-red-100 p-1 h-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-red-700 font-medium">{job.delivery_location}</p>
          </div>
        </div>

        {/* Expanded Management View */}
        {expandedView && (
          <div className="space-y-6 pt-4 border-t border-gray-200">
            {/* Financial Management */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-5 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900">
                  {t('التفاصيل المالية', 'Financial Details')}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingFinancials(!editingFinancials)}
                  className="p-2"
                >
                  {editingFinancials ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                </Button>
              </div>
              
              {editingFinancials ? (
                <div className="space-y-3">
                  <Input
                    type="number"
                    defaultValue={job.total_amount}
                    placeholder={t('المبلغ الإجمالي', 'Total Amount')}
                    className="rounded-lg"
                    id="total-amount"
                  />
                  <Input
                    type="number"
                    defaultValue={job.amount_paid || 0}
                    placeholder={t('المبلغ المدفوع', 'Amount Paid')}
                    className="rounded-lg"
                    id="amount-paid"
                  />
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      const total = document.getElementById('total-amount').value;
                      const paid = document.getElementById('amount-paid').value;
                      updateFinancials(total, paid);
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t('حفظ', 'Save')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('الإجمالي', 'Total')}</span>
                    <span className="font-bold text-gray-900">
                      {job.total_amount || 0} {t('شيكل', 'NIS')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('المدفوع', 'Paid')}</span>
                    <span className="font-bold text-green-600">
                      {job.amount_paid || 0} {t('شيكل', 'NIS')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="font-bold text-gray-900">{t('المتبقي', 'Remaining')}</span>
                    <span className={`font-bold text-xl ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {remainingAmount} {t('شيكل', 'NIS')}
                    </span>
                  </div>
                </div>
              )}
            </div>

                        {/* Status Management */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900">
                {t('إدارة الحالة', 'Status Management')}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {['confirmed', 'in_progress', 'completed', 'cancelled'].map(status => (
                  <Button
                    key={status}
                    variant={job.status === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                    className={`text-xs font-semibold ${job.status === status ? 'gradient-red text-white shadow-premium' : 'hover:bg-gray-50'}`}
                    disabled={job.status === status}
                  >
                    {t(status)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900">
                {t('صور العمل', 'Work Photos')}
              </h4>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                />
                <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200">
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-semibold">{t('جاري الرفع...', 'Uploading...')}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      <span className="font-semibold">{t('إضافة صورة', 'Add Photo')}</span>
                    </>
                  )}
                </div>
              </label>

              {/* Display uploaded images */}
              {job.images && job.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                  {job.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Work ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-gray-200 shadow-sm"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Signature */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900">
                {t('توقيع العميل', 'Customer Signature')}
              </h4>
              <Button
                variant="outline"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={() => setShowSignaturePad(true)}
              >
                <FileSignature className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {job.signature_url ? 
                  t('تحديث التوقيع', 'Update Signature') : 
                  t('إضافة توقيع', 'Add Signature')
                }
              </Button>

              {/* Display signature */}
              {job.signature_url && (
                <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <img
                    src={job.signature_url}
                    alt="Customer Signature"
                    className="max-w-full h-16 border border-gray-300 rounded-lg bg-white"
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900">
                {t('ملاحظات', 'Notes')}
              </h4>
              <Textarea
                defaultValue={job.notes || ''}
                placeholder={t('إضافة ملاحظات...', 'Add notes...')}
                className="rounded-xl border-gray-200"
                rows={3}
                onBlur={(e) => updateNotes(e.target.value)}
              />
            </div>

            {/* PDF Export */}
            <div className="pt-4 border-t">
              <PDFExporter 
                reservation={job}
                vehicle={{ name: job.vehicle_name, license_plate: job.license_plate }}
                user={{ full_name: job.user_name, phone: job.user_phone }}
                language={language}
              />
            </div>
          </div>
        )}

        {/* Payment Summary (Always Visible) */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <DollarSign className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {t('ملخص الدفع', 'Payment Summary')}
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">{t('الإجمالي', 'Total')}</span>
              <p className="font-bold text-gray-900">{job.total_amount || 0} {t('شيكل', 'NIS')}</p>
            </div>
            <div>
              <span className="text-gray-600">{t('المدفوع', 'Paid')}</span>
              <p className="font-bold text-green-600">{job.amount_paid || 0} {t('شيكل', 'NIS')}</p>
            </div>
            <div>
              <span className="text-gray-600">{t('المتبقي', 'Due')}</span>
              <p className="font-bold text-red-600">{remainingAmount} {t('شيكل', 'NIS')}</p>
            </div>
          </div>
        </div>

        {/* Notes Display (if exists and not in expanded view) */}
        {job.notes && !expandedView && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <StickyNote className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('ملاحظات', 'Notes')}
            </h4>
            <p className="text-gray-700">{job.notes}</p>
          </div>
        )}

        {/* Signature Preview (if exists and not in expanded view) */}
        {job.signature_url && !expandedView && (
          <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FileSignature className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('توقيع العميل', 'Customer Signature')}
            </h4>
            <img
              src={job.signature_url}
              alt="Customer Signature"
              className="max-w-full h-16 border border-gray-300 rounded-lg bg-white"
            />
          </div>
        )}

        {/* Quick Action Buttons (when not in expanded view) */}
        {!readonly && !expandedView && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            {job.status === 'pending' && (
              <>
                <Button
                  onClick={handleStartJob}
                  className="gradient-red text-white flex-1"
                >
                  <Play className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('بدء المهمة', 'Start Job')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelJob}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('إلغاء', 'Cancel')}
                </Button>
              </>
            )}
            
            {job.status === 'confirmed' && (
              <>
                <Button
                  onClick={handleStartJob}
                  className="gradient-red text-white flex-1"
                >
                  <Play className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('بدء المهمة', 'Start Job')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelJob}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('إلغاء', 'Cancel')}
                </Button>
              </>
            )}
            
            {job.status === 'in_progress' && (
              <>
                <Button
                  onClick={handleCompleteJob}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('إكمال المهمة', 'Complete Job')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelJob}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('إلغاء', 'Cancel')}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Timestamps */}
        {(job.started_at || job.completed_at) && (
          <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
            {job.started_at && (
              <div>
                {t('بدأت في', 'Started at')}: {format(new Date(job.started_at), 'dd/MM/yyyy HH:mm')}
              </div>
            )}
            {job.completed_at && (
              <div>
                {t('اكتملت في', 'Completed at')}: {format(new Date(job.completed_at), 'dd/MM/yyyy HH:mm')}
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <SignaturePad
          isOpen={showSignaturePad}
          onClose={() => setShowSignaturePad(false)}
          onSave={handleSignatureSave}
          language={language}
        />
      )}
    </Card>
  );
}