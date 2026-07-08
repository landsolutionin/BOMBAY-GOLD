import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getDatabase, ref, set, onValue, get, update } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";

// ফায়ারবেস কনফিগারেশন
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

const coreAppConfig = {
    dbRootNode: "game_results",
    defaultSlots: ["10:20 AM", "11:50 AM", "01:20 PM", "02:50 PM", "04:20 PM", "05:50 PM", "07:20 PM", "08:50 PM"]
};

const getLocalDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

document.addEventListener("DOMContentLoaded", function () {
    const resultsContainer = document.getElementById("results-container");
    const adminInputsBody = document.getElementById("admin-inputs-body");
    const btnSaveSettings = document.getElementById("btn-save-settings");

    let currentUserRole = "guest"; 

    // --- ১. ভিজিটর মেইন পেজ কোড (index.html) ---
    if (resultsContainer) {
        onValue(ref(database, coreAppConfig.dbRootNode), (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            // ডাটাবেস থেকে ডাইনামিক সেটিংস রিড ও অন/অফ লজিক কন্ট্রোল
            if (data.settings) {
                if (data.settings.subtitle) document.getElementById("site-subtitle").textContent = data.settings.subtitle;
                if (data.settings.marquee) document.getElementById("site-marquee").textContent = data.settings.marquee;
                if (data.settings.tipsUrl) document.getElementById("link-tips").href = data.settings.tipsUrl;
                if (data.settings.pattiUrl) document.getElementById("link-patti").href = data.settings.pattiUrl;
                
                // জরুরি লাল নোটিফিকেশন অ্যালার্ট বার কন্ট্রোল
                const alertBar = document.getElementById("custom-alert-bar");
                if (data.settings.customAlert && data.settings.customAlert.trim() !== "") {
                    alertBar.textContent = data.settings.customAlert;
                    alertBar.style.display = "block";
                } else {
                    alertBar.style.display = "none";
                }

                // ফুল এইচডি ব্রাইট ব্যাকগ্রাউন্ড ইমেজ লজিক
                if (data.settings.bgUrl && data.settings.bgUrl.trim() !== "") {
                    document.body.style.setProperty("background-image", `url('${data.settings.bgUrl}')`, "important");
                } else {
                    document.body.style.backgroundImage = "none";
                }

                // লাইভ ইন্ডিকেটর কালার এবং টেবিল হাইড/শো করার মূল লজিক
                const liveBadge = document.getElementById("live-indicator");
                const mainResultsWrap = document.getElementById("main-results-wrap");

                if (data.settings.liveStatus === "off") {
                    if (liveBadge) {
                        liveBadge.textContent = "● TODAY OFF";
                        liveBadge.style.background = "#ef4444";
                        liveBadge.style.animation = "indicatorRedBlink 1.2s infinite";
                    }
                    if (mainResultsWrap) {
                        mainResultsWrap.style.display = "none"; // অফ থাকলে সমস্ত টেবিল উধাও (স্ক্রিন ব্ল্যাঙ্ক)
                    }
                    return; // অফ থাকলে নিচে চার্ট জেনারেট হওয়া বন্ধ করে দেবে
                } else {
                    if (liveBadge) {
                        liveBadge.textContent = "● LIVE";
                        liveBadge.style.background = "#22c55e";
                        liveBadge.style.animation = "none";
                    }
                    if (mainResultsWrap) {
                        mainResultsWrap.style.display = "block"; // অন থাকলে সব আবার শো করবে
                    }
                }
            }

            // চার্ট রেন্ডারিং ইঞ্জিন (তারিখ ক্রমানুসারে সাজানো)
            resultsContainer.innerHTML = "";
            if (!data.records) {
                resultsContainer.innerHTML = '<div class="loading-text">কোনো লাইভ রেজাল্ট পাওয়া যায়নি।</div>';
                return;
            }

            const sortedDates = Object.keys(data.records).sort((a, b) => new Date(b) - new Date(a));

            sortedDates.forEach(dateKey => {
                const dayData = data.records[dateKey] || {};
                const dateParts = dateKey.split("-");
                const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateKey;
                
                // ডাটাবেসে যে কাস্টম স্লট সেভ আছে সেগুলো রিড করবে, না থাকলে ডিফল্ট স্লট ব্যবহার করবে
                const activeSlots = Object.keys(dayData).sort((a, b) => {
                    return coreAppConfig.defaultSlots.indexOf(a) - coreAppConfig.defaultSlots.indexOf(b);
                });
                
                const finalSlots = activeSlots.length > 0 ? activeSlots : coreAppConfig.defaultSlots;

                let tableHtml = `
                    <div class="results-table-block">
                        <div class="date-header">${displayDate}</div>
                        <div style="overflow-x: auto;">
                            <table class="results-grid-table">
                                <thead><tr>${finalSlots.map(t => `<th>${t}</th>`).join("")}</tr></thead>
                                <tbody>
                                    <tr>
                                        ${finalSlots.map(t => {
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

    // --- ২. ফায়ারবেস সিকিউরড অ্যাডমিন প্যানেল ইঞ্জিন (admin.html) ---
    if (adminInputsBody) {
        const btnLogin = document.getElementById("btn-login");
        const btnLogout = document.getElementById("btn-logout");
        const passInput = document.getElementById("admin-password");
        const authScreen = document.getElementById("admin-auth-screen");
        const mainContent = document.getElementById("admin-main-content");
        const dateInput = document.getElementById("result-date");
        const masterSettingsBox = document.getElementById("master-settings-box");
        const roleBadge = document.getElementById("admin-role-badge");
        const statusMsg = document.getElementById("status-message");

        const triggerAlert = (msg, isSuccess = true) => {
            statusMsg.textContent = msg;
            statusMsg.className = isSuccess ? "status-msg status-success" : "status-msg status-error";
            statusMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => { statusMsg.className = "status-msg"; }, 3000);
        };

        // রিয়েল-টাইম ডাটাবেস পাসওয়ার্ড ম্যাচিং ভেরিফায়ার
        if (btnLogin) {
            btnLogin.addEventListener("click", () => {
                const password = passInput.value.trim();
                if (!password) return alert("দয়া করে পাসওয়ার্ড ইনপুট করুন!");

                get(ref(database, `${coreAppConfig.dbRootNode}/passwords`)).then((snapshot) => {
                    const dbPasswords = snapshot.val() || { master: "7777", staff: "1234" };
                    
                    if (password === dbPasswords.master) { 
                        currentUserRole = "master";
                        authScreen.style.display = "none";
                        mainContent.style.display = "block";
                        masterSettingsBox.style.display = "block"; // মাস্টার পুরো সেটিংস প্যানেল দেখতে পাবে
                        roleBadge.textContent = "★ ROLE: MASTER ADMIN";
                        roleBadge.style.background = "#fffbeb";
                        roleBadge.style.color = "#b78103";
                        loadExistingData();
                    } else if (password === dbPasswords.staff) { 
                        currentUserRole = "staff";
                        authScreen.style.display = "none";
                        mainContent.style.display = "block";
                        masterSettingsBox.style.display = "none";  // স্টাফের জন্য সেটিংস বক্স সম্পূর্ণ লক ও হাইড
                        roleBadge.textContent = "● ROLE: STAFF (Results Only)";
                        roleBadge.style.background = "#f1f5f9";
                        roleBadge.style.color = "#475569";
                        loadExistingData();
                    } else {
                        alert("ভুল পাসওয়ার্ড! পিন কোডটি ডাটাবেসের সাথে মিলছে না।");
                    }
                }).catch(err => alert("ডাটাবেস কানেকশন ত্রুটি: " + err.message));
            });
        }

        if (btnLogout) {
            btnLogout.addEventListener("click", () => {
                currentUserRole = "guest";
                passInput.value = "";
                mainContent.style.display = "none";
                authScreen.style.display = "block";
            });
        }

        // এডিটেবল টাইম স্লট এবং রো জেনারেটর ইঞ্জিন
        const loadExistingData = () => {
            const selectedDate = dateInput.value;
            if (!selectedDate) return;

            get(ref(database, coreAppConfig.dbRootNode)).then((snapshot) => {
                const globalData = snapshot.val() || {};
                const records = globalData.records || {};
                const dayData = records[selectedDate] || {};
                
                adminInputsBody.innerHTML = ""; 

                // ডাটাবেসে সেভ থাকা স্লট অথবা ডিফল্ট স্লট অ্যারে সাজানো
                const slotsToRender = coreAppConfig.defaultSlots.map((defaultTime, index) => {
                    const savedKeys = Object.keys(dayData);
                    return dayData[defaultTime] || savedKeys[index] ? savedKeys[index] || defaultTime : defaultTime;
                });

                slotsToRender.forEach((time, index) => {
                    const cleanTimeKey = Object.keys(dayData)[index] || coreAppConfig.defaultSlots[index];
                    const pattiVal = (dayData[cleanTimeKey] && dayData[cleanTimeKey].patti && dayData[cleanTimeKey].patti !== "-") ? dayData[cleanTimeKey].patti : "";
                    const singleVal = (dayData[cleanTimeKey] && dayData[cleanTimeKey].single && dayData[cleanTimeKey].single !== "-") ? dayData[cleanTimeKey].single : "";
                    
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><input type="text" class="input-time" value="${cleanTimeKey}"></td>
                        <td><input type="text" class="input-patti" value="${pattiVal}" placeholder="-"></td>
                        <td><input type="text" class="input-single" value="${singleVal}" placeholder="-"></td>
                        <td><button type="button" class="btn-row-submit">Submit</button></td>
                    `;

                    // --- রো-ভিত্তিক আলাদা সাবমিট বাটন লজিক ---
                    tr.querySelector(".btn-row-submit").addEventListener("click", () => {
                        const updatedTime = tr.querySelector(".input-time").value.trim();
                        const updatedPatti = tr.querySelector(".input-patti").value.trim() || "-";
                        const updatedSingle = tr.querySelector(".input-single").value.trim() || "-";

                        if (!updatedTime) return alert("টাইম স্লট ফাঁকা রাখা যাবে না!");

                        // নির্দিষ্ট টাইম স্লটের আন্ডারে ফায়ারবেসে সরাসরি আপডেট করার পাথ লজিক
                        const rowUpdatePath = `${coreAppConfig.dbRootNode}/records/${selectedDate}/${updatedTime}`;
                        
                        set(ref(database, rowUpdatePath), {
                            patti: updatedPatti,
                            single: updatedSingle
                        }).then(() => {
                            triggerAlert(`✓ ${updatedTime} এর ফলাফল সফলভাবে লাইভ পাবলিশ হয়েছে!`, true);
                        }).catch(err => triggerAlert("ফায়ারবেস ত্রুটি: " + err.message, false));
                    });

                    adminInputsBody.appendChild(tr);
                });

                // মাস্টার সেটিংস ও লাইভ পাসওয়ার্ড ইনপুট ফিল্ড ডেটা লোড
                if (globalData.settings) {
                    document.getElementById("input-live-status").value = globalData.settings.liveStatus || "live";
                    document.getElementById("input-subtitle").value = globalData.settings.subtitle || "";
                    document.getElementById("input-marquee").value = globalData.settings.marquee || "";
                    document.getElementById("input-tips-url").value = globalData.settings.tipsUrl || "";
                    document.getElementById("input-patti-url").value = globalData.settings.pattiUrl || "";
                    document.getElementById("input-alert").value = globalData.settings.customAlert || "";
                    document.getElementById("input-bg-url").value = globalData.settings.bgUrl || "";
                }
                
                if (globalData.passwords) {
                    document.getElementById("input-master-pass").value = globalData.passwords.master || "7777";
                    document.getElementById("input-staff-pass").value = globalData.passwords.staff || "1234";
                } else {
                    document.getElementById("input-master-pass").value = "7777";
                    document.getElementById("input-staff-pass").value = "1234";
                }
            });
        };

        dateInput.value = getLocalDateString(new Date());
        loadExistingData();
        dateInput.addEventListener("change", loadExistingData);

        // --- ৩. নিচের বড় বাটন: শুধুমাত্র ওয়েবসাইট স্মার্ট সেটিংস ও পাসওয়ার্ড আপডেটের জন্য লজিক ---
        if (btnSaveSettings) {
            btnSaveSettings.addEventListener("click", () => {
                if (currentUserRole !== "master") return alert("দুঃখিত, এই অ্যাকশনটি শুধুমাত্র মাস্টার অ্যাডমিনের জন্য সংরক্ষিত!");

                const newMasterPass = document.getElementById("input-master-pass").value.trim();
                const newStaffPass = document.getElementById("input-staff-pass").value.trim();

                const settingsObj = {
                    liveStatus: document.getElementById("input-live-status").value,
                    subtitle: document.getElementById("input-subtitle").value.trim(),
                    marquee: document.getElementById("input-marquee").value.trim(),
                    tipsUrl: document.getElementById("input-tips-url").value.trim() || "#",
                    pattiUrl: document.getElementById("input-patti-url").value.trim() || "#",
                    customAlert: document.getElementById("input-alert").value.trim(),
                    bgUrl: document.getElementById("input-bg-url").value.trim()
                };
                
                const passwordsObj = {
                    master: newMasterPass || "7777",
                    staff: newStaffPass || "1234"
                };

                const globalUpdates = {};
                globalUpdates[`${coreAppConfig.dbRootNode}/settings`] = settingsObj;
                globalUpdates[`${coreAppConfig.dbRootNode}/passwords`] = passwordsObj;

                update(ref(database), globalUpdates).then(() => {
                    triggerAlert("✓ ওয়েবসাইট স্মার্ট সেটিংস এবং পাসওয়ার্ড সফলভাবে ডাটাবেসে আপডেট হয়েছে!", true);
                }).catch(err => triggerAlert("আপডেট ত্রুটি: " + err.message, false));
            });
        }
    }
});
