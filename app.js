import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, doc, onSnapshot, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ফায়ারবেস কনফিগারেশন (এখানে আপনার ডেটা বসাবেন)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// সিস্টেম ইনিশিয়ালাইজেশন
export const initSystem = () => {
    // পাবলিক নোটিশ এবং লাইভ স্ট্যাটাস আপডেট লিসেনার
    onSnapshot(doc(db, "settings", "config"), (doc) => {
        const config = doc.data();
        
        // মেইন পেজের লাইভ স্ট্যাটাস ও রেজাল্ট হাইড লজিক
        const liveBtn = document.getElementById('liveButton');
        const resultSec = document.getElementById('resultSection');
        if (liveBtn && resultSec) {
            if (config.isLive) {
                liveBtn.className = "live-status live-on";
                resultSec.classList.remove('hidden');
            } else {
                liveBtn.className = "live-status live-off";
                resultSec.classList.add('hidden');
            }
        }

        // পাবলিক নোটিশ আপডেট
        const noticeBar = document.getElementById('publicNoticeBar');
        if (noticeBar) noticeBar.innerText = config.publicNotice;

        // প্লেয়ার নোটিশ আপডেট
        const playerMsg = document.getElementById('playerMessageBar');
        if (playerMsg) playerMsg.innerText = config.playerMessage;
    });
};

// অ্যাডমিন ফাংশন: রেজাল্ট সেভ ও মাস্টার কন্ট্রোল
export const adminFunctions = {
    toggleLive: async (status) => {
        await updateDoc(doc(db, "settings", "config"), { isLive: !status });
    },
    updateNotices: async (pub, ply) => {
        await updateDoc(doc(db, "settings", "config"), { 
            publicNotice: pub, 
            playerMessage: ply 
        });
    },
    saveResults: async (data) => {
        await updateDoc(doc(db, "results", "data"), { rows: data });
    }
};

// প্লেয়ার লজিক: সাবমিট বেট
export const placeBet = async (betData) => {
    // এখানে আপনার বেট লজিক এবং ওটিপি/ক্যালকুলেশন বসবে
    console.log("Bet Placed:", betData);
};

initSystem();
