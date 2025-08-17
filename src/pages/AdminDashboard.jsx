// import React, { useState, useEffect } from "react";
// import { User } from "@/api/entities";
// import { Reservation } from "@/api/entities";
// import { Vehicle } from "@/api/entities";
// import { createPageUrl } from "@/utils";
// import { useTranslation, getDirection } from "@/components/utils/translations";
// import { Card, CardContent, CardHeader } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// // Remove this line: import { addReservationToSheet } from '@/api/googleSheets';
// const API_BASE_URL = 'http://localhost:3001'; // or process.env.REACT_APP_API_URL in production


// import { 
//   BarChart3, 
//   DollarSign, 
//   Calendar, 
//   Users,
//   Truck,
//   CreditCard,
//   Search,
//   Shield,
//   AlertCircle,Phone
// } from "lucide-react";
// import { Alert, AlertDescription } from "@/components/ui/alert";

// import AdminStats from "../components/admin/AdminStats";
// import ReservationsList from "../components/admin/ReservationsList";
// import PaymentManager from "../components/admin/PaymentManager";
// import VehicleManager from "../components/admin/VehicleManager";

// export default function AdminDashboard() {
//   const [user, setUser] = useState(null);
//   const [language, setLanguage] = useState('ar');
//   const [reservations, setReservations] = useState([]);
//   const [vehicles, setVehicles] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterStatus, setFilterStatus] = useState('all');
//   const [filterPayment, setFilterPayment] = useState('all');
//   const { t } = useTranslation(language);
//   const [phoneFilter, setPhoneFilter] = useState('');
//   const [vehicleFilter, setVehicleFilter] = useState('');

//   useEffect(() => {
//     loadData();
//   }, []);
//   useEffect(() => {
//   if (reservations.length && vehicles.length && users.length) {
//     loadAllReservationsToSheets();
//   }
// }, [reservations, vehicles, users]);

//   const loadData = async () => {
//     try {
//       const userData = await User.me();
//       setUser(userData);
//       setLanguage(userData.preferred_language || 'ar');

//       // Check if user is admin
//       if (!userData.is_admin) {
//         return; // Will show access denied message
//       }

//       const [reservationData, vehicleData, usersData] = await Promise.all([
//         Reservation.list('-created_date'),
//         Vehicle.list(),
//         User.list()
//       ]);

//       setReservations(reservationData);
//       setVehicles(vehicleData);
//       setUsers(usersData);
//     } catch (error) {
//       console.error('Error loading data:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };
// const loadAllReservationsToSheets = async () => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/api/sheets/add-all-reservations`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         reservations,
//         vehicles,
//         users
//       })
//     });

//     if (!response.ok) {
//       throw new Error('Failed to add reservations to sheets');
//     }

//     console.log('All reservations added to sheets successfully');
//   } catch (error) {
//     console.error('Error adding all reservations:', error);
//   }
// };

//   // Replace the old function with this new one
//   const addReservationToSheet = async (reservation, vehicle, user) => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/api/sheets/add-reservation`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         reservation,
//         vehicle,
//         user
//       })
//     });

//     if (!response.ok) {
//       throw new Error('Failed to add reservation to sheet');
//     }

//     const result = await response.json();
//     console.log('Reservation added to sheet:', result);
//     return result;
//   } catch (error) {
//     console.error('Error adding reservation to sheet:', error);
//     throw error;
//   }
// };

//   // Update this function to handle the new API call
//   const handleReservationUpdate = async (reservationId, updates) => {
//     try {
//       // Update in database
//       await Reservation.update(reservationId, updates);
      
//       // Get full reservation data
//       const reservation = reservations.find(r => r.id === reservationId);
//       const vehicle = vehicles.find(v => v.id === reservation.vehicle_id);
//       const user = users.find(u => u.id === reservation.user_id);
      
//       // Update in Google Sheet via backend API
//       await addReservationToSheet({...reservation, ...updates}, vehicle, user);
      
//       // Refresh data
//       loadData();
//     } catch (error) {
//       console.error('Error updating reservation:', error);
//     }
//   };

//   const filteredReservations = reservations.filter(reservation => {
//     const matchesSearch = reservation.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          reservation.delivery_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          users.find(u => u.id === reservation.user_id)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
//     const matchesStatus = filterStatus === 'all' || reservation.status === filterStatus;
//     const matchesPayment = filterPayment === 'all' || reservation.payment_status === filterPayment;
    
//     const matchesPhone = !phoneFilter || 
//       users.find(u => u.id === reservation.user_id)?.phone?.includes(phoneFilter);
    
//     const matchesVehicle = !vehicleFilter || 
//       vehicles.find(v => v.id === reservation.vehicle_id)?.license_plate?.toLowerCase().includes(vehicleFilter.toLowerCase());
    
//     return matchesSearch && matchesStatus && matchesPayment && matchesPhone && matchesVehicle;
//   });

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center" dir={getDirection(language)}>
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
//           <p className="text-gray-600 text-lg font-medium">{t('loading')}</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user?.is_admin) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4" dir={getDirection(language)}>
//         <div className="text-center max-w-md">
//           <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
//             <Shield className="w-12 h-12 text-red-500" />
//           </div>
//           <h2 className="text-2xl font-bold text-gray-900 mb-4">
//             {language === 'ar' ? 'الوصول مرفوض' : language === 'he' ? 'גישה נדחתה' : 'Access Denied'}
//           </h2>
//           <p className="text-gray-600 mb-6">
//             {language === 'ar' ? 'هذه الصفحة مخصصة للإداريين فقط' : 
//              language === 'he' ? 'עמוד זה מיועד למנהלים בלבד' : 
//              'This page is for administrators only'}
//           </p>
//           <Button 
//             onClick={() => window.location.href = createPageUrl("Booking")}
//             className="gradient-red text-white hover:opacity-90 rounded-xl"
//           >
//             {language === 'ar' ? 'العودة للصفحة الرئيسية' : 
//              language === 'he' ? 'חזור לעמוד הראשי' : 
//              'Back to Main Page'}
//           </Button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 lg:p-8" dir={getDirection(language)}>
//       <div className="max-w-7xl mx-auto">
//         {/* <Button 
//   onClick={loadAllReservationsToSheets}
//   className="gradient-red text-white hover:opacity-90"
// >
//   {language === 'ar' ? 'مزامنة مع Sheets' : 
//    language === 'he' ? 'סנכרן עם Sheets' : 
//    'Sync with Sheets'}
// </Button> */}
//         {/* Header */}
//         <div className="mb-8">
//           <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
//             <div className="w-12 h-12 gradient-red rounded-xl flex items-center justify-center shadow-premium">
//               <Shield className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">
//                 {t('admin_dashboard')}
//               </h1>
//               <p className="text-gray-600 mt-1">
//                 {language === 'ar' ? 'إدارة الحجوزات والمدفوعات والمركبات' : 
//                  language === 'he' ? 'ניהול הזמנות, תשלומים ורכבים' : 
//                  'Manage reservations, payments and vehicles'}
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Statistics */}
//         <AdminStats 
//           reservations={reservations}
//           vehicles={vehicles}
//           users={users}
//           language={language}
//         />

//         {/* Main Content */}
//         <div className="mt-8">
//           <Tabs defaultValue="reservations" className="space-y-6">
//             <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-xl p-1">
//               <TabsTrigger value="reservations" className="rounded-lg font-semibold">
//                 {t('reservations')}
//               </TabsTrigger>
//               <TabsTrigger value="payments" className="rounded-lg font-semibold">
//                 {t('payments')}
//               </TabsTrigger>
//               <TabsTrigger value="vehicles" className="rounded-lg font-semibold">
//                 {language === 'ar' ? 'المركبات' : language === 'he' ? 'רכבים' : 'Vehicles'}
//               </TabsTrigger>
//             </TabsList>

//             <TabsContent value="reservations" className="space-y-6">
//               {/* Filters */}
//               <div className="card-premium p-6" dir={getDirection(language)}>
//                 <div className="flex flex-col gap-4">
//                   {/* Search Row */}
//                   <div className="flex gap-4">
//                     {/* Main Search */}
//                     <div className="relative flex-1">
//                       <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                       <Input
//                         placeholder={language === 'ar' ? 'بحث حسب الاسم...' : 
//                                    language === 'he' ? 'חיפוש לפי שם...' : 
//                                    'Search by name...'}
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                         className="pl-9 rtl:pr-9 rtl:pl-3"
//                       />
//                     </div>

//                     {/* Phone Search */}
//                     <div className="relative flex-1">
//                       <Phone className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                       <Input
//                         placeholder={language === 'ar' ? 'رقم الهاتف...' : 
//                                    language === 'he' ? 'מספר טלפון...' : 
//                                    'Phone number...'}
//                         value={phoneFilter}
//                         onChange={(e) => setPhoneFilter(e.target.value)}
//                         className="pl-9 rtl:pr-9 rtl:pl-3"
//                       />
//                     </div>

//                     {/* Vehicle Search */}
//                     <div className="relative flex-1">
//                       <Truck className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
//                       <Input
//                         placeholder={language === 'ar' ? 'رقم المركبة...' : 
//                                    language === 'he' ? 'מספר רכב...' : 
//                                    'Vehicle number...'}
//                         value={vehicleFilter}
//                         onChange={(e) => setVehicleFilter(e.target.value)}
//                         className="pl-9 rtl:pr-9 rtl:pl-3"
//                       />
//                     </div>

//                     {/* Status Filter */}
//                     <select
//                       value={filterStatus}
//                       onChange={(e) => setFilterStatus(e.target.value)}
//                       className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 min-w-[120px]"
//                     >
//                       <option value="all">
//                         {language === 'ar' ? 'كل الحالات' : 
//                          language === 'he' ? 'כל הסטטוסים' : 
//                          'All Status'}
//                       </option>
//                       <option value="pending">{t('pending')}</option>
//                       <option value="confirmed">{t('confirmed')}</option>
//                       <option value="in_progress">{t('in_progress')}</option>
//                       <option value="completed">{t('completed')}</option>
//                       <option value="cancelled">{t('cancelled')}</option>
//                     </select>

//                     {/* Payment Filter */}
//                     <select
//                       value={filterPayment}
//                       onChange={(e) => setFilterPayment(e.target.value)}
//                       className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 min-w-[120px]"
//                     >
//                       <option value="all">
//                         {language === 'ar' ? 'كل المدفوعات' : 
//                          language === 'he' ? 'כל התשלומים' : 
//                          'All Payments'}
//                       </option>
//                       <option value="unpaid">{t('unpaid')}</option>
//                       <option value="partial">{t('partial')}</option>
//                       <option value="paid">{t('paid')}</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>

//               <ReservationsList 
//                 reservations={filteredReservations}
//                 vehicles={vehicles}
//                 users={users}
//                 language={language}
//                 onReservationUpdate={handleReservationUpdate}
//               />
//             </TabsContent>

//             <TabsContent value="payments" className="space-y-6">
//               <PaymentManager 
//                 reservations={reservations.filter(r => r.payment_status !== 'paid')}
//                 vehicles={vehicles}
//                 users={users}
//                 language={language}
//                 onPaymentUpdate={loadData}
//               />
//             </TabsContent>

//             <TabsContent value="vehicles" className="space-y-6">
//               <VehicleManager 
//                 vehicles={vehicles}
//                 language={language}
//                 onVehicleUpdate={loadData}
//               />
//             </TabsContent>
//           </Tabs>
//         </div>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Reservation } from "@/api/entities";
import { Vehicle } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { useTranslation, getDirection } from "@/components/utils/translations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE_URL = 'http://localhost:3001';

import { 
  BarChart3, 
  DollarSign, 
  Calendar, 
  Users,
  Truck,
  CreditCard,
  Search,
  Shield,
  AlertCircle,
  Table,
  Phone
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

import AdminStats from "../components/admin/AdminStats";
import ReservationsList from "../components/admin/ReservationsList";
import PaymentManager from "../components/admin/PaymentManager";
import VehicleManager from "../components/admin/VehicleManager";
import ReservationsTable from "../components/admin/ReservationsTable";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('ar');
  const [reservations, setReservations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const { t } = useTranslation(language);

  useEffect(() => {
    loadData();
  }, []);

  // useEffect(() => {
  //   if (reservations.length && vehicles.length && users.length) {
  //     loadAllReservationsToSheets();
  //   }
  // }, [reservations, vehicles, users]);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setLanguage(userData.preferred_language || 'ar');

      if (!userData.is_admin) {
        return;
      }

      const [reservationData, vehicleData, usersData] = await Promise.all([
        Reservation.list('-created_date'),
        Vehicle.list(),
        User.list()
      ]);

      setReservations(reservationData);
      setVehicles(vehicleData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // const loadAllReservationsToSheets = async () => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/api/sheets/add-all-reservations`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         reservations,
  //         vehicles,
  //         users
  //       })
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to add reservations to sheets');
  //     }

  //     console.log('All reservations added to sheets successfully');
  //   } catch (error) {
  //     console.error('Error adding all reservations:', error);
  //   }
  // };

  // const addReservationToSheet = async (reservation, vehicle, user) => {
  //   try {
  //     const response = await fetch(`${API_BASE_URL}/api/sheets/add-reservation`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         reservation,
  //         vehicle,
  //         user
  //       })
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to add reservation to sheet');
  //     }

  //     const result = await response.json();
  //     console.log('Reservation added to sheet:', result);
  //     return result;
  //   } catch (error) {
  //     console.error('Error adding reservation to sheet:', error);
  //     throw error;
  //   }
  // };

  const handleReservationUpdate = async (reservationId, updates) => {
    try {
      await Reservation.update(reservationId, updates);
      
      const reservation = reservations.find(r => r.id === reservationId);
      const vehicle = vehicles.find(v => v.id === reservation.vehicle_id);
      const user = users.find(u => u.id === reservation.user_id);
      
      await addReservationToSheet({...reservation, ...updates}, vehicle, user);
      
      loadData();
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reservation.delivery_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         users.find(u => u.id === reservation.user_id)?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || reservation.status === filterStatus;
    const matchesPayment = filterPayment === 'all' || reservation.payment_status === filterPayment;
    
    const matchesPhone = !phoneFilter || 
      users.find(u => u.id === reservation.user_id)?.phone?.includes(phoneFilter);
    
    const matchesVehicle = !vehicleFilter || 
      vehicles.find(v => v.id === reservation.vehicle_id)?.license_plate?.toLowerCase().includes(vehicleFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesPayment && matchesPhone && matchesVehicle;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center" dir={getDirection(language)}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4" dir={getDirection(language)}>
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {language === 'ar' ? 'الوصول مرفوض' : language === 'he' ? 'גישה נדחתה' : 'Access Denied'}
          </h2>
          <p className="text-gray-600 mb-6">
            {language === 'ar' ? 'هذه الصفحة مخصصة للإداريين فقط' : 
             language === 'he' ? 'עמוד זה מיועד למנהלים בלבד' : 
             'This page is for administrators only'}
          </p>
          <Button 
            onClick={() => window.location.href = createPageUrl("Booking")}
            className="gradient-red text-white hover:opacity-90 rounded-xl"
          >
            {language === 'ar' ? 'العودة للصفحة الرئيسية' : 
             language === 'he' ? 'חזור לעמוד הראשי' : 
             'Back to Main Page'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 lg:p-8" dir={getDirection(language)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
            <div className="w-12 h-12 gradient-red rounded-xl flex items-center justify-center shadow-premium">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('admin_dashboard')}
              </h1>
              <p className="text-gray-600 mt-1">
                {language === 'ar' ? 'إدارة الحجوزات والمدفوعات والمركبات' : 
                 language === 'he' ? 'ניהול הזמנות, תשלומים ורכבים' : 
                 'Manage reservations, payments and vehicles'}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <AdminStats 
          reservations={reservations}
          vehicles={vehicles}
          users={users}
          language={language}
        />

        {/* Main Content */}
        <div className="mt-8">
          <Tabs defaultValue="table" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-xl p-1">
              <TabsTrigger value="table" className="rounded-lg font-semibold">
                <Table className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                {language === 'ar' ? 'جدول الحجوزات' : language === 'he' ? 'טבלת הזמנות' : 'Reservations Table'}
              </TabsTrigger>
              <TabsTrigger value="reservations" className="rounded-lg font-semibold">
                {t('reservations')}
              </TabsTrigger>
              <TabsTrigger value="payments" className="rounded-lg font-semibold">
                {t('payments')}
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="rounded-lg font-semibold">
                {language === 'ar' ? 'المركبات' : language === 'he' ? 'רכבים' : 'Vehicles'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="space-y-6">
              {/* Advanced Filters */}
              
           
              

              <ReservationsTable 
                reservations={filteredReservations}
                vehicles={vehicles}
                users={users}
                language={language}
                onReservationUpdate={handleReservationUpdate}
              />
            </TabsContent>

            <TabsContent value="reservations" className="space-y-6">
              {/* Simple Filters */}
              <div className="card-premium p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder={language === 'ar' ? 'بحث في الحجوزات...' : 
                                   language === 'he' ? 'חיפוש בהזמנות...' : 
                                   'Search reservations...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 rtl:pr-10 rtl:pl-3 h-12 rounded-xl border-gray-200"
                      />
                    </div>
                  </div>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl bg-white font-medium text-gray-700 min-w-36"
                  >
                    <option value="all">{language === 'ar' ? 'كل الحالات' : language === 'he' ? 'כל הסטטוסים' : 'All Status'}</option>
                    <option value="pending">{t('pending')}</option>
                    <option value="confirmed">{t('confirmed')}</option>
                    <option value="in_progress">{t('in_progress')}</option>
                    <option value="completed">{t('completed')}</option>
                    <option value="cancelled">{t('cancelled')}</option>
                  </select>
                  
                  <select
                    value={filterPayment}
                    onChange={(e) => setFilterPayment(e.target.value)}
                    className="px-4 py-3 border border-gray-200 rounded-xl bg-white font-medium text-gray-700 min-w-36"
                  >
                    <option value="all">{language === 'ar' ? 'كل المدفوعات' : language === 'he' ? 'כל התשלומים' : 'All Payments'}</option>
                    <option value="unpaid">{t('unpaid')}</option>
                    <option value="partial">{t('partial')}</option>
                    <option value="paid">{t('paid')}</option>
                  </select>
                </div>
              </div>

              <ReservationsList 
                reservations={filteredReservations}
                vehicles={vehicles}
                users={users}
                language={language}
                onReservationUpdate={handleReservationUpdate}
              />
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <PaymentManager 
                reservations={reservations.filter(r => r.payment_status !== 'paid')}
                vehicles={vehicles}
                users={users}
                language={language}
                onPaymentUpdate={loadData}
              />
            </TabsContent>

            <TabsContent value="vehicles" className="space-y-6">
              <VehicleManager 
                vehicles={vehicles}
                language={language}
                onVehicleUpdate={loadData}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}