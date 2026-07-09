/** * BOMBAY-GOLD MASTER ENGINE 
 * এই ফাইলটি আপনার প্রজেক্টের একমাত্র জাভাস্ক্রিপ্ট ফাইল। 
 * ভবিষ্যতে নতুন কিছু যোগ করতে চাইলে এই ফাইলের নিচে কমেন্ট অনুযায়ী যোগ করবেন।
 */

// ১. কনফিগারেশন
const firebaseConfig = {
    apiKey: "AIzaSyABwusy3oZXqh3531oJlQorBsUMWxQF08I",
    authDomain: "live-result-b9155.firebaseapp.com",
    databaseURL: "https://live-result-b9155-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "live-result-b9155",
    storageBucket: "live-result-b9155.firebasestorage.app",
    messagingSenderId: "495121483481",
    appId: "1:495121483481:web:8e8bf65c71ea3d31ec60c8"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const getToday = () => new Date().toISOString().split('T')[0];

// ২. কোর ডাটাবেস ম্যানেজার (যেকোনো ডাটাবেসে রূপান্তরযোগ্য)
const DataEngine = {
    save: (path, data) => db.ref(`${path}/${getToday()}`).push(data),
    listen: (path, callback) => db.ref(`${path}/${getToday()}`).on('value', (s) => callback(s.val()))
};

// ৩. অ্যাডমিন লজিক (রেজাল্ট আপডেট)
const addBtn = document.getElementById('add-result-btn');
if (addBtn) {
    addBtn.addEventListener('click', () => {
        const time = document.getElementById('time-input').value;
        const result = document.getElementById('result-input').value;
        if (time && result) {
            DataEngine.save('results', { time, result });
            alert("সফলভাবে আপডেট হয়েছে!");
        }
    });
}

// ৪. ইনডেক্স পেজ লজিক (লাইভ রেজাল্ট)
const resultBody = document.getElementById('result-body');
if (resultBody) {
    DataEngine.listen('results', (data) => {
        resultBody.innerHTML = "";
        for (let key in data) {
            resultBody.innerHTML += `<tr><td>${data[key].time}</td><td>${data[key].result}</td></tr>`;
        }
    });
}

// ৫. প্লেয়ার লজিক (নিরাপদ)
function playerSystem(action, payload) {
    // এখানে প্লেয়ার লগইন, বেটিং এবং উইথড্র লজিক থাকবে
    // payload: {name, pin, type, amount, etc}
    console.log("Player System Active: " + action);
}

// ভবিষ্যতে নতুন ফিচার যোগ করার জায়গা এখান থেকে শুরু করুন:
// (যেমন: নতুন কোন গেম বা লজিক)
