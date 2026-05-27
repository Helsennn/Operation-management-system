"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpenText,
  CalendarDays,
  CalendarCheck2,
  CalendarPlus,
  ChartLine,
  CheckCircle2,
  ChevronRight,
  Download,
  Eraser,
  ExternalLink,
  Home as HomeIcon,
  MessageSquareCheck,
  Send,
  StickyNote,
  WandSparkles,
  X,
  type LucideIcon
} from "lucide-react";

type Segment = "today" | "schedule" | "report" | "records" | "analytics";
type TrendMetric = "gmv" | "gmv_per_hour" | "aov";
type CpiView = "all" | "winners" | "optimize" | "risk";
type MagnetMetric =
  | "gmv"
  | "gmvPerHour"
  | "aov"
  | "cpi"
  | "promoCost"
  | "targetCompletion"
  | "profitMargin"
  | "orders"
  | "bookmarks"
  | "winnerCount"
  | "dragCount"
  | "giveawayRatio"
  | "latestExternalDay"
  | "latestWeek"
  | "scheduleCount";

type SidebarMagnet = {
  id: string;
  metric: MagnetMetric;
};

type ActiveLayer =
  | { type: "show"; show: ScheduledShow }
  | { type: "sku"; item: SalesItem }
  | null;

type SalesItem = {
  id: string;
  productName: string;
  totalSales: number;
  orders: number;
  costPerItem: number;
  averagePrice: number;
  category: string;
  isGiveaway: boolean;
};

type GeneratedSalesDataRow = {
  productName: string;
  productDescription: string;
  costPerItem: number | string;
  averagePrice: number | string;
  numberOfOrders: number | string;
  totalSales: number | string;
};

type GeneratedMigrateDataRow = {
  productName: string;
  productDescription: string;
  sku: string;
  numberOfOrders: number;
};

type GeneratedFinanceDataRow = {
  orderNumericId: string;
  productName: string;
  productQuantity: number;
  soldPrice: number;
};

type GeneratedSalesOutputs = {
  sourceFile: string;
  salesData: GeneratedSalesDataRow[];
  migrateData: GeneratedMigrateDataRow[];
  financeData: GeneratedFinanceDataRow[];
  cancelledOrders: string[];
  failedOrders: string[];
};

type ShowInfo = {
  date: string;
  showName: string;
  showType: string;
  startTime: string;
  endTime: string;
  livestreamHours: number;
  host: string;
  operator: string;
  leader: string;
  bookmarks: number;
  onTimeStart: string;
  notes: string;
};

type OpsNotes = {
  actions: string[];
  traffic: string;
  competitor: string;
  inventory: string;
  host: string;
  giveaway: string;
  kpiContext: string;
};

type OpsRecordCategory = "actions" | "traffic" | "giveaway" | "host" | "inventory" | "kpiContext" | "competitor";
type OpsRecordSeverity = "low" | "medium" | "high";

type OpsRecord = {
  id: string;
  date: string;
  showName: string;
  category: OpsRecordCategory;
  severity: OpsRecordSeverity;
  note: string;
  createdAt: string;
};

type ReportSnapshot = {
  id: string;
  date: string;
  showName: string;
  report: string;
  createdAt: string;
};

type StrategyGroup = {
  id: string;
  label: string;
  items: string[];
};

type HostSessionMetric = {
  host: string;
  gmv: number;
  orders: number;
};

type ScheduledShow = {
  id: string;
  date: string;
  title: string;
  startTime: string;
  endTime: string;
  hosts: string[];
  operators: string[];
  showType: string;
  productFocus: string;
  giveawayPlan: string;
  sessionGmv: number;
  sessionOrders: number;
  hostMetrics?: HostSessionMetric[];
  notes: string;
};

type TeamRole = "host" | "operator" | "both";

type TeamMember = {
  id: string;
  name: string;
  role: TeamRole;
  active: boolean;
};

type AvailabilitySlot = {
  id: string;
  host: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  source: string;
  selected: boolean;
};

type TrendPoint = {
  label: string;
  date?: string;
  gmv: number;
  gmv_per_hour?: number;
  aov?: number;
  orders?: number;
};

type ExternalDailyPoint = {
  date: string;
  gmv: number;
  orders: number;
  buyers: number;
};

type ExternalWeeklyPoint = {
  week: string;
  gmv: number;
  orders: number;
  buyers: number;
  aov: number;
  gmv_per_hour?: number;
  wow_gmv_pct?: number;
};

type ExternalDashboardData = {
  generated_at?: string;
  source_note?: string;
  latest_week?: string;
  weekly?: ExternalWeeklyPoint[];
  latest_daily?: ExternalDailyPoint[];
};

const navItems: Array<{ id: Segment; label: string; description: string; Icon: LucideIcon }> = [
  { id: "today", label: "Today", description: "Today snapshot", Icon: HomeIcon },
  { id: "schedule", label: "Schedule", description: "Multi-show day plan", Icon: CalendarDays },
  { id: "report", label: "Daily Report", description: "CSV to summary", Icon: BookOpenText },
  { id: "records", label: "Records", description: "Ops context notes", Icon: StickyNote },
  { id: "analytics", label: "Analytics", description: "Independent data view", Icon: ChartLine }
];

const larkWebUrl = "https://www.larksuite.com/";
const larkAppOpenUrl = "https://applink.larksuite.com/client/op/open";
const weeklyDashboardUrl = "https://helsennn.github.io/report-cockpit/";

function parseDashboardDataScript(scriptText: string): ExternalDashboardData | null {
  const match = scriptText.match(/window\.DASHBOARD_DATA\s*=\s*([\s\S]*?);\s*$/);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as ExternalDashboardData;
  } catch {
    return null;
  }
}

const initialStrategyGroups: StrategyGroup[] = [
  {
    id: "strategy-pacing",
    label: "Pacing",
    items: ["Slowed auction pace", "Extended stream", "Ended early"]
  },
  {
    id: "strategy-product",
    label: "Product",
    items: ["Pushed low-CPI SKUs", "Held back high-cost SKUs", "Changed product order", "Focused on branded products"]
  },
  {
    id: "strategy-promotion",
    label: "Promotion",
    items: ["Saved giveaways", "Used audience engagement push", "Held premium gift cards"]
  },
  {
    id: "strategy-market",
    label: "Market",
    items: ["Reacted to competitor stream", "Protected margin during weak traffic", "Switched to clearance items"]
  }
];

const sampleItems: SalesItem[] = [
  {
    id: "sample-smartgloo-glue-gun",
    productName: "Smartgloo Cordless Hot Glue Gun",
    totalSales: 282.6,
    orders: 12,
    costPerItem: 17.5,
    averagePrice: 23.55,
    category: "Tools",
    isGiveaway: false
  },
  {
    id: "sample-koorui-monitor",
    productName: "KOORUI 24 Monitor",
    totalSales: 621.4,
    orders: 7,
    costPerItem: 67.2,
    averagePrice: 88.77,
    category: "Monitor",
    isGiveaway: false
  },
  {
    id: "sample-power-bank-giveaway",
    productName: "Power Bank Giveaway",
    totalSales: 0,
    orders: 6,
    costPerItem: 8.8,
    averagePrice: 0,
    category: "Giveaway",
    isGiveaway: true
  },
  {
    id: "sample-kitchen-storage-rack",
    productName: "Kitchen Storage Rack",
    totalSales: 115.8,
    orders: 10,
    costPerItem: 18.6,
    averagePrice: 11.58,
    category: "Kitchen",
    isGiveaway: false
  }
];

const initialShow: ShowInfo = {
  date: "2026-05-26",
  showName: "Home Daily Show",
  showType: "Normal Show",
  startTime: "11:00",
  endTime: "16:00",
  livestreamHours: 5,
  host: "Host A",
  operator: "Operator A",
  leader: "Leader A",
  bookmarks: 420,
  onTimeStart: "YES",
  notes: "Focused on home tools, small electronics, and monitor test inventory."
};

const initialNotes: OpsNotes = {
  actions: ["Slowed auction pace", "Held back high-cost SKUs", "Saved giveaways"],
  traffic:
    "Traffic was stable early, then bidding depth softened during the second half of the show.",
  competitor:
    "DailyDeal became active near the late session window, which affected bidding momentum.",
  inventory:
    "Fresh inventory was limited because the team was focused on warehouse cleanup and SKU organization.",
  host:
    "Host adjusted pace appropriately and avoided forcing high-cost products into weak bidding windows.",
  giveaway:
    "Power banks were used. Premium headphones and larger gift cards were held back to control spend.",
  kpiContext:
    "GMV was supported by monitor and tool demand, while margin depended on holding back high-cost items during weaker bidding windows."
};

const initialOpsRecords: OpsRecord[] = [
  {
    id: "record-sample-traffic",
    date: initialShow.date,
    showName: initialShow.showName,
    category: "traffic",
    severity: "medium",
    note: initialNotes.traffic,
    createdAt: "2026-05-26T12:00:00.000Z"
  },
  {
    id: "record-sample-competitor",
    date: initialShow.date,
    showName: initialShow.showName,
    category: "competitor",
    severity: "high",
    note: initialNotes.competitor,
    createdAt: "2026-05-26T12:05:00.000Z"
  },
  {
    id: "record-sample-inventory",
    date: initialShow.date,
    showName: initialShow.showName,
    category: "inventory",
    severity: "medium",
    note: initialNotes.inventory,
    createdAt: "2026-05-26T12:10:00.000Z"
  }
];

const initialScheduledShows: ScheduledShow[] = [
  {
    id: "show-morning-home-tools",
    date: "2026-05-26",
    title: "Morning Home Tools",
    startTime: "10:30 AM",
    endTime: "1:30 PM",
    hosts: ["Host A", "Host B"],
    operators: ["Operator A"],
    showType: "Normal Show",
    productFocus: "Home tools + kitchen",
    giveawayPlan: "Power bank, small gift cards",
    sessionGmv: 2380,
    sessionOrders: 216,
    hostMetrics: [
      { host: "Host A", gmv: 1200, orders: 110 },
      { host: "Host B", gmv: 1180, orders: 106 }
    ],
    notes: "Use stronger low-CPI SKUs early while traffic warms up."
  },
  {
    id: "show-afternoon-monitor-test",
    date: "2026-05-26",
    title: "Afternoon Monitor Test",
    startTime: "2:00 PM",
    endTime: "5:30 PM",
    hosts: ["Host C"],
    operators: ["Operator A", "Operator B"],
    showType: "Test Show",
    productFocus: "Monitors + accessories",
    giveawayPlan: "Hold premium giveaways unless bidding is strong",
    sessionGmv: 3140,
    sessionOrders: 188,
    hostMetrics: [{ host: "Host C", gmv: 3140, orders: 188 }],
    notes: "Avoid high-cost monitor units if traffic drops."
  },
  {
    id: "show-clearance-push",
    date: "2026-05-27",
    title: "Clearance Push",
    startTime: "12:00 PM",
    endTime: "5:30 PM",
    hosts: ["Host B"],
    operators: ["Operator B", "Operator C"],
    showType: "Clearance Show",
    productFocus: "Old SKUs, accessories",
    giveawayPlan: "Held until traffic confirms",
    sessionGmv: 1860,
    sessionOrders: 201,
    hostMetrics: [{ host: "Host B", gmv: 1860, orders: 201 }],
    notes: "Focus on cleaning old inventory without forcing high-cost SKUs."
  },
  {
    id: "show-branded-event-block",
    date: "2026-05-28",
    title: "Branded Event Block",
    startTime: "10:30 AM",
    endTime: "3:30 PM",
    hosts: ["Host C", "Host D"],
    operators: ["Operator A"],
    showType: "Event Show",
    productFocus: "Apple / branded items",
    giveawayPlan: "Gift card ladder",
    sessionGmv: 4280,
    sessionOrders: 245,
    hostMetrics: [
      { host: "Host C", gmv: 2500, orders: 138 },
      { host: "Host D", gmv: 1780, orders: 107 }
    ],
    notes: "Run branded items during strongest traffic windows."
  }
];

const initialTeamMembers: TeamMember[] = [
  { id: "team-host-a", name: "Host A", role: "host", active: true },
  { id: "team-host-b", name: "Host B", role: "host", active: true },
  { id: "team-host-c", name: "Host C", role: "host", active: true },
  { id: "team-host-d", name: "Host D", role: "host", active: true },
  { id: "team-operator-a", name: "Operator A", role: "operator", active: true },
  { id: "team-operator-b", name: "Operator B", role: "operator", active: true },
  { id: "team-operator-c", name: "Operator C", role: "operator", active: true }
];

const sampleAvailabilityText = `Mia: Mon 10am-2pm, Wed 12pm-5pm
Kevin: Tue 3-7pm / Thu 11am-4pm
Lily: 周五 1pm-6pm, 周日 10am-2pm
Nick: I'm ok for Thursday Mon for 2-4 pm, Friday at 9 am-12 pm`;

const sampleDailyMetrics: TrendPoint[] = [
  { label: "Mon", gmv: 7420, gmv_per_hour: 928, aov: 11.84, orders: 627 },
  { label: "Tue", gmv: 9150, gmv_per_hour: 1046, aov: 12.92, orders: 708 },
  { label: "Wed", gmv: 6680, gmv_per_hour: 835, aov: 10.76, orders: 621 },
  { label: "Thu", gmv: 10440, gmv_per_hour: 1193, aov: 13.38, orders: 780 },
  { label: "Fri", gmv: 12120, gmv_per_hour: 1347, aov: 14.05, orders: 863 },
  { label: "Sat", gmv: 13880, gmv_per_hour: 1424, aov: 14.62, orders: 949 },
  { label: "Sun", gmv: 11260, gmv_per_hour: 1251, aov: 13.76, orders: 818 }
];

const trendOptions: Array<{ id: TrendMetric; label: string }> = [
  { id: "gmv", label: "GMV" },
  { id: "gmv_per_hour", label: "GMV / Hour" },
  { id: "aov", label: "AOV" }
];

const cpiViewOptions: Array<{ id: CpiView; label: string }> = [
  { id: "all", label: "All" },
  { id: "winners", label: "100%+" },
  { id: "optimize", label: "80-100%" },
  { id: "risk", label: "Below 80%" }
];

const magnetMetricOptions: Array<{ id: MagnetMetric; label: string }> = [
  { id: "gmv", label: "GMV" },
  { id: "gmvPerHour", label: "GMV / Hour" },
  { id: "aov", label: "AOV" },
  { id: "cpi", label: "CPI" },
  { id: "promoCost", label: "Promo Cost" },
  { id: "targetCompletion", label: "Target Completion" },
  { id: "profitMargin", label: "Profit Margin" },
  { id: "orders", label: "Orders" },
  { id: "bookmarks", label: "Bookmarks" },
  { id: "winnerCount", label: "100%+ SKUs" },
  { id: "dragCount", label: "Drag SKUs" },
  { id: "giveawayRatio", label: "Giveaway Ratio" },
  { id: "latestExternalDay", label: "Latest External Day" },
  { id: "latestWeek", label: "Latest Week" },
  { id: "scheduleCount", label: "Scheduled Shows" }
];

const recordCategoryOptions: Array<{ id: OpsRecordCategory | "all"; label: string }> = [
  { id: "all", label: "All Records" },
  { id: "traffic", label: "Traffic" },
  { id: "giveaway", label: "Promotion" },
  { id: "host", label: "Host / Pacing" },
  { id: "inventory", label: "Inventory" },
  { id: "kpiContext", label: "Game / Strategy" },
  { id: "competitor", label: "Competitor" },
  { id: "actions", label: "Actions" }
];

const recordCategoryLabels: Record<OpsRecordCategory, string> = {
  actions: "Actions",
  traffic: "Traffic",
  giveaway: "Promotion",
  host: "Host / Pacing",
  inventory: "Inventory",
  kpiContext: "Game / Strategy",
  competitor: "Competitor"
};

const teamRoleOptions: Array<{ id: TeamRole; label: string }> = [
  { id: "host", label: "Host" },
  { id: "operator", label: "Operator" },
  { id: "both", label: "Both" }
];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const decimalCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

function parseNumber(value: string | undefined) {
  if (!value) return 0;
  const normalized = value.replace(/[$,%]/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function findColumn(headers: string[], candidates: string[]) {
  const lowerHeaders = headers.map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ""));
  return candidates
    .map((candidate) => candidate.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .map((candidate) => lowerHeaders.findIndex((header) => header.includes(candidate)))
    .find((index) => index !== -1);
}

function inferCategory(productName: string) {
  const name = productName.toLowerCase();
  if (name.includes("giveaway") || name.includes("gift card") || name.includes("amazon")) return "Giveaway";
  if (name.includes("monitor")) return "Monitor";
  if (name.includes("apple") || name.includes("airpod") || name.includes("iphone")) return "Apple / Branded";
  if (name.includes("power") || name.includes("charger") || name.includes("cable")) return "Electronics";
  if (name.includes("kitchen") || name.includes("rack") || name.includes("storage")) return "Kitchen";
  if (name.includes("tool") || name.includes("glue") || name.includes("drill")) return "Tools";
  if (name.includes("beauty") || name.includes("hair")) return "Beauty";
  return "Home";
}

function createSkuId(productName: string, index: number) {
  const slug = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 56);
  return `sku-${index + 1}-${slug || "item"}`;
}

function getSkuMergeKey(item: SalesItem) {
  return `${item.productName.trim().toLowerCase()}::${item.category}`;
}

function aggregateSalesItems(items: SalesItem[]) {
  const merged = new Map<string, SalesItem>();

  items.forEach((item) => {
    const key = getSkuMergeKey(item);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, item);
      return;
    }

    const orders = existing.orders + item.orders;
    const totalSales = existing.totalSales + item.totalSales;
    const totalCost = existing.costPerItem * existing.orders + item.costPerItem * item.orders;
    merged.set(key, {
      ...existing,
      totalSales,
      orders,
      costPerItem: orders ? totalCost / orders : 0,
      averagePrice: orders ? totalSales / orders : 0,
      isGiveaway: existing.isGiveaway || item.isGiveaway
    });
  });

  return Array.from(merged.values());
}

function normalizeHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getCsvCell(row: string[], headers: string[], candidates: string[]) {
  const index = findColumn(headers, candidates);
  return index === undefined ? "" : row[index] ?? "";
}

function removeProductNumber(productName: string) {
  return (productName || "").split("#", 1)[0].trim();
}

function buildGeneratedSalesOutputs(csv: string, sourceFile: string): GeneratedSalesOutputs {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return {
      sourceFile,
      salesData: [],
      migrateData: [],
      financeData: [],
      cancelledOrders: [],
      failedOrders: []
    };
  }

  const rawHeaders = splitCsvLine(lines[0]);
  const headers = rawHeaders.map((header) => {
    const normalized = normalizeHeader(header);
    const headerMap: Record<string, string> = {
      ordernumericid: "order numeric id",
      buyerusername: "buyer",
      productname: "product name",
      productdescription: "product description",
      productquantity: "product quantity",
      originalitemprice: "sold price",
      cancelledorfailed: "cancelled or failed",
      costperitem: "cost per item"
    };
    return headerMap[normalized] ?? header;
  });

  const cancelledOrders: string[] = [];
  const failedOrders: string[] = [];
  const normalizedRows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const rawProductName = getCsvCell(cells, headers, ["product name", "product", "item name", "title"]);
    const status = getCsvCell(cells, headers, ["cancelled or failed", "cancelled_or_failed", "status"]).toLowerCase().trim();
    const productName = removeProductNumber(rawProductName);

    if (status === "cancelled" && productName && !cancelledOrders.includes(productName)) {
      cancelledOrders.push(productName);
    } else if (status === "failed" && productName && !failedOrders.includes(productName)) {
      failedOrders.push(productName);
    } else if (productName && failedOrders.includes(productName)) {
      failedOrders.splice(failedOrders.indexOf(productName), 1);
    }

    return {
      orderNumericId: getCsvCell(cells, headers, ["order numeric id", "order_numeric_id", "order id", "order_id"]),
      productName,
      productDescription: getCsvCell(cells, headers, ["product description", "description"]),
      productQuantity: parseNumber(getCsvCell(cells, headers, ["product quantity", "quantity", "qty"])) || 0,
      soldPrice: parseNumber(getCsvCell(cells, headers, ["sold price", "original item price", "original_item_price", "price"])),
      status,
      costPerItem: parseNumber(getCsvCell(cells, headers, ["cost per item", "cost_per_item", "cost", "cpi"])),
      sku: getCsvCell(cells, headers, ["sku"])
    };
  });

  const successfulRows = normalizedRows.filter((row) => row.status !== "cancelled" && row.status !== "failed");
  const salesGroups = new Map<string, {
    productName: string;
    productDescription: string;
    costPerItem: number;
    isBundle: boolean;
    count: number;
    totalSales: number;
  }>();
  const migrateGroups = new Map<string, GeneratedMigrateDataRow>();

  successfulRows.forEach((row) => {
    const isBundle = row.productName.toLowerCase().includes("bundle");
    const salesKey = `${row.productName}::${row.productDescription}::${isBundle}::${row.costPerItem}`;
    const existingSales = salesGroups.get(salesKey);
    if (existingSales) {
      existingSales.count += 1;
      existingSales.totalSales += row.soldPrice;
    } else {
      salesGroups.set(salesKey, {
        productName: row.productName,
        productDescription: row.productDescription,
        costPerItem: row.costPerItem,
        isBundle,
        count: 1,
        totalSales: row.soldPrice
      });
    }

    const migrateKey = `${row.productName}::${row.productDescription}::${row.sku}`;
    const existingMigrate = migrateGroups.get(migrateKey);
    if (existingMigrate) {
      existingMigrate.numberOfOrders += 1;
    } else {
      migrateGroups.set(migrateKey, {
        productName: row.productName,
        productDescription: row.productDescription,
        sku: row.sku,
        numberOfOrders: 1
      });
    }
  });

  const salesData: GeneratedSalesDataRow[] = Array.from(salesGroups.values())
    .sort((a, b) => Number(b.isBundle) - Number(a.isBundle) || b.totalSales / b.count - a.totalSales / a.count)
    .map((row) => ({
      productName: row.productName,
      productDescription: row.productDescription,
      costPerItem: row.costPerItem,
      averagePrice: row.count ? row.totalSales / row.count : 0,
      numberOfOrders: row.count,
      totalSales: row.totalSales
    }));

  if (cancelledOrders.length || failedOrders.length) {
    salesData.push(blankSalesDataRow(), { ...blankSalesDataRow(), productName: "Cancelled Orders" });
    cancelledOrders.forEach((productName) => salesData.push({ ...blankSalesDataRow(), productName }));
    salesData.push(blankSalesDataRow(), { ...blankSalesDataRow(), productName: "Failed Orders" });
    failedOrders.forEach((productName) => salesData.push({ ...blankSalesDataRow(), productName }));
  }

  const migrateData = Array.from(migrateGroups.values()).sort((a, b) => b.numberOfOrders - a.numberOfOrders);
  const financeData = successfulRows
    .map((row) => ({
      orderNumericId: row.orderNumericId,
      productName: row.productName,
      productQuantity: row.productQuantity,
      soldPrice: row.soldPrice
    }))
    .sort((a, b) => b.productName.localeCompare(a.productName));

  return {
    sourceFile,
    salesData,
    migrateData,
    financeData,
    cancelledOrders,
    failedOrders
  };
}

function blankSalesDataRow(): GeneratedSalesDataRow {
  return {
    productName: "",
    productDescription: "",
    costPerItem: "",
    averagePrice: "",
    numberOfOrders: "",
    totalSales: ""
  };
}

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsv(headers: string[], rows: Array<Array<string | number>>) {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
}

function salesDataRowsToSalesItems(rows: GeneratedSalesDataRow[]) {
  return rows
    .filter((row) => row.productName && row.productName !== "Cancelled Orders" && row.productName !== "Failed Orders")
    .map<SalesItem>((row, index) => {
      const productName = String(row.productName);
      const totalSales = typeof row.totalSales === "number" ? row.totalSales : parseNumber(String(row.totalSales));
      const orders = typeof row.numberOfOrders === "number" ? row.numberOfOrders : parseNumber(String(row.numberOfOrders));
      const costPerItem = typeof row.costPerItem === "number" ? row.costPerItem : parseNumber(String(row.costPerItem));
      const averagePrice = typeof row.averagePrice === "number" ? row.averagePrice : parseNumber(String(row.averagePrice));
      const category = inferCategory(productName);

      return {
        id: createSkuId(productName, index),
        productName,
        totalSales,
        orders,
        costPerItem,
        averagePrice,
        category,
        isGiveaway: category === "Giveaway" || totalSales === 0 || productName.toLowerCase().includes("giveaway")
      };
    });
}

function parseSalesCsv(csv: string): SalesItem[] {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  const productIndex = findColumn(headers, ["product name", "product", "item name", "title"]) ?? 0;
  const totalIndex = findColumn(headers, ["total sales", "totalsales", "sales", "gmv"]) ?? 1;
  const ordersIndex = findColumn(headers, ["number of orders", "orders", "quantity", "qty", "units"]) ?? 2;
  const costIndex = findColumn(headers, ["cost per item", "cost", "cpi"]) ?? 3;
  const averageIndex = findColumn(headers, ["average price", "avg price", "average selling price"]) ?? totalIndex;

  const rows = lines.slice(1).map((line, rowIndex) => {
    const cells = splitCsvLine(line);
    const productName = cells[productIndex] || "Unnamed product";
    const totalSales = parseNumber(cells[totalIndex]);
    const orders = parseNumber(cells[ordersIndex]) || 1;
    const costPerItem = parseNumber(cells[costIndex]);
    const averagePrice =
      averageIndex === totalIndex ? totalSales / orders : parseNumber(cells[averageIndex]) || totalSales / orders;
    const category = inferCategory(productName);

    return {
      id: createSkuId(productName, rowIndex),
      productName,
      totalSales,
      orders,
      costPerItem,
      averagePrice,
      category,
      isGiveaway:
        category === "Giveaway" ||
        totalSales === 0 ||
        productName.toLowerCase().includes("giveaway")
    };
  });

  return aggregateSalesItems(rows);
}

function getCpiRate(item: SalesItem) {
  return item.costPerItem ? item.averagePrice / item.costPerItem : 0;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${(value * 100).toFixed(1)}%`;
}

function formatTrendValue(metric: TrendMetric, value: number) {
  if (metric === "aov") return decimalCurrency.format(value);
  return currency.format(value);
}

function compactReportText(value: string | undefined, fallback: string, maxLength = 150) {
  const normalized = (value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return fallback;
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function shortProductName(value: string) {
  const cleaned = value
    .replace(/^HOU:\s*/i, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/#\d+\b/g, "")
    .replace(/\b(with|for|and|the|set|pack|pcs|piece|pieces|new|brand)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length <= 4) return cleaned || value;
  return words.slice(0, 4).join(" ");
}

function formatCompactItems(items: SalesItem[], fallback: string, limit = 3) {
  const selected = items.slice(0, limit).map((item) => shortProductName(item.productName));
  return selected.length ? selected.join(", ") : fallback;
}

function formatReportItems(items: string[], fallback: string, limit = 3) {
  const selected = items.filter(Boolean).slice(0, limit);
  return selected.length ? selected.join("; ") : fallback;
}

function getTrendValue(point: TrendPoint, metric: TrendMetric) {
  return point[metric] ?? 0;
}

function buildDailyTrendPoint(items: SalesItem[], dateValue: string, livestreamHours: number): TrendPoint {
  const date = dateValue || new Date().toISOString().slice(0, 10);
  const sellableItems = items.filter((item) => !item.isGiveaway);
  const gmv = sellableItems.reduce((sum, item) => sum + item.totalSales, 0);
  const orders = sellableItems.reduce((sum, item) => sum + item.orders, 0);
  const aov = orders ? gmv / orders : 0;
  const gmvPerHour = livestreamHours ? gmv / livestreamHours : 0;

  return {
    label: formatDailyTrendLabel(date),
    date,
    gmv,
    gmv_per_hour: gmvPerHour,
    aov,
    orders
  };
}

function formatScheduleDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatShortScheduleDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${Number(match[2])}/${Number(match[3])}`;
}

function formatDailyTrendLabel(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value;
  return `${formatShortScheduleDate(value)} ${getScheduleDayName(value)}`;
}

function getScheduleDayName(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return normalizeDayLabel(value);
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function inferDateFromFileName(filename: string, fallbackDate: string) {
  const yearMatch = filename.match(/(20\d{2})[-_.\s](\d{1,2})[-_.\s](\d{1,2})/);
  if (yearMatch) {
    const date = new Date(Number(yearMatch[1]), Number(yearMatch[2]) - 1, Number(yearMatch[3]));
    if (!Number.isNaN(date.getTime())) return formatDateInput(date);
  }

  const shortMatch = filename.match(/(?:^|[^0-9])(\d{1,2})[-_.\s](\d{1,2})(?:[^0-9]|$)/);
  if (shortMatch) {
    const fallbackYear = Number(fallbackDate.match(/^(\d{4})/)?.[1] ?? new Date().getFullYear());
    const date = new Date(fallbackYear, Number(shortMatch[1]) - 1, Number(shortMatch[2]));
    if (!Number.isNaN(date.getTime())) return formatDateInput(date);
  }

  return "";
}

function addDays(dateValue: string, offset: number) {
  const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  date.setDate(date.getDate() + offset);
  return formatDateInput(date);
}

function getAvailabilityDayOffset(day: string) {
  const normalized = normalizeDayLabel(day);
  const offsets: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6
  };
  return offsets[normalized] ?? 0;
}

function resolveAvailabilityDate(day: string, weekStartDate: string) {
  return addDays(weekStartDate, getAvailabilityDayOffset(day));
}

function getPersonTone(name: string) {
  const normalized = name.trim().toLowerCase();
  const hash = normalized.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return hash % 8;
}

function getScheduleSortKey(show: ScheduledShow) {
  const dateKey = /^\d{4}-\d{2}-\d{2}$/.test(show.date) ? show.date : `9999-${show.date}`;
  return `${dateKey}-${String(parseTimeMinutes(show.startTime)).padStart(4, "0")}-${show.title}`;
}

function splitListInput(value: string) {
  return value
    .split(/[,，/、\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toggleName(list: string[], name: string) {
  const normalized = name.trim();
  if (!normalized) return list;
  const exists = list.some((item) => item.trim().toLowerCase() === normalized.toLowerCase());
  return exists ? list.filter((item) => item.trim().toLowerCase() !== normalized.toLowerCase()) : [...list, normalized];
}

function parseTimeMinutes(value: string) {
  const match = value.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return 0;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const period = match[3]?.toUpperCase();
  if (period === "PM" && hour < 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

function formatExcelTime(value: string) {
  const minutes = parseTimeMinutes(value);
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getLiveHours(startTime: string, endTime: string) {
  const start = parseTimeMinutes(startTime);
  let end = parseTimeMinutes(endTime);
  if (end <= start) end += 24 * 60;
  return Math.max((end - start) / 60, 0);
}

function getNightLiveHours(startTime: string, endTime: string) {
  const start = parseTimeMinutes(startTime);
  let end = parseTimeMinutes(endTime);
  if (end <= start) end += 24 * 60;
  const nightStart = 21 * 60;
  const nightEnd = 30 * 60;
  const overlap = Math.max(0, Math.min(end, nightEnd) - Math.max(start, nightStart));
  return overlap / 60;
}

function getShowHostMetrics(show: ScheduledShow) {
  const hosts = show.hosts.map((host) => host.trim()).filter(Boolean);
  const savedMetrics = show.hostMetrics ?? [];

  return hosts.map((host) => {
    const existing = savedMetrics.find((metric) => metric.host.trim().toLowerCase() === host.toLowerCase());
    if (existing) return { host, gmv: existing.gmv || 0, orders: existing.orders || 0 };
    if (hosts.length === 1) return { host, gmv: show.sessionGmv || 0, orders: show.sessionOrders || 0 };
    return { host, gmv: 0, orders: 0 };
  });
}

function getShowHostTotals(show: ScheduledShow) {
  return getShowHostMetrics(show).reduce(
    (totals, metric) => ({
      gmv: totals.gmv + metric.gmv,
      orders: totals.orders + metric.orders
    }),
    { gmv: 0, orders: 0 }
  );
}

function formatShowHostSummary(show: ScheduledShow) {
  const totals = getShowHostTotals(show);
  return `${decimalCurrency.format(totals.gmv)} · ${Math.round(totals.orders).toLocaleString()} orders`;
}

function excelEscape(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nameFillColor(name: string) {
  const colors = ["#b4a7d6", "#c9daf8", "#d9ead3", "#ffe599", "#a2c4c9", "#fff2cc", "#ffff00"];
  const clean = name.trim();
  const total = clean.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return colors[total % colors.length];
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  const userAgent = window.navigator.userAgent;
  const touchDevice = window.matchMedia?.("(pointer: coarse)").matches;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) || touchDevice;
}

function normalizeDayLabel(value: string) {
  const key = value.toLowerCase();
  if (["monday", "mon", "周一", "星期一", "礼拜一"].includes(key)) return "Mon";
  if (["tuesday", "tue", "tues", "周二", "星期二", "礼拜二"].includes(key)) return "Tue";
  if (["wednesday", "wed", "周三", "星期三", "礼拜三"].includes(key)) return "Wed";
  if (["thursday", "thu", "thur", "thurs", "周四", "星期四", "礼拜四"].includes(key)) return "Thu";
  if (["friday", "fri", "周五", "星期五", "礼拜五"].includes(key)) return "Fri";
  if (["saturday", "sat", "周六", "星期六", "礼拜六"].includes(key)) return "Sat";
  if (["sunday", "sun", "周日", "周天", "星期日", "星期天", "礼拜日", "礼拜天"].includes(key)) return "Sun";
  return value;
}

function normalizePeriod(value?: string) {
  if (!value) return "";
  const cleaned = value.toLowerCase().replace(/\./g, "");
  if (["am", "morning", "早上", "上午"].includes(cleaned)) return "AM";
  if (["pm", "afternoon", "evening", "night", "中午", "下午", "晚上"].includes(cleaned)) return "PM";
  return "";
}

function normalizeTimeLabel(
  hourText: string,
  minuteText: string | undefined,
  periodText: string | undefined,
  pairedHourText: string,
  pairedPeriodText: string | undefined,
  isStart: boolean
) {
  const hour = Number(hourText);
  const pairedHour = Number(pairedHourText);
  const minute = minuteText ? minuteText.padStart(2, "0") : "00";
  let period = normalizePeriod(periodText);
  const pairedPeriod = normalizePeriod(pairedPeriodText);

  if (!period && pairedPeriod) {
    period = isStart && pairedPeriod === "PM" && hour > pairedHour ? "AM" : pairedPeriod;
  }

  if (!period) return `${hour}:${minute}`;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute} ${period}`;
}

function parseHostAvailability(text: string): AvailabilitySlot[] {
  const dayPattern =
    /monday|mon|tuesday|tues|tue|wednesday|wed|thursday|thurs|thur|thu|friday|fri|saturday|sat|sunday|sun|周一|星期一|礼拜一|周二|星期二|礼拜二|周三|星期三|礼拜三|周四|星期四|礼拜四|周五|星期五|礼拜五|周六|星期六|礼拜六|周日|周天|星期日|星期天|礼拜日|礼拜天/gi;
  const timeRangePattern =
    /(?:(morning|afternoon|evening|night|早上|上午|中午|下午|晚上)\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\s*(?:-|–|—|to|until|till|through|到|至|~)\s*(?:(morning|afternoon|evening|night|早上|上午|中午|下午|晚上)\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/gi;

  return text
    .split(/\r?\n/)
    .flatMap((rawLine, lineIndex) => {
      const line = rawLine.trim();
      if (!line) return [];
      const dayMatches = Array.from(line.matchAll(dayPattern));
      if (!dayMatches.length) return [];

      const colonIndex = line.search(/[:：]/);
      const firstDayIndex = dayMatches[0].index ?? 0;
      const hostSource = colonIndex > -1 ? line.slice(0, colonIndex) : line.slice(0, firstDayIndex);
      const host = hostSource
        .replace(/next week|available|availability|可用|有空|时间|下周/gi, "")
        .replace(/[-–—,，;；/]/g, " ")
        .trim() || "Unassigned host";

      const ranges = Array.from(line.matchAll(timeRangePattern));

      return ranges.flatMap((range, rangeIndex) => {
        const rangeIndexInLine = range.index ?? 0;
        const previousRange = ranges[rangeIndex - 1];
        const previousRangeEnd = previousRange
          ? (previousRange.index ?? 0) + previousRange[0].length
          : colonIndex > -1
            ? colonIndex + 1
            : 0;
        const explicitDays = dayMatches.filter((match) => {
          const dayIndex = match.index ?? 0;
          return dayIndex >= previousRangeEnd && dayIndex <= rangeIndexInLine;
        });
        const nearestDay = [...dayMatches]
          .reverse()
          .find((match) => (match.index ?? 0) <= rangeIndexInLine);
        const daysForRange = explicitDays.length ? explicitDays : nearestDay ? [nearestDay] : [dayMatches[0]];
        const startPeriod = range[4] || range[1];
        const endPeriod = range[8] || range[5];
        const startTime = normalizeTimeLabel(range[2], range[3], startPeriod, range[6], endPeriod, true);
        const endTime = normalizeTimeLabel(range[6], range[7], endPeriod, range[2], startPeriod, false);

        return daysForRange.map((dayMatch, dayIndex) => {
          const day = normalizeDayLabel(dayMatch[0]);
          return {
            id: `${host}-${day}-${startTime}-${endTime}-${lineIndex}-${rangeIndex}-${dayIndex}`.replace(/\s+/g, "-"),
            host,
            day,
            date: "",
            startTime,
            endTime,
            source: line,
            selected: false
          };
        });
      });
    });
}

function MetricCard({
  label,
  value,
  tone = "neutral",
  helper
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn" | "danger";
  helper?: string;
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {helper ? <p>{helper}</p> : null}
    </article>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label
}: {
  options: Array<{ id: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div className="segmented-control" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          aria-pressed={value === option.id}
          className={value === option.id ? "active" : ""}
          key={option.id}
          onClick={() => onChange(option.id)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function TrendChart({
  data,
  metric,
  selectedIndex,
  onSelect
}: {
  data: TrendPoint[];
  metric: TrendMetric;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const width = 760;
  const height = 250;
  const padding = { top: 22, right: 24, bottom: 44, left: 54 };
  const values = data.map((week) => getTrendValue(week, metric));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const points = data.map((point, index) => {
    const x = padding.left + (data.length <= 1 ? innerWidth / 2 : (index / (data.length - 1)) * innerWidth);
    const y = padding.top + innerHeight - ((getTrendValue(point, metric) - min) / range) * innerHeight;
    return { x, y, point, value: getTrendValue(point, metric) };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  function handlePointKey(event: KeyboardEvent<SVGCircleElement>, index: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(index);
    }
  }

  return (
    <div className="chart-scroll">
      <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${metric} trend chart`}>
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} />
        <text x={padding.left} y={18}>{formatTrendValue(metric, max)}</text>
        <text x={padding.left} y={height - 12}>{formatTrendValue(metric, min)}</text>
        <path d={path} />
      {points.map((point, index) => (
          <g key={`${point.point.label}-${index}`}>
            <circle
              aria-label={`${point.point.label}: ${formatTrendValue(metric, point.value)}`}
              className={index === selectedIndex ? "selected" : ""}
              cx={point.x}
              cy={point.y}
              onClick={() => onSelect(index)}
              onKeyDown={(event) => handlePointKey(event, index)}
              r={index === selectedIndex ? 7 : 5}
              role="button"
              tabIndex={0}
            />
            <text className="axis-label" x={point.x} y={height - 24}>{point.point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function DailyOverviewChart({ data }: { data: ExternalDailyPoint[] }) {
  const maxGmv = Math.max(...data.map((day) => day.gmv), 1);

  return (
    <div className="daily-overview-chart" aria-label="Latest daily GMV overview">
      {data.map((day, index) => (
        <article className="daily-overview-bar" key={`${day.date}-${index}`}>
          <div>
            <span>{formatShortScheduleDate(day.date)}</span>
            <strong>{currency.format(day.gmv)}</strong>
            <small>{day.orders.toLocaleString()} orders · {day.buyers.toLocaleString()} buyers</small>
          </div>
          <div className="daily-bar-track" aria-hidden="true">
            <span style={{ width: `${Math.max((day.gmv / maxGmv) * 100, 3)}%` }} />
          </div>
        </article>
      ))}
    </div>
  );
}

function CpiBarChart({
  rows,
  selectedSkuId,
  onSelect
}: {
  rows: SalesItem[];
  selectedSkuId?: string;
  onSelect: (skuId: string) => void;
}) {
  const maxRate = Math.max(...rows.map((row) => getCpiRate(row)), 1.5);

  return (
    <div className="cpi-chart" role="list" aria-label="Clickable SKU CPI rate bars">
      {rows.length ? rows.slice(0, 8).map((row) => {
        const rate = getCpiRate(row);
        const tone = rate >= 1 ? "good" : rate >= 0.8 ? "warn" : "danger";
        return (
          <button
            className={selectedSkuId === row.id ? `cpi-bar selected ${tone}` : `cpi-bar ${tone}`}
            key={row.id}
            onClick={() => onSelect(row.id)}
            type="button"
          >
            <span className="bar-label">{row.productName}</span>
            <span className="bar-track">
              <span style={{ width: `${Math.min((rate / maxRate) * 100, 100)}%` }} />
            </span>
            <strong>{formatPercent(rate)}</strong>
          </button>
        );
      }) : (
        <p className="empty-chart">No SKU data in this bucket.</p>
      )}
    </div>
  );
}

function PersonChips({
  names,
  role
}: {
  names: string[];
  role: "host" | "operator";
}) {
  const cleanedNames = names.map((name) => name.trim()).filter(Boolean);
  if (!cleanedNames.length) {
    return <span className={`person-chip role-${role} tone-empty`}>{role === "host" ? "Unassigned host" : "No operator"}</span>;
  }

  return (
    <>
      {cleanedNames.map((name, index) => (
        <span className={`person-chip role-${role} tone-${getPersonTone(name)}`} key={`${role}-${name}-${index}`}>
          {name}
        </span>
      ))}
    </>
  );
}

type CloudStateKey =
  | "scheduledShows"
  | "teamMembers"
  | "showInfo"
  | "opsNotes"
  | "strategyGroups"
  | "opsRecords"
  | "reportHistory"
  | "dailyMetrics";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const cloudSyncEnabled = Boolean(supabaseUrl && supabaseAnonKey);

function getCloudHeaders() {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
  };
}

async function loadCloudValue<T>(id: CloudStateKey): Promise<T | null> {
  if (!cloudSyncEnabled) return null;

  const response = await fetch(
    `${supabaseUrl}/rest/v1/app_state?id=eq.${encodeURIComponent(id)}&select=data`,
    {
      headers: getCloudHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) throw new Error(`Cloud load failed: ${response.status}`);

  const rows = (await response.json()) as Array<{ data: T }>;
  return rows[0]?.data ?? null;
}

async function saveCloudValue(id: CloudStateKey, data: unknown) {
  if (!cloudSyncEnabled) return;

  const response = await fetch(`${supabaseUrl}/rest/v1/app_state?on_conflict=id`, {
    method: "POST",
    headers: {
      ...getCloudHeaders(),
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      id,
      data,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) throw new Error(`Cloud save failed: ${response.status}`);
}

function readLocalJson<T>(key: string, fallback: T): T {
  const saved = window.localStorage.getItem(key);
  if (!saved) return fallback;

  try {
    return JSON.parse(saved) as T;
  } catch {
    return fallback;
  }
}

export default function Home() {
  const [segment, setSegment] = useState<Segment>("today");
  const [salesItems, setSalesItems] = useState<SalesItem[]>(sampleItems);
  const [salesOutputs, setSalesOutputs] = useState<GeneratedSalesOutputs | null>(null);
  const [sidebarMagnets, setSidebarMagnets] = useState<SidebarMagnet[]>([
    { id: "connection", metric: "latestWeek" },
    { id: "latest-external-day", metric: "latestExternalDay" },
    { id: "daily-gmv", metric: "gmv" }
  ]);
  const [scheduledShows, setScheduledShows] = useState<ScheduledShow[]>(initialScheduledShows);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [newTeamMemberName, setNewTeamMemberName] = useState("");
  const [newTeamMemberRole, setNewTeamMemberRole] = useState<TeamRole>("host");
  const [showInfo, setShowInfo] = useState<ShowInfo>(initialShow);
  const [opsNotes, setOpsNotes] = useState<OpsNotes>(initialNotes);
  const [strategyGroups, setStrategyGroups] = useState<StrategyGroup[]>(initialStrategyGroups);
  const [opsRecords, setOpsRecords] = useState<OpsRecord[]>(initialOpsRecords);
  const [reportHistory, setReportHistory] = useState<ReportSnapshot[]>([]);
  const [recordCategoryFilter, setRecordCategoryFilter] = useState<OpsRecordCategory | "all">("all");
  const [dailyMetrics, setDailyMetrics] = useState<TrendPoint[]>([]);
  const [weeklyMetrics, setWeeklyMetrics] = useState<TrendPoint[]>([]);
  const [csvStatus, setCsvStatus] = useState("Sample data loaded. Upload a Whatnot CSV to replace it.");
  const [analyticsStatus, setAnalyticsStatus] = useState("Open Analytics to connect the existing dashboard data.");
  const [externalDashboard, setExternalDashboard] = useState<ExternalDashboardData | null>(null);
  const [availabilityText, setAvailabilityText] = useState(sampleAvailabilityText);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [availabilityWeekStart, setAvailabilityWeekStart] = useState(initialShow.date);
  const [csvTrendDate, setCsvTrendDate] = useState(initialShow.date);
  const [manualTrendDate, setManualTrendDate] = useState(initialShow.date);
  const [manualTrendGmv, setManualTrendGmv] = useState("");
  const [manualTrendGmvPerHour, setManualTrendGmvPerHour] = useState("");
  const [manualTrendAov, setManualTrendAov] = useState("");
  const [manualTrendOrders, setManualTrendOrders] = useState("");
  const [trendMetric, setTrendMetric] = useState<TrendMetric>("gmv");
  const [selectedDailyTrendIndex, setSelectedDailyTrendIndex] = useState(sampleDailyMetrics.length - 1);
  const [selectedWeeklyTrendIndex, setSelectedWeeklyTrendIndex] = useState(0);
  const [cpiView, setCpiView] = useState<CpiView>("all");
  const [selectedSkuId, setSelectedSkuId] = useState(sampleItems[0].id);
  const [scheduleStatus, setScheduleStatus] = useState("Schedule ready. Add Show creates a draft block for the day.");
  const [reportStatus, setReportStatus] = useState("Draft");
  const [segmentHistory, setSegmentHistory] = useState<Segment[]>([]);
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>(null);
  const [toast, setToast] = useState("");
  const [cloudStatus, setCloudStatus] = useState(cloudSyncEnabled ? "Cloud sync connecting..." : "Cloud sync is not configured.");
  const localReady = useRef(false);
  const cloudReady = useRef(false);
  const cloudSaveTimers = useRef<Partial<Record<CloudStateKey, number>>>({});

  function queueCloudSave(id: CloudStateKey, data: unknown) {
    if (!cloudSyncEnabled || !cloudReady.current) return;

    const timer = cloudSaveTimers.current[id];
    if (timer) window.clearTimeout(timer);

    cloudSaveTimers.current[id] = window.setTimeout(() => {
      saveCloudValue(id, data)
        .then(() => {
          setCloudStatus(`Cloud synced ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`);
        })
        .catch(() => {
          setCloudStatus("Cloud sync needs the Supabase table/RLS setup.");
        });
    }, 500);
  }

  useEffect(() => {
    const localSalesItems = readLocalJson<SalesItem[]>("dailyOps.salesItems.v1", sampleItems);
    const localSalesOutputs = readLocalJson<GeneratedSalesOutputs | null>("dailyOps.salesOutputs.v1", null);
    const localScheduledShows = readLocalJson<ScheduledShow[]>("dailyOps.scheduledShows.v1", initialScheduledShows);
    const localTeam = readLocalJson<TeamMember[]>("dailyOps.teamMembers.v1", initialTeamMembers);
    const localShowInfo = readLocalJson<ShowInfo>("dailyOps.showInfo.v1", initialShow);
    const localOpsNotes = readLocalJson<OpsNotes>("dailyOps.opsNotes.v1", initialNotes);
    const localStrategy = readLocalJson<StrategyGroup[]>("dailyOps.strategyGroups.v1", initialStrategyGroups);
    const localRecords = readLocalJson<OpsRecord[]>("dailyOps.opsRecords.v1", initialOpsRecords);
    const localReportHistory = readLocalJson<ReportSnapshot[]>("dailyOps.reportHistory.v1", []);
    const localDailyMetrics = readLocalJson<TrendPoint[]>("dailyOps.dailyMetrics.v1", []);

    if (Array.isArray(localSalesItems)) setSalesItems(localSalesItems);
    setSalesOutputs(localSalesOutputs);
    if (Array.isArray(localScheduledShows)) setScheduledShows(localScheduledShows);
    if (Array.isArray(localTeam)) setTeamMembers(localTeam);
    setShowInfo(localShowInfo);
    setOpsNotes(localOpsNotes);
    if (Array.isArray(localStrategy)) setStrategyGroups(localStrategy);
    if (Array.isArray(localRecords)) setOpsRecords(localRecords);
    if (Array.isArray(localReportHistory)) setReportHistory(localReportHistory);
    if (Array.isArray(localDailyMetrics)) setDailyMetrics(localDailyMetrics);
    window.setTimeout(() => {
      localReady.current = true;
    }, 0);
  }, []);

  useEffect(() => {
    if (!cloudSyncEnabled) return;

    let cancelled = false;

    async function loadCloudState() {
      try {
        const [
          cloudScheduledShows,
          cloudTeam,
          cloudShowInfo,
          cloudOpsNotes,
          cloudStrategy,
          cloudRecords,
          cloudReportHistory,
          cloudDailyMetrics
        ] = await Promise.all([
          loadCloudValue<ScheduledShow[]>("scheduledShows"),
          loadCloudValue<TeamMember[]>("teamMembers"),
          loadCloudValue<ShowInfo>("showInfo"),
          loadCloudValue<OpsNotes>("opsNotes"),
          loadCloudValue<StrategyGroup[]>("strategyGroups"),
          loadCloudValue<OpsRecord[]>("opsRecords"),
          loadCloudValue<ReportSnapshot[]>("reportHistory"),
          loadCloudValue<TrendPoint[]>("dailyMetrics"),
        ]);

        if (cancelled) return;

        if (Array.isArray(cloudScheduledShows)) setScheduledShows(cloudScheduledShows);
        if (Array.isArray(cloudTeam)) setTeamMembers(cloudTeam);
        if (cloudShowInfo) setShowInfo(cloudShowInfo);
        if (cloudOpsNotes) setOpsNotes(cloudOpsNotes);
        if (Array.isArray(cloudStrategy)) setStrategyGroups(cloudStrategy);
        if (Array.isArray(cloudRecords)) setOpsRecords(cloudRecords);
        if (Array.isArray(cloudReportHistory)) setReportHistory(cloudReportHistory);
        if (Array.isArray(cloudDailyMetrics)) setDailyMetrics(cloudDailyMetrics);
        setCloudStatus("Cloud sync connected.");
      } catch {
        if (!cancelled) setCloudStatus("Cloud sync needs the Supabase table/RLS setup.");
      } finally {
        cloudReady.current = true;
      }
    }

    loadCloudState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!localReady.current) return;
    window.localStorage.setItem("dailyOps.salesItems.v1", JSON.stringify(salesItems));
  }, [salesItems]);

  useEffect(() => {
    if (!localReady.current) return;
    window.localStorage.setItem("dailyOps.salesOutputs.v1", JSON.stringify(salesOutputs));
  }, [salesOutputs]);

  useEffect(() => {
    if (!localReady.current) return;
    window.localStorage.setItem("dailyOps.scheduledShows.v1", JSON.stringify(scheduledShows));
    queueCloudSave("scheduledShows", scheduledShows);
  }, [scheduledShows]);

  useEffect(() => {
    if (!localReady.current) return;
    window.localStorage.setItem("dailyOps.opsRecords.v1", JSON.stringify(opsRecords));
    queueCloudSave("opsRecords", opsRecords);
  }, [opsRecords]);

  useEffect(() => {
    if (!localReady.current) return;
    window.localStorage.setItem("dailyOps.reportHistory.v1", JSON.stringify(reportHistory));
    queueCloudSave("reportHistory", reportHistory);
  }, [reportHistory]);

  useEffect(() => {
    if (!localReady.current) return;
    window.localStorage.setItem("dailyOps.teamMembers.v1", JSON.stringify(teamMembers));
    queueCloudSave("teamMembers", teamMembers);
  }, [teamMembers]);

  useEffect(() => {
    if (!localReady.current) return;
    window.localStorage.setItem("dailyOps.showInfo.v1", JSON.stringify(showInfo));
    queueCloudSave("showInfo", showInfo);
  }, [showInfo]);

  useEffect(() => {
    if (!localReady.current) return;
    window.localStorage.setItem("dailyOps.opsNotes.v1", JSON.stringify(opsNotes));
    queueCloudSave("opsNotes", opsNotes);
  }, [opsNotes]);

  useEffect(() => {
    if (!localReady.current) return;
    window.localStorage.setItem("dailyOps.strategyGroups.v1", JSON.stringify(strategyGroups));
    queueCloudSave("strategyGroups", strategyGroups);
  }, [strategyGroups]);

  useEffect(() => {
    if (!localReady.current) return;
    window.localStorage.setItem("dailyOps.dailyMetrics.v1", JSON.stringify(dailyMetrics));
    queueCloudSave("dailyMetrics", dailyMetrics);
  }, [dailyMetrics]);

  useEffect(() => {
    if (segment !== "analytics" || externalDashboard) return;

    let cancelled = false;
    setAnalyticsStatus("Connecting to Report Cockpit data...");

    fetch(`${weeklyDashboardUrl}data.js`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`Report Cockpit data returned ${response.status}`);
        return response.text();
      })
      .then((scriptText) => {
        if (cancelled) return;
        const data = parseDashboardDataScript(scriptText);
        if (!data) throw new Error("Report Cockpit data format changed");

        setExternalDashboard(data);
        const dailyCount = data.latest_daily?.length ?? 0;
        setSelectedWeeklyTrendIndex(Math.max((data.weekly?.length ?? 1) - 1, 0));
        setAnalyticsStatus(
          `Linked to Report Cockpit. Latest week: ${data.latest_week ?? "n/a"}${dailyCount ? `, ${dailyCount} recent daily rows loaded` : ""}.`
        );
      })
      .catch(() => {
        if (!cancelled) {
          setAnalyticsStatus("Could not connect to Report Cockpit data. Use Open weekly dashboard or import JSON manually.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [externalDashboard, segment]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const metrics = useMemo(() => {
    const sellableItems = salesItems.filter((item) => !item.isGiveaway);
    const giveawayItems = salesItems.filter((item) => item.isGiveaway);
    const gmv = sellableItems.reduce((sum, item) => sum + item.totalSales, 0);
    const units = sellableItems.reduce((sum, item) => sum + item.orders, 0);
    const sellableCost = sellableItems.reduce((sum, item) => sum + item.costPerItem * item.orders, 0);
    const giveawayCost = giveawayItems.reduce((sum, item) => sum + item.costPerItem * item.orders, 0);
    const totalCost = sellableCost + giveawayCost;
    const aov = units ? gmv / units : 0;
    const cpi = units ? sellableCost / units : 0;
    const profitMargin = gmv ? (gmv - totalCost) / gmv : 0;
    const targetPriceCompletion = cpi ? aov / cpi : 0;
    const gmvPerHour = showInfo.livestreamHours ? gmv / showInfo.livestreamHours : 0;

    return {
      gmv,
      gmvPerHour,
      units,
      orders: units,
      giveawayCost,
      sellableCost,
      totalCost,
      aov,
      cpi,
      profitMargin,
      targetPriceCompletion,
      aov80Line: cpi * 0.8,
      aov100Line: cpi
    };
  }, [salesItems, showInfo.livestreamHours]);

  const skuGroups = useMemo(() => {
    const sellable = salesItems.filter((item) => !item.isGiveaway && item.costPerItem > 0);
    return {
      winners: sellable.filter((item) => getCpiRate(item) >= 1).sort((a, b) => getCpiRate(b) - getCpiRate(a)),
      optimize: sellable.filter((item) => getCpiRate(item) >= 0.8 && getCpiRate(item) < 1),
      risk: sellable.filter((item) => getCpiRate(item) < 0.8).sort((a, b) => getCpiRate(a) - getCpiRate(b)),
      giveaways: salesItems.filter((item) => item.isGiveaway)
    };
  }, [salesItems]);

  const categories = useMemo(() => {
    return Array.from(new Set(salesItems.filter((item) => !item.isGiveaway).map((item) => item.category)));
  }, [salesItems]);

  const scheduleByDate = useMemo(() => {
    return [...scheduledShows].sort((a, b) => getScheduleSortKey(a).localeCompare(getScheduleSortKey(b))).reduce<Array<{ date: string; shows: ScheduledShow[] }>>((days, show) => {
      const existing = days.find((day) => day.date === show.date);
      if (existing) {
        existing.shows.push(show);
      } else {
        days.push({ date: show.date, shows: [show] });
      }
      return days;
    }, []);
  }, [scheduledShows]);
  const activeHostMembers = teamMembers.filter((member) => member.active && (member.role === "host" || member.role === "both"));
  const activeOperatorMembers = teamMembers.filter((member) => member.active && (member.role === "operator" || member.role === "both"));
  const hostSessionRows = [...scheduledShows]
    .sort((a, b) => getScheduleSortKey(a).localeCompare(getScheduleSortKey(b)))
    .flatMap((show) =>
      getShowHostMetrics(show)
        .filter((metric) => metric.gmv || metric.orders)
        .map((metric) => ({
          ...metric,
          show,
          hours: getLiveHours(show.startTime, show.endTime)
        }))
    );
  const hostPerformanceRows = Object.values(
    hostSessionRows.reduce<Record<string, { host: string; sessions: number; gmv: number; orders: number; hours: number }>>((rows, row) => {
      if (!rows[row.host]) rows[row.host] = { host: row.host, sessions: 0, gmv: 0, orders: 0, hours: 0 };
      rows[row.host].sessions += 1;
      rows[row.host].gmv += row.gmv;
      rows[row.host].orders += row.orders;
      rows[row.host].hours += row.hours;
      return rows;
    }, {})
  ).sort((a, b) => b.gmv - a.gmv);

  const dailyTrendData = dailyMetrics.length
    ? dailyMetrics.map((point) => ({
        ...point,
        label: point.date ? formatDailyTrendLabel(point.date) : point.label
      }))
    : sampleDailyMetrics;
  const selectedDailyTrend = dailyTrendData[Math.min(selectedDailyTrendIndex, dailyTrendData.length - 1)] ?? dailyTrendData[0];
  const isShowingSampleTrend = !dailyMetrics.length;
  const externalWeeklyTrendData = (externalDashboard?.weekly ?? []).map<TrendPoint>((week) => ({
    label: week.week,
    gmv: week.gmv,
    gmv_per_hour: week.gmv_per_hour,
    aov: week.aov,
    orders: week.orders
  }));
  const weeklyTrendData = weeklyMetrics.length ? weeklyMetrics : externalWeeklyTrendData;
  const selectedWeeklyTrend = weeklyTrendData[Math.min(selectedWeeklyTrendIndex, Math.max(weeklyTrendData.length - 1, 0))];
  const latestExternalWeek = externalDashboard?.weekly?.at(-1);
  const latestExternalDaily = externalDashboard?.latest_daily ?? [];
  const latestExternalDay = latestExternalDaily.at(-1);
  const pricingHealth = metrics.targetPriceCompletion >= 1 ? "Strong" : metrics.targetPriceCompletion >= 0.8 ? "Watch" : "Risk";
  const productMixHealth = skuGroups.winners.length >= skuGroups.risk.length ? "Balanced" : "Drag-heavy";
  const marginRisk = metrics.profitMargin >= 0.15 ? "Low" : metrics.profitMargin >= 0 ? "Medium" : "High";
  const giveawayRatio = metrics.gmv ? metrics.giveawayCost / metrics.gmv : 0;
  const promotionDiscipline = metrics.giveawayCost === 0 ? "No spend" : giveawayRatio <= 0.03 ? "Controlled" : "Heavy";
  const dailyInsightCards = [
    {
      label: "Pricing health",
      value: pricingHealth,
      helper: `${formatPercent(metrics.targetPriceCompletion)} target completion`
    },
    {
      label: "Product mix",
      value: productMixHealth,
      helper: `${skuGroups.winners.length} winners · ${skuGroups.risk.length} drag SKUs`
    },
    {
      label: "Margin risk",
      value: marginRisk,
      helper: `${formatPercent(metrics.profitMargin)} profit margin`
    },
    {
      label: "Promotion spend",
      value: promotionDiscipline,
      helper: `${decimalCurrency.format(metrics.giveawayCost)} · ${formatPercent(giveawayRatio)} of GMV`
    }
  ];
  const categoryContribution = categories
    .map((category) => ({
      category,
      gmv: salesItems
        .filter((item) => !item.isGiveaway && item.category === category)
        .reduce((sum, item) => sum + item.totalSales, 0)
    }))
    .filter((item) => item.gmv > 0)
    .sort((a, b) => b.gmv - a.gmv)
    .slice(0, 5);
  const topDragItems = skuGroups.risk.slice(0, 3);
  const nextShowRecommendations = [
    skuGroups.winners.length
      ? `Prioritize ${skuGroups.winners.slice(0, 2).map((item) => item.productName).join(" and ")}.`
      : "Test clearer value SKUs before exposing high-cost products.",
    skuGroups.risk.length
      ? `Limit exposure for ${skuGroups.risk.slice(0, 2).map((item) => item.productName).join(" and ")}.`
      : "Maintain current SKU mix; no below-80% CPI drag detected.",
    metrics.targetPriceCompletion < 0.8
      ? "Hold premium giveaways until bidding depth improves."
      : "Use giveaways selectively to support traffic without over-spending."
  ];
  const filteredOpsRecords = opsRecords.filter((record) => recordCategoryFilter === "all" || record.category === recordCategoryFilter);
  const recordCategoryCounts = opsRecords.reduce<Record<OpsRecordCategory, number>>((counts, record) => {
    counts[record.category] = (counts[record.category] ?? 0) + 1;
    return counts;
  }, {
    actions: 0,
    traffic: 0,
    giveaway: 0,
    host: 0,
    inventory: 0,
    kpiContext: 0,
    competitor: 0
  });
  const repeatedRecordCategories = Object.entries(recordCategoryCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category, count]) => `${recordCategoryLabels[category as OpsRecordCategory]} (${count})`);
  const recordPatternText = repeatedRecordCategories.length
    ? `Most repeated: ${repeatedRecordCategories.join(", ")}. Use this as an AI-ready issue pool.`
    : "Save records over time to surface repeated traffic, inventory, host, or competitor patterns.";
  const groupedOpsRecordMap =
    filteredOpsRecords.reduce<Record<string, { date: string; records: OpsRecord[] }>>((groups, record) => {
      const key = record.date || "No date";
      if (!groups[key]) groups[key] = { date: key, records: [] };
      groups[key].records.push(record);
      return groups;
    }, {});
  const groupedReportMap =
    reportHistory.reduce<Record<string, { date: string; reports: ReportSnapshot[] }>>((groups, report) => {
      const key = report.date || "No date";
      if (!groups[key]) groups[key] = { date: key, reports: [] };
      groups[key].reports.push(report);
      return groups;
    }, {});
  const groupedOpsRecordDays = Array.from(
    new Set([
      ...Object.keys(groupedOpsRecordMap),
      ...(recordCategoryFilter === "all" ? Object.keys(groupedReportMap) : [])
    ])
  )
    .map((date) => ({
      date,
      records: groupedOpsRecordMap[date]?.records ?? [],
      reports: recordCategoryFilter === "all" ? groupedReportMap[date]?.reports ?? [] : []
    }))
    .filter((group) => group.records.length || group.reports.length)
    .sort((a, b) => b.date.localeCompare(a.date));
  const latestRecordGroup = groupedOpsRecordDays[0];
  function getMagnetDisplay(metricId: MagnetMetric) {
    const label = magnetMetricOptions.find((option) => option.id === metricId)?.label ?? "Metric";
    const cardMap: Record<MagnetMetric, { value: string; helper: string }> = {
      gmv: { value: decimalCurrency.format(metrics.gmv), helper: "From generated salesData" },
      gmvPerHour: { value: decimalCurrency.format(metrics.gmvPerHour), helper: `${showInfo.livestreamHours} live hours` },
      aov: { value: decimalCurrency.format(metrics.aov), helper: `${metrics.orders} orders` },
      cpi: { value: decimalCurrency.format(metrics.cpi), helper: "Cost basis from generated salesData" },
      promoCost: { value: decimalCurrency.format(metrics.giveawayCost), helper: `${formatPercent(giveawayRatio)} of GMV` },
      targetCompletion: { value: formatPercent(metrics.targetPriceCompletion), helper: `80% line ${decimalCurrency.format(metrics.aov80Line)}` },
      profitMargin: { value: formatPercent(metrics.profitMargin), helper: "Includes promo / giveaway cost" },
      orders: { value: metrics.orders.toLocaleString(), helper: "Generated salesData order count" },
      bookmarks: { value: showInfo.bookmarks.toLocaleString(), helper: "Manual show input" },
      winnerCount: { value: skuGroups.winners.length.toString(), helper: "100%+ CPI SKUs" },
      dragCount: { value: skuGroups.risk.length.toString(), helper: "Below 80% CPI SKUs" },
      giveawayRatio: { value: formatPercent(giveawayRatio), helper: `${decimalCurrency.format(metrics.giveawayCost)} promo cost` },
      latestExternalDay: {
        value: latestExternalDay ? currency.format(latestExternalDay.gmv) : "Local first",
        helper: latestExternalDay ? `${formatScheduleDate(latestExternalDay.date)} external GMV` : "Report Cockpit not required"
      },
      latestWeek: {
        value: latestExternalWeek ? externalDashboard?.latest_week ?? latestExternalWeek.week : "Optional",
        helper: latestExternalWeek ? `${currency.format(latestExternalWeek.gmv)} weekly GMV` : "Open cockpit for weekly detail"
      },
      scheduleCount: { value: scheduledShows.length.toString(), helper: "Total scheduled shows" }
    };

    return {
      label,
      ...cardMap[metricId]
    };
  }

  const sidebarMagnetCards = sidebarMagnets.map((magnet) => ({
    ...magnet,
    ...getMagnetDisplay(magnet.metric)
  }));

  const cpiChartRows = useMemo(() => {
    const sellable = salesItems
      .filter((item) => !item.isGiveaway && item.costPerItem > 0)
      .sort((a, b) => getCpiRate(b) - getCpiRate(a));
    if (cpiView === "winners") return skuGroups.winners;
    if (cpiView === "optimize") return skuGroups.optimize;
    if (cpiView === "risk") return skuGroups.risk;
    return sellable;
  }, [cpiView, salesItems, skuGroups]);

  const selectedSku = useMemo(() => {
    return salesItems.find((item) => item.id === selectedSkuId) ?? cpiChartRows[0];
  }, [cpiChartRows, salesItems, selectedSkuId]);

  const generatedReport = useMemo(() => {
    const topCategories = categories.slice(0, 3).join(", ") || "No category detected";
    const topGmvItems = salesItems.filter((item) => !item.isGiveaway).sort((a, b) => b.totalSales - a.totalSales);
    const winningItems = formatCompactItems(skuGroups.winners, "No 100%+ CPI SKU", 3);
    const weakItems = formatCompactItems(skuGroups.risk, "No major drag SKU", 2);
    const highGmvItems = formatCompactItems(topGmvItems, "No sales item", 3);
    const giveawayItems = skuGroups.giveaways;
    const giveawayUsed = giveawayItems.length
      ? giveawayItems.map((item) => `${shortProductName(item.productName)} x${Math.round(item.orders)}`).join(", ")
      : "None detected in CSV";
    const actionsTaken = opsNotes.actions.slice(0, 4).join("; ");
    const noteContext = [
      opsNotes.kpiContext ? `Strategy: ${compactReportText(opsNotes.kpiContext, "", 110)}` : "",
      opsNotes.traffic ? `Traffic: ${compactReportText(opsNotes.traffic, "", 110)}` : "",
      opsNotes.competitor ? `Competitor: ${compactReportText(opsNotes.competitor, "", 95)}` : "",
      opsNotes.host ? `Host: ${compactReportText(opsNotes.host, "", 90)}` : "",
      opsNotes.inventory ? `Inventory: ${compactReportText(opsNotes.inventory, "", 90)}` : ""
    ].filter(Boolean);
    const previousTrend = dailyMetrics
      .filter((point) => point.date && point.date < showInfo.date)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 3);
    const previousAvgGmv = previousTrend.length ? previousTrend.reduce((sum, point) => sum + point.gmv, 0) / previousTrend.length : 0;
    const previousAvgAov = previousTrend.length ? previousTrend.reduce((sum, point) => sum + (point.aov ?? 0), 0) / previousTrend.length : 0;
    const trendText = previousTrend.length
      ? `Compared with recent ${previousTrend.length}-day avg, GMV was ${metrics.gmv >= previousAvgGmv ? "above" : "below"} trend (${decimalCurrency.format(previousAvgGmv)} avg) and AOV was ${metrics.aov >= previousAvgAov ? "stronger" : "softer"}.`
      : "No recent daily trend baseline yet.";
    const cpiText =
      metrics.targetPriceCompletion >= 0.8
        ? "Pricing stayed above the 80% line"
        : "Pricing fell below the 80% line";
    const marginText =
      metrics.gmv > 1000 && metrics.profitMargin < 0
        ? "GMV was volume-driven while margin was compressed"
        : "Margin was supported by selective exposure";
    const nextFocus =
      metrics.targetPriceCompletion < 0.8
        ? "Push stronger CPI SKUs and reduce drag exposure."
        : "Keep winners visible and protect high-cost items in weak bidding.";

    return `Daily Show Summary

Date: ${showInfo.date}
Show: ${showInfo.showName}
Hours: ${showInfo.livestreamHours} | Start: ${showInfo.onTimeStart}

1. KPI
- GMV: ${decimalCurrency.format(metrics.gmv)} | GMV / Hour: ${decimalCurrency.format(metrics.gmvPerHour)}
- AOV: ${decimalCurrency.format(metrics.aov)} | CPI: ${decimalCurrency.format(metrics.cpi)} | Target: ${formatPercent(metrics.targetPriceCompletion)}
- Margin: ${formatPercent(metrics.profitMargin)} | Orders: ${metrics.orders} | Bookmarks: ${showInfo.bookmarks}

2. What Was Sold
- Mix: ${topCategories}
- Winners: ${winningItems}
- Top GMV: ${highGmvItems}
- Drag: ${weakItems}

3. Promotion / Giveaway
- CSV giveaways: ${giveawayUsed}
- Est. cost: ${decimalCurrency.format(metrics.giveawayCost)}

4. Game / Strategy
- Tags: ${actionsTaken || "None selected"}
${noteContext.length ? noteContext.map((note) => `- ${note}`).join("\n") : "- No extra notes added"}

5. Summary
- ${cpiText}; ${marginText}.
- ${trendText}
- Next focus: ${nextFocus}`;
  }, [categories, dailyMetrics, metrics, opsNotes, salesItems, showInfo, skuGroups]);

  function updateShow<K extends keyof ShowInfo>(key: K, value: ShowInfo[K]) {
    setShowInfo((current) => ({ ...current, [key]: value }));
  }

  function updateNotes<K extends keyof OpsNotes>(key: K, value: OpsNotes[K]) {
    setOpsNotes((current) => ({ ...current, [key]: value }));
  }

  function upsertDailyTrendPoint(point: TrendPoint) {
    setDailyMetrics((current) => {
      const next = [...current.filter((item) => item.date !== point.date), point]
        .sort((a, b) => String(a.date ?? a.label).localeCompare(String(b.date ?? b.label)))
        .slice(-21);
      setSelectedDailyTrendIndex(Math.max(next.findIndex((item) => item.date === point.date), 0));
      return next;
    });
  }

  function saveManualTrendPoint() {
    const date = manualTrendDate || formatDateInput(new Date());
    const gmv = parseNumber(manualTrendGmv);
    const orders = parseNumber(manualTrendOrders);
    const aov = parseNumber(manualTrendAov) || (orders ? gmv / orders : 0);
    const gmvPerHour = parseNumber(manualTrendGmvPerHour);

    upsertDailyTrendPoint({
      label: formatDailyTrendLabel(date),
      date,
      gmv,
      gmv_per_hour: gmvPerHour,
      aov,
      orders
    });
    showToast(`Trend saved for ${formatDailyTrendLabel(date)}.`);
  }

  function loadSelectedTrendForEditing() {
    if (!selectedDailyTrend || !selectedDailyTrend.date) return;
    setManualTrendDate(selectedDailyTrend.date);
    setManualTrendGmv(String(Math.round(selectedDailyTrend.gmv)));
    setManualTrendGmvPerHour(String(Math.round(selectedDailyTrend.gmv_per_hour ?? 0)));
    setManualTrendAov(String(Number(selectedDailyTrend.aov ?? 0).toFixed(2)));
    setManualTrendOrders(String(Math.round(selectedDailyTrend.orders ?? 0)));
    showToast(`${selectedDailyTrend.label} loaded for editing.`);
  }

  function deleteSelectedTrendPoint() {
    if (!selectedDailyTrend || !selectedDailyTrend.date) {
      showToast("Select a saved trend point first.");
      return;
    }

    setDailyMetrics((current) => {
      const next = current.filter((point) => point.date !== selectedDailyTrend.date);
      setSelectedDailyTrendIndex(Math.max(Math.min(selectedDailyTrendIndex, next.length - 1), 0));
      return next;
    });
    showToast(`${selectedDailyTrend.label} removed from trend history.`);
  }

  function saveCurrentNotesToRecords() {
    const rawEntries: Array<[OpsRecordCategory, string]> = [
      ["actions", opsNotes.actions.join("; ")],
      ["traffic", opsNotes.traffic],
      ["giveaway", opsNotes.giveaway],
      ["host", opsNotes.host],
      ["inventory", opsNotes.inventory],
      ["kpiContext", opsNotes.kpiContext],
      ["competitor", opsNotes.competitor]
    ];
    const entries = rawEntries.filter(([, note]) => note.trim().length > 0);

    if (!entries.length) {
      showToast("No notes to save yet.");
      return;
    }

    const createdAt = new Date().toISOString();
    const newRecords = entries.map(([category, note], index) => ({
      id: `record-${Date.now()}-${index}`,
      date: showInfo.date,
      showName: showInfo.showName,
      category,
      severity: "medium" as OpsRecordSeverity,
      note,
      createdAt
    }));

    setOpsRecords((current) => [...newRecords, ...current]);
    showToast(`${newRecords.length} records saved to history.`);
  }

  function saveGeneratedReportSnapshot() {
    const snapshot: ReportSnapshot = {
      id: `report-${Date.now()}`,
      date: showInfo.date,
      showName: showInfo.showName,
      report: generatedReport,
      createdAt: new Date().toISOString()
    };
    setReportHistory((current) => [
      snapshot,
      ...current.filter((report) => !(report.date === snapshot.date && report.showName === snapshot.showName)).slice(0, 29)
    ]);
    setReportStatus("Saved to log");
    showToast("Daily report saved to cumulative log.");
  }

  function deleteOpsRecord(id: string) {
    setOpsRecords((current) => current.filter((record) => record.id !== id));
    showToast("Record removed.");
  }

  function deleteOpsRecordGroup(records: OpsRecord[]) {
    const ids = new Set(records.map((record) => record.id));
    setOpsRecords((current) => current.filter((record) => !ids.has(record.id)));
    showToast("Daily record group removed.");
  }

  function deleteReportSnapshot(id: string) {
    setReportHistory((current) => current.filter((report) => report.id !== id));
    showToast("Saved report removed.");
  }

  function deleteOpsLogDay(records: OpsRecord[], reports: ReportSnapshot[]) {
    const recordIds = new Set(records.map((record) => record.id));
    const reportIds = new Set(reports.map((report) => report.id));
    setOpsRecords((current) => current.filter((record) => !recordIds.has(record.id)));
    setReportHistory((current) => current.filter((report) => !reportIds.has(report.id)));
    showToast("Daily log group removed.");
  }

  function applyRecordToReport(record: OpsRecord) {
    if (record.category === "actions") {
      const actions = record.note
        .split(";")
        .map((action) => action.trim())
        .filter(Boolean);
      setOpsNotes((current) => ({ ...current, actions }));
      showToast("Action record applied to current report.");
      return;
    }

    updateNotes(record.category, record.note);
    showToast("Record applied to current report.");
  }

  function applyRecordGroupToReport(records: OpsRecord[]) {
    const nextNotes = records.reduce<OpsNotes>((current, record) => {
      if (record.category === "actions") {
        return {
          ...current,
          actions: Array.from(new Set([
            ...current.actions,
            ...record.note.split(";").map((action) => action.trim()).filter(Boolean)
          ]))
        };
      }

      const currentValue = current[record.category];
      return {
        ...current,
        [record.category]: currentValue ? `${currentValue}\n${record.note}` : record.note
      };
    }, { actions: [], traffic: "", giveaway: "", host: "", inventory: "", kpiContext: "", competitor: "" });

    setOpsNotes(nextNotes);
    showToast("Daily record group applied to current report.");
  }

  function updateSidebarMagnet(id: string, value: MagnetMetric) {
    setSidebarMagnets((current) => current.map((magnet) => magnet.id === id ? { ...magnet, metric: value } : magnet));
  }

  function addSidebarMagnet() {
    const nextMetric = magnetMetricOptions.find((option) => !sidebarMagnets.some((magnet) => magnet.metric === option.id))?.id ?? "gmv";
    setSidebarMagnets((current) => [...current, { id: `sidebar-magnet-${Date.now()}`, metric: nextMetric }]);
    showToast("Sidebar block added.");
  }

  function deleteSidebarMagnet(id: string) {
    setSidebarMagnets((current) => current.filter((magnet) => magnet.id !== id));
    showToast("Sidebar block removed.");
  }

  function showToast(message: string) {
    setToast(message);
  }

  function navigateTo(nextSegment: Segment) {
    if (nextSegment === segment) return;
    setActiveLayer(null);
    setSegmentHistory((current) => [...current, segment]);
    setSegment(nextSegment);
  }

  function goBack() {
    if (activeLayer) {
      setActiveLayer(null);
      return;
    }
    setSegmentHistory((current) => {
      const previous = current.at(-1);
      if (!previous) return current;
      setSegment(previous);
      return current.slice(0, -1);
    });
  }

  function openShowLayer(show: ScheduledShow) {
    setActiveLayer({ type: "show", show });
    showToast(`${show.title} details opened.`);
  }

  function updateScheduledShow<K extends keyof ScheduledShow>(id: string, key: K, value: ScheduledShow[K]) {
    setScheduledShows((current) =>
      current.map((show) => (show.id === id ? { ...show, [key]: value } : show))
    );
    setActiveLayer((current) => {
      if (current?.type !== "show" || current.show.id !== id) return current;
      return { type: "show", show: { ...current.show, [key]: value } };
    });
    setScheduleStatus("Schedule draft updated. Changes are reflected immediately in the calendar.");
  }

  function addTeamMember() {
    const name = newTeamMemberName.trim();
    if (!name) {
      showToast("Enter a team member name first.");
      return;
    }

    setTeamMembers((current) => {
      const existing = current.find((member) => member.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        return current.map((member) => member.id === existing.id ? { ...member, role: newTeamMemberRole, active: true } : member);
      }

      return [...current, { id: `team-${Date.now()}`, name, role: newTeamMemberRole, active: true }];
    });
    setNewTeamMemberName("");
    showToast(`${name} added to active roster.`);
  }

  function toggleTeamMemberActive(id: string) {
    setTeamMembers((current) => current.map((member) => member.id === id ? { ...member, active: !member.active } : member));
  }

  function updateTeamMemberRole(id: string, role: TeamRole) {
    setTeamMembers((current) => current.map((member) => member.id === id ? { ...member, role, active: true } : member));
  }

  function deleteTeamMember(id: string) {
    const member = teamMembers.find((candidate) => candidate.id === id);
    setTeamMembers((current) => current.filter((candidate) => candidate.id !== id));
    showToast(`${member?.name ?? "Team member"} removed from roster.`);
  }

  function deleteScheduledShow(id: string) {
    const show = scheduledShows.find((candidate) => candidate.id === id);
    setScheduledShows((current) => current.filter((candidate) => candidate.id !== id));
    setActiveLayer((current) => current?.type === "show" && current.show.id === id ? null : current);
    setScheduleStatus(`${show?.title ?? "Show"} removed from the schedule.`);
    showToast("Schedule block deleted.");
  }

  function clearScheduleDate(dateValue: string) {
    const count = scheduledShows.filter((show) => show.date === dateValue).length;
    setScheduledShows((current) => current.filter((show) => show.date !== dateValue));
    setActiveLayer((current) => current?.type === "show" && current.show.date === dateValue ? null : current);
    setScheduleStatus(`${formatScheduleDate(dateValue)} cleared (${count} livestream${count === 1 ? "" : "s"} removed).`);
    showToast("Schedule day cleared.");
  }

  function openSkuLayer(skuId: string) {
    const item = salesItems.find((candidate) => candidate.id === skuId);
    if (!item) return;
    setSelectedSkuId(skuId);
    setActiveLayer({ type: "sku", item });
    showToast(`${item.productName} details opened.`);
  }

  function toggleAction(action: string) {
    setOpsNotes((current) => ({
      ...current,
      actions: current.actions.includes(action)
        ? current.actions.filter((item) => item !== action)
        : [...current.actions, action]
    }));
  }

  function addStrategyGroup() {
    setStrategyGroups((current) => [
      ...current,
      {
        id: `strategy-${Date.now()}`,
        label: `New block ${current.length + 1}`,
        items: ["New strategy item"]
      }
    ]);
    showToast("Strategy block added.");
  }

  function updateStrategyGroupLabel(groupId: string, label: string) {
    setStrategyGroups((current) => current.map((group) => group.id === groupId ? { ...group, label } : group));
  }

  function deleteStrategyGroup(groupId: string) {
    const group = strategyGroups.find((candidate) => candidate.id === groupId);
    const deletedItems = new Set(group?.items ?? []);
    setStrategyGroups((current) => current.filter((candidate) => candidate.id !== groupId));
    setOpsNotes((current) => ({ ...current, actions: current.actions.filter((action) => !deletedItems.has(action)) }));
    showToast("Strategy block deleted.");
  }

  function addStrategyItem(groupId: string) {
    setStrategyGroups((current) => current.map((group) => group.id === groupId ? { ...group, items: [...group.items, "New strategy item"] } : group));
  }

  function updateStrategyItem(groupId: string, itemIndex: number, value: string) {
    const oldValue = strategyGroups.find((group) => group.id === groupId)?.items[itemIndex];
    setStrategyGroups((current) => current.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        items: group.items.map((item, index) => index === itemIndex ? value : item)
      };
    }));
    if (oldValue) {
      setOpsNotes((current) => ({
        ...current,
        actions: current.actions.map((action) => action === oldValue ? value : action).filter(Boolean)
      }));
    }
  }

  function deleteStrategyItem(groupId: string, itemIndex: number) {
    const deletedItem = strategyGroups.find((group) => group.id === groupId)?.items[itemIndex];
    setStrategyGroups((current) => current.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        items: group.items.filter((_, index) => index !== itemIndex)
      };
    }));
    if (deletedItem) {
      setOpsNotes((current) => ({ ...current, actions: current.actions.filter((action) => action !== deletedItem) }));
    }
  }

  function parseAvailabilityInput() {
    const slots = parseHostAvailability(availabilityText).map((slot) => ({
      ...slot,
      date: resolveAvailabilityDate(slot.day, availabilityWeekStart)
    }));
    setAvailabilitySlots(slots);
    if (!slots.length) {
      setScheduleStatus("No availability blocks detected. Try one host per line with a day and time range.");
      showToast("No availability blocks detected.");
      return;
    }
    setScheduleStatus(`${slots.length} availability block${slots.length > 1 ? "s" : ""} detected. Select blocks, then add them to the schedule.`);
    showToast(`${slots.length} availability block${slots.length > 1 ? "s" : ""} detected.`);
  }

  function updateAvailabilityWeekStart(value: string) {
    setAvailabilityWeekStart(value);
    setAvailabilitySlots((current) => current.map((slot) => ({ ...slot, date: resolveAvailabilityDate(slot.day, value) })));
  }

  function toggleAvailabilitySlot(id: string) {
    setAvailabilitySlots((current) =>
      current.map((slot) => (slot.id === id ? { ...slot, selected: !slot.selected } : slot))
    );
  }

  function updateAvailabilitySlotDate(id: string, date: string) {
    setAvailabilitySlots((current) => current.map((slot) => (slot.id === id ? { ...slot, date } : slot)));
  }

  function addAvailabilityToSchedule() {
    const selectedSlots = availabilitySlots.filter((slot) => slot.selected);
    if (!selectedSlots.length) {
      setScheduleStatus("Select at least one availability block before adding it to the schedule.");
      showToast("Select an availability block first.");
      return;
    }

    const draftShows = selectedSlots.map<ScheduledShow>((slot) => ({
      id: `availability-${slot.id}-${Date.now()}`,
      date: slot.date || resolveAvailabilityDate(slot.day, availabilityWeekStart) || slot.day,
      title: `${slot.host} availability hold`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      hosts: [slot.host],
      operators: ["Unassigned"],
      showType: "Availability Hold",
      productFocus: "To assign",
      giveawayPlan: "TBD",
      sessionGmv: 0,
      sessionOrders: 0,
      hostMetrics: [{ host: slot.host, gmv: 0, orders: 0 }],
      notes: `Parsed from host availability message: ${slot.source}`
    }));

    setScheduledShows((current) => [...draftShows, ...current]);
    setAvailabilitySlots((current) => current.map((slot) => ({ ...slot, selected: false })));
    setScheduleStatus(`${draftShows.length} selected availability block${draftShows.length > 1 ? "s" : ""} added as schedule drafts with date assignments.`);
    showToast("Selected availability blocks added to schedule.");
  }

  function clearAvailabilityParser() {
    setAvailabilityText("");
    setAvailabilitySlots([]);
    setScheduleStatus("Availability parser cleared. Manual Add show is still available.");
  }

  function exportScheduleExcel() {
    const sortedShows = [...scheduledShows].sort((a, b) => getScheduleSortKey(a).localeCompare(getScheduleSortKey(b)));
    const rows = sortedShows.map((show, index) => {
      const previous = sortedShows[index - 1];
      const isFirstForDate = !previous || previous.date !== show.date;
      const dayHours = getLiveHours(show.startTime, show.endTime);
      const nightHours = getNightLiveHours(show.startTime, show.endTime);
      const hostTotals = getShowHostTotals(show);
      const host = show.hosts.join(", ");
      const operator = show.operators.join(", ");
      const isEvent = show.showType.toLowerCase().includes("event");
      const rowStyle = isEvent ? "background:#f3f3f3;" : "";
      return `
        <tr style="${rowStyle}">
          <td class="date-cell">${isFirstForDate ? excelEscape(formatShortScheduleDate(show.date)) : ""}</td>
          <td class="theme-cell">${isEvent ? "EVENT" : excelEscape(show.productFocus)}</td>
          <td class="time-cell">${excelEscape(formatExcelTime(show.startTime))}</td>
          <td class="time-cell">${excelEscape(formatExcelTime(show.endTime))}</td>
          <td class="day-cell">${isFirstForDate ? excelEscape(getScheduleDayName(show.date)) : ""}</td>
          <td class="hours-cell">${Number.isInteger(dayHours) ? dayHours : dayHours.toFixed(1)}</td>
          <td class="hours-cell">${nightHours ? (Number.isInteger(nightHours) ? nightHours : nightHours.toFixed(1)) : ""}</td>
          <td class="name-cell" style="background:${nameFillColor(host)};">${excelEscape(host)}</td>
          <td class="name-cell" style="background:${nameFillColor(operator)};">${excelEscape(operator)}</td>
          <td class="name-cell"></td>
          <td class="notes-cell">${excelEscape(show.notes)}${hostTotals.gmv || hostTotals.orders ? excelEscape(` | Host GMV: ${currency.format(hostTotals.gmv)} | Host Orders: ${Math.round(hostTotals.orders)}`) : ""}</td>
        </tr>
      `;
    }).join("");
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; width: 100%; }
            td, th { border: 1px solid #d9d9d9; font-size: 14px; height: 28px; mso-number-format:"\\@"; padding: 4px 6px; text-align: center; vertical-align: middle; }
            .title-row td { background: #b6d7a8; color: #0000ff; font-size: 16px; font-weight: 700; height: 36px; text-align: left; }
            .header-row th { background: #b6d7a8; border-bottom: 2px solid #000; font-size: 15px; font-weight: 700; height: 58px; white-space: normal; }
            .date-cell { border-left: 2px solid #000; font-weight: 700; text-align: left; }
            .theme-cell { color: #dd7e3b; font-weight: 700; }
            .time-cell, .hours-cell { font-weight: 700; }
            .day-cell { border-right: 3px solid #999; font-size: 15px; }
            .name-cell { font-size: 15px; }
            .notes-cell { border-right: 2px solid #000; text-align: left; white-space: normal; }
            tr { border-bottom: 1px solid #000; }
          </style>
        </head>
        <body>
          <table>
            <colgroup>
              <col style="width:90px" />
              <col style="width:170px" />
              <col style="width:120px" />
              <col style="width:120px" />
              <col style="width:120px" />
              <col style="width:120px" />
              <col style="width:140px" />
              <col style="width:130px" />
              <col style="width:130px" />
              <col style="width:130px" />
              <col style="width:220px" />
            </colgroup>
            <tr class="title-row"><td colspan="11">36SS_Home</td></tr>
            <tr class="header-row">
              <th>Date</th>
              <th>Theme</th>
              <th>Livestream<br/>Schedule<br/>(AM/PM)</th>
              <th>Livestream<br/>Schedule<br/>PM</th>
              <th>Day of<br/>the week</th>
              <th>Live Hours<br/>(Day)</th>
              <th>Live Hours<br/>(9pm-6am)</th>
              <th>Host</th>
              <th>Operator</th>
              <th>Intern</th>
              <th>Notes</th>
            </tr>
            ${rows}
          </table>
        </body>
      </html>
    `;
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `36SS_Home_schedule_${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setScheduleStatus("Excel schedule exported. Open the .xls file, then upload or copy it into the company schedule workbook.");
    showToast("Excel schedule exported.");
  }

  function downloadCsvFile(fileName: string, csv: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function exportGeneratedSalesData(kind: "salesData" | "migrateData" | "financeData") {
    if (!salesOutputs) {
      showToast("Upload a raw CSV first.");
      return;
    }

    const baseName = salesOutputs.sourceFile.replace(/\.csv$/i, "");
    if (kind === "salesData") {
      const csv = rowsToCsv(
        ["product name", "product description", "cost per item", "AveragePrice", "NumberOfOrders", "TotalSales"],
        salesOutputs.salesData.map((row) => [
          row.productName,
          row.productDescription,
          row.costPerItem,
          row.averagePrice,
          row.numberOfOrders,
          row.totalSales
        ])
      );
      downloadCsvFile(`salesData-${baseName}.csv`, csv);
    }

    if (kind === "migrateData") {
      const csv = rowsToCsv(
        ["product name", "product description", "sku", "NumberOfOrders"],
        salesOutputs.migrateData.map((row) => [
          row.productName,
          row.productDescription,
          row.sku,
          row.numberOfOrders
        ])
      );
      downloadCsvFile(`migrateData-${baseName}.csv`, csv);
    }

    if (kind === "financeData") {
      const csv = rowsToCsv(
        ["order numeric id", "product name", "product quantity", "sold price"],
        salesOutputs.financeData.map((row) => [
          row.orderNumericId,
          row.productName,
          row.productQuantity,
          row.soldPrice
        ])
      );
      downloadCsvFile(`financeData-${baseName}.csv`, csv);
    }

    showToast(`${kind} exported.`);
  }

  async function handleCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const generatedOutputs = buildGeneratedSalesOutputs(text, file.name);
    const rows = salesDataRowsToSalesItems(generatedOutputs.salesData);
    if (!rows.length) {
      setCsvStatus("Could not parse rows. Check that the file has headers and sales data.");
      return;
    }
    setSalesItems(rows);
    setSalesOutputs(generatedOutputs);
    const trendDate = inferDateFromFileName(file.name, csvTrendDate || showInfo.date) || csvTrendDate || showInfo.date;
    const dailyPoint = buildDailyTrendPoint(rows, trendDate, showInfo.livestreamHours);
    upsertDailyTrendPoint(dailyPoint);
    setCsvTrendDate(trendDate);
    const firstSellable = rows.find((item) => !item.isGiveaway && item.costPerItem > 0);
    setSelectedSkuId(firstSellable?.id ?? rows[0]?.id ?? "");
    setActiveLayer(null);
    setCpiView("all");
    setCsvStatus(`${rows.length} SKU rows imported from ${file.name}. Daily trend saved for ${dailyPoint.label}.`);
    setReportStatus("Draft updated");
    event.target.value = "";
    showToast("CSV imported and report refreshed.");
  }

  function clearCsvData() {
    setSalesItems([]);
    setSalesOutputs(null);
    setSelectedSkuId("");
    setActiveLayer(null);
    setCpiView("all");
    setCsvStatus("CSV data cleared. Select a new Whatnot CSV to generate fresh salesData.");
    setReportStatus("Draft cleared");
    showToast("CSV data cleared.");
  }

  async function handleAnalyticsImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const weekly = Array.isArray(json.weekly) ? json.weekly : [];
      const importedWeekly = weekly.slice(-8).map((week: { week?: string; label?: string; gmv?: number; gmv_per_hour?: number; aov?: number; orders?: number }) => ({
        label: week.week ?? week.label ?? "Week",
        gmv: week.gmv ?? 0,
        gmv_per_hour: week.gmv_per_hour,
        aov: week.aov,
        orders: week.orders
      }));
      setWeeklyMetrics(importedWeekly);
      setSelectedWeeklyTrendIndex(Math.max(importedWeekly.length - 1, 0));
      setAnalyticsStatus(`${weekly.length} weekly rows imported from ${file.name}. Analytics stays separate from Daily Reports.`);
      showToast("Weekly dashboard data imported.");
    } catch {
      setAnalyticsStatus("Could not read that JSON file. Use dashboard/home_dashboard_data.json.");
    }
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(generatedReport);
      setCsvStatus("Daily report copied to clipboard.");
      setReportStatus("Copied");
      showToast("Daily report copied.");
    } catch {
      setCsvStatus("Clipboard permission was blocked. Select the report text and copy manually.");
    }
  }

  async function copyReportAndOpenLark() {
    try {
      await navigator.clipboard.writeText(generatedReport);
      setCsvStatus(
        isMobileDevice()
          ? "Daily report copied. Lark App is opening so you can choose the chat and send it."
          : "Daily report copied. Lark is opening in a new tab so you can choose the chat and send it."
      );
      setReportStatus("Copied for Lark");
      showToast("Report copied. Opening Lark.");
    } catch {
      setCsvStatus("Clipboard permission was blocked. Lark opened, but copy the report manually before sending.");
      showToast("Lark opened. Copy manually if needed.");
    }

    if (isMobileDevice()) {
      window.location.href = larkAppOpenUrl;
      return;
    }

    window.open(larkWebUrl, "_blank", "noopener,noreferrer");
  }

  function addDraftShow() {
    const nextIndex = scheduledShows.length + 1;
    const draft: ScheduledShow = {
      id: `draft-show-${Date.now()}`,
      date: showInfo.date || "New date",
      title: `Draft Show ${nextIndex}`,
      startTime: showInfo.startTime || "10:00 AM",
      endTime: showInfo.endTime || "1:00 PM",
      hosts: [showInfo.host || "Host"],
      operators: [showInfo.operator || "Operator"],
      showType: showInfo.showType || "Normal Show",
      productFocus: "To be assigned",
      giveawayPlan: "To be confirmed",
      sessionGmv: 0,
      sessionOrders: 0,
      hostMetrics: [{ host: showInfo.host || "Host", gmv: 0, orders: 0 }],
      notes: "Draft show created from the top action button."
    };
    setScheduledShows((current) => [draft, ...current]);
    setScheduleStatus(`${draft.title} added for ${draft.date}. Assign hosts, operators, product focus, and giveaway plan next.`);
    showToast(`${draft.title} added.`);
    navigateTo("schedule");
    setActiveLayer({ type: "show", show: draft });
  }

  function markReviewed() {
    setReportStatus("Reviewed");
    setCsvStatus("Daily report marked as reviewed.");
    saveGeneratedReportSnapshot();
    showToast("Daily report marked as reviewed.");
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <div className="brand-mark">
            <img src="/brand-logo.jpeg" alt="36 Sample Sale logo" />
          </div>
          <div>
            <h1>Daily Ops</h1>
            <p>Whatnot livestream control center</p>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => (
            <button
              className={segment === item.id ? "nav-item active" : "nav-item"}
              key={item.id}
              onClick={() => navigateTo(item.id)}
              type="button"
            >
              <span className="nav-label"><item.Icon aria-hidden="true" size={18} />{item.label}</span>
              <small>{item.description}</small>
            </button>
          ))}
        </nav>

        <section className="sidebar-note">
          <span>v1.1.5</span>
          <p>Schedule, records, CSV report generation. {cloudStatus}</p>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button
              aria-label={activeLayer ? "Close detail layer" : "Go back"}
              className={segmentHistory.length || activeLayer ? "back-button visible" : "back-button"}
              disabled={!segmentHistory.length && !activeLayer}
              onClick={goBack}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={19} />
            </button>
            <div>
              <p className="eyebrow">Whatnot Daily Ops</p>
              <h2>{navItems.find((item) => item.id === segment)?.label}</h2>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="secondary-button" type="button" onClick={addDraftShow}>
              <CalendarPlus aria-hidden="true" size={17} />
              New show
            </button>
            <button className="primary-button" type="button" onClick={() => navigateTo("report")}>
              <BookOpenText aria-hidden="true" size={17} />
              Generate report
            </button>
          </div>
        </header>

        <nav className="mobile-tabbar" aria-label="Mobile app navigation">
          {navItems.map((item) => (
            <button
              className={segment === item.id ? "mobile-tab active" : "mobile-tab"}
              key={item.id}
              onClick={() => navigateTo(item.id)}
              type="button"
            >
              <item.Icon aria-hidden="true" size={21} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {segment === "today" ? (
          <section className="screen-stack">
            <div className="kpi-grid">
              <MetricCard label="Today GMV" value={currency.format(metrics.gmv)} helper="From current report data" />
              <MetricCard label="GMV / Hour" value={currency.format(metrics.gmvPerHour)} helper={`${showInfo.livestreamHours} live hours`} />
              <MetricCard label="AOV" value={decimalCurrency.format(metrics.aov)} helper={`${metrics.orders} units sold`} />
              <MetricCard
                label="CPI Rate"
                value={formatPercent(metrics.targetPriceCompletion)}
                tone={metrics.targetPriceCompletion >= 1 ? "good" : metrics.targetPriceCompletion >= 0.8 ? "warn" : "danger"}
                helper="AOV / CPI"
              />
              <MetricCard
                label="Profit Margin"
                value={formatPercent(metrics.profitMargin)}
                tone={metrics.profitMargin >= 0.2 ? "good" : metrics.profitMargin >= 0 ? "warn" : "danger"}
                helper="Includes giveaway cost"
              />
              <MetricCard label="Bookmarks" value={showInfo.bookmarks.toLocaleString()} helper="Manual show input" />
            </div>

            <article className="panel chart-panel">
              <div className="panel-head">
                <div>
                  <h3>Daily performance trend</h3>
                  <p>
                    Selected: {selectedDailyTrend?.label ?? "No day"} · {formatTrendValue(trendMetric, selectedDailyTrend ? getTrendValue(selectedDailyTrend, trendMetric) : 0)}
                  </p>
                </div>
                <SegmentedControl<TrendMetric>
                  options={trendOptions}
                  value={trendMetric}
                  onChange={setTrendMetric}
                  label="Trend metric"
                />
              </div>
              <TrendChart
                data={dailyTrendData}
                metric={trendMetric}
                selectedIndex={Math.min(selectedDailyTrendIndex, dailyTrendData.length - 1)}
                onSelect={setSelectedDailyTrendIndex}
              />
              <div className="trend-editor">
                <label>Date<input type="date" value={manualTrendDate} onChange={(event) => setManualTrendDate(event.target.value)} /></label>
                <label>GMV<input inputMode="decimal" value={manualTrendGmv} onChange={(event) => setManualTrendGmv(event.target.value)} placeholder="7111" /></label>
                <label>GMV / Hour<input inputMode="decimal" value={manualTrendGmvPerHour} onChange={(event) => setManualTrendGmvPerHour(event.target.value)} placeholder="1422" /></label>
                <label>AOV<input inputMode="decimal" value={manualTrendAov} onChange={(event) => setManualTrendAov(event.target.value)} placeholder="10.16" /></label>
                <label>Orders<input inputMode="numeric" value={manualTrendOrders} onChange={(event) => setManualTrendOrders(event.target.value)} placeholder="700" /></label>
                <div className="trend-editor-actions">
                  <button className="secondary-button mini-button" type="button" onClick={loadSelectedTrendForEditing} disabled={isShowingSampleTrend || !selectedDailyTrend?.date}>Load selected</button>
                  <button className="primary-button mini-button" type="button" onClick={saveManualTrendPoint}>Add / Update</button>
                  <button className="text-button danger-text mini-button" type="button" onClick={deleteSelectedTrendPoint} disabled={isShowingSampleTrend || !selectedDailyTrend?.date}>Delete selected</button>
                </div>
              </div>
            </article>

            <div className="two-column">
              <article className="panel">
                <div className="panel-head">
                  <div>
                    <h3>Upcoming shows</h3>
                    <p>Multiple livestreams can run on the same day.</p>
                  </div>
                  <button className="text-button" type="button" onClick={() => navigateTo("schedule")}>Open</button>
                </div>
                <div className="shift-list">
                  {scheduledShows.slice(0, 4).map((show) => (
                    <button className="shift-row" key={show.id} onClick={() => openShowLayer(show)} type="button">
                      <div>
                        <strong>{show.date}</strong>
                        <span>{show.startTime} - {show.endTime}</span>
                      </div>
                      <p>{show.title} · {show.hosts.join(", ")}</p>
                      <ChevronRight aria-hidden="true" size={18} />
                    </button>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panel-head">
                  <div>
                    <h3>Risk alerts</h3>
                    <p>Auto-generated from current report metrics.</p>
                  </div>
                </div>
                <div className="alert-list">
                  {metrics.targetPriceCompletion < 0.7 ? <p className="alert danger">CPI Rate below 70%</p> : null}
                  {metrics.profitMargin < -0.5 ? <p className="alert danger">Margin below -50%</p> : null}
                  {skuGroups.risk.length ? <p className="alert warn">{skuGroups.risk.length} SKU below 80% CPI</p> : null}
                  {!skuGroups.winners.length ? <p className="alert warn">No 100%+ CPI SKU today</p> : null}
                  {metrics.targetPriceCompletion >= 0.8 && metrics.profitMargin >= 0 ? (
                    <p className="alert good">Pricing and margin are above the v1 control lines</p>
                  ) : null}
                </div>
              </article>
            </div>
          </section>
        ) : null}

        {segment === "schedule" ? (
          <section className="screen-stack">
            <div className="section-title">
              <div>
                <h3>Schedule calendar</h3>
                <p>Each day can contain multiple livestreams, with multiple hosts and operators assigned per show.</p>
                <p className="status-line">{scheduleStatus}</p>
              </div>
              <div className="button-row">
                <button className="secondary-button" type="button" onClick={exportScheduleExcel}>
                  <Download aria-hidden="true" size={17} />
                  Export Excel
                </button>
                <button className="primary-button" type="button" onClick={addDraftShow}>
                  <CalendarPlus aria-hidden="true" size={17} />
                  Add show
                </button>
              </div>
            </div>
            <article className="panel availability-panel">
              <div className="panel-head">
                <div>
                  <h3>Host availability parser</h3>
                  <p>Paste texts from hosts, detect available blocks, then select the blocks you want to add as schedule drafts.</p>
                </div>
                <MessageSquareCheck aria-hidden="true" size={24} />
              </div>
              <div className="availability-date-strip">
                <label>
                  <span>First date</span>
                  <input type="date" value={availabilityWeekStart} onChange={(event) => updateAvailabilityWeekStart(event.target.value)} />
                </label>
                <p>
                  Auto dates: Mon {formatShortScheduleDate(resolveAvailabilityDate("Mon", availabilityWeekStart))} · Tue {formatShortScheduleDate(resolveAvailabilityDate("Tue", availabilityWeekStart))} · Wed {formatShortScheduleDate(resolveAvailabilityDate("Wed", availabilityWeekStart))} · Thu {formatShortScheduleDate(resolveAvailabilityDate("Thu", availabilityWeekStart))} · Fri {formatShortScheduleDate(resolveAvailabilityDate("Fri", availabilityWeekStart))}
                </p>
              </div>
              <div className="availability-layout">
                <label className="note-field compact-note">
                  <span>Availability messages</span>
                  <textarea
                    value={availabilityText}
                    onChange={(event) => setAvailabilityText(event.target.value)}
                    placeholder="Mia: Mon 10am-2pm, Wed 12pm-5pm"
                  />
                </label>
                <div className="availability-actions">
                  <button className="primary-button" type="button" onClick={parseAvailabilityInput}>
                    <WandSparkles aria-hidden="true" size={17} />
                    Detect blocks
                  </button>
                  <button className="secondary-button" type="button" onClick={addAvailabilityToSchedule}>
                    <CalendarCheck2 aria-hidden="true" size={17} />
                    Add selected
                  </button>
                  <button className="text-button" type="button" onClick={clearAvailabilityParser}>
                    <Eraser aria-hidden="true" size={17} />
                    Clear
                  </button>
                </div>
              </div>
              <div className="availability-slots" aria-label="Detected availability blocks">
                {availabilitySlots.length ? availabilitySlots.map((slot) => (
                  <article className={slot.selected ? "availability-slot selected" : "availability-slot"} key={slot.id}>
                    <button
                      aria-pressed={slot.selected}
                      className="availability-slot-main"
                      onClick={() => toggleAvailabilitySlot(slot.id)}
                      type="button"
                    >
                      <span>{slot.host}</span>
                      <strong>{slot.day} · {slot.startTime} - {slot.endTime}</strong>
                      <small>{slot.selected ? "Selected for schedule" : "Tap to select"}</small>
                    </button>
                    <label className="availability-date-field">
                      <span>Date</span>
                      <input type="date" value={slot.date} onChange={(event) => updateAvailabilitySlotDate(slot.id, event.target.value)} />
                    </label>
                  </article>
                )) : (
                  <p className="empty-chart">Detected blocks will appear here. Manual Add show stays available above.</p>
                )}
              </div>
            </article>
            <article className="panel team-roster-panel">
              <div className="panel-head">
                <div>
                  <h3>Active team roster</h3>
                  <p>Keep active hosts and operators here so schedule colors stay consistent as people join or leave.</p>
                </div>
              </div>
              <div className="team-roster-form">
                <label>
                  <span>Name</span>
                  <input
                    value={newTeamMemberName}
                    onChange={(event) => setNewTeamMemberName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addTeamMember();
                      }
                    }}
                    placeholder="Nick"
                  />
                </label>
                <label>
                  <span>Role</span>
                  <select value={newTeamMemberRole} onChange={(event) => setNewTeamMemberRole(event.target.value as TeamRole)}>
                    {teamRoleOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <button className="secondary-button" type="button" onClick={addTeamMember}>Add person</button>
              </div>
              <div className="team-roster-list">
                {teamMembers.map((member) => (
                  <article className={member.active ? "team-member-card active" : "team-member-card"} key={member.id}>
                    <button className="team-member-toggle" type="button" onClick={() => toggleTeamMemberActive(member.id)}>
                      <PersonChips names={[member.name]} role={member.role === "operator" ? "operator" : "host"} />
                      <span>{member.active ? "Active" : "Inactive"}</span>
                    </button>
                  <select value={member.role} onChange={(event) => updateTeamMemberRole(member.id, event.target.value as TeamRole)}>
                    {teamRoleOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                  <button
                    aria-label={`Delete ${member.name} from roster`}
                    className="icon-button team-delete-button"
                    onClick={() => deleteTeamMember(member.id)}
                    type="button"
                  >
                    <X aria-hidden="true" size={15} />
                  </button>
                </article>
              ))}
              </div>
            </article>
            <article className="panel weekly-schedule-overview">
              <div className="panel-head">
                <div>
                  <h3>Weekly overview</h3>
                  <p>Quick scan by date, time, host, and operator. Tap a block to edit details.</p>
                </div>
              </div>
              <div className="week-strip" aria-label="Weekly schedule overview">
                {scheduleByDate.map((day) => (
                  <div className="week-day-column" key={`overview-${day.date}`}>
                    <div className="week-day-head">
                      <strong>{formatShortScheduleDate(day.date)}</strong>
                      <span>{getScheduleDayName(day.date)}</span>
                    </div>
                    <div className="timeline-blocks">
                      {day.shows.map((show) => (
                        <button className="timeline-show" key={`timeline-${show.id}`} onClick={() => openShowLayer(show)} type="button">
                          <strong>{show.startTime} - {show.endTime}</strong>
                          <span className="person-chip-row" aria-label="Hosts">
                            <PersonChips names={show.hosts} role="host" />
                          </span>
                          <small className="person-chip-row" aria-label="Operators">
                            <PersonChips names={show.operators} role="operator" />
                          </small>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
            <div className="schedule-days">
              {scheduleByDate.map((day) => (
                <article className="day-card" key={day.date}>
                  <div className="card-date">
                    <div>
                      <strong>{formatScheduleDate(day.date)}</strong>
                      <span>{day.shows.length} livestream{day.shows.length > 1 ? "s" : ""}</span>
                    </div>
                    <button className="text-button danger-text" type="button" onClick={() => clearScheduleDate(day.date)}>
                      Clear day
                    </button>
                  </div>
                  <div className="show-list">
                    {day.shows.map((show) => (
                      <article className="show-card compact-show-card" key={show.id}>
                        <button className="show-card-main" onClick={() => openShowLayer(show)} type="button">
                          <div>
                            <h4>{show.title}</h4>
                            <p>{show.startTime} - {show.endTime}</p>
                            <span className="person-chip-row" aria-label="Hosts">
                              <PersonChips names={show.hosts} role="host" />
                            </span>
                            <small className="show-session-metrics">{formatShowHostSummary(show)}</small>
                          </div>
                          <span className="person-chip-row operator-chip-row" aria-label="Operators">
                            <PersonChips names={show.operators} role="operator" />
                          </span>
                        </button>
                        <div className="show-card-actions">
                          <button className="secondary-button mini-button" onClick={() => openShowLayer(show)} type="button">Edit</button>
                          <button className="text-button danger-text mini-button" onClick={() => deleteScheduledShow(show.id)} type="button">Delete</button>
                        </div>
                        <p className="compact-show-meta">{show.showType} · {show.productFocus}</p>
                      </article>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {segment === "report" ? (
          <section className="screen-stack">
            <div className="upload-panel">
              <div>
                <h3>Upload Whatnot sales CSV</h3>
                <p>{csvStatus}</p>
              </div>
              <div className="upload-actions">
                <label className="file-button">
                  Select CSV
                  <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} />
                </label>
                <label className="inline-date-field">
                  Trend date
                  <input type="date" value={csvTrendDate} onChange={(event) => setCsvTrendDate(event.target.value)} />
                </label>
                <button className="secondary-button clear-data-button" type="button" onClick={clearCsvData} disabled={!salesItems.length && !salesOutputs}>
                  <Eraser aria-hidden="true" size={16} />
                  Clear CSV
                </button>
              </div>
            </div>

            <div className="form-grid">
              <label>Date<input type="date" value={showInfo.date} onChange={(event) => updateShow("date", event.target.value)} /></label>
              <label>Show name<input value={showInfo.showName} onChange={(event) => updateShow("showName", event.target.value)} /></label>
              <label>Show type<select value={showInfo.showType} onChange={(event) => updateShow("showType", event.target.value)}>
                <option>Normal Show</option>
                <option>Event Show</option>
                <option>Clearance Show</option>
                <option>Test Show</option>
              </select></label>
              <label>Livestream hours<input type="number" min="0" step="0.25" value={showInfo.livestreamHours} onChange={(event) => updateShow("livestreamHours", Number(event.target.value))} /></label>
              <label>Bookmarks<input type="number" min="0" value={showInfo.bookmarks} onChange={(event) => updateShow("bookmarks", Number(event.target.value))} /></label>
              <label>On-time start<select value={showInfo.onTimeStart} onChange={(event) => updateShow("onTimeStart", event.target.value)}>
                <option>YES</option>
                <option>NO</option>
              </select></label>
            </div>

            <div className="kpi-grid compact">
              <MetricCard label="GMV" value={decimalCurrency.format(metrics.gmv)} />
              <MetricCard label="AOV" value={decimalCurrency.format(metrics.aov)} />
              <MetricCard label="CPI" value={decimalCurrency.format(metrics.cpi)} />
              <MetricCard label="Promo cost" value={decimalCurrency.format(metrics.giveawayCost)} />
              <MetricCard label="Target completion" value={formatPercent(metrics.targetPriceCompletion)} />
            </div>

            <article className="panel generated-data-panel">
              <div className="panel-head">
                <div>
                  <h3>Generated sales data</h3>
                  <p>
                    {salesOutputs
                      ? `${salesOutputs.salesData.filter((row) => row.productName && row.productName !== "Cancelled Orders" && row.productName !== "Failed Orders").length} grouped product rows from ${salesOutputs.sourceFile}.`
                      : "Upload a raw Whatnot CSV to auto-generate salesData, migrateData, and financeData."}
                  </p>
                </div>
                <div className="button-row">
                  <button className="secondary-button" disabled={!salesOutputs} type="button" onClick={() => exportGeneratedSalesData("salesData")}>
                    <Download aria-hidden="true" size={16} />
                    salesData
                  </button>
                  <button className="secondary-button" disabled={!salesOutputs} type="button" onClick={() => exportGeneratedSalesData("migrateData")}>
                    <Download aria-hidden="true" size={16} />
                    migrateData
                  </button>
                  <button className="secondary-button" disabled={!salesOutputs} type="button" onClick={() => exportGeneratedSalesData("financeData")}>
                    <Download aria-hidden="true" size={16} />
                    financeData
                  </button>
                </div>
              </div>
              {salesOutputs ? (
                <div className="generated-data-layout">
                  <div className="table-wrap compact-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Cost</th>
                          <th>Avg price</th>
                          <th>Orders</th>
                          <th>Total sales</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesOutputs.salesData.slice(0, 8).map((row, index) => (
                          <tr key={`${row.productName}-${index}`}>
                            <td>{row.productName || "-"}</td>
                            <td>{typeof row.costPerItem === "number" ? decimalCurrency.format(row.costPerItem) : row.costPerItem}</td>
                            <td>{typeof row.averagePrice === "number" ? decimalCurrency.format(row.averagePrice) : row.averagePrice}</td>
                            <td>{row.numberOfOrders}</td>
                            <td>{typeof row.totalSales === "number" ? decimalCurrency.format(row.totalSales) : row.totalSales}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="generated-data-summary">
                    <p><strong>Cancelled</strong><span>{salesOutputs.cancelledOrders.length || "None"}</span></p>
                    <p><strong>Failed</strong><span>{salesOutputs.failedOrders.length || "None"}</span></p>
                    <p><strong>Migrate rows</strong><span>{salesOutputs.migrateData.length}</span></p>
                    <p><strong>Finance rows</strong><span>{salesOutputs.financeData.length}</span></p>
                  </div>
                </div>
              ) : (
                <div className="empty-chart">This replaces the manual Python step: raw CSV in, clean salesData out.</div>
              )}
            </article>

            <div className="two-column wide-left">
              <article className="panel">
                <div className="panel-head">
                  <div>
                    <h3>CPI product analysis</h3>
                    <p>
                      Click a bar to inspect the SKU. Selected: {selectedSku ? selectedSku.productName : "No SKU"}
                    </p>
                  </div>
                  <SegmentedControl<CpiView>
                    options={cpiViewOptions}
                    value={cpiView}
                    onChange={setCpiView}
                    label="CPI bucket"
                  />
                </div>
                <CpiBarChart rows={cpiChartRows} selectedSkuId={selectedSku?.id} onSelect={openSkuLayer} />
                {selectedSku ? (
                  <div className="sku-detail">
                    <div>
                      <span>Selected SKU</span>
                      <strong>{selectedSku.productName}</strong>
                    </div>
                    <p>
                      {selectedSku.category} · ASP {decimalCurrency.format(selectedSku.averagePrice)} · CPI {decimalCurrency.format(selectedSku.costPerItem)} · CPI Rate {formatPercent(getCpiRate(selectedSku))}
                    </p>
                  </div>
                ) : null}
                <SkuTable title="100%+ CPI SKUs" rows={skuGroups.winners} />
                <SkuTable title="Below 80% CPI SKUs" rows={skuGroups.risk} />
              </article>

              <article className="panel report-panel">
                <div className="panel-head">
                  <div>
                    <h3>Generated Daily Report</h3>
                    <p>Status: {reportStatus}</p>
                  </div>
                  <div className="button-row">
                    <button className="secondary-button" type="button" onClick={copyReport}>Copy</button>
                    <button className="secondary-button" type="button" onClick={copyReportAndOpenLark}>
                      <Send aria-hidden="true" size={16} />
                      Copy & open Lark
                    </button>
                    <button className="secondary-button" type="button" onClick={saveGeneratedReportSnapshot}>Save report</button>
                    <button className="primary-button" type="button" onClick={markReviewed}>Mark reviewed</button>
                  </div>
                </div>
                <pre>{generatedReport}</pre>
              </article>
            </div>
          </section>
        ) : null}

        {segment === "records" ? (
          <section className="screen-stack">
            <div className="section-title">
              <div>
                <h3>Livestream records</h3>
                <p>Current report notes feed today's summary. Saved records become a cumulative ops log for future AI review.</p>
              </div>
              <div className="button-row">
                <button className="primary-button" type="button" onClick={saveCurrentNotesToRecords}>
                  Save to history
                </button>
              </div>
            </div>

            <article className="panel strategy-panel">
              <div className="panel-head">
                <div>
                  <h3>Strategy</h3>
                  <p>Edit the blocks and items, then select only the strategy tags that mattered today.</p>
                </div>
                <button className="secondary-button mini-button" type="button" onClick={addStrategyGroup}>Add block</button>
              </div>
              <div className="strategy-group-grid">
                {strategyGroups.map((group) => (
                  <section className="strategy-group" key={group.id}>
                    <div className="strategy-group-head">
                      <label>
                        <span>Block</span>
                        <input value={group.label} onChange={(event) => updateStrategyGroupLabel(group.id, event.target.value)} />
                      </label>
                      <button aria-label={`Delete ${group.label}`} className="icon-button strategy-delete-button" type="button" onClick={() => deleteStrategyGroup(group.id)}>
                        <X aria-hidden="true" size={15} />
                      </button>
                    </div>
                    <div className="strategy-item-list">
                      {group.items.map((action, index) => (
                        <div className="strategy-item-row" key={`${group.id}-${index}`}>
                          <button
                            aria-pressed={opsNotes.actions.includes(action)}
                            className={opsNotes.actions.includes(action) ? "strategy-select selected" : "strategy-select"}
                            onClick={() => toggleAction(action)}
                            type="button"
                          />
                          <input value={action} onChange={(event) => updateStrategyItem(group.id, index, event.target.value)} />
                          <button aria-label={`Delete ${action}`} className="icon-button strategy-item-delete" type="button" onClick={() => deleteStrategyItem(group.id, index)}>
                            <X aria-hidden="true" size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button className="text-button mini-button strategy-add-item" type="button" onClick={() => addStrategyItem(group.id)}>Add item</button>
                  </section>
                ))}
              </div>
            </article>

            <div className="notes-grid">
              <NoteField label="Traffic & audience reaction" value={opsNotes.traffic} onChange={(value) => updateNotes("traffic", value)} />
              <NoteField label="Promotion / giveaway usage" value={opsNotes.giveaway} onChange={(value) => updateNotes("giveaway", value)} />
              <NoteField label="Host performance / pacing" value={opsNotes.host} onChange={(value) => updateNotes("host", value)} />
              <NoteField label="Inventory / clearance progress" value={opsNotes.inventory} onChange={(value) => updateNotes("inventory", value)} />
              <NoteField label="Game / strategy" value={opsNotes.kpiContext} onChange={(value) => updateNotes("kpiContext", value)} />
              <NoteField label="Competitor / market notes" value={opsNotes.competitor} onChange={(value) => updateNotes("competitor", value)} />
            </div>

            <article className="panel host-performance-panel">
              <div className="panel-head">
                <div>
                  <h3>Host performance data</h3>
                  <p>Manual session GMV and orders from Schedule. This is kept separate for future weekly report charts.</p>
                </div>
              </div>
              <div className="host-performance-grid">
                {hostPerformanceRows.length ? hostPerformanceRows.map((row) => (
                  <article className="host-performance-card" key={row.host}>
                    <PersonChips names={[row.host]} role="host" />
                    <strong>{decimalCurrency.format(row.gmv)}</strong>
                    <p>{Math.round(row.orders).toLocaleString()} orders · {row.sessions} session{row.sessions === 1 ? "" : "s"} · AOV {row.orders ? decimalCurrency.format(row.gmv / row.orders) : "$0.00"}</p>
                    <small>{row.hours ? `${decimalCurrency.format(row.gmv / row.hours)} / hour` : "No hour data"}</small>
                  </article>
                )) : (
                  <div className="empty-chart">Add session GMV and orders in Schedule detail to build host performance data.</div>
                )}
              </div>
              {hostSessionRows.length ? (
                <div className="host-session-table">
                  {hostSessionRows.slice(0, 12).map((row) => (
                    <div className="host-session-row" key={`host-session-${row.show.id}-${row.host}`}>
                      <span>{formatScheduleDate(row.show.date)}</span>
                      <strong>{row.show.startTime} - {row.show.endTime} · {row.show.title}</strong>
                      <span className="person-chip-row"><PersonChips names={[row.host]} role="host" /></span>
                      <span>{decimalCurrency.format(row.gmv)}</span>
                      <span>{Math.round(row.orders).toLocaleString()} orders</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>

            <article className="panel record-log-panel">
              <div className="panel-head">
                <div>
                  <h3>Cumulative ops log</h3>
                  <p>{recordPatternText}</p>
                </div>
                <label className="compact-select">
                  <span>Filter</span>
                  <select value={recordCategoryFilter} onChange={(event) => setRecordCategoryFilter(event.target.value as OpsRecordCategory | "all")}>
                    {recordCategoryOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="record-summary-grid">
                <article>
                  <span>Saved days</span>
                  <strong>{groupedOpsRecordDays.length}</strong>
                </article>
                <article>
                  <span>Latest day</span>
                  <strong>{latestRecordGroup?.date ? formatScheduleDate(latestRecordGroup.date) : "None yet"}</strong>
                </article>
                <article>
                  <span>Top issue</span>
                  <strong>{repeatedRecordCategories[0] ?? "None yet"}</strong>
                </article>
              </div>

              <div className="record-list">
                {groupedOpsRecordDays.length ? groupedOpsRecordDays.map((group) => {
                  const categoryCounts = group.records.reduce<Record<string, number>>((counts, record) => {
                    counts[record.category] = (counts[record.category] ?? 0) + 1;
                    return counts;
                  }, {});
                  const topNotes = group.records
                    .filter((record) => record.category !== "actions")
                    .slice(0, 3)
                    .map((record) => `${recordCategoryLabels[record.category]}: ${compactReportText(record.note, "", 120)}`);
                  const strategyRecord = group.records.find((record) => record.category === "actions");
                  return (
                  <article className="record-day-card" key={group.date}>
                    <div>
                      <span>{formatScheduleDate(group.date)} · {group.records.length} notes · {group.reports.length} report{group.reports.length === 1 ? "" : "s"}</span>
                      <strong>{Array.from(new Set([...group.records.map((record) => record.showName), ...group.reports.map((report) => report.showName)])).filter(Boolean).join(", ") || "Saved log"}</strong>
                      <p>{topNotes.length ? topNotes.join(" | ") : group.reports.length ? "Generated report saved for this day." : "Only strategy tags were saved for this day."}</p>
                      {strategyRecord ? <small>Strategy: {compactReportText(strategyRecord.note, "", 140)}</small> : null}
                      <div className="record-category-pills">
                        {Object.entries(categoryCounts).map(([category, count]) => (
                          <span key={`${group.date}-${category}`}>{recordCategoryLabels[category as OpsRecordCategory]} · {count}</span>
                        ))}
                        {group.reports.map((report) => (
                          <span key={`${group.date}-${report.id}`}>Report · {new Date(report.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                        ))}
                      </div>
                      {group.records.length ? (
                        <details className="record-details">
                          <summary>View notes</summary>
                          {group.records.map((record) => (
                            <p key={`note-${record.id}`}><strong>{recordCategoryLabels[record.category]}:</strong> {record.note}</p>
                          ))}
                        </details>
                      ) : null}
                      {group.reports.length ? (
                        <details className="record-details report-details">
                          <summary>View generated report</summary>
                          {group.reports.map((report) => (
                            <div key={`report-${report.id}`}>
                              <pre>{report.report}</pre>
                              <button className="text-button danger-text mini-button" type="button" onClick={() => deleteReportSnapshot(report.id)}>Delete report</button>
                            </div>
                          ))}
                        </details>
                      ) : null}
                    </div>
                    <div className="record-day-actions">
                      <button className="secondary-button mini-button" type="button" onClick={() => applyRecordGroupToReport(group.records)} disabled={!group.records.length}>Use day</button>
                      <button className="text-button danger-text mini-button" type="button" onClick={() => deleteOpsLogDay(group.records, group.reports)}>Delete day</button>
                    </div>
                  </article>
                  );
                }) : (
                  <div className="empty-chart">No records match this filter yet.</div>
                )}
              </div>
            </article>
          </section>
        ) : null}

        {segment === "analytics" ? (
          <section className="screen-stack">
            <div className="section-title">
              <div>
                <h3>Daily Ops Insights</h3>
                <p>Decision-focused analytics for today's show quality, SKU mix, margin drag, and next-show actions.</p>
              </div>
              <div className="button-row">
                <label className="file-button subtle">
                  Import dashboard JSON
                  <input type="file" accept=".json,application/json" onChange={handleAnalyticsImport} />
                </label>
              </div>
            </div>

            <div className="analytics-layout">
              <div className="analytics-main">
                <div className="analytics-summary-grid daily-insight-grid">
                  {dailyInsightCards.map((card) => (
                    <article className="analytics-summary-card" key={card.label}>
                      <span>{card.label}</span>
                      <strong>{card.value}</strong>
                      <p>{card.helper}</p>
                    </article>
                  ))}
                </div>

                <div className="two-column analytics-two-column">
                  <article className="panel daily-overview-panel">
                    <div className="panel-head">
                      <div>
                        <h3>Category GMV mix</h3>
                        <p>Shows where today's revenue is actually coming from.</p>
                      </div>
                    </div>
                    {categoryContribution.length ? (
                      <div className="daily-overview-chart">
                        {categoryContribution.map((item) => (
                          <div className="daily-overview-bar compact-bar" key={item.category}>
                            <div>
                              <span>{item.category}</span>
                              <strong>{currency.format(item.gmv)}</strong>
                              <small>{formatPercent(metrics.gmv ? item.gmv / metrics.gmv : 0)} of GMV</small>
                            </div>
                            <div className="daily-bar-track">
                              <span style={{ width: `${Math.max(5, Math.min(100, metrics.gmv ? (item.gmv / metrics.gmv) * 100 : 0))}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-chart">Upload a daily CSV to see category contribution.</div>
                    )}
                  </article>

                  <article className="panel analytics-insights">
                    <div className="panel-head">
                      <div>
                        <h3>SKU quality</h3>
                        <p>Use this to decide what to push or reduce next show.</p>
                      </div>
                    </div>
                    <div className="insight-list vertical">
                      <p><strong>100%+ CPI</strong><span>{skuGroups.winners.length ? `${skuGroups.winners.length} SKUs can stay in stronger traffic windows.` : "No strong CPI SKU detected yet."}</span></p>
                      <p><strong>Margin drag</strong><span>{topDragItems.length ? topDragItems.map((item) => `${item.productName} ${formatPercent(getCpiRate(item))}`).join("; ") : "No below-80% CPI drag detected."}</span></p>
                      <p><strong>Promotion load</strong><span>{`${decimalCurrency.format(metrics.giveawayCost)} giveaway / promotion cost tracked today.`}</span></p>
                    </div>
                  </article>
                </div>

                <article className="panel analytics-insights">
                  <div className="panel-head">
                    <div>
                      <h3>Next show recommendation</h3>
                      <p>Generated from current daily CSV, CPI buckets, promotion spend, and ops notes.</p>
                    </div>
                  </div>
                  <div className="insight-list">
                    {nextShowRecommendations.map((recommendation, index) => (
                      <p key={recommendation}><strong>Action {index + 1}</strong><span>{recommendation}</span></p>
                    ))}
                  </div>
                </article>

                <article className="panel daily-overview-panel">
                  <div className="panel-head">
                    <div>
                      <h3>Recent daily GMV</h3>
                      <p>{latestExternalDaily.length ? `Small context preview from Report Cockpit. Updated ${externalDashboard?.generated_at ?? "recently"}.` : "Optional daily context appears here when Report Cockpit data is available."}</p>
                    </div>
                  </div>
                  {latestExternalDaily.length ? (
                    <DailyOverviewChart data={latestExternalDaily} />
                  ) : (
                    <div className="empty-chart">No external daily rows loaded. Today's local CSV insights still work above.</div>
                  )}
                </article>
              </div>

              <aside className="analytics-side">
                <article className="panel analytics-hero compact-cockpit">
                  <div>
                    <span>Weekly source</span>
                    <h3>Report Cockpit</h3>
                    <p>Full weekly GMV, category, and SKU trend review stays in the existing dashboard.</p>
                  </div>
                  <a className="secondary-button link-button" href={weeklyDashboardUrl} target="_blank" rel="noreferrer">
                    <ExternalLink aria-hidden="true" size={17} />
                    Open
                  </a>
                </article>

                <div className="sidebar-block-toolbar">
                  <div>
                    <span>Custom sidebar</span>
                    <p>Choose, add, or remove the small blocks in this column.</p>
                  </div>
                  <button className="secondary-button mini-button" type="button" onClick={addSidebarMagnet}>
                    Add
                  </button>
                </div>

                {sidebarMagnetCards.map((card) => (
                  <article className="analytics-summary-card cockpit-status sidebar-magnet-card" key={card.id}>
                    <div className="sidebar-magnet-controls">
                      <label>
                        <span>Metric</span>
                        <select value={card.metric} onChange={(event) => updateSidebarMagnet(card.id, event.target.value as MagnetMetric)}>
                          {magnetMetricOptions.map((option) => (
                            <option key={option.id} value={option.id}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <button className="icon-button sidebar-delete-button" aria-label={`Delete ${card.label}`} type="button" onClick={() => deleteSidebarMagnet(card.id)}>
                        <X aria-hidden="true" size={16} />
                      </button>
                    </div>
                    <span>{card.label}</span>
                    <strong>{card.value}</strong>
                    <p>{card.helper}</p>
                  </article>
                ))}
              </aside>
            </div>

            {weeklyTrendData.length ? (
              <article className="panel chart-panel secondary-analytics-chart">
                <div className="panel-head">
                  <div>
                    <h3>Imported weekly preview</h3>
                    <p>
                      Selected: {selectedWeeklyTrend?.label ?? "No week"} · {formatTrendValue(trendMetric, selectedWeeklyTrend ? getTrendValue(selectedWeeklyTrend, trendMetric) : 0)}
                    </p>
                  </div>
                  <SegmentedControl<TrendMetric>
                    options={trendOptions}
                    value={trendMetric}
                    onChange={setTrendMetric}
                    label="Analytics metric"
                  />
                </div>
                <TrendChart
                  data={weeklyTrendData}
                  metric={trendMetric}
                  selectedIndex={Math.min(selectedWeeklyTrendIndex, weeklyTrendData.length - 1)}
                  onSelect={setSelectedWeeklyTrendIndex}
                />
              </article>
            ) : null}
          </section>
        ) : null}

        <InteractionSheet
          layer={activeLayer}
          onClose={() => setActiveLayer(null)}
          onUpdateShow={updateScheduledShow}
          activeHosts={activeHostMembers}
          activeOperators={activeOperatorMembers}
        />

        {toast ? (
          <div className="toast" role="status" aria-live="polite">
            <CheckCircle2 aria-hidden="true" size={18} />
            <span>{toast}</span>
            <button aria-label="Dismiss message" onClick={() => setToast("")} type="button">
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function InteractionSheet({
  layer,
  onClose,
  onUpdateShow,
  activeHosts,
  activeOperators
}: {
  layer: ActiveLayer;
  onClose: () => void;
  onUpdateShow: <K extends keyof ScheduledShow>(id: string, key: K, value: ScheduledShow[K]) => void;
  activeHosts: TeamMember[];
  activeOperators: TeamMember[];
}) {
  const [hostDraft, setHostDraft] = useState("");
  const [operatorDraft, setOperatorDraft] = useState("");

  useEffect(() => {
    if (layer?.type !== "show") return;
    setHostDraft(layer.show.hosts.join(", "));
    setOperatorDraft(layer.show.operators.join(", "));
  }, [layer?.type, layer?.type === "show" ? layer.show.id : null]);

  if (!layer) return null;

  function commitPeopleDraft(field: "hosts" | "operators", value: string) {
    if (layer?.type !== "show") return;
    onUpdateShow(layer.show.id, field, splitListInput(value));
  }

  function togglePerson(field: "hosts" | "operators", name: string) {
    if (layer?.type !== "show") return;
    const next = toggleName(layer.show[field], name);
    onUpdateShow(layer.show.id, field, next);
    if (field === "hosts") setHostDraft(next.join(", "));
    if (field === "operators") setOperatorDraft(next.join(", "));
  }

  function updateHostMetric(host: string, key: "gmv" | "orders", value: number) {
    if (layer?.type !== "show") return;
    const hostMetrics = getShowHostMetrics(layer.show).map((metric) =>
      metric.host.toLowerCase() === host.toLowerCase() ? { ...metric, [key]: value } : metric
    );
    const totals = hostMetrics.reduce(
      (sum, metric) => ({
        gmv: sum.gmv + metric.gmv,
        orders: sum.orders + metric.orders
      }),
      { gmv: 0, orders: 0 }
    );

    onUpdateShow(layer.show.id, "hostMetrics", hostMetrics);
    onUpdateShow(layer.show.id, "sessionGmv", totals.gmv);
    onUpdateShow(layer.show.id, "sessionOrders", totals.orders);
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <aside
        aria-modal="true"
        className="detail-sheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-head">
          <div>
            <span>{layer.type === "show" ? "Schedule detail" : "SKU detail"}</span>
            <h3>{layer.type === "show" ? layer.show.title : layer.item.productName}</h3>
          </div>
          <button aria-label="Close detail layer" className="icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" size={20} />
          </button>
        </header>

        {layer.type === "show" ? (
          <form className="sheet-form">
            <div className="sheet-form-grid">
              <label>
                <span>Show title</span>
                <input
                  value={layer.show.title}
                  onChange={(event) => onUpdateShow(layer.show.id, "title", event.target.value)}
                />
              </label>
              <label>
                <span>Date</span>
                <input
                  type={/^\d{4}-\d{2}-\d{2}$/.test(layer.show.date) ? "date" : "text"}
                  value={layer.show.date}
                  onChange={(event) => onUpdateShow(layer.show.id, "date", event.target.value)}
                />
              </label>
              <label>
                <span>Start time</span>
                <input
                  value={layer.show.startTime}
                  onChange={(event) => onUpdateShow(layer.show.id, "startTime", event.target.value)}
                  placeholder="10:30 AM"
                />
              </label>
              <label>
                <span>End time</span>
                <input
                  value={layer.show.endTime}
                  onChange={(event) => onUpdateShow(layer.show.id, "endTime", event.target.value)}
                  placeholder="1:30 PM"
                />
              </label>
              <label>
                <span>Show type</span>
                <select
                  value={layer.show.showType}
                  onChange={(event) => onUpdateShow(layer.show.id, "showType", event.target.value)}
                >
                  <option>Normal Show</option>
                  <option>Event Show</option>
                  <option>Clearance Show</option>
                  <option>Test Show</option>
                  <option>Availability Hold</option>
                </select>
              </label>
              <label>
                <span>Hosts</span>
                <input
                  value={hostDraft}
                  onChange={(event) => setHostDraft(event.target.value)}
                  onBlur={() => commitPeopleDraft("hosts", hostDraft)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitPeopleDraft("hosts", hostDraft);
                    }
                  }}
                  placeholder="Host A, Host B"
                />
              </label>
              <label>
                <span>Operators</span>
                <input
                  value={operatorDraft}
                  onChange={(event) => setOperatorDraft(event.target.value)}
                  onBlur={() => commitPeopleDraft("operators", operatorDraft)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitPeopleDraft("operators", operatorDraft);
                    }
                  }}
                  placeholder="Operator A, Operator B"
                />
              </label>
              <label>
                <span>Product focus</span>
                <input
                  value={layer.show.productFocus}
                  onChange={(event) => onUpdateShow(layer.show.id, "productFocus", event.target.value)}
                />
              </label>
            </div>
            <div className="sheet-people-picker">
              <div>
                <span>Active hosts</span>
                <div className="people-picker-row">
                  {activeHosts.length ? activeHosts.map((member) => (
                    <button
                      className={layer.show.hosts.some((name) => name.toLowerCase() === member.name.toLowerCase()) ? "people-picker-chip selected" : "people-picker-chip"}
                      key={`active-host-${member.id}`}
                      onClick={() => togglePerson("hosts", member.name)}
                      type="button"
                    >
                      <PersonChips names={[member.name]} role="host" />
                    </button>
                  )) : <p>No active hosts in roster.</p>}
                </div>
              </div>
              <div>
                <span>Active operators</span>
                <div className="people-picker-row">
                  {activeOperators.length ? activeOperators.map((member) => (
                    <button
                      className={layer.show.operators.some((name) => name.toLowerCase() === member.name.toLowerCase()) ? "people-picker-chip selected" : "people-picker-chip"}
                      key={`active-operator-${member.id}`}
                      onClick={() => togglePerson("operators", member.name)}
                      type="button"
                    >
                      <PersonChips names={[member.name]} role="operator" />
                    </button>
                  )) : <p>No active operators in roster.</p>}
                </div>
              </div>
            </div>
            <div className="sheet-host-performance-editor">
              <div className="sheet-mini-head">
                <span>Host session performance</span>
                <p>Fill each host's own GMV and orders for this scheduled block.</p>
              </div>
              <div className="host-metric-editor-list">
                {getShowHostMetrics(layer.show).length ? getShowHostMetrics(layer.show).map((metric) => (
                  <div className="host-metric-editor-row" key={`metric-${layer.show.id}-${metric.host}`}>
                    <PersonChips names={[metric.host]} role="host" />
                    <label>
                      <span>GMV</span>
                      <input
                        min="0"
                        step="1"
                        type="number"
                        value={metric.gmv || ""}
                        onChange={(event) => updateHostMetric(metric.host, "gmv", Number(event.target.value))}
                        placeholder="0"
                      />
                    </label>
                    <label>
                      <span>Orders</span>
                      <input
                        min="0"
                        step="1"
                        type="number"
                        value={metric.orders || ""}
                        onChange={(event) => updateHostMetric(metric.host, "orders", Number(event.target.value))}
                        placeholder="0"
                      />
                    </label>
                    <small>
                      {metric.orders ? `AOV ${decimalCurrency.format(metric.gmv / metric.orders)}` : "AOV $0.00"} · {getLiveHours(layer.show.startTime, layer.show.endTime) ? `${decimalCurrency.format(metric.gmv / getLiveHours(layer.show.startTime, layer.show.endTime))} / hour` : "$0 / hour"}
                    </small>
                  </div>
                )) : (
                  <p className="empty-chart">Add a host first, then enter GMV and orders.</p>
                )}
              </div>
            </div>
            <label>
              <span>Giveaway plan</span>
              <input
                value={layer.show.giveawayPlan}
                onChange={(event) => onUpdateShow(layer.show.id, "giveawayPlan", event.target.value)}
              />
            </label>
            <label>
              <span>Notes</span>
              <textarea
                value={layer.show.notes}
                onChange={(event) => onUpdateShow(layer.show.id, "notes", event.target.value)}
                rows={4}
              />
            </label>
            <p className="sheet-helper">Changes save to this draft immediately and update the schedule calendar behind this sheet.</p>
          </form>
        ) : (
          <dl className="sheet-list">
            <div><dt>Category</dt><dd>{layer.item.category}</dd></div>
            <div><dt>GMV</dt><dd>{decimalCurrency.format(layer.item.totalSales)}</dd></div>
            <div><dt>Orders</dt><dd>{layer.item.orders}</dd></div>
            <div><dt>Average selling price</dt><dd>{decimalCurrency.format(layer.item.averagePrice)}</dd></div>
            <div><dt>CPI</dt><dd>{decimalCurrency.format(layer.item.costPerItem)}</dd></div>
            <div><dt>CPI rate</dt><dd>{formatPercent(getCpiRate(layer.item))}</dd></div>
            <div><dt>Status</dt><dd>{getCpiRate(layer.item) >= 1 ? "Winning SKU" : getCpiRate(layer.item) >= 0.8 ? "Optimization SKU" : "Risk / drag SKU"}</dd></div>
          </dl>
        )}
      </aside>
    </div>
  );
}

function SkuTable({ title, rows }: { title: string; rows: SalesItem[] }) {
  return (
    <section className="sku-section">
      <h4>{title}</h4>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>ASP</th>
              <th>CPI</th>
              <th>CPI Rate</th>
              <th>Orders</th>
              <th>GMV</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row) => (
              <tr key={`${title}-${row.id}`}>
                <td>{row.productName}</td>
                <td>{row.category}</td>
                <td>{decimalCurrency.format(row.averagePrice)}</td>
                <td>{decimalCurrency.format(row.costPerItem)}</td>
                <td>{formatPercent(getCpiRate(row))}</td>
                <td>{row.orders}</td>
                <td>{decimalCurrency.format(row.totalSales)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7}>No SKU in this bucket.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NoteField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="note-field">
      <span>{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={5} />
    </label>
  );
}
