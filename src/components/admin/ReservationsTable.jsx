import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/components/utils/translations";
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  FileText,
  File,
  User,
  Phone,
  Clock,
  MapPin,
  Truck,
  DollarSign,
  Eye,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";

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

// Translation helper with Hebrew support
const getTranslation = (language, ar, he, en) => {
  switch (language) {
    case 'ar': return ar;
    case 'he': return he;
    case 'en': return en;
    default: return ar;
  }
};

export default function ReservationsTable({ 
  reservations, 
  vehicles, 
  users, 
  language,
  onReservationUpdate 
}) {
  const { t } = useTranslation(language);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'start_datetime', direction: 'desc' });
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Listen for window resize
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getUserById = (userId) => users.find(u => u.id === userId);
  const getVehicleById = (vehicleId) => vehicles.find(v => v.id === vehicleId);
  const getDriverById = (driverId) => users.find(u => u.id === driverId);

  // Calculate end time based on start time and duration
  const calculateEndTime = (startDateTime, durationHours) => {
    if (!startDateTime || !durationHours) return null;
    const start = new Date(startDateTime);
    const end = new Date(start.getTime() + (durationHours * 60 * 60 * 1000));
    return end;
  };

  // Enhanced filtering logic
  const filteredReservations = useMemo(() => {
    let filtered = reservations.filter(reservation => {
      const user = getUserById(reservation.user_id);
      const vehicle = getVehicleById(reservation.vehicle_id);
      const driver = getDriverById(reservation.assigned_driver_id);
      
      // Search filter
      const searchMatch = !searchTerm || 
        user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user?.phone_number?.includes(searchTerm) ||
        driver?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver?.phone_number?.includes(searchTerm) ||
        vehicle?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle?.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          default:
            dateMatch = true;
        }
      }

      // Other filters
      const vehicleMatch = vehicleFilter === 'all' || reservation.vehicle_id === vehicleFilter;
      const statusMatch = statusFilter === 'all' || reservation.status === statusFilter;
      const paymentMatch = paymentFilter === 'all' || reservation.payment_status === paymentFilter;

      return searchMatch && dateMatch && vehicleMatch && statusMatch && paymentMatch;
    });

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Special handling for nested values
        if (sortConfig.key === 'customer_name') {
          aValue = getUserById(a.user_id)?.full_name || '';
          bValue = getUserById(b.user_id)?.full_name || '';
        } else if (sortConfig.key === 'vehicle_name') {
          aValue = getVehicleById(a.vehicle_id)?.name || '';
          bValue = getVehicleById(b.vehicle_id)?.name || '';
        } else if (sortConfig.key === 'driver_name') {
          aValue = getDriverById(a.assigned_driver_id)?.full_name || '';
          bValue = getDriverById(b.assigned_driver_id)?.full_name || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [reservations, users, vehicles, searchTerm, dateFilter, vehicleFilter, statusFilter, paymentFilter, sortConfig, customDateRange]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-4 h-4" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const toggleRowExpansion = (reservationId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reservationId)) {
        newSet.delete(reservationId);
      } else {
        newSet.add(reservationId);
      }
      return newSet;
    });
  };

  // Enhanced export functions with Hebrew support
  const exportToCSV = () => {
    const headers = [
      getTranslation(language, 'تاريخ الحجز', 'תאריך הזמנה', 'Booking Date'),
      getTranslation(language, 'التاريخ', 'תאריך', 'Date'),
      getTranslation(language, 'وقت البداية', 'זמן התחלה', 'Start Time'),
      getTranslation(language, 'وقت النهاية', 'זמן סיום', 'End Time'),
      getTranslation(language, 'المدة', 'משך', 'Duration'),
      getTranslation(language, 'الاسم', 'שם', 'Name'),
      getTranslation(language, 'الهاتف', 'טלפון', 'Phone'),
      getTranslation(language, 'الشركة', 'חברה', 'Company'),
      getTranslation(language, 'المركبة', 'רכב', 'Vehicle'),
      getTranslation(language, 'رقم اللوحة', 'מספר לוח', 'License'),
      getTranslation(language, 'اسم السائق', 'שם נהג', 'Driver Name'),
      getTranslation(language, 'هاتف السائق', 'טלפון נהג', 'Driver Phone'),
      getTranslation(language, 'من', 'מ-', 'From'),
      getTranslation(language, 'إلى', 'אל', 'To'),
      getTranslation(language, 'المبلغ الإجمالي', 'סכום כולל', 'Total Amount'),
      getTranslation(language, 'المبلغ المدفوع', 'סכום ששולם', 'Amount Paid'),
      getTranslation(language, 'المتبقي', 'נותר', 'Remaining'),
      getTranslation(language, 'المصروفات', 'הוצאות', 'Expenses'),
      getTranslation(language, 'الحالة', 'סטטוס', 'Status'),
      getTranslation(language, 'الدفع', 'תשלום', 'Payment'),
      getTranslation(language, 'ملاحظات', 'הערות', 'Notes')
    ];

    const data = filteredReservations.map(reservation => {
      const user = getUserById(reservation.user_id);
      const vehicle = getVehicleById(reservation.vehicle_id);
      const driver = getDriverById(reservation.assigned_driver_id);
      const startDateTime = new Date(reservation.start_datetime);
      const endDateTime = calculateEndTime(reservation.start_datetime, reservation.duration_hours);
      const bookingDate = reservation.created_at ? new Date(reservation.created_at) : null;

      return [
        bookingDate ? format(bookingDate, 'yyyy-MM-dd HH:mm') : '',
        format(startDateTime, 'yyyy-MM-dd'),
        format(startDateTime, 'HH:mm'),
        endDateTime ? format(endDateTime, 'HH:mm') : '',
        `${reservation.duration_hours}h`,
        user?.full_name || '',
        user?.phone_number || user?.phone || '',
        user?.company_name || '',
        vehicle?.name || '',
        vehicle?.license_plate || '',
        driver?.full_name || '',
        driver?.phone_number || driver?.phone || '',
        reservation.pickup_location || '',
        reservation.delivery_location || '',
        reservation.total_amount || 0,
        reservation.amount_paid || 0,
        (reservation.total_amount || 0) - (reservation.amount_paid || 0),
        reservation.expenses || 0,
        getTranslation(language, 
          reservation.status === 'pending' ? 'قيد الانتظار' : 
          reservation.status === 'confirmed' ? 'مؤكد' : 
          reservation.status === 'in_progress' ? 'قيد التنفيذ' : 
          reservation.status === 'completed' ? 'مكتمل' : 'ملغي',
          
          reservation.status === 'pending' ? 'ממתין' : 
          reservation.status === 'confirmed' ? 'מאושר' : 
          reservation.status === 'in_progress' ? 'בביצוע' : 
          reservation.status === 'completed' ? 'הושלם' : 'בוטל',
          
          reservation.status
        ),
        getTranslation(language,
          reservation.payment_status === 'paid' ? 'مدفوع' : 
          reservation.payment_status === 'partial' ? 'مدفوع جزئيا' : 'غير مدفوع',
          
          reservation.payment_status === 'paid' ? 'שולם' : 
          reservation.payment_status === 'partial' ? 'שולם חלקית' : 'לא שולם',
          
          reservation.payment_status
        ),
        reservation.notes || ''
      ];
    });

    const csvContent = [headers, ...data].map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reservations_detailed_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Mobile Card Component
  const MobileReservationCard = ({ reservation, index }) => {
    const user = getUserById(reservation.user_id);
    const vehicle = getVehicleById(reservation.vehicle_id);
    const driver = getDriverById(reservation.assigned_driver_id);
    const startDateTime = new Date(reservation.start_datetime);
    const endDateTime = calculateEndTime(reservation.start_datetime, reservation.duration_hours);
    const bookingDate = reservation.created_at ? new Date(reservation.created_at) : null;
    const totalAmount = reservation.total_amount || 0;
    const amountPaid = reservation.amount_paid || 0;
    const remaining = totalAmount - amountPaid;
    const isExpanded = expandedRows.has(reservation.id);

    return (
      <Card className="mb-4 shadow-sm">
        <CardContent className="p-4">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-semibold text-sm">
                {format(startDateTime, 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Badge className={`${statusColors[reservation.status]?.bg} ${statusColors[reservation.status]?.text} text-xs`}>
                {getTranslation(language, 
                  reservation.status === 'pending' ? 'قيد الانتظار' : 
                  reservation.status === 'confirmed' ? 'مؤكد' : 
                  reservation.status === 'in_progress' ? 'قيد التنفيذ' : 
                  reservation.status === 'completed' ? 'مكتمل' : 'ملغي',
                  
                  reservation.status === 'pending' ? 'ממתין' : 
                  reservation.status === 'confirmed' ? 'מאושר' : 
                  reservation.status === 'in_progress' ? 'בביצוע' : 
                  reservation.status === 'completed' ? 'הושלם' : 'בוטל',
                  
                  reservation.status
                )}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleRowExpansion(reservation.id)}
                className="p-1"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Main Info Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-sm">{user?.full_name}</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm">
                  {format(startDateTime, 'HH:mm')} - {endDateTime ? format(endDateTime, 'HH:mm') : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="text-sm">{vehicle?.name}</span>
              </div>
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <DollarSign className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold">{totalAmount}</span>
              </div>
            </div>

                       {/* Location Summary */}
            <div className="bg-gray-50 rounded-lg p-2 text-xs">
              <div className="flex items-center mb-1">
                <MapPin className="w-3 h-3 text-green-600 mr-1 rtl:ml-1 rtl:mr-0" />
                <span className="text-green-600 font-medium">
                  {getTranslation(language, 'من:', 'מ-:', 'From:')}
                </span>
                <span className="truncate ml-1 rtl:mr-1 rtl:ml-0">{reservation.pickup_location}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-3 h-3 text-red-600 mr-1 rtl:ml-1 rtl:mr-0" />
                <span className="text-red-600 font-medium">
                  {getTranslation(language, 'إلى:', 'אל:', 'To:')}
                </span>
                <span className="truncate ml-1 rtl:mr-1 rtl:ml-0">{reservation.delivery_location}</span>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              {/* Booking Date */}
              {bookingDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {getTranslation(language, 'تاريخ الحجز:', 'תאריך הזמנה:', 'Booking Date:')}
                  </span>
                  <span>{format(bookingDate, 'dd/MM/yyyy HH:mm')}</span>
                </div>
              )}

              {/* Customer Details */}
              <div className="bg-blue-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-blue-800 mb-2">
                  {getTranslation(language, 'تفاصيل العميل', 'פרטי לקוח', 'Customer Details')}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {getTranslation(language, 'الهاتف:', 'טלפון:', 'Phone:')}
                    </span>
                    <span dir="ltr">{user?.phone_number || user?.phone}</span>
                  </div>
                  {user?.company_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        {getTranslation(language, 'الشركة:', 'חברה:', 'Company:')}
                      </span>
                      <span>{user.company_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="bg-green-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-green-800 mb-2">
                  {getTranslation(language, 'تفاصيل المركبة', 'פרטי רכב', 'Vehicle Details')}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {getTranslation(language, 'رقم اللوحة:', 'מספר לוח:', 'License Plate:')}
                    </span>
                    <span>{vehicle?.license_plate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {getTranslation(language, 'المدة:', 'משך:', 'Duration:')}
                    </span>
                    <span>{reservation.duration_hours}h</span>
                  </div>
                </div>
              </div>

              {/* Driver Details */}
              <div className={`rounded-lg p-3 ${driver ? 'bg-purple-50' : 'bg-red-50'}`}>
                <h4 className={`text-sm font-semibold mb-2 ${driver ? 'text-purple-800' : 'text-red-800'}`}>
                  {getTranslation(language, 'السائق', 'נהג', 'Driver')}
                </h4>
                {driver ? (
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        {getTranslation(language, 'الاسم:', 'שם:', 'Name:')}
                      </span>
                      <span>{driver.full_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        {getTranslation(language, 'الهاتف:', 'טלפון:', 'Phone:')}
                      </span>
                      <span dir="ltr">{driver.phone_number || driver.phone}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-600">
                    {getTranslation(language, 'غير معين', 'לא מוקצה', 'Not Assigned')}
                  </p>
                )}
              </div>

              {/* Financial Details */}
              <div className="bg-yellow-50 rounded-lg p-3">
                <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                  {getTranslation(language, 'التفاصيل المالية', 'פרטים כספיים', 'Financial Details')}
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {getTranslation(language, 'الإجمالي:', 'סכום כולל:', 'Total:')}
                    </span>
                    <span className="font-semibold">{totalAmount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {getTranslation(language, 'مدفوع:', 'שולם:', 'Paid:')}
                    </span>
                    <span className="text-green-600 font-semibold">{amountPaid}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      {getTranslation(language, 'متبقي:', 'נותר:', 'Due:')}
                    </span>
                    <span className="text-red-600 font-semibold">{remaining}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={`${paymentStatusColors[reservation.payment_status]?.bg} ${paymentStatusColors[reservation.payment_status]?.text} text-xs`}>
                      {getTranslation(language,
                        reservation.payment_status === 'paid' ? 'مدفوع' : 
                        reservation.payment_status === 'partial' ? 'مدفوع جزئيا' : 'غير مدفوع',
                        
                        reservation.payment_status === 'paid' ? 'שולם' : 
                        reservation.payment_status === 'partial' ? 'שולם חלקית' : 'לא שולם',
                        
                        reservation.payment_status
                      )}
                    </Badge>
                  </div>
                  {reservation.expenses && reservation.expenses > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">
                        {getTranslation(language, 'مصروفات:', 'הוצאות:', 'Expenses:')}
                      </span>
                      <span className="text-orange-600">{reservation.expenses}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {reservation.notes && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">
                    {getTranslation(language, 'ملاحظات', 'הערות', 'Notes')}
                  </h4>
                  <p className="text-sm text-gray-700">{reservation.notes}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Enhanced export functions with Hebrew support
  const exportToJSON = () => {
    const data = filteredReservations.map(reservation => {
      const user = getUserById(reservation.user_id);
      const vehicle = getVehicleById(reservation.vehicle_id);
      const driver = getDriverById(reservation.assigned_driver_id);
      const startDateTime = new Date(reservation.start_datetime);
      const endDateTime = calculateEndTime(reservation.start_datetime, reservation.duration_hours);
      const bookingDate = reservation.created_at ? new Date(reservation.created_at) : null;

      return {
        booking: {
          date: bookingDate ? format(bookingDate, 'yyyy-MM-dd HH:mm') : '',
          id: reservation.id
        },
        schedule: {
          date: format(startDateTime, 'yyyy-MM-dd'),
          start_time: format(startDateTime, 'HH:mm'),
          end_time: endDateTime ? format(endDateTime, 'HH:mm') : '',
          duration: `${reservation.duration_hours}h`
        },
        customer: {
          name: user?.full_name || '',
          phone: user?.phone_number || user?.phone || '',
          company: user?.company_name || ''
        },
        vehicle: {
          name: vehicle?.name || '',
          license: vehicle?.license_plate || ''
        },
        driver: {
          name: driver?.full_name || '',
          phone: driver?.phone_number || driver?.phone || ''
        },
        locations: {
          from: reservation.pickup_location || '',
          to: reservation.delivery_location || ''
        },
        payment: {
          total: reservation.total_amount || 0,
          paid: reservation.amount_paid || 0,
          remaining: (reservation.total_amount || 0) - (reservation.amount_paid || 0),
          expenses: reservation.expenses || 0,
          status: reservation.payment_status
        },
        status: reservation.status,
        notes: reservation.notes || ''
      };
    });

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reservations_detailed_${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printTable = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>Tandaro - ${getTranslation(language, 'تقرير مفصل للحجوزات', 'דוח הזמנות מפורט', 'Detailed Reservations Report')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; direction: ${language === 'ar' ? 'rtl' : language === 'he' ? 'rtl' : 'ltr'}; }
            h1 { color: #DC2626; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: ${language === 'ar' || language === 'he' ? 'right' : 'left'}; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .status-badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; }
            .status-pending { background-color: #FEF3C7; color: #92400E; }
            .status-confirmed { background-color: #DBEAFE; color: #1E40AF; }
            .status-completed { background-color: #D1FAE5; color: #065F46; }
            .payment-paid { background-color: #D1FAE5; color: #065F46; }
            .payment-unpaid { background-color: #FEE2E2; color: #991B1B; }
            .small-text { font-size: 10px; }
          </style>
        </head>
        <body>
          <h1>Tandaro - ${getTranslation(language, 'تقرير مفصل للحجوزات', 'דוח הזמנות מפורט', 'Detailed Reservations Report')}</h1>
          <p>${getTranslation(language, 'تم إنشاؤه في:', 'נוצר ב:', 'Generated:')} ${format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
          <p>${getTranslation(language, 'إجمالي السجلات:', 'סכום רשומות:', 'Total Records:')} ${filteredReservations.length}</p>
          <table>
            <thead>
              <tr>
                <th>${getTranslation(language, 'تاريخ الحجز', 'תאריך הזמנה', 'Booking Date')}</th>
                <th>${getTranslation(language, 'تاريخ الخدمة', 'תאריך שירות', 'Service Date')}</th>
                <th>${getTranslation(language, 'الوقت', 'זמן', 'Time')}</th>
                <th>${getTranslation(language, 'العميل', 'לקוח', 'Customer')}</th>
                <th>${getTranslation(language, 'المركبة', 'רכב', 'Vehicle')}</th>
                <th>${getTranslation(language, 'السائق', 'נהג', 'Driver')}</th>
                <th>${getTranslation(language, 'المواقع', 'מיקומים', 'Locations')}</th>
                <th>${getTranslation(language, 'الدفع', 'תשלום', 'Payment')}</th>
                <th>${getTranslation(language, 'الحالة', 'סטטוס', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReservations.map(reservation => {
                const user = getUserById(reservation.user_id);
                const vehicle = getVehicleById(reservation.vehicle_id);
                const driver = getDriverById(reservation.assigned_driver_id);
                const startDateTime = new Date(reservation.start_datetime);
                const endDateTime = calculateEndTime(reservation.start_datetime, reservation.duration_hours);
                const bookingDate = reservation.created_at ? new Date(reservation.created_at) : null;

                return `
                  <tr>
                    <td class="small-text">${bookingDate ? format(bookingDate, 'dd/MM/yy HH:mm') : ''}</td>
                    <td>${format(startDateTime, 'dd/MM/yyyy')}</td>
                    <td>${format(startDateTime, 'HH:mm')} - ${endDateTime ? format(endDateTime, 'HH:mm') : ''}<br><span class="small-text">${reservation.duration_hours}h</span></td>
                    <td>${user?.full_name || ''}<br><span class="small-text">${user?.phone_number || user?.phone || ''}</span></td>
                    <td>${vehicle?.name || ''}<br><span class="small-text">${vehicle?.license_plate || ''}</span></td>
                    <td>${driver?.full_name || getTranslation(language, 'غير معين', 'לא מוקצה', 'Not Assigned')}<br><span class="small-text">${driver?.phone_number || driver?.phone || ''}</span></td>
                    <td class="small-text">${getTranslation(language, 'من:', 'מ-:', 'From:')} ${reservation.pickup_location || ''}<br>${getTranslation(language, 'إلى:', 'אל:', 'To:')} ${reservation.delivery_location || ''}</td>
                    <td>${getTranslation(language, 'الإجمالي:', 'סכום:', 'Total:')} ${reservation.total_amount || 0}<br>${getTranslation(language, 'مدفوع:', 'שולם:', 'Paid:')} ${reservation.amount_paid || 0}<br>${getTranslation(language, 'متبقي:', 'נותר:', 'Due:')} ${(reservation.total_amount || 0) - (reservation.amount_paid || 0)}</td>
                    <td><span class="status-badge status-${reservation.status}">${getTranslation(language, 
                      reservation.status === 'pending' ? 'قيد الانتظار' : 
                      reservation.status === 'confirmed' ? 'مؤكد' : 
                      reservation.status === 'in_progress' ? 'قيد التنفيذ' : 
                      reservation.status === 'completed' ? 'مكتمل' : 'ملغي',
                      
                      reservation.status === 'pending' ? 'ממתין' : 
                      reservation.status === 'confirmed' ? 'מאושר' : 
                      reservation.status === 'in_progress' ? 'בביצוע' : 
                      reservation.status === 'completed' ? 'הושלם' : 'בוטל',
                      
                      reservation.status
                    )}</span><br><span class="status-badge payment-${reservation.payment_status}">${getTranslation(language,
                      reservation.payment_status === 'paid' ? 'مدفوع' : 
                      reservation.payment_status === 'partial' ? 'مدفوع جزئيا' : 'غير مدفوع',
                      
                      reservation.payment_status === 'paid' ? 'שולם' : 
                      reservation.payment_status === 'partial' ? 'שולם חלקית' : 'לא שולם',
                      
                      reservation.payment_status
                    )}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {getTranslation(language, 'الحجوزات', 'הזמנות', 'Reservations')} ({filteredReservations.length})
            </h3>
            
                       {/* Export Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={exportToCSV} className="flex items-center gap-2">
                <File className="w-4 h-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={exportToJSON} className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={printTable} className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                {getTranslation(language, 'طباعة', 'הדפסה', 'Print')}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className={`grid grid-cols-1 gap-4 ${isMobile ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-6'}`}>
            {/* Search */}
            <div className="relative col-span-full lg:col-span-1">
              <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={getTranslation(language, 'بحث...', 'חיפוש...', 'Search...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rtl:pr-10 rtl:pl-3"
              />
            </div>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder={getTranslation(language, 'التاريخ', 'תאריך', 'Date')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getTranslation(language, 'كل التواريخ', 'כל התאריכים', 'All Dates')}</SelectItem>
                <SelectItem value="today">{getTranslation(language, 'اليوم', 'היום', 'Today')}</SelectItem>
                <SelectItem value="week">{getTranslation(language, 'هذا الأسبوع', 'השבוע', 'This Week')}</SelectItem>
                <SelectItem value="month">{getTranslation(language, 'هذا الشهر', 'החודש', 'This Month')}</SelectItem>
                <SelectItem value="custom">{getTranslation(language, 'فترة مخصصة', 'טווח מותאם', 'Custom Range')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Vehicle Filter */}
            <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
              <SelectTrigger>
                <SelectValue placeholder={getTranslation(language, 'المركبات', 'רכבים', 'Vehicles')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getTranslation(language, 'كل المركبات', 'כל הרכבים', 'All Vehicles')}</SelectItem>
                {vehicles.map(vehicle => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} - {vehicle.license_plate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder={getTranslation(language, 'الحالة', 'סטטוס', 'Status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getTranslation(language, 'كل الحالات', 'כל הסטטוסים', 'All Status')}</SelectItem>
                <SelectItem value="pending">{getTranslation(language, 'قيد الانتظار', 'ממתין', 'Pending')}</SelectItem>
                <SelectItem value="confirmed">{getTranslation(language, 'مؤكد', 'מאושר', 'Confirmed')}</SelectItem>
                <SelectItem value="in_progress">{getTranslation(language, 'قيد التنفيذ', 'בביצוע', 'In Progress')}</SelectItem>
                <SelectItem value="completed">{getTranslation(language, 'مكتمل', 'הושלם', 'Completed')}</SelectItem>
                <SelectItem value="cancelled">{getTranslation(language, 'ملغي', 'בוטל', 'Cancelled')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder={getTranslation(language, 'الدفع', 'תשלום', 'Payment')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{getTranslation(language, 'كل المدفوعات', 'כל התשלומים', 'All Payments')}</SelectItem>
                <SelectItem value="unpaid">{getTranslation(language, 'غير مدفوع', 'לא שולם', 'Unpaid')}</SelectItem>
                <SelectItem value="partial">{getTranslation(language, 'مدفوع جزئيا', 'שולם חלקית', 'Partial')}</SelectItem>
                <SelectItem value="paid">{getTranslation(language, 'مدفوع', 'שולם', 'Paid')}</SelectItem>
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
                setCustomDateRange({ start: '', end: '' });
              }}
            >
              {getTranslation(language, 'مسح الفلاتر', 'נקה מסננים', 'Clear Filters')}
            </Button>
          </div>

          {/* Custom Date Range */}
          {dateFilter === 'custom' && (
            <div className="flex gap-4 mt-4">
              <div className="flex-1">
                <label className="text-sm text-gray-600">
                  {getTranslation(language, 'من:', 'מ-:', 'From:')}
                </label>
                <Input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-600">
                  {getTranslation(language, 'إلى:', 'עד:', 'To:')}
                </label>
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

      {/* Mobile Cards or Desktop Table */}
      {isMobile ? (
        <div className="space-y-4">
          {filteredReservations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {getTranslation(language, 'لا توجد حجوزات تطابق الفلاتر', 'אין הזמנות התואמות למסננים', 'No reservations match the filters')}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReservations.map((reservation, index) => (
              <MobileReservationCard key={reservation.id} reservation={reservation} index={index} />
            ))
          )}
        </div>
      ) : (
        /* Desktop Table */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left rtl:text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('created_at')} className="font-semibold">
                        {getTranslation(language, 'تاريخ الحجز', 'תאריך הזמנה', 'Booking Date')} {getSortIcon('created_at')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('start_datetime')} className="font-semibold">
                        {getTranslation(language, 'التاريخ/الوقت', 'תאריך/שעה', 'Service Date/Time')} {getSortIcon('start_datetime')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('customer_name')} className="font-semibold">
                        {getTranslation(language, 'العميل', 'לקוח', 'Customer')} {getSortIcon('customer_name')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('vehicle_name')} className="font-semibold">
                        {getTranslation(language, 'المركبة', 'רכב', 'Vehicle')} {getSortIcon('vehicle_name')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('driver_name')} className="font-semibold">
                        {getTranslation(language, 'السائق', 'נהג', 'Driver')} {getSortIcon('driver_name')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right font-semibold">
                      {getTranslation(language, 'المواقع', 'מיקומים', 'Locations')}
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('total_amount')} className="font-semibold">
                        {getTranslation(language, 'المالية', 'כספים', 'Financials')} {getSortIcon('total_amount')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left rtl:text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleSort('status')} className="font-semibold">
                        {getTranslation(language, 'الحالة', 'סטטוס', 'Status')} {getSortIcon('status')}
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation, index) => {
                    const user = getUserById(reservation.user_id);
                    const vehicle = getVehicleById(reservation.vehicle_id);
                    const driver = getDriverById(reservation.assigned_driver_id);
                    const startDateTime = new Date(reservation.start_datetime);
                    const endDateTime = calculateEndTime(reservation.start_datetime, reservation.duration_hours);
                    const bookingDate = reservation.created_at ? new Date(reservation.created_at) : null;
                    const totalAmount = reservation.total_amount || 0;
                    const amountPaid = reservation.amount_paid || 0;
                    const remaining = totalAmount - amountPaid;
                    const expenses = reservation.expenses || 0;
                    
                    return (
                      <tr key={reservation.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                        {/* Booking Date */}
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {bookingDate ? (
                              <>
                                <div className="font-medium">{format(bookingDate, 'dd/MM/yyyy')}</div>
                                <div className="text-gray-500 text-xs">{format(bookingDate, 'HH:mm')}</div>
                              </>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </div>
                        </td>

                        {/* Service Date & Time */}
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="font-medium">{format(startDateTime, 'dd/MM/yyyy')}</div>
                            <div className="text-blue-600 font-medium">
                              {format(startDateTime, 'HH:mm')} - {endDateTime ? format(endDateTime, 'HH:mm') : 'N/A'}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {reservation.duration_hours}h {getTranslation(language, 'مدة', 'משך', 'duration')}
                            </div>
                          </div>
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="font-medium flex items-center">
                              <User className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                              {user?.full_name}
                            </div>
                            <div className="text-gray-500 flex items-center" dir="ltr">
                              <Phone className="w-3 h-3 mr-1 rtl:ml-1 rtl:mr-0" />
                              {user?.phone_number || user?.phone}
                            </div>
                            {user?.company_name && (
                              <div className="text-gray-500 text-xs">{user.company_name}</div>
                            )}
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <div className="font-medium">{vehicle?.name}</div>
                            <div className="text-gray-500">{vehicle?.license_plate}</div>
                          </div>
                        </td>

                        {/* Driver */}
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            {driver ? (
                              <>
                                <div className="font-medium text-green-700">{driver.full_name}</div>
                                <div className="text-gray-500 text-xs" dir="ltr">
                                  {driver.phone_number || driver.phone}
                                </div>
                              </>
                            ) : (
                              <div className="text-red-500 font-medium">
                                {getTranslation(language, 'غير معين', 'לא מוקצה', 'Not Assigned')}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Locations */}
                        <td className="px-4 py-3">
                          <div className="text-sm space-y-1">
                            <div className="truncate max-w-40" title={reservation.pickup_location}>
                              <span className="text-green-600 font-medium">
                                {getTranslation(language, 'من:', 'מ-:', 'From:')}
                              </span> {reservation.pickup_location}
                            </div>
                            <div className="truncate max-w-40" title={reservation.delivery_location}>
                              <span className="text-red-600 font-medium">
                                {getTranslation(language, 'إلى:', 'אל:', 'To:')}
                              </span> {reservation.delivery_location}
                            </div>
                          </div>
                        </td>

                        {/* Financial Information */}
                        <td className="px-4 py-3">
                          <div className="text-sm space-y-1">
                            <div className="font-medium">
                              {getTranslation(language, 'الإجمالي:', 'סכום כולל:', 'Total:')} {totalAmount}
                            </div>
                            <div className="text-green-600">
                              {getTranslation(language, 'مدفوع:', 'שולם:', 'Paid:')} {amountPaid}
                            </div>
                            <div className="text-red-600">
                              {getTranslation(language, 'متبقي:', 'נותר:', 'Due:')} {remaining}
                            </div>
                            {expenses > 0 && (
                              <div className="text-orange-600 text-xs">
                                {getTranslation(language, 'مصروفات:', 'הוצאות:', 'Expenses:')} {expenses}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <div className="space-y-2">
                            <Badge className={`${statusColors[reservation.status]?.bg} ${statusColors[reservation.status]?.text}`}>
                              {getTranslation(language, 
                                reservation.status === 'pending' ? 'قيد الانتظار' : 
                                reservation.status === 'confirmed' ? 'مؤكد' : 
                                reservation.status === 'in_progress' ? 'قيد التنفيذ' : 
                                reservation.status === 'completed' ? 'مكتمل' : 'ملغي',
                                
                                reservation.status === 'pending' ? 'ממתين' : 
                                reservation.status === 'confirmed' ? 'מאושר' : 
                                reservation.status === 'in_progress' ? 'בביצוע' : 
                                reservation.status === 'completed' ? 'הושלם' : 'בוטל',
                                
                                reservation.status
                              )}
                            </Badge>
                            <Badge className={`${paymentStatusColors[reservation.payment_status]?.bg} ${paymentStatusColors[reservation.payment_status]?.text}`}>
                              {getTranslation(language,
                                reservation.payment_status === 'paid' ? 'مدفوع' : 
                                reservation.payment_status === 'partial' ? 'مدفوع جزئيا' : 'غير مدفوع',
                                
                                reservation.payment_status === 'paid' ? 'שולם' : 
                                reservation.payment_status === 'partial' ? 'שولם חלקית' : 'לא שולם',
                                
                                reservation.payment_status
                              )}
                            </Badge>
                            {reservation.notes && (
                              <div className="text-xs text-gray-500 italic truncate max-w-32" title={reservation.notes}>
                                {reservation.notes}
                              </div>
                            )}
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
                <p className="text-gray-600">
                  {getTranslation(language, 'لا توجد حجوزات تطابق الفلاتر', 'אין הזמנות התואמות למסננים', 'No reservations match the filters')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

            {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {filteredReservations.length}
              </div>
              <div className="text-gray-600 text-sm">
                {getTranslation(language, 'إجمالي الحجوزات', 'סכום הזמנות', 'Total Reservations')}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredReservations.reduce((sum, r) => sum + (r.total_amount || 0), 0)} 
                <span className="text-sm ml-1 rtl:mr-1 rtl:ml-0">
                  {getTranslation(language, 'شيكل', '₪', 'NIS')}
                </span>
              </div>
              <div className="text-gray-600 text-sm">
                {getTranslation(language, 'إجمالي المبلغ', 'סכום כולל', 'Total Amount')}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredReservations.reduce((sum, r) => sum + (r.amount_paid || 0), 0)}
                <span className="text-sm ml-1 rtl:mr-1 rtl:ml-0">
                  {getTranslation(language, 'شيكل', '₪', 'NIS')}
                </span>
              </div>
              <div className="text-gray-600 text-sm">
                {getTranslation(language, 'المبلغ المدفوع', 'סכום ששולם', 'Amount Paid')}
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {filteredReservations.reduce((sum, r) => sum + ((r.total_amount || 0) - (r.amount_paid || 0)), 0)}
                <span className="text-sm ml-1 rtl:mr-1 rtl:ml-0">
                  {getTranslation(language, 'شيكل', '₪', 'NIS')}
                </span>
              </div>
              <div className="text-gray-600 text-sm">
                {getTranslation(language, 'المبلغ المتبقي', 'סכום שנותר', 'Amount Due')}
              </div>
            </div>
          </div>

          {/* Additional Mobile-Friendly Summary */}
          {isMobile && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 gap-4">
                {/* Status Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {getTranslation(language, 'تفصيل الحالات', 'פירוט סטטוסים', 'Status Breakdown')}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-600">
                        {getTranslation(language, 'قيد الانتظار:', 'ממתין:', 'Pending:')}
                      </span>
                      <span className="font-semibold">
                        {filteredReservations.filter(r => r.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-600">
                        {getTranslation(language, 'مؤكد:', 'מאושר:', 'Confirmed:')}
                      </span>
                      <span className="font-semibold">
                        {filteredReservations.filter(r => r.status === 'confirmed').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-600">
                        {getTranslation(language, 'قيد التنفيذ:', 'בביצוע:', 'In Progress:')}
                      </span>
                      <span className="font-semibold">
                        {filteredReservations.filter(r => r.status === 'in_progress').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600">
                        {getTranslation(language, 'مكتمل:', 'הושלם:', 'Completed:')}
                      </span>
                      <span className="font-semibold">
                        {filteredReservations.filter(r => r.status === 'completed').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {getTranslation(language, 'تفصيل المدفوعات', 'פירוט תשלומים', 'Payment Breakdown')}
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-600">
                        {getTranslation(language, 'مدفوع:', 'שולם:', 'Paid:')}
                      </span>
                      <span className="font-semibold">
                        {filteredReservations.filter(r => r.payment_status === 'paid').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600">
                        {getTranslation(language, 'مدفوع جزئيا:', 'שולם חלקית:', 'Partial:')}
                      </span>
                      <span className="font-semibold">
                        {filteredReservations.filter(r => r.payment_status === 'partial').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">
                        {getTranslation(language, 'غير مدفوع:', 'לא שולם:', 'Unpaid:')}
                      </span>
                      <span className="font-semibold">
                        {filteredReservations.filter(r => r.payment_status === 'unpaid').length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions for Mobile */}
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setExpandedRows(new Set(filteredReservations.map(r => r.id)))}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {getTranslation(language, 'توسيع الكل', 'הרחב הכל', 'Expand All')}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setExpandedRows(new Set())}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {getTranslation(language, 'طي الكل', 'קפל הכל', 'Collapse All')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Export Options */}
      {isMobile && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              {getTranslation(language, 'تصدير البيانات', 'יצוא נתונים', 'Export Data')}
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button 
                variant="outline" 
                onClick={exportToCSV} 
                className="flex items-center justify-center gap-2 h-12"
              >
                <File className="w-5 h-5" />
                <div className="text-left rtl:text-right">
                  <div className="font-semibold">CSV</div>
                  <div className="text-xs text-gray-600">
                    {getTranslation(language, 'جدول بيانات', 'גיליון נתונים', 'Spreadsheet')}
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                onClick={exportToJSON} 
                className="flex items-center justify-center gap-2 h-12"
              >
                <FileText className="w-5 h-5" />
                <div className="text-left rtl:text-right">
                  <div className="font-semibold">JSON</div>
                  <div className="text-xs text-gray-600">
                    {getTranslation(language, 'بيانات منظمة', 'נתונים מובנים', 'Structured Data')}
                  </div>
                </div>
              </Button>

              <Button 
                variant="outline" 
                onClick={printTable} 
                className="flex items-center justify-center gap-2 h-12"
              >
                <FileSpreadsheet className="w-5 h-5" />
                <div className="text-left rtl:text-right">
                  <div className="font-semibold">
                    {getTranslation(language, 'طباعة', 'הדפסה', 'Print')}
                  </div>
                  <div className="text-xs text-gray-600">
                    {getTranslation(language, 'تقرير مطبوع', 'דוח מודפס', 'Printed Report')}
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}