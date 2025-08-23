// components/FeedbackReport.jsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Star, Send, AlertTriangle, Bug, Lightbulb } from 'lucide-react';
import { Feedback, Report } from '@/api/entities';
import { toast } from 'react-hot-toast';

const FeedbackReport = ({ language, user }) => {
  const [activeTab, setActiveTab] = useState('feedback');
  const [feedbackData, setFeedbackData] = useState({
    rating: 0,
    message: '',
    name: user?.full_name || '',
    email: user?.email || ''
  });
  const [reportData, setReportData] = useState({
    type: '',
    title: '',
    description: '',
    severity: 'medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportTypes = [
    { 
      value: 'service_issue', 
      label: {
        ar: 'مشكلة في الخدمة',
        he: 'בעיה בשירות',
        en: 'Service Issue'
      },
      icon: AlertTriangle 
    },
    { 
      value: 'technical_problem', 
      label: {
        ar: 'مشكلة تقنية',
        he: 'בעיה טכנית',
        en: 'Technical Problem'
      },
      icon: Bug 
    },
    { 
      value: 'complaint', 
      label: {
        ar: 'شكوى',
        he: 'תלונה',
        en: 'Complaint'
      },
      icon: AlertTriangle 
    },
    { 
      value: 'suggestion', 
      label: {
        ar: 'اقتراح للتحسين',
        he: 'הצעה לשיפור',
        en: 'Suggestion'
      },
      icon: Lightbulb 
    }
  ];

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    
    if (feedbackData.rating === 0) {
      toast.error(
        language === 'ar' ? 'يرجى تقييم الخدمة' :
        language === 'he' ? 'אנא דרג את השירות' :
        'Please rate the service'
      );
      return;
    }

    if (!feedbackData.message.trim()) {
      toast.error(
        language === 'ar' ? 'يرجى كتابة رأيك' :
        language === 'he' ? 'אנא כתב את דעתך' :
        'Please write your feedback'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await Feedback.create({
        ...feedbackData,
        type: 'feedback'
      });

      toast.success(
        language === 'ar' ? 'شكراً لك! تم إرسال تقييمك بنجاح' :
        language === 'he' ? 'תודה! הדירוג שלך נשלח בהצלחה' :
        'Thank you! Your feedback has been submitted successfully'
      );

      setFeedbackData({
        rating: 0,
        message: '',
        name: user?.full_name || '',
        email: user?.email || ''
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(
        language === 'ar' ? 'حدث خطأ في الإرسال' :
        language === 'he' ? 'שגיאה בשליחה' :
        'Error submitting feedback'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    if (!reportData.type || !reportData.title.trim() || !reportData.description.trim()) {
      toast.error(
        language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' :
        language === 'he' ? 'אנא מלא את כל השדות הנדרשים' :
        'Please fill in all required fields'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await Report.create(reportData);

      toast.success(
        language === 'ar' ? 'تم إرسال بلاغك بنجاح. سنتواصل معك قريباً' :
        language === 'he' ? 'הדיווח שלך נשלח בהצלחה. ניצור איתך קשר בקרוב' :
        'Your report has been submitted successfully. We will contact you soon'
      );

      setReportData({
        type: '',
        title: '',
        description: '',
        severity: 'medium'
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error(
        language === 'ar' ? 'حدث خطأ في الإرسال' :
        language === 'he' ? 'שגיאה בשליחה' :
        'Error submitting report'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const StarRating = ({ rating, onRatingChange, readonly = false }) => {
    return (
      <div className="flex gap-1 justify-center mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => !readonly && onRatingChange(star)}
            className={`w-8 h-8 transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
            disabled={readonly}
          >
            <Star
              className={`w-full h-full ${
                star <= rating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/50 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          {language === 'ar' ? 'رأيك يهمنا' : 
           language === 'he' ? 'החוות דעת שלך חשובה לנו' : 
           'Your Opinion Matters'}
        </h2>
        <p className="text-slate-600 text-lg">
          {language === 'ar' ? 'شاركنا تجربتك أو أبلغنا عن أي مشكلة' : 
           language === 'he' ? 'שתף אותנו בחוויה או דווח על בעיה' : 
           'Share your experience or report any issues'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors ${
            activeTab === 'feedback'
              ? 'bg-white text-green-600 shadow-md'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {language === 'ar' ? 'تقييم الخدمة' : 
           language === 'he' ? 'דירוג שירות' : 
           'Service Rating'}
        </button>
        
        <button
          onClick={() => setActiveTab('report')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors ${
            activeTab === 'report'
              ? 'bg-white text-red-600 shadow-md'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
          {language === 'ar' ? 'بلاغ مشكلة' : 
           language === 'he' ? 'דיווח בעיה' : 
           'Report Issue'}
        </button>
      </div>

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <form onSubmit={handleFeedbackSubmit} className="space-y-6">
          <div>
            <label className="block text-center text-lg font-semibold text-gray-700 mb-4">
              {language === 'ar' ? 'كيف تقيم خدمتنا؟' :
               language === 'he' ? 'איך אתה מדרג את השירות שלנו?' :
               'How would you rate our service?'}
            </label>
            <StarRating
              rating={feedbackData.rating}
              onRatingChange={(rating) => setFeedbackData(prev => ({ ...prev, rating }))}
            />
          </div>

          {!user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'الاسم' : language === 'he' ? 'שם' : 'Name'}
                </label>
                <input
                  type="text"
                  value={feedbackData.name}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={language === 'ar' ? 'اكتب اسمك' : language === 'he' ? 'כתב את השם שלך' : 'Enter your name'}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'ar' ? 'البريد الإلكتروني (اختياري)' : 
                   language === 'he' ? 'אימייל (אופציונלי)' : 
                   'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={feedbackData.email}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={language === 'ar' ? 'البريد الإلكتروني' : language === 'he' ? 'כתובת אימייל' : 'Email address'}
                />
              </div>
            </div>
                      )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'ar' ? 'رأيك وتعليقك' : 
               language === 'he' ? 'דעתך והערותיך' : 
               'Your Feedback'}
            </label>
            <textarea
              value={feedbackData.message}
              onChange={(e) => setFeedbackData(prev => ({ ...prev, message: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder={language === 'ar' ? 'شاركنا تجربتك مع خدمتنا...' : 
                          language === 'he' ? 'שתף אותנו בחוויה שלך עם השירות...' : 
                          'Share your experience with our service...'}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || feedbackData.rating === 0}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {language === 'ar' ? 'جاري الإرسال...' : language === 'he' ? 'שולח...' : 'Sending...'}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                {language === 'ar' ? 'إرسال التقييم' : language === 'he' ? 'שלח דירוג' : 'Send Feedback'}
              </div>
            )}
          </Button>
        </form>
      )}

      {/* Report Tab */}
      {activeTab === 'report' && (
        <form onSubmit={handleReportSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {language === 'ar' ? 'نوع المشكلة' : 
               language === 'he' ? 'סוג הבעיה' : 
               'Issue Type'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setReportData(prev => ({ ...prev, type: type.value }))}
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl transition-all ${
                      reportData.type === type.value
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{type.label[language] || type.label.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'ar' ? 'عنوان المشكلة' : 
               language === 'he' ? 'כותרת הבעיה' : 
               'Issue Title'}
            </label>
            <input
              type="text"
              value={reportData.title}
              onChange={(e) => setReportData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={language === 'ar' ? 'عنوان قصير للمشكلة' : 
                          language === 'he' ? 'כותרת קצרה לבעיה' : 
                          'Brief title for the issue'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'ar' ? 'وصف المشكلة' : 
               language === 'he' ? 'תיאור הבעיה' : 
               'Issue Description'}
            </label>
            <textarea
              value={reportData.description}
              onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder={language === 'ar' ? 'اشرح المشكلة بالتفصيل...' : 
                          language === 'he' ? 'הסבר את הבעיה בפירוט...' : 
                          'Describe the issue in detail...'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {language === 'ar' ? 'مستوى الأولوية' : 
               language === 'he' ? 'רמת עדיפות' : 
               'Priority Level'}
            </label>
            <div className="flex gap-2">
              {[
                { value: 'low', label: { ar: 'منخفضة', he: 'נמוכה', en: 'Low' }, color: 'green' },
                { value: 'medium', label: { ar: 'متوسطة', he: 'בינונית', en: 'Medium' }, color: 'yellow' },
                { value: 'high', label: { ar: 'عالية', he: 'גבוהה', en: 'High' }, color: 'orange' },
                { value: 'urgent', label: { ar: 'عاجلة', he: 'דחופה', en: 'Urgent' }, color: 'red' }
              ].map((severity) => (
                <button
                  key={severity.value}
                  type="button"
                  onClick={() => setReportData(prev => ({ ...prev, severity: severity.value }))}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium transition-colors ${
                    reportData.severity === severity.value
                      ? `bg-${severity.color}-100 text-${severity.color}-700 border-2 border-${severity.color}-300`
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {severity.label[language] || severity.label.en}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !reportData.type || !reportData.title.trim() || !reportData.description.trim()}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-lg font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {language === 'ar' ? 'جاري الإرسال...' : language === 'he' ? 'שולח...' : 'Sending...'}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                {language === 'ar' ? 'إرسال البلاغ' : language === 'he' ? 'שלח דיווח' : 'Send Report'}
              </div>
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default FeedbackReport;