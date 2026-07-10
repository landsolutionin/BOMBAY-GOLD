// নোটিফিকেশন বার, বাটন লিঙ্ক এবং ব্যাকগ্রাউন্ড ইমেজ লাইভ আপডেট করা
db.collection("SystemSettings").doc("General").onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        
        // ১. নোটিশ কন্ট্রোল
        if(data.notice && data.notice_status === "on") {
            document.getElementById("notification-bar").innerText = data.notice;
            document.getElementById("notification-bar").style.display = "block";
        } else {
            document.getElementById("notification-bar").style.display = "none";
        }

        // ২. বাটন লিঙ্ক কন্ট্রোল
        document.getElementById("tips-link").href = data.tips_url || "#";
        document.getElementById("patti-link").href = data.patti_url || "#";

        // ৩. ডাইনামিক ব্যাকগ্রাউন্ড ইমেজ কন্ট্রোল (নতুন ফিচার)
        if(data.bg_url) {
            document.body.style.backgroundImage = `url('${data.bg_url}')`;
        } else {
            document.body.style.backgroundImage = "none";
            document.body.style.backgroundColor = "#0f172a"; // ইমেজ না থাকলে ডিফল্ট ডার্ক কালার
        }
    }
});

// ডাইনামিক টেবিল ও রেজাল্ট লাইভ লোড করা
db.collection("SystemSettings").doc("Slots").onSnapshot((slotDoc) => {
    if (slotDoc.exists) {
        const timeSlots = slotDoc.data().active_slots || [];

        // আজকের তারিখ বের করা
        const today = new Date();
        const dateString = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

        // ডাটাবেস থেকে রিয়েল-টাইম রেজাল্ট আনা
        db.collection("GameResults").onSnapshot((querySnapshot) => {
            let htmlContent = "";
            let resultsData = {};

            querySnapshot.forEach((doc) => {
                resultsData[doc.id] = doc.data();
            });

            // আজকের টেবিল সবার ওপরে যোগ হবে
            htmlContent += createTableHTML(dateString, timeSlots, resultsData[dateString] || {});

            // পুরোনো রেজাল্ট হিস্ট্রি নিজে থেকেই নিচে একটার পর একটা সাজানো থাকবে
            Object.keys(resultsData).sort().reverse().forEach(dateKey => {
                if(dateKey !== dateString) {
                    htmlContent += createTableHTML(dateKey, timeSlots, resultsData[dateKey]);
                }
            });

            document.getElementById("tables-holder").innerHTML = htmlContent;
        });
    }
});

// টেবিল তৈরি করার কমন ফাংশন
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
