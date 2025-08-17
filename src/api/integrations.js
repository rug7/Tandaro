import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const UploadFile = async (file, path) => {
  try {
    // Get storage instance
    const storage = getStorage();
    
    // Validate file
    if (!file || !file.type) {
      throw new Error('Invalid file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    // Create a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${randomString}_${sanitizedFileName}`;
    const fullPath = `${path}/${filename}`;
    
    console.log('Uploading to path:', fullPath);
    console.log('File details:', { name: file.name, size: file.size, type: file.type });
    
    // Create storage reference
    const storageRef = ref(storage, fullPath);
    
    // Upload file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'admin'
      }
    };

    console.log('Starting upload...');
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log('Upload completed:', snapshot.metadata.fullPath);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL obtained:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Upload error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    // Handle specific Firebase errors
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please check your Firebase Storage rules.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled.');
    } else if (error.code === 'storage/quota-exceeded') {
      throw new Error('Storage quota exceeded.');
    } else if (error.code === 'storage/invalid-format') {
      throw new Error('Invalid file format.');
    }
    
    throw error;
  }
};