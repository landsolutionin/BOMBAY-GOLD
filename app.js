// ⚡ Firebase Core SDK Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, set, get, child, update, onValue, remove } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

// ⚙️ ফায়ারবেস প্রজেক্ট কনফিগারেশন
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

// Initialize Firebase Engine
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🌐 Global States & Cached Memory
let currentRole = 'GUEST'; 
let cachedSettings = {};
const todayStr = new Date().toISOString().split('T')[0];

// ==========================================
// 🛡️ লেয়ার ১: গ্লোবাল ইনিশিয়ালাইজেশন ও সেটিংস লিসেনার
// ==========================================
function initAppEngine() {
    // ফায়ারবেসের game_results/settings থেকে সেটিংস রিড করছে
    onValue(ref(db, 'game_results/settings'), (snapshot) => {
        if (snapshot.exists()) {
            cachedSettings = snapshot.val();
            syncAdminAndPlayDropdowns();
            renderLiveResultsHTML(); // মেইন স্ক্রিনে লাইভ রেজাল্ট দেখানোর ফাংশন
            if (currentRole === 'MASTER') updateMasterSettingsUI();
            checkSavedSession();
        }
    });

    // মেইন পেজের টেবিল ডাটা রিড করার জন্য records পাথ লিসেনার
    onValue(ref(db, 'game_results/records'), (snapshot) => {
        renderLiveResultsHTML();
    });
}

function checkSavedSession() {
    const adminContainer = document.getElementById('admin-main-content');
    if (adminContainer) {
        const savedAdminPin = localStorage.getItem('savedAdminPin');
        if (savedAdminPin && currentRole === 'GUEST') {
            executeAdminAuth(savedAdminPin, true);
        }
    }
}

function syncAdminAndPlayDropdowns() {
    // ফায়ারবেসের globalSlots থেকে স্লট তৈরি
    const slots = cachedSettings.globalSlots || {};
    const playSelect = document.getElementById('play-slot-select');
    const analyticsSelect = document.getElementById('analytics-slot-select');

    let optionsHTML = '';
    for (let key in slots) {
        optionsHTML += `<option value="${key}">${slots[key]}</option>`;
    }

    if (playSelect) playSelect.innerHTML = optionsHTML;
    if (analyticsSelect) analyticsSelect.innerHTML = optionsHTML;
}

// ==========================================
// 👑 লেয়ার ২: এডমিন ড্যাশবোর্ড লজিক (AUTH)
// ==========================================
const btnLogin = document.getElementById('btn-login');
if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        const passInput = document.getElementById('admin-password').value.trim();
        executeAdminAuth(passInput, false);
    });
}

function executeAdminAuth(enteredPin, isAuto = false) {
    // ফায়ারবেসের game_results/passwords পাথ চেক করছে
    get(ref(db, 'game_results/passwords')).then((snapshot) => {
        if (snapshot.exists()) {
            const passwords = snapshot.val();
            
            if (enteredPin === String(passwords.masterPassword)) {
                currentRole = 'MASTER';
                unlockAdminPanel(enteredPin, isAuto);
            } else if (enteredPin === String(passwords.staffPassword)) {
                currentRole = 'STAFF';
                unlockAdminPanel(enteredPin, isAuto);
            } else if (!isAuto) {
                showAdminNotification("ভুল পাসওয়ার্ড! অ্যাক্সেস ডিনাইড।", "error");
            }
        }
    }).catch(err => console.error("Auth Error:", err));
}

function unlockAdminPanel(pin, isAuto) {
    const authScreen = document.getElementById('admin-auth-screen');
    const mainContent = document.getElementById('admin-main-content');
    
    if(authScreen) authScreen.style.display = 'none';
    if(mainContent) mainContent.style.display = 'block';
    
    const badge = document.getElementById('admin-role-badge');
    if(badge) badge.textContent = `ROLE: ${currentRole}`;

    if (currentRole === 'MASTER') {
        const masterBox = document.getElementById('master-settings-box');
        if(masterBox) masterBox.style.display = 'block';
        updateMasterSettingsUI();
    }

    activateLiveAdminListeners();
}

function activateLiveAdminListeners() {
    const resDate = document.getElementById('result-date');
    if (resDate) {
        resDate.value = todayStr;
        loadLiveEntryPanel(todayStr);
        resDate.addEventListener('change', (e) => loadLiveEntryPanel(e.target.value));
    }
}

// ==========================================
// 📊 লেয়ার ৩: রেজাল্ট সাবমিশন ও লাইভ ডিসপ্লে
// ==========================================
function loadLiveEntryPanel(date) {
    onValue(ref(db, `game_results/records/${date}`), (snapshot) => {
        const tbody = document.getElementById('admin-inputs-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        const currentData = snapshot.val() || {};
        const slots = cachedSettings.globalSlots || {};

        for (let slotId in slots) {
            const slotData = currentData[slotId] || { patti: '', single: '' };
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${slots[slotId]}</b></td>
                <td><input type="text" id="patti-${slotId}" value="${slotData.patti || ''}" maxlength="3" style="width:80px; text-align:center;"></td>
                <td><input type="text" id="single-${slotId}" value="${slotData.single || ''}" maxlength="1" style="width:50px; text-align:center;"></td>
                <td><button class="btn-save-live-row" data-slot="${slotId}" style="background:#2563eb; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Save</button></td>
            `;
            tbody.appendChild(tr);
        }

        document.querySelectorAll('.btn-save-live-row').forEach(btn => {
            btn.addEventListener('click', function() {
                const slotId = this.getAttribute('data-slot');
                const pattiVal = document.getElementById(`patti-${slotId}`).value.trim();
                const singleVal = document.getElementById(`single-${slotId}`).value.trim();
                
                update(ref(db, `game_results/records/${date}/${slotId}`), {
                    patti: pattiVal,
                    single: singleVal,
                    updatedAt: new Date().toISOString()
                }).then(() => showAdminNotification("রেজাল্ট সেভ হয়েছে!", "success"));
            });
        });
    });
}

// মেইন পেজে লাইভ ফলাফল টেবিল রেন্ডার করার লজিক
function renderLiveResultsHTML() {
    const resultContainer = document.getElementById('today-results-container');
    if (!resultContainer) return;

    get(ref(db, `game_results/records/${todayStr}`)).then((snapshot) => {
        const currentData = snapshot.val() || {};
        const slots = cachedSettings.globalSlots || {};
        
        let html = `<table style="width:100%; border-collapse: collapse; text-align:center; color:white;">
            <tr style="background:#1e293b; color:#fbbf24;"><th style="padding:10px;">বাজি স্লট</th><th style="padding:10px;">পত্তি</th><th style="padding:10px;">সিঙ্গেল</th></tr>`;
        
        let hasData = false;
        for (let slotId in slots) {
            hasData = true;
            const slotData = currentData[slotId] || { patti: '---', single: '---' };
            html += `<tr style="border-bottom:1px solid #334155;">
                <td style="padding:12px;"><b>${slots[slotId]}</b></td>
                <td style="color:#a7f3d0; font-weight:bold;">${slotData.patti}</td>
                <td style="color:#fbcfe8; font-weight:bold; font-size:18px;">${slotData.single}</td>
            </tr>`;
        }
        html += `</table>`;
        
        if(!hasData) html = `<p style="text-align:center; color:#94a3b8; padding:20px;">ফলাফল লোড হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন।</p>`;
        resultContainer.innerHTML = html;
    });
}

// ==========================================
// 👑 লেয়ার ৪: মাস্টার সেটিংস আপডেট
// ==========================================
function updateMasterSettingsUI() {
    if(document.getElementById('input-live-status')) document.getElementById('input-live-status').value = cachedSettings.LiveStatus || 'live';
    if(document.getElementById('input-marquee')) document.getElementById('input-marquee').value = cachedSettings.marquee || '';
    if(document.getElementById('input-subtitle')) document.getElementById('input-subtitle').value = cachedSettings.subtitle || '';
}

// নোটিফিকেশন মেসেজ
function showAdminNotification(msg, type = "success") {
    const bar = document.getElementById('status-message');
    if (!bar) { alert(msg); return; }
    bar.textContent = msg;
    bar.style.display = 'block';
    setTimeout(() => bar.style.display = 'none', 3000);
}

// 🚀 ইঞ্জিন স্টার্ট
initAppEngine();
