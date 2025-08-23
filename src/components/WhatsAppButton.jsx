// components/WhatsAppButton.jsx
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WhatsAppButton = ({ language, phoneNumber = "972539364800" }) => {
  const handleWhatsAppClick = () => {
    const message = language === 'ar' 
      ? 'مرحباً، أريد الاستفسار عن خدمات تندرو'
      : language === 'he' 
      ? 'שלום, אני רוצה לברר לגבי שירותי טנדרו'
      : 'Hello, I want to inquire about Tandaro services';
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button 
      onClick={handleWhatsAppClick}
      className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-3"
    >
      <MessageCircle className="w-6 h-6" />
      {language === 'ar' ? 'تواصل معنا عبر واتساب' : 
       language === 'he' ? 'צור קשר בוואטסאפ' : 
       'Contact us on WhatsApp'}
    </Button>
  );
};

export default WhatsAppButton;