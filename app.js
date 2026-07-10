import React, { useEffect, useState } from class="str">'react';
import firebase from class="str">'firebase/app';
import class="str">'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyABwusy3oZXqh3531oJlQorBsUMWxQF08I",
    authDomain: "live-result-b9155.firebaseapp.com",
    databaseURL: "https://live-result-b9155-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "live-result-b9155",
    storageBucket: "live-result-b9155.firebasestorage.app",
    messagingSenderId: "495121483481",
    appId: "1:495121483481:web:8e8bf65c71ea3d31ec60c8",
    measurementId: "G-DFDW40QF87"

};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();

function App() {
  const [panel, setPanel] = useState(class="str">'player');
  const [backgroundImage, setBackgroundImage] = useState(class="str">'');

  useEffect(() => {
    class=class="str">"cmt">// Module class="num">1: Firebase Initialization
    const settingsRef = db.ref(class="str">'Global_Settings');

    class=class="str">"cmt">// Module class="num">2: Global State Manager
    const userRef = db.ref(class="str">'CurrentUser');
    const themeRef = db.ref(class="str">'Theme');

    userRef.on(class="str">'value', (snapshot) => {
      const currentUser = snapshot.val();
      if (currentUser === class="str">'admin') {
        setPanel(class="str">'admin');
      } else if (currentUser === class="str">'player') {
        setPanel(class="str">'player');
      }
    });

    themeRef.on(class="str">'value', (snapshot) => {
      const theme = snapshot.val();
      setBackgroundImage(theme.backgroundImage);
      document.documentElement.style.setProperty(class="str">'--bg-image', backgroundImage);
    });

    class=class="str">"cmt">// Module class="num">3: Dynamic Rendering Logic
    return () => {
      userRef.off();
      themeRef.off();
    };
  }, []);

  class=class="str">"cmt">// Module class="num">4: Event Listener and Calculation
  useEffect(() => {
    const liveSessionRef = db.ref(class="str">'Live_Session');

    const handleNewBet = (betData) => {
      liveSessionRef.push(betData).then(() => {
        class=class="str">"cmt">// Notify admin panel about the new bet
        db.ref(class="str">'Admin_Notification').push({ message: `New bet placed: ${JSON.stringify(betData)}` });
      });
    };

    return () => {
      liveSessionRef.off(class="str">'child_added', handleNewBet);
    };
  }, []);

  return (
    <div id=class="str">"container">
      {panel === class="str">'admin' && <iframe src=class="str">"/admin.html" />}
      {panel === class="str">'player' && <iframe src=class="str">"/player.html" />}
    </div>
  );
}

export default App;
