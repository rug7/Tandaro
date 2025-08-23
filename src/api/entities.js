import { db } from "./firebase.js";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase.js";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";


// Firestore entity functions
export const Vehicle = {
  list: async () => {
    const querySnapshot = await getDocs(collection(db, "vehicles"));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure images is always an array
      return { 
        id: doc.id, 
        ...data,
        images: Array.isArray(data.images) ? data.images : []
      };
    });
  },
  
  create: async (data) => {
    try {
      console.log('Creating vehicle with data:', data);
      
      // Ensure images is an array
      const vehicleData = {
        ...data,
        images: Array.isArray(data.images) ? data.images : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Processed vehicle data:', vehicleData);
      
      const docRef = await addDoc(collection(db, "vehicles"), vehicleData);
      console.log('Vehicle created with ID:', docRef.id);
      
      return { id: docRef.id, ...vehicleData };
    } catch (error) {
      console.error("Create vehicle error:", error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      console.log('Updating vehicle with data:', data);
      
      const vehicleRef = doc(db, "vehicles", id);
      
      // Ensure images is an array if provided
      const updateData = {
        ...data,
        images: data.images && Array.isArray(data.images) ? data.images : (data.images ? [] : undefined),
        updated_at: new Date().toISOString()
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      console.log('Processed update data:', updateData);
      
      await updateDoc(vehicleRef, updateData);
      return true;
    } catch (error) {
      console.error("Update vehicle error:", error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      await deleteDoc(doc(db, "vehicles", id));
      return true;
    } catch (error) {
      console.error("Delete vehicle error:", error);
      throw error;
    }
  }
};

export const User = {
  me: async () => {
    return new Promise((resolve, reject) => {
      try {
        const stored = localStorage.getItem("currentUser");
        resolve(stored ? JSON.parse(stored) : null);
      } catch (error) {
        reject(error);
      }
    });
  },

  list: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("List users error:", error);
      throw error;
    }
  },

  logout: async () => {
    localStorage.removeItem("currentUser");
    window.location.href='/'; 
  },

  updateMyUserData: async (data) => {
    try {
      const stored = JSON.parse(localStorage.getItem("currentUser"));
      if (!stored) return;
      
      const userRef = doc(db, "users", stored.id);
      await updateDoc(userRef, data);
      
      const updated = { ...stored, ...data };
      localStorage.setItem("currentUser", JSON.stringify(updated));
      
      return updated;
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  },

  filter: async (filters) => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      let users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Apply filters
      if (filters.role) {
        users = users.filter(user => user.role === filters.role);
      }
      
      if (filters.is_admin !== undefined) {
        users = users.filter(user => user.is_admin === filters.is_admin);
      }
      
      return users;
    } catch (error) {
      console.error('Error filtering users:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, {
        ...data,
        updated_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error("Update user error:", error);
      throw error;
    }
  },
};

export const Reservation = {
  list: async (sortBy = null) => {
    const querySnapshot = await getDocs(collection(db, "reservations"));
    let reservations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Apply sorting if specified
    if (sortBy) {
      const isDescending = sortBy.startsWith('-');
      const field = isDescending ? sortBy.substring(1) : sortBy;
      
      reservations.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (aVal < bVal) return isDescending ? 1 : -1;
        if (aVal > bVal) return isDescending ? -1 : 1;
        return 0;
      });
    }
    
    return reservations;
  },
  
  create: async (data) => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser"));
      if (!user) {
        throw new Error("Please login first");
      }
      
      const reservationData = {
        ...data,
        user_id: user.id,
        user_phone: user.phone,
        user_name: user.full_name,
        created_at: new Date().toISOString(),
        status: "pending"
      };
      
      await addDoc(collection(db, "reservations"), reservationData);
      return true;
    } catch (error) {
      console.error("Create reservation error:", error);
      throw error;
    }
  },

  listByPhone: async (phoneNumber) => {
    try {
      const querySnapshot = await getDocs(collection(db, "reservations"));
      const allReservations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter by phone number
      return allReservations.filter(reservation => reservation.user_phone === phoneNumber);
    } catch (error) {
      console.error('Error listing reservations by phone:', error);
      throw error;
    }
  },

  filter: async (filters, sortBy = null) => {
    try {
      const querySnapshot = await getDocs(collection(db, "reservations"));
      let reservations = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Apply filters
      if (filters.vehicle_id) {
        reservations = reservations.filter(r => r.vehicle_id === filters.vehicle_id);
      }
      
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          reservations = reservations.filter(r => filters.status.includes(r.status));
        } else {
          reservations = reservations.filter(r => r.status === filters.status);
        }
      }

      // Add assigned_driver_id filter (for DriverJobs)
      if (filters.assigned_driver_id) {
        reservations = reservations.filter(r => r.assigned_driver_id === filters.assigned_driver_id);
      }

      // Add phone number filter
      if (filters.phone) {
        reservations = reservations.filter(r => 
          r.user_phone && r.user_phone.includes(filters.phone)
        );
      }

      // Add vehicle number filter
      if (filters.vehicle_number) {
        // Get vehicles first for license plate lookup
        const vehicleSnapshot = await getDocs(collection(db, "vehicles"));
        const vehicles = vehicleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        reservations = reservations.filter(r => {
          const vehicle = vehicles.find(v => v.id === r.vehicle_id);
          return vehicle && vehicle.license_plate && 
                 vehicle.license_plate.toLowerCase().includes(filters.vehicle_number.toLowerCase());
        });
      }
      
      // Apply sorting if specified
      if (sortBy) {
        const isDescending = sortBy.startsWith('-');
        const field = isDescending ? sortBy.substring(1) : sortBy;
        
        reservations.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];
          
          if (aVal < bVal) return isDescending ? 1 : -1;
          if (aVal > bVal) return isDescending ? -1 : 1;
          return 0;
        });
      }
      
      return reservations;
    } catch (error) {
      console.error('Error filtering reservations:', error);
      throw error;
    }
  },

update: async (id, data) => {
  try {
    console.log('Reservation.update called with:', { id, data });
    
    // Check if id is provided
    if (!id) {
      throw new Error('Reservation ID is required');
    }
    
    // Check if data is provided and is an object
    if (!data || typeof data !== 'object') {
      console.error('Invalid data parameter:', data);
      throw new Error('Data parameter is required and must be an object');
    }

    const reservationRef = doc(db, "reservations", id);
    
    // Filter out undefined values
    const cleanData = {};
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        cleanData[key] = data[key];
      }
    });
    
    console.log('Clean data after filtering:', cleanData);
    
    // Only update if there's data to update
    if (Object.keys(cleanData).length === 0) {
      console.warn('No valid data to update');
      return true;
    }
    
    const finalUpdateData = {
      ...cleanData,
      updated_at: new Date().toISOString()
    };
    
    console.log('Final update data:', finalUpdateData);
    
    await updateDoc(reservationRef, finalUpdateData);
    console.log('Reservation updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
}
};

export const CustomerFeedback = {
  list: async () => {
    const querySnapshot = await getDocs(collection(db, "feedback"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  create: async (data) => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser"));
      const feedbackData = {
        ...data,
        user_id: user?.id || null,
        user_phone: user?.phone || "anonymous",
        user_name: user?.full_name || "anonymous",
        created_at: new Date().toISOString()
      };
      
      await addDoc(collection(db, "feedback"), feedbackData);
      return true;
    } catch (error) {
      console.error("Create feedback error:", error);
      throw error;
    }
  }
};

export const DriverApplication = {
  list: async () => {
    const querySnapshot = await getDocs(collection(db, "driver_applications"));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        vehicle_images: Array.isArray(data.vehicle_images) ? data.vehicle_images : []
      };
    });
  },
  
  create: async (data) => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser"));
      if (!user) {
        throw new Error("Please login first");
      }
      
      const applicationData = {
        ...data,
        user_id: user.id,
        user_phone: user.phone,
        user_name: user.full_name,
        user_email: user.email || null,
        status: "pending",
        vehicle_images: Array.isArray(data.vehicle_images) ? data.vehicle_images : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Creating driver application:', applicationData);
      
      const docRef = await addDoc(collection(db, "driver_applications"), applicationData);
      return { id: docRef.id, ...applicationData };
    } catch (error) {
      console.error("Create driver application error:", error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      const applicationRef = doc(db, "driver_applications", id);
      
      const updateData = {
        ...data,
        vehicle_images: data.vehicle_images && Array.isArray(data.vehicle_images) ? 
          data.vehicle_images : (data.vehicle_images ? [] : undefined),
        updated_at: new Date().toISOString()
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      await updateDoc(applicationRef, updateData);
      return true;
    } catch (error) {
      console.error("Update driver application error:", error);
      throw error;
    }
  },

  acceptApplicationAndCreateVehicle: async (applicationId, adminNotes = '') => {
  try {
    // Get the application data first
    const applicationRef = doc(db, "driver_applications", applicationId);
const applicationDoc = await getDoc(applicationRef);
    
    if (!applicationDoc.exists()) {
      throw new Error('Application not found');
    }
    
    const applicationData = applicationDoc.data();
    
    // Create vehicle from application data
    const vehicleData = {
      // Names - you might want to make these more descriptive
      name_ar: `${applicationData.vehicle_model} - ${applicationData.user_name}`,
      name_he: `${applicationData.vehicle_model} - ${applicationData.user_name}`,
      name_en: `${applicationData.vehicle_model} - ${applicationData.user_name}`,
      
      // Vehicle details from application
      type: applicationData.vehicle_type,
      license_plate: applicationData.license_plate,
      
      // Capacity - you might want to set defaults based on vehicle type
      capacity_ar: getCapacityByType(applicationData.vehicle_type, 'ar'),
      capacity_he: getCapacityByType(applicationData.vehicle_type, 'he'),
      capacity_en: getCapacityByType(applicationData.vehicle_type, 'en'),
      
      // Default pricing - you can adjust this
      price_per_hour: getDefaultPriceByType(applicationData.vehicle_type),
      currency: 'شيكل',
      
      // Vehicle images from application
      images: applicationData.vehicle_images || [],
      
      // Driver information
      driver_id: applicationData.user_id,
      driver_name: applicationData.user_name,
      driver_phone: applicationData.user_phone,
      
      // Default features based on vehicle type
      features_ar: getFeaturesByType(applicationData.vehicle_type, 'ar'),
      features_he: getFeaturesByType(applicationData.vehicle_type, 'he'),
      features_en: getFeaturesByType(applicationData.vehicle_type, 'en'),
      
      // Status
      available: true,
      source: 'driver_application',
      application_id: applicationId,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Create the vehicle
    const vehicleDocRef = await addDoc(collection(db, "vehicles"), vehicleData);
    const createdVehicle = { id: vehicleDocRef.id, ...vehicleData };
    
    // Update the application status to approved
    await updateDoc(applicationRef, {
      status: 'approved',
      approved_at: new Date().toISOString(),
      admin_notes: adminNotes,
      created_vehicle_id: vehicleDocRef.id,
      updated_at: new Date().toISOString()
    });
    
    // Update user role to driver
    const userRef = doc(db, "users", applicationData.user_id);
    await updateDoc(userRef, {
      role: 'driver',
      vehicle_id: vehicleDocRef.id,
      updated_at: new Date().toISOString()
    });
    
    return {
      application: { id: applicationId, ...applicationData, status: 'approved' },
      vehicle: createdVehicle
    };
    
  } catch (error) {
    console.error("Error accepting application and creating vehicle:", error);
    throw error;
  }
},
  
  filter: async (filters) => {
    try {
      const querySnapshot = await getDocs(collection(db, "driver_applications"));
      let applications = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          vehicle_images: Array.isArray(data.vehicle_images) ? data.vehicle_images : []
        };
      });
      
      // Apply filters
      if (filters.status) {
        if (Array.isArray(filters.status)) {
          applications = applications.filter(app => filters.status.includes(app.status));
        } else {
          applications = applications.filter(app => app.status === filters.status);
        }
      }
      
      if (filters.user_id) {
        applications = applications.filter(app => app.user_id === filters.user_id);
      }
      
      return applications;
    } catch (error) {
      console.error('Error filtering driver applications:', error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await deleteDoc(doc(db, "driver_applications", id));
      return true;
    } catch (error) {
      console.error("Delete driver application error:", error);
      throw error;
    }
  }
};

export const GalleryImage = {
  list: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "gallery_images"));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(img => img.is_active !== false)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error("List gallery images error:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const imageData = {
        ...data,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, "gallery_images"), imageData);
      return { id: docRef.id, ...imageData };
    } catch (error) {
      console.error("Create gallery image error:", error);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const imageRef = doc(db, "gallery_images", id);
      await updateDoc(imageRef, {
        is_active: false,
        deleted_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error("Delete gallery image error:", error);
      throw error;
    }
  },

  uploadImage: async (file) => {
    try {
      const filename = `gallery/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filename);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error("Upload image error:", error);
      throw error;
    }
  }
};

export const Feedback = {
  list: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "feedback"));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error("List feedback error:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser"));
      const feedbackData = {
        ...data,
        user_id: user?.id || null,
        user_name: user?.full_name || data.name || 'Anonymous',
        user_email: user?.email || data.email || null,
        user_phone: user?.phone || null,
        created_at: new Date().toISOString(),
        is_read: false
      };
      
      const docRef = await addDoc(collection(db, "feedback"), feedbackData);
      return { id: docRef.id, ...feedbackData };
    } catch (error) {
      console.error("Create feedback error:", error);
      throw error;
    }
  },

  markAsRead: async (id) => {
    try {
      const feedbackRef = doc(db, "feedback", id);
      await updateDoc(feedbackRef, {
        is_read: true,
        read_at: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error("Mark feedback as read error:", error);
      throw error;
    }
  }
};

export const Report = {
  list: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "reports"));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error("List reports error:", error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser"));
      const reportData = {
        ...data,
        user_id: user?.id || null,
        user_name: user?.full_name || 'Anonymous',
        user_email: user?.email || null,
        user_phone: user?.phone || null,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, "reports"), reportData);
      return { id: docRef.id, ...reportData };
    } catch (error) {
      console.error("Create report error:", error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const reportRef = doc(db, "reports", id);
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      if (data.status === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      await updateDoc(reportRef, updateData);
      return true;
    } catch (error) {
      console.error("Update report error:", error);
      throw error;
    }
  },

  filter: async (filters) => {
    try {
      const querySnapshot = await getDocs(collection(db, "reports"));
      let reports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (filters.status) {
        reports = reports.filter(report => report.status === filters.status);
      }
      
      if (filters.user_id) {
        reports = reports.filter(report => report.user_id === filters.user_id);
      }
      
      return reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (error) {
      console.error('Error filtering reports:', error);
      throw error;
    }
  }
};

const getCapacityByType = (vehicleType, language) => {
  const capacities = {
    'pickup': {
      ar: 'حمولة صغيرة - متوسطة',
      he: 'מטען קטן-בינוני',
      en: 'Small-Medium Load'
    },
    'small-truck': {
      ar: 'حمولة متوسطة',
      he: 'מטען בינוני',
      en: 'Medium Load'
    },
    'large-truck': {
      ar: 'حمولة كبيرة',
      he: 'מטען גדול',
      en: 'Large Load'
    },
    'van': {
      ar: 'حمولة خفيفة',
      he: 'מטען קל',
      en: 'Light Load'
    },
    'other': {
      ar: 'حسب النوع',
      he: 'לפי סוג',
      en: 'By Type'
    }
  };
  
  return capacities[vehicleType]?.[language] || capacities['pickup'][language];
};

const getDefaultPriceByType = (vehicleType) => {
  const prices = {
    'pickup': 80,
    'small-truck': 100,
    'large-truck': 150,
    'van': 70,
    'other': 80
  };
  
  return prices[vehicleType] || 80;
};

const getFeaturesByType = (vehicleType, language) => {
  const features = {
    'pickup': {
      ar: ['مكيف', 'صندوق مفتوح', 'مناسب للأثاث'],
      he: ['מזגן', 'ארגז פתוח', 'מתאים לרהיטים'],
      en: ['Air Conditioned', 'Open Bed', 'Furniture Suitable']
    },
    'small-truck': {
      ar: ['صندوق مغلق', 'مناسب للبضائع', 'حماية من المطر'],
      he: ['ארגז סגור', 'מתאים לסחורות', 'הגנה מגשם'],
      en: ['Closed Box', 'Goods Suitable', 'Weather Protection']
    },
    'large-truck': {
      ar: ['حمولة ثقيلة', 'صندوق كبير', 'للنقل التجاري'],
      he: ['מטען כבד', 'ארגז גדול', 'להובלה מסחרית'],
      en: ['Heavy Load', 'Large Box', 'Commercial Transport']
    },
    'van': {
      ar: ['مناسب للطرود', 'توصيل سريع', 'مكيف'],
      he: ['מתאים לחבילות', 'משלוח מהיר', 'מזגן'],
      en: ['Package Suitable', 'Fast Delivery', 'Air Conditioned']
    }
  };
  
  return features[vehicleType]?.[language] || features['pickup'][language];
};