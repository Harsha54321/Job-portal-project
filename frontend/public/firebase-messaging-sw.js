
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

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || '/logo192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});