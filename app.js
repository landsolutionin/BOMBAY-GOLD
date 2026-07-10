// App.js - সেন্ট্রাল কন্ট্রোলার
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, remove, transaction } from 'firebase/database';

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// সিস্টেম অটো-রিসেট লজিক (রাত ১২টা)
function scheduleDailyReset() {
  const now = new Date();
  const resetTime = new Date();
  resetTime.setHours(24, 0, 0, 0); 
  const delay = resetTime - now;

  setTimeout(() => {
    remove(ref(db, 'Live_Session'));
    remove(ref(db, 'bets'));
    scheduleDailyReset();
  }, delay);
}
scheduleDailyReset();

// উইনিং ক্যালকুলেটর (x9 ও x11.5 লজিক)
export const calculateWinnings = (publishedResult) => {
  onValue(ref(db, 'bets'), (snapshot) => {
    const allBets = snapshot.val();
    if (!allBets) return;
    
    Object.entries(allBets).forEach(([userId, userBets]) => {
      Object.values(userBets).forEach(bet => {
        let winAmount = 0;
        if (bet.patti === publishedResult.patti) winAmount = bet.amount * 11.5;
        else if (bet.single === publishedResult.result) winAmount = bet.amount * 9;
        
        if (winAmount > 0) {
          transaction(ref(db, `wallets/${userId}/winningBalance`), (cur) => (cur || 0) + winAmount);
        }
      });
    });
  }, { onlyOnce: true });
};
