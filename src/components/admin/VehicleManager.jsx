import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Vehicle } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useRef } from 'react';

import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Camera,
  ImageIcon,
  Loader2,
  Upload,
  Eye
} from "lucide-react";

export default function VehicleManager({ vehicles, language, onVehicleUpdate }) {
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const { toast } = useToast();

  const [newVehicle, setNewVehicle] = useState({
    name_ar: '',
    name_he: '',
    name_en: '',
    type: 'pickup',
    capacity_ar: '',
    capacity_he: '',
    capacity_en: '',
    price_per_hour: 0,
    currency: 'شيكل',
    license_plate: '',
    available: true,
    features_ar: [],
    features_he: [],
    features_en: [],
    images: []
  });

  const vehicleTypes = [
    { value: 'pickup', label_ar: 'بيك أب', label_he: 'טנדר', label_en: 'Pickup Truck' },
    { value: 'small-truck', label_ar: 'شاحنة صغيرة', label_he: 'משאית קטנה', label_en: 'Small Truck' },
    { value: 'large-truck', label_ar: 'شاحنة كبيرة', label_he: 'משאית גדולה', label_en: 'Large Truck' },
    { value: 'van', label_ar: 'فان', label_he: 'טרנזיט', label_en: 'Van' }
  ];

  const translations = {
    ar: {
      vehicleManagement: 'إدارة المركبات',
      addNewVehicle: 'إضافة مركبة جديدة',
      editVehicle: 'تعديل المركبة',
      vehicleName: 'اسم المركبة',
      vehicleType: 'نوع المركبة',
      capacity: 'السعة',
      pricePerHour: 'السعر بالساعة',
      licensePlate: 'رقم اللوحة',
      available: 'متاح',
      unavailable: 'غير متاح',
      features: 'المميزات',
      images: 'الصور',
      addImage: 'إضافة صورة',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      noImages: 'لا توجد صور',
      vehicleAdded: 'تم إضافة المركبة بنجاح',
      vehicleUpdated: 'تم تحديث المركبة بنجاح',
      vehicleDeleted: 'تم حذف المركبة بنجاح',
      imageUploaded: 'تم رفع الصورة بنجاح',
      error: 'حدث خطأ',
      uploading: 'جاري الرفع...',
      enterFeatures: 'أدخل المميزات (مفصولة بفاصلة)',
      dragDropImages: 'اسحب الصور هنا أو انقر للرفع',
      maxFileSize: 'الحد الأقصى لحجم الملف 5 ميجابايت',
      invalidFileType: 'نوع الملف غير مدعوم. يرجى رفع صور فقط',
      fileTooLarge: 'الملف كبير جداً. الحد الأقصى 5 ميجابايت'
    },
    he: {
      vehicleManagement: 'ניהול רכבים',
      addNewVehicle: 'הוספת רכב חדש',
      editVehicle: 'עריכת רכב',
      vehicleName: 'שם הרכב',
      vehicleType: 'סוג רכב',
      capacity: 'קיבולת',
      pricePerHour: 'מחיר לשעה',
      licensePlate: 'מספר רישוי',
      available: 'זמין',
      unavailable: 'לא זמין',
      features: 'תכונות',
      images: 'תמונות',
      addImage: 'הוספת תמונה',
      save: 'שמור',
      cancel: 'ביטול',
      delete: 'מחק',
      edit: 'ערוך',
      noImages: 'אין תמונות',
      vehicleAdded: 'הרכב נוסף בהצלחה',
      vehicleUpdated: 'הרכב עודכן בהצלחה',
      vehicleDeleted: 'הרכב נמחק בהצלחה',
      imageUploaded: 'התמונה הועלתה בהצלחה',
      error: 'שגיאה',
      uploading: 'מעלה...',
      enterFeatures: 'הכנס תכונות (מופרדות בפסיק)',
      dragDropImages: 'גרור תמונות כאן או לחץ להעלאה',
      maxFileSize: 'גודל מקסימלי 5 מגה',
      invalidFileType: 'סוג קובץ לא נתמך. יש להעלות תמונות בלבד',
      fileTooLarge: 'הקובץ גדול מדי. מקסימום 5 מגה'
    },
    en: {
      vehicleManagement: 'Vehicle Management',
      addNewVehicle: 'Add New Vehicle',
      editVehicle: 'Edit Vehicle',
      vehicleName: 'Vehicle Name',
      vehicleType: 'Vehicle Type',
      capacity: 'Capacity',
      pricePerHour: 'Price per Hour',
      licensePlate: 'License Plate',
      available: 'Available',
      unavailable: 'Unavailable',
      features: 'Features',
      images: 'Images',
      addImage: 'Add Image',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      noImages: 'No Images',
      vehicleAdded: 'Vehicle added successfully',
      vehicleUpdated: 'Vehicle updated successfully',
      vehicleDeleted: 'Vehicle deleted successfully',
      imageUploaded: 'Image uploaded successfully',
      error: 'Error occurred',
      uploading: 'Uploading...',
      enterFeatures: 'Enter features (comma separated)',
      dragDropImages: 'Drag images here or click to upload',
      maxFileSize: 'Max file size 5MB',
      invalidFileType: 'Unsupported file type. Please upload images only',
      fileTooLarge: 'File too large. Maximum 5MB'
    }
  };

  const showToast = (title, description = '', variant = "default") => {
    toast({
      id: title.toLowerCase().replace(/\s+/g, '-'),
      title,
      description,
      variant,
      duration: 3000,
    });
  };

  const t = translations[language] || translations.en;
  const isRTL = language === 'ar' || language === 'he';

 const handleAddVehicle = async (formData) => {
  setLoading(true);
  try {
    console.log('Saving vehicle with data:', formData);
    
    const result = await Vehicle.create(formData);
    console.log('Vehicle saved:', result);
    
    showToast(t.vehicleAdded);
    setShowAddForm(false);
    
    // Reset to initial state
    setNewVehicle({
      name_ar: '', name_he: '', name_en: '',
      type: 'pickup',
      capacity_ar: '', capacity_he: '', capacity_en: '',
      price_per_hour: 0, currency: 'شيكل',
      license_plate: '', available: true,
      features_ar: [], features_he: [], features_en: [],
      images: []
    });
    
    await onVehicleUpdate();
  } catch (error) {
    console.error('Error adding vehicle:', error);
    showToast(t.error, error.message, "destructive");
  } finally {
    setLoading(false);
  }
};

  const handleUpdateVehicle = async (vehicleId, updates) => {
    try {
      await Vehicle.update(vehicleId, updates);
      showToast(t.vehicleUpdated);
      setEditingVehicle(null);
      await onVehicleUpdate();
    } catch (error) {
      showToast(t.error, error.message, "destructive");
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm(language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 
                     language === 'he' ? 'האם אתה בטוח שתרצה למחוק?' : 
                     'Are you sure you want to delete?')) {
      try {
        await Vehicle.delete(vehicleId);
        showToast(t.vehicleDeleted);
        await onVehicleUpdate();
      } catch (error) {
        showToast(t.error, error.message, "destructive");
      }
    }
  };

  const VehicleForm = ({ vehicle, isNew = false, t, onSave, onCancel, loading, language, isRTL, showToast }) => {
  const [formData, setFormData] = useState({
    name_ar: vehicle?.name_ar || '',
    name_he: vehicle?.name_he || '',
    name_en: vehicle?.name_en || '',
    type: vehicle?.type || 'pickup',
    capacity_ar: vehicle?.capacity_ar || '',
    capacity_he: vehicle?.capacity_he || '',
    capacity_en: vehicle?.capacity_en || '',
    price_per_hour: vehicle?.price_per_hour || 0,
    currency: vehicle?.currency || 'شيكل',
    license_plate: vehicle?.license_plate || '',
    available: vehicle?.available ?? true,
    features_ar: vehicle?.features_ar || [],
    features_he: vehicle?.features_he || [],
    features_en: vehicle?.features_en || [],
    images: vehicle?.images || []
  });

  const [localUploading, setLocalUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  // ADD THIS: Sync formData with parent when vehicle prop changes
  useEffect(() => {
    setFormData({
      name_ar: vehicle?.name_ar || '',
      name_he: vehicle?.name_he || '',
      name_en: vehicle?.name_en || '',
      type: vehicle?.type || 'pickup',
      capacity_ar: vehicle?.capacity_ar || '',
      capacity_he: vehicle?.capacity_he || '',
      capacity_en: vehicle?.capacity_en || '',
      price_per_hour: vehicle?.price_per_hour || 0,
      currency: vehicle?.currency || 'شيكل',
      license_plate: vehicle?.license_plate || '',
      available: vehicle?.available ?? true,
      features_ar: vehicle?.features_ar || [],
      features_he: vehicle?.features_he || [],
      features_en: vehicle?.features_en || [],
      images: vehicle?.images || []
    });
  }, [vehicle]);

  const handleInputChange = (field, value) => {
  if (field === 'price_per_hour') {
    if (value === '' || isNaN(parseFloat(value))) {
      value = 0;
    } else {
      value = parseFloat(value);
    }
  }
  
  setFormData(prev => ({
    ...prev,
    [field]: value
  }));
  // ❌ REMOVE THIS LINE: onSave(newData);
};

    const handleFeatureChange = (lang, value) => {
      const features = value.split(',').map(f => f.trim()).filter(f => f);
      handleInputChange(`features_${lang}`, features);
    };

    const triggerFileInput = () => {
      fileInputRef.current?.click();
    };

    // Validate file
    const validateFile = (file) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error(t.invalidFileType);
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(t.fileTooLarge);
      }
      
      return true;
    };

    // Handle multiple file uploads
// Simpler fix - directly update parent state
const handleMultipleImageUpload = async (files) => {
  setLocalUploading(true);
  
  const validFiles = [];
  try {
    for (let file of files) {
      validateFile(file);
      validFiles.push(file);
    }
  } catch (error) {
    showToast(t.error, error.message, "destructive");
    setLocalUploading(false);
    return;
  }

  console.log(`Starting upload of ${validFiles.length} files`);

  try {
    const uploadPromises = validFiles.map(async (file) => {
      return await UploadFile(file, `vehicles`);
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    console.log('All uploads completed:', uploadedUrls);
    
    // Update both local state AND parent state
    const newImages = [...(formData.images || []), ...uploadedUrls];
    
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
    
    // IMPORTANT: Immediately update parent state
    const updatedFormData = {
      ...formData,
      images: newImages
    };
    onSave(updatedFormData);
    
    showToast('Success', `${validFiles.length} images uploaded successfully`, 'default');
    
  } catch (error) {
    console.error('Upload error:', error);
    showToast(t.error, error.message, "destructive");
  } finally {
    setLocalUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
};

    const handleImageUpload = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        await handleMultipleImageUpload(files);
      }
    };

    const handleImageRemove = (indexToRemove) => {
      const newImages = formData.images.filter((_, index) => index !== indexToRemove);
      handleInputChange('images', newImages);
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
        await handleMultipleImageUpload(files);
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gray-50 rounded-xl" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Names in different languages */}
        <Input
          id="name_ar"
          name="name_ar"
          placeholder={`${t.vehicleName} (عربي)`}
          value={formData.name_ar || ''}
          onChange={(e) => handleInputChange('name_ar', e.target.value)}
          className="rounded-lg"
        />

        <Input
          id="name_he"
          name="name_he"
          placeholder={`${t.vehicleName} (עברית)`}
          value={formData.name_he || ''}
          onChange={(e) => handleInputChange('name_he', e.target.value)}
          className="rounded-lg"
        />

        <Input
          id="name_en"
          name="name_en"
          placeholder={`${t.vehicleName} (English)`}
          value={formData.name_en || ''}
          onChange={(e) => handleInputChange('name_en', e.target.value)}
          className="rounded-lg"
        />
        
        {/* Vehicle Type */}
        <select
          id="vehicle_type"
          name="type"
          value={formData.type}
          onChange={(e) => handleInputChange('type', e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
        >
          {vehicleTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type[`label_${language}`]}
            </option>
          ))}
        </select>

        {/* Capacity in different languages */}
        <Input
          id="capacity_ar"
          name="capacity_ar"
          placeholder={`${t.capacity} (عربي)`}
          value={formData.capacity_ar}
          onChange={(e) => handleInputChange('capacity_ar', e.target.value)}
          className="rounded-lg"
        />
        <Input
          id="capacity_he"
          name="capacity_he"
          placeholder={`${t.capacity} (עברית)`}
          value={formData.capacity_he}
          onChange={(e) => handleInputChange('capacity_he', e.target.value)}
          className="rounded-lg"
        />
        <Input
          id="capacity_en"
          name="capacity_en"
          placeholder={`${t.capacity} (English)`}
          value={formData.capacity_en}
          onChange={(e) => handleInputChange('capacity_en', e.target.value)}
          className="rounded-lg"
        />

        {/* Price and License Plate */}
        <Input
          id="price_per_hour"
          name="price_per_hour"
          type="number"
          min="0"
          step="any"
          placeholder={t.pricePerHour}
          value={formData.price_per_hour || 0}
          onChange={(e) => {
            const val = e.target.value;
            const numVal = val === '' ? 0 : parseFloat(val);
            handleInputChange('price_per_hour', numVal);
          }}
          className="rounded-lg"
        />
        <Input
          id="license_plate"
          name="license_plate"
          placeholder={t.licensePlate}
          value={formData.license_plate}
          onChange={(e) => handleInputChange('license_plate', e.target.value)}
          className="rounded-lg"
        />

        {/* Availability */}
        <select
          id="available"
          name="available"
          value={formData.available}
          onChange={(e) => handleInputChange('available', e.target.value === 'true')}
          className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
        >
          <option value="true">{t.available}</option>
          <option value="false">{t.unavailable}</option>
        </select>

        {/* Features */}
        <Input
          id="features_ar"
          name="features_ar"
          placeholder={`${t.enterFeatures} (عربي)`}
          value={formData.features_ar?.join(', ') || ''}
          onChange={(e) => handleFeatureChange('ar', e.target.value)}
          className="rounded-lg"
        />
        <Input
          id="features_he"
          name="features_he"
          placeholder={`${t.enterFeatures} (עברית)`}
          value={formData.features_he?.join(', ') || ''}
          onChange={(e) => handleFeatureChange('he', e.target.value)}
          className="rounded-lg"
        />
        <Input
          id="features_en"
          name="features_en"
          placeholder={`${t.enterFeatures} (English)`}
          value={formData.features_en?.join(', ') || ''}
          onChange={(e) => handleFeatureChange('en', e.target.value)}
          className="rounded-lg col-span-1 md:col-span-2"
        />

       {/* Enhanced Image Upload Section */}
<div className="col-span-1 md:col-span-2 mt-4">
  <p className="text-sm font-medium text-gray-700 mb-3">
    {t.images} {formData.images?.length > 0 && `(${formData.images.length})`}
  </p>
  
  {/* Debug info - Remove this later */}
  {process.env.NODE_ENV === 'development' && (
    <div className="text-xs text-gray-500 mb-2">
      Debug: {JSON.stringify(formData.images?.length || 0)} images in state
    </div>
  )}
  
  {/* Image Gallery */}
  {formData.images && formData.images.length > 0 ? (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
      {formData.images.map((image, index) => (
        <div key={`${image.substring(image.lastIndexOf('/') + 1)}-${index}`} className="relative group">
          <img 
            src={image} 
            alt={`Vehicle ${index + 1}`} 
            className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setPreviewImage(image)}
            onError={(e) => {
              console.error('Image failed to load:', image);
              // Don't set placeholder, just log error
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', image);
            }}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleImageRemove(index);
            }}
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
  ) : (
    <div className="mb-4">
      <div 
        className={`flex flex-col justify-center items-center h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          dragActive ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onClick={triggerFileInput}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 text-center">
          {t.dragDropImages}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {t.maxFileSize}
        </p>
      </div>
    </div>
  )}
  
  {/* Upload Controls */}
  <div className="flex gap-3">
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleImageUpload}
      className="hidden"
      accept="image/*"
      multiple
    />
    <Button
      type="button"
      variant="outline"
      onClick={triggerFileInput}
      disabled={localUploading}
      className="flex-1"
    >
      {localUploading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          {t.uploading}
        </>
      ) : (
        <>
          <Camera className="w-4 h-4 mr-2" />
          {t.addImage}
        </>
      )}
    </Button>
    
    {formData.images && formData.images.length > 0 && (
      <Button
        type="button"
        variant="ghost"
        onClick={() => setPreviewImage(formData.images[0])}
        className="px-3"
      >
        <Eye className="w-4 h-4" />
      </Button>
    )}
  </div>
  
  {/* Image Counter & Status */}
  {formData.images && formData.images.length > 0 && (
    <div className="mt-3 text-center">
      <p className="text-xs text-gray-500">
        {formData.images.length} {language === 'ar' ? 'صورة' : language === 'he' ? 'תמונות' : 'images'}
      </p>
      <div className="flex flex-wrap gap-1 justify-center mt-1">
        {formData.images.map((_, index) => (
          <div key={index} className="w-2 h-2 bg-green-500 rounded-full"></div>
        ))}
      </div>
    </div>
  )}
</div>

        {/* Action Buttons */}
        <div className="col-span-1 md:col-span-2 flex gap-3 pt-4">
  <Button
    type="button"
    onClick={async () => {
      if (isNew) {
        // For new vehicles, call the parent's handleAddVehicle
        await handleAddVehicle(formData);
      } else {
        // For existing vehicles, call the update function
        onSave(formData);
      }
    }}
    disabled={loading || localUploading}
    className="flex-1 gradient-red text-white rounded-xl"
  >
    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
    {t.save}
  </Button>
  <Button
    type="button"
    onClick={onCancel}
    variant="outline"
    className="flex-1 rounded-xl"
  >
    <X className="w-4 h-4 mr-2" />
    {t.cancel}
  </Button>

        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t.vehicleManagement}</h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="gradient-red text-white rounded-xl flex items-center space-x-2 rtl:space-x-reverse"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addNewVehicle}</span>
        </Button>
      </div>

      {/* Add New Vehicle Form */}
     {showAddForm && (
  <div className="card-premium">
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900">{t.addNewVehicle}</h3>
    </div>
    <VehicleForm 
      vehicle={newVehicle}
      isNew={true} 
      t={t}
      onSave={handleAddVehicle} // ✅ This is correct
      onCancel={() => setShowAddForm(false)}
      loading={loading}
      language={language}
      isRTL={isRTL}
      showToast={showToast}
    />
  </div>
)}

      {/* Vehicles List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="card-premium">
            <div className="p-6">
              {/* Vehicle Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className="w-14 h-14 gradient-red rounded-xl flex items-center justify-center shadow-premium">
                    <Truck className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {vehicle[`name_${language}`] || vehicle.name_ar || vehicle.name || 'Vehicle'}
                    </h3>
                    <p className="text-gray-600">
                      {vehicleTypes.find(t => t.value === vehicle.type)?.[`label_${language}`] || vehicle.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <Badge className={vehicle.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {vehicle.available ? t.available : t.unavailable}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingVehicle(editingVehicle === vehicle.id ? null : vehicle.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    {editingVehicle === vehicle.id ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Edit Form or Vehicle Info */}
             {editingVehicle === vehicle.id ? (
  <VehicleForm 
    vehicle={vehicle}
    isNew={false} 
    t={t}
    onSave={(formData) => handleUpdateVehicle(vehicle.id, formData)} // ✅ Keep this
    onCancel={() => setEditingVehicle(null)}
    loading={loading}
    language={language}
    isRTL={isRTL}
    showToast={showToast}
  />
) : (
                <div>
                  {/* Vehicle Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                    <div>
                      <span className="text-gray-500">{t.capacity}</span>
                      <p className="font-semibold text-gray-900">
                        {vehicle[`capacity_${language}`] || vehicle.capacity_ar || vehicle.capacity}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t.pricePerHour}</span>
                      <p className="font-semibold text-gray-900">
                        {vehicle.price_per_hour} {vehicle.currency}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t.licensePlate}</span>
                      <p className="font-semibold text-gray-900">{vehicle.license_plate}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">{t.images}</span>
                      <p className="font-semibold text-gray-900">{vehicle.images?.length || 0}</p>
                    </div>
                  </div>

                  {/* Features */}
                  {vehicle[`features_${language}`]?.length > 0 && (
                    <div className="mb-6">
                      <span className="text-gray-500 text-sm">{t.features}</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {vehicle[`features_${language}`].map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs rounded-full">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Image Gallery */}
                  {vehicle.images && vehicle.images.length > 0 && (
                    <div>
                      <span className="text-gray-500 text-sm">{t.images}</span>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {vehicle.images.slice(0, 4).map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Vehicle ${index + 1}`}
                              className="w-full h-16 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setPreviewImage(image)}
                            />
                            {index === 3 && vehicle.images.length > 4 && (
                              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
                                <span className="text-white text-xs font-semibold">
                                  +{vehicle.images.length - 3}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {vehicles.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Truck className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {language === 'ar' ? 'لا توجد مركبات' : language === 'he' ? 'אין רכבים' : 'No vehicles'}
          </h3>
          <p className="text-gray-600 mb-6">
            {language === 'ar' ? 'ابدأ بإضافة مركبة جديدة' : language === 'he' ? 'התחל بהוספת רכב חדש' : 'Start by adding a new vehicle'}
          </p>
          <Button
            onClick={() => setShowAddForm(true)}
            className="gradient-red text-white rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t.addNewVehicle}
          </Button>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
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