// components/admin/FeedbackManager.jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Feedback, Report } from '@/api/entities';
import { 
  MessageSquare, 
  AlertTriangle, 
  Star, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle,
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  Mail,
  Lightbulb,
  Bug,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const FeedbackManager = ({ language }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [feedbackData, reportData] = await Promise.all([
        Feedback.list(),
        Report.list()
      ]);
      setFeedbacks(feedbackData);
      setReports(reportData);
    } catch (error) {
      console.error('Error loading feedback data:', error);
      toast.error(
        language === 'ar' ? 'خطأ في تحميل البيانات' :
        language === 'he' ? 'שגיאה בטעינת נתונים' :
        'Error loading data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateReportStatus = async (reportId, status, adminNotes = '') => {
    try {
      await Report.update(reportId, { 
        status, 
        admin_notes: adminNotes,
        admin_updated_at: new Date().toISOString()
      });
      
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status, admin_notes: adminNotes, admin_updated_at: new Date().toISOString() }
          : report
      ));
      
      toast.success(
        language === 'ar' ? 'تم تحديث حالة البلاغ' :
        language === 'he' ? 'סטטוס הדיווח עודכן' :
        'Report status updated'
      );
    } catch (error) {
      console.error('Error updating report:', error);
      toast.error(
        language === 'ar' ? 'خطأ في تحديث البلاغ' :
        language === 'he' ? 'שגיאה בעדכון הדיווח' :
        'Error updating report'
      );
    }
  };

  const markFeedbackAsRead = async (feedbackId) => {
    try {
      await Feedback.markAsRead(feedbackId);
      setFeedbacks(prev => prev.map(feedback => 
        feedback.id === feedbackId 
          ? { ...feedback, is_read: true, read_at: new Date().toISOString() }
          : feedback
      ));
    } catch (error) {
      console.error('Error marking feedback as read:', error);
    }
  };

  const getStatusBadge = (status, type = 'report') => {
    const statusConfig = {
      // Report statuses
      open: { 
        color: 'bg-red-100 text-red-800', 
        label: { ar: 'مفتوح', he: 'פתוח', en: 'Open' },
        icon: AlertCircle 
      },
      in_progress: { 
        color: 'bg-yellow-100 text-yellow-800', 
        label: { ar: 'قيد المعالجة', he: 'בטיפול', en: 'In Progress' },
        icon: Clock 
      },
      resolved: { 
        color: 'bg-green-100 text-green-800', 
        label: { ar: 'تم الحل', he: 'נפתר', en: 'Resolved' },
        icon: CheckCircle 
      },
      closed: { 
        color: 'bg-gray-100 text-gray-800', 
        label: { ar: 'مغلق', he: 'סגור', en: 'Closed' },
        icon: XCircle 
      }
    };

    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label[language] || config.label.en}
      </Badge>
    );
  };

  const getTypeIcon = (type) => {
    const icons = {
      service_issue: AlertTriangle,
      technical_problem: Bug,
      complaint: AlertTriangle,
      suggestion: Lightbulb,
      feedback: MessageSquare
    };
    return icons[type] || MessageSquare;
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      feedback.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feedback.user_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const StarRating = ({ rating }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'ar' ? 'جاري تحميل الملاحظات...' : 
             language === 'he' ? 'טוען משובים...' : 
             'Loading feedback...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {language === 'ar' ? 'إجمالي التقييمات' : 
                   language === 'he' ? 'סך כל הדירוגים' : 
                   'Total Feedback'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{feedbacks.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {language === 'ar' ? 'البلاغات المفتوحة' : 
                   language === 'he' ? 'דיווחים פתוחים' : 
                   'Open Reports'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'open').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {language === 'ar' ? 'قيد المعالجة' : 
                   language === 'he' ? 'בטיפול' : 
                   'In Progress'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(r => r.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {language === 'ar' ? 'متوسط التقييم' : 
                   language === 'he' ? 'דירוג ממוצע' : 
                   'Average Rating'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {feedbacks.length > 0 
                    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder={language === 'ar' ? 'بحث في الملاحظات والبلاغات...' : 
                             language === 'he' ? 'חיפוש במשובים ודיווחים...' : 
                             'Search feedback and reports...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rtl:pr-10 rtl:pl-3 h-12 rounded-xl border-gray-200"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl bg-white font-medium text-gray-700 min-w-40"
            >
              <option value="all">
                {language === 'ar' ? 'جميع الحالات' : 
                 language === 'he' ? 'כל הסטטוסים' : 
                 'All Status'}
              </option>
              <option value="open">
                {language === 'ar' ? 'مفتوح' : language === 'he' ? 'פתוח' : 'Open'}
              </option>
              <option value="in_progress">
                {language === 'ar' ? 'قيد المعالجة' : language === 'he' ? 'בטיפול' : 'In Progress'}
              </option>
              <option value="resolved">
                {language === 'ar' ? 'تم الحل' : language === 'he' ? 'נפתר' : 'Resolved'}
              </option>
              <option value="closed">
                {language === 'ar' ? 'مغلق' : language === 'he' ? 'סגור' : 'Closed'}
              </option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 rounded-xl p-1">
          <TabsTrigger value="reports" className="rounded-lg font-semibold">
            <AlertTriangle className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {language === 'ar' ? `البلاغات (${reports.length})` : 
             language === 'he' ? `דיווחים (${reports.length})` : 
             `Reports (${reports.length})`}
          </TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-lg font-semibold">
            <MessageSquare className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
            {language === 'ar' ? `التقييمات (${feedbacks.length})` : 
             language === 'he' ? `דירוגים (${feedbacks.length})` : 
             `Feedback (${feedbacks.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {language === 'ar' ? 'لا توجد بلاغات' : 
                   language === 'he' ? 'אין דיווחים' : 
                   'No Reports Found'}
                </h3>
                <p className="text-gray-500">
                  {language === 'ar' ? 'لم يتم العثور على بلاغات تطابق البحث' : 
                   language === 'he' ? 'לא נמצאו דיווחים התואמים את החיפוש' : 
                   'No reports match your search criteria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => {
              const TypeIcon = getTypeIcon(report.type);
              return (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <TypeIcon className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {report.title}
                            </h3>
                            {getStatusBadge(report.status)}
                          </div>
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {report.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {report.user_name || 'Anonymous'}
                            </div>
                            {report.user_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                {report.user_phone}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(report.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : language)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Update Controls */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          {language === 'ar' ? 'تحديث الحالة:' : 
                           language === 'he' ? 'עדכון סטטוס:' : 
                           'Update Status:'}
                        </span>
                        <select
                          value={report.status}
                          onChange={(e) => updateReportStatus(report.id, e.target.value)}
                          className="px-3 py-1 border border-gray-200 rounded-lg bg-white text-sm"
                        >
                          <option value="open">
                            {language === 'ar' ? 'مفتوح' : language === 'he' ? 'פתוח' : 'Open'}
                          </option>
                          <option value="in_progress">
                            {language === 'ar' ? 'قيد المعالجة' : language === 'he' ? 'בטיפול' : 'In Progress'}
                          </option>
                          <option value="resolved">
                            {language === 'ar' ? 'تم الحل' : language === 'he' ? 'נפתר' : 'Resolved'}
                          </option>
                          <option value="closed">
                            {language === 'ar' ? 'مغلق' : language === 'he' ? 'סגור' : 'Closed'}
                          </option>
                        </select>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedItem(report);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                        {language === 'ar' ? 'التفاصيل' : 
                         language === 'he' ? 'פרטים' : 
                         'Details'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          {filteredFeedbacks.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {language === 'ar' ? 'لا توجد تقييمات' : 
                   language === 'he' ? 'אין דירוגים' : 
                   'No Feedback Found'}
                </h3>
                <p className="text-gray-500">
                  {language === 'ar' ? 'لم يتم العثور على تقييمات تطابق البحث' : 
                   language === 'he' ? 'לא נמצאו דירוגים התואמים את החיפוש' : 
                   'No feedback matches your search criteria'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredFeedbacks.map((feedback) => (
              <Card key={feedback.id} className={`hover:shadow-lg transition-shadow ${!feedback.is_read ? 'border-blue-300 bg-blue-50/30' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <StarRating rating={feedback.rating} />
                          <span className="text-sm font-medium text-gray-700">
                            ({feedback.rating}/5)
                          </span>
                          {!feedback.is_read && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              {language === 'ar' ? 'جديد' : 
                               language === 'he' ? 'חדש' : 
                               'New'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-800 mb-3 font-medium">
                          {feedback.message}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {feedback.user_name || 'Anonymous'}
                          </div>
                          {feedback.user_phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {feedback.user_phone}
                            </div>
                          )}
                          {feedback.user_email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {feedback.user_email}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(feedback.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : language)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!feedback.is_read && (
                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markFeedbackAsRead(feedback.id)}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        <Eye className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                        {language === 'ar' ? 'تم القراءة' : 
                         language === 'he' ? 'סמן כנקרא' : 
                         'Mark as Read'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Details Modal */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {language === 'ar' ? 'تفاصيل البلاغ' : 
                   language === 'he' ? 'פרטי הדיווח' : 
                   'Report Details'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                  className="p-2"
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Status and Type */}
                <div className="flex items-center gap-4">
                  {getStatusBadge(selectedItem.status)}
                  <Badge className="bg-purple-100 text-purple-800">
                    {language === 'ar' ? 
                      (selectedItem.type === 'service_issue' ? 'مشكلة خدمة' :
                       selectedItem.type === 'technical_problem' ? 'مشكلة تقنية' :
                       selectedItem.type === 'complaint' ? 'شكوى' :
                       selectedItem.type === 'suggestion' ? 'اقتراح' : selectedItem.type) :
                     language === 'he' ?
                      (selectedItem.type === 'service_issue' ? 'בעיית שירות' :
                       selectedItem.type === 'technical_problem' ? 'בעיה טכנית' :
                       selectedItem.type === 'complaint' ? 'תלונה' :
                       selectedItem.type === 'suggestion' ? 'הצעה' : selectedItem.type) :
                      selectedItem.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                    }
                  </Badge>
                  <Badge className={`${
                    selectedItem.severity === 'low' ? 'bg-green-100 text-green-800' :
                    selectedItem.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    selectedItem.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {language === 'ar' ? 
                      (selectedItem.severity === 'low' ? 'منخفضة' :
                       selectedItem.severity === 'medium' ? 'متوسطة' :
                       selectedItem.severity === 'high' ? 'عالية' : 'عاجلة') :
                     language === 'he' ?
                      (selectedItem.severity === 'low' ? 'נמוכה' :
                       selectedItem.severity === 'medium' ? 'בינונית' :
                       selectedItem.severity === 'high' ? 'גבוהה' : 'דחופה') :
                      selectedItem.severity.charAt(0).toUpperCase() + selectedItem.severity.slice(1)
                    }
                  </Badge>
                </div>

                {/* Title */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {language === 'ar' ? 'العنوان' : language === 'he' ? 'כותרת' : 'Title'}
                  </h3>
                  <p className="text-gray-800">{selectedItem.title}</p>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {language === 'ar' ? 'الوصف' : language === 'he' ? 'תיאור' : 'Description'}
                  </h3>
                  <p className="text-gray-800 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {selectedItem.description}
                  </p>
                </div>

                {/* User Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {language === 'ar' ? 'معلومات المستخدم' : language === 'he' ? 'פרטי משתמש' : 'User Information'}
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>{selectedItem.user_name || 'Anonymous'}</span>
                    </div>
                    {selectedItem.user_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{selectedItem.user_phone}</span>
                      </div>
                    )}
                    {selectedItem.user_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{selectedItem.user_email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{new Date(selectedItem.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : language)}</span>
                    </div>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {language === 'ar' ? 'ملاحظات الإدارة' : language === 'he' ? 'הערות מנהל' : 'Admin Notes'}
                  </h3>
                  <textarea
                    value={selectedItem.admin_notes || ''}
                    onChange={(e) => setSelectedItem(prev => ({ ...prev, admin_notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder={language === 'ar' ? 'إضافة ملاحظات للفريق...' : 
                               language === 'he' ? 'הוסף הערות לצוות...' : 
                               'Add notes for the team...'}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {language === 'ar' ? 'تحديث الحالة:' : 
                       language === 'he' ? 'עדכון סטטוס:' : 
                       'Update Status:'}
                    </span>
                    <select
                      value={selectedItem.status}
                      onChange={(e) => setSelectedItem(prev => ({ ...prev, status: e.target.value }))}
                      className="px-3 py-2 border border-gray-200 rounded-lg bg-white"
                    >
                      <option value="open">
                        {language === 'ar' ? 'مفتوح' : language === 'he' ? 'פתוח' : 'Open'}
                      </option>
                      <option value="in_progress">
                        {language === 'ar' ? 'قيد المعالجة' : language === 'he' ? 'בטיפול' : 'In Progress'}
                      </option>
                      <option value="resolved">
                        {language === 'ar' ? 'تم الحل' : language === 'he' ? 'נפתר' : 'Resolved'}
                      </option>
                      <option value="closed">
                        {language === 'ar' ? 'مغلق' : language === 'he' ? 'סגור' : 'Closed'}
                      </option>
                    </select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowDetails(false)}
                    >
                      {language === 'ar' ? 'إلغاء' : language === 'he' ? 'ביטול' : 'Cancel'}
                    </Button>
                    <Button
                      onClick={() => {
                        updateReportStatus(selectedItem.id, selectedItem.status, selectedItem.admin_notes);
                        setShowDetails(false);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {language === 'ar' ? 'حفظ التحديثات' : language === 'he' ? 'שמור עדכונים' : 'Save Updates'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManager;