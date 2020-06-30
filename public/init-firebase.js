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