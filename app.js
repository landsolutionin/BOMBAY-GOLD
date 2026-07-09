// ⚡ Firebase Core SDK Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getDatabase, ref, set, get, child, update, onValue, remove } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-database.js";

// ⚙️ ফায়ারবেস প্রজেক্ট কনফিগারেশন (সিনট্যাক্স এরর ফিক্সড করা হয়েছে)
const firebaseConfig = {
    apiKey: "AIzaSyABwusy3oZXqh3531oJlQorBsUMWxQF08I",
    authDomain: "live-result-b9155.firebaseapp.com",
    databaseURL: "https://live-result-b9155-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "live-result-b9155",
    storageBucket: "live-result-b9155.firebasestorage.app",
    messagingSenderId: "495121483481",
    appId: "1:495121483481:web:8e8bf65c71ea3d31ec60c8",
    measurementId: "G-DFDW40QF87" // <-- এখানে কোটেশন এবং নিচের ব্র্যাকেট ফিক্স করা হলো
};

// Initialize Firebase Engine
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 🌐 Global States & Cached Memory
let currentRole = 'GUEST'; 
let cachedSystemSettings = {};
const todayStr = new Date().toISOString().split('T')[0];

// ==========================================
// 🛡️ লেয়ার ১: গ্লোবাল ইনিশিয়ালাইজেশন ও সেটিংস লিসেনার
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
// 👑 লেয়ার ২: এডমিন ড্যাশবোর্ড লজিক (AUTH, CREDITS & PERMISSIONS)
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

    onValue(ref(db, 'otp_requests'), (snapshot) => {
        const tbody = document.getElementById('admin-otp-requests-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (!snapshot.exists()) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:10px; color:#64748b;">কোনো ওটিপি রিকোয়েস্ট নেই...</td></tr>`;
            return;
        }
        
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
                .then(() => showAdminNotification("ওটিপি জেনারেট ও অ্যাপ্রুভ হয়েছে!", "success"));
            });
        });
    });

    const analyticsSelect = document.getElementById('analytics-slot-select');
    if(analyticsSelect) {
        analyticsSelect.addEventListener('change', () => runLiveBetAnalytics(analyticsSelect.value));
        runLiveBetAnalytics(analyticsSelect.value);
    }
}

// ==========================================
// 💸 লেয়ার ৩: ওয়ালেট অপারেশনস (CREDIT / DEBIT)
// ==========================================
const btnCredit = document.getElementById('btn-wallet-credit');
const btnDebit = document.getElementById('btn-wallet-debit');

if (btnCredit && btnDebit) {
    btnCredit.addEventListener('click', () => executeWalletTransaction('credit'));
    btnDebit.addEventListener('click', () => executeWalletTransaction('debit'));
}

function executeWalletTransaction(type) {
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
    get(
