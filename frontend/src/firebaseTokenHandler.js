// src/firebaseTokenHandler.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import api from "./api/axios";

// Replace these values with your actual Firebase Web App configuration credentials
const firebaseConfig = {
  apiKey: "AIzaSyC5KcHX0-wPlrE1CXAAElVpPbpgJ1cln2U",
  authDomain: "jobportal-8bbc1.firebaseapp.com",
  projectId: "jobportal-8bbc1",
  storageBucket: "jobportal-8bbc1.firebasestorage.app",
  messagingSenderId: "910796700822",
  appId: "1:910796700822:web:24f745d5e6ad51f35716b7",
};

// Initialize Firebase App instance
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

/**
 * Requests device authorization permission and synchronizes registration token with DB storage
 */
export const requestAndRegisterNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      // Fetch FCM client registration token
      // VAPID Key: Generate this in your Firebase Console -> Project Settings -> Cloud Messaging -> Web Configuration
      const currentToken = await getToken(messaging, {
        vapidKey: "BEDIc1q-hu8INIG9jmK3_YINX9CMiPIq4A7idO_Gfs6FqwFP2sXdhKT9iV4qIK91ACDX3JwYg_e-dVhiYt0EkvI"
      });

      if (currentToken) {
        console.log("FCM Token Generated successfully:", currentToken);

        // Dispatch payload structure updating your backend's UserDevice instances
        await api.post("devices/register/", {
          fcm_token: currentToken,
          platform: "web"
        });

        console.log("FCM registration token synchronized successfully with backend.");
      } else {
        console.warn("No registration token available. Verify console setup permissions.");
      }
    } else {
      console.warn("User explicitly declined push notifications permission request.");
    }
  } catch (error) {
    console.error("An error occurred during FCM token tracking workflow:", error);
  }
};

/**
 * Sets up listening context hooks for foreground message event captures
 */
export const listenForForegroundMessages = () => {
  // onMessage(messaging, (payload) => {
  //   console.log("Foreground Message Captured live:", payload);
  onMessage(messaging, (payload) => {
    console.log("NEW PUSH RECEIVED", payload);

    // Display a custom browser alert fallback or use a toast UI framework package integration here
    alert(`${payload.notification.title}\n\n${payload.notification.body}`);
  });
};
