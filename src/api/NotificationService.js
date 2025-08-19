import { db } from './firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

class NotificationService {
  constructor() {
    this.listeners = new Map();
    this.processedJobs = new Set();
    this.lastNotificationTime = 0;
    this.navigateFunction = null;
    this.activeNotifications = new Set(); // Add this to track active notifications
    this.cooldownPeriod = 10000; // 10 second cooldown between same job notifications
  }
  pauseNotifications() {
  this.notificationsPaused = true;
  console.log('Notifications paused');
  
  // Auto-resume after 5 seconds (in case something goes wrong)
  setTimeout(() => {
    this.notificationsPaused = false;
    console.log('Notifications auto-resumed');
  }, 5000);
}

resumeNotifications() {
  this.notificationsPaused = false;
  console.log('Notifications resumed');
}

  playNotificationSound() {
    try {
      const now = Date.now();
      if (now - this.lastNotificationTime < 2000) {
        return;
      }
      this.lastNotificationTime = now;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        return;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  setNavigateFunction(navigateFn) {
    this.navigateFunction = navigateFn;
  }

listenForJobAssignments(driverId, onNewAssignment, language = 'ar') {
  if (this.listeners.has(driverId)) {
    console.log('Already listening for driver:', driverId);
    return this.listeners.get(driverId);
  }

  const reservationsRef = collection(db, 'reservations');
  const q = query(
    reservationsRef, 
    where('assigned_driver_id', '==', driverId)
  );

  console.log('Starting to listen for driver:', driverId);

  // Track when we start listening to avoid showing notifications for existing jobs
  const startListeningTime = new Date();

  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const jobData = { id: change.doc.id, ...change.doc.data() };
      
      const jobId = jobData.id;
      const assignmentKey = `${jobData.id}-${jobData.assigned_driver_id}`;
      
      // IMPORTANT: Skip if we've already processed this job (regardless of time)
      if (this.processedJobs.has(assignmentKey)) {
        console.log('Skipping already processed job:', assignmentKey);
        return;
      }

      // Skip if there's already an active notification for this job
      if (this.activeNotifications.has(jobId)) {
        console.log('Skipping - notification already active for job:', jobId);
        return;
      }

      if ((change.type === 'modified' || change.type === 'added') && jobData.assigned_driver_id === driverId) {
        const assignedTime = new Date(jobData.updated_at);
        
        // NEW LOGIC: Only show notifications for jobs assigned AFTER we started listening
        // This prevents showing notifications for jobs that were already assigned
        if (assignedTime > startListeningTime) {
          console.log('New job assigned after listening started:', jobData);
          
          // Mark as processed PERMANENTLY (don't use time-based key)
          this.processedJobs.add(assignmentKey);
          this.activeNotifications.add(jobId);
          
          // Clean up old processed jobs (keep only last 100)
          if (this.processedJobs.size > 100) {
            const oldestKeys = Array.from(this.processedJobs).slice(0, 20);
            oldestKeys.forEach(key => this.processedJobs.delete(key));
          }
          
          this.showJobAssignmentNotification(jobData, language, jobId);
          onNewAssignment(jobData);
        } else {
          // This is an existing job, mark it as processed but don't show notification
          console.log('Existing job detected, marking as processed:', jobId);
          this.processedJobs.add(assignmentKey);
        }
      }
    });
  }, (error) => {
    console.error('Firestore listener error:', error);
  });

  this.listeners.set(driverId, unsubscribe);
  return unsubscribe;
}

  showJobAssignmentNotification(jobData, language, jobId) {
  // Don't show if notifications are paused
  if (this.notificationsPaused) {
    console.log('Notifications paused, skipping notification');
    return;
  }

  const soundEnabled = localStorage.getItem('notificationSoundEnabled') !== 'false';
  
  if (soundEnabled) {
    this.playNotificationSound();
  }

  this.showProfessionalNotificationPopup(jobData, language, jobId);
}

  showProfessionalNotificationPopup(jobData, language, jobId) {
     const t = (ar, en, he) => {
    if (language === 'ar') return ar;
    if (language === 'he') return he;
    return en;
  };

  // Add these direction and alignment variables
  const isRTL = language === 'ar' || language === 'he';
  const textDirection = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'right' : 'left';
  const marginStart = isRTL ? 'margin-left' : 'margin-right';
  const marginEnd = isRTL ? 'margin-right' : 'margin-left';

    // Remove any existing notification immediately
    const existingNotification = document.getElementById('job-notification-popup');
    const existingOverlay = document.getElementById('notification-overlay');
    if (existingNotification) {
      existingNotification.remove();
    }
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create overlay
    const overlay = document.createElement('div');
overlay.id = 'notification-overlay';
overlay.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
  backdrop-filter: blur(4px);
  direction: ${textDirection};
`;

    // Create notification
    const notification = document.createElement('div');
    notification.id = 'job-notification-popup';
    notification.setAttribute('data-job-id', jobId); // Track which job this is for
    notification.style.cssText = `
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      padding: 0;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 10px 20px rgba(16,185,129,0.2);
      max-width: 400px;
      width: 90%;
      animation: slideInScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      overflow: hidden;
      position: relative;
    `;

    // Add styles if not already added
    if (!document.getElementById('notification-advanced-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-advanced-styles';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInScale {
          from { 
            transform: translate(-50%, -60%) scale(0.8);
            opacity: 0;
          }
          to { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        @keyframes slideOutScale {
          from { 
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          to { 
            transform: translate(-50%, -60%) scale(0.9);
            opacity: 0;
          }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        .notification-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .notification-pulse {
          position: absolute;
          top: 16px;
          left: 16px;
          width: 12px;
          height: 12px;
          background: #34D399;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { 
            transform: scale(1);
            opacity: 1;
          }
          50% { 
            transform: scale(1.2);
            opacity: 0.7;
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Add same content as before...
   notification.innerHTML = `
  <div class="notification-shimmer"></div>
  <div class="notification-pulse"></div>
  
  <!-- Header -->
  <div style="
    padding: 20px 20px 16px 20px; 
    border-bottom: 1px solid rgba(255,255,255,0.15);
    direction: ${textDirection};
    text-align: ${textAlign};
  ">
    <div style="display: flex; align-items: center; margin-bottom: 8px; ${isRTL ? 'flex-direction: row-reverse;' : ''}">
      <div style="
        width: 40px; 
        height: 40px; 
        background: rgba(255,255,255,0.2); 
        border-radius: 12px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        ${marginEnd}: 12px;
        font-size: 20px;
        backdrop-filter: blur(10px);
      ">
        🚛
      </div>
      <div style="flex: 1; text-align: ${textAlign};">
        <div style="
          font-size: 18px; 
          font-weight: 700; 
          margin-bottom: 4px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.1);
          direction: ${textDirection};
        ">
          ${t('مهمة جديدة!', 'New Job Assigned!', 'משימה חדשה!')}
        </div>
        <div style="
          font-size: 12px; 
          opacity: 0.9; 
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          direction: ${textDirection};
        ">
          ${t('تم تعيينك للتو', 'Just assigned to you', 'הוקצתה לך כעת')}
        </div>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div style="padding: 20px; direction: ${textDirection};">
    <div style="margin-bottom: 16px;">
      <!-- Pickup Location -->
      <div style="
        display: flex; 
        align-items: center; 
        margin-bottom: 12px; 
        padding: 12px; 
        background: rgba(255,255,255,0.1); 
        border-radius: 8px;
        backdrop-filter: blur(10px);
        ${isRTL ? 'flex-direction: row-reverse;' : ''}
      ">
        <div style="
          width: 24px; 
          height: 24px; 
          background: #34D399; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          ${marginEnd}: 12px;
          font-size: 12px;
        ">
          📍
        </div>
        <div style="flex: 1; text-align: ${textAlign};">
          <div style="
            font-size: 12px; 
            opacity: 0.8; 
            font-weight: 600; 
            margin-bottom: 2px;
            direction: ${textDirection};
          ">
            ${t('الاستلام من', 'PICKUP FROM', 'איסוף מ')}
          </div>
          <div style="
            font-size: 14px; 
            font-weight: 600; 
            line-height: 1.3;
            direction: ${textDirection};
          ">
            ${(jobData.pickup_location || '').substring(0, 35)}${(jobData.pickup_location || '').length > 35 ? '...' : ''}
          </div>
        </div>
      </div>

      <!-- Delivery Location -->
      <div style="
        display: flex; 
        align-items: center; 
        padding: 12px; 
        background: rgba(255,255,255,0.1); 
        border-radius: 8px;
        backdrop-filter: blur(10px);
        ${isRTL ? 'flex-direction: row-reverse;' : ''}
      ">
        <div style="
          width: 24px; 
          height: 24px; 
          background: #F87171; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          ${marginEnd}: 12px;
          font-size: 12px;
        ">
          🏁
        </div>
        <div style="flex: 1; text-align: ${textAlign};">
          <div style="
            font-size: 12px; 
            opacity: 0.8; 
            font-weight: 600; 
            margin-bottom: 2px;
            direction: ${textDirection};
          ">
            ${t('التسليم إلى', 'DELIVER TO', 'משלוח ל')}
          </div>
          <div style="
            font-size: 14px; 
            font-weight: 600; 
            line-height: 1.3;
            direction: ${textDirection};
          ">
            ${(jobData.delivery_location || '').substring(0, 35)}${(jobData.delivery_location || '').length > 35 ? '...' : ''}
          </div>
        </div>
      </div>
    </div>

    <!-- Call to Action -->
    <div style="
      text-align: center; 
      padding: 16px; 
      background: rgba(255,255,255,0.15); 
      border-radius: 12px;
      margin-top: 20px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      direction: ${textDirection};
    ">
      <div style="
        font-size: 16px; 
        font-weight: 700; 
        margin-bottom: 4px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        direction: ${textDirection};
      ">
        ${t('انقر لعرض التفاصيل', 'Click to View Details', 'לחץ לצפייה בפרטים')}
      </div>
      <div style="
        font-size: 12px; 
        opacity: 0.9;
        font-weight: 500;
        direction: ${textDirection};
      ">
        ${t('سيتم توجيهك لصفحة المهام', 'You will be taken to jobs page', 'תועבר לעמוד המשימות')}
      </div>
    </div>
  </div>
`;

    // Create the dismiss function that cleans up properly
    const dismissNotification = () => {
  console.log('Dismissing notification for job:', jobId);
  
  // Remove from active notifications immediately
  this.activeNotifications.delete(jobId);
  
  // Mark this job as permanently processed to prevent re-showing
  const permanentKey = `${jobData.id}-${jobData.assigned_driver_id}`;
  this.processedJobs.add(permanentKey);
  
  // Clear any timeout
  const timeoutId = overlay.getAttribute('data-timeout');
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  // Remove the notification with animation
  if (overlay.parentNode) {
    overlay.style.animation = 'fadeOut 0.3s ease-in';
    notification.style.animation = 'slideOutScale 0.3s ease-in';
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 300);
  }
  
  // Clean up event listeners
  document.removeEventListener('keydown', handleEscape);
};

    // Click handler with proper cleanup
    const handleClick = () => {
  console.log('Notification clicked, navigating to jobs page');
  
  // Pause notifications to prevent showing during navigation
  this.pauseNotifications();
  
  // Dismiss notification first
  dismissNotification();
  
  // Then navigate
  setTimeout(() => {
    try {
      if (this.navigateFunction) {
        this.navigateFunction('/driverjobs');
      } else {
        window.location.assign('/driverjobs');
      }
      
      // Resume notifications after navigation
      setTimeout(() => {
        this.resumeNotifications();
      }, 1000);
    } catch (error) {
      console.error('Navigation error:', error);
      window.location.href = '/driverjobs';
      
      // Resume notifications even on error
      setTimeout(() => {
        this.resumeNotifications();
      }, 1000);
    }
  }, 100);
};

    // Escape key handler
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        dismissNotification();
      }
    };

    // Add event listeners
    notification.addEventListener('click', handleClick);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        dismissNotification();
      }
    });
    document.addEventListener('keydown', handleEscape);

    // Add to page
    overlay.appendChild(notification);
    document.body.appendChild(overlay);

    // Auto dismiss after 10 seconds
    const autoTimeout = setTimeout(() => {
      dismissNotification();
    }, 10000);

    // Store timeout reference so we can clear it if manually dismissed
    overlay.setAttribute('data-timeout', autoTimeout);
  }

  stopListening(driverId) {
    const unsubscribe = this.listeners.get(driverId);
    if (unsubscribe) {
      console.log('Stopping listener for driver:', driverId);
      unsubscribe();
      this.listeners.delete(driverId);
    }
  }

  stopAllListening() {
    console.log('Stopping all listeners');
    this.listeners.forEach((unsubscribe, driverId) => {
      console.log('Stopping listener for driver:', driverId);
      unsubscribe();
    });
    this.listeners.clear();
    this.processedJobs.clear();
    this.activeNotifications.clear(); // Clear active notifications
    
    // Remove any existing notifications
    const existingNotification = document.getElementById('notification-overlay');
    if (existingNotification) {
      existingNotification.remove();
    }
  }

  clearProcessedJobs() {
    this.processedJobs.clear();
    this.activeNotifications.clear(); // Also clear active notifications
    console.log('Cleared processed jobs and active notifications cache');
  }

  // Add method to manually dismiss notification
  dismissActiveNotification() {
    const overlay = document.getElementById('notification-overlay');
    if (overlay) {
      const jobId = overlay.querySelector('#job-notification-popup')?.getAttribute('data-job-id');
      if (jobId) {
        this.activeNotifications.delete(jobId);
      }
      overlay.remove();
    }
  }

  async requestNotificationPermission() {
    return true;
  }
}

export default new NotificationService();