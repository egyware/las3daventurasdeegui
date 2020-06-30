// Give the service worker access to Firebase Messaging.
 // Note that you can only use Firebase Messaging here, other Firebase libraries
 // are not available in the service worker.
 importScripts('https://www.gstatic.com/firebasejs/7.14.4/firebase-app.js');
 importScripts('https://www.gstatic.com/firebasejs/7.14.4/firebase-messaging.js');
 // Initialize the Firebase app in the service worker by passing in
 // your app's Firebase config object.
 // https://firebase.google.com/docs/web/setup#config-object
 firebase.initializeApp({
    apiKey: "AIzaSyDVFmlC5Yodu_rLXQaodGpEbgZkxkHBagw",
    authDomain: "las3daventurasdeegui.firebaseapp.com",
    databaseURL: "https://las3daventurasdeegui.firebaseio.com",
    projectId: "las3daventurasdeegui",
    storageBucket: "las3daventurasdeegui.appspot.com",
    messagingSenderId: "273469124921",
    appId: "1:273469124921:web:2a655087657acb998b38e8",
    measurementId: "G-0X12QSSR4K"
});
 // Retrieve an instance of Firebase Messaging so that it can handle background
 // messages.
 const messaging = firebase.messaging();

 messaging.setBackgroundMessageHandler(function(payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // Customize notification here
    const notificationTitle = 'Background Message Title';
    const notificationOptions = {
      body: 'Background Message body.',
      icon: '/firebase-logo.png'
    };
  
    return self.registration.showNotification(notificationTitle,
      notificationOptions);
  });