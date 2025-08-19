import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Reservation } from "@/api/entities";
import { useTranslation } from "@/components/utils/translations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import { format, isToday, isFuture, isPast } from "date-fns";
import { toast } from "react-hot-toast";

import JobCard from "../components/driver/JobCard";
import NotificationService from "@/api/NotificationService"; // Add this import


export default function DriverJobs() {
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('ar');
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    todayJobs: 0
  });

  const { t } = useTranslation(language);

  useEffect(() => {
    loadData();
  }, []);

   useEffect(() => {
    if (user && user.role === 'driver') {
      // Request notification permission
      NotificationService.requestNotificationPermission();

      // Start listening for job assignments
      const unsubscribe = NotificationService.listenForJobAssignments(
        user.id,
        (newJob) => {
          console.log('New job assigned:', newJob);
          // Refresh the jobs list to show the new assignment
          loadData();
        },
        language
      );

      // Cleanup listener when component unmounts or user changes
      return () => {
        NotificationService.stopListening(user.id);
      };
    }
  }, [user, language]);

    const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setLanguage(userData.preferred_language || 'ar');

      if (userData.role !== 'driver') {
        toast.error('Access denied - Driver role required');
        return;
      }

      const jobsData = await Reservation.filter({ 
        assigned_driver_id: userData.id 
      }, '-start_datetime');

      setJobs(jobsData);
      
      // Calculate stats
      const completed = jobsData.filter(job => job.status === 'completed');
      const today = jobsData.filter(job => isToday(new Date(job.start_datetime)));
      const totalEarnings = completed.reduce((sum, job) => sum + (job.amount_paid || 0), 0);
      
      setStats({
        totalJobs: jobsData.length,
        completedJobs: completed.length,
        totalEarnings,
        todayJobs: today.length
      });
      
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Error loading jobs');
    } finally {
      setIsLoading(false);
    }
  };


  const handleStatusUpdate = async (jobId, newStatus, timestamps = {}) => {
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...timestamps
      };

      await Reservation.update(jobId, updateData);
      
      // Show appropriate toast message based on status
      let message = '';
      switch(newStatus) {
        case 'in_progress':
          message = t('تم بدء المهمة', 'Job started');
          break;
        case 'completed':
          message = t('تم إكمال المهمة', 'Job completed');
          break;
        case 'cancelled':
          message = t('تم إلغاء المهمة', 'Job cancelled');
          break;
        case 'confirmed':
          message = t('تم تأكيد المهمة', 'Job confirmed');
          break;
        default:
          message = t('تم تحديث الحالة', 'Status updated');
      }
      
      toast.success(message);
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(t('خطأ في تحديث الحالة', 'Error updating status'));
    }
  };

  const todayJobs = jobs.filter(job => {
    const jobDate = new Date(job.start_datetime);
    return isToday(jobDate) && ['pending', 'confirmed', 'in_progress'].includes(job.status);
  });

  const upcomingJobs = jobs.filter(job => {
    const jobDate = new Date(job.start_datetime);
    return isFuture(jobDate) && ['pending', 'confirmed'].includes(job.status);
  });

  const completedJobs = jobs.filter(job => {
    return ['completed', 'cancelled'].includes(job.status);
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">{t('جاري التحميل...', 'Loading...')}</p>
        </div>
      </div>
    );
  }

  if (user?.role !== 'driver') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Truck className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('الوصول مرفوض', 'Access Denied')}
          </h2>
          <p className="text-gray-600">
            {t('هذه الصفحة مخصصة للسائقين فقط', 'This page is for drivers only')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-6">
            <div className="w-12 h-12 gradient-red rounded-xl flex items-center justify-center shadow-premium">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('مهامي', 'My Jobs')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('إدارة ومتابعة مهام التوصيل', 'Manage and track delivery tasks')}
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="card-premium p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('إجمالي المهام', 'Total Jobs')}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.totalJobs}</p>
                </div>
              </div>
            </Card>

            <Card className="card-premium p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('مكتملة', 'Completed')}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.completedJobs}</p>
                </div>
              </div>
            </Card>

            <Card className="card-premium p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('الأرباح', 'Earnings')}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.totalEarnings} {t('شيكل', 'NIS')}</p>
                </div>
              </div>
            </Card>

            <Card className="card-premium p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('اليوم', 'Today')}</p>
                  <p className="text-lg font-bold text-gray-900">{stats.todayJobs}</p>
                </div>
              </div>
            </Card>
          </div>
          {/* Notification Status */}
<div className="mb-4">
  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
    <div className="flex items-center space-x-2 rtl:space-x-reverse">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      <span className="text-sm text-blue-800">
        {t('إشعارات المهام مفعلة', 'Job notifications active', 'התראות משימות פעילות')}
      </span>
    </div>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => NotificationService.requestNotificationPermission()}
      className="text-blue-600 hover:bg-blue-100"
    >
      {t('تفعيل الإشعارات', 'Enable Notifications', 'אפשר התראות')}
    </Button>
  </div>
</div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-xl p-1">
            <TabsTrigger value="today" className="rounded-lg font-semibold">
              {t('اليوم', 'Today')} ({todayJobs.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-lg font-semibold">
              {t('القادمة', 'Upcoming')} ({upcomingJobs.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg font-semibold">
              {t('مكتملة', 'Completed')} ({completedJobs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {todayJobs.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {t('لا توجد مهام اليوم', 'No jobs today')}
                </h3>
                <p className="text-gray-500">
                  {t('لا توجد مهام مجدولة لهذا اليوم', 'No jobs scheduled for today')}
                </p>
              </div>
            ) : (
              todayJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  language={language}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingJobs.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {t('لا توجد مهام قادمة', 'No upcoming jobs')}
                </h3>
                <p className="text-gray-500">
                  {t('لا توجد مهام مجدولة للأيام القادمة', 'No jobs scheduled for the coming days')}
                </p>
              </div>
            ) : (
              upcomingJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  language={language}
                  onStatusUpdate={handleStatusUpdate}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedJobs.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {t('لا توجد مهام مكتملة', 'No completed jobs')}
                </h3>
                <p className="text-gray-500">
                  {t('لم يتم إكمال أي مهام بعد', 'No jobs completed yet')}
                </p>
              </div>
            ) : (
              completedJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  language={language}
                  onStatusUpdate={handleStatusUpdate}
                  readonly={job.status === 'completed'}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}