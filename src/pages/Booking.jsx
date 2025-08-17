import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Vehicle } from "@/api/entities";
import { Reservation } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

import { 
  Calendar, 
  Clock, 
  Truck, 
  Package, 
  MapPin,
  ArrowRight,
  CheckCircle
} from "lucide-react";

import ServiceSelector from "../components/booking/ServiceSelector";
import VehicleSelector from "../components/booking/VehicleSelector";
import DateTimeSelector from "../components/booking/DateTimeSelector";
import BookingConfirmation from "../components/booking/BookingConfirmation";

export default function Booking() {
  const [user, setUser] = useState(null);
    const { toast } = useToast();

  const [language, setLanguage] = useState('ar');
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    service_type: '',
    vehicle_id: '',
    start_datetime: '',
    duration_hours: 4,
    pickup_location: '',
    delivery_location: '',
    notes: ''
  });
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadUserAndData();
  }, []);

  const loadUserAndData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setLanguage(userData.preferred_language || 'ar');
      
      const vehicleData = await Vehicle.list();
      setVehicles(vehicleData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const t = (ar, en) => language === 'ar' ? ar : en;

  const steps = [
    { 
      number: 1, 
      title: t('نوع الخدمة', 'Service Type'), 
      icon: Package 
    },
    { 
      number: 2, 
      title: t('اختيار المركبة', 'Vehicle Selection'), 
      icon: Truck 
    },
    { 
      number: 3, 
      title: t('التاريخ والوقت', 'Date & Time'), 
      icon: Calendar 
    },
    { 
      number: 4, 
      title: t('تأكيد الحجز', 'Confirmation'), 
      icon: CheckCircle 
    }
  ];

  const updateBookingData = (newData) => {
    setBookingData(prev => ({ ...prev, ...newData }));
  };
  const getProgressWidth = () => {
    if (currentStep === 1) return '0%';
    if (currentStep === steps.length) return '100%';
    return `${((currentStep - 1) / (steps.length - 1)) * 100}%`;
  };
  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <ServiceSelector
            language={language}
            selectedService={bookingData.service_type}
            onServiceSelect={(service) => updateBookingData({ service_type: service })}
            onNext={handleNextStep}
          />
        );
      case 2:
        return (
    <VehicleSelector
      language={language}
      vehicles={vehicles}
      selectedVehicle={vehicles.find(v => v.id === bookingData.vehicle_id)}
      onVehicleSelect={(vehicle) => updateBookingData({ vehicle_id: vehicle.id })}
      onNext={handleNextStep}
      onBack={handlePrevStep}
    />
  );
      case 3:
        return (
          <DateTimeSelector
            language={language}
            bookingData={bookingData}
            selectedVehicle={vehicles.find(v => v.id === bookingData.vehicle_id)}
            onDateTimeSelect={(dateTimeData) => updateBookingData(dateTimeData)}
            onNext={handleNextStep}
            onBack={handlePrevStep}
          />
        );
      case 4:
        return (
          <BookingConfirmation
            language={language}
            bookingData={bookingData}
            selectedVehicle={vehicles.find(v => v.id === bookingData.vehicle_id)}
            user={user}
            onConfirm={handleBookingConfirm}
            onBack={handlePrevStep}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

const handleBookingConfirm = async (finalData) => {
  setIsLoading(true);
  try {
    const selectedVehicle = vehicles.find(v => v.id === bookingData.vehicle_id);
    
    // Check if vehicle is already booked for this time
    const existingReservations = await Reservation.filter({
      vehicle_id: selectedVehicle.id,
      status: ['pending', 'confirmed', 'in_progress']
    });

    const startDateTime = new Date(finalData.start_datetime);
    const endDateTime = new Date(startDateTime.getTime() + (finalData.duration_hours * 60 * 60 * 1000));

    const hasOverlap = existingReservations.some(res => {
      const resStart = new Date(res.start_datetime);
      const resEnd = new Date(resStart.getTime() + (res.duration_hours * 60 * 60 * 1000));
      return (startDateTime < resEnd && endDateTime > resStart);
    });

    if (hasOverlap) {
      throw new Error(t('This time slot is already booked'));
    }

    const reservationData = {
      ...finalData,
      user_id: user.id,
      user_name: user.full_name,
      user_phone: user.phone,
      vehicle_id: selectedVehicle.id,
      price_per_hour: selectedVehicle.price_per_hour,
      total_amount: selectedVehicle.price_per_hour * finalData.duration_hours,
      status: 'pending',
      payment_status: 'unpaid',
      created_at: new Date().toISOString()
    };

    await Reservation.create(reservationData);

    toast({
      title: t('Booking confirmed successfully'),
      variant: "success"
    });

    // Redirect to reservations page
    window.location.href = createPageUrl("MyReservations");
  } catch (error) {
    console.error('Error creating reservation:', error);
    toast({
      title: t('Booking error'),
      description: error.message,
      variant: "destructive"
    });
  } finally {
    setIsLoading(false);
  }
};

 return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {t('احجز مركبتك الآن', 'Book Your Vehicle Now')}
          </h1>
          <p className="text-slate-600">
            {t('خدمة توصيل سريعة وموثوقة', 'Fast and reliable delivery service')}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12 relative">
          {/* Progress Line */}
          <div className="absolute top-6 left-[10%] right-[10%] h-1 bg-slate-200">
            <div 
              className="h-full bg-green-500 transition-all duration-300 ease-in-out"
              style={{ width: getProgressWidth() }}
            />
          </div>

          {/* Steps */}
          <div className="flex justify-between relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div 
                  key={step.number} 
                  className={`flex flex-col items-center w-24 transition-all duration-300 ${
                    isActive ? 'transform scale-110' : ''
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3
                    shadow-lg transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isActive 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white text-slate-400 border border-slate-200'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-sm font-medium text-center transition-colors duration-300 ${
                    isActive 
                      ? 'text-red-500' 
                      : isCompleted
                        ? 'text-green-500'
                        : 'text-slate-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}