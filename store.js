/*
 * Store: holds app state, saves it to localStorage, and handles
 * export/import. Swap this file for API calls (SharePoint list,
 * Dataverse, a database) when the team moves past the prototype.
 */
(function () {
  const KEY = "esource-build-tracker:v1";
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  // ---------- dates (local time, ISO yyyy-mm-dd strings) ----------
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => toISO(new Date());
  const addDays = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
  const mondayOf = (iso) => { const d = fromISO(iso); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return toISO(d); };
  const fmtDate = (iso, opts) => iso ? fromISO(iso).toLocaleDateString("en-US", opts || { month: "short", day: "numeric", year: "numeric" }) : "";
  const daysBetween = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);

  let uid = Date.now();
  const newId = (p) => `${p}${(uid++).toString(36)}`;

  // ---------- seed ----------
  function seed() {
    const S = window.ESOURCE_SEED;
    const week = mondayOf(today());
    const time = { [week]: {} };
    Object.entries(S.demoHours || {}).forEach(([person, rows]) => {
      time[week][person] = rows.map((r) => ({ id: newId("r"), ref: r.ref, activity: r.activity, h: r.h.slice() }));
    });
    return {
      version: 1,
      person: S.people[0],
      tab: "work",
      week,
      people: S.people.slice(),
      goal: { ...S.goal },
      studies: S.studies.map((s) => ({
        location: "", area: "", period: "", totalVisits: "",
        qcStartVisit: "", qcVisits: null, qcStart: null, qcDone: null,
        owner: "", support: "", visitsQcd: 0, notes: "",
        ...s
      })),
      assignments: S.assignments.slice(),
      activities: S.activities.slice(),
      kpis: S.kpis.slice(),
      time,
      demoLoaded: Object.keys(S.demoHours || {}).length > 0
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable: run in memory */ }
    return seed();
  }

  let state = load();
  const listeners = [];

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function update(fn, opts) {
    fn(state);
    save();
    if (!opts || !opts.silent) listeners.forEach((l) => l(state));
  }

  // ---------- derived ----------
  function statusOf(s) {
    if (s.qcDone) return "complete";
    if (s.qcStart) return "in_progress";
    if (s.owner && !(s.qcVisits && s.qcStartVisit)) return "needs_setup";
    if (s.owner) return "ready";
    return "unassigned";
  }
  const STATUS_LABEL = {
    complete: "QC complete",
    in_progress: "QC in progress",
    needs_setup: "Needs setup",
    ready: "Ready to start",
    unassigned: "Unassigned"
  };

  function weekRows(week, person) {
    return ((state.time[week] || {})[person]) || [];
  }
  const sum = (a) => a.reduce((t, v) => t + (Number(v) || 0), 0);
  const round1 = (n) => Math.round(n * 10) / 10;

  function refLabel(ref) {
    const s = state.studies.find((x) => x.id === ref);
    if (s) return `${s.study} (${s.location})`;
    const a = state.assignments.find((x) => x.id === ref);
    return a ? a.label : ref;
  }

  // ---------- exports ----------
  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function csvCell(v) {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function exportTimeCSV() {
    const lines = [["Week of", "Person", "Study / assignment", "Activity", ...DAYS, "Total"].join(",")];
    Object.keys(state.time).sort().forEach((week) => {
      Object.entries(state.time[week]).forEach(([person, rows]) => {
        rows.forEach((r) => {
          lines.push([week, person, refLabel(r.ref), r.activity, ...r.h, sum(r.h)].map(csvCell).join(","));
        });
      });
    });
    download(`esource-time-${today()}.csv`, lines.join("\n"), "text/csv");
  }

  function exportStudiesCSV() {
    const cols = ["location", "study", "area", "period", "totalVisits", "owner", "support", "qcStartVisit", "qcVisits", "visitsQcd", "qcStart", "qcDone", "notes"];
    const lines = [[...cols, "status"].join(",")];
    state.studies.forEach((s) => lines.push([...cols.map((c) => s[c]), STATUS_LABEL[statusOf(s)]].map(csvCell).join(",")));
    download(`esource-studies-${today()}.csv`, lines.join("\n"), "text/csv");
  }

  function exportJSON() {
    download(`esource-tracker-backup-${today()}.json`, JSON.stringify(state, null, 2), "application/json");
  }

  function importJSON(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.studies) || typeof data.time !== "object") {
      throw new Error("This file isn't a tracker backup. Export one from the app first.");
    }
    update((s) => { Object.keys(s).forEach((k) => delete s[k]); Object.assign(s, data); });
  }

  function reset() {
    state = seed();
    save();
    listeners.forEach((l) => l(state));
  }

  window.Store = {
    get: () => state,
    update,
    subscribe: (fn) => listeners.push(fn),
    reset,
    exportTimeCSV, exportStudiesCSV, exportJSON, importJSON,
    statusOf, STATUS_LABEL, weekRows, refLabel, sum, round1, newId,
    dates: { today, addDays, mondayOf, fmtDate, daysBetween, fromISO },
    DAYS
  };
})();
