import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DriverApplication, User } from '@/api/entities';
import { useTranslation } from '@/components/utils/translations';

import { UploadFile } from '@/api/integrations';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  Eye, 
  Truck, 
  User as UserIcon,
  Phone,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DriverApplicationForm({ 
  language, 
  onClose, 
  onSuccess 
}) {
  const [formData, setFormData] = useState({
    vehicle_type: 'pickup',
    vehicle_model: '',
    vehicle_year: '',
    license_plate: '',
    vehicle_description: '',
    has_license: true,
    has_insurance: true,
    experience_years: '',
    additional_notes: '',
    vehicle_images: []
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const { t } = useTranslation(language);

  const vehicleTypes = [
    { value: 'pickup', key: 'pickup' },
    { value: 'small-truck', key: 'small_truck' },
    { value: 'large-truck', key: 'large_truck' },
    { value: 'van', key: 'van' },
    { value: 'other', key: 'other' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateFile = (file) => {
  if (!file.type.startsWith('image/')) {
    throw new Error(t('upload_images_only'));
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error(t('image_size_limit'));
  }
  return true;
};

  const handleImageUpload = async (files) => {
    setUploading(true);
    
    const validFiles = [];
    try {
      for (let file of files) {
        validateFile(file);
        validFiles.push(file);
      }
    } catch (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }

    try {
      const uploadPromises = validFiles.map(file => 
        UploadFile(file, `driver-applications`)
      );

      const uploadedUrls = await Promise.all(uploadPromises);
      const newImages = [...formData.vehicle_images, ...uploadedUrls];
      
      setFormData(prev => ({
        ...prev,
        vehicle_images: newImages
      }));
      
toast.success(t('images_uploaded_success', { count: validFiles.length }));    } catch (error) {
      console.error('Upload error:', error);
  toast.error(t('failed_upload_images'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleImageUpload(files);
    }
  };

  const handleImageRemove = (indexToRemove) => {
    const newImages = formData.vehicle_images.filter((_, index) => index !== indexToRemove);
    setFormData(prev => ({
      ...prev,
      vehicle_images: newImages
    }));
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      await handleImageUpload(files);
    }
  };

  const handleSubmit = async (e) => {
    
  e.preventDefault();
  
  if (!formData.vehicle_model.trim()) {
    toast.error(t('enter_vehicle_model'));
    return;
  }

  if (!formData.license_plate.trim()) {
    toast.error(t('enter_license_plate_error'));
    return;
  }

  if (formData.vehicle_images.length === 0) {
    toast.error(t('upload_at_least_one_image'));
    return;
  }

  setSubmitting(true);
  try {
    await DriverApplication.create({
      ...formData,
      application_type: 'driver_registration_with_vehicle',
    });

    toast.success(t('application_submitted_success'));
    onSuccess?.();
    onClose?.();
  } catch (error) {
    console.error('Error submitting application:', error);
    toast.error(t('failed_submit_application'));
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
  {t('driver_application')}
</h2>
<p className="text-gray-600 text-sm">
  {t('fill_details_upload')}
</p>
              </div>
            </div>
            <Button variant="ghost" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
  <Truck className="w-5 h-5 mr-2" />
  {t('vehicle_information')}
</h3>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
  {t('vehicle_type')}
</label>
<select
  value={formData.vehicle_type}
  onChange={(e) => handleInputChange('vehicle_type', e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
>
  {vehicleTypes.map(type => (
    <option key={type.value} value={type.value}>
      {t(type.key)}
    </option>
  ))}
</select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
  {t('vehicle_model')}
</label>
<Input
  required
  value={formData.vehicle_model}
  onChange={(e) => handleInputChange('vehicle_model', e.target.value)}
  placeholder={t('vehicle_model_example')}
/>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
  {t('manufacturing_year')}
</label>
                  <Input
                    type="number"
                    min="2000"
                    max="2024"
                    value={formData.vehicle_year}
                    onChange={(e) => handleInputChange('vehicle_year', e.target.value)}
                    placeholder="2020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
  {t('license_plate')} *
</label>
<Input
  required
  value={formData.license_plate}
  onChange={(e) => handleInputChange('license_plate', e.target.value)}
  placeholder={t('enter_license_plate')}
/>
                </div>
              </div>

              <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
  {t('vehicle_description')}
</label>
<textarea
  value={formData.vehicle_description}
  onChange={(e) => handleInputChange('vehicle_description', e.target.value)}
  placeholder={t('vehicle_description_placeholder')}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
  rows={3}
/>
              </div>
            </div>

            {/* Driver Experience */}
            <div className="space-y-4">
             <h3 className="text-lg font-semibold text-gray-900 flex items-center">
  <UserIcon className="w-5 h-5 mr-2" />
  {t('driving_experience')}
</h3>
</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
  {t('years_of_experience')}
</label>
<Input
  type="number"
  min="0"
  max="50"
  value={formData.experience_years}
  onChange={(e) => handleInputChange('experience_years', e.target.value)}
  placeholder={t('number_of_years')}
/>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.has_license}
                      onChange={(e) => handleInputChange('has_license', e.target.checked)}
                      className="mr-2 rtl:ml-2 rtl:mr-0"
                    />
<span className="text-sm">{t('valid_license')}</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.has_insurance}
                      onChange={(e) => handleInputChange('has_insurance', e.target.checked)}
                      className="mr-2 rtl:ml-2 rtl:mr-0"
                    />
<span className="text-sm">{t('vehicle_insured')}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
  {t('additional_notes')}
</label>
<textarea
  value={formData.additional_notes}
  onChange={(e) => handleInputChange('additional_notes', e.target.value)}
  placeholder={t('additional_info_share')}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
  rows={3}
/>
              </div>
            </div>

            {/* Vehicle Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
  <ImageIcon className="w-5 h-5 mr-2" />
  {t('vehicle_images_required')}
  {formData.vehicle_images.length > 0 && (
    <Badge className="ml-2 bg-green-100 text-green-800">
      {formData.vehicle_images.length}
    </Badge>
  )}
</h3>

              {/* Image Gallery */}
              {formData.vehicle_images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {formData.vehicle_images.map((image, index) => (
                                        <div key={index} className="relative group">
                      <img 
                        src={image} 
                        alt={`Vehicle ${index + 1}`} 
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setPreviewImage(image)}
                      />
                      <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Upload Area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  dragActive ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  className="hidden"
                  accept="image/*"
                  multiple
                />
                
                {uploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
<p className="text-sm text-gray-600">{t('uploading_images')}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
  {t('upload_vehicle_images')}
</h3>
                    <p className="text-sm text-gray-600 mb-2">
  {t('drag_images_or_click')}
</p>
<p className="text-xs text-gray-500">
  {t('max_size_per_image')}
</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                   {t('add_images')}
                </Button>
                
                {formData.vehicle_images.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setPreviewImage(formData.vehicle_images[0])}
                    className="px-3"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
  type="button"
  variant="outline"
  onClick={onClose}
  className="flex-1"
  disabled={submitting}
>
  <X className="w-4 h-4 mr-2" />
  {t('cancel')}
</Button>

              <Button
  type="submit"
  disabled={submitting || uploading || formData.vehicle_images.length === 0}
  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
>
  {submitting ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin mr-2" />
      {t('submitting')}
    </>
  ) : (
    <>
      <FileText className="w-4 h-4 mr-2" />
      {t('submit_application')}
    </>
  )}
</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <Button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
                    