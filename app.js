// রিয়েল-টাইম সেটিংস লোড করা
db.collection("settings").doc("control").onSnapshot((doc) => {
  if (doc.exists) {
    const data = doc.data();
    
    // ১. লাইভ নোটিশ বার আপডেট
    document.getElementById("notification-bar").innerText = data.liveText || "";
    
    // ২. ওয়েলকাম নোট আপডেট
    document.getElementById("welcome-text").innerText = data.welcomeNote || "";
    
    // ৩. সাইটের টাইটেল বা ব্র্যান্ড নাম
    document.getElementById("site-title").innerText = data.siteTitle || "BOMBAY GOLD";

    // ৪. লাইভ স্ট্যাটাস বাটন কন্ট্রোল
    const liveIndicator = document.getElementById("live-indicator");
    const tablesHolder = document.getElementById("tables-holder");
    
    if (data.liveStatus === true) {
      liveIndicator.className = "live-badge-on";
      liveIndicator.innerText = "● LIVE ON";
      tablesHolder.style.display = "block"; // টেবিল দেখাবে
    } else {
      liveIndicator.className = "live-badge-off";
      liveIndicator.innerText = "● LIVE OFF";
      tablesHolder.style.display = "none"; // টেবিল সম্পূর্ণ ভ্যানিশ হয়ে যাবে
    }

    // ৫. ডাইনামিক ব্যাকগ্রাউন্ড ইমেজ পরিবর্তন
    if (data.bgImage) {
      document.getElementById("main-body").style.backgroundImage = `url('${data.bgImage}')`;
      document.getElementById("main-body").style.backgroundSize = "cover";
      document.getElementById("main-body").style.backgroundAttachment = "fixed";
    }

    // ৬. ডাইনামিক লোগো লোডার
    const logoHolder = document.getElementById("logo-holder");
    if (data.logoUrl) {
      logoHolder.innerHTML = `<img src="${data.logoUrl}" alt="Logo" style="max-height:80px; margin-bottom:10px;">`;
    } else {
      logoHolder.innerHTML = "";
    }
  }
});

// রিয়েল-টাইম রেজাল্ট টেবিল জেনারেটর (পাশাপাশি কলাম ফরম্যাট)
db.collection("results").orderBy("date", "desc").onSnapshot((snapshot) => {
  const tablesHolder = document.getElementById("tables-holder");
  tablesHolder.innerHTML = "";

  if (snapshot.empty) {
    tablesHolder.innerHTML = `<div class="loading-text">কোনো রেজাল্ট পাওয়া যায়নি।</div>`;
    return;
  }

  // তারিখ অনুযায়ী ডাটা গ্রুপ করা
  let dataByDate = {};
  snapshot.forEach((doc) => {
    let item = doc.data();
    if (!dataByDate[item.date]) {
      dataByDate[item.date] = [];
    }
    dataByDate[item.date].push(item);
  });

  // স্ক্রিনে কলাম আকারে টেবিল তৈরি করা
  for (let date in dataByDate) {
    let dateSection = document.createElement("div");
    dateSection.className = "date-section";

    let dateHeader = document.createElement("div");
    dateHeader.className = "date-header";
    dateHeader.innerText = date;
    dateSection.appendChild(dateHeader);

    let resultGrid = document.createElement("div");
    resultGrid.className = "result-grid";

    // বাজি বা টাইম স্লটগুলো সাজানো
    dataByDate[date].forEach((res) => {
      let column = document.createElement("div");
      column.className = "result-column";
      column.innerHTML = `
        <div class="res-time">${res.time}</div>
        <div class="res-patti">${res.patti || '-'}</div>
        <div class="res-single">${res.single || '-'}</div>
      `;
      resultGrid.appendChild(column);
    });

    dateSection.appendChild(resultGrid);
    tablesHolder.appendChild(dateSection);
  }
});
