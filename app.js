// BOMBAY GOLD - Main App Script

// ১. তারিখ ফরম্যাট করার ফাংশন (DD-MM-YYYY)
function formatDateString(date) {
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}

// সাইটে সুন্দর করে দেখানোর জন্য তারিখ ফরম্যাট (DD/MM/YYYY)
function formatDisplayDate(dateStr) {
    return dateStr.replace(/-/g, '/');
}

// স্ক্রিনে আজকের দিনসহ গত ৪ দিনের রেজাল্ট হিস্ট্রি দেখানোর জন্য তারিখের লিস্ট
const datesToFetch = [];
for (let i = 0; i < 4; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    datesToFetch.push(formatDateString(d));
}

// ২. জেনারেল সেটিংস লাইভ আপডেট (নোটিশ, বাটন লিঙ্ক ও ব্যাকগ্রাউন্ড ইমেজ)
db.collection("SystemSettings").doc("General").onSnapshot((doc) => {
    if (doc.exists) {
        const data = doc.data();
        
        // লাল নোটিশ বার কন্ট্রোল
        const noticeBar = document.getElementById("notification-bar");
        if (noticeBar) {
            if (data.notice_status === "on" && data.notice) {
                noticeBar.innerText = data.notice;
                noticeBar.style.display = "block";
            } else {
                noticeBar.style.display = "none";
            }
        }

        // টিপস এবং পাত্তি চার্ট বাটন লিঙ্ক আপডেট
        const tipsLink = document.getElementById("tips-link");
        const pattiLink = document.getElementById("patti-link");
        if (tipsLink && data.tips_url) tipsLink.href = data.tips_url;
        if (pattiLink && data.patti_url) pattiLink.href = data.patti_url;

        // এডমিন প্যানেল থেকে দেওয়া ব্যাকগ্রাউন্ড ইমেজ লাইভ সেট করা
        if (data.bg_url) {
            document.body.style.backgroundImage = `url('${data.bg_url}')`;
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundPosition = "center";
            document.body.style.backgroundAttachment = "fixed";
        }
    }
});

// ৩. রিয়েল-টাইম রেজাল্ট টেবিল তৈরি করার লজিক
let allResultsData = {};

function renderAllTables(slots) {
    const holder = document.getElementById("tables-holder");
    if (!holder) return;

    let finalHtml = "";

    // ৪ দিনের আলাদা আলাদা টেবিল তৈরি হবে
    datesToFetch.forEach((dateStr) => {
        const dayData = allResultsData[dateStr] || {};
        
        finalHtml += `
            <div class="results-card">
                <div class="date-header">${formatDisplayDate(dateStr)}</div>
                <div class="table-responsive">
                    <table class="result-table">
                        <thead>
                            <tr>
                                ${slots.map(slot => `<th>${slot}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="patti-row">
                                ${slots.map(slot => {
                                    const val = dayData[slot] ? dayData[slot].patti : "-";
                                    return `<td>${val}</td>`;
                                }).join('')}
                            </tr>
                            <tr class="single-row">
                                ${slots.map(slot => {
                                    const val = dayData[slot] ? dayData[slot].single : "-";
                                    return `<td>${val}</td>`;
                                }).join('')}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    });

    holder.innerHTML = finalHtml;
}

// ফায়ারবেস থেকে লাইভ টাইম স্লট ও রেজাল্ট ট্র্যাক করা
db.collection("SystemSettings").doc("Slots").onSnapshot((slotDoc) => {
    if (slotDoc.exists) {
        const slots = slotDoc.data().active_slots || [];

        // প্রতিটা নির্দিষ্ট দিনের ডেটার ওপর নজর রাখা (Real-time Listening)
        datesToFetch.forEach((dateStr) => {
            db.collection("GameResults").doc(dateStr).onSnapshot((resDoc) => {
                if (resDoc.exists) {
                    allResultsData[dateStr] = resDoc.data();
                } else {
                    allResultsData[dateStr] = {};
                }
                // ডেটাবেসে যেকোনো পরিবর্তন হলেই স্ক্রিনের টেবিল নিজে থেকে আপডেট হবে
                renderAllTables(slots);
            });
        });
    }
});
