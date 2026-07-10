// আপনার Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "live-result-b9155.firebaseapp.com",
    projectId: "live-result-b9155",
    storageBucket: "live-result-b9155.firebasestorage.app",
    messagingSenderId: "495121483481",
    appId: "YOUR_APP_ID_HERE"
};
// Firebase চালু করা
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
// নোটিফিকেশন বার এবং বাটন লিঙ্ক লাইভ আপডেট করা
db.collection("SystemSettings").doc("General").onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        
        // নোটিশ কন্ট্রোল
        if(data.notice && data.notice_status === "on") {
            document.getElementById("notification-bar").innerText = data.notice;
            document.getElementById("notification-bar").style.display = "block";
        } else {
            document.getElementById("notification-bar").style.display = "none";
        }

        // বাটন লিঙ্ক কন্ট্রোল
        document.getElementById("tips-link").href = data.tips_url || "#";
        document.getElementById("patti-link").href = data.patti_url || "#";
    }
});

// ডাইনামিক টেবিল ও রেজাল্ট লাইভ লোড করা
db.collection("SystemSettings").doc("Slots").onSnapshot((slotDoc) => {
    if (slotDoc.exists) {
        const timeSlots = slotDoc.data().active_slots || [];

        // আজকের তারিখ বের করা (যেমন: 10-07-2026)
        const today = new Date();
        const dateString = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

        // আজ এবং গতকালের রেজাল্ট একসাথে শোনা (Real-time tracking)
        db.collection("GameResults").onSnapshot((querySnapshot) => {
            let htmlContent = "";
            let resultsData = {};

            querySnapshot.forEach((doc) => {
                resultsData[doc.id] = doc.data();
            });

            // আমরা আজকের এবং গত কয়েকদিনের টেবিল দেখাবো (ডাইনামিকালি)
            // আপাতত আজকের টেবিলটি তৈরি করছি
            htmlContent += createTableHTML(dateString, timeSlots, resultsData[dateString] || {});

            // যদি গতকালের ডেটা থাকে তাও নিচে যোগ হবে
            // (পুরোনো রেজাল্ট হিস্ট্রি স্বয়ংক্রিয়ভাবে নিচে জমা হবে)
            Object.keys(resultsData).sort().reverse().forEach(dateKey => {
                if(dateKey !== dateString) {
                    htmlContent += createTableHTML(dateKey, timeSlots, resultsData[dateKey]);
                }
            });

            document.getElementById("tables-holder").innerHTML = htmlContent;
        });
    }
});

// টেবিল তৈরি করার একটি কমন ফাংশন
function createTableHTML(date, slots, dayResults) {
    let tableHtml = `
        <div class="table-container">
            <div class="table-title">তারিখ: ${date}</div>
            <table class="result-table">
                <tr>
                    <th>বাজি / টাইম</th>
                    <th>পাত্তি</th>
                    <th>সিঙ্গেল</th>
                </tr>
    `;

    slots.forEach(slot => {
        const patti = (dayResults[slot] && dayResults[slot].patti) ? dayResults[slot].patti : "-";
        const single = (dayResults[slot] && dayResults[slot].single) ? dayResults[slot].single : "-";
        
        tableHtml += `
            <tr>
                <td>${slot}</td>
                <td class="patti-txt">${patti}</td>
                <td class="single-txt">${single}</td>
            </tr>
        `;
    });

    tableHtml += `</table></div>`;
    return tableHtml;
}
