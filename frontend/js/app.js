const statusText = document.getElementById("statusText");
const detailsPanel = document.getElementById("detailsPanel");
const submitBtn = document.getElementById("submitBtn");
const questionInput = document.getElementById("questionInput");

const map = L.map("map", {
  zoomControl: false,
  scrollWheelZoom: false,
}).setView([30.5, 69.5], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "",
}).addTo(map);

let geoLayer = null;
let latestRisks = {};

const RISK_COLORS = {
  LOW: "#7fcdbb",
  MEDIUM: "#fdae61",
  HIGH: "#d7191c",
};

function updateDetails(name) {
  const data = latestRisks[name];
  if (!data) {
    detailsPanel.innerHTML = `
      <h2>Province Summary</h2>
      <p>Select a province to view details.</p>
    `;
    return;
  }

  const badgeClass = data.risk.toLowerCase();
  detailsPanel.innerHTML = `
    <h2>${name}</h2>
    <div class="label">Risk Level</div>
    <div class="badge ${badgeClass}">${data.risk}</div>
    <div class="label">Why</div>
    <p>${data.why}</p>
    <div class="label">Drivers</div>
    <ul>
      ${data.drivers.map((driver) => `<li>${driver}</li>`).join("")}
    </ul>
    <div class="label">Confidence</div>
    <p>${data.confidence}</p>
    <div class="legend">
      <span><span class="swatch" style="background:${RISK_COLORS.LOW}"></span>Low</span>
      <span><span class="swatch" style="background:${RISK_COLORS.MEDIUM}"></span>Medium</span>
      <span><span class="swatch" style="background:${RISK_COLORS.HIGH}"></span>High</span>
    </div>
  `;
}

function styleFeature(feature) {
  const name = feature.properties.name;
  const risk = latestRisks[name]?.risk || "LOW";
  return {
    color: "#1b1f24",
    weight: 1,
    fillOpacity: 0.8,
    fillColor: RISK_COLORS[risk] || RISK_COLORS.LOW,
  };
}

function onEachFeature(feature, layer) {
  layer.on({
    click: () => updateDetails(feature.properties.name),
  });
}

async function loadGeojson() {
  const response = await fetch("/data/pakistan_provinces.geojson");
  const geojson = await response.json();
  if (geoLayer) {
    geoLayer.remove();
  }
  geoLayer = L.geoJSON(geojson, {
    style: styleFeature,
    onEachFeature,
  }).addTo(map);
}

async function analyze() {
  statusText.textContent = "Analyzing signals...";
  submitBtn.disabled = true;
  try {
    const response = await fetch("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: questionInput.value || "General environmental update" }),
    });
    const data = await response.json();
    latestRisks = data.province_risk || {};
    statusText.textContent = `Confidence: ${data.confidence}. Intents: ${data.intents.join(", ")}.`;
    await loadGeojson();
  } catch (error) {
    statusText.textContent = "System is running with limited connectivity. Please retry.";
  } finally {
    submitBtn.disabled = false;
  }
}

submitBtn.addEventListener("click", analyze);
questionInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    analyze();
  }
});

loadGeojson();
updateDetails();
