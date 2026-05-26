const navItems = [
  ["today", "Today", "Today snapshot", "home"],
  ["schedule", "Schedule", "Multi-show day plan", "calendar"],
  ["report", "Report", "CSV to summary", "report"],
  ["records", "Records", "Ops context notes", "note"],
  ["analytics", "Analytics", "Independent data view", "chart"]
];

const actionOptions = [
  "Slowed auction pace",
  "Pushed low-CPI SKUs",
  "Held back high-cost SKUs",
  "Changed product order",
  "Extended stream",
  "Saved giveaways",
  "Focused on branded products",
  "Reacted to competitor stream"
];

let scheduledShows = [
  {
    date: "Tue May 26",
    title: "Morning Home Tools",
    startTime: "10:30 AM",
    endTime: "1:30 PM",
    hosts: ["Host A", "Host B"],
    operators: ["Operator A"],
    showType: "Normal Show",
    productFocus: "Home tools + kitchen",
    giveawayPlan: "Power bank, small gift cards",
    notes: "Use stronger low-CPI SKUs early while traffic warms up."
  },
  {
    date: "Tue May 26",
    title: "Afternoon Monitor Test",
    startTime: "2:00 PM",
    endTime: "5:30 PM",
    hosts: ["Host C"],
    operators: ["Operator A", "Operator B"],
    showType: "Test Show",
    productFocus: "Monitors + accessories",
    giveawayPlan: "Hold premium giveaways unless bidding is strong",
    notes: "Avoid high-cost monitor units if traffic drops."
  },
  {
    date: "Wed May 27",
    title: "Clearance Push",
    startTime: "12:00 PM",
    endTime: "5:30 PM",
    hosts: ["Host B"],
    operators: ["Operator B", "Operator C"],
    showType: "Clearance Show",
    productFocus: "Old SKUs, accessories",
    giveawayPlan: "Held until traffic confirms",
    notes: "Focus on cleaning old inventory without forcing high-cost SKUs."
  },
  {
    date: "Thu May 28",
    title: "Branded Event Block",
    startTime: "10:30 AM",
    endTime: "3:30 PM",
    hosts: ["Host C", "Host D"],
    operators: ["Operator A"],
    showType: "Event Show",
    productFocus: "Apple / branded items",
    giveawayPlan: "Gift card ladder",
    notes: "Run branded items during strongest traffic windows."
  }
];

const dailyMetrics = [
  { label: "Mon", gmv: 7420, gmv_per_hour: 928, aov: 11.84, orders: 627 },
  { label: "Tue", gmv: 9150, gmv_per_hour: 1046, aov: 12.92, orders: 708 },
  { label: "Wed", gmv: 6680, gmv_per_hour: 835, aov: 10.76, orders: 621 },
  { label: "Thu", gmv: 10440, gmv_per_hour: 1193, aov: 13.38, orders: 780 },
  { label: "Fri", gmv: 12120, gmv_per_hour: 1347, aov: 14.05, orders: 863 },
  { label: "Sat", gmv: 13880, gmv_per_hour: 1424, aov: 14.62, orders: 949 },
  { label: "Sun", gmv: 11260, gmv_per_hour: 1251, aov: 13.76, orders: 818 }
];

let weeklyMetrics = [];
let trendMetric = "gmv";
let selectedDailyTrendIndex = dailyMetrics.length - 1;
let selectedWeeklyTrendIndex = 0;
let cpiView = "all";
let selectedSkuName = "Smartgloo Cordless Hot Glue Gun";
let segmentHistory = [];
let currentSegment = "today";

let salesItems = [
  ["Smartgloo Cordless Hot Glue Gun", 282.6, 12, 17.5, 23.55, "Tools", false],
  ["KOORUI 24 Monitor", 621.4, 7, 67.2, 88.77, "Monitor", false],
  ["Power Bank Giveaway", 0, 6, 8.8, 0, "Giveaway", true],
  ["Kitchen Storage Rack", 115.8, 10, 18.6, 11.58, "Kitchen", false]
];

const showInfo = {
  date: "2026-05-26",
  showName: "Home Daily Show",
  showType: "Normal Show",
  livestreamHours: 5,
  host: "Host A",
  operator: "Operator A",
  leader: "Leader A",
  bookmarks: 420,
  onTimeStart: "YES"
};

const opsNotes = {
  actions: ["Slowed auction pace", "Held back high-cost SKUs", "Saved giveaways"],
  traffic: "Traffic was stable early, then bidding depth softened during the second half of the show.",
  competitor: "DailyDeal became active near the late session window, which affected bidding momentum.",
  inventory: "Fresh inventory was limited because the team was focused on warehouse cleanup and SKU organization.",
  host: "Host adjusted pace appropriately and avoided forcing high-cost products into weak bidding windows.",
  giveaway: "Power banks were used. Premium headphones and larger gift cards were held back to control spend.",
  kpiContext: "GMV was supported by monitor and tool demand, while margin depended on holding back high-cost items during weaker bidding windows."
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const money2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

function $(selector) {
  return document.querySelector(selector);
}

function pct(value) {
  return `${((Number.isFinite(value) ? value : 0) * 100).toFixed(1)}%`;
}

function cpiRate(item) {
  return item[3] ? item[4] / item[3] : 0;
}

function trendValue(week) {
  return week[trendMetric] || 0;
}

function trendValueLabel(value) {
  return trendMetric === "aov" ? money2.format(value) : money.format(value);
}

function metrics() {
  const sellable = salesItems.filter((item) => !item[6]);
  const gmv = sellable.reduce((sum, item) => sum + item[1], 0);
  const units = sellable.reduce((sum, item) => sum + item[2], 0);
  const totalCost = sellable.reduce((sum, item) => sum + item[3] * item[2], 0);
  const aov = units ? gmv / units : 0;
  const cpi = units ? totalCost / units : 0;
  return {
    gmv,
    units,
    totalCost,
    aov,
    cpi,
    gmvPerHour: showInfo.livestreamHours ? gmv / showInfo.livestreamHours : 0,
    margin: gmv ? (gmv - totalCost) / gmv : 0,
    completion: cpi ? aov / cpi : 0
  };
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function parseNumber(value) {
  const parsed = Number(String(value || "").replace(/[$,%]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

function inferCategory(name) {
  const lower = name.toLowerCase();
  if (lower.includes("giveaway") || lower.includes("gift card") || lower.includes("amazon")) return "Giveaway";
  if (lower.includes("monitor")) return "Monitor";
  if (lower.includes("apple") || lower.includes("airpod") || lower.includes("iphone")) return "Apple / Branded";
  if (lower.includes("power") || lower.includes("charger") || lower.includes("cable")) return "Electronics";
  if (lower.includes("kitchen") || lower.includes("rack") || lower.includes("storage")) return "Kitchen";
  if (lower.includes("tool") || lower.includes("glue") || lower.includes("drill")) return "Tools";
  return "Home";
}

function findColumn(headers, candidates, fallback) {
  const normalized = headers.map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ""));
  for (const candidate of candidates) {
    const key = candidate.toLowerCase().replace(/[^a-z0-9]/g, "");
    const index = normalized.findIndex((header) => header.includes(key));
    if (index !== -1) return index;
  }
  return fallback;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const headers = splitCsvLine(lines[0] || "");
  const productIndex = findColumn(headers, ["product name", "product", "item name", "title"], 0);
  const totalIndex = findColumn(headers, ["total sales", "sales", "gmv"], 1);
  const ordersIndex = findColumn(headers, ["number of orders", "orders", "quantity", "qty", "units"], 2);
  const costIndex = findColumn(headers, ["cost per item", "cost", "cpi"], 3);
  const averageIndex = findColumn(headers, ["average price", "avg price", "average selling price"], totalIndex);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const product = cells[productIndex] || "Unnamed product";
    const total = parseNumber(cells[totalIndex]);
    const orders = parseNumber(cells[ordersIndex]) || 1;
    const cost = parseNumber(cells[costIndex]);
    const avg = averageIndex === totalIndex ? total / orders : parseNumber(cells[averageIndex]) || total / orders;
    const category = inferCategory(product);
    return [product, total, orders, cost, avg, category, category === "Giveaway" || total === 0 || product.toLowerCase().includes("giveaway")];
  });
}

function showToast(message) {
  $("#toastLayer").innerHTML = `<div class="toast" role="status"><span>${message}</span><button type="button" aria-label="Dismiss message" id="dismissToast">×</button></div>`;
  $("#dismissToast").addEventListener("click", () => $("#toastLayer").innerHTML = "");
}

function setScreen(id, push = true) {
  if (id === currentSegment) return;
  if (push) segmentHistory.push(currentSegment);
  currentSegment = id;
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === id));
  document.querySelectorAll(".nav-item,.mobile-tab").forEach((button) => button.classList.toggle("active", button.dataset.id === id));
  $("#screenTitle").textContent = navItems.find((item) => item[0] === id)[1];
  $("#backButton").classList.toggle("visible", segmentHistory.length > 0);
}

function goBack() {
  if ($("#detailLayer").innerHTML) {
    $("#detailLayer").innerHTML = "";
    return;
  }
  const previous = segmentHistory.pop();
  if (previous) setScreen(previous, false);
}

function closeDetailLayer() {
  $("#detailLayer").innerHTML = "";
}

function openShowLayer(show) {
  $("#detailLayer").innerHTML = `<div class="sheet-backdrop" id="sheetBackdrop"><aside class="detail-sheet" role="dialog" aria-modal="true"><div class="sheet-handle"></div><header class="sheet-head"><div><span>Schedule detail</span><h3>${show.title}</h3></div><button class="icon-button" id="closeSheet" type="button" aria-label="Close">×</button></header><dl class="sheet-list"><div><dt>Date</dt><dd>${show.date}</dd></div><div><dt>Time</dt><dd>${show.startTime} - ${show.endTime}</dd></div><div><dt>Hosts</dt><dd>${show.hosts.join(", ")}</dd></div><div><dt>Operators</dt><dd>${show.operators.join(", ")}</dd></div><div><dt>Product focus</dt><dd>${show.productFocus}</dd></div><div><dt>Giveaway plan</dt><dd>${show.giveawayPlan}</dd></div><div><dt>Notes</dt><dd>${show.notes}</dd></div></dl></aside></div>`;
  $("#closeSheet").addEventListener("click", closeDetailLayer);
  $("#sheetBackdrop").addEventListener("click", closeDetailLayer);
  $(".detail-sheet").addEventListener("click", (event) => event.stopPropagation());
  showToast(`${show.title} details opened.`);
}

function openSkuLayer(item) {
  $("#detailLayer").innerHTML = `<div class="sheet-backdrop" id="sheetBackdrop"><aside class="detail-sheet" role="dialog" aria-modal="true"><div class="sheet-handle"></div><header class="sheet-head"><div><span>SKU detail</span><h3>${item[0]}</h3></div><button class="icon-button" id="closeSheet" type="button" aria-label="Close">×</button></header><dl class="sheet-list"><div><dt>Category</dt><dd>${item[5]}</dd></div><div><dt>GMV</dt><dd>${money2.format(item[1])}</dd></div><div><dt>Orders</dt><dd>${item[2]}</dd></div><div><dt>ASP</dt><dd>${money2.format(item[4])}</dd></div><div><dt>CPI</dt><dd>${money2.format(item[3])}</dd></div><div><dt>CPI rate</dt><dd>${pct(cpiRate(item))}</dd></div></dl></aside></div>`;
  $("#closeSheet").addEventListener("click", closeDetailLayer);
  $("#sheetBackdrop").addEventListener("click", closeDetailLayer);
  $(".detail-sheet").addEventListener("click", (event) => event.stopPropagation());
  showToast(`${item[0]} details opened.`);
}

function metricCard(label, value, helper = "", tone = "neutral") {
  return `<article class="metric-card tone-${tone}"><span>${label}</span><strong>${value}</strong>${helper ? `<p>${helper}</p>` : ""}</article>`;
}

function renderNav() {
  $("#desktopNav").innerHTML = navItems.map(([id, label, description, icon]) => `<button class="nav-item ${id === "today" ? "active" : ""}" data-id="${id}" type="button"><span class="nav-label"><span class="prototype-icon icon-${icon}" aria-hidden="true"></span>${label}</span><small>${description}</small></button>`).join("");
  $("#mobileNav").innerHTML = navItems.map(([id, label, , icon]) => `<button class="mobile-tab ${id === "today" ? "active" : ""}" data-id="${id}" type="button"><span class="prototype-icon icon-${icon}" aria-hidden="true"></span><span>${label}</span></button>`).join("");
  document.querySelectorAll("[data-id]").forEach((button) => button.addEventListener("click", () => setScreen(button.dataset.id)));
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => setScreen(button.dataset.go)));
}

function addDraftShow() {
  const draft = {
    date: showInfo.date,
    title: `Draft Show ${scheduledShows.length + 1}`,
    startTime: "10:00 AM",
    endTime: "1:00 PM",
    hosts: [showInfo.host || "Host"],
    operators: [showInfo.operator || "Operator"],
    showType: showInfo.showType || "Normal Show",
    productFocus: "To be assigned",
    giveawayPlan: "To be confirmed",
    notes: "Draft show created from the action button."
  };
  scheduledShows = [draft, ...scheduledShows];
  $("#scheduleStatus").textContent = `${draft.title} added for ${draft.date}.`;
  renderShifts();
  setScreen("schedule");
  openShowLayer(draft);
}

function renderSegmented(target, options, selected, onChange) {
  target.innerHTML = options.map(([id, label]) => `<button class="${selected === id ? "active" : ""}" data-value="${id}" type="button" aria-pressed="${selected === id}">${label}</button>`).join("");
  target.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => onChange(button.dataset.value)));
}

function renderTrend(targetSelector = "#trendChart", data = dailyMetrics, selectedIndex = selectedDailyTrendIndex, onSelect = (index) => {
  selectedDailyTrendIndex = index;
}) {
  const width = 760;
  const height = 250;
  const pad = { top: 22, right: 24, bottom: 44, left: 54 };
  if (!data.length) {
    $(targetSelector).innerHTML = `<div class="empty-chart">Weekly charts already live in the existing website. Open it from this segment when needed.</div>`;
    return;
  }
  const values = data.map(trendValue);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const points = data.map((week, index) => {
    const x = pad.left + (data.length <= 1 ? innerW / 2 : (index / (data.length - 1)) * innerW);
    const y = pad.top + innerH - ((trendValue(week) - min) / range) * innerH;
    return { x, y, week, value: trendValue(week) };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const attrName = targetSelector === "#analyticsTrendChart" ? "data-weekly-trend-index" : "data-daily-trend-index";
  $(targetSelector).innerHTML = `<svg class="trend-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trend chart"><line x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}"></line><line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}"></line><text x="${pad.left}" y="18">${trendValueLabel(max)}</text><text x="${pad.left}" y="${height - 12}">${trendValueLabel(min)}</text><path d="${path}"></path>${points.map((point, index) => `<g><circle role="button" tabindex="0" ${attrName}="${index}" class="${index === selectedIndex ? "selected" : ""}" cx="${point.x}" cy="${point.y}" r="${index === selectedIndex ? 7 : 5}" aria-label="${point.week.label}: ${trendValueLabel(point.value)}"></circle><text class="axis-label" x="${point.x}" y="${height - 24}">${point.week.label}</text></g>`).join("")}</svg>`;
  document.querySelectorAll(`[${attrName}]`).forEach((point) => point.addEventListener("click", () => {
    const nextIndex = Number(point.getAttribute(attrName));
    onSelect(nextIndex);
    if (targetSelector === "#analyticsTrendChart") {
      renderTrend("#analyticsTrendChart", weeklyMetrics, selectedWeeklyTrendIndex, (index) => {
        selectedWeeklyTrendIndex = index;
      });
      const selected = weeklyMetrics[selectedWeeklyTrendIndex];
      $("#weeklyTrendStatus").textContent = `Selected: ${selected.label} · ${trendValueLabel(trendValue(selected))}`;
    } else {
      renderTrend("#trendChart", dailyMetrics, selectedDailyTrendIndex, (index) => {
        selectedDailyTrendIndex = index;
      });
      const selected = dailyMetrics[selectedDailyTrendIndex];
      $("#trendStatus").textContent = `Selected: ${selected.label} · ${trendValueLabel(trendValue(selected))}`;
    }
  }));
}

function renderTrendControls() {
  const options = [["gmv", "GMV"], ["gmv_per_hour", "GMV / Hour"], ["aov", "AOV"]];
  const update = (value) => {
    trendMetric = value;
    renderTrendControls();
    renderTrend("#trendChart", dailyMetrics, selectedDailyTrendIndex, (index) => {
      selectedDailyTrendIndex = index;
    });
    renderTrend("#analyticsTrendChart", weeklyMetrics, selectedWeeklyTrendIndex, (index) => {
      selectedWeeklyTrendIndex = index;
    });
  };
  renderSegmented($("#trendControls"), options, trendMetric, update);
  renderSegmented($("#analyticsTrendControls"), options, trendMetric, update);
}

function renderShifts() {
  $("#shiftList").innerHTML = scheduledShows.slice(0, 4).map((show, index) => `<button class="shift-row" data-show-index="${index}" type="button"><div><strong>${show.date}</strong><span>${show.startTime} - ${show.endTime}</span></div><p>${show.title} · ${show.hosts.join(", ")}</p><span>›</span></button>`).join("");
  const days = scheduledShows.reduce((list, show) => {
    const existing = list.find((day) => day.date === show.date);
    if (existing) existing.shows.push(show);
    else list.push({ date: show.date, shows: [show] });
    return list;
  }, []);
  $("#scheduleGrid").innerHTML = days.map((day) => `<article class="day-card"><div class="card-date"><strong>${day.date}</strong><span>${day.shows.length} livestream${day.shows.length > 1 ? "s" : ""}</span></div><div class="show-list">${day.shows.map((show) => `<section class="show-card"><div class="show-card-head"><div><h4>${show.title}</h4><p>${show.startTime} - ${show.endTime} · ${show.showType}</p></div><span>${show.productFocus}</span></div><dl><div><dt>Hosts</dt><dd>${show.hosts.join(", ")}</dd></div><div><dt>Operators</dt><dd>${show.operators.join(", ")}</dd></div><div><dt>Giveaway plan</dt><dd>${show.giveawayPlan}</dd></div><div><dt>Notes</dt><dd>${show.notes}</dd></div></dl></section>`).join("")}</div></article>`).join("");
  document.querySelectorAll("[data-show-index]").forEach((button) => button.addEventListener("click", () => openShowLayer(scheduledShows[Number(button.dataset.showIndex)])));
}

function renderForm() {
  const fields = [
    ["date", "Date", "date"],
    ["showName", "Show name", "text"],
    ["showType", "Show type", "text"],
    ["livestreamHours", "Livestream hours", "number"],
    ["host", "Host", "text"],
    ["operator", "Operator", "text"],
    ["leader", "Leader", "text"],
    ["bookmarks", "Bookmarks", "number"],
    ["onTimeStart", "On-time start", "text"]
  ];
  $("#showForm").innerHTML = fields.map(([key, label, type]) => `<label>${label}<input data-field="${key}" type="${type}" value="${showInfo[key]}"></label>`).join("");
  document.querySelectorAll("[data-field]").forEach((input) => {
    input.addEventListener("input", () => {
      showInfo[input.dataset.field] = input.type === "number" ? Number(input.value) : input.value;
      render();
    });
  });
}

function skuTable(rows) {
  return `<table><thead><tr><th>Product</th><th>Category</th><th>ASP</th><th>CPI</th><th>CPI Rate</th><th>Orders</th><th>GMV</th></tr></thead><tbody>${rows.length ? rows.map((row) => `<tr><td>${row[0]}</td><td>${row[5]}</td><td>${money2.format(row[4])}</td><td>${money2.format(row[3])}</td><td>${pct(cpiRate(row))}</td><td>${row[2]}</td><td>${money2.format(row[1])}</td></tr>`).join("") : `<tr><td colspan="7">No SKU in this bucket.</td></tr>`}</tbody></table>`;
}

function cpiRows() {
  const sellable = salesItems.filter((item) => !item[6] && item[3] > 0).sort((a, b) => cpiRate(b) - cpiRate(a));
  if (cpiView === "winners") return sellable.filter((item) => cpiRate(item) >= 1);
  if (cpiView === "optimize") return sellable.filter((item) => cpiRate(item) >= 0.8 && cpiRate(item) < 1);
  if (cpiView === "risk") return sellable.filter((item) => cpiRate(item) < 0.8);
  return sellable;
}

function renderCpiControls() {
  const options = [["all", "All"], ["winners", "100%+"], ["optimize", "80-100%"], ["risk", "Below 80%"]];
  renderSegmented($("#cpiControls"), options, cpiView, (value) => {
    cpiView = value;
    renderCpiControls();
    renderCpiChart();
  });
}

function renderCpiChart() {
  const rows = cpiRows();
  const maxRate = Math.max(...rows.map(cpiRate), 1.5);
  $("#cpiChart").innerHTML = rows.length ? rows.slice(0, 8).map((row) => {
    const rate = cpiRate(row);
    const tone = rate >= 1 ? "good" : rate >= 0.8 ? "warn" : "danger";
    return `<button class="${selectedSkuName === row[0] ? `cpi-bar selected ${tone}` : `cpi-bar ${tone}`}" data-sku="${row[0]}" type="button"><span class="bar-label">${row[0]}</span><span class="bar-track"><span style="width:${Math.min((rate / maxRate) * 100, 100)}%"></span></span><strong>${pct(rate)}</strong></button>`;
  }).join("") : `<p class="empty-chart">No SKU data in this bucket.</p>`;
  document.querySelectorAll("[data-sku]").forEach((button) => button.addEventListener("click", () => {
    selectedSkuName = button.dataset.sku;
    renderCpiChart();
    const item = salesItems.find((candidate) => candidate[0] === selectedSkuName);
    if (item) openSkuLayer(item);
  }));
  const selected = salesItems.find((item) => item[0] === selectedSkuName) || rows[0];
  $("#skuDetail").innerHTML = selected ? `<div><span>Selected SKU</span><strong>${selected[0]}</strong></div><p>${selected[5]} · ASP ${money2.format(selected[4])} · CPI ${money2.format(selected[3])} · CPI Rate ${pct(cpiRate(selected))}</p>` : "";
  $("#skuStatus").textContent = selected ? `Selected: ${selected[0]}` : "Click a bar to inspect the SKU.";
}

function generatedReport() {
  const m = metrics();
  const sellable = salesItems.filter((item) => !item[6]);
  const winners = sellable.filter((item) => cpiRate(item) >= 1);
  const risk = sellable.filter((item) => cpiRate(item) < 0.8);
  const giveaways = salesItems.filter((item) => item[6]);
  const categories = [...new Set(sellable.map((item) => item[5]))];
  const winningItems = winners.map((item) => `${item[0]} (${pct(cpiRate(item))} CPI)`).slice(0, 4).join(", ") || "No 100%+ CPI SKU detected";
  const weakItems = risk.map((item) => `${item[0]} (${pct(cpiRate(item))} CPI)`).slice(0, 4).join(", ") || "No below-80% CPI SKU detected";
  const highGmvItems = [...sellable].sort((a, b) => b[1] - a[1]).slice(0, 3).map((item) => `${item[0]} (${money2.format(item[1])})`).join(", ") || "No sales item detected";
  const cpiText = m.completion >= 0.8 ? "Pricing quality improved and stayed above the 80% line." : "Pricing remained under pressure and fell below the 80% line.";
  return `Daily Show Summary

Date: ${showInfo.date}
Show: ${showInfo.showName}
Livestream Hours: ${showInfo.livestreamHours}

GMV: ${money2.format(m.gmv)}
GMV / Hour: ${money2.format(m.gmvPerHour)}
AOV: ${money2.format(m.aov)}
Bookmarks: ${showInfo.bookmarks}
On-Time Start: ${showInfo.onTimeStart}

Profit Margin: ${pct(m.margin)}

Target Price Completion: ${pct(m.completion)}
(80% AOV Line: ${money2.format(m.cpi * 0.8)} | 100% AOV Line: ${money2.format(m.cpi)})

What Was Sold:
- Main categories: ${categories.join(", ") || "No category detected"}
- Winning items: ${winningItems}
- High GMV / volume items: ${highGmvItems}
- Weak / drag items: ${weakItems}

Promotions / Audience Engagement:
- Used: ${giveaways.map((item) => item[0]).join(", ") || "None recorded"}
- Notes: ${opsNotes.giveaway || "No promotion note recorded"}

Livestream Actions / Adjustments:
- ${opsNotes.actions.join("\n- ")}
- Context: ${opsNotes.traffic || "No traffic context recorded"}

Host / Audience Notes:
- ${opsNotes.host || "No host or audience note recorded"}

Inventory / Clearance Progress:
- ${opsNotes.inventory || "No inventory or clearance note recorded"}

KPI Context:
- ${opsNotes.kpiContext || "No KPI context note recorded"}
- Competitor / market context: ${opsNotes.competitor || "No competitor note recorded"}

SUM:
${cpiText} Traffic and bidding context: ${opsNotes.kpiContext} ${opsNotes.traffic} ${opsNotes.competitor} ${opsNotes.inventory}`;
}

function renderRecords() {
  $("#actionChips").innerHTML = actionOptions.map((action) => `<button class="chip ${opsNotes.actions.includes(action) ? "selected" : ""}" data-action="${action}" type="button">${action}</button>`).join("");
  document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
    const action = button.dataset.action;
    opsNotes.actions = opsNotes.actions.includes(action) ? opsNotes.actions.filter((item) => item !== action) : [...opsNotes.actions, action];
    render();
  }));
  const noteFields = [["traffic", "Traffic & audience reaction"], ["giveaway", "Promotion / giveaway usage"], ["host", "Host performance / pacing"], ["inventory", "Inventory / clearance progress"], ["kpiContext", "KPI change context"], ["competitor", "Competitor / market notes"]];
  $("#notesGrid").innerHTML = noteFields.map(([key, label]) => `<label class="note-field"><span>${label}</span><textarea data-note="${key}" rows="5">${opsNotes[key]}</textarea></label>`).join("");
  document.querySelectorAll("[data-note]").forEach((field) => field.addEventListener("input", () => {
    opsNotes[field.dataset.note] = field.value;
    $("#dailyReport").textContent = generatedReport();
  }));
}

function renderAnalyticsPlaceholder() {
  $("#analyticsGrid").innerHTML = metricCard("Weekly GMV", "Import JSON", "dashboard/home_dashboard_data.json") + metricCard("SKU history", "Separate", "Ready for v2 connection") + metricCard("Category review", "Isolated", "Does not affect daily report flow");
}

function render() {
  const m = metrics();
  const sellable = salesItems.filter((item) => !item[6] && item[3] > 0);
  const winners = sellable.filter((item) => cpiRate(item) >= 1).sort((a, b) => cpiRate(b) - cpiRate(a));
  const risk = sellable.filter((item) => cpiRate(item) < 0.8).sort((a, b) => cpiRate(a) - cpiRate(b));
  $("#kpiGrid").innerHTML =
    metricCard("Today GMV", money.format(m.gmv), "From current report data") +
    metricCard("GMV / Hour", money.format(m.gmvPerHour), `${showInfo.livestreamHours} live hours`) +
    metricCard("AOV", money2.format(m.aov), `${m.units} units sold`) +
    metricCard("CPI Rate", pct(m.completion), "AOV / CPI", m.completion >= 1 ? "good" : m.completion >= 0.8 ? "warn" : "danger") +
    metricCard("Profit Margin", pct(m.margin), "GMV minus total cost", m.margin >= 0.2 ? "good" : m.margin >= 0 ? "warn" : "danger") +
    metricCard("Bookmarks", String(showInfo.bookmarks), "Manual show input");
  $("#reportKpis").innerHTML = metricCard("GMV", money2.format(m.gmv)) + metricCard("AOV", money2.format(m.aov)) + metricCard("CPI", money2.format(m.cpi)) + metricCard("Target completion", pct(m.completion));
  $("#alertList").innerHTML = [
    m.completion < 0.7 ? `<p class="alert danger">CPI Rate below 70%</p>` : "",
    m.margin < -0.5 ? `<p class="alert danger">Margin below -50%</p>` : "",
    risk.length ? `<p class="alert warn">${risk.length} SKU below 80% CPI</p>` : "",
    !winners.length ? `<p class="alert warn">No 100%+ CPI SKU today</p>` : "",
    m.completion >= 0.8 && m.margin >= 0 ? `<p class="alert good">Pricing and margin are above the v1 control lines</p>` : ""
  ].join("");
  $("#winnerTable").innerHTML = skuTable(winners);
  $("#riskTable").innerHTML = skuTable(risk);
  renderCpiChart();
  $("#dailyReport").textContent = generatedReport();
  renderRecords();
}

renderNav();
renderShifts();
renderForm();
renderAnalyticsPlaceholder();
renderTrendControls();
renderTrend("#trendChart", dailyMetrics, selectedDailyTrendIndex, (index) => {
  selectedDailyTrendIndex = index;
});
renderTrend("#analyticsTrendChart", weeklyMetrics, selectedWeeklyTrendIndex, (index) => {
  selectedWeeklyTrendIndex = index;
});
renderCpiControls();
render();

$("#newShowButton").addEventListener("click", addDraftShow);
$("#addShowButton").addEventListener("click", addDraftShow);
$("#backButton").addEventListener("click", goBack);

$("#csvInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const rows = parseCsv(await file.text());
  if (!rows.length) {
    $("#csvStatus").textContent = "Could not parse rows. Check that the file has headers and sales data.";
    return;
  }
  salesItems = rows;
  const firstSellable = rows.find((item) => !item[6] && item[3] > 0);
  if (firstSellable) selectedSkuName = firstSellable[0];
  $("#csvStatus").textContent = `${rows.length} rows imported from ${file.name}. KPI and SKU analysis updated.`;
  render();
});

$("#analyticsInput").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const json = JSON.parse(await file.text());
    const weekly = Array.isArray(json.weekly) ? json.weekly.slice(-8).map((week) => ({
      label: week.week || week.label || "Week",
      gmv: week.gmv || 0,
      gmv_per_hour: week.gmv_per_hour,
      aov: week.aov,
      orders: week.orders
    })) : [];
    if (weekly.length) {
      weeklyMetrics = weekly;
      selectedWeeklyTrendIndex = weekly.length - 1;
      renderTrend("#analyticsTrendChart", weeklyMetrics, selectedWeeklyTrendIndex, (index) => {
        selectedWeeklyTrendIndex = index;
      });
    }
    $("#analyticsStatus").textContent = `${weekly.length} weekly rows imported from ${file.name}. Analytics stays separate from Daily Reports.`;
    $("#analyticsGrid").innerHTML = weekly.length ? weekly.map((week) => metricCard(week.label, money.format(week.gmv), `GMV/hr ${week.gmv_per_hour ? money.format(week.gmv_per_hour) : "n/a"} · AOV ${week.aov ? money2.format(week.aov) : "n/a"}`)).join("") : "";
  } catch {
    $("#analyticsStatus").textContent = "Could not read that JSON file. Use dashboard/home_dashboard_data.json.";
  }
});

$("#copyReport").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(generatedReport());
    $("#csvStatus").textContent = "Daily report copied to clipboard.";
  } catch {
    $("#csvStatus").textContent = "Clipboard permission was blocked. Select the report text and copy manually.";
  }
});

$("#markReviewed").addEventListener("click", () => {
  $("#reportStatus").textContent = "Status: Reviewed";
  $("#csvStatus").textContent = "Daily report marked as reviewed.";
});
