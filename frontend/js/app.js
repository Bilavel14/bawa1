const employeeSelect = document.getElementById("employeeSelect");
const monthSelect = document.getElementById("monthSelect");
const modeSelect = document.getElementById("modeSelect");
const saveState = document.getElementById("saveState");

const weekTabs = document.getElementById("weekTabs");
const weekTitle = document.getElementById("weekTitle");
const tasksAssigned = document.getElementById("tasksAssigned");
const tasksCompleted = document.getElementById("tasksCompleted");
const completionStatus = document.getElementById("completionStatus");
const qualityOutput = document.getElementById("qualityOutput");
const conceptualProgress = document.getElementById("conceptualProgress");
const remarks = document.getElementById("remarks");

const insightList = document.getElementById("insightList");
const monthlyScore = document.getElementById("monthlyScore");
const monthlyStatus = document.getElementById("monthlyStatus");
const trendIndicator = document.getElementById("trendIndicator");
const scoreChart = document.getElementById("scoreChart");
const taskChart = document.getElementById("taskChart");
const onTimeRate = document.getElementById("onTimeRate");
const avgQuality = document.getElementById("avgQuality");
const conceptTrend = document.getElementById("conceptTrend");

const sheetModal = document.getElementById("sheetModal");
const sheetTable = document.getElementById("sheetTable");
const sheetSubtitle = document.getElementById("sheetSubtitle");
const openSheetBtn = document.getElementById("openSheetBtn");
const closeSheetBtn = document.getElementById("closeSheetBtn");
const printSheetBtn = document.getElementById("printSheetBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");

const EMPLOYEES = [
  "Ayesha Khan",
  "Bilal Raza",
  "Fatima Noor",
  "Hassan Ali",
  "Ibrahim Ahmed",
  "Laiba Siddiq",
  "Mariam Iqbal",
  "Nadia Mir",
  "Omar Farooq",
  "Qasim Javed",
  "Rimsha Akhtar",
  "Sami Ullah",
  "Sarah Malik",
  "Usman Tariq",
  "Zara Sheikh",
];

const COMPLETION_SCORES = {
  "Completed on time": 5,
  "Completed late": 3,
  Incomplete: 1,
};

const QUALITY_SCORES = {
  Excellent: 5,
  Good: 4,
  Acceptable: 3,
  Weak: 2,
  "Not usable": 1,
};

const CONCEPTUAL_SCORES = {
  High: 5,
  Medium: 3,
  Low: 1,
};

let activeWeek = 1;

function buildMonthOptions() {
  const now = new Date();
  const options = [];
  for (let i = -3; i <= 8; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    options.push(value);
  }
  monthSelect.innerHTML = options
    .map((month) => `<option value="${month}">${month}</option>`)
    .join("");
  monthSelect.value = options[3];
}

function buildEmployeeOptions() {
  employeeSelect.innerHTML = EMPLOYEES.map(
    (name) => `<option value="${name}">${name}</option>`
  ).join("");
}

function storageKey(employee, month) {
  return `performance:${employee}:${month}`;
}

function emptyWeek() {
  return {
    tasksAssigned: "",
    tasksCompleted: "",
    completionStatus: "",
    qualityOutput: "",
    conceptualProgress: "",
    remarks: "",
  };
}

function loadWeekData() {
  const key = storageKey(employeeSelect.value, monthSelect.value);
  const stored = localStorage.getItem(key);
  if (!stored) {
    return {
      weeks: {
        1: emptyWeek(),
        2: emptyWeek(),
        3: emptyWeek(),
        4: emptyWeek(),
      },
    };
  }
  return JSON.parse(stored);
}

function saveWeekData(data) {
  const key = storageKey(employeeSelect.value, monthSelect.value);
  localStorage.setItem(key, JSON.stringify(data));
  saveState.textContent = "Saved locally";
  setTimeout(() => {
    saveState.textContent = "Auto-save ready";
  }, 1000);
}

function setFormDisabled(isDisabled) {
  [
    tasksAssigned,
    tasksCompleted,
    completionStatus,
    qualityOutput,
    conceptualProgress,
    remarks,
  ].forEach((input) => {
    input.disabled = isDisabled;
  });
}

function populateWeekForm() {
  const data = loadWeekData();
  const week = data.weeks[activeWeek] || emptyWeek();
  tasksAssigned.value = week.tasksAssigned;
  tasksCompleted.value = week.tasksCompleted;
  completionStatus.value = week.completionStatus;
  qualityOutput.value = week.qualityOutput;
  conceptualProgress.value = week.conceptualProgress;
  remarks.value = week.remarks;
}

function updateWeekForm() {
  const data = loadWeekData();
  data.weeks[activeWeek] = {
    tasksAssigned: tasksAssigned.value,
    tasksCompleted: tasksCompleted.value,
    completionStatus: completionStatus.value,
    qualityOutput: qualityOutput.value,
    conceptualProgress: conceptualProgress.value,
    remarks: remarks.value,
  };
  saveWeekData(data);
  renderDashboard();
}

function calculateWeeklyScore(week) {
  if (!week) return null;
  const completion = COMPLETION_SCORES[week.completionStatus];
  const quality = QUALITY_SCORES[week.qualityOutput];
  const conceptual = CONCEPTUAL_SCORES[week.conceptualProgress];
  if (!completion || !quality || !conceptual) return null;
  return Number((completion * 0.4 + quality * 0.4 + conceptual * 0.2).toFixed(2));
}

function calculateMetrics(data) {
  const weeks = [1, 2, 3, 4].map((week) => ({
    week,
    data: data.weeks[week],
    score: calculateWeeklyScore(data.weeks[week]),
  }));

  const validScores = weeks.map((item) => item.score).filter((score) => score !== null);
  const averageScore = validScores.length
    ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2))
    : 0;

  const completionScores = weeks
    .map((item) => COMPLETION_SCORES[item.data?.completionStatus])
    .filter(Boolean);
  const qualityScores = weeks
    .map((item) => QUALITY_SCORES[item.data?.qualityOutput])
    .filter(Boolean);
  const conceptualScores = weeks
    .map((item) => CONCEPTUAL_SCORES[item.data?.conceptualProgress])
    .filter(Boolean);

  const onTimeCount = weeks.filter(
    (item) => item.data?.completionStatus === "Completed on time"
  ).length;
  const totalWeeksWithStatus = weeks.filter((item) => item.data?.completionStatus).length;

  const avgCompletion = completionScores.length
    ? completionScores.reduce((a, b) => a + b, 0) / completionScores.length
    : 0;
  const avgQualityScore = qualityScores.length
    ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
    : 0;
  const avgConceptualScore = conceptualScores.length
    ? conceptualScores.reduce((a, b) => a + b, 0) / conceptualScores.length
    : 0;

  const onTimePercentage = totalWeeksWithStatus
    ? Math.round((onTimeCount / totalWeeksWithStatus) * 100)
    : 0;

  return {
    weeks,
    averageScore,
    onTimePercentage,
    avgCompletion,
    avgQualityScore,
    avgConceptualScore,
  };
}

function determineStatus(score) {
  if (score >= 4.2) return "Green";
  if (score >= 3.5) return "Amber";
  return "Red";
}

function determineTrend(scores) {
  const valid = scores.filter((score) => score !== null);
  if (valid.length < 2) return { label: "→", direction: "flat" };
  const delta = valid[valid.length - 1] - valid[valid.length - 2];
  if (delta > 0.2) return { label: "↑", direction: "up" };
  if (delta < -0.2) return { label: "↓", direction: "down" };
  return { label: "→", direction: "flat" };
}

function determineConceptTrend(conceptualScores) {
  const valid = conceptualScores.filter(Boolean);
  if (valid.length < 2) return "Stable";
  const delta = valid[valid.length - 1] - valid[0];
  if (delta > 0.5) return "Improving";
  if (delta < -0.5) return "Declining";
  return "Stable";
}

function buildInsights(metrics) {
  const flags = [];
  const scores = metrics.weeks.map((item) => item.score);
  const conceptualScores = metrics.weeks
    .map((item) => CONCEPTUAL_SCORES[item.data?.conceptualProgress])
    .filter(Boolean);

  if (scores.filter((score) => score !== null).length >= 3) {
    const first = scores.find((score) => score !== null);
    const last = [...scores].reverse().find((score) => score !== null);
    if (first !== null && last !== null && last - first >= 0.4) {
      flags.push({
        type: "positive",
        text: "Improvement trend detected across the month.",
      });
    } else if (first !== null && last !== null && last - first <= -0.4) {
      flags.push({
        type: "warning",
        text: "Overall decline in weekly scores this month.",
      });
    } else {
      flags.push({ type: "neutral", text: "Performance is steady week-to-week." });
    }
  }

  const lateCount = metrics.weeks.filter(
    (item) => item.data?.completionStatus === "Completed late"
  ).length;
  if (lateCount >= 2) {
    flags.push({ type: "warning", text: "Consistent late delivery flagged." });
  }

  const conceptTrendLabel = determineConceptTrend(conceptualScores);
  if (conceptTrendLabel === "Declining") {
    flags.push({ type: "warning", text: "Declining conceptual trend." });
  }

  const week3 = metrics.weeks.find((item) => item.week === 3)?.score;
  const week4 = metrics.weeks.find((item) => item.week === 4)?.score;
  const week1 = metrics.weeks.find((item) => item.week === 1)?.score;
  const week2 = metrics.weeks.find((item) => item.week === 2)?.score;
  if (week3 && week4 && week1 && week2) {
    if ((week3 + week4) / 2 - (week1 + week2) / 2 >= 0.5) {
      flags.push({
        type: "positive",
        text: "Strong recovery in Week 3–4.",
      });
    }
  }

  if (flags.length === 0) {
    flags.push({ type: "neutral", text: "Add weekly data to unlock insights." });
  }

  return flags;
}

function renderInsights(metrics) {
  const flags = buildInsights(metrics);
  insightList.innerHTML = flags
    .map((flag) => {
      const className =
        flag.type === "positive" ? "insight positive" : flag.type === "warning" ? "insight warning" : "insight";
      return `<div class="${className}">${flag.text}</div>`;
    })
    .join("");
}

function renderScoreChart(weeks) {
  const scores = weeks.map((item) => (item.score === null ? 0 : item.score));
  const maxScore = 5;
  const points = scores.map((score, index) => {
    const x = 50 + index * 120;
    const y = 180 - (score / maxScore) * 140;
    return { x, y };
  });
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x},${point.y}`)
    .join(" ");

  scoreChart.innerHTML = `
    <svg viewBox="0 0 500 200" role="img" aria-label="Weekly score trend">
      <defs>
        <linearGradient id="scoreLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#1f4bf2" />
          <stop offset="100%" stop-color="#38bdf8" />
        </linearGradient>
      </defs>
      <path d="${path}" fill="none" stroke="url(#scoreLine)" stroke-width="3" />
      ${points
        .map(
          (point, index) =>
            `<circle cx="${point.x}" cy="${point.y}" r="5" fill="#1f4bf2">
              <title>Week ${index + 1}: ${scores[index].toFixed(2)}</title>
            </circle>`
        )
        .join("")}
      ${points
        .map(
          (point, index) =>
            `<text x="${point.x - 12}" y="195" font-size="12" fill="#6b7280">W${index + 1}</text>`
        )
        .join("")}
    </svg>
  `;
}

function renderTaskChart(weeks) {
  const rows = weeks.map((item) => {
    const assigned = Number(item.data?.tasksAssigned || 0);
    const completed = Number(item.data?.tasksCompleted || 0);
    const max = Math.max(assigned, completed, 1);
    const assignedPercent = Math.round((assigned / max) * 100);
    const completedPercent = Math.round((completed / max) * 100);
    return `
      <div class="bar-row">
        <strong>W${item.week}</strong>
        <div class="bar-grid">
          <div class="bar assigned"><span style="width:${assignedPercent}%"></span></div>
          <div class="bar completed"><span style="width:${completedPercent}%"></span></div>
        </div>
      </div>
    `;
  });

  taskChart.innerHTML = `<div class="bar-grid">${rows.join("")}</div>`;
}

function updateTiles(metrics) {
  monthlyScore.textContent = metrics.averageScore.toFixed(2);
  const status = determineStatus(metrics.averageScore);
  monthlyStatus.textContent = status;
  monthlyStatus.className =
    status === "Green"
      ? "status-green"
      : status === "Amber"
      ? "status-amber"
      : "status-red";

  const trend = determineTrend(metrics.weeks.map((item) => item.score));
  trendIndicator.textContent = trend.label;
}

function renderMetrics(metrics) {
  onTimeRate.textContent = `${metrics.onTimePercentage}%`;
  avgQuality.textContent = metrics.avgQualityScore.toFixed(2);
  conceptTrend.textContent = determineConceptTrend(
    metrics.weeks.map((item) => CONCEPTUAL_SCORES[item.data?.conceptualProgress])
  );
}

function renderDashboard() {
  const data = loadWeekData();
  const metrics = calculateMetrics(data);

  renderInsights(metrics);
  renderScoreChart(metrics.weeks);
  renderTaskChart(metrics.weeks);
  updateTiles(metrics);
  renderMetrics(metrics);
}

function renderPerformanceSheet() {
  const month = monthSelect.value;
  const rows = EMPLOYEES.map((employee) => {
    const key = storageKey(employee, month);
    const stored = localStorage.getItem(key);
    const data = stored ? JSON.parse(stored) : { weeks: {} };
    const metrics = calculateMetrics({
      weeks: { 1: data.weeks?.1 || emptyWeek(), 2: data.weeks?.2 || emptyWeek(), 3: data.weeks?.3 || emptyWeek(), 4: data.weeks?.4 || emptyWeek() },
    });
    const status = determineStatus(metrics.averageScore);
    const insight = buildInsights(metrics)[0]?.text || "Stable performance.";

    return {
      employee,
      month,
      weeklyScores: metrics.weeks.map((item) => item.score ?? 0),
      monthlyScore: metrics.averageScore.toFixed(2),
      deliveryIndex: metrics.avgCompletion.toFixed(2),
      qualityIndex: metrics.avgQualityScore.toFixed(2),
      conceptualIndex: metrics.avgConceptualScore.toFixed(2),
      status,
      insight,
    };
  });

  sheetSubtitle.textContent = `Summary for ${month}`;
  sheetTable.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Employee Name</th>
          <th>Month</th>
          <th>W1</th>
          <th>W2</th>
          <th>W3</th>
          <th>W4</th>
          <th>Monthly Score</th>
          <th>Delivery Index</th>
          <th>Quality Index</th>
          <th>Conceptual Index</th>
          <th>Overall Status</th>
          <th>Key Insight</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (row) => `
            <tr>
              <td>${row.employee}</td>
              <td>${row.month}</td>
              <td>${row.weeklyScores[0].toFixed(2)}</td>
              <td>${row.weeklyScores[1].toFixed(2)}</td>
              <td>${row.weeklyScores[2].toFixed(2)}</td>
              <td>${row.weeklyScores[3].toFixed(2)}</td>
              <td>${row.monthlyScore}</td>
              <td>${row.deliveryIndex}</td>
              <td>${row.qualityIndex}</td>
              <td>${row.conceptualIndex}</td>
              <td>${row.status}</td>
              <td>${row.insight}</td>
            </tr>
          `
          )
          .join("")}
      </tbody>
    </table>
  `;

  return rows;
}

function exportCsv() {
  const rows = renderPerformanceSheet();
  const headers = [
    "Employee Name",
    "Month",
    "W1",
    "W2",
    "W3",
    "W4",
    "Monthly Score",
    "Delivery Index",
    "Quality Index",
    "Conceptual Index",
    "Overall Status",
    "Key Insight",
  ];
  const csvRows = [headers.join(",")];
  rows.forEach((row) => {
    const values = [
      row.employee,
      row.month,
      ...row.weeklyScores.map((score) => score.toFixed(2)),
      row.monthlyScore,
      row.deliveryIndex,
      row.qualityIndex,
      row.conceptualIndex,
      row.status,
      `"${row.insight.replace(/"/g, "'")}"`,
    ];
    csvRows.push(values.join(","));
  });
  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `performance_${monthSelect.value}.csv`;
  link.click();
}

function handleTabClick(event) {
  const button = event.target.closest("button");
  if (!button) return;
  activeWeek = Number(button.dataset.week);
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  button.classList.add("active");
  weekTitle.textContent = `Week ${activeWeek} Inputs`;
  populateWeekForm();
}

function handleSelectionChange() {
  populateWeekForm();
  renderDashboard();
}

function handleModeChange() {
  const isViewOnly = modeSelect.value === "view";
  setFormDisabled(isViewOnly);
}

function openSheet() {
  renderPerformanceSheet();
  sheetModal.classList.add("active");
  sheetModal.setAttribute("aria-hidden", "false");
}

function closeSheet() {
  sheetModal.classList.remove("active");
  sheetModal.setAttribute("aria-hidden", "true");
}

function init() {
  buildEmployeeOptions();
  buildMonthOptions();
  populateWeekForm();
  renderDashboard();
  handleModeChange();
}

weekTabs.addEventListener("click", handleTabClick);
[tasksAssigned, tasksCompleted, completionStatus, qualityOutput, conceptualProgress, remarks].forEach(
  (input) => input.addEventListener("input", updateWeekForm)
);
employeeSelect.addEventListener("change", handleSelectionChange);
monthSelect.addEventListener("change", handleSelectionChange);
modeSelect.addEventListener("change", handleModeChange);
openSheetBtn.addEventListener("click", openSheet);
closeSheetBtn.addEventListener("click", closeSheet);
printSheetBtn.addEventListener("click", () => window.print());
exportCsvBtn.addEventListener("click", exportCsv);

init();
