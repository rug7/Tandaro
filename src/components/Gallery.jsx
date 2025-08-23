// components/Gallery.jsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Upload, X, Eye, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GalleryImage } from '@/api/entities';
import { toast } from 'react-hot-toast';

const Gallery = ({ language, isAdmin = false }) => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-slide functionality
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [images.length]);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setIsLoading(true);
      const galleryImages = await GalleryImage.list();
      setImages(galleryImages);
    } catch (error) {
      console.error('Error loading images:', error);
      if (!isAdmin) { // Don't show error to regular users
        setImages([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`);
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          throw new Error(`${file.name} is too large. Maximum size is 5MB`);
        }

        // Upload to Firebase Storage
        const imageUrl = await GalleryImage.uploadImage(file);
        
        // Create gallery entry in Firestore
        const newImage = await GalleryImage.create({
          url: imageUrl,
          title: `عمل جديد ${new Date().toLocaleDateString('ar')}`,
          description: 'خدمة احترافية مكتملة',
          filename: file.name,
          uploaded_by: 'admin'
        });
        
        return newImage;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setImages(prev => [...uploadedImages, ...prev]);
      
      toast.success(
        language === 'ar' ? `تم رفع ${uploadedImages.length} صور بنجاح` :
        language === 'he' ? `${uploadedImages.length} תמונות הועלו בהצלחה` :
        `${uploadedImages.length} images uploaded successfully`
      );
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(error.message || (
        language === 'ar' ? 'خطأ في رفع الصور' :
        language === 'he' ? 'שגיאה בהעלאת התמונות' :
        'Error uploading images'
      ));
    } finally {
      setIsUploading(false);
      // Clear the input
      event.target.value = '';
    }
  };

  const deleteImage = async (imageId) => {
    if (!window.confirm(
      language === 'ar' ? 'هل أنت متأكد من حذف هذه الصورة؟' :
      language === 'he' ? 'האם אתה בטוח שברצונך למחוק את התמונה?' :
      'Are you sure you want to delete this image?'
    )) return;

    try {
      await GalleryImage.delete(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      
      // Adjust current index if needed
      if (currentIndex >= images.length - 1) {
        setCurrentIndex(Math.max(0, images.length - 2));
      }
      
      toast.success(
        language === 'ar' ? 'تم حذف الصورة' :
        language === 'he' ? 'התמונה נמחקה' :
        'Image deleted'
      );
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error(
        language === 'ar' ? 'خطأ في حذف الصورة' :
        language === 'he' ? 'שגיאה במחיקת התמונה' :
        'Error deleting image'
      );
    }
  };

  const nextImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {language === 'ar' ? 'جاري تحميل المعرض...' : 
             language === 'he' ? 'טוען גלריה...' : 
             'Loading gallery...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't show gallery section if no images and not admin
  if (images.length === 0 && !isAdmin) {
    return null;
  }

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/50">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          {language === 'ar' ? 'أعمالنا المميزة' : 
           language === 'he' ? 'העבודות המובחרות שלנו' : 
           'Our Featured Work'}
        </h2>
        <p className="text-slate-600 text-lg">
          {language === 'ar' ? 'شاهد جودة خدماتنا من خلال أعمالنا السابقة' : 
           language === 'he' ? 'ראה את איכות השירותים שלנו דרך עבודות קודמות' : 
           'See the quality of our services through our previous work'}
        </p>
      </div>

      {/* Admin Upload Section */}
      {isAdmin && (
        <div className="mb-8 p-6 bg-blue-50 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-blue-900">
              {language === 'ar' ? 'إدارة المعرض' : 
               language === 'he' ? 'ניהול גלריה' : 
               'Gallery Management'}
            </h3>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
              <div className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-colors ${
                isUploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              } text-white`}>
                <Upload className="w-5 h-5" />
                {isUploading 
                  ? (language === 'ar' ? 'جاري الرفع...' : language === 'he' ? 'מעלה...' : 'Uploading...')
                  : (language === 'ar' ? 'رفع صور' : language === 'he' ? 'העלה תמונות' : 'Upload Images')
                }
              </div>
            </label>
            
            <div className="text-sm text-blue-700 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>
                {language === 'ar' ? `${images.length} صور محملة` : 
                 language === 'he' ? `${images.length} תמונות נטענו` : 
                 `${images.length} images loaded`}
              </span>
            </div>

            <div className="text-xs text-gray-600">
              {language === 'ar' ? 'الحد الأقصى: 5MB لكل صورة' :
               language === 'he' ? 'מקסימום: 5MB לתמונה' :
               'Max: 5MB per image'}
            </div>
          </div>
        </div>
      )}

      {/* Gallery Display */}
      {images.length > 0 ? (
        <div className="relative">
          {/* Main Image Display - SIMPLIFIED */}
          <div className="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden group">
            <img
              src={images[currentIndex]?.url}
              alt={`Gallery image ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2YjdyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+';
              }}
            />
            
            {/* Controls - Only show on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {/* Full Screen Button */}
              <button
                onClick={() => setShowFullImage(true)}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 transition-colors shadow-lg"
              >
                <Eye className="w-5 h-5 text-gray-700" />
              </button>
              
              {/* Delete Button for Admin */}
              {isAdmin && (
                <button
                  onClick={() => deleteImage(images[currentIndex]?.id)}
                  className="absolute top-4 left-4 bg-red-500/90 hover:bg-red-600 rounded-full p-2 transition-colors shadow-lg"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                  </button>
                  
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                  </button>
                </>
              )}
            </div>
            
            {/* Progress Dots - Always visible at bottom */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentIndex 
                        ? 'bg-white shadow-lg' 
                        : 'bg-white/50 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : isAdmin ? (
        // Empty state for admin
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            {language === 'ar' ? 'لا توجد صور في المعرض' :
             language === 'he' ? 'אין תמונות בגלריה' :
             'No images in gallery'}
          </h3>
          <p className="text-gray-500 mb-6">
            {language === 'ar' ? 'ابدأ برفع صور أعمالك المميزة' :
             language === 'he' ? 'התחל בהעלאת תמונות של העבודות המובחרות שלך' :
             'Start by uploading images of your featured work'}
          </p>
        </div>
      ) : null}

      {/* Full Screen Modal */}
      {showFullImage && images[currentIndex] && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" 
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-7xl max-h-full">
            <img
              src={images[currentIndex]?.url}
              alt={`Gallery image ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Close Button */}
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Navigation in fullscreen */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* Image counter in fullscreen */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full">
                {currentIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;