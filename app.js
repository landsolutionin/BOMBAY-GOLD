import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

// আপনার ফায়ারবেস কনফিগারেশন
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
const database = getDatabase(app);

// আপনার প্রথম ইমেজের মূল ৭টি টাইম স্লট
const defaultTimeSlots = ["10:20 AM", "11:50 AM", "01:20 PM", "02:50 PM", "04:20 PM", "05:50 PM", "07:20 PM"];

document.addEventListener("DOMContentLoaded", function () {
    const resultsContainer = document.getElementById("results-container");
    const adminInputsBody = document.getElementById("admin-inputs-body");
    const btnPublish = document.getElementById("btn-publish");

    // --- ১. ইউজার পেজ লজিক (index.html) ---
    if (resultsContainer) {
        onValue(ref(database, "game_results"), (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                resultsContainer.innerHTML = '<div class="loading-text">কোনো লাইভ রেজাল্ট পাওয়া যায়নি।</div>';
                return;
            }

            // সেটিংস টেক্সট ও লিংক আপডেট
            if(data.settings) {
                if(data.settings.subtitle) document.getElementById("site-subtitle").textContent = data.settings.subtitle;
                if(data.settings.marquee) document.getElementById("site-marquee").textContent = data.settings.marquee;
                if(data.settings.tipsUrl) document.getElementById("link-tips").href = data.settings.tipsUrl;
                if(data.settings.pattiUrl) document.getElementById("link-patti").href = data.settings.pattiUrl;
            }

            resultsContainer.innerHTML = "";
            const records = data.records || {};
            
            // সবথেকে নতুন তারিখগুলো উপরে দেখানোর জন্য সর্টিং
            const sortedDates = Object.keys(records).sort((a, b) => new Date(b) - new Date(a));

            if(sortedDates.length === 0) {
                resultsContainer.innerHTML = '<div class="loading-text">কোনো ডাটা রেকর্ড নেই।</div>';
                return;
            }

            sortedDates.forEach(dateKey => {
                const dayData = records[dateKey];
                
                // ডাটাবেসের YYYY-MM-DD ফরম্যাটকে ইমেজের মতো DD/MM/YYYY করা হলো
                const dateParts = dateKey.split("-");
                const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateKey;

                // ডাটাবেসে যদি কাস্টম টাইম স্লট সেভ থাকে তবে সেটা নেবে, নয়তো ডিফল্ট নেবে
                const activeSlots = dayData._slotsOrder ? dayData._slotsOrder : defaultTimeSlots;

                let tableHtml = `
                    <div class="results-table-block">
                        <div class="date-header">${displayDate}</div>
                        <div style="overflow-x: auto;">
                            <table class="results-grid-table">
                                <thead>
                                    <tr>${activeSlots.map(t => `<th>${t}</th>`).join("")}</tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        ${activeSlots.map(t => {
                                            let patti = (dayData[t] && dayData[t].patti) ? dayData[t].patti : "-";
                                            let single = (dayData[t] && dayData[t].single) ? dayData[t].single : "-";
                                            return `<td><span class="patti-row-text">${patti}</span><span class="single-row-text">${single}</span></td>`;
                                        }).join("")}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                resultsContainer.innerHTML += tableHtml;
            });
        });
    }

    // --- ২. অ্যাডমিন প্যানেল লজিক (admin.html) ---
    if (adminInputsBody && btnPublish) {
        
        // ফায়ারবেস থেকে নির্দিষ্ট তারিখের ডাটা লোড করার ফাংশন
        const loadExistingData = () => {
            const selectedDate = dateInput.value;
            if(!selectedDate) return;

            get(ref(database, `game_results/records/${selectedDate}`)).then((snapshot) => {
                const dayData = snapshot.val() || {};
                adminInputsBody.innerHTML = ""; // আগের রো ক্লিয়ার করুন

                // ডাটাবেসে কাস্টম টাইম থাকলে সেটা লোড হবে, না থাকলে ডিফল্ট ৭টি স্লট তৈরি হবে
                const activeSlots = dayData._slotsOrder ? dayData._slotsOrder : defaultTimeSlots;

                activeSlots.forEach(time => {
                    const pattiVal = (dayData[time] && dayData[time].patti && dayData[time].patti !== "-") ? dayData[time].patti : "";
                    const singleVal = (dayData[time] && dayData[time].single && dayData[time].single !== "-") ? dayData[time].single : "";
                    
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><input type="text" class="input-time" value="${time}" placeholder="যেমন: 10:20 AM"></td>
                        <td><input type="text" class="input-patti" value="${pattiVal}" placeholder="পাত্তি"></td>
                        <td><input type="text" class="input-single" value="${singleVal}" placeholder="সিঙ্গেল"></td>
                    `;
                    adminInputsBody.appendChild(tr);
                });
            });
        };

        const dateInput = document.getElementById("result-date");
        
        // রাত ১২টার ফিক্স: পেজ খুললে স্বয়ংক্রিয়ভাবে গতকালকের তারিখ সেট হবে যাতে আগের রেজাল্ট এডিট করা যায় সহজে
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dateInput.value = yesterday.toISOString().split('T')[0];

        // তারিখ পরিবর্তন করলে ডাটা অটো লোড হবে
        dateInput.addEventListener("change", loadExistingData);
        loadExistingData();

        // পাবলিশ বাটন ক্লিক লজিক
        btnPublish.addEventListener("click", () => {
            const selectedDate = dateInput.value;
            if(!selectedDate) return alert("দয়া করে তারিখ সিলেক্ট করুন!");

            let recordsUpdate = {};
            let slotsOrder = [];

            document.querySelectorAll("#admin-inputs-body tr").forEach(row => {
                const time = row.querySelector(".input-time").value.trim();
                const patti = row.querySelector(".input-patti").value.trim() || "-";
                const single = row.querySelector(".input-single").value.trim() || "-";
                
                if (time) {
                    slotsOrder.push(time);
                    recordsUpdate[time] = { patti, single };
                }
            });

            // টাইম স্লটের সিরিয়াল মনে রাখার জন্য বিশেষ ট্র্যাক
            recordsUpdate["_slotsOrder"] = slotsOrder;

            const settings = {
                subtitle: document.getElementById("input-subtitle").value.trim(),
                marquee: document.getElementById("input-marquee").value.trim(),
                tipsUrl: document.getElementById("input-tips-url").value.trim() || "#",
                pattiUrl: document.getElementById("input-patti-url").value.trim() || "#"
            };

            set(ref(database, `game_results/records/${selectedDate}`), recordsUpdate);
            set(ref(database, `game_results/settings`), settings).then(() => {
                const statusMsg = document.getElementById("status-message");
                statusMsg.textContent = "সফলভাবে ফায়ারবেসে রেজাল্ট ও টাইম লাইভ করা হয়েছে!";
                statusMsg.className = "status-msg status-success";
                setTimeout(() => statusMsg.style.display = "none", 4000);
            }).catch(err => alert("Error: " + err.message));
        });
    }
});
