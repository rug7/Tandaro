
import React, { useState, useEffect, useMemo } from "react";
import { User } from "@/api/entities";
import { Reservation } from "@/api/entities";
import { Vehicle } from "@/api/entities";
import { DriverApplication } from "@/api/entities"; // New import
import { useTranslation } from "@/components/utils/translations";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Filter,
  UserPlus,
  UserX,
  Users,
  Truck,
  Calendar,
  Phone,
  MapPin,
  DollarSign,
  Check, // New import
  X,// New import
  Eye, // ADD THIS
  Image as ImageIcon // ADD THIS
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

import AssignDriverDialog from "../components/admin/AssignDriverDialog";

const statusColors = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  in_progress: { bg: 'bg-purple-100', text: 'text-purple-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' }
};

const paymentStatusColors = {
  unpaid: { bg: 'bg-red-100', text: 'text-red-800' },
  partial: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  paid: { bg: 'bg-green-100', text: 'text-green-800' }
};
const vehicleTypes = [
  { value: 'pickup', label_ar: 'بيك أب', label_en: 'Pickup Truck' },
  { value: 'small-truck', label_ar: 'شاحنة صغيرة', label_en: 'Small Truck' },
  { value: 'large-truck', label_ar: 'شاحنة كبيرة', label_en: 'Large Truck' },
  { value: 'van', label_ar: 'فان', label_en: 'Van' },
  { value: 'other', label_ar: 'أخرى', label_en: 'Other' }
];

export default function AdminDriverPanel() {
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('ar');
  const [reservations, setReservations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New state for driver applications
  const [driverApplications, setDriverApplications] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [driverFilter, setDriverFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

  // Selection and assignment
  const [selectedReservations, setSelectedReservations] = useState([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigningReservation, setAssigningReservation] = useState(null);

  const { t } = useTranslation(language);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
      setLanguage(userData.preferred_language || 'ar');

      if (!userData.is_admin) {
        toast.error('Access denied');
        return;
      }

      const [reservationData, vehicleData, driverData, applicationData] = await Promise.all([
        Reservation.list('-start_datetime'),
        Vehicle.list(),
        User.filter({ role: 'driver' }),
        DriverApplication.filter({ status: 'pending' }) // Fetch pending applications
      ]);

      setReservations(reservationData);
      setVehicles(vehicleData);
      setDrivers(driverData);
      setDriverApplications(applicationData); // Set driver applications
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      // Search filter
      const searchMatch = !searchTerm ||
        reservation.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.user_phone?.includes(searchTerm) ||
        reservation.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.delivery_location?.toLowerCase().includes(searchTerm.toLowerCase());

      // Date filter
      let dateMatch = true;
      if (reservation.start_datetime) {
        const reservationDate = new Date(reservation.start_datetime);
        const now = new Date();

        switch (dateFilter) {
          case 'today':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateMatch = reservationDate >= today && reservationDate < tomorrow;
            break;
          case 'week':
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            dateMatch = reservationDate >= weekStart && reservationDate < weekEnd;
            break;
          case 'month':
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            dateMatch = reservationDate >= monthStart && reservationDate < monthEnd;
            break;
          case 'custom':
            if (customDateRange.start && customDateRange.end) {
              const startDate = new Date(customDateRange.start);
              const endDate = new Date(customDateRange.end);
              endDate.setHours(23, 59, 59, 999);
              dateMatch = reservationDate >= startDate && reservationDate <= endDate;
            }
            break;
        }
      }

      // Other filters
      const vehicleMatch = vehicleFilter === 'all' || reservation.vehicle_id === vehicleFilter;
      const statusMatch = statusFilter === 'all' || reservation.status === statusFilter;
      const paymentMatch = paymentFilter === 'all' || reservation.payment_status === paymentFilter;
      const driverMatch = driverFilter === 'all' ||
        (driverFilter === 'unassigned' && !reservation.assigned_driver_id) ||
        (driverFilter === 'assigned' && reservation.assigned_driver_id) ||
        reservation.assigned_driver_id === driverFilter;

      return searchMatch && dateMatch && vehicleMatch && statusMatch && paymentMatch && driverMatch;
    });
  }, [reservations, searchTerm, dateFilter, vehicleFilter, statusFilter, paymentFilter, driverFilter, customDateRange]);

  const handleAssignDriver = async (reservationIds, driverId, driverPhone) => {
    try {
      // Ensure driverPhone is not undefined
      const phoneValue = driverPhone || null;

      const promises = reservationIds.map(id => {
        const updateData = {
          assigned_driver_id: driverId,
          updated_at: new Date().toISOString()
        };

        // Only add assigned_driver_phone if it's not null/undefined
        if (phoneValue !== null && phoneValue !== undefined) {
          updateData.assigned_driver_phone = phoneValue;
        }

        return Reservation.update(id, updateData);
      });

      await Promise.all(promises);

      setSelectedReservations([]);
      setShowAssignDialog(false);
      setAssigningReservation(null);

      toast.success(t('driver_assigned_success'));
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error(t('error_assigning_driver'));
    }
  };

  const handleUnassignDriver = async (reservationId) => {
    try {
      const updateData = {
        assigned_driver_id: null,
        updated_at: new Date().toISOString()
      };

      // Only include assigned_driver_phone if the field exists
      updateData.assigned_driver_phone = null;

      await Reservation.update(reservationId, updateData);

      toast.success(t('driver_unassigned'));
      loadData(); // Refresh data
    } catch (error) {
      console.error('Error unassigning driver:', error);
      toast.error(t('خطأ في إلغاء التعيين', 'Error unassigning driver'));
    }
  };

  const handleSelectReservation = (reservationId) => {
    setSelectedReservations(prev =>
      prev.includes(reservationId)
        ? prev.filter(id => id !== reservationId)
        : [...prev, reservationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReservations.length === filteredReservations.length) {
      setSelectedReservations([]);
    } else {
      setSelectedReservations(filteredReservations.map(r => r.id));
    }
  };

  const getDriverById = (driverId) => {
    return drivers.find(d => d.id === driverId);
  };

  // New functions for driver application management
  const handleAcceptApplication = async (application) => {
    try {
      // 1. Update user's role to 'driver'
      await User.update(application.user_id, { role: 'driver' });

      // 2. Update the application status to 'approved'
      await DriverApplication.update(application.id, { status: 'approved' });

      toast.success(t('driver_accepted_success'));

      // 3. Refresh data to update lists (drivers and pending applications)
      loadData();
    } catch (error) {
      console.error('Error accepting driver application:', error);
      toast.error(t('error_accepting_driver'));
    }
  };

  const handleRejectApplication = async (application) => {
    try {
      // 1. Update the application status to 'rejected'
      await DriverApplication.update(application.id, { status: 'rejected' });

      toast.success(t('application_rejected'));

      // 2. Remove from the local state
      setDriverApplications(prev => prev.filter(app => app.id !== application.id));
    } catch (error) {
      console.error('Error rejecting driver application:', error);
      toast.error(t('error_rejecting_application'));
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!user?.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('access_denied')}
          </h2>
          <p className="text-gray-600">
            {t('admin_only_page')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
            <div className="w-12 h-12 gradient-red rounded-xl flex items-center justify-center shadow-premium">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('driver_management')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('assign_reservations_track')}
              </p>
            </div>
          </div>
        </div>

        {/* Driver Applications */}
        {/* Driver Applications */}
        {driverApplications.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('driver_applications')} ({driverApplications.length})
              </h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {driverApplications.map(app => (
                  <div key={app.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4 rtl:space-x-reverse">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-800">{app.user_name}</h4>
                          <p className="text-sm text-gray-600" dir="ltr">{app.user_phone}</p>
                          {app.user_email && (
                            <p className="text-sm text-gray-500">{app.user_email}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAcceptApplication(app)}
                        >
                          <Check className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                          {t('accept')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => handleRejectApplication(app)}
                        >
                          <X className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                          {t('reject')}
                        </Button>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Vehicle Details */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-gray-800 flex items-center">
                          <Truck className="w-4 h-4 mr-2" />
                          {t('vehicle_information')}
                        </h5>

                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          {app.vehicle_type && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('type')}:</span>
                              <span className="font-medium">
                                {vehicleTypes.find(v => v.value === app.vehicle_type)?.[`label_${language}`] || app.vehicle_type}
                              </span>
                            </div>
                          )}

                          {app.vehicle_model && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('model')}:</span>
                              <span className="font-medium">{app.vehicle_model}</span>
                            </div>
                          )}

                          {app.vehicle_year && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('year')}:</span>
                              <span className="font-medium">{app.vehicle_year}</span>
                            </div>
                          )}

                          {app.license_plate && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('license_plate')}:</span>
                              <span className="font-medium font-mono">{app.license_plate}</span>
                            </div>
                          )}

                          {app.experience_years && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">{t('experience')}:</span>
                              <span className="font-medium">{app.experience_years} {t('years')}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mt-3">
                            {app.has_license && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {t('driving_license')}
                              </Badge>
                            )}
                            {app.has_insurance && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                {t('Insured')}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Additional Information */}
                        {(app.vehicle_description || app.additional_notes) && (
                          <div className="space-y-2">
                            {app.vehicle_description && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  {t('vehicle_description')}:
                                </span>
                                <p className="text-sm text-gray-600 mt-1">{app.vehicle_description}</p>
                              </div>
                            )}

                            {app.additional_notes && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  {t('additional_notes')}:
                                </span>
                                <p className="text-sm text-gray-600 mt-1">{app.additional_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Vehicle Images */}
                      <div className="space-y-3">
                        <h5 className="font-semibold text-gray-800 flex items-center">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          {t('vehicle_images')}
                          {app.vehicle_images?.length > 0 && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800">
                              {app.vehicle_images.length}
                            </Badge>
                          )}
                        </h5>

                        {app.vehicle_images && app.vehicle_images.length > 0 ? (
                          <div className="grid grid-cols-2 gap-3">
                            {app.vehicle_images.map((image, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={image}
                                  alt={`Vehicle ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setPreviewImage(image)}
                                />
                                <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                                  {index + 1}
                                </div>
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="p-1 h-6 w-6 bg-black bg-opacity-50 hover:bg-opacity-70 text-white"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewImage(image);
                                    }}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">
                              {t('no_vehicle_images')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Application Info */}
                    <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                      <span>
                        {t('applied_on')}: {new Date(app.created_at).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {t('pending_status')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('reservations')} ({filteredReservations.length})
              </h3>

              {/* Bulk Actions */}
              {selectedReservations.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAssignDialog(true)}
                    className="gradient-red text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('assign_driver')} ({selectedReservations.length})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t('search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rtl:pr-10 rtl:pl-3"
                />
              </div>

              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('date')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_dates')}</SelectItem>
                  <SelectItem value="today">{t('today')}</SelectItem>
                  <SelectItem value="week">{t('this_week')}</SelectItem>
                  <SelectItem value="month">{t('this_month')}</SelectItem>
                  <SelectItem value="custom">{t('custom_range')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Vehicle Filter */}
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('vehicle')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_vehicles')}</SelectItem>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('كل الحالات')}</SelectItem>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="confirmed">{t('confirmed')}</SelectItem>
                  <SelectItem value="in_progress">{t('in_progress')}</SelectItem>
                  <SelectItem value="completed">{t('completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Payment Filter */}
              <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('payment')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('كل المدفوعات')}</SelectItem>
                  <SelectItem value="unpaid">{t('unpaid')}</SelectItem>
                  <SelectItem value="partial">{t('partial')}</SelectItem>
                  <SelectItem value="paid">{t('paid')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Driver Filter */}
              <Select value={driverFilter} onValueChange={setDriverFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('driver')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all_drivers')}</SelectItem>
                  <SelectItem value="unassigned">{t('unassigned')}</SelectItem>
                  <SelectItem value="assigned">{t('assigned')}</SelectItem>
                  {drivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('all');
                  setVehicleFilter('all');
                  setStatusFilter('all');
                  setPaymentFilter('all');
                  setDriverFilter('all');
                  setCustomDateRange({ start: '', end: '' });
                }}
              >
                {t('clear')}
              </Button>
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <div className="flex gap-4 mt-4">
                <div>
                  <label className="text-sm text-gray-600">{t('from')}:</label>
                  <Input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">{t('to')}:</label>
                  <Input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reservations Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left rtl:text-right">
                      <Checkbox
                        checked={selectedReservations.length === filteredReservations.length && filteredReservations.length > 0}
                        onCheckedChange={handleSelectAll}
                        disabled={filteredReservations.length === 0}
                      />
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right font-semibold">
                      {t('date_time')}
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right font-semibold">
                      {t('customer')}
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right font-semibold">
                      {t('locations')}
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right font-semibold">
                      {t('vehicle')}
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right font-semibold">
                      {t('amount')}
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right font-semibold">
                      {t('status')}
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right font-semibold">
                      {t('assigned_driver')}
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right font-semibold">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation, index) => {
                    const startDateTime = new Date(reservation.start_datetime);
                    const assignedDriver = getDriverById(reservation.assigned_driver_id);

                    return (
                      <tr key={reservation.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={selectedReservations.includes(reservation.id)}
                            onCheckedChange={() => handleSelectReservation(reservation.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="font-medium">{format(startDateTime, 'dd/MM/yyyy')}</div>
                            <div className="text-gray-500">{format(startDateTime, 'HH:mm')} ({reservation.duration_hours}h)</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="font-medium">{reservation.user_name}</div>
                            <div className="text-gray-500 flex items-center" dir="ltr">
                              <Phone className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                              {reservation.user_phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm space-y-1">
                            <div className="truncate max-w-32" title={reservation.pickup_location}>
                              <span className="text-green-600 font-medium">{t('from')}:</span> {reservation.pickup_location}
                            </div>
                            <div className="truncate max-w-32" title={reservation.delivery_location}>
                              <span className="text-red-600 font-medium">{t('to')}:</span> {reservation.delivery_location}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="font-medium flex items-center">
                              <Truck className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                              {reservation.vehicle_name}
                            </div>
                            <div className="text-gray-500">{reservation.license_plate}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="font-medium">{reservation.total_amount} {t('currency')}</div>
                            <div className="text-green-600">Paid: {reservation.amount_paid || 0}</div>
                            <div className="text-red-600">Due: {(reservation.total_amount || 0) - (reservation.amount_paid || 0)}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <Badge className={`${statusColors[reservation.status]?.bg} ${statusColors[reservation.status]?.text}`}>
                              {t(reservation.status)}
                            </Badge>
                            <Badge className={`${paymentStatusColors[reservation.payment_status]?.bg} ${paymentStatusColors[reservation.payment_status]?.text}`}>
                              {t(reservation.payment_status)}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {assignedDriver ? (
                            <div className="text-sm">
                              <div className="font-medium">{assignedDriver.full_name}</div>
                              <div className="text-gray-500" dir="ltr">{assignedDriver.phone}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">{t('unassigned')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {reservation.assigned_driver_id ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnassignDriver(reservation.id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            ) : null}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setAssigningReservation(reservation);
                                setShowAssignDialog(true);
                              }}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredReservations.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">{t('no_reservations_match')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assign Driver Dialog */}
        <AssignDriverDialog
          isOpen={showAssignDialog}
          onClose={() => {
            setShowAssignDialog(false);
            setAssigningReservation(null);
          }}
          drivers={drivers}
          reservationIds={assigningReservation ? [assigningReservation.id] : selectedReservations}
          onAssign={handleAssignDriver}
          language={language}
        />
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
    </div>
  );
}
