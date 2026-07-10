// BOMBAY GOLD - Secure Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyABwusy3oZXqh3531oJ1QorBsUMwxQF87M", 
  authDomain: "live-result-b9155.firebaseapp.com",
  projectId: "live-result-b9155",
  storageBucket: "live-result-b9155.appspot.com",
  messagingSenderId: "495121483481",
  appId: "1:495121483481:web:8e8bf65c71ea3d31ec6...",
  measurementId: "G-DFDl4QRF87"
};

// ফায়ারবেস ইনিশিয়ালাইজেশন
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
const auth = firebase.auth();
