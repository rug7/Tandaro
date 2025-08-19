import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from '@/components/utils/translations';

const NotificationSettings = ({ language }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotificationsGranted, setBrowserNotificationsGranted] = useState(false);
  const { t } = useTranslation(language);

  useEffect(() => {
    // Check current settings
    const savedSoundSetting = localStorage.getItem('notificationSoundEnabled');
    setSoundEnabled(savedSoundSetting !== 'false');
    
    setBrowserNotificationsGranted(Notification?.permission === 'granted');
  }, []);

  const toggleSound = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    localStorage.setItem('notificationSoundEnabled', newSoundEnabled.toString());
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setBrowserNotificationsGranted(permission === 'granted');
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Bell className="w-4 h-4 mr-2" />
          {t('إعدادات الإشعارات', 'Notification Settings')}
        </h4>
        
        <div className="space-y-3">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-sm">{t('صوت الإشعار', 'Notification Sound')}</span>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={toggleSound}
            />
          </div>

          {/* Browser Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {browserNotificationsGranted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              <span className="text-sm">{t('إشعارات المتصفح', 'Browser Notifications')}</span>
            </div>
            {browserNotificationsGranted ? (
              <span className="text-xs text-green-600">{t('مفعل', 'Enabled')}</span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={requestBrowserPermission}
              >
                {t('تفعيل', 'Enable')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;