// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC5KcHX0-wPlrE1CXAAElVpPbpgJ1cln2U",
  authDomain: "jobportal-8bbc1.firebaseapp.com",
  projectId: "jobportal-8bbc1",
  storageBucket: "jobportal-8bbc1.firebasestorage.app",
  messagingSenderId: "910796700822",
  appId: "1:910796700822:web:24f745d5e6ad51f35716b7"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  // Customize notification
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: payload.notification?.icon || '/logo192.png',
    badge: '/logo192.png',
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open'
      }
    ]
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);

  event.notification.close();

  // This looks to see if the current window is already open and focuses it
  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    })
      .then((clientList) => {
        // If a window client exists, focus it
        for (const client of clientList) {
          if (client.url && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Handle service worker installation
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  event.waitUntil(self.skipWaiting());
});

// Handle service worker activation
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Handle messages from the page
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});