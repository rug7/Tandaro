import React, { useState, useEffect } from "react";
import { CustomerFeedback } from "@/api/entities";
import { useTranslation } from "@/components/utils/translations";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FeedbackSection({ language }) {
  const { t } = useTranslation(language);
  const [feedbacks, setFeedbacks] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
  try {
    const all = await CustomerFeedback.list();
    const data = all.filter(f => f.is_featured);
    setFeedbacks(data);
  } catch (error) {
    console.error('Error loading feedbacks:', error);
  } finally {
    setIsLoading(false);
  }
};

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % feedbacks.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + feedbacks.length) % feedbacks.length);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return null; // Don't show section if no feedback
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {language === 'ar' ? 'ماذا يقول عملاؤنا' : 
             language === 'he' ? 'מה הלקוחות שלנו אומרים' : 
             'What Our Customers Say'}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {language === 'ar' ? 'تجارب حقيقية من عملائنا الكرام' : 
             language === 'he' ? 'חוויות אמיתיות מהלקוחות היקרים שלנו' : 
             'Real experiences from our valued customers'}
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedbacks.slice(0, 6).map((feedback, index) => (
            <Card key={feedback.id} className="card-premium p-6 h-full">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    {renderStars(feedback.rating)}
                  </div>
                  <Quote className="w-8 h-8 text-red-200" />
                </div>
                
                <p className="text-gray-700 mb-4 line-clamp-4 leading-relaxed">
                  "{feedback.feedback_text}"
                </p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{feedback.customer_name}</p>
                    {feedback.service_type && (
                      <p className="text-sm text-gray-500">
                        {t(feedback.service_type)}
                      </p>
                    )}
                  </div>
                  
                  {feedback.image_url && (
                    <img
                      src={feedback.image_url}
                      alt="Customer feedback"
                      className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative">
          {feedbacks.length > 0 && (
            <Card className="card-premium p-6 mx-4">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    {renderStars(feedbacks[currentIndex].rating)}
                  </div>
                  <Quote className="w-8 h-8 text-red-200" />
                </div>
                
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{feedbacks[currentIndex].feedback_text}"
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-900">{feedbacks[currentIndex].customer_name}</p>
                    {feedbacks[currentIndex].service_type && (
                      <p className="text-sm text-gray-500">
                        {t(feedbacks[currentIndex].service_type)}
                      </p>
                    )}
                  </div>
                  
                  {feedbacks[currentIndex].image_url && (
                    <img
                      src={feedbacks[currentIndex].image_url}
                      alt="Customer feedback"
                      className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                    />
                  )}
                </div>

                {feedbacks.length > 1 && (
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevSlide}
                      className="p-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex space-x-2">
                      {feedbacks.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentIndex ? 'bg-red-500' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextSlide}
                      className="p-2"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600 mb-4">
            {language === 'ar' ? 'انضم إلى عملائنا الراضين' : 
             language === 'he' ? 'הצטרף ללקוחות המרוצים שלנו' : 
             'Join our satisfied customers'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="text-sm text-gray-500">
              {language === 'ar' ? 'للمساعدة: واتساب 0539364800' : 
               language === 'he' ? 'לעזרה: WhatsApp 0539364800' : 
               'For help: WhatsApp 0539364800'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}