/* ─── State ─── */
let sessions = JSON.parse(localStorage.getItem("fst-sessions") || "[]");
let selectedRating = 0;
let selectedEffort = "";

/* ─── Init star row ─── */
function buildStars() {
  const row = document.getElementById("star-row");
  row.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const s = document.createElement("div");
    s.className = "star" + (i <= selectedRating ? " active" : "");
    s.textContent = i;
    s.onclick = () => setRating(i);
    row.appendChild(s);
  }
}

function setRating(n) {
  selectedRating = n;
  document.getElementById("inp-rating").value = n;
  buildStars();
}

function selectEffort(el) {
  document.querySelectorAll(".effort-tag").forEach((t) => {
    t.className = "effort-tag";
  });
  const v = el.dataset.value;
  selectedEffort = v;
  document.getElementById("inp-effort").value = v;
  const key = v.includes("Cognitive")
    ? "cognitive"
    : v.includes("Emotional")
      ? "emotional"
      : v.includes("Mechanical")
        ? "mechanical"
        : "strategic";
  el.classList.add("selected-" + key);
}

/* ─── Add session ─── */
function addSession() {
  const date = document.getElementById("inp-date").value;
  const duration = parseFloat(document.getElementById("inp-duration").value);
  const rating = parseInt(document.getElementById("inp-rating").value);
  const ipr = document.getElementById("inp-ipr").value.trim();
  const effort = document.getElementById("inp-effort").value;
  const tweak = document.getElementById("inp-tweak").value.trim();

  if (!date) return showToast("Pick a date");
  if (!duration || duration <= 0) return showToast("Enter duration");
  if (!rating || rating < 1) return showToast("Rate this session 1–10");
  if (!ipr) return showToast("Write your IPR");
  if (!effort) return showToast("Pick an effort type");

  const s = {
    id: Date.now(),
    date,
    duration,
    rating,
    ipr,
    effort,
    tweak,
  };
  sessions.push(s);
  save();
  renderAll();
  resetForm();
  showToast("Session logged ✓");
}

function deleteSession(id) {
  sessions = sessions.filter((s) => s.id !== id);
  save();
  renderAll();
}

function save() {
  localStorage.setItem("fst-sessions", JSON.stringify(sessions));
}

/* ─── Reset form ─── */
function resetForm() {
  document.getElementById("inp-date").value = new Date()
    .toISOString()
    .slice(0, 10);
  document.getElementById("inp-ipr").value = "";
  document.getElementById("inp-tweak").value = "";
  document.getElementById("inp-duration").value = "";
  document.getElementById("inp-rating").value = "";
  document.getElementById("inp-effort").value = "";
  selectedRating = 0;
  selectedEffort = "";
  buildStars();
  document
    .querySelectorAll(".effort-tag")
    .forEach((t) => (t.className = "effort-tag"));
  showToast("Form cleared");
}

/* ─── Stats ─── */
function renderStats() {
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter((s) => s.date === today);

  document.getElementById("stat-sessions").textContent = todaySessions.length;
  const totalHrs = todaySessions.reduce((a, s) => a + s.duration, 0);
  document.getElementById("stat-hours").textContent =
    totalHrs % 1 === 0 ? totalHrs : totalHrs.toFixed(1);

  if (todaySessions.length > 0) {
    const avg =
      todaySessions.reduce((a, s) => a + s.rating, 0) / todaySessions.length;
    document.getElementById("stat-avg").textContent =
      avg % 1 === 0 ? avg : avg.toFixed(1);
    document.getElementById("stat-best").textContent = Math.max(
      ...todaySessions.map((s) => s.rating),
    );
  } else {
    document.getElementById("stat-avg").textContent = "—";
    document.getElementById("stat-best").textContent = "—";
  }

  const counts = {
    cognitive: 0,
    emotional: 0,
    mechanical: 0,
    strategic: 0,
  };
  sessions.forEach((s) => {
    if (s.effort.includes("Cognitive")) counts.cognitive++;
    else if (s.effort.includes("Emotional")) counts.emotional++;
    else if (s.effort.includes("Mechanical")) counts.mechanical++;
    else if (s.effort.includes("Strategic")) counts.strategic++;
  });
  const max = Math.max(...Object.values(counts), 1);
  ["cognitive", "emotional", "mechanical", "strategic"].forEach((k) => {
    document.getElementById("bar-" + k).style.width =
      Math.round((counts[k] / max) * 100) + "%";
    document.getElementById("cnt-" + k).textContent = counts[k];
  });
}

/* ─── Session list ─── */
function effortKey(effort) {
  if (effort.includes("Cognitive")) return "cognitive";
  if (effort.includes("Emotional")) return "emotional";
  if (effort.includes("Mechanical")) return "mechanical";
  return "strategic";
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day: d.getDate(),
    mon: d.toLocaleString("en", { month: "short" }),
    full: d.toLocaleDateString("en", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
  };
}

function renderList() {
  const list = document.getElementById("sessions-list");
  if (sessions.length === 0) {
    list.innerHTML =
      '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-label">No sessions yet — add one to start tracking.</div></div>';
    return;
  }

  const sorted = [...sessions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
  );
  let html = '<div style="display:flex;flex-direction:column;gap:8px;">';
  let lastDate = null;

  sorted.forEach((s) => {
    const dk = effortKey(s.effort);
    const fd = formatDate(s.date);
    if (s.date !== lastDate) {
      const isToday = s.date === new Date().toISOString().slice(0, 10);
      html += `<div class="date-group-header">${isToday ? "Today — " : ""}${fd.full}</div>`;
      lastDate = s.date;
    }
    html += `
      <div class="session-card">
        <div class="session-meta">
          <div class="session-date-num">${fd.day}</div>
          <div class="session-date-mon">${fd.mon}</div>
        </div>
        <div class="session-body">
          <div class="session-ipr">${escHtml(s.ipr)}</div>
          <div class="session-pills">
            <span class="pill pill-duration">${s.duration}h</span>
            <span class="pill pill-effort-${dk}">${s.effort}</span>
          </div>
          ${s.tweak ? `<div class="session-tweak"><span class="session-tweak-icon">→</span> ${escHtml(s.tweak)}</div>` : ""}
        </div>
        <div class="rating-badge">${s.rating}</div>
        <button class="delete-btn" onclick="deleteSession(${s.id})" title="Remove">✕</button>
      </div>`;
  });
  html += "</div>";
  list.innerHTML = html;
}

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderAll() {
  renderStats();
  renderList();
}

/* ─── Toast ─── */
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

/* ─── PDF Export ─── */
function downloadPDF() {
  if (sessions.length === 0) {
    showToast("No sessions to export yet");
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210,
    M = 16,
    CW = W - M * 2;
  let y = 20;

  const hex = (h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];

  doc.setFillColor(14, 14, 16);
  doc.rect(0, 0, W, 297, "F");

  doc.setFontSize(18);
  doc.setTextColor(240, 240, 244);
  doc.setFont("helvetica", "bold");
  doc.text("Focus Session Tracker", M, y);
  y += 7;

  doc.setFontSize(9);
  doc.setTextColor(152, 152, 166);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Exported ${new Date().toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}   ·   ${sessions.length} session${sessions.length !== 1 ? "s" : ""}`,
    M,
    y,
  );
  y += 5;

  doc.setDrawColor(255, 255, 255, 0.08);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 8;

  const today = new Date().toISOString().slice(0, 10);
  const todayS = sessions.filter((s) => s.date === today);
  const todayHrs = todayS.reduce((a, s) => a + s.duration, 0);
  const todayAvg = todayS.length
    ? (todayS.reduce((a, s) => a + s.rating, 0) / todayS.length).toFixed(1)
    : "—";
  const todayBest = todayS.length
    ? Math.max(...todayS.map((s) => s.rating))
    : "—";

  const stats = [
    ["Today's sessions", todayS.length],
    ["Hours today", todayHrs % 1 ? todayHrs.toFixed(1) : todayHrs],
    ["Avg rating", todayAvg],
    ["Best rating", todayBest],
  ];
  const cw = CW / 4;
  stats.forEach((st, i) => {
    const x = M + i * cw;
    doc.setFillColor(33, 33, 37);
    doc.roundedRect(x, y, cw - 4, 20, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(94, 94, 110);
    doc.setFont("helvetica", "normal");
    doc.text(st[0].toUpperCase(), x + 4, y + 6);
    doc.setFontSize(14);
    doc.setTextColor(240, 240, 244);
    doc.setFont("helvetica", "bold");
    doc.text(String(st[1]), x + 4, y + 15);
  });
  y += 28;

  doc.setFontSize(8);
  doc.setTextColor(94, 94, 110);
  doc.setFont("helvetica", "bold");
  doc.text("EFFORT BREAKDOWN — ALL TIME", M, y);
  y += 5;

  const counts = {
    "🧠 Cognitive": 0,
    "❤️ Emotional": 0,
    "⚙️ Mechanical": 0,
    "♟️ Strategic": 0,
  };
  sessions.forEach((s) => {
    const k = Object.keys(counts).find((k) =>
      s.effort.includes(k.split(" ")[1]),
    );
    if (k) counts[k]++;
  });
  const max = Math.max(...Object.values(counts), 1);
  const colors = [
    [193, 239, 255],
    [255, 179, 179],
    [255, 233, 174],
    [255, 219, 164],
  ];
  Object.entries(counts).forEach(([label, cnt], i) => {
    doc.setFillColor(42, 42, 47);
    doc.roundedRect(M, y, CW, 5, 1.5, 1.5, "F");
    const bw = (cnt / max) * CW;
    if (bw > 0) {
      doc.setFillColor(...colors[i]);
      doc.roundedRect(M, y, bw, 5, 1.5, 1.5, "F");
    }
    doc.setFontSize(7);
    doc.setTextColor(152, 152, 166);
    doc.setFont("helvetica", "normal");
    doc.text(
      label.replace(/[^\x20-\x7E]/g, "").trim() + " — " + cnt,
      M,
      y + 3.5,
    );
    y += 8;
  });
  y += 4;

  doc.line(M, y, W - M, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(240, 240, 244);
  doc.setFont("helvetica", "bold");
  doc.text("Session Log", M, y);
  y += 8;

  const sorted = [...sessions].sort(
    (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
  );

  sorted.forEach((s) => {
    const estH = 14 + Math.ceil(s.ipr.length / 75) * 4.5 + (s.tweak ? 9 : 0);
    if (y + estH > 280) {
      doc.addPage();
      doc.setFillColor(14, 14, 16);
      doc.rect(0, 0, W, 297, "F");
      y = 16;
    }

    doc.setFillColor(24, 24, 27);
    doc.roundedRect(M, y, CW, estH, 2, 2, "F");

    const dk = effortKey(s.effort);
    const effortColors = {
      cognitive: [193, 239, 255],
      emotional: [255, 179, 179],
      mechanical: [255, 233, 174],
      strategic: [255, 219, 164],
    };
    const ec = effortColors[dk];

    doc.setFillColor(...ec);
    doc.roundedRect(M, y, 2.5, estH, 1, 1, "F");

    const fd = formatDate(s.date);
    doc.setFontSize(8);
    doc.setTextColor(152, 152, 166);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${fd.mon} ${fd.day}  ·  ${s.duration}h  ·  ${s.effort.replace(/[^\x20-\x7E]/g, "").trim()}`,
      M + 6,
      y + 5,
    );

    doc.setFontSize(12);
    doc.setTextColor(193, 239, 255);
    doc.setFont("helvetica", "bold");
    doc.text(String(s.rating), W - M - 6, y + 5, { align: "right" });

    doc.setFontSize(8);
    doc.setTextColor(220, 220, 230);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(s.ipr, CW - 14);
    doc.text(lines, M + 6, y + 11);
    let localY = y + 11 + lines.length * 4.5;

    if (s.tweak) {
      doc.setFontSize(7.5);
      doc.setTextColor(94, 94, 110);
      const tlines = doc.splitTextToSize("→ " + s.tweak, CW - 14);
      doc.text(tlines, M + 6, localY);
    }
    y += estH + 4;
  });

  doc.save(`focus-sessions-${today}.pdf`);
  showToast("PDF downloaded ✓");
}

/* ─── Default date to today ─── */
document.getElementById("inp-date").value = new Date()
  .toISOString()
  .slice(0, 10);

buildStars();
renderAll();
