import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

// আপনার পাঠানো আসল ফায়ারবেস কনফিগারেশন
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

// আপনার প্রথম ইমেজের টাইম স্লটগুলো হুবহু
const timeSlots = ["10:20 AM", "11:50 AM", "01:20 PM", "02:50 PM", "04:20 PM", "05:50 PM", "07:20 PM"];

document.addEventListener("DOMContentLoaded", function () {
    const resultsContainer = document.getElementById("results-container");
    const adminInputsBody = document.getElementById("admin-inputs-body");
    const btnPublish = document.getElementById("btn-publish");

    // --- ভিজিটর সাইট ভিউ (index.html) ---
    if (resultsContainer) {
        onValue(ref(database, "game_results"), (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                resultsContainer.innerHTML = '<div class="loading-text">কোনো লাইভ রেজাল্ট পাওয়া যায়নি।</div>';
                return;
            }

            if(data.settings) {
                if(data.settings.subtitle) document.getElementById("site-subtitle").textContent = data.settings.subtitle;
                if(data.settings.marquee) document.getElementById("site-marquee").textContent = data.settings.marquee;
                if(data.settings.tipsUrl) document.getElementById("link-tips").href = data.settings.tipsUrl;
                if(data.settings.pattiUrl) document.getElementById("link-patti").href = data.settings.pattiUrl;
            }

            resultsContainer.innerHTML = "";
            const records = data.records || {};
            const sortedDates = Object.keys(records).sort((a, b) => new Date(b) - new Date(a));

            sortedDates.forEach(dateKey => {
                const dayData = records[dateKey];
                const dateParts = dateKey.split("-");
                const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateKey;

                let tableHtml = `
                    <div class="results-table-block">
                        <div class="date-header">${displayDate}</div>
                        <div style="overflow-x: auto;">
                            <table class="results-grid-table">
                                <thead>
                                    <tr>${timeSlots.map(t => `<th>${t}</th>`).join("")}</tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        ${timeSlots.map(t => {
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

    // --- অ্যাডমিন প্যানেল লজিক (admin.html) ---
    if (adminInputsBody && btnPublish) {
        timeSlots.forEach(time => {
            const tr = document.createElement("tr");
            tr.setAttribute("data-time", time);
            tr.innerHTML = `
                <td><strong>${time}</strong></td>
                <td><input type="text" maxlength="3" class="input-patti" placeholder="-"></td>
                <td><input type="text" maxlength="1" class="input-single" placeholder="-"></td>
            `;
            adminInputsBody.appendChild(tr);
        });

        const dateInput = document.getElementById("result-date");
        dateInput.value = new Date().toISOString().split('T')[0];

        const loadExistingData = () => {
            const selectedDate = dateInput.value;
            if(!selectedDate) return;
            get(ref(database, `game_results/records/${selectedDate}`)).then((snapshot) => {
                const dayData = snapshot.val() || {};
                document.querySelectorAll("#admin-inputs-body tr").forEach(row => {
                    const time = row.getAttribute("data-time");
                    row.querySelector(".input-patti").value = (dayData[time] && dayData[time].patti && dayData[time].patti !== "-") ? dayData[time].patti : "";
                    row.querySelector(".input-single").value = (dayData[time] && dayData[time].single && dayData[time].single !== "-") ? dayData[time].single : "";
                });
            });
        };

        dateInput.addEventListener("change", loadExistingData);
        loadExistingData();

        btnPublish.addEventListener("click", () => {
            const selectedDate = dateInput.value;
            if(!selectedDate) return alert("তারিখ সিলেক্ট করুন!");

            let recordsUpdate = {};
            document.querySelectorAll("#admin-inputs-body tr").forEach(row => {
                const time = row.getAttribute("data-time");
                const patti = row.querySelector(".input-patti").value.trim() || "-";
                const single = row.querySelector(".input-single").value.trim() || "-";
                recordsUpdate[time] = { patti, single };
            });

            const settings = {
                subtitle: document.getElementById("input-subtitle").value.trim(),
                marquee: document.getElementById("input-marquee").value.trim(),
                tipsUrl: document.getElementById("input-tips-url").value.trim() || "#",
                pattiUrl: document.getElementById("input-patti-url").value.trim() || "#"
            };

            set(ref(database, `game_results/records/${selectedDate}`), recordsUpdate);
            set(ref(database, `game_results/settings`), settings).then(() => {
                const statusMsg = document.getElementById("status-message");
                statusMsg.textContent = "সফলভাবে লাইভ করা হয়েছে!";
                statusMsg.className = "status-msg status-success";
                setTimeout(() => statusMsg.style.display = "none", 3000);
            }).catch(err => alert("Error: " + err.message));
        });
    }
});
