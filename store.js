/*
 * Store: app state, build stages, schedule status, KPI math, saving and
 * export/import. To share data across the team later, replace load() and
 * save() with calls to an API (SharePoint list, Azure Functions, etc.).
 */
(function () {
  const KEY = "esource-build-tracker:v2";
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  // ---------- dates (local, yyyy-mm-dd) ----------
  const pad = (n) => String(n).padStart(2, "0");
  const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => toISO(new Date());
  const addDays = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
  const mondayOf = (iso) => { const d = fromISO(iso); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toISO(d); };
  const fmtDate = (iso, opts) => iso ? fromISO(iso).toLocaleDateString("en-US", opts || { month: "short", day: "numeric", year: "numeric" }) : "";
  const daysBetween = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);

  let uid = Date.now();
  const newId = (p) => `${p}${(uid++).toString(36)}`;

  // ---------- build model ----------
  const BLANK = {
    study: "", location: "", area: "", buildType: "", totalVisits: null,
    assignedTo: "", completedBy: "",
    dueDate: "", completionDate: "",
    protocolFinal: "", ccgFinal: "", crfFinal: "", configDate: "", uatStart: "",
    ccgs: "", blankEcrfs: "",
    uatTries: null, versions: null, sourceAdjustments: null,
    notes: "", example: false
  };
  const normalize = (b) => ({ ...BLANK, ...b });

  // Build steps in order. CCG finalization is skipped when no CCGs were provided.
  const STAGES = [
    { k: "protocolFinal", label: "Protocol finalized", short: "Protocol", action: "Protocol finalized" },
    { k: "ccgFinal", label: "CCGs finalized", short: "CCGs", action: "CCGs finalized", skip: (b) => b.ccgs === "no" },
    { k: "crfFinal", label: "CRFs finalized", short: "CRFs", action: "CRFs finalized" },
    { k: "configDate", label: "Configuration", short: "Config", action: "Configuration done" },
    { k: "uatStart", label: "Acceptance testing started", short: "Testing", action: "Testing started" },
    { k: "completionDate", label: "Build complete", short: "Complete", action: "Complete build" }
  ];
  const activeStages = (b) => STAGES.filter((s) => !(s.skip && s.skip(b)));
  const nextStage = (b) => activeStages(b).find((s) => !b[s.k]) || null;
  const lastDoneStage = (b) => [...activeStages(b)].reverse().find((s) => b[s.k]) || null;

  function stageText(b) {
    if (b.completionDate) return "Complete";
    const last = lastDoneStage(b);
    return last ? last.label : "Not started";
  }

  const SCHEDULE_LABEL = {
    overdue: "Overdue", atrisk: "Due soon", ontrack: "On track", nodue: "No due date",
    ontime: "Completed on time", late: "Completed late", done: "Complete"
  };

  function schedule(b) {
    const t = today();
    if (b.completionDate) {
      if (!b.dueDate) return { key: "done", detail: `Completed ${fmtDate(b.completionDate)}` };
      const late = daysBetween(b.dueDate, b.completionDate);
      return late > 0
        ? { key: "late", detail: `Completed ${late} ${late === 1 ? "day" : "days"} late` }
        : { key: "ontime", detail: `Completed ${fmtDate(b.completionDate)}` };
    }
    if (!b.dueDate) return { key: "nodue", detail: "Set a due date" };
    const left = daysBetween(t, b.dueDate);
    if (left < 0) return { key: "overdue", detail: `Overdue by ${-left} ${left === -1 ? "day" : "days"}` };
    if (left === 0) return { key: "atrisk", detail: "Due today" };
    if (left <= state.targets.atRiskDays) return { key: "atrisk", detail: `Due in ${left} ${left === 1 ? "day" : "days"}` };
    return { key: "ontrack", detail: `Due ${fmtDate(b.dueDate, { month: "short", day: "numeric" })}` };
  }

  function missingInfo(b) {
    const m = [];
    if (!b.dueDate) m.push("due date");
    if (!b.totalVisits) m.push("total visits");
    if (!b.buildType) m.push("standard or custom");
    if (!b.ccgs) m.push("whether CCGs were provided");
    if (!b.blankEcrfs) m.push("whether blank eCRFs were provided");
    if (b.completionDate) {
      if (b.uatTries == null) m.push("testing rounds");
      if (b.versions == null) m.push("versions before approval");
      if (!b.completedBy) m.push("completed by");
    }
    return m;
  }

  // ---------- KPI math ----------
  const avg = (a) => a.length ? a.reduce((t, v) => t + v, 0) / a.length : null;
  const round1 = (n) => Math.round(n * 10) / 10;
  const pct = (n, d) => d ? Math.round((n / d) * 100) : null;

  function spans(builds, from, to) {
    return builds.filter((b) => b[from] && b[to]).map((b) => daysBetween(b[from], b[to])).filter((d) => d >= 0);
  }

  function kpis(builds) {
    const T = state.targets;
    const done = builds.filter((b) => b.completionDate);
    const doneDue = done.filter((b) => b.dueDate);
    const onTime = doneDue.filter((b) => b.completionDate <= b.dueDate).length;
    const open = builds.filter((b) => !b.completionDate);
    const overdue = open.filter((b) => schedule(b).key === "overdue").length;
    const tried = done.filter((b) => b.uatTries != null);
    const firstPass = tried.filter((b) => b.uatTries === 1).length;
    const versioned = done.filter((b) => b.versions != null);
    const overVersions = versioned.filter((b) => b.versions >= T.maxVersions).length;
    const noCcg = builds.filter((b) => b.ccgs === "no").length;
    const noEcrf = builds.filter((b) => b.blankEcrfs === "no").length;
    const adjusted = builds.filter((b) => b.sourceAdjustments > 0);
    const typed = builds.filter((b) => b.buildType);
    const standard = typed.filter((b) => b.buildType === "Standard").length;
    const days = (a) => a.length ? `${round1(avg(a))} days` : "—";
    const sp = (f, t) => spans(builds, f, t);

    return {
      counts: { total: builds.length, done: done.length, open: open.length, overdue },
      groups: [
        { name: "Schedule", items: [
          { name: "On-time completion", value: pct(onTime, doneDue.length) == null ? "—" : `${pct(onTime, doneDue.length)}%`, n: `${onTime} of ${doneDue.length} completed builds with a due date`, target: "100%", ok: doneDue.length ? onTime === doneDue.length : null },
          { name: "Open builds overdue", value: String(overdue), n: `of ${open.length} open builds`, target: "0", ok: overdue === 0 }
        ] },
        { name: "Speed", items: [
          { name: "Protocol finalized to configuration", value: days(sp("protocolFinal", "configDate")), n: `${sp("protocolFinal", "configDate").length} builds` },
          { name: "CCGs finalized to configuration", value: days(sp("ccgFinal", "configDate")), n: `${sp("ccgFinal", "configDate").length} builds` },
          { name: "CRFs finalized to configuration", value: days(sp("crfFinal", "configDate")), n: `${sp("crfFinal", "configDate").length} builds` },
          { name: "Configuration to testing start", value: days(sp("configDate", "uatStart")), n: `${sp("configDate", "uatStart").length} builds` },
          { name: "Time in acceptance testing", value: days(sp("uatStart", "completionDate")), n: `${sp("uatStart", "completionDate").length} builds` },
          { name: "Total: protocol finalized to complete", value: days(sp("protocolFinal", "completionDate")), n: `${sp("protocolFinal", "completionDate").length} builds` }
        ] },
        { name: "Quality", items: [
          { name: "Passed testing first try", value: pct(firstPass, tried.length) == null ? "—" : `${pct(firstPass, tried.length)}%`, n: `${firstPass} of ${tried.length} completed builds` },
          { name: "Average testing rounds", value: tried.length ? String(round1(avg(tried.map((b) => b.uatTries)))) : "—", n: `${tried.length} completed builds` },
          { name: "Average versions before approval", value: versioned.length ? String(round1(avg(versioned.map((b) => b.versions)))) : "—", n: `${overVersions} of ${versioned.length} builds at ${T.maxVersions} or more`, target: `under ${T.maxVersions}`, ok: versioned.length ? overVersions === 0 : null },
          { name: "Builds with source adjustments", value: String(adjusted.length), n: `${adjusted.reduce((t, b) => t + b.sourceAdjustments, 0)} adjustments in total` }
        ] },
        { name: "Inputs", items: [
          { name: "Built without CCGs", value: String(noCcg), n: `of ${builds.filter((b) => b.ccgs).length} builds recorded` },
          { name: "Built without blank eCRFs", value: String(noEcrf), n: `of ${builds.filter((b) => b.blankEcrfs).length} builds recorded`, target: `under ${T.maxNoEcrfBuilds}`, ok: noEcrf < T.maxNoEcrfBuilds },
          { name: "Standard builds", value: pct(standard, typed.length) == null ? "—" : `${pct(standard, typed.length)}%`, n: `${standard} standard, ${typed.length - standard} custom` }
        ] }
      ],
      byPerson: state.people.map((p) => {
        const mine = done.filter((b) => b.completedBy === p);
        const mineDue = mine.filter((b) => b.dueDate);
        const mt = mine.filter((b) => b.uatTries != null);
        const mv = mine.filter((b) => b.versions != null);
        return {
          person: p,
          assigned: builds.filter((b) => b.assignedTo === p && !b.completionDate).length,
          completed: mine.length,
          onTime: pct(mineDue.filter((b) => b.completionDate <= b.dueDate).length, mineDue.length),
          firstPass: pct(mt.filter((b) => b.uatTries === 1).length, mt.length),
          versions: mv.length ? round1(avg(mv.map((b) => b.versions))) : null
        };
      })
    };
  }

  // ---------- state ----------
  function seed() {
    const S = window.ESOURCE_SEED;
    const week = mondayOf(today());
    const time = { [week]: {} };
    Object.entries(S.demoHours || {}).forEach(([person, rows]) => {
      time[week][person] = rows.map((r) => ({ id: newId("r"), ref: r.ref, activity: r.activity, h: r.h.slice() }));
    });
    return {
      version: 2,
      person: S.people[0],
      tab: "work",
      week,
      people: S.people.slice(),
      targets: { ...S.targets },
      builds: S.builds.map(normalize),
      assignments: S.assignments.slice(),
      activities: S.activities.slice(),
      time,
      demoHours: Object.keys(S.demoHours || {}).length > 0
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw); s.builds = s.builds.map(normalize); return s; }
    } catch (e) { /* storage unavailable */ }
    return seed();
  }

  let state = load();
  const listeners = [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };
  function update(fn, opts) {
    fn(state);
    save();
    if (!opts || !opts.silent) listeners.forEach((l) => l(state));
  }

  function loadExamples() {
    update((st) => {
      const have = new Set(st.builds.map((b) => b.id));
      window.ESOURCE_SEED.exampleBuilds.forEach((b) => { if (!have.has(b.id)) st.builds.push(normalize({ ...b, example: true })); });
    });
  }
  function removeExamples() { update((st) => { st.builds = st.builds.filter((b) => !b.example); }); }

  // ---------- time ----------
  const sum = (a) => a.reduce((t, v) => t + (Number(v) || 0), 0);
  const weekRows = (week, person) => ((state.time[week] || {})[person]) || [];
  function refLabel(ref) {
    const b = state.builds.find((x) => x.id === ref);
    if (b) return `${b.study}${b.location ? ` (${b.location})` : ""}`;
    const a = state.assignments.find((x) => x.id === ref);
    return a ? a.label : "Removed build";
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
  const csvCell = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

  const BUILD_COLS = [
    ["study", "Study"], ["location", "Site"], ["area", "Area"], ["buildType", "Standard or custom"], ["totalVisits", "Total visits"],
    ["assignedTo", "Assigned to"], ["completedBy", "Completed by"], ["dueDate", "Due date"], ["completionDate", "Completion date"],
    ["protocolFinal", "Protocol finalized"], ["ccgFinal", "CCGs finalized"], ["crfFinal", "CRFs finalized"],
    ["configDate", "Configuration date"], ["uatStart", "Acceptance testing start"],
    ["ccgs", "CCGs provided"], ["blankEcrfs", "Blank eCRFs provided"], ["uatTries", "Testing rounds to pass"],
    ["versions", "Versions before approval"], ["sourceAdjustments", "Source adjustments"], ["notes", "Notes"]
  ];

  function exportBuildsCSV() {
    const lines = [[...BUILD_COLS.map((c) => c[1]), "Stage", "Schedule"].map(csvCell).join(",")];
    state.builds.forEach((b) => lines.push([...BUILD_COLS.map((c) => b[c[0]]), stageText(b), SCHEDULE_LABEL[schedule(b).key]].map(csvCell).join(",")));
    download(`esource-builds-${today()}.csv`, lines.join("\n"), "text/csv");
  }

  function exportTimeCSV() {
    const lines = [["Week of", "Person", "Build or assignment", "Activity", ...DAYS, "Total"].join(",")];
    Object.keys(state.time).sort().forEach((week) => {
      Object.entries(state.time[week]).forEach(([person, rows]) => {
        rows.forEach((r) => lines.push([week, person, refLabel(r.ref), r.activity, ...r.h, sum(r.h)].map(csvCell).join(",")));
      });
    });
    download(`esource-time-${today()}.csv`, lines.join("\n"), "text/csv");
  }

  function exportJSON() { download(`esource-tracker-backup-${today()}.json`, JSON.stringify(state, null, 2), "application/json"); }
  function importJSON(text) {
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.builds) || typeof data.time !== "object") {
      throw new Error("This file isn't a backup from this version of the tracker.");
    }
    update((s) => { Object.keys(s).forEach((k) => delete s[k]); Object.assign(s, data, { builds: data.builds.map(normalize) }); });
  }
  function reset() { state = seed(); save(); listeners.forEach((l) => l(state)); }

  window.Store = {
    get: () => state, update, subscribe: (fn) => listeners.push(fn), reset,
    loadExamples, removeExamples,
    exportBuildsCSV, exportTimeCSV, exportJSON, importJSON,
    STAGES, activeStages, nextStage, lastDoneStage, stageText, schedule, SCHEDULE_LABEL, missingInfo, kpis, normalize,
    weekRows, refLabel, sum, round1, newId, DAYS,
    dates: { today, addDays, mondayOf, fmtDate, daysBetween }
  };
})();
