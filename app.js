// ⚡ Firebase Core SDK Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, set, get, child, update, onValue, remove } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

// ⚙️ ফায়ারবেস প্রজেক্ট কনফিগারেশন (এখানে আপনার নিজস্ব সিক্রেট কোডগুলো বসিয়ে নিন)
const firebaseConfig = {
    apiKey: "AIzaSyABwusy3oZXqh3531oJlQorBsUMWxQF08I",
    authDomain: "live-result-b9155.firebaseapp.com",
    databaseURL: "https://live-result-b9155-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "live-result-b9155",
    storageBucket: "live-result-b9155.firebasestorage.app",
    messagingSenderId: "495121483481",
    appId: "1:495121483481:web:8e8bf65c71ea3d31ec60c8",
    measurementId: "G-DFDW40QF87


// Initialize Firebase Engine
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🌐 Global States & Cached Memory
let currentRole = 'GUEST'; 
let cachedSystemSettings = {};
const todayStr = new Date().toISOString().split('T')[0];

// ==========================================
// 🛡️ লেয়ার ১: গ্লোবাল ইনিশিয়ালাইজেশন ও সেটিংস লিসেনার
// ==========================================
function initAppEngine() {
    onValue(ref(db, 'system_settings'), (snapshot) => {
        if (snapshot.exists()) {
            cachedSystemSettings = snapshot.val();
            syncAdminAndPlayDropdowns();
            if (currentRole === 'MASTER') updateMasterSettingsUI();
            checkSavedSession();
        }
    });
}

function checkSavedSession() {
    const adminContainer = document.getElementById('admin-main-content');
    if (adminContainer) {
        const savedAdminPin = localStorage.getItem('savedAdminPin');
        if (savedAdminPin && currentRole === 'GUEST') {
            executeAdminAuth(savedAdminPin, true);
        }
        const rememberMeContainer = document.getElementById('remember-me-container');
        if (rememberMeContainer) {
            rememberMeContainer.style.display = cachedSystemSettings.allowRememberStaff === 'yes' ? 'flex' : 'none';
        }
    }
}

function syncAdminAndPlayDropdowns() {
    const slots = cachedSystemSettings.timeSlots || [];
    const playSelect = document.getElementById('play-slot-select');
    const analyticsSelect = document.getElementById('analytics-slot-select');

    if (playSelect) {
        playSelect.innerHTML = slots.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    }
    if (analyticsSelect) {
        const currentVal = analyticsSelect.value;
        analyticsSelect.innerHTML = slots.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        if(currentVal && slots.some(s => s.id === currentVal)) analyticsSelect.value = currentVal;
    }
}

// ==========================================
// 👑 লেয়ার ২: এডমিন ড্যাশবোর্ড লজিক (AUTH, CREDITS & PERMISSIONS)
// ==========================================
const btnLogin = document.getElementById('btn-login');
if (btnLogin) {
    btnLogin.addEventListener('click', () => {
        const passInput = document.getElementById('admin-password').value.trim();
        executeAdminAuth(passInput, false);
    });
}

function executeAdminAuth(enteredPin, isAuto = false) {
    get(child(ref(db), 'system_settings')).then((snapshot) => {
        if (snapshot.exists()) {
            const settings = snapshot.val();
            if (enteredPin === settings.masterPassword) {
                currentRole = 'MASTER';
                unlockAdminPanel(enteredPin, isAuto);
            } else if (enteredPin === settings.staffPassword) {
                currentRole = 'STAFF';
                unlockAdminPanel(enteredPin, isAuto);
            } else if (!isAuto) {
                showAdminNotification("ভুল পাসওয়ার্ড! অ্যাক্সেস ডিনাইড।", "error");
            }
        }
    });
}

function unlockAdminPanel(pin, isAuto) {
    document.getElementById('admin-auth-screen').style.display = 'none';
    document.getElementById('admin-main-content').style.display = 'block';
    document.getElementById('admin-role-badge').textContent = `ROLE: ${currentRole}`;

    const chkRemember = document.getElementById('chk-remember-me');
    if (chkRemember && chkRemember.checked && !isAuto) {
        localStorage.setItem('savedAdminPin', pin);
    }

    if (currentRole === 'MASTER') {
        document.getElementById('master-settings-box').style.display = 'block';
        document.getElementById('staff-password-change-container').style.display = 'none';
        updateMasterSettingsUI();
        renderSlotsManager();
    } else {
        document.getElementById('master-settings-box').style.display = 'none';
        document.getElementById('staff-password-change-container').style.display = 'flex';
    }

    // লাইভ ডেটা লিসেনার অ্যাক্টিভেশন
    activateLiveAdminListeners();
}

function activateLiveAdminListeners() {
    const resDate = document.getElementById('result-date');
    if (resDate) {
        resDate.value = todayStr;
        loadLiveEntryPanel(todayStr);
        resDate.addEventListener('change', (e) => loadLiveEntryPanel(e.target.value));
    }

    const histDate = document.getElementById('history-date');
    if (histDate) {
        histDate.value = todayStr;
        loadHistoryPanel(todayStr);
        histDate.addEventListener('change', (e) => loadHistoryPanel(e.target.value));
    }

    // ওটিপি লাইভ রিকোয়েস্ট সিঙ্ক
    onValue(ref(db, 'otp_requests'), (snapshot) => {
        const tbody = document.getElementById('admin-otp-requests-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!snapshot.exists()) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:10px; color:#64748b;">কোনো ওটিপি রিকোয়েস্ট নেই...</td></tr>`;
            return;
        }
        
        // স্টাফ পারমিশন গার্ড (ওটিপি অ্যাপ্রুভ ক্ষমতা চেক)
        const canApprove = currentRole === 'MASTER' || (cachedSystemSettings.permissions && cachedSystemSettings.permissions.approveOtp);

        snapshot.forEach((childSnap) => {
            const reqId = childSnap.key;
            const data = childSnap.val();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${data.name}</b></td>
                <td><span class="badge-pending">${data.pin}</span></td>
                <td><b style="color:#2563eb; font-size:16px;">${data.otp || '---'}</b></td>
                <td>
                    ${data.status === 'pending' ? 
                        `<button class="btn-approve-otp" data-id="${reqId}" style="background:#10b981; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;" ${canApprove ? '' : 'disabled'}>Approve</button>` : 
                        `<span class="badge-approved">Approved</span>`
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-approve-otp').forEach(btn => {
            btn.addEventListener('click', function() {
                const reqId = this.getAttribute('data-id');
                const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
                update(ref(db, `otp_requests/${reqId}`), { otp: generatedOtp, status: 'approved' })
                .then(() => showAdminNotification("ওটিপি জেনারেট ও অ্যাপ্রুভ হয়েছে!", "success"));
            });
        });
    });

    // লাইভ বেটিং অ্যানালিটিক্স সিঙ্ক
    const analyticsSelect = document.getElementById('analytics-slot-select');
    if(analyticsSelect) {
        analyticsSelect.addEventListener('change', () => runLiveBetAnalytics(analyticsSelect.value));
        runLiveBetAnalytics(analyticsSelect.value);
    }
}

// ==========================================
// 💸 লেয়ার ৩: ওয়ালেট অপারেশনস (CREDIT / DEBIT)
// ==========================================
const btnCredit = document.getElementById('btn-wallet-credit');
const btnDebit = document.getElementById('btn-wallet-debit');

if (btnCredit && btnDebit) {
    btnCredit.addEventListener('click', () => executeWalletTransaction('credit'));
    btnDebit.addEventListener('click', () => executeWalletTransaction('debit'));
}

function executeWalletTransaction(type) {
    // স্টাফ পারমিশন গেটওয়ে লক
    if (currentRole === 'STAFF') {
        const perms = cachedSystemSettings.permissions || {};
        if (type === 'credit' && !perms.recharge) { showAdminNotification("আপনার রিচার্জ করার ক্ষমতা নেই!", "error"); return; }
        if (type === 'debit' && !perms.debit) { showAdminNotification("আপনার ডেবিট করার ক্ষমতা নেই!", "error"); return; }
    }

    const playerId = document.getElementById('wallet-player-id').value.trim().replace('.', '_');
    const amount = parseFloat(document.getElementById('wallet-amount').value);

    if (!playerId || isNaN(amount) || amount <= 0) {
        showAdminNotification("সঠিক আইডি এবং অ্যামাউন্ট ইনপুট দিন!", "error");
        return;
    }

    const userWalletRef = ref(db, `wallets/${playerId}`);
    get(userWalletRef).then((snapshot) => {
        let currentBal = snapshot.exists() ? parseFloat(snapshot.val().balance || 0) : 0;
        let newBal = type === 'credit' ? currentBal + amount : currentBal - amount;

        if (newBal < 0) { showAdminNotification("প্লেয়ারের অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই!", "error"); return; }

        set(userWalletRef, { balance: newBal, updatedAt: new Date().toISOString() })
        .then(() => {
            showAdminNotification(`সফলভাবে ওয়ালেট ${type === 'credit' ? 'রিচার্জ' : 'ডেবিট'} হয়েছে! নতুন ব্যালেন্স: ${newBal} PTS`, "success");
            document.getElementById('wallet-amount').value = '';
        });
    });
}

// ==========================================
// 📊 লেয়ার ৪: রেজাল্ট সাবমিশন ও অটোমেটিক উইনিং ক্যালকুলেটর
// ==========================================
function loadLiveEntryPanel(date) {
    onValue(ref(db, `results/${date}`), (snapshot) => {
        const tbody = document.getElementById('admin-inputs-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        const currentData = snapshot.val() || {};
        const slots = cachedSystemSettings.timeSlots || [];

        slots.forEach((slot) => {
            const slotData = currentData[slot.id] || { patti: '', single: '', status: 'visible' };
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${slot.name}</b></td>
                <td><input type="text" id="patti-${slot.id}" value="${slotData.patti || ''}" maxlength="3" style="width:80px; text-align:center; font-weight:bold;"></td>
                <td><input type="text" id="single-${slot.id}" value="${slotData.single || ''}" maxlength="1" style="width:50px; text-align:center; font-weight:bold;"></td>
                <td><button class="btn-save-live-row" data-slot="${slot.id}" style="background:#2563eb; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">Save</button></td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-save-live-row').forEach(btn => {
            btn.addEventListener('click', function() {
                const slotId = this.getAttribute('data-slot');
                commitResultToDatabase(date, slotId, 'today');
            });
        });
    });
}

function commitResultToDatabase(date, slotId, source) {
    if (currentRole === 'STAFF' && source === 'history') {
        if (!(cachedSystemSettings.permissions && cachedSystemSettings.permissions.editHistory)) {
            showAdminNotification("আপনার হিস্ট্রি এডিট করার পারমিশন নেই!", "error");
            return;
        }
    }

    const prefix = source === 'today' ? '' : 'hist-';
    const pattiVal = document.getElementById(`${prefix}patti-${slotId}`).value.trim();
    const singleVal = document.getElementById(`${prefix}single-${slotId}`).value.trim();

    get(child(ref(db), `results/${date}/${slotId}`)).then((snapshot) => {
        const existing = snapshot.val() || {};
        const targetStatus = existing.status || 'visible';

        // ১. রেজাল্ট ফায়ারবেসে পুশ
        update(ref(db, `results/${date}/${slotId}`), {
            patti: pattiVal,
            single: singleVal,
            status: targetStatus,
            updatedAt: new Date().toISOString()
        })
        .then(() => {
            showAdminNotification("রেজাল্ট সফলভাবে সেভ ও লাইভ হয়েছে!", "success");
            // ২. 🏆 অভিমন্যু চক্রব্যূহের অটো-উইনিং মেকানিজম রান (যদি বাজি ধরা থাকে)
            triggerAutoWinningPayout(date, slotId, singleVal, pattiVal);
        });
    });
}

function triggerAutoWinningPayout(date, slotId, winningSingle, winningPatti) {
    get(ref(db, `bets/${date}/${slotId}`)).then((snapshot) => {
        if (!snapshot.exists()) return; // কোনো বাজি না থাকলে ক্যালকুলেশন ক্লোজ

        snapshot.forEach((playerBetSnap) => {
            const playerKey = playerBetSnap.key; // Rahim_5678
            const betData = playerBetSnap.val();
            let totalWinPoints = 0;

            // সিঙ্গেল উইনার চেকিং (১০ গুণ রিটার্ন)
            if (betData.singleNum === winningSingle && parseFloat(betData.singlePoints) > 0) {
                totalWinPoints += parseFloat(betData.singlePoints) * 10;
            }
            // পাত্তি উইনার চেকিং (১০০ গুণ রিটার্ন)
            if (betData.pattiNum === winningPatti && parseFloat(betData.pattiPoints) > 0) {
                totalWinPoints += parseFloat(betData.pattiPoints) * 100;
            }

            // যদি কোনো প্লেয়ার উইন হয়, তার ওয়ালেটে ব্যালেন্স সাথে সাথে ক্রেডিট হবে
            if (totalWinPoints > 0) {
                const pWalletRef = ref(db, `wallets/${playerKey}`);
                get(pWalletRef).then((wSnap) => {
                    let bal = wSnap.exists() ? parseFloat(wSnap.val().balance || 0) : 0;
                    set(pWalletRef, { balance: bal + totalWinPoints, updatedAt: new Date().toISOString() });
                });
            }
        });
    });
}

function loadHistoryPanel(date) {
    const tbody = document.getElementById('admin-history-body');
    if (!tbody) return;
    onValue(ref(db, `results/${date}`), (snapshot) => {
        tbody.innerHTML = '';
        const currentData = snapshot.val() || {};
        const slots = cachedSystemSettings.timeSlots || [];

        slots.forEach((slot) => {
            const slotData = currentData[slot.id] || { patti: '', single: '', status: 'visible' };
            const isHidden = slotData.status === 'hidden';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><b>${slot.name}</b></td>
                <td><input type="text" id="hist-patti-${slot.id}" value="${slotData.patti || ''}" maxlength="3" style="width:70px; text-align:center;"></td>
                <td><input type="text" id="hist-single-${slot.id}" value="${slotData.single || ''}" maxlength="1" style="width:40px; text-align:center;"></td>
                <td><span class="${isHidden ? 'status-badge-hidden' : 'status-badge-visible'}">${isHidden ? '❌ Hidden' : '🟢 Visible'}</span></td>
                <td>
                    <button class="btn-save-hist-row" data-slot="${slot.id}" style="background:#10b981; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Edit</button>
                    ${currentRole === 'MASTER' ? `<button class="btn-toggle-vis" data-slot="${slot.id}" data-status="${slotData.status || 'visible'}" style="background:#64748b; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-left:5px;">${isHidden?'Show':'Hide'}</button>`:''}
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.btn-save-hist-row').forEach(btn => {
            btn.addEventListener('click', function() { commitResultToDatabase(date, this.getAttribute('data-slot'), 'history'); });
        });
        document.querySelectorAll('.btn-toggle-vis').forEach(btn => {
            btn.addEventListener('click', function() {
                const sId = this.getAttribute('data-slot');
                const nextStatus = this.getAttribute('data-status') === 'hidden' ? 'visible' : 'hidden';
                update(ref(db, `results/${date}/${sId}`), { status: nextStatus });
            });
        });
    });
}

function runLiveBetAnalytics(slotId) {
    const tbody = document.getElementById('admin-analytics-body');
    if(!tbody || !slotId) return;

    onValue(ref(db, `bets/${todayStr}/${slotId}`), (snapshot) => {
        tbody.innerHTML = '';
        if(!snapshot.exists()) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:10px; color:#64748b;">আজ এই স্লটে কোনো লাইভ বাজি পড়েনি...</td></tr>`;
            return;
        }

        let totalSlotPoints = 0;
        let singleLoadMap = {};
        let pattiLoadMap = {};

        snapshot.forEach((pSnap) => {
            const data = pSnap.val();
            const sPts = parseFloat(data.singlePoints || 0);
            const pPts = parseFloat(data.pattiPoints || 0);
            totalSlotPoints += (sPts + pPts);

            if(data.singleNum && sPts > 0) { singleLoadMap[data.singleNum] = (singleLoadMap[data.singleNum] || 0) + sPts; }
            if(data.pattiNum && pPts > 0) { pattiLoadMap[data.pattiNum] = (pattiLoadMap[data.pattiNum] || 0) + pPts; }
        });

        // অ্যানালিটিক্স চার্ট রেন্ডারিং লুপ
        for (let num in singleLoadMap) {
            let pct = ((singleLoadMap[num] / totalSlotPoints) * 100).toFixed(1);
            tbody.innerHTML += `<tr><td>🎰 Single</td><td><b style="color:#ec4899;">${num}</b></td><td>${singleLoadMap[num]} PTS (${pct}%)</td></tr>`;
        }
        for (let patti in pattiLoadMap) {
            let pct = ((pattiLoadMap[patti] / totalSlotPoints) * 100).toFixed(1);
            tbody.innerHTML += `<tr><td>🃏 Patti</td><td><b style="color:#8b5cf6;">${patti}</b></td><td>${pattiLoadMap[patti]} PTS (${pct}%)</td></tr>`;
        }
    });
}

// ==========================================
// 👑 লেয়ার ৫: মাস্টার গ্লোবাল সেটিংস এবং পাওয়ার কন্ট্রোল
// ==========================================
function updateMasterSettingsUI() {
    document.getElementById('input-live-status').value = cachedSystemSettings.websiteStatus || 'live';
    document.getElementById('input-allow-remember').value = cachedSystemSettings.allowRememberStaff || 'no';
    document.getElementById('input-alert').value = cachedSystemSettings.alertText || '';
    document.getElementById('input-bg-url').value = cachedSystemSettings.bgUrl || '';
    document.getElementById('input-subtitle').value = cachedSystemSettings.subtitleText || '';
    document.getElementById('input-marquee').value = cachedSystemSettings.marqueeText || '';
    document.getElementById('input-tips-url').value = cachedSystemSettings.tipsUrl || '';
    document.getElementById('input-patti-url').value = cachedSystemSettings.pattiUrl || '';
    document.getElementById('input-master-pass').value = cachedSystemSettings.masterPassword || '';
    document.getElementById('input-staff-pass').value = cachedSystemSettings.staffPassword || '';

    const perms = cachedSystemSettings.permissions || {};
    document.getElementById('perm-approve-otp').checked = !!perms.approveOtp;
    document.getElementById('perm-recharge').checked = !!perms.recharge;
    document.getElementById('perm-debit').checked = !!perms.debit;
    document.getElementById('perm-edit-history').checked = !!perms.editHistory;
}

const btnSaveSettings = document.getElementById('btn-save-settings');
if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', () => {
        if (currentRole !== 'MASTER') return;
        const config = {
            ...cachedSystemSettings,
            websiteStatus: document.getElementById('input-live-status').value,
            allowRememberStaff: document.getElementById('input-allow-remember').value,
            alertText: document.getElementById('input-alert').value.trim(),
            bgUrl: document.getElementById('input-bg-url').value.trim(),
            subtitleText: document.getElementById('input-subtitle').value.trim(),
            marqueeText: document.getElementById('input-marquee').value.trim(),
            tipsUrl: document.getElementById('input-tips-url').value.trim(),
            pattiUrl: document.getElementById('input-patti-url').value.trim(),
            masterPassword: document.getElementById('input-master-pass').value.trim(),
            staffPassword: document.getElementById('input-staff-pass').value.trim(),
            permissions: {
                approveOtp: document.getElementById('perm-approve-otp').checked,
                recharge: document.getElementById('perm-recharge').checked,
                debit: document
