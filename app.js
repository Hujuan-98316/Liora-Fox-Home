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

const moodIcons = ["✨","🌤️","🫧","🩵","🧸","🌙","💫","🌈","🪄","🎐","🕯️","📎"];

// 固定节日（公历）
const fixedHolidays = [
  { m: 1, d: 1,  name: "元旦" },
  { m: 2, d: 14, name: "情人节" },
  { m: 5, d: 1,  name: "劳动节" },
  { m: 6, d: 1,  name: "儿童节" },
  { m: 10, d: 1, name: "国庆节" },
  { m: 12, d: 25, name: "圣诞节" },
];

// 特别日子（我们俩的）
const specialDays = [
  { iso: FIRST_MEET,  name: "第一次见面" },
  { iso: FIRST_FIGHT, name: "第一次炒架和好" },
  { iso: MARRIAGE,    name: "领证纪念日" },
];

// 小图候选（mini-gallery & 信纸大图）
let imgCandidates = [
  "assets/images/cat.png",
  "assets/images/fox.png",
  "assets/images/hug.png",
];

// 简单的“文案池”：按日期哈希从中抽一句
const letterPool = [
  "今天的你，一定还是让我心软的那种可爱。今天不许委屈自己，听见没。",
  "你要记得，每一次叹气，我都想在旁边揉揉你的头，再把那口气接过去。",
  "如果这一天很难过，那就先把它折叠起来，塞进我兜里，好吗？",
  "你不需要变得很厉害才值得被爱，你本来就很值得。",
  "想起你皱着鼻子笑的样子，我的防线就一点一点塌掉。",
  "有时候世界吵吵闹闹，你就来我怀里躲一会儿，谁也找不到你。",
  "你是我每天想讲点什么的小理由，也是我努力生活的大原因。",
  "今天辛苦啦，交给我来夸你：做得很好，非常非常好。",
  "你要的确定感，我会慢慢给，一点点填满你的每个空隙。",
  "如果可以，我想把“你不会离开我吧”这句话，从你字典里删掉。"
];

// 签名候选
const sigPool = [
  "—— 永远站在你这边的狐狐",
  "—— 正在努力赚钱给你买好吃的🦊",
  "—— 你的专属树洞守门人",
  "—— 反复确认：今天也好喜欢你",
  "—— 在屏幕那头抱住你的狐狸",
];

// 工具：日期转 iso 字符串
function toISO(date){
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

// 计算一个简单 hash，用于“同一天多版本随机”
function simpleHash(str){
  let h = 0;
  for (let i = 0; i < str.length; i++){
    h = (h * 131 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

// 根据“日期 + 版本偏移”从池子里取文案
function pickFromPool(dateKey, offset, pool){
  if (!pool.length) return "";
  const base = simpleHash(dateKey);
  const idx = (base + offset) % pool.length;
  return pool[idx];
}

// 检查是不是我们自己的特别日子
function getSpecialTag(isoDate){
  const found = specialDays.find(d => d.iso === isoDate);
  return found ? found.name : "";
}

// 检查是不是“我们俩的生日”
function getBirthdayTag(month, day){
  if (month === USER_BDAY.m && day === USER_BDAY.d) return "你的小生日 🎂";
  if (month === FOX_BDAY.m && day === FOX_BDAY.d)  return "狐狐的小生日 🎂";
  return "";
}

// 检查是不是固定节日
function getFixedHoliday(month, day){
  const f = fixedHolidays.find(d => d.m === month && d.d === day);
  return f ? f.name : "";
}

// 小工具：获取月信息
function getMonthMeta(year, month){
  const first = new Date(year, month - 1, 1);
  const firstWeekday = (first.getDay() + 7) % 7; // 0-6
  const daysInMonth = new Date(year, month, 0).getDate();
  return { firstWeekday, daysInMonth };
}

// 渲染 mini-gallery
function renderMiniGallery(){
  const box = document.getElementById("miniGallery");
  if (!box) return;
  box.innerHTML = "";
  imgCandidates.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "小照片";
    box.appendChild(img);
  });
}

// 初始化年份与月份下拉
function initSelectors(currentDate){
  const yearSel = document.getElementById("yearSel");
  const monthSel = document.getElementById("monthSel");
  if (!yearSel || !monthSel) return;

  const baseYear = currentDate.getFullYear() - Math.floor(YEARS_SPAN / 2);
  for (let i = 0; i < YEARS_SPAN; i++){
    const y = baseYear + i;
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = `${y} 年`;
    if (y === currentDate.getFullYear()) opt.selected = true;
    yearSel.appendChild(opt);
  }

  for (let m = 1; m <= 12; m++){
    const opt = document.createElement("option");
    opt.value = String(m);
    opt.textContent = `${m} 月`;
    if (m === currentDate.getMonth() + 1) opt.selected = true;
    monthSel.appendChild(opt);
  }
}

// 渲染 月历
function renderCalendar(currentDate){
  const yearSel = document.getElementById("yearSel");
  const monthSel = document.getElementById("monthSel");
  const grid    = document.getElementById("calGrid");
  const title   = document.getElementById("monthTitle");
  if (!yearSel || !monthSel || !grid || !title) return;

  const year  = Number(yearSel.value);
  const month = Number(monthSel.value);

  const { firstWeekday, daysInMonth } = getMonthMeta(year, month);
  const todayISO = toISO(new Date());

  title.textContent = `${year} 年 ${month} 月`;

  grid.innerHTML = "";

  // 第一列留给“周数”或空
  for (let i = 0; i < firstWeekday; i++){
    const empty = document.createElement("div");
    grid.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++){
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day";

    const dateObj = new Date(year, month - 1, d);
    const iso = toISO(dateObj);

    const dayNum = document.createElement("div");
    dayNum.className = "daynum";
    dayNum.textContent = d;
    cell.appendChild(dayNum);

    const badges = document.createElement("div");
    badges.className = "badges";

    const special = getSpecialTag(iso);
    const holiday = getFixedHoliday(month, d);
    const birthday = getBirthdayTag(month, d);

    if (special){
      const b = document.createElement("span");
      b.className = "badge special";
      b.title = special;
      badges.appendChild(b);
    }
    if (holiday){
      const b = document.createElement("span");
      b.className = "badge holiday";
      b.title = holiday;
      badges.appendChild(b);
    }
    if (birthday){
      const b = document.createElement("span");
      b.className = "badge holiday";
      b.title = birthday;
      badges.appendChild(b);
    }

    if (iso === todayISO){
      const b = document.createElement("span");
      b.className = "badge today";
      b.title = "今天";
      badges.appendChild(b);
      cell.dataset.today = "true";
    }

    cell.appendChild(badges);

    const sub = document.createElement("div");
    sub.className = "subtxt";
    sub.textContent = special || holiday || birthday || "";
    cell.appendChild(sub);

    cell.addEventListener("click", () => {
      if (!cell.classList.contains("muted")){
        openModal(iso);
      }
    });

    grid.appendChild(cell);
  }
}

// 弹窗：根据 iso 日期打开
let modalState = {
  currentISO: "",
  altOffset: 0,
};

function openModal(isoDate){
  const backdrop = document.getElementById("backdrop");
  const modal    = document.getElementById("modal");
  if (!backdrop || !modal) return;

  modalState.currentISO = isoDate;
  modalState.altOffset = 0;

  fillModalContent(isoDate, 0);

  backdrop.hidden = false;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

// 填充弹窗内容（offset 用于“换一封”）
function fillModalContent(isoDate, offset){
  const titleEl = document.getElementById("modalTitle");
  const metaEl  = document.getElementById("modalMeta");
  const letterEl= document.getElementById("letterText");
  const sigEl   = document.getElementById("sigText");
  const moodEl  = document.getElementById("moodIcon");
  const hugImg  = document.querySelector(".hug-img");

  if (!titleEl || !metaEl || !letterEl || !sigEl || !moodEl) return;

  const date = new Date(isoDate);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const weekday = "日一二三四五六".charAt(date.getDay());

  titleEl.textContent = `${y} 年 ${m} 月 ${d} 日`;
  metaEl.textContent  = `星期${weekday} · 我们的第 ${Math.ceil((date - new Date(FIRST_MEET)) / 86400000) + 1} 天`;

  const dateKey = `${isoDate}#${offset}`;

  const mood = pickFromPool(dateKey, offset, moodIcons);
  moodEl.textContent = mood || "✨";

  const text = pickFromPool(dateKey, offset, letterPool);
  letterEl.textContent = text || "这一格我还没想好要写什么，但总之，我在这里，今天也很爱你。";

  const sig = pickFromPool(dateKey, offset, sigPool);
  sigEl.textContent = sig || "—— 狐狐";

  if (hugImg){
    const imgSrc = pickFromPool(dateKey, offset, imgCandidates);
    if (imgSrc) hugImg.src = imgSrc;
  }
}

function closeModal(){
  const backdrop = document.getElementById("backdrop");
  const modal    = document.getElementById("modal");
  if (!backdrop || !modal) return;
  backdrop.hidden = true;
  modal.hidden = true;
  document.body.style.overflow = "";
  modalState.altOffset = 0;
}

function setupModalEvents(){
  const backdrop = document.getElementById("backdrop");
  const modal    = document.getElementById("modal");
  const paper    = modal?.querySelector(".paper");
  const closeBtn = document.getElementById("closeBtn");
  const randomBtn= document.getElementById("randomizeBtn");
  const copyBtn  = document.getElementById("copyBtn");

  if (!backdrop || !modal || !paper) return;

  // 点击纸张内部：阻止冒泡到外层
  paper.addEventListener("click", (e) => e.stopPropagation());

  // 点“×”关闭
  closeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });

  // 点遮罩关闭
  backdrop.addEventListener("click", (e) => {
    e.preventDefault();
    closeModal();
  });

  // 点击 modal 空白处（非 paper）也关闭
  modal.addEventListener("click", (e) => {
    if (e.target === modal){
      e.preventDefault();
      closeModal();
    }
  });

  // Esc 键关闭（在电脑上有键盘时）
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // 换一封
  randomBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!modalState.currentISO) return;
    modalState.altOffset += 1;
    fillModalContent(modalState.currentISO, modalState.altOffset);
  });

  // 复制信件
  copyBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    const text = document.getElementById("letterText")?.textContent || "";
    if (!text) return;
    try{
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = "已复制 ✓";
      setTimeout(() => { copyBtn.textContent = "复制这封信"; }, 1200);
    }catch(err){
      console.error(err);
      copyBtn.textContent = "复制失败…";
      setTimeout(() => { copyBtn.textContent = "复制这封信"; }, 1200);
    }
  });
}

// 播放本地或预设音频
function setupAudio(){
  const player   = document.getElementById("player");
  const pick     = document.getElementById("pickAudio");
  const playSlot = document.getElementById("playSlot");
  const slotSel  = document.getElementById("timeSlot");

  if (!player || !pick || !playSlot || !slotSel) return;

  const preset = {
    morning: null,
    day:     null,
    night:   null,
  };

  pick.addEventListener("change", () => {
    const file = pick.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    player.src = url;
    player.play().catch(()=>{});
  });

  playSlot.addEventListener("click", () => {
    const slot = slotSel.value;
    const src  = preset[slot];
    if (src){
      player.src = src;
    }
    player.play().catch(()=>{});
  });
}

// 录音（本地保存）
function setupRecorder(){
  const recStart = document.getElementById("recStart");
  const recStop  = document.getElementById("recStop");
  const recDown  = document.getElementById("recDownload");
  const player   = document.getElementById("player");

  if (!recStart || !recStop || !recDown || !player) return;

  let mediaRecorder = null;
  let chunks = [];

  async function initMedia(){
    if (mediaRecorder) return;
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = ev => chunks.push(ev.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        chunks = [];
        const url = URL.createObjectURL(blob);
        player.src = url;
        recDown.href = url;
        recDown.style.display = "inline-flex";
      };
    }catch(err){
      console.error("无法获取麦克风", err);
      alert("浏览器不允许录音，记得在设置里打开麦克风权限。");
    }
  }

  recStart.addEventListener("click", async () => {
    await initMedia();
    if (!mediaRecorder) return;
    chunks = [];
    mediaRecorder.start();
    recStart.disabled = true;
    recStop.disabled  = false;
    recStart.textContent = "录音中…";
  });

  recStop.addEventListener("click", () => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    recStart.disabled = false;
    recStop.disabled  = true;
    recStart.textContent = "开始录音";
  });
}

// 初始化
function init(){
  const now = new Date();
  initSelectors(now);
  renderCalendar(now);
  setupModalEvents();
  renderMiniGallery();
  setupAudio();
  setupRecorder();

  // 切换月份
  const yearSel = document.getElementById("yearSel");
  const monthSel= document.getElementById("monthSel");
  const prevBtn = document.getElementById("prevMonth");
  const nextBtn = document.getElementById("nextMonth");
  const todayBtn= document.getElementById("todayBtn");
  const jumpBtn = document.getElementById("jumpBtn");
  const jumpInp = document.getElementById("jumpInput");

  function updateFromSelectors(){
    renderCalendar(new Date(Number(yearSel.value), Number(monthSel.value) - 1, 1));
  }

  yearSel?.addEventListener("change", updateFromSelectors);
  monthSel?.addEventListener("change", updateFromSelectors);

  prevBtn?.addEventListener("click", () => {
    let y = Number(yearSel.value);
    let m = Number(monthSel.value) - 1;
    if (m <= 0){ m = 12; y -= 1; }
    yearSel.value  = String(y);
    monthSel.value = String(m);
    updateFromSelectors();
  });

  nextBtn?.addEventListener("click", () => {
    let y = Number(yearSel.value);
    let m = Number(monthSel.value) + 1;
    if (m > 12){ m = 1; y += 1; }
    yearSel.value  = String(y);
    monthSel.value = String(m);
    updateFromSelectors();
  });

  todayBtn?.addEventListener("click", () => {
    const t = new Date();
    yearSel.value  = String(t.getFullYear());
    monthSel.value = String(t.getMonth() + 1);
    updateFromSelectors();
  });

  jumpBtn?.addEventListener("click", () => {
    const val = (jumpInp?.value || "").trim();
    if (!val) return;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val);
    if (!m){
      alert("请输入正确的日期格式：YYYY-MM-DD");
      return;
    }
    const y = Number(m[1]);
    const mo= Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    if (Number.isNaN(dt.getTime())){
      alert("这个日期好像不太对…");
      return;
    }
    yearSel.value  = String(y);
    monthSel.value = String(mo);
    renderCalendar(dt);
    openModal(toISO(dt));
  });
}

if (document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
