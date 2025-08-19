import { db } from './firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

class NotificationService {
  constructor() {
    this.listeners = new Map();
    this.notificationSound = null;
    this.initNotificationSound();
  }

  initNotificationSound() {
    // Create a simple notification sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      this.playNotificationSound = () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      };
    } catch (error) {
      console.log('Audio context not available');
      this.playNotificationSound = () => {}; // No-op if audio isn't available
    }
  }

  // Listen for new job assignments for a specific driver
  listenForJobAssignments(driverId, onNewAssignment, language = 'ar') {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef, 
      where('assigned_driver_id', '==', driverId),
      orderBy('updated_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const jobData = { id: change.doc.id, ...change.doc.data() };
          
          // Check if this is a new assignment (job was just assigned)
          const assignedTime = new Date(jobData.updated_at);
          const now = new Date();
          const timeDiff = now - assignedTime;
          
          // If assignment happened within the last 30 seconds, consider it a new assignment
          if (timeDiff < 30000 && jobData.assigned_driver_id === driverId) {
            this.showJobAssignmentNotification(jobData, language);
            onNewAssignment(jobData);
          }
        }
        
        if (change.type === 'added') {
          const jobData = { id: change.doc.id, ...change.doc.data() };
          
          // Check if this job was recently assigned to this driver
          if (jobData.assigned_driver_id === driverId) {
            const assignedTime = new Date(jobData.updated_at);
            const now = new Date();
            const timeDiff = now - assignedTime;
            
            // If it's a very recent assignment, show notification
            if (timeDiff < 30000) {
              this.showJobAssignmentNotification(jobData, language);
              onNewAssignment(jobData);
            }
          }
        }
      });
    });

    this.listeners.set(driverId, unsubscribe);
    return unsubscribe;
  }

  showJobAssignmentNotification(jobData, language) {
    // Play notification sound
    this.playNotificationSound();

    // Show toast notification using a simple string message instead of JSX
    const t = (ar, en, he) => {
      if (language === 'ar') return ar;
      if (language === 'he') return he;
      return en;
    };

    const message = `${t('تم تعيينك لمهمة جديدة!', 'New job assigned to you!', 'הוקצתה לך משימה חדשה!')}\n${t('من', 'From', 'מ')}: ${jobData.pickup_location?.substring(0, 30)}...\n${t('إلى', 'To', 'ל')}: ${jobData.delivery_location?.substring(0, 30)}...`;

    toast.success(message, {
      duration: 6000,
      position: language === 'ar' || language === 'he' ? 'top-left' : 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
        fontWeight: '500',
      },
    });

    // Show browser notification if permission granted
    this.showBrowserNotification(jobData, language);
  }

  async showBrowserNotification(jobData, language) {
    if (!('Notification' in window)) return;

    const t = (ar, en, he) => {
      if (language === 'ar') return ar;
      if (language === 'he') return he;
      return en;
    };

    if (Notification.permission === 'granted') {
      const notification = new Notification(
        t('مهمة جديدة', 'New Job', 'משימה חדשה'),
        {
          body: `${t('من', 'From', 'מ')}: ${jobData.pickup_location}\n${t('إلى', 'To', 'ל')}: ${jobData.delivery_location}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `job-${jobData.id}`,
          requireInteraction: true,
        }
      );

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showBrowserNotification(jobData, language);
      }
    }
  }

  // Stop listening for a specific driver
  stopListening(driverId) {
    const unsubscribe = this.listeners.get(driverId);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(driverId);
    }
  }

  // Stop all listeners
  stopAllListening() {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }
}

export default new NotificationService();