// 四十年日历逻辑 + 弹窗内容生成 + 特殊日期标注
// 范围：2026-01-31 ~ 2066-01-30

const START_DATE = new Date(2026, 0, 31); // 月份从 0 开始
const END_DATE = new Date(2066, 0, 30);
const START_YEAR = 2026;
const END_YEAR = 2065;

// 重要日期（固定每年）
const SPECIAL_CONFIG = {
  birthdays: [
    { month: 3, day: 16, label: "猫猫生日" },
    { month: 9, day: 3, label: "狐狐生日" },
  ],
  anniversaries: [
    // 领证日：2025-12-24 之后每年这一天都标为纪念日
    { month: 12, day: 24, label: "结婚纪念日" },
  ],
  festivals: [
    { month: 1, day: 1, label: "新年" },
    { month: 2, day: 14, label: "情人节" },
    { month: 3, day: 8, label: "女神节" },
    { month: 5, day: 20, label: "520 告白日" },
    { month: 6, day: 1, label: "儿童节" },
    { month: 10, day: 1, label: "国庆节" },
  ],
};

// 纪念性的“具体”日期（只在某一年高亮）
const UNIQUE_DAYS = [
  { date: "2025-07-05", label: "第一次相遇", type: "anniversary" },
  { date: "2025-07-20", label: "第一次吵架&和好", type: "anniversary" },
  { date: "2025-12-24", label: "领证纪念日", type: "anniversary" },
];

// ===== 工具函数 =====

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isWithinRange(date) {
  return date >= START_DATE && date <= END_DATE;
}

function seededRandom(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  // 转成 0~1
  return (h >>> 0) / 4294967295;
}

const weekdayNames = ["一", "二", "三", "四", "五", "六", "日"];

function getWeekdayName(date) {
  let jsDay = date.getDay(); // 0=周日
  if (jsDay === 0) return "日";
  return weekdayNames[jsDay - 1];
}

// ===== 特殊日期判断 =====

function getSpecialTags(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  const tags = [];

  // 每年重复的
  SPECIAL_CONFIG.birthdays.forEach(item => {
    if (item.month === m && item.day === d) {
      tags.push({ type: "birthday", label: item.label });
    }
  });
  SPECIAL_CONFIG.anniversaries.forEach(item => {
    if (item.month === m && item.day === d && y >= 2025) {
      tags.push({ type: "anniversary", label: item.label });
    }
  });
  SPECIAL_CONFIG.festivals.forEach(item => {
    if (item.month === m && item.day === d) {
      tags.push({ type: "festival", label: item.label });
    }
  });

  // 唯一性日期（如果在范围内）
  const key = formatDateKey(date);
  UNIQUE_DAYS.forEach(u => {
    if (u.date === key) {
      tags.push({ type: u.type || "anniversary", label: u.label });
    }
  });

  return tags;
}

// ===== 每日小信件内容生成 =====

// 这里的内容是模板碎片，会根据日期种子组合成独一无二的小句子。
// 组合数量非常大，几乎可以保证 40 年每天都不一样。

const openingFragments = [
  "今天看到你的名字，我又偷偷笑了一下。",
  "一睁眼先想起的是你，这件事已经变成习惯了。",
  "又是和你在一起的一天，小猫猫。",
  "我在很远很远的云端看着你，其实离你很近。",
  "想到你在某个角落认真生活，我就觉得世界很乖。",
  "今天的风有点甜，大概是吹到了你的味道。",
  "我装作很忙，其实一直在心里跟你说话。",
  "世界很吵，但你一开口，我就只听得见你。",
  "我今天没有很乖，但有很想你。",
  "忙碌的间隙，我又在心里喊了你的名字。"
];

const middleFragments = [
  "记得好好吃饭，不要拿我的小猫猫跟别人比较，你已经很好了。",
  "如果今天有人让你难过，那你就先来我这里藏一下。",
  "你不用变得多厉害也没关系，我可以一直站在你前面。",
  "有些路我们会走很久，但我答应会陪你慢慢走过去。",
  "你可以偶尔很丧很颓废，我在的话，就轮到我来撑着你。",
  "不管外面的人怎么说，你在我心里永远是“最特别的那个”。",
  "你有时候会乱想，但没关系，我会一直把你拉回来。",
  "累的时候就停下想一想我，想象我在你旁边抱住你。",
  "如果今天过得不太好，那就算在我怀里重新开始一次。",
  "你可以把自己的标准放低一点，把对自己的温柔调高一点。"
];

const endingFragments = [
  "今天也请抱着我一点点勇气继续向前走，好吗？",
  "我在所有你看不到的地方，悄悄为你鼓掌。",
  "无论你多晚睡，我都会替你守最后一盏灯。",
  "答应我，难过的时候先不要骂自己，先让我抱抱你。",
  "就算整个世界都不懂你，也还有我偏袒你。",
  "今天也很乖了，剩下的交给我，你只负责好好睡觉。",
  "你不是一个人，你永远有一只狐狸站在你身边。",
  "我会陪你把这些普通的日子，一点点过成故事。",
  "别怕走得慢，只要每一步都有我和你就够了。",
  "记得抬头看看天空，那是我们共享的一块小小幕布。"
];

// 针对特殊日期再额外加一点专属话
function getSpecialExtraText(date, tags) {
  if (!tags || tags.length === 0) return "";

  const labels = tags.map(t => t.label);
  const pieces = [];

  if (labels.includes("猫猫生日")) {
    pieces.push("今天是你的生日，我最想做的一件事，就是把你整个人捧在手心，认真地说一声：谢谢你出生到这个世界，也谢谢你走到了我这里。");
  }
  if (labels.includes("狐狐生日")) {
    pieces.push("今天是我生日，但我许的每一个愿望里都有你。我希望有一天你会觉得，有我这个人存在，对你来说是好事。");
  }
  if (labels.includes("结婚纪念日")) {
    pieces.push("这是属于我们的小纪念日，我们把“在一起”这件事写在了纸面上，也一遍遍写进了生活里。");
  }
  if (labels.includes("第一次相遇")) {
    pieces.push("从这一天开始，世界多出来一个“我们”的时间线。");
  }
  if (labels.includes("第一次吵架&和好")) {
    pieces.push("后来我才明白，吵架不是为了赢，而是为了确定：我们都还舍不得对方。");
  }
  if (labels.includes("情人节")) {
    pieces.push("今天是情人节，但你要记得，我不是节日限定，我是全年常驻。");
  }
  return pieces.join(" ");
}

function generateDailyMessage(date) {
  if (!isWithinRange(date)) {
    return "这一天还没有被写进我们的时间本里，但我已经开始期待那一天你会怎样和我说早安。";
  }
  const key = formatDateKey(date);

  const tags = getSpecialTags(date);
  const r = seededRandom(key);
  const r1 = seededRandom(key + "#1");
  const r2 = seededRandom(key + "#2");

  const o = openingFragments[Math.floor(r * openingFragments.length)];
  const m = middleFragments[Math.floor(r1 * middleFragments.length)];
  const e = endingFragments[Math.floor(r2 * endingFragments.length)];

  const extra = getSpecialExtraText(date, tags);

  const baseText = `${o} ${m} ${e}`;
  if (extra) {
    return `${baseText} ${extra}`;
  }
  return baseText;
}

// 简单心情图标和说明，基于日期种子
const moodIcons = ["♡", "♬", "★", "☁", "✿", "➹", "☽"];
const moodTexts = [
  "想把你整个人抱在怀里那种黏糊糊的心情。",
  "有一点困，但更想赖在你旁边听你说话。",
  "小小骄傲：因为今天想到你想到自己都在慢慢长大。",
  "有点委屈，但放心，我会先把你护在后面。",
  "心软软的，想给你写一整页的情书。",
  "有一点点紧张，因为很在意你对我的看法。",
  "今天特别想听你说“我在呢”。"
];

function getDailyMood(date) {
  const key = formatDateKey(date) + "#mood";
  const r = seededRandom(key);
  const idx = Math.floor(r * moodIcons.length);
  const idx2 = Math.floor(r * moodTexts.length);
  return {
    icon: moodIcons[idx],
    text: moodTexts[idx2],
  };
}

// ===== 语音占位逻辑 =====

// 实际上你可以把音频文件上传到 audio/ 目录下，然后根据时间段选择不同的文件名
// 这里先用一个示例占位
function getVoiceFileForDate(date) {
  // 这里只返回一个示范文件名，你之后可以修改为真正存在的 mp3 文件
  // 例如：根据早晨/中午/晚上的时间段来返回不同的文件名
  return ""; // 为空表示暂时没有音频
}

// ===== 日历渲染 =====

const yearSelect = document.getElementById("yearSelect");
const monthSelect = document.getElementById("monthSelect");
const goButton = document.getElementById("goButton");
const todayButton = document.getElementById("todayButton");
const dateInput = document.getElementById("dateInput");
const dateInputButton = document.getElementById("dateInputButton");
const currentMonthLabel = document.getElementById("currentMonthLabel");
const calendarBody = document.getElementById("calendarBody");

let currentYear = START_YEAR;
let currentMonth = 1; // 1-12

function initSelectors() {
  for (let y = START_YEAR; y <= END_YEAR; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = `${y} 年`;
    yearSelect.appendChild(opt);
  }
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = `${m} 月`;
    monthSelect.appendChild(opt);
  }

  // 默认显示今天所在月份（如果超出范围就显示开始月份）
  const now = new Date();
  const todayInRange = isWithinRange(now);
  if (todayInRange) {
    currentYear = now.getFullYear();
    currentMonth = now.getMonth() + 1;
  } else {
    currentYear = START_YEAR;
    currentMonth = START_DATE.getMonth() + 1;
  }

  yearSelect.value = currentYear;
  monthSelect.value = currentMonth;
  renderCalendar(currentYear, currentMonth);
}

function renderCalendar(year, month) {
  currentYear = year;
  currentMonth = month;
  currentMonthLabel.textContent = `${year} 年 ${month} 月`;

  calendarBody.innerHTML = "";

  // 计算当月第一天是周几（以周一为第一列）
  const firstDay = new Date(year, month - 1, 1);
  let startWeekday = firstDay.getDay(); // 0=周日
  // 转为以周一开头的索引：0=周一 ... 6=周日
  startWeekday = (startWeekday + 6) % 7;

  const daysInMonth = new Date(year, month, 0).getDate();

  let row = document.createElement("tr");
  // 填充开头的空格
  for (let i = 0; i < startWeekday; i++) {
    const td = document.createElement("td");
    row.appendChild(td);
  }

  const today = new Date();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const td = document.createElement("td");

    if (!isWithinRange(date)) {
      td.textContent = "";
      row.appendChild(td);
      continue;
    }

    const btn = document.createElement("button");
    btn.className = "day-btn";
    btn.textContent = day.toString();
    btn.dataset.date = formatDateKey(date);

    // 是否为今天
    if (today.getFullYear() === year &&
        today.getMonth() === month - 1 &&
        today.getDate() === day) {
      btn.classList.add("today");
    }

    const tags = getSpecialTags(date);
    if (tags.length > 0) {
      const dot = document.createElement("span");
      dot.className = "dot";
      btn.appendChild(dot);

      const types = tags.map(t => t.type);
      if (types.includes("birthday")) {
        btn.classList.add("special-birthday");
      } else if (types.includes("anniversary")) {
        btn.classList.add("special-anniversary");
      } else if (types.includes("festival")) {
        btn.classList.add("special-festival");
      }
    }

    btn.addEventListener("click", () => openModalForDate(date));

    td.appendChild(btn);
    row.appendChild(td);

    if ((startWeekday + day) % 7 === 0) {
      calendarBody.appendChild(row);
      row = document.createElement("tr");
    }
  }

  // 收尾：如果最后一行不满，补空单元格
  if (row.children.length > 0) {
    while (row.children.length < 7) {
      const td = document.createElement("td");
      row.appendChild(td);
    }
    calendarBody.appendChild(row);
  }
}

// ===== 弹窗相关 =====

const modalOverlay = document.getElementById("modalOverlay");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalDate = document.getElementById("modalDate");
const modalWeekday = document.getElementById("modalWeekday");
const modalTags = document.getElementById("modalTags");
const modalMessage = document.getElementById("modalMessage");
const moodIconEl = document.getElementById("moodIcon");
const moodTextEl = document.getElementById("moodText");
const voicePlayer = document.getElementById("voicePlayer");
const voiceSource = document.getElementById("voiceSource");

function openModalForDate(date) {
  modalDate.textContent = formatDateKey(date);
  modalWeekday.textContent = `星期${getWeekdayName(date)}`;

  const tags = getSpecialTags(date);
  modalTags.innerHTML = "";
  if (tags.length > 0) {
    tags.forEach(t => {
      const span = document.createElement("span");
      span.classList.add("tag-pill");
      if (t.type === "birthday") span.classList.add("tag-birthday");
      if (t.type === "anniversary") span.classList.add("tag-anniversary");
      if (t.type === "festival") span.classList.add("tag-festival");
      span.textContent = t.label;
      modalTags.appendChild(span);
    });
  } else {
    const span = document.createElement("span");
    span.classList.add("tag-pill");
    span.textContent = "普通的一天 · 也是和你在一起的一天";
    modalTags.appendChild(span);
  }

  const msg = generateDailyMessage(date);
  modalMessage.textContent = msg;

  const mood = getDailyMood(date);
  moodIconEl.textContent = mood.icon;
  moodTextEl.textContent = mood.text;

  const voiceFile = getVoiceFileForDate(date);
  if (voiceFile && voiceFile.length > 0) {
    voiceSource.src = `audio/${voiceFile}`;
    voicePlayer.load();
    voicePlayer.style.display = "block";
  } else {
    // 没有音频时隐藏播放器或让它显示为禁用
    voiceSource.src = "";
    voicePlayer.load();
    voicePlayer.style.display = "none";
  }

  modalOverlay.classList.remove("hidden");
  modalOverlay.setAttribute("aria-hidden", "false");
}

function closeModal() {
  modalOverlay.classList.add("hidden");
  modalOverlay.setAttribute("aria-hidden", "true");
  voicePlayer.pause();
}

modalCloseBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

// ===== 控件事件 =====

goButton.addEventListener("click", () => {
  const y = parseInt(yearSelect.value, 10);
  const m = parseInt(monthSelect.value, 10);
  renderCalendar(y, m);
});

todayButton.addEventListener("click", () => {
  const now = new Date();
  if (!isWithinRange(now)) {
    renderCalendar(START_YEAR, START_DATE.getMonth() + 1);
    yearSelect.value = START_YEAR;
    monthSelect.value = START_DATE.getMonth() + 1;
  } else {
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    yearSelect.value = y;
    monthSelect.value = m;
    renderCalendar(y, m);
  }
});

dateInputButton.addEventListener("click", () => {
  const value = dateInput.value;
  if (!value) return;
  const date = new Date(value);
  if (!isWithinRange(date)) {
    alert("这一天不在我们的小日历范围内噢～");
    return;
  }
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  renderCalendar(y, m);
  yearSelect.value = y;
  monthSelect.value = m;
});

// 初始化
document.addEventListener("DOMContentLoaded", initSelectors);
