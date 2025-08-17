import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/utils/translations";
import { FileText } from "lucide-react";
import { format } from "date-fns";

export default function PDFExporter({ reservation, vehicle, user, language }) {
  const { t } = useTranslation(language);
  const normalizePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all spaces and special characters except digits
  let cleaned = phoneNumber.replace(/[^\d]/g, '');
  
  // Remove country codes (972 or 970) if they exist at the beginning
  if (cleaned.startsWith('972')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('970')) {
    cleaned = cleaned.substring(3);
  }
  
  // If the number doesn't start with 0, add it
  if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  return cleaned;
};

  const generatePDF = () => {
    // Create a detailed HTML content for the PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="${language === 'ar' || language === 'he' ? 'rtl' : 'ltr'}">
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${reservation.id}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header { 
            text-align: center; 
            border-bottom: 3px solid #EF4444; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .logo { 
            font-size: 32px; 
            font-weight: bold; 
            color: #EF4444; 
            margin-bottom: 10px; 
          }
          .invoice-details { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
            margin-bottom: 30px; 
          }
          .section { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
          }
          .section h3 { 
            color: #EF4444; 
            margin-top: 0; 
            border-bottom: 2px solid #EF4444; 
            padding-bottom: 10px; 
          }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
            padding: 5px 0;
          }
          .detail-label { 
            font-weight: 600; 
            color: #666; 
          }
          .detail-value { 
            font-weight: 700; 
            color: #333; 
          }
          .financial-summary { 
            background: linear-gradient(135deg, #f0f9ff, #dbeafe); 
            padding: 20px; 
            border-radius: 12px; 
            margin: 20px 0; 
            border: 2px solid #3b82f6; 
          }
          .total-amount { 
            font-size: 24px; 
            font-weight: bold; 
            color: #EF4444; 
          }
          .signature-section { 
            margin-top: 40px; 
            padding: 20px; 
            border: 2px dashed #ccc; 
            border-radius: 8px; 
            text-align: center; 
          }
          .footer { 
            margin-top: 40px; 
            text-align: center; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #ddd; 
            padding-top: 20px; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">TANDARO</div>
          <p>${language === 'ar' ? 'فاتورة خدمة التوصيل' : language === 'he' ? 'חשבונית שירות משלוחים' : 'Delivery Service Invoice'}</p>
          <p><strong>${language === 'ar' ? 'رقم الفاتورة' : language === 'he' ? 'מספר חשבונית' : 'Invoice Number'}:</strong> ${reservation.id.slice(-8)}</p>
          <p><strong>${language === 'ar' ? 'التاريخ' : language === 'he' ? 'תאריך' : 'Date'}:</strong> ${format(new Date(), 'yyyy/MM/dd')}</p>
        </div>

        <div class="invoice-details">
          <div class="section">
            <h3>${language === 'ar' ? 'معلومات العميل' : language === 'he' ? 'פרטי לקוח' : 'Customer Information'}</h3>
            <div class="detail-row">
              <span class="detail-label">${t('name')}:</span>
              <span class="detail-value">${user?.full_name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${t('phone')}:</span>
              <span class="detail-value">${normalizePhoneNumber(user?.phone) || 'N/A'}</span>
            </div>
            ${user?.company_name ? `
            <div class="detail-row">
              <span class="detail-label">${t('company')}:</span>
              <span class="detail-value">${user.company_name}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <h3>${language === 'ar' ? 'تفاصيل الخدمة' : language === 'he' ? 'פרטי השירות' : 'Service Details'}</h3>
            <div class="detail-row">
              <span class="detail-label">${t('service_type')}:</span>
              <span class="detail-value">${t(reservation.service_type)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${language === 'ar' ? 'المركبة' : language === 'he' ? 'רכב' : 'Vehicle'}:</span>
              <span class="detail-value">${vehicle.name || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">${language === 'ar' ? 'رقم اللوحة' : language === 'he' ? 'מספר רישוי' : 'License Plate'}:</span>
              <span class="detail-value">${vehicle?.license_plate || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>${language === 'ar' ? 'تفاصيل الحجز' : language === 'he' ? 'פרטי ההזמנה' : 'Booking Details'}</h3>
          <div class="detail-row">
            <span class="detail-label">${t('date')}:</span>
            <span class="detail-value">${format(new Date(reservation.start_datetime), 'yyyy/MM/dd')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${t('time')}:</span>
            <span class="detail-value">${format(new Date(reservation.start_datetime), 'HH:mm')} - ${format(new Date(new Date(reservation.start_datetime).getTime() + reservation.duration_hours * 60 * 60 * 1000), 'HH:mm')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${t('duration')}:</span>
            <span class="detail-value">${reservation.duration_hours} ${language === 'ar' ? 'ساعات' : language === 'he' ? 'שעות' : 'hours'}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${t('from')}:</span>
            <span class="detail-value">${reservation.pickup_location}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${t('to')}:</span>
            <span class="detail-value">${reservation.delivery_location}</span>
          </div>
        </div>

        <div class="financial-summary">
          <h3>${language === 'ar' ? 'الملخص المالي' : language === 'he' ? 'סיכום פיננסי' : 'Financial Summary'}</h3>
          <div class="detail-row">
            <span class="detail-label">${t('total_amount')}:</span>
            <span class="detail-value">${reservation.total_amount} ${t('currency')}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">${t('amount_paid')}:</span>
            <span class="detail-value" style="color: #10B981;">${reservation.amount_paid || 0} ${t('currency')}</span>
          </div>
          <div class="detail-row" style="border-top: 2px solid #3b82f6; padding-top: 10px; margin-top: 10px;">
            <span class="detail-label" style="font-size: 18px;">${t('remaining')}:</span>
            <span class="total-amount">${reservation.total_amount - (reservation.amount_paid || 0)} ${t('currency')}</span>
          </div>
        </div>

        ${reservation.notes ? `
        <div class="section">
          <h3>${t('notes')}</h3>
          <p>${reservation.notes}</p>
        </div>
        ` : ''}

        ${reservation.signature_url ? `
        <div class="signature-section">
          <h3>${t('customer_approval')}</h3>
          <img src="${reservation.signature_url}" alt="Customer Signature" style="max-width: 300px; height: auto; border: 1px solid #ddd;" />
        </div>
        ` : ''}

        <div class="footer">
          <p><strong>TANDARO</strong> - ${t('reliable_service')}</p>
          <p>${t('help_whatsapp')} 0539364800</p>
          <p>${language === 'ar' ? 'شكراً لاختيارك خدماتنا' : language === 'he' ? 'תודה שבחרת בשירותים שלנו' : 'Thank you for choosing our services'}</p>
        </div>
      </body>
      </html>
    `;

    // Create a blob and trigger download
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `tandaro-invoice-${reservation.id.slice(-8)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Alternative: For actual PDF generation, you can use the print dialog
    // setTimeout(() => {
    //   const printWindow = window.open('', '_blank');
    //   printWindow.document.write(htmlContent);
    //   printWindow.document.close();
    //   printWindow.focus();
    //   printWindow.print();
    //   printWindow.close();
    // }, 100);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={generatePDF}
      className="border-blue-200 text-blue-700 hover:bg-blue-50"
    >
      <FileText className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
      PDF
    </Button>
  );
}