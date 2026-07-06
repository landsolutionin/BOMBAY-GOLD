// =================================================================
// ১. এখানে আপনার ফায়ারবেস কনফিগারেশন বসাবেন (যা আপনি এর পর পাঠাচ্ছেন)
// =================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com", // এটি অত্যন্ত জরুরি লাইভ রিফ্রেশ ছাড়া চলার জন্য
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// গেমের নির্ধারিত টাইম স্লট
const TIME_SLOTS = ["10:20 AM","11:50 AM","01:10 PM","02:40 PM","04:05 PM","05:35 PM"];

// =================================================================
// ২. মেইন পেজ বা ইউজার পেজ লজিক (index.html)
// =================================================================
function initUserPage() {
    renderUserHeaders();
    
    // ফায়ারবেস থেকে রিয়েল-টাইম ডাটা শোনা (Listen) - কোনো রিফ্রেশ ছাড়াই অটো চেঞ্জ হবে!
    db.ref("liveData").on("value", (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // সেটিংস আপডেট
            if(data.settings) {
                document.getElementById("userSubtitle").textContent = data.settings.subtitle || "";
                document.getElementById("userMarqueeTrack").textContent = data.settings.marquee || "";
                if(data.settings.logoText) document.getElementById("userLogo").textContent = data.settings.logoText;
                
                // বোতাম বা মেনু লিঙ্ক জেনারেট করা
                renderMenuButtons(data.settings);
            }
            // টেবিলের রেজাল্ট আপডেট
            if(data.rows) {
                renderUserRows(data.rows);
            }
        }
    });
}

function renderUserHeaders() {
    const headerRow = document.getElementById("userHeaderRow");
    headerRow.innerHTML = "<th>DATE</th>";
    TIME_SLOTS.forEach(slot => {
        headerRow.innerHTML += `<th>${slot}</th>`;
    });
}

function renderUserRows(rows) {
    const body = document.getElementById("userTableBody");
    body.innerHTML = "";
    rows.forEach(row => {
        let tr = `<tr><td><strong>${row.date}</strong></td>`;
        TIME_SLOTS.forEach(slot => {
            const slotData = row.slots ? row.slots[slot] : null;
            const a = slotData ? (slotData.a || "—") : "—";
            const b = slotData ? (slotData.b || "—") : "—";
            const d1 = slotData ? (slotData.d1 || "—") : "—";
            const d2 = slotData ? (slotData.d2 || "—") : "—";
            
            tr += `<td>
                <div style="font-weight:bold; color:#1f5aa8;">${a} | ${b}</div>
                <div style="font-size:12px; color:#8b6b15;">(${d1}, ${d2})</div>
            </td>`;
        });
        tr += "</tr>";
        body.innerHTML += tr;
    });
}

function renderMenuButtons(settings) {
    const container = document.getElementById("menuButtonsRow");
    container.innerHTML = "";
    if(settings.tipsUrl) {
        container.innerHTML += `<a href="${settings.tipsUrl}" target="_blank" class="btn primary" style="text-decoration:none;">Tips</a>`;
    }
    if(settings.pattiUrl) {
        container.innerHTML += `<a href="${settings.pattiUrl}" target="_blank" class="btn blue" style="text-decoration:none;">Patti Chart</a>`;
    }
}

// =================================================================
// ৩. অ্যাডমিন প্যানেল লজিক (admin.html)
// =================================================================
let localRows = [];

function initAdminPage() {
    setupTabs();
    renderAdminHeaders();

    // ডাটাবেস থেকে বর্তমান ডাটা এক্সেস করে অ্যাডমিন ফর্ম ফিলাপ করা
    db.ref("liveData").once("value", (snapshot) => {
        const data = snapshot.val();
        if(data) {
            if(data.rows) {
                localRows = data.rows;
                renderAdminRows();
            }
            if(data.settings) {
                document.getElementById("inpSubtitle").value = data.settings.subtitle || "";
                document.getElementById("inpMarquee").value = data.settings.marquee || "";
                document.getElementById("inpTipsUrl").value = data.settings.tipsUrl || "";
                document.getElementById("inpPattiUrl").value = data.settings.pattiUrl || "";
            }
        }
    });

    // নতুন রো বা ডেট যুক্ত করার বোতাম
    document.getElementById("btnAddRow").addEventListener("click", addNewRow);
    
    // পাবলিশ লাইভ বোতাম অ্যাকশন (ফায়ারবেসে ডাটা পাঠাবে)
    document.getElementById("btnPublish").addEventListener("click", publishDataLive);
}

function setupTabs() {
    const tabs = document.querySelectorAll(".tab");
    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            const panes = document.querySelectorAll(".tab-pane");
            panes.forEach(p => p.classList.add("hidden"));
            
            const target = tab.getAttribute("data-tab");
            document.getElementById(target).classList.remove("hidden");
        });
    });
}

function renderAdminHeaders() {
    const headerRow = document.getElementById("tableHeaderRow");
    headerRow.innerHTML = "<th>DATE</th>";
    TIME_SLOTS.forEach(slot => {
        headerRow.innerHTML += `<th>${slot}</th>`;
    });
}

function addNewRow() {
    const today = new Date().toISOString().split('T')[0];
    let newRow = { date: today, slots: {} };
    TIME_SLOTS.forEach(slot => {
        newRow.slots[slot] = { a: "", b: "", d1: "", d2: "" };
    });
    localRows.unshift(newRow); // নতুন ডেট সবার উপরে আসবে
    renderAdminRows();
}

function renderAdminRows() {
    const body = document.getElementById("tableBody");
    body.innerHTML = "";
    
    localRows.forEach((row, rowIndex) => {
        let tr = `<tr>`;
        tr += `<td><input type="date" class="date-input" value="${row.date}" onchange="updateDate(${rowIndex}, this.value)"></td>`;
        
        TIME_SLOTS.forEach(slot => {
            const slotData = row.slots[slot] || {a:"", b:"", d1:"", d2:""};
            tr += `<td>
                <div><input type="text" placeholder="Num A" class="cell-input-box" value="${slotData.a}" oninput="updateCell(${rowIndex}, '${slot}', 'a', this.value)"></div>
                <div><input type="text" placeholder="Num B" class="cell-input-box" value="${slotData.b}" oninput="updateCell(${rowIndex}, '${slot}', 'b', this.value)"></div>
                <div>
                   <input type="text" placeholder="D1" style="width:28px;" class="cell-input-box" value="${slotData.d1}" oninput="updateCell(${rowIndex}, '${slot}', 'd1', this.value)">
                   <input type="text" placeholder="D2" style="width:28px;" class="cell-input-box" value="${slotData.d2}" oninput="updateCell(${rowIndex}, '${slot}', 'd2', this.value)">
                </div>
            </td>`;
        });
        
        tr += `</tr>`;
        body.innerHTML += tr;
    });
}

function updateDate(index, value) {
    localRows[index].date = value;
}

function updateCell(rowIndex, slot, field, value) {
    if(!localRows[rowIndex].slots[slot]) {
        localRows[rowIndex].slots[slot] = {a:"", b:"", d1:"", d2:""};
    }
    localRows[rowIndex].slots[slot][field] = value;
}

// এই ফাংশনটি পুরো ডাটাকে ফায়ারবেস রিয়েলটাইম ডাটাবেসে সেভ করে দেয়
function publishDataLive() {
    const toast = document.getElementById("publishToast");
    const toastTitle = document.getElementById("toastTitle");
    const toastMsg = document.getElementById("toastMsg");
    
    toastTitle.textContent = "Publishing...";
    
    const settings = {
        subtitle: document.getElementById("inpSubtitle").value,
        marquee: document.getElementById("inpMarquee").value,
        tipsUrl: document.getElementById("inpTipsUrl").value,
        pattiUrl: document.getElementById("inpPattiUrl").value,
        logoText: "BG"
    };
    
    // ফায়ারবেস পুশ
    db.ref("liveData").set({
        rows: localRows,
        settings: settings
    }).then(() => {
        toastTitle.textContent = "Live & Active";
        toastMsg.textContent = "পুরো পৃথিবীতে আপনার সাইট রিফ্রেশ ছাড়া সাথে সাথে আপডেট হয়ে গেছে!";
        setTimeout(() => {
            toastTitle.textContent = "Ready";
            toastMsg.textContent = "Make changes then click PUBLISH LIVE.";
        }, 4000);
    }).catch((error) => {
        toastTitle.textContent = "Error!";
        toastMsg.textContent = error.message;
    });
}
