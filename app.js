// ফায়ারবেস কনফিগারেশন (আপনার প্রজেক্টের ডাটা এখানে বসাবেন)
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

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ইন্টারফেস চেঞ্জ ফাংশন - হেডার বা লোগো পরিবর্তনের জন্য
function updateInterface(elementId, value) {
  db.ref('interfaceSettings/' + elementId).set(value);
}

// সাব-অ্যাডমিন এবং মাস্টার অ্যাডমিন সিকিউরিটি চেক
function checkAuth(role) {
  // এখানে লগইন স্ট্যাটাস চেক করা হবে
}
// রেজাল্ট পাবলিশিং ফাংশন - যা গ্রিন সিগন্যাল ও ডবল চেক সাপোর্ট করবে
function publishResult(time, patti, result) {
    const data = {
        time: time,
        patti: patti,
        result: result,
        status: 'green', // সাবমিট করলে গ্রিন হবে
        check: 'double-check' // ডবল চেক ভেরিফিকেশন
    };
    db.ref('dailyResults/' + time.replace(':', '_')).set(data);
}

// অটোমেটিক ডাটা রিড ফাংশন (যা আপনার মেইন ওয়েবসাইটে রেজাল্ট দেখাবে)
db.ref('dailyResults').on('value', (snapshot) => {
    const results = snapshot.val();
    console.log("ডাটা আপডেট হয়েছে:", results);
    // এখানে টেবিল আপডেট করার কোড বসবে
});
