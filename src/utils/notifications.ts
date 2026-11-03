// Push & Smart In-App Engagement Notification Utility for ChekaApp

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

const NOTIFICATION_PERMISSION_KEY = 'cheka_push_notifications_enabled';
const LAST_ENGAGEMENT_KEY = 'cheka_last_engagement_timestamp';

export const isPushSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isPushSupported()) return 'denied';
  return Notification.permission;
};

export const isNotificationsEnabled = (): boolean => {
  if (!isPushSupported()) return false;
  return Notification.permission === 'granted' && localStorage.getItem(NOTIFICATION_PERMISSION_KEY) === 'true';
};

// Request system notification permission with Swahili context
export const requestPushPermission = async (): Promise<boolean> => {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported in this browser/device.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
      localStorage.setItem(LAST_ENGAGEMENT_KEY, Date.now().toString());

      // Attempt to register subscription with server
      await registerSubscriptionWithServer();

      // Show immediate welcome notification
      showLocalNotification('ChekaApp 🔔 Karibu kwenye Vicheko!', {
        body: 'Arifa zimewashwa kikamilifu! Utakuwa wa kwanza kupokea memes na vicheko vinavyovunja mbavu.',
        icon: '/pwa-192x192.png',
        tag: 'welcome_notification',
      });

      return true;
    } else {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'false');
      return false;
    }
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
};

export const disableNotifications = (): void => {
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'false');
};

// Register Service Worker Push Subscription with server
export const registerSubscriptionWithServer = async (): Promise<void> => {
  try {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;

    // Retrieve or create push subscription
    let subscription = await registration.pushManager.getSubscription();

    // Send to backend
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription ? subscription.toJSON() : { simulated: true, timestamp: Date.now() },
        userAgent: navigator.userAgent,
      }),
    }).catch(() => {});
  } catch (err) {
    console.warn('Subscription registration notice:', err);
  }
};

// Fire a real device notification via Service Worker or Web Notification API
export const showLocalNotification = async (title: string, options?: any): Promise<void> => {
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  const defaultOptions: any = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    ...options,
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions);
        return;
      }
    }
    // Fallback to Window Notification constructor
    new Notification(title, defaultOptions);
  } catch (err) {
    console.error('Failed to trigger notification:', err);
  }
};

// Test notification for user verification
export const sendTestPushNotification = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;
  if (Notification.permission !== 'granted') {
    const granted = await requestPushPermission();
    if (!granted) return false;
  }

  const testMemes = [
    {
      title: '😂😂 Mwalimu Comedy Ameweka Video Mpya!',
      body: 'Ukiwa umefanya kazi wiki mbili halafu ghafla Windows inaji-restart! Cheki sasa kabla hujaaga dunia kwa kicheko 💀',
    },
    {
      title: '🔥 Usipoteze Mwendelezo wako (Daily Streak)!',
      body: 'Bado masaa machache kabla siku haijaisha! Ingia sasa uchukue Sarafu 50 za bure 🪙',
    },
    {
      title: '😹 Paka Kashangaa Bei ya Kilo ya Samaki!',
      body: 'Atakula ugali bila mchuzi! Gonga hapa kuona maajabu kwenye ChekaApp.',
    },
  ];

  const picked = testMemes[Math.floor(Math.random() * testMemes.length)];

  await showLocalNotification(picked.title, {
    body: picked.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'test_notification_' + Date.now(),
  });

  return true;
};

// Schedule background re-engagement timer when user leaves tab
export const setupBackgroundReengagement = (): void => {
  if (typeof window === 'undefined') return;

  let idleTimeout: NodeJS.Timeout | null = null;

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // User left the tab - schedule a 45-second engagement notification if enabled
      if (isNotificationsEnabled()) {
        idleTimeout = setTimeout(() => {
          showLocalNotification('😂 Mambo ni Moto Kwenye ChekaApp!', {
            body: 'Marafiki wako wametoa maoni yenye sauti za vichekesho! Rudi uendelee kufurahi.',
            icon: '/pwa-192x192.png',
            tag: 'reengagement_prompt',
          });
        }, 45000); // 45 seconds after leaving tab
      }
    } else {
      // User came back
      if (idleTimeout) {
        clearTimeout(idleTimeout);
        idleTimeout = null;
      }
      localStorage.setItem(LAST_ENGAGEMENT_KEY, Date.now().toString());
    }
  });
};
