// import React, { useRef, useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { storage } from "@/api/firebase"; // Import storage directly
// import { useTranslation } from "@/components/utils/translations";
// import { X, RotateCcw, Save, Pen } from "lucide-react";


// export default function SignaturePad({ isOpen, onClose, onSave, language }) {
//   const canvasRef = useRef(null);
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const { t } = useTranslation(language);

//   useEffect(() => {
//     if (isOpen && canvasRef.current) {
//       const canvas = canvasRef.current;
//       const ctx = canvas.getContext('2d');
      
//       // Set canvas size
//       canvas.width = 400;
//       canvas.height = 200;
      
//       // Set drawing styles
//       ctx.strokeStyle = '#000000';
//       ctx.lineWidth = 2;
//       ctx.lineCap = 'round';
//       ctx.lineJoin = 'round';
      
//       // Fill with white background
//       ctx.fillStyle = '#ffffff';
//       ctx.fillRect(0, 0, canvas.width, canvas.height);
//     }
//   }, [isOpen]);

//   const startDrawing = (e) => {
//     setIsDrawing(true);
//     const canvas = canvasRef.current;
//     const rect = canvas.getBoundingClientRect();
//     const ctx = canvas.getContext('2d');
    
//     // Use clientX/Y for mouse events, adjust for canvas position
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
    
//     ctx.beginPath();
//     ctx.moveTo(x, y);
//   };

//   const draw = (e) => {
//     if (!isDrawing) return;
    
//     const canvas = canvasRef.current;
//     const rect = canvas.getBoundingClientRect();
//     const ctx = canvas.getContext('2d');
    
//     // Use clientX/Y for mouse events, adjust for canvas position
//     const x = e.clientX - rect.left;
//     const y = e.clientY - rect.top;
    
//     ctx.lineTo(x, y);
//     ctx.stroke();
//   };

//   const stopDrawing = () => {
//     setIsDrawing(false);
//   };

//   const clearCanvas = () => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     ctx.fillStyle = '#ffffff';
//     ctx.fillRect(0, 0, canvas.width, canvas.height);
//   };

// const saveSignature = async () => {
//   setIsSaving(true);
//   try {
//     const canvas = canvasRef.current;
//     canvas.toBlob(async (blob) => {
//       if (blob) {
//         // Use the imported storage directly
//         const fileName = `signatures/sig_${Date.now()}.png`;
//         const storageRef = ref(storage, fileName);

//         // Upload the blob
//         await uploadBytes(storageRef, blob);
        
//         // Get the download URL
//         const downloadURL = await getDownloadURL(storageRef);
        
//         // Save the URL
//         onSave(downloadURL);
//         onClose();
//       } else {
//         console.error('Failed to create blob from canvas.');
//       }
//     }, 'image/png');
//   } catch (error) {
//     console.error('Error saving signature:', error);
//   } finally {
//     setIsSaving(false);
//   }
// };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
//         <div className="flex items-center justify-between mb-6">
//           <h3 className="text-xl font-bold text-gray-900 flex items-center">
//             <Pen className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
//             {t('customer_approval')}
//           </h3>
//           <Button variant="ghost" size="sm" onClick={onClose}>
//             <X className="w-5 h-5" />
//           </Button>
//         </div>

//         <div className="space-y-4">
//           <p className="text-gray-600 text-center">
//             {language === 'ar' ? 'يرجى التوقيع في المنطقة أدناه' : 
//              language === 'he' ? 'אנא חתום באזור למטה' : 
//              'Please sign in the area below'}
//           </p>

//           <div className="border-2 border-gray-300 rounded-xl bg-white">
//             <canvas
//               ref={canvasRef}
//               className="w-full cursor-crosshair rounded-xl"
//               onMouseDown={startDrawing}
//               onMouseMove={draw}
//               onMouseUp={stopDrawing}
//               onMouseLeave={stopDrawing}
//             />
//           </div>

//           <div className="flex justify-between gap-3">
//             <Button
//               variant="outline"
//               onClick={clearCanvas}
//               className="flex-1 border-gray-300"
//             >
//               <RotateCcw className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
//               {language === 'ar' ? 'مسح' : language === 'he' ? 'נקה' : 'Clear'}
//             </Button>
            
//             <Button
//               onClick={saveSignature}
//               disabled={isSaving}
//               className="flex-1 gradient-red text-white hover:opacity-90"
//             >
//               {isSaving ? (
//                 <>
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 rtl:ml-2 rtl:mr-0"></div>
//                   {language === 'ar' ? 'جاري الحفظ...' : language === 'he' ? 'שומר...' : 'Saving...'}
//                 </>
//               ) : (
//                 <>
//                   <Save className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
//                   {t('save')}
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UploadFile } from '@/api/integrations';
import { Save, RotateCcw, X } from 'lucide-react';

export default function SignaturePad({ isOpen, onClose, onSave, language }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [saving, setSaving] = useState(false);

  const t = (ar, en) => language === 'ar' ? ar : en;

  useEffect(() => {
    if (isOpen) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 400;
      canvas.height = 200;
      
      // Set drawing style
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Fill with white background
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [isOpen]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    setIsEmpty(false);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const saveSignature = async () => {
    if (isEmpty) return;
    
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      
      // Convert canvas to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      
      // Create file from blob
      const file = new File([blob], 'signature.png', { type: 'image/png' });
      
      // Upload to Firebase Storage
      const signatureUrl = await UploadFile(file, 'signatures');
      
      onSave(signatureUrl);
    } catch (error) {
      console.error('Error saving signature:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {t('توقيع العميل', 'Customer Signature')}
          </h3>
          <Button variant="ghost" onClick={onClose} className="p-2">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
          <canvas
            ref={canvasRef}
            className="border border-gray-200 rounded cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            style={{ width: '100%', height: '150px' }}
          />
        </div>
        
        <p className="text-sm text-gray-600 mt-2 text-center">
          {t('ارسم بالماوس أو الإصبع على الشاشة', 'Draw with mouse or finger on screen')}
        </p>
        
        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={clearCanvas}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('مسح', 'Clear')}
          </Button>
          <Button
            onClick={saveSignature}
            disabled={isEmpty || saving}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {t('جاري الحفظ...', 'Saving...')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t('حفظ', 'Save')}
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}