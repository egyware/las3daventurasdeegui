 // Your web app's Firebase configuration
 var firebaseConfig = {
    apiKey: "AIzaSyDVFmlC5Yodu_rLXQaodGpEbgZkxkHBagw",
    authDomain: "las3daventurasdeegui.firebaseapp.com",
    databaseURL: "https://las3daventurasdeegui.firebaseio.com",
    projectId: "las3daventurasdeegui",
    storageBucket: "las3daventurasdeegui.appspot.com",
    messagingSenderId: "273469124921",
    appId: "1:273469124921:web:2a655087657acb998b38e8",
    measurementId: "G-0X12QSSR4K"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

const messaging = firebase.messaging();
messaging.usePublicVapidKey("BM3pCRquJ5ofZ8B8ntgXT2rgG8hZEv0upNuxvCw40NvzXqGe8JgjEB-ouvQ9IGWDZDn4jomDCJXjeG-U7Ns3PBw");


Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      // TODO(developer): Retrieve an Instance ID token for use with FCM.
      // [START_EXCLUDE]
      // In many cases once an app has been granted notification permission,
      // it should update its UI reflecting this.
      //resetUI();
      // [END_EXCLUDE]

      messaging.getToken().then((currentToken) => {
    if (currentToken) {
        console.log(currentToken);
      //sendTokenToServer(currentToken);
      //updateUIForPushEnabled(currentToken);
    } else {
      // Show permission request.
      console.log('No Instance ID token available. Request permission to generate one.');
      // Show permission UI.
      //updateUIForPushPermissionRequired();
      //setTokenSentToServer(false);
    }
  }).catch((err) => {
    console.log('An error occurred while retrieving token. ', err);
    //showToken('Error retrieving Instance ID token. ', err);
    //setTokenSentToServer(false);
  });

    } else {
      console.log('Unable to get permission to notify.');
    }
  });

//   messaging.onTokenRefresh(() => {
//     messaging.getToken().then((refreshedToken) => {
//       console.log('Token refreshed.');
//       // Indicate that the new Instance ID token has not yet been sent to the
//       // app server.
//       //setTokenSentToServer(false);
//       // Send Instance ID token to app server.
//       //sendTokenToServer(refreshedToken);
//       // ...
//     }).catch((err) => {
//       console.log('Unable to retrieve refreshed token ', err);
//       //showToken('Unable to retrieve refreshed token ', err);
//     });
//   });