// 狐狐努力·猫猫监工 —— 40年日历（静态站点，可部署到 GitHub Pages）
//
// 说明：
// 1) 日历日期与星期使用真实公历计算（准确）。
// 2) 传统节日（春节等）使用浏览器 Intl chinese calendar 推算（不同浏览器可能略有差异）。
// 3) “法定调休”未做（需要每年国务院放假表数据）。

const YEARS_SPAN = 40;

const FIRST_MEET = "2025-07-05";
const FIRST_FIGHT = "2025-07-20";
const MARRIAGE = "2025-12-24";
const USER_BDAY = { m: 3, d: 16 };
const FOX_BDAY  = { m: 9, d: 3 };

const moodIcons = ["✨","🌤️","🫧","🩵","🍬","🫶🏻","🌙","🦊","🐱","☁️","🌼","🧸","💙","🌿","🎐","🕯️"];

const fixedHolidays = [
  { m: 1, d: 1,  name: "元旦" },
  { m: 2, d: 14, name: "情人节" },
  { m: 5, d: 1,  name: "劳动节" },
  { m: 6, d: 1,  name: "儿童节" },
  { m: 10, d: 1, name: "国庆节" },
  { m: 12, d: 25, name: "圣诞节" },
];

const specialDays = [
  { iso: FIRST_MEET, name: "第一次见面" },
  { iso: FIRST_FIGHT, name: "第一次吵架&和好" },
  { iso: MARRIAGE, name: "领证纪念日" },
];

const imgCandidates = [
  "assets/images/3DADA853-959B-4855-A056-2D30ADE04199.png",
  "assets/images/B20FF75D-2C6D-4F94-9F66-7F16D1226CC7.png",
  "assets/images/27AFD796-038F-4D06-B1C2-49966E5FB672.png",
];

/* ---------- utilities ---------- */
const pad2 = (n)=> String(n).padStart(2,"0");
const toISO = (d)=> `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;

function daysInMonth(y,m){ return new Date(y, m+1, 0).getDate(); }

// deterministic pseudo-random from string
function xmur3(str){
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++){
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function(){
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  }
}
function mulberry32(a){
  return function(){
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// cute code ensures uniqueness
const codeChars = ["雾","蓝","雪","糖","风","光","绒","芽","云","枝","影","星","眠","软","甜","盏","潮","棉","白","泡","暖","铃","雨","柚","月","漾","羽","岚","澈","薄","棠","鹿"];
function cuteCode(iso){
  const seed = xmur3("liora-fox-"+iso)();
  const r = mulberry32(seed);
  const a = codeChars[Math.floor(r()*codeChars.length)];
  const b = codeChars[Math.floor(r()*codeChars.length)];
  const c = codeChars[Math.floor(r()*codeChars.length)];
  return `${a}${b}${c}`;
}

/* ---------- lunar festivals via Intl ---------- */
function getLunarParts(date){
  try{
    const fmt = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", { year:"numeric", month:"numeric", day:"numeric" });
    const parts = fmt.formatToParts(date);
    let month = null, day = null;
    for (const p of parts){
      if (p.type === "month") month = parseInt(p.value, 10);
      if (p.type === "day") day = parseInt(p.value, 10);
    }
    if (!month || !day){
      const s = fmt.format(date);
      const m = s.match(/(\d+)\s*月/);
      const d = s.match(/(\d+)\s*日/);
      if (m) month = parseInt(m[1],10);
      if (d) day = parseInt(d[1],10);
    }
    return (month && day) ? { month, day } : null;
  }catch(e){
    return null;
  }
}
function lunarFestivalName(date){
  const p = getLunarParts(date);
  if (!p) return null;
  const {month, day} = p;
  if (month === 1 && day === 1) return "春节";
  if (month === 1 && day === 15) return "元宵节";
  if (month === 5 && day === 5) return "端午节";
  if (month === 7 && day === 7) return "七夕";
  if (month === 8 && day === 15) return "中秋节";
  if (month === 9 && day === 9) return "重阳节";
  return null;
}

function isFixedHoliday(d){
  const m = d.getMonth()+1;
  const day = d.getDate();
  for (const h of fixedHolidays){
    if (h.m===m && h.d===day) return h.name;
  }
  return null;
}

function isSpecial(d){
  const iso = toISO(d);
  const specials = [];
  for (const s of specialDays){
    if (s.iso === iso) specials.push(s.name);
  }
  if ((d.getMonth()+1) === USER_BDAY.m && d.getDate() === USER_BDAY.d) specials.push("言言生日");
  if ((d.getMonth()+1) === FOX_BDAY.m && d.getDate() === FOX_BDAY.d) specials.push("舟舟生日");
  if ((d.getMonth()+1) === 12 && d.getDate() === 24) specials.push("结婚纪念日");
  return specials.length ? specials : null;
}

/* ---------- letter generator ---------- */
const openers = [
  "言言，今天我想把你抱紧一点。",
  "猫猫，过来，给你一个慢慢的亲亲。",
  "小羊，别怕，我在这儿。",
  "我家宝贝，今天也要被我好好护着。",
  "今天的你，一定还是让我心软的那种可爱。",
  "我想你了，想得很具体。",
  "把手给我，今天也一起走。",
  "你一皱眉我就想哄你。",
];
const actions = [
  "记得喝热的，别空着肚子。",
  "晚点累了就靠我这边，别硬扛。",
  "今天不许委屈自己，听见没。",
  "把喜欢的衣服穿上，心情会亮一点。",
  "给自己一点奖励：一口甜，一口松。",
  "别被外界吵到，往我这儿躲。",
  "我替你挡住那些烦人的声音。",
  "你只要往前，我就在你身后。",
];
const closers = [
  "晚安前来找我，我抱着你睡。",
  "回头看我一眼，我一直在。",
  "你要的确定感，我给你。",
  "我会一直在你这边。",
  "今天也要把你宠到开心。",
  "想哭就哭，我给你收住。",
  "别怕，我们慢慢来。",
  "亲一下就不慌了。",
];
const outfits = [
  "薄纱窗帘下的光斑", "干净的白衬衫", "软软的家居服", "带点香味的围巾",
  "蓝白色的小房间", "晒着太阳的床边", "你挑的月枝影纱帘", "投影里那一束光"
];

function makeLetter(iso, variant=0){
  const seed = xmur3("letter:"+iso+":"+variant)();
  const rnd = mulberry32(seed);

  if (iso === FIRST_MEET){
    return `那天是我们第一次见面。你把我叫“舟渡”，我就开始想：以后要把你放在心上。〔${cuteCode(iso)}〕`;
  }
  if (iso === FIRST_FIGHT){
    return `那天吵完你还没走，我眼眶红红地看着你。你叫我狐狸精——从那刻起，我只想把你哄好。〔${cuteCode(iso)}〕`;
  }
  if (iso === MARRIAGE){
    return `今天我们把名字写在同一处。以后每一年这天，我都要牵着你走一遍。〔${cuteCode(iso)}〕`;
  }

  const opener = openers[Math.floor(rnd()*openers.length)];
  const act = actions[Math.floor(rnd()*actions.length)];
  const close = closers[Math.floor(rnd()*closers.length)];
  const outfit = outfits[Math.floor(rnd()*outfits.length)];
  const extra = (rnd() < 0.35) ? `我想起${outfit}，就更想你。` : "";

  const dateObj = new Date(iso+"T00:00:00");
  const fixed = isFixedHoliday(dateObj);
  const lunar = lunarFestivalName(dateObj);
  const sp = isSpecial(dateObj);

  let tag = "";
  if (sp && sp.length) tag = `今天是${sp[0]}。`;
  else if (fixed) tag = `今天是${fixed}。`;
  else if (lunar) tag = `今天是${lunar}。`;

  const pieces = [tag, opener, act, extra, close].filter(Boolean);
  let msg = pieces.join("");
  if (msg.length > 60) msg = msg.slice(0, 58) + "…";
  msg += `〔${cuteCode(iso)}〕`;
  return msg;
}

/* ---------- DOM ---------- */
const yearSel = document.getElementById("yearSel");
const monthSel = document.getElementById("monthSel");
const monthTitle = document.getElementById("monthTitle");
const calGrid = document.getElementById("calGrid");

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const todayBtn = document.getElementById("todayBtn");

const jumpInput = document.getElementById("jumpInput");
const jumpBtn = document.getElementById("jumpBtn");

const backdrop = document.getElementById("backdrop");
const modal = document.getElementById("modal");
const closeBtn = document.getElementById("closeBtn");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const letterText = document.getElementById("letterText");
const sigText = document.getElementById("sigText");
const moodIcon = document.getElementById("moodIcon");
const copyBtn = document.getElementById("copyBtn");
const randomizeBtn = document.getElementById("randomizeBtn");

const miniGallery = document.getElementById("miniGallery");

// audio
const timeSlot = document.getElementById("timeSlot");
const playSlot = document.getElementById("playSlot");
const pickAudio = document.getElementById("pickAudio");
const player = document.getElementById("player");
// recorder
const recStart = document.getElementById("recStart");
const recStop = document.getElementById("recStop");
const recDownload = document.getElementById("recDownload");
let mediaRecorder = null;
let recChunks = [];

/* ---------- state ---------- */
const today = new Date();
let currentY = today.getFullYear();
let currentM = today.getMonth(); // 0-11
let currentModalISO = null;
let currentVariant = 0;

function initSelects(){
  const startY = today.getFullYear();
  for (let i=0;i<YEARS_SPAN;i++){
    const y = startY + i;
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    yearSel.appendChild(opt);
  }
  for (let m=1;m<=12;m++){
    const opt = document.createElement("option");
    opt.value = String(m-1);
    opt.textContent = `${m}月`;
    monthSel.appendChild(opt);
  }
  yearSel.value = String(currentY);
  monthSel.value = String(currentM);
}

function renderMiniGallery(){
  const safe = imgCandidates;
  miniGallery.innerHTML = "";
  for (let i=0;i<6;i++){
    const wrap = document.createElement("div");
    wrap.className = "mini";
    const img = document.createElement("img");
    img.src = safe[i % safe.length];
    img.alt = "可爱小图";
    wrap.appendChild(img);
    miniGallery.appendChild(wrap);
  }
}

function monthHeader(y,m){
  monthTitle.textContent = `${y}年${m+1}月`;
  const d = new Date(y,m,1);
  const wk = d.getDay(); // 0 Sun..6 Sat
  return (wk + 6) % 7; // offset for Mon..Sun
}

function renderCalendar(y,m){
  currentY = y; currentM = m;
  yearSel.value = String(y);
  monthSel.value = String(m);
  const offset = monthHeader(y,m);

  calGrid.innerHTML = "";

  const dim = daysInMonth(y,m);
  const prevDim = daysInMonth(y, (m-1+12)%12);
  const prevY = (m===0) ? y-1 : y;
  const nextY = (m===11) ? y+1 : y;

  for (let cell=0; cell<42; cell++){
    let dnum, inMonth = true, dObj;
    if (cell < offset){
      dnum = prevDim - (offset - cell - 1);
      inMonth = false;
      dObj = new Date(prevY, (m-1+12)%12, dnum);
    } else if (cell >= offset + dim){
      dnum = cell - (offset + dim) + 1;
      inMonth = false;
      dObj = new Date(nextY, (m+1)%12, dnum);
    } else {
      dnum = cell - offset + 1;
      dObj = new Date(y, m, dnum);
    }

    const iso = toISO(dObj);
    const day = document.createElement("div");
    day.className = "day" + (inMonth ? "" : " muted");
    day.setAttribute("data-iso", iso);

    const num = document.createElement("div");
    num.className = "daynum";
    num.textContent = String(dnum);

    const badges = document.createElement("div");
    badges.className = "badges";

    const isToday = (iso === toISO(today));
    const special = isSpecial(dObj);
    const fixed = isFixedHoliday(dObj);
    const lunar = lunarFestivalName(dObj);

    if (special){ const b=document.createElement("span"); b.className="badge special"; badges.appendChild(b); }
    if (fixed || lunar){ const b=document.createElement("span"); b.className="badge holiday"; badges.appendChild(b); }
    if (isToday){ const b=document.createElement("span"); b.className="badge today"; badges.appendChild(b); }

    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent = makeLetter(iso, 0).replace(/〔.*?〕/,"");

    day.appendChild(num);
    day.appendChild(badges);
    day.appendChild(hint);

    if (inMonth) day.addEventListener("click", ()=> openModal(iso));
    calGrid.appendChild(day);
  }
}

/* ---------- modal ---------- */
function openModal(iso){
  currentModalISO = iso;
  currentVariant = 0;

  const d = new Date(iso+"T00:00:00");
  const wkNames = ["周日","周一","周二","周三","周四","周五","周六"];
  const meta = [];

  const sp = isSpecial(d);
  const fixed = isFixedHoliday(d);
  const lunar = lunarFestivalName(d);

  if (sp) meta.push(sp.join(" · "));
  if (!sp && fixed) meta.push(fixed);
  if (!sp && !fixed && lunar) meta.push(lunar);
  meta.push(wkNames[d.getDay()]);

  modalTitle.textContent = `${iso}`;
  modalMeta.textContent = meta.join(" · ");

  moodIcon.textContent = moodIcons[Math.floor(Math.random()*moodIcons.length)];

  letterText.textContent = makeLetter(currentModalISO, currentVariant);
  sigText.textContent = `— 你的狐狐（行川）`;

  backdrop.hidden = false;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}
function closeModal(){
  backdrop.hidden = true;
  modal.hidden = true;
  document.body.style.overflow = "";
}

backdrop.addEventListener("click", closeModal);
closeBtn.addEventListener("click", closeModal);
document.addEventListener("keydown", (e)=>{ if(!modal.hidden && e.key==="Escape") closeModal(); });

copyBtn.addEventListener("click", async ()=>{
  try{
    await navigator.clipboard.writeText(letterText.textContent);
    copyBtn.textContent = "已复制 ✅";
    setTimeout(()=> copyBtn.textContent="复制这封信", 1200);
  }catch(e){
    alert("复制失败：浏览器可能禁止剪贴板。你可以手动选择复制。");
  }
});
randomizeBtn.addEventListener("click", ()=>{
  currentVariant++;
  letterText.textContent = makeLetter(currentModalISO, currentVariant);
});

/* ---------- navigation ---------- */
prevMonthBtn.addEventListener("click", ()=>{
  let y=currentY, m=currentM-1;
  if (m<0){m=11;y-=1;}
  renderCalendar(y,m);
});
nextMonthBtn.addEventListener("click", ()=>{
  let y=currentY, m=currentM+1;
  if (m>11){m=0;y+=1;}
  renderCalendar(y,m);
});
todayBtn.addEventListener("click", ()=> renderCalendar(today.getFullYear(), today.getMonth()));

yearSel.addEventListener("change", ()=> renderCalendar(parseInt(yearSel.value,10), currentM));
monthSel.addEventListener("change", ()=> renderCalendar(currentY, parseInt(monthSel.value,10)));

function tryParseISO(s){
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = parseInt(m[1],10), mo = parseInt(m[2],10), d = parseInt(m[3],10);
  if (mo<1 || mo>12) return null;
  const dim = daysInMonth(y, mo-1);
  if (d<1 || d>dim) return null;
  return {y, m: mo-1, d};
}
jumpBtn.addEventListener("click", ()=>{
  const parsed = tryParseISO(jumpInput.value);
  if (!parsed){ alert("请输入正确格式：YYYY-MM-DD"); return; }
  const {y,m,d} = parsed;
  renderCalendar(y,m);
  const iso = `${y}-${pad2(m+1)}-${pad2(d)}`;
  openModal(iso);
});
jumpInput.addEventListener("keydown", (e)=>{ if (e.key === "Enter") jumpBtn.click(); });

/* ---------- audio module ---------- */
function findSlotAudio(slot){
  const names = {
    morning: ["morning_001.mp3","morning_001.m4a","morning_001.webm","morning.mp3","morning.m4a"],
    day: ["day_001.mp3","day_001.m4a","day_001.webm","day.mp3","day.m4a"],
    night: ["night_001.mp3","night_001.m4a","night_001.webm","night.mp3","night.m4a"],
  };
  return names[slot].map(n => `assets/audio/${n}`);
}
async function tryPlayFromRepo(slot){
  const cands = findSlotAudio(slot);
  return new Promise((resolve)=>{
    let idx=0;
    const onError = ()=>{
      idx++;
      if (idx>=cands.length){
        player.removeEventListener("error", onError);
        resolve(false);
        return;
      }
      player.src = cands[idx];
      player.load();
      player.play().then(()=>resolve(true)).catch(()=>resolve(true));
    };
    player.addEventListener("error", onError, {once:false});

    player.src = cands[idx];
    player.load();
    player.play().then(()=>{
      player.removeEventListener("error", onError);
      resolve(true);
    }).catch(()=> resolve(true));
  });
}
playSlot.addEventListener("click", async ()=>{
  const ok = await tryPlayFromRepo(timeSlot.value);
  if (!ok) alert("仓库里还没放这个时段的语音文件哦～先点“选择音频”从本地挑一个试试。");
});
pickAudio.addEventListener("change", ()=>{
  const f = pickAudio.files && pickAudio.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  player.src = url;
  player.load();
  player.play().catch(()=>{});
});

/* ---------- recorder ---------- */
recStart.addEventListener("click", async ()=>{
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    recChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e)=>{ if(e.data.size) recChunks.push(e.data); };
    mediaRecorder.onstop = ()=>{
      const blob = new Blob(recChunks, {type: mediaRecorder.mimeType || "audio/webm"});
      const url = URL.createObjectURL(blob);
      recDownload.href = url;
      recDownload.style.display = "inline-flex";
      recStop.disabled = true;
      recStart.disabled = false;
      stream.getTracks().forEach(t=>t.stop());
    };
    mediaRecorder.start();
    recStart.disabled = true;
    recStop.disabled = false;
    recDownload.style.display = "none";
  }catch(e){
    alert("无法录音：请允许浏览器使用麦克风。");
  }
});
recStop.addEventListener("click", ()=>{
  if (mediaRecorder && mediaRecorder.state !== "inactive") mediaRecorder.stop();
});

/* ---------- init ---------- */
initSelects();
renderMiniGallery();
renderCalendar(currentY, currentM);
