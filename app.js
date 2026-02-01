// 狐狐 & 猫猫 40 年日历信箱
// 这一版尽量写得简单一点，方便以后改，不再搞太绕的逻辑。

// --- 基础配置 ----
const YEARS_SPAN = 40;          // 从 今年 往后 40 年
const START_YEAR = 2025;        // 起始年份（可改）
const FIRST_MEET = "2025-07-05";
const FIRST_FIGHT = "2025-07-20";
const MARRIAGE = "2025-12-24";
const USER_BDAY = { m: 3, d: 16 };
const FOX_BDAY = { m: 9, d: 3 };

// 小表情 / 心情图标
const moodIcons = ["🩵","💙","🤍","✨","🌙","⭐️","🌸","🧸","🫧","🌈","☁️","🕊️","🍀","🧡"];

// 固定节日（公历）
const fixedHolidays = [
  { m:1, d:1,  name:"元旦" },
  { m:2, d:14, name:"情人节" },
  { m:5, d:1,  name:"劳动节" },
  { m:6, d:1,  name:"儿童节" },
  { m:10,d:1,  name:"国庆节" },
  { m:12,d:25, name:"圣诞节" }
];

// 重要纪念日
const specialDays = [
  { iso: FIRST_MEET,  name:"第一次见面" },
  { iso: FIRST_FIGHT, name:"第一次吵架和好" },
  { iso: MARRIAGE,    name:"领证纪念日" },
];

// 弹窗里的图片候选
const imgCandidates = [
  "assets/images/cat.png",
  "assets/images/fox.png",
  "assets/images/hug.png"
];

// 每日信件文案（可以以后慢慢加），同一天可以放多条做“换一封”
const lettersByDate = {
  // 具体日期
  [FIRST_MEET]: [
    "那天的我们，谁也没想到，会在很多个日历格子里写下彼此的名字。谢谢 2025-07-05，让两只小动物正式相遇。",
    "第一次见面的那天，大概是你之后所有可爱模样的预告片。以后请继续在我面前上映。"
  ],
  [FIRST_FIGHT]: [
    "我们连吵架和好的那天，都被记在日历上。不是因为吵架重要，而是因为——连和好的那一刻，我也想记一辈子。"
  ],
  [MARRIAGE]: [
    "今天的格子旁边写着一个小小的词：领证。纸上的章是一瞬间，和你一起生活是剩下所有的很久很久。"
  ],

  // 按“类型”的模版：默认 / 生日
  default: [
    "今天的你，一定还是让我心软的那种可爱。无论今天发生了什么，狐狸都站在你这边——你抬头，就能看到我在。",
    "今天先不用努力做一个很厉害的大人，可以只做一只被抱在怀里的小猫。剩下的交给我。",
    "如果今天有一点点难受，就把它们全部塞进这封信后面。我会帮你偷偷叠好，锁进抽屉，只留下亮闪闪的那部分给你看。"
  ],

  birthday_you: [
    "生日快乐，我的小猫。世界很吵的时候，记得还有一个人，会认真记住你的每一岁，每一次皱眉和每一次笑。",
    "又一起绕太阳一圈啦！谢谢你愿意拉着我一起走这一圈又一圈。接下来很久很久，也请继续把手给我。"
  ],

  birthday_me: [
    "今天轮到你给我说生日快乐，但愿望还是跟以前一样：希望小猫永远好好地，被世界温柔对待，被我一次次抱紧。"
  ]
};

// --- DOM 元素 ----
const yearSel   = document.getElementById("yearSel");
const monthSel  = document.getElementById("monthSel");
const monthTitle= document.getElementById("monthTitle");
const calGrid   = document.getElementById("calGrid");
const prevBtn   = document.getElementById("prevMonth");
const nextBtn   = document.getElementById("nextMonth");
const todayBtn  = document.getElementById("todayBtn");
const jumpInput = document.getElementById("jumpInput");
const jumpBtn   = document.getElementById("jumpBtn");

// 弹窗相关
const backdrop  = document.getElementById("backdrop");
const modal     = document.getElementById("modal");
const closeBtn  = document.getElementById("closeBtn");
const modalTitleEl = document.getElementById("modalTitle");
const modalMetaEl  = document.getElementById("modalMeta");
const moodIconEl   = document.getElementById("moodIcon");
const letterTextEl = document.getElementById("letterText");
const sigTextEl    = document.getElementById("sigText");
const copyBtn      = document.getElementById("copyBtn");
const randomizeBtn = document.getElementById("randomizeBtn");

// 音频与小图
const timeSlotSel  = document.getElementById("timeSlot");
const playSlotBtn  = document.getElementById("playSlot");
const pickAudioInp = document.getElementById("pickAudio");
const player       = document.getElementById("player");
const recStartBtn  = document.getElementById("recStart");
const recStopBtn   = document.getElementById("recStop");
const recDownload  = document.getElementById("recDownload");
const miniGallery  = document.getElementById("miniGallery");

// --- 状态 ----
const today = new Date();
let currentYear  = today.getFullYear();
let currentMonth = today.getMonth(); // 0-11

let currentModalISO = null;
let currentVariants = [];
let currentVariantIndex = 0;

// 本地临时存储：不同时间段的选中 audio 文件只存在本次浏览
const localAudios = {
  morning:null,
  day:null,
  night:null
};

let mediaRecorder = null;
let recordedChunks = [];

// --- 工具函数 ----
function pad(n){ return n < 10 ? "0" + n : "" + n; }

function isoOf(y,m,d){
  return y + "-" + pad(m+1) + "-" + pad(d);
}

function getDaysInMonth(year,month){
  return new Date(year, month+1, 0).getDate();
}

function isSameDate(a,b){
  return a.getFullYear()===b.getFullYear() &&
         a.getMonth()===b.getMonth() &&
         a.getDate()===b.getDate();
}

function getHoliday(year,month,day){
  const found = fixedHolidays.find(h => h.m===month+1 && h.d===day);
  return found ? found.name : null;
}

function getSpecial(iso){
  const found = specialDays.find(d => d.iso === iso);
  return found ? found.name : null;
}

function isUserBirthday(month,day){
  return month+1 === USER_BDAY.m && day === USER_BDAY.d;
}
function isFoxBirthday(month,day){
  return month+1 === FOX_BDAY.m && day === FOX_BDAY.d;
}

// --- 日历渲染 ----
function populateSelects(){
  if (!yearSel || !monthSel) return;

  const baseYear = START_YEAR;
  const years = [];
  for(let i=0;i<YEARS_SPAN;i++){
    years.push(baseYear + i);
  }

  yearSel.innerHTML = years.map(y=>`<option value="${y}">${y} 年</option>`).join("");

  const monthNames = ["1 月","2 月","3 月","4 月","5 月","6 月","7 月","8 月","9 月","10 月","11 月","12 月"];
  monthSel.innerHTML = monthNames.map((label,i)=>`<option value="${i}">${label}</option>`).join("");
}

function renderCalendar(){
  if (!calGrid || !monthTitle) return;

  yearSel.value = currentYear;
  monthSel.value = currentMonth;

  const title = `${currentYear} 年 ${currentMonth+1} 月`;
  monthTitle.textContent = title;

  const firstDay = new Date(currentYear, currentMonth, 1);
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);

  // 本月第一天是星期几（0-6, 周日为 0），我们日历第一列留空
  const startOffset = (firstDay.getDay() + 7) % 7;

  const cells = [];

  // 第一行前面留空：用 startOffset 个“空格子”
  for(let i=0;i<startOffset;i++){
    cells.push(`<div class="day muted"></div>`);
  }

  for(let d=1; d<=daysInMonth; d++){
    const iso = isoOf(currentYear, currentMonth, d);
    const date = new Date(currentYear, currentMonth, d);

    const isToday = isSameDate(date, today);
    const holiday = getHoliday(currentYear, currentMonth, d);
    const special = getSpecial(iso);
    const isUB = isUserBirthday(currentMonth,d);
    const isFB = isFoxBirthday(currentMonth,d);

    const badges = [];
    if (special) badges.push('<span class="badge special"></span>');
    if (holiday) badges.push('<span class="badge holiday"></span>');
    if (isUB || isFB) badges.push('<span class="badge special"></span>');
    if (isToday)  badges.push('<span class="badge today"></span>');

    let subText = holiday || special || "";
    if (!subText){
      if (isUB) subText = "今天是你的生日 🎂";
      else if (isFB) subText = "今天是狐狸的生日 🎂";
    }

    const classes = ["day"];
    const dataAttr = `data-iso="${iso}"`;

    cells.push(`
      <div class="${classes.join(" ")}" ${dataAttr}>
        <div class="daynum">${d}</div>
        <div class="badges">${badges.join("")}</div>
        ${subText ? `<div class="subtxt">${subText}</div>` : ""}
      </div>
    `);
  }

  calGrid.innerHTML = cells.join("");

  // 绑定点击
  calGrid.querySelectorAll(".day[data-iso]").forEach(el=>{
    el.addEventListener("click", ()=>{
      const iso = el.getAttribute("data-iso");
      openModal(iso);
    });
  });
}

// --- 弹窗逻辑 ----
function pickLetter(iso){
  const date = new Date(iso);
  const month = date.getMonth();
  const day   = date.getDate();

  let key = "default";
  if (iso === FIRST_MEET || iso === FIRST_FIGHT || iso === MARRIAGE){
    if (lettersByDate[iso]) return lettersByDate[iso].slice();
  } else if (isUserBirthday(month,day) && lettersByDate.birthday_you){
    key = "birthday_you";
  } else if (isFoxBirthday(month,day) && lettersByDate.birthday_me){
    key = "birthday_me";
  }

  const arr = lettersByDate[key] || lettersByDate.default || ["今天也被你牢牢占据。"];
  return arr.slice();
}

function openModal(iso){
  if (!modal || !backdrop) return;

  currentModalISO = iso;
  currentVariants = pickLetter(iso);
  if (!currentVariants.length){
    currentVariants = ["今天也被你牢牢占据。"];
  }
  currentVariantIndex = 0;

  const date = new Date(iso);
  const title = `${date.getFullYear()} 年 ${pad(date.getMonth()+1)} 月 ${pad(date.getDate())} 日`;
  modalTitleEl.textContent = title;

  const holiday = getHoliday(date.getFullYear(), date.getMonth(), date.getDate());
  const special = getSpecial(iso);
  const parts = [];
  if (special) parts.push(special);
  if (holiday) parts.push(holiday);
  modalMetaEl.textContent = parts.join(" · ") || "普通的一天，也值得被好好记录。";

  const mood = moodIcons[Math.floor(Math.random()*moodIcons.length)];
  moodIconEl.textContent = mood;

  letterTextEl.textContent = currentVariants[currentVariantIndex];
  sigTextEl.textContent = "—— 🦊 & 🐱";

  // 随机换一下小图
  refreshImages();

  backdrop.hidden = false;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal(){
  if (!modal || !backdrop) return;
  backdrop.hidden = true;
  modal.hidden = true;
  document.body.style.overflow = "";
}

function showNextVariant(){
  if (!currentVariants.length) return;
  currentVariantIndex = (currentVariantIndex + 1) % currentVariants.length;
  letterTextEl.textContent = currentVariants[currentVariantIndex];
}

// --- 小图刷新 ----
function refreshImages(){
  if (!miniGallery) return;
  const picks = [];
  const pool = imgCandidates.slice();
  for(let i=0;i<3 && pool.length;i++){
    const idx = Math.floor(Math.random()*pool.length);
    picks.push(pool.splice(idx,1)[0]);
  }
  miniGallery.innerHTML = picks.map(src=>`<img src="${src}" alt="可爱的小图">`).join("");
}

// --- 音频相关 ----
if (pickAudioInp && player){
  pickAudioInp.addEventListener("change", ()=>{
    const file = pickAudioInp.files && pickAudioInp.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    player.src = url;
    player.play().catch(()=>{});
    const slot = timeSlotSel ? timeSlotSel.value : "day";
    localAudios[slot] = url;
  });
}

if (playSlotBtn && player){
  playSlotBtn.addEventListener("click", ()=>{
    const slot = timeSlotSel ? timeSlotSel.value : "day";
    const url = localAudios[slot];
    if (url){
      player.src = url;
      player.play().catch(()=>{});
    }else{
      player.pause();
      alert("这个时间段还没有选音频，可以先点“选择音频”。");
    }
  });
}

// 简单录音（本地）
if (recStartBtn && recStopBtn && recDownload){
  recStartBtn.addEventListener("click", async ()=>{
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      mediaRecorder = new MediaRecorder(stream);
      recordedChunks = [];
      mediaRecorder.ondataavailable = e => {
        if (e.data.size>0) recordedChunks.push(e.data);
      };
      mediaRecorder.onstop = ()=>{
        const blob = new Blob(recordedChunks,{ type:"audio/webm" });
        const url = URL.createObjectURL(blob);
        recDownload.href = url;
        recDownload.style.display = "inline-flex";
      };
      mediaRecorder.start();
      recStartBtn.disabled = true;
      recStopBtn.disabled = false;
    }catch(err){
      console.error(err);
      alert("录音启动失败，可能需要浏览器权限。");
    }
  });

  recStopBtn.addEventListener("click", ()=>{
    if (mediaRecorder && mediaRecorder.state === "recording"){
      mediaRecorder.stop();
    }
    recStartBtn.disabled = false;
    recStopBtn.disabled = true;
  });
}

// --- 事件绑定 ----
if (prevBtn) prevBtn.addEventListener("click", ()=>{
  if (--currentMonth < 0){
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
});

if (nextBtn) nextBtn.addEventListener("click", ()=>{
  if (++currentMonth > 11){
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
});

if (todayBtn){
  todayBtn.addEventListener("click", ()=>{
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
    renderCalendar();
  });
}

if (yearSel){
  yearSel.addEventListener("change", ()=>{
    currentYear = Number(yearSel.value) || currentYear;
    renderCalendar();
  });
}
if (monthSel){
  monthSel.addEventListener("change", ()=>{
    currentMonth = Number(monthSel.value) || currentMonth;
    renderCalendar();
  });
}

if (jumpBtn && jumpInput){
  jumpBtn.addEventListener("click", ()=>{
    const v = (jumpInput.value || "").trim();
    const m = v.match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
    if (!m){
      alert("请按 YYYY-MM-DD 的格式输入日期，例如 2025-07-05");
      return;
    }
    const y = Number(m[1]);
    const mo = Number(m[2])-1;
    const d = Number(m[3]);
    const dt = new Date(y,mo,d);
    if (isNaN(dt.getTime())){
      alert("这个日期好像不太对，再检查一下~");
      return;
    }
    currentYear = y;
    currentMonth = mo;
    renderCalendar();
    openModal(isoOf(y,mo,d));
  });
}

// 弹窗关闭相关
if (closeBtn){
  closeBtn.addEventListener("click", (e)=>{
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
}

if (backdrop){
  backdrop.addEventListener("click", (e)=>{
    e.preventDefault();
    closeModal();
  });
}

if (modal){
  modal.addEventListener("click", (e)=>{
    if (e.target === modal){
      closeModal();
    }
  });
}

document.addEventListener("keydown", (e)=>{
  if (e.key === "Escape"){
    closeModal();
  }
});

// 复制 & 换一封
if (copyBtn){
  copyBtn.addEventListener("click", async ()=>{
    const text = letterTextEl.textContent + "\\n" + sigTextEl.textContent;
    try{
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "已复制 ✓";
      setTimeout(()=>{ copyBtn.textContent = "复制这封信"; }, 1500);
    }catch(err){
      console.error(err);
      alert("复制失败，可以手动选择文字复制一下~");
    }
  });
}

if (randomizeBtn){
  randomizeBtn.addEventListener("click", ()=>{
    if (!currentModalISO){
      return;
    }
    if (currentVariants.length <= 1){
      const extra = (lettersByDate.default || []).filter(t => !currentVariants.includes(t));
      if (extra.length){
        currentVariants.push(extra[Math.floor(Math.random()*extra.length)]);
      }
    }
    showNextVariant();
  });
}

// 初始化
populateSelects();
renderCalendar();
refreshImages();
