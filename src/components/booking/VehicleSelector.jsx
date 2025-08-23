import React, { useState, useEffect } from 'react';
import { Vehicle } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Loader2, 
  Clock,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const VehicleCard = ({ vehicle, selected, onSelect, t, isRTL, language }) => {
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getVehicleName = (vehicle) => {
    return vehicle[`name_${language}`] || vehicle.name_ar || vehicle.name || 'Vehicle';
  };

  const getVehicleCapacity = (vehicle) => {
    return vehicle[`capacity_${language}`] || vehicle.capacity_ar || vehicle.capacity || '';
  };

  const vehicleName = getVehicleName(vehicle);
  const capacity = getVehicleCapacity(vehicle);
  const images = vehicle.images || [];
  const hasMultipleImages = images.length > 1;
  
  // Reset image index when vehicle changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageLoaded(false);
    setImageError(false);
  }, [vehicle.id]);

  const nextImage = (e) => {
    e.stopPropagation();
    setImageLoaded(false);
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setImageLoaded(false);
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index, e) => {
    e.stopPropagation();
    setImageLoaded(false);
    setCurrentImageIndex(index);
  };
  
  return (
    <div 
      className={`vehicle-card cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selected ? 'ring-2 ring-red-500 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={() => onSelect(vehicle)}
    >
      <div className="vehicle-image-container relative overflow-hidden rounded-t-xl h-48">
        {images.length > 0 && !imageError ? (
          <>
            <img 
              src={images[currentImageIndex]}
              alt={`${vehicleName} - ${currentImageIndex + 1}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => {
                console.log('Vehicle image loaded:', images[currentImageIndex]);
                setImageLoaded(true);
              }}
              onError={(e) => {
                console.error('Vehicle image failed to load:', images[currentImageIndex]);
                if (currentImageIndex === 0) {
                  setImageError(true);
                } else {
                  setCurrentImageIndex(0); // Fallback to first image
                }
              }}
            />
            
            {/* Loading placeholder */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}

            {/* Navigation arrows for multiple images */}
{hasMultipleImages && (
  <>
    <button
      onClick={prevImage}
      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-all duration-200 z-10"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
    <button
      onClick={nextImage}
      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full transition-all duration-200 z-10"
    >
      <ChevronRight className="w-4 h-4" />
    </button>
  </>
)}

            {/* Image dots indicator */}
            {hasMultipleImages && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex space-x-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => goToImage(index, e)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentImageIndex 
                        ? 'bg-white' 
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <Truck className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Vehicle info overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h3 className="text-xl font-bold mb-1 drop-shadow-lg">{vehicleName}</h3>
          <p className="text-sm opacity-90 drop-shadow">{capacity}</p>
        </div>
        
        {/* Availability badge */}
        <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
          <span className="flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t.available}
          </span>
        </div>

        {/* Image count indicator - now clickable */}
        {hasMultipleImages && (
          <button
            onClick={nextImage}
            className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 text-white px-2 py-1 rounded-full text-xs transition-all duration-200"
          >
            {currentImageIndex + 1}/{images.length}
          </button>
        )}
      </div>

      <div className="vehicle-info p-4">
        <div className="flex justify-between items-center">
          <div className="price-tag text-lg font-bold text-gray-900">
            {vehicle.price_per_hour} {vehicle.currency}
            <div className="text-sm text-gray-500 font-normal">
              {t.perHour}
            </div>
          </div>
          
          <Button
            size="sm"
            className={`rounded-xl transition-all duration-200 ${
              selected
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
                : 'gradient-tandaro text-white hover:opacity-90'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(vehicle);
            }}
          >
            {selected ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                
              </>
            ) : t.select}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Rest of your VehicleSelector component remains the same...
const VehicleSelector = ({ 
  language = 'ar', 
  onVehicleSelect, 
  selectedVehicle,
  onBack, // Changed from onPrevious to onBack
  onNext
}) => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const translations = {
      ar: {
        title: 'اختر المركبة المناسبة',
        subtitle: 'لدينا مركبات متنوعة لتناسب احتياجاتك',
        available: 'متاح',
        unavailable: 'غير متاح',
        perHour: 'شيكل/الساعة',
        capacity: 'السعة',
        noVehicles: 'لا توجد مركبات متاحة حالياً',
        tryAgain: 'المحاولة لاحقاً أو',
        contactUs: 'التصال بنا',
        loading: 'جاري تحميل المركبات...',
        error: 'خطأ في تحميل المركبات',
        select: 'اختيار',
        next: 'التالي',
        previous: 'السابق',
        service_type: 'نوع الخدمة',
        vehicle_selection: 'اختيار المركبة',
        date_time: 'التاريخ والوقت',
        confirmation: 'تأكيد الحجز'
      },
      he: {
        title: 'בחר את הרכב המתאים',
        subtitle: 'יש לנו רכבים מגוונים המתאימים לצרכים שלך',
        available: 'זמין',
        unavailable: 'לא זמין',
        perHour: 'שקל/שעה',
        capacity: 'קיבולת',
        noVehicles: 'אין רכבים זמינים כרגע',
        tryAgain: 'נסה שוב מאוחר יותר או',
        contactUs: 'צור קשר',
        loading: 'טוען רכבים...',
        error: 'שגיאה בטעינת רכבים',
        select: 'בחר',
        next: 'הבא',
        previous: 'הקודם',
        service_type: 'סוג השירות',
        vehicle_selection: 'בחירת רכב',
        date_time: 'תאריך ושעה',
        confirmation: 'אישור הזמנה'
      },
      en: {
        title: 'Choose the Right Vehicle',
        subtitle: 'We have various vehicles to suit your needs',
        available: 'Available',
        unavailable: 'Unavailable',
        perHour: 'NIS/Hour',
        capacity: 'Capacity',
        noVehicles: 'No vehicles currently available',
        tryAgain: 'Try again later or',
        contactUs: 'contact us',
        loading: 'Loading vehicles...',
        error: 'Error loading vehicles',
        select: 'Select',
        next: 'Next',
        previous: 'Previous',
        service_type: 'Service Type',
        vehicle_selection: 'Vehicle Selection',
        date_time: 'Date & Time',
        confirmation: 'Confirmation'
      },
    };

    const t = translations[language] || translations.en;
    const isRTL = language === 'ar' || language === 'he';

    useEffect(() => {
      loadVehicles();
    }, []);

    const loadVehicles = async () => {
      try {
        setLoading(true);
        setError(null);
        const vehiclesList = await Vehicle.list();
        // Filter only available vehicles
        setVehicles(vehiclesList.filter(v => v.available));
      } catch (err) {
        console.error('Error loading vehicles:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return (
        <div className="text-center py-12" dir={isRTL ? 'rtl' : 'ltr'}>
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-gray-600">{t.loading}</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-12" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.error}</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadVehicles} variant="outline" className="rounded-xl">
            <Clock className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      );
    }

    if (vehicles.length === 0) {
      return (
        <div className="text-center py-12" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Truck className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t.noVehicles}</h3>
          <p className="text-gray-600 mb-6">
            {t.tryAgain} <a href="tel:0539364800" className="text-red-600 hover:underline">{t.contactUs}</a>
          </p>
          <Button onClick={loadVehicles} className="gradient-tandaro text-white rounded-xl">
            <Clock className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            Refresh
          </Button>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-4 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Vehicles Grid */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h2>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                selected={selectedVehicle?.id === vehicle.id}
                onSelect={onVehicleSelect}
                t={t}
                isRTL={isRTL}
                language={language}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              onClick={onBack} // Changed from onPrevious to onBack
              variant="outline"
              className="flex items-center gap-2 rounded-xl"
            >
              {isRTL ? (
                <>
                  <span>{t.previous}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t.previous}</span>
                </>
              )}
            </Button>
            
            <Button
              onClick={onNext}
              disabled={!selectedVehicle}
              className="gradient-tandaro text-white flex items-center gap-2 rounded-xl"
            >
              {isRTL ? (
                <>
                  <span>{t.next}</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>{t.next}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
};

export default VehicleSelector;