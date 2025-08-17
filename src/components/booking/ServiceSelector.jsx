import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DriverApplication, User } from "@/api/entities";
import DriverApplicationForm from "@/pages/DriverApplicationForm";
import { 
  Sofa, 
  Hammer, 
  Package2, 
  Truck, 
  Building, 
  MoreHorizontal,
  ArrowRight,
  UserPlus,
  CheckCircle,
  Shield
} from "lucide-react";
import { toast } from "react-hot-toast";

const services = [
  {
    id: 'furniture_pickup',
    icon: Sofa,
    titleAr: 'نقل أثاث',
    titleEn: 'Furniture Pickup',
    descriptionAr: 'نقل الأثاث والأجهزة المنزلية',
    descriptionEn: 'Move furniture and home appliances',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'construction_tools',
    icon: Hammer,
    titleAr: 'أدوات البناء',  
    titleEn: 'Construction Tools',
    descriptionAr: 'نقل أدوات ومعدات البناء',
    descriptionEn: 'Transport construction tools and equipment',
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'materials_transport',
    icon: Package2,
    titleAr: 'نقل مواد',
    titleEn: 'Materials Transport', 
    descriptionAr: 'نقل الخشب، البلاط، والمواد الخام',
    descriptionEn: 'Transport wood, tiles, and raw materials',
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'general_delivery',
    icon: Truck,
    titleAr: 'توصيل عام',
    titleEn: 'General Delivery',
    descriptionAr: 'خدمة توصيل عامة للبضائع',
    descriptionEn: 'General goods delivery service',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'office_move',
    icon: Building,
    titleAr: 'نقل مكاتب',
    titleEn: 'Office Move',
    descriptionAr: 'نقل المكاتب والشركات',
    descriptionEn: 'Office and company relocation',
    color: 'from-indigo-500 to-indigo-600'
  },
  {
    id: 'other',
    icon: MoreHorizontal,
    titleAr: 'أخرى',
    titleEn: 'Other',
    descriptionAr: 'خدمات نقل أخرى',
    descriptionEn: 'Other transport services',
    color: 'from-gray-500 to-gray-600'
  }
];

export default function ServiceSelector({ 
  language, 
  selectedService, 
  onServiceSelect, 
  onNext 
}) {
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [user, setUser] = useState(null);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [showApplicationSuccess, setShowApplicationSuccess] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false); // Add this state
  
  const t = (ar, en) => language === 'ar' ? ar : en;

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      
      if (userData) {
        // Check if user has any driver applications
        const existingApplications = await DriverApplication.filter({ 
          user_id: userData.id 
        });
        
        if (existingApplications.length > 0) {
          const latestApp = existingApplications.sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          )[0];
          setApplicationStatus(latestApp.status);
        }
      }
    } catch (error) {
      console.log('User not authenticated');
    }
  };

  const handleDriverApplication = async () => {
    try {
      // Check if user is logged in
      if (!user) {
        toast.error(t('يرجى تسجيل الدخول أولاً', 'Please login first'));
        return;
      }

      // Check if user already has a pending application
      const existingApplications = await DriverApplication.filter({ 
        user_id: user.id,
        status: 'pending' 
      });

      if (existingApplications.length > 0) {
        toast.error(t('لديك طلب قيد المراجعة بالفعل', 'You already have a pending application'));
        return;
      }

      // Show the detailed application form
      setShowDriverForm(true);

    } catch (error) {
      console.error('Error checking driver application:', error);
      toast.error(t('حدث خطأ', 'An error occurred'));
    }
  };

  const handleApplicationSuccess = () => {
    setApplicationStatus('pending');
    setShowApplicationSuccess(true);
    setShowDriverForm(false);
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowApplicationSuccess(false);
    }, 5000);
  };

  // Don't show driver application if user is already a driver or admin
  const shouldShowDriverApplication = user && 
    user.role !== 'driver' && 
    !user.is_admin && 
    applicationStatus !== 'approved';

  return (
    <>
      <div className="space-y-6">
        {/* Application Success Notification */}
        {showApplicationSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3 rtl:ml-3 rtl:mr-0">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-green-800 font-semibold">
                  {t('تم إرسال طلبك بنجاح!', 'Application Sent Successfully!')}
                </h4>
                <p className="text-green-600 text-sm">
                  {t('سيتم مراجعة طلبك من قبل فريق الإدارة قريباً', 'Your application will be reviewed by our admin team soon')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Driver Application Banner */}
        {shouldShowDriverApplication && (
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-center md:text-right">
                  <h3 className="text-lg font-bold text-green-800 mb-1">
                    {t('انضم إلى فريقنا كسائق!', 'Join our team as a driver!')}
                  </h3>
                  <p className="text-green-600 text-sm">
                    {t('هل لديك مركبة وتود زيادة دخلك؟ قدم طلبك الآن', 'Do you have a vehicle and want to increase your income? Apply now')}
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleDriverApplication}
                disabled={isSubmittingApplication || applicationStatus === 'pending'}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {applicationStatus === 'pending' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('تم الإرسال', 'Submitted')}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('قدم الآن', 'Apply Now')}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {t('ما نوع الخدمة التي تحتاجها؟', 'What type of service do you need?')}
          </h2>
          <p className="text-slate-600">
            {t('اختر نوع الخدمة المناسبة لاحتياجاتك', 'Choose the service type that fits your needs')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            const isSelected = selectedService === service.id;
            
            return (
              <Card 
                key={service.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  isSelected 
                    ? 'ring-2 ring-red-500 shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => onServiceSelect(service.id)}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {language === 'ar' ? service.titleAr : service.titleEn}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {language === 'ar' ? service.descriptionAr : service.descriptionEn}
                  </p>
                  
                  {isSelected && (
                    <div className="mt-4 flex justify-center">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

                {/* Next button for regular services */}
        {selectedService && (
          <div className="flex justify-center">
            <Button
              onClick={onNext}
              disabled={!selectedService}
              className="px-8 py-3 gradient-red text-white hover:opacity-90 disabled:opacity-50"
              size="lg"
            >
              <span>{t('التالي', 'Next')}</span>
              <ArrowRight className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0 rtl:rotate-180" />
            </Button>
          </div>
        )}
      </div>

      {/* Driver Application Form Modal */}
      {showDriverForm && (
        <DriverApplicationForm
          language={language}
          onClose={() => setShowDriverForm(false)}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </>
  );
}