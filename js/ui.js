// ==========================
// UI.JS
// ==========================

// ---------- TAB SYSTEM ----------

window.showTab = function(tabName){

document.querySelectorAll(".section").forEach(section=>{

section.classList.remove("active");

});

const tab=document.getElementById(tabName);

if(tab){

tab.classList.add("active");

}

};

// ---------- LOADING ----------

export function showLoading(id){

const el=document.getElementById(id);

if(el){

el.innerHTML="Loading...";

}

}

// ---------- TEXT UPDATE ----------

export function setText(id,text){

const el=document.getElementById(id);

if(el){

el.innerText=text;

}

}

// ---------- RESULT UPDATE ----------

export function updateResult(data){

if(!data) return;

setText("mmc",data.mmc || "--");

setText("ffl",data.ffl || "--");

setText("mumbai",data.mumbai || "--");

}

// ---------- WINNER ----------

export function updateWinner(data){

if(!data) return;

setText("winner",data.name || "Waiting...");

const sound=document.getElementById("alertSound");

if(sound){

sound.play().catch(()=>{});

}

}

// ---------- BANNER ----------

export function updateBanner(data){

if(!data) return;

setText("bannerTitle",data.title || "Ultimate Live Dashboard");

setText("bannerSubtitle",data.subtitle || "");

}

// ---------- ANNOUNCEMENT ----------

export function updateAnnouncement(data){

if(!data) return;

setText("announcement",data.text || "");

}

// ---------- HISTORY ----------

export function updateHistory(data){

const table=document.getElementById("historyTable");

if(!table) return;

let html="";

if(data){

Object.keys(data).reverse().forEach(key=>{

html+=`

<tr>

<td>${data[key].game}</td>

<td>${data[key].result}</td>

</tr>

`;

});

}else{

html=`

<tr>

<td colspan="2">

No History

</td>

</tr>

`;

}

table.innerHTML=html;

}

// ---------- CLOCK ----------

function liveClock(){

const now=new Date();

const time=now.toLocaleTimeString();

const date=now.toLocaleDateString();

const clock=document.getElementById("liveClock");

if(clock){

clock.innerHTML=date+" | "+time;

}

}

liveClock();

setInterval(liveClock,1000);

// ---------- DARK MODE ----------

window.toggleDarkMode=function(){

document.body.classList.toggle("dark");

localStorage.setItem(

"theme",

document.body.classList.contains("dark") ? "dark":"light"

);

};

if(localStorage.getItem("theme")=="dark"){

document.body.classList.add("dark");

}

// ---------- VISITOR ----------

let visitor=localStorage.getItem("visitor");

if(!visitor){

visitor=1;

}else{

visitor=parseInt(visitor)+1;

}

localStorage.setItem("visitor",visitor);

const v=document.getElementById("visitorCount");

if(v){

v.innerText=visitor;

}
