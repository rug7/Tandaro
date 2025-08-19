import React, { useEffect, useState } from 'react';
import { User } from '@/api/entities';
import NotificationService from '@/api/NotificationService';


const NotificationProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        const userData = await User.me();
        setUser(userData);

        if (userData && userData.role === 'driver' && !isListening) {
          console.log('Starting global notification listener for driver:', userData.id);
          setIsListening(true);

          // Request permission
          await NotificationService.requestNotificationPermission();

          // Start listening globally
          NotificationService.listenForJobAssignments(
            userData.id,
            (newJob) => {
              console.log('Global notification: New job assigned:', newJob);
            },
            userData.preferred_language || 'ar'
          );
        }
      } catch (error) {
        console.log('User not authenticated or error:', error);
      }
    };

    initializeNotifications();

    // Cleanup on unmount
    return () => {
      if (user && user.role === 'driver') {
        NotificationService.stopAllListening();
        setIsListening(false);
      }
    };
  }, []);

  return <>{children}</>;
};

export default NotificationProvider;