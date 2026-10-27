/*
 * eSource Build Tracker: UI. Plain JavaScript, no build step.
 * Every change re-renders from Store state. Events use data-action attributes.
 */
(function () {
  const S = window.Store;
  const D = S.dates;
  const app = document.getElementById("app");
  const dlg = document.getElementById("editor");
  const ui = { q: "", loc: "", person: "", sched: "", flash: "" };

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
  const opt = (v, l, cur) => `<option value="${esc(v)}" ${String(v) === String(cur ?? "") ? "selected" : ""}>${esc(l)}</option>`;
  const short = (iso) => D.fmtDate(iso, { month: "short", day: "numeric" });
  const bar = (p, cls) => `<div class="bar ${cls || ""}" role="presentation"><span style="width:${Math.max(0, Math.min(100, p))}%"></span></div>`;

  function schedChip(b) {
    const s = S.schedule(b);
    return `<span class="chip chip-${s.key}">${esc(S.SCHEDULE_LABEL[s.key])}</span>`;
  }

  function flags(b) {
    const f = [];
    if (b.example) f.push(`<span class="flag flag-ex">EXAMPLE</span>`);
    if (b.ccgs === "no") f.push(`<span class="flag">No CCGs</span>`);
    if (b.blankEcrfs === "no") f.push(`<span class="flag">No blank eCRFs</span>`);
    if (b.buildType) f.push(`<span class="tag">${esc(b.buildType)}</span>`);
    return f.join("");
  }

  // ---------- header ----------
  function header(st) {
    const tabs = [["work", "My builds"], ["builds", "All builds"], ["kpis", "QC and KPIs"], ["time", "Time allocation"]];
    return `
    <header class="top">
      <div class="wrap top-row">
        <div class="brand">
          <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="7"></rect><path d="M9 16.5l4.5 4.5L23 11"></path></svg>
          <div>
            <div class="brand-name">eSource Build Tracker</div>
            <div class="brand-sub">Build QC, due dates and what needs to happen next</div>
          </div>
        </div>
        <div class="who" role="group" aria-label="Viewing as">
          <span class="who-label">Viewing as</span>
          ${st.people.map((p) => `<button type="button" class="pill ${p === st.person ? "on" : ""}" aria-pressed="${p === st.person}" data-action="person" data-v="${esc(p)}">${esc(p)}</button>`).join("")}
        </div>
      </div>
      <nav class="wrap tabs" aria-label="Sections">
        ${tabs.map(([k, l]) => `<button type="button" class="tab ${st.tab === k ? "on" : ""}" aria-current="${st.tab === k ? "page" : "false"}" data-action="tab" data-v="${k}">${l}</button>`).join("")}
      </nav>
    </header>`;
  }

  // ---------- build card ----------
  function stepper(b) {
    const next = S.nextStage(b);
    return `<ol class="steps" aria-label="Build steps">${S.STAGES.map((s) => {
      const skipped = s.skip && s.skip(b);
      const cls = skipped ? "skip" : b[s.k] ? "done" : next && next.k === s.k ? "current" : "todo";
      const sub = skipped ? "Skipped" : b[s.k] ? short(b[s.k]) : next && next.k === s.k ? "Next" : "";
      return `<li class="step ${cls}"><span class="dot" aria-hidden="true"></span><span class="step-l">${s.short}</span><span class="step-d">${sub}</span></li>`;
    }).join("")}</ol>`;
  }

  function stageForm(b, st) {
    const next = S.nextStage(b);
    if (!next) return "";
    const isDone = next.k === "completionDate";
    const extra = isDone ? `
      <label>Completed by<select name="completedBy" id="cb-${b.id}">${st.people.map((p) => opt(p, p, b.completedBy || b.assignedTo || st.person)).join("")}</select></label>
      <label>Testing rounds to pass<input name="uatTries" id="ut-${b.id}" type="number" min="1" step="1" value="${esc(b.uatTries ?? "")}" required></label>
      <label>Versions before approval<input name="versions" id="vs-${b.id}" type="number" min="1" step="1" value="${esc(b.versions ?? "")}" required></label>
      <label>Source adjustments<input name="sourceAdjustments" id="sa-${b.id}" type="number" min="0" step="1" value="${esc(b.sourceAdjustments ?? 0)}"></label>` : "";
    return `
      <form class="stage-form" data-action="stage" data-id="${b.id}" data-k="${next.k}">
        ${extra}
        <label>Date<input type="date" name="date" id="dt-${b.id}" value="${D.today()}" required></label>
        <button type="submit" class="btn primary">${esc(next.action)}</button>
      </form>`;
  }

  function buildCard(b, st) {
    const next = S.nextStage(b);
    const sch = S.schedule(b);
    const missing = S.missingInfo(b);
    const last = S.lastDoneStage(b);
    return `
    <article class="task">
      <div class="task-main">
        <div class="task-head">
          <h3>${esc(b.study)}</h3>
          ${schedChip(b)}
          <span class="muted small">${esc(sch.detail)}</span>
        </div>
        <div class="tags">${b.location ? `<span class="tag">${esc(b.location)}</span>` : ""}${b.totalVisits ? `<span class="tag">${b.totalVisits} visits</span>` : ""}${flags(b)}</div>
        ${stepper(b)}
        ${next ? `<p class="next">Next: <strong>${esc(next.label)}</strong></p>` : ""}
        ${missing.length ? `<p class="missing">Missing: ${esc(missing.join(", "))}</p>` : ""}
        ${stageForm(b, st)}
      </div>
      <div class="task-side">
        <button type="button" class="btn" data-action="edit" data-id="${b.id}">Edit details</button>
        ${last ? `<button type="button" class="link" data-action="undo-stage" data-id="${b.id}">Undo “${esc(last.short)}”</button>` : ""}
      </div>
    </article>`;
  }

  // ---------- My builds ----------
  const schedRank = { overdue: 0, atrisk: 1, ontrack: 2, nodue: 3 };
  const byUrgency = (a, b) => (schedRank[S.schedule(a).key] - schedRank[S.schedule(b).key]) || String(a.dueDate || "9").localeCompare(String(b.dueDate || "9"));

  function weekHours(st, p) { return S.weekRows(st.week, p).reduce((t, r) => t + S.sum(r.h), 0); }

  function viewWork(st) {
    const mine = st.builds.filter((b) => b.assignedTo === st.person && !b.completionDate).sort(byUrgency);
    const doneMine = st.builds.filter((b) => (b.completedBy === st.person || b.assignedTo === st.person) && b.completionDate).sort((a, b) => b.completionDate.localeCompare(a.completionDate));
    const unassigned = st.builds.filter((b) => !b.assignedTo && !b.completionDate);
    const open = st.builds.filter((b) => !b.completionDate);
    const count = (k, list) => list.filter((b) => S.schedule(b).key === k).length;
    const hours = weekHours(st, st.person);

    return `
    <div class="split">
      <section class="main-col" aria-labelledby="work-h">
        <div class="section-head">
          <h1 id="work-h">${esc(st.person)}’s builds</h1>
          <span class="muted">${plural(mine.length, "open build")}, most urgent first</span>
        </div>
        ${mine.length ? mine.map((b) => buildCard(b, st)).join("") : `<div class="empty">No open builds assigned to ${esc(st.person)}. Claim one from the queue below or add a new build.</div>`}

        ${doneMine.length ? `<details class="card done-list"><summary>${plural(doneMine.length, "completed build")}</summary>
          <ul>${doneMine.map((b) => `<li><span>${esc(b.study)}</span>${schedChip(b)}<span class="muted small">${D.fmtDate(b.completionDate)}</span><button type="button" class="link" data-action="edit" data-id="${b.id}">Details</button></li>`).join("")}</ul></details>` : ""}

        <section class="card queue" aria-labelledby="queue-h">
          <div class="section-head">
            <h2 id="queue-h">Unassigned builds</h2>
            <span class="muted small">${plural(unassigned.length, "build")} without an owner</span>
          </div>
          ${unassigned.slice(0, 6).map((b) => `
            <div class="q-row">
              <div><div class="q-title">${esc(b.study)}</div><div class="muted small">${esc(b.location)}${b.totalVisits ? `, ${b.totalVisits} visits` : ""}${b.dueDate ? `, due ${short(b.dueDate)}` : ""}</div></div>
              <button type="button" class="btn" data-action="claim" data-id="${b.id}">Assign to me</button>
            </div>`).join("") || `<p class="muted small">Every open build has an owner.</p>`}
          ${unassigned.length > 6 ? `<button type="button" class="link" data-action="tab" data-v="builds">See all ${unassigned.length} in All builds</button>` : ""}
        </section>
      </section>

      <aside class="side-col">
        <section class="card">
          <h2>Team at a glance</h2>
          <dl class="facts">
            <div><dt>Open builds</dt><dd>${open.length}</dd></div>
            <div><dt>Overdue</dt><dd class="${count("overdue", open) ? "warn" : ""}">${count("overdue", open)}</dd></div>
            <div><dt>Due within ${st.targets.atRiskDays} days</dt><dd>${count("atrisk", open)}</dd></div>
            <div><dt>No due date</dt><dd>${count("nodue", open)}</dd></div>
          </dl>
          <button type="button" class="btn primary block" data-action="new">Add a build</button>
        </section>
        <section class="card">
          <h2>Your hours this week</h2>
          <p class="goal-num"><strong>${S.round1(hours)}</strong> of 40 h allocated</p>
          ${bar((hours / 40) * 100, hours > 40 ? "over thick" : "thick")}
          <button type="button" class="btn block" data-action="tab" data-v="time">Allocate time</button>
        </section>
      </aside>
    </div>`;
  }

  // ---------- All builds ----------
  function viewBuilds(st) {
    const locs = [...new Set(st.builds.map((b) => b.location).filter(Boolean))].sort();
    const q = ui.q.trim().toLowerCase();
    const rows = st.builds.filter((b) =>
      (!q || `${b.study} ${b.location} ${b.assignedTo} ${b.completedBy}`.toLowerCase().includes(q)) &&
      (!ui.loc || b.location === ui.loc) &&
      (!ui.person || (ui.person === "_none" ? !b.assignedTo : b.assignedTo === ui.person)) &&
      (!ui.sched || S.schedule(b).key === ui.sched))
      .sort((a, b) => (!!a.completionDate - !!b.completionDate) || byUrgency(a, b));

    return `
    <section aria-labelledby="builds-h">
      <div class="section-head">
        <h1 id="builds-h">All builds</h1>
        <div class="row-gap">
          <button type="button" class="btn" data-action="export-builds">Export CSV</button>
          <button type="button" class="btn primary" data-action="new">Add a build</button>
        </div>
      </div>
      <div class="filters">
        <label>Search<input id="f-q" type="search" data-action="filter" data-k="q" value="${esc(ui.q)}" placeholder="Study, site or person"></label>
        <label>Site<select id="f-loc" data-action="filter" data-k="loc">${opt("", "All sites", ui.loc)}${locs.map((l) => opt(l, l, ui.loc)).join("")}</select></label>
        <label>Assigned to<select id="f-person" data-action="filter" data-k="person">${opt("", "Anyone", ui.person)}${opt("_none", "Nobody", ui.person)}${st.people.map((p) => opt(p, p, ui.person)).join("")}</select></label>
        <label>Schedule<select id="f-sched" data-action="filter" data-k="sched">${opt("", "Any", ui.sched)}${Object.entries(S.SCHEDULE_LABEL).map(([k, l]) => opt(k, l, ui.sched)).join("")}</select></label>
      </div>
      <p class="muted small">${plural(rows.length, "build")} shown. Select a study to edit it.</p>
      <div class="table-box">
        <table class="builds">
          <thead><tr>
            <th scope="col">Study</th><th scope="col">Site</th><th scope="col">Type</th><th scope="col" class="num">Visits</th>
            <th scope="col">Assigned to</th><th scope="col">Due</th><th scope="col">Stage</th><th scope="col">Schedule</th>
            <th scope="col" class="num">Test rounds</th><th scope="col" class="num">Versions</th><th scope="col">Flags</th>
          </tr></thead>
          <tbody>
            ${rows.map((b) => `<tr>
              <th scope="row"><button type="button" class="link" data-action="edit" data-id="${b.id}">${esc(b.study)}</button>${b.example ? ` <span class="flag flag-ex">EXAMPLE</span>` : ""}</th>
              <td>${esc(b.location) || "—"}</td>
              <td>${esc(b.buildType) || "—"}</td>
              <td class="num">${b.totalVisits ?? "—"}</td>
              <td><select id="own-${b.id}" data-action="assign" data-id="${b.id}" aria-label="Assigned to for ${esc(b.study)}">${opt("", "Unassigned", b.assignedTo)}${st.people.map((p) => opt(p, p, b.assignedTo)).join("")}</select></td>
              <td>${b.dueDate ? short(b.dueDate) : "—"}</td>
              <td>${esc(S.stageText(b))}</td>
              <td>${schedChip(b)}</td>
              <td class="num">${b.uatTries ?? "—"}</td>
              <td class="num ${b.versions >= st.targets.maxVersions ? "warn-text" : ""}">${b.versions ?? "—"}</td>
              <td class="flags-cell">${b.ccgs === "no" ? `<span class="flag">No CCGs</span>` : ""}${b.blankEcrfs === "no" ? `<span class="flag">No blank eCRFs</span>` : ""}${b.sourceAdjustments > 0 ? `<span class="flag">${plural(b.sourceAdjustments, "source adj.", "source adj.")}</span>` : ""}</td>
            </tr>`).join("") || `<tr><td colspan="11" class="empty-cell">No builds match these filters.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>`;
  }

  // ---------- QC and KPIs ----------
  function viewKpis(st) {
    const k = S.kpis(st.builds);
    const hasEx = st.builds.some((b) => b.example);
    return `
    <section aria-labelledby="kpi-h">
      <div class="section-head">
        <h1 id="kpi-h">QC and KPIs</h1>
        <span class="muted small">Based on ${plural(k.counts.done, "completed build")} and ${plural(k.counts.open, "open build")}</span>
      </div>
      ${k.counts.done === 0 ? `<div class="notice"><span>No completed builds yet, so most measures are blank. They fill in as builds are completed${hasEx ? "" : ", or load the example builds to see how they work"}.</span>${hasEx ? "" : `<button type="button" class="btn" data-action="load-examples">Load example builds</button>`}</div>` : ""}
      ${hasEx ? `<div class="notice"><span>Example builds are included in these numbers.</span><button type="button" class="btn" data-action="remove-examples">Remove example builds</button></div>` : ""}
      ${k.groups.map((g) => `
        <h2 class="group-h">${g.name}</h2>
        <div class="kpi-grid">
          ${g.items.map((i) => `
            <div class="kpi ${i.ok === false ? "kpi-miss" : i.ok === true ? "kpi-hit" : ""}">
              <div class="kpi-name">${esc(i.name)}</div>
              <div class="kpi-val">${esc(i.value)}</div>
              <div class="kpi-n">${esc(i.n)}</div>
              ${i.target ? `<div class="kpi-t">Target ${esc(i.target)}${i.ok === true ? ", met" : i.ok === false ? ", not met" : ""}</div>` : ""}
            </div>`).join("")}
        </div>`).join("")}

      <h2 class="group-h">By person</h2>
      <div class="table-box">
        <table>
          <thead><tr><th scope="col">Person</th><th scope="col" class="num">Open builds</th><th scope="col" class="num">Completed</th><th scope="col" class="num">On time</th><th scope="col" class="num">Passed testing first try</th><th scope="col" class="num">Avg versions</th></tr></thead>
          <tbody>${k.byPerson.map((p) => `<tr>
            <th scope="row">${esc(p.person)}</th>
            <td class="num">${p.assigned}</td>
            <td class="num">${p.completed}</td>
            <td class="num">${p.onTime == null ? "—" : p.onTime + "%"}</td>
            <td class="num">${p.firstPass == null ? "—" : p.firstPass + "%"}</td>
            <td class="num">${p.versions ?? "—"}</td>
          </tr>`).join("")}</tbody>
        </table>
      </div>
    </section>`;
  }

  // ---------- Time allocation ----------
  function weekNav(st) {
    const isThis = st.week === D.mondayOf(D.today());
    return `
    <div class="week-nav" role="group" aria-label="Choose week">
      <button type="button" class="btn icon" data-action="week" data-v="-7" aria-label="Previous week">‹</button>
      <span class="week-label">${short(st.week)} – ${D.fmtDate(D.addDays(st.week, 4))}</span>
      <button type="button" class="btn icon" data-action="week" data-v="7" aria-label="Next week">›</button>
      ${isThis ? "" : `<button type="button" class="btn" data-action="week" data-v="0">This week</button>`}
    </div>`;
  }

  function viewTime(st) {
    const rows = S.weekRows(st.week, st.person);
    const used = new Set(rows.map((r) => r.ref));
    const mineB = st.builds.filter((b) => b.assignedTo === st.person && !used.has(b.id));
    const otherB = st.builds.filter((b) => b.assignedTo !== st.person && !used.has(b.id));
    const assigns = st.assignments.filter((a) => !used.has(a.id));
    const dayTotals = S.DAYS.map((_, i) => rows.reduce((t, r) => t + (Number(r.h[i]) || 0), 0));
    const total = S.sum(dayTotals);
    const byAct = {};
    rows.forEach((r) => { byAct[r.activity] = (byAct[r.activity] || 0) + S.sum(r.h); });
    const prevRows = S.weekRows(D.addDays(st.week, -7), st.person);
    const days = S.DAYS.map((d, i) => `${d} ${D.fmtDate(D.addDays(st.week, i), { day: "numeric" })}`);
    const capNote = total > 40 ? `Over by ${S.round1(total - 40)} h. Move work to another week or flag it to your lead.`
      : total === 40 ? "Fully allocated." : `${S.round1(40 - total)} h open.`;

    return `
    <section aria-labelledby="time-h">
      <div class="section-head wrap-row">
        <div>
          <h1 id="time-h">Time allocation for ${esc(st.person)}</h1>
          <p class="muted">Hours per build or assignment, Monday to Friday.</p>
        </div>
        ${weekNav(st)}
      </div>
      ${st.demoHours ? `<div class="notice"><span>Some weeks have example hours so you can try things out.</span><button type="button" class="btn" data-action="clear-demo">Clear example hours</button></div>` : ""}
      <div class="table-box">
        <table class="time">
          <thead><tr><th scope="col">Build or assignment</th><th scope="col">Activity</th>${days.map((d) => `<th scope="col" class="num">${d}</th>`).join("")}<th scope="col" class="num">Total</th><th scope="col"><span class="sr">Remove</span></th></tr></thead>
          <tbody>
            ${rows.map((r) => `<tr>
              <th scope="row">${esc(S.refLabel(r.ref))}</th>
              <td><select id="act-${r.id}" data-action="activity" data-id="${r.id}" aria-label="Activity for ${esc(S.refLabel(r.ref))}">${st.activities.map((a) => opt(a, a, r.activity)).join("")}</select></td>
              ${r.h.map((v, i) => `<td class="num"><input id="h-${r.id}-${i}" class="hrs" type="number" inputmode="decimal" min="0" max="16" step="0.5" value="${v || ""}" placeholder="0" data-action="hours" data-id="${r.id}" data-i="${i}" aria-label="${esc(S.refLabel(r.ref))}, ${days[i]} hours"></td>`).join("")}
              <td class="num strong" id="rt-${r.id}">${S.round1(S.sum(r.h))}</td>
              <td><button type="button" class="btn icon ghost" data-action="remove-row" data-id="${r.id}" aria-label="Remove ${esc(S.refLabel(r.ref))}">×</button></td>
            </tr>`).join("") || `<tr><td colspan="9" class="empty-cell">No hours yet this week. Add a build or assignment below${prevRows.length ? ", or copy last week’s rows" : ""}.</td></tr>`}
          </tbody>
          <tfoot><tr><th scope="row" colspan="2">Day total (8 h day)</th>${dayTotals.map((t, i) => `<td class="num strong ${t > 8 ? "over-cell" : ""}" id="dt-${i}">${S.round1(t)}</td>`).join("")}<td class="num strong" id="wt">${S.round1(total)}</td><td></td></tr></tfoot>
        </table>
      </div>
      <form class="add-row" data-action="add-row">
        <label>Add a row
          <select name="ref" id="add-ref" required>
            ${mineB.length ? `<optgroup label="My builds">${mineB.map((b) => opt(b.id, `${b.study}${b.location ? ` (${b.location})` : ""}`)).join("")}</optgroup>` : ""}
            ${assigns.length ? `<optgroup label="Other assignments">${assigns.map((a) => opt(a.id, a.label)).join("")}</optgroup>` : ""}
            ${otherB.length ? `<optgroup label="Other builds">${otherB.map((b) => opt(b.id, `${b.study}${b.location ? ` (${b.location})` : ""}`)).join("")}</optgroup>` : ""}
          </select>
        </label>
        <label>Activity<select name="activity" id="add-act">${st.activities.map((a) => opt(a, a)).join("")}</select></label>
        <button type="submit" class="btn primary">Add row</button>
        ${prevRows.length && !rows.length ? `<button type="button" class="btn" data-action="copy-week">Copy last week’s rows</button>` : ""}
      </form>
      <div class="grid-2">
        <section class="card">
          <h2>Week capacity</h2>
          <p class="goal-num"><strong>${S.round1(total)}</strong> of 40 h</p>
          ${bar((total / 40) * 100, total > 40 ? "over thick" : "thick")}
          <p class="muted small">${capNote}</p>
        </section>
        <section class="card">
          <h2>Where the time goes</h2>
          ${Object.keys(byAct).length ? Object.entries(byAct).sort((a, b) => b[1] - a[1]).map(([a, h]) => `
            <div class="act-row"><span>${esc(a)}</span>${bar(total ? (h / total) * 100 : 0)}<span class="num strong">${S.round1(h)} h</span></div>`).join("") : `<p class="muted small">Add hours to see the split by activity.</p>`}
        </section>
        <section class="card">
          <h2>Team this week</h2>
          ${st.people.map((p) => { const h = weekHours(st, p); return `<div class="act-row"><span>${esc(p)}</span>${bar((h / 40) * 100, h > 40 ? "over" : "")}<span class="num strong">${S.round1(h)} h</span></div>`; }).join("")}
        </section>
      </div>
    </section>`;
  }

  // ---------- footer ----------
  function footer(st) {
    const hasEx = st.builds.some((b) => b.example);
    return `
    <footer class="wrap foot">
      <div>
        <strong>Your data</strong>
        <p class="muted small">Saved in this browser only. Export to share or back up.</p>
      </div>
      <div class="foot-actions">
        <button type="button" class="btn" data-action="export-builds">Export builds CSV</button>
        <button type="button" class="btn" data-action="export-time">Export hours CSV</button>
        <button type="button" class="btn" data-action="export-json">Download backup</button>
        <label class="btn file-btn">Restore backup<input type="file" accept="application/json,.json" data-action="import-json" class="sr"></label>
        <button type="button" class="btn" data-action="${hasEx ? "remove-examples" : "load-examples"}">${hasEx ? "Remove example builds" : "Load example builds"}</button>
        <button type="button" class="btn ghost danger" data-action="reset">Reset to starting data</button>
      </div>
    </footer>`;
  }

  // ---------- editor dialog ----------
  function openEditor(id) {
    const st = S.get();
    const b = id ? st.builds.find((x) => x.id === id) : S.normalize({ assignedTo: st.person });
    const isNew = !id;
    const date = (name, label) => `<label>${label}<input type="date" name="${name}" value="${esc(b[name])}"></label>`;
    const num = (name, label, min) => `<label>${label}<input type="number" name="${name}" min="${min}" step="1" value="${esc(b[name] ?? "")}"></label>`;
    const yn = (name, label) => `<label>${label}<select name="${name}">${opt("", "Not recorded", b[name])}${opt("yes", "Yes", b[name])}${opt("no", "No", b[name])}</select></label>`;
    const people = (name, label) => `<label>${label}<select name="${name}">${opt("", "Nobody", b[name])}${st.people.map((p) => opt(p, p, b[name])).join("")}</select></label>`;

    dlg.innerHTML = `
      <form method="dialog" class="editor" data-id="${esc(id || "")}">
        <div class="ed-head">
          <h2>${isNew ? "Add a build" : `Edit ${esc(b.study)}`}</h2>
          <button type="button" class="btn icon ghost" data-action="close" aria-label="Close">×</button>
        </div>
        <div class="ed-body">
          <fieldset><legend>Study</legend>
            <div class="ed-grid">
              <label class="span-2">Study<input name="study" value="${esc(b.study)}" required></label>
              <label>Site<input name="location" value="${esc(b.location)}" list="sites"></label>
              <label>Area<input name="area" value="${esc(b.area)}" list="areas"></label>
              <label>Standard or custom<select name="buildType">${opt("", "Not recorded", b.buildType)}${opt("Standard", "Standard", b.buildType)}${opt("Custom", "Custom", b.buildType)}</select></label>
              ${num("totalVisits", "Total overall visits", 0)}
            </div>
          </fieldset>
          <fieldset><legend>People and dates</legend>
            <div class="ed-grid">
              ${people("assignedTo", "Assigned to")}
              ${people("completedBy", "Completed by")}
              ${date("dueDate", "Due date")}
              ${date("completionDate", "Completion date")}
            </div>
          </fieldset>
          <fieldset><legend>Build milestones</legend>
            <div class="ed-grid">
              ${date("protocolFinal", "Protocol finalization")}
              ${date("ccgFinal", "CCG finalization")}
              ${date("crfFinal", "CRF finalization")}
              ${date("configDate", "Configuration date")}
              ${date("uatStart", "Acceptance testing start")}
            </div>
          </fieldset>
          <fieldset><legend>QC</legend>
            <div class="ed-grid">
              ${yn("ccgs", "CCGs provided?")}
              ${yn("blankEcrfs", "Blank eCRFs provided?")}
              ${num("uatTries", "Testing rounds to pass", 1)}
              ${num("versions", "Versions before approval", 1)}
              ${num("sourceAdjustments", "Source adjustments", 0)}
            </div>
          </fieldset>
          <label class="block-label">Notes<textarea name="notes" rows="3">${esc(b.notes)}</textarea></label>
          <datalist id="sites">${[...new Set(st.builds.map((x) => x.location).filter(Boolean))].map((l) => `<option value="${esc(l)}">`).join("")}</datalist>
          <datalist id="areas"><option value="Therapeutic"><option value="Vaccine"></datalist>
          <p class="ed-error" role="alert"></p>
        </div>
        <div class="ed-foot">
          ${isNew ? "<span></span>" : `<button type="button" class="btn ghost danger" data-action="delete">Delete build</button>`}
          <div class="row-gap">
            <button type="button" class="btn" data-action="close">Cancel</button>
            <button type="submit" class="btn primary" value="save">${isNew ? "Add build" : "Save changes"}</button>
          </div>
        </div>
      </form>`;
    dlg.showModal();
    const first = dlg.querySelector("input[name=study]");
    if (first && isNew) first.focus();
  }

  const NUM_FIELDS = ["totalVisits", "uatTries", "versions", "sourceAdjustments"];
  const DATE_ORDER = ["protocolFinal", "ccgFinal", "crfFinal", "configDate", "uatStart", "completionDate"];

  dlg.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (e.target === dlg) { dlg.close(); return; }
    if (!el) return;
    if (el.dataset.action === "close") dlg.close();
    if (el.dataset.action === "delete") {
      const id = dlg.querySelector("form").dataset.id;
      const b = S.get().builds.find((x) => x.id === id);
      if (b && confirm(`Delete ${b.study}? Hours logged against it stay in the timesheet as “Removed build”.`)) {
        S.update((st) => { st.builds = st.builds.filter((x) => x.id !== id); });
        dlg.close();
        flash(`${b.study} deleted.`);
      }
    }
  });

  dlg.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const data = {};
    for (const [k, v] of fd.entries()) data[k] = typeof v === "string" ? v.trim() : v;
    NUM_FIELDS.forEach((k) => { data[k] = data[k] === "" ? null : Number(data[k]); });
    if (data.ccgs === "no") data.ccgFinal = "";
    // Milestones should not go backwards.
    const set = DATE_ORDER.filter((k) => data[k]);
    for (let i = 1; i < set.length; i++) {
      if (data[set[i]] < data[set[i - 1]]) {
        form.querySelector(".ed-error").textContent = "A milestone date is earlier than the one before it. Check the build milestone dates and completion date.";
        return;
      }
    }
    if (data.completionDate && !data.completedBy) data.completedBy = data.assignedTo;
    const id = form.dataset.id;
    S.update((st) => {
      if (id) Object.assign(st.builds.find((x) => x.id === id), data);
      else st.builds.unshift(S.normalize({ ...data, id: S.newId("b") }));
    });
    dlg.close();
    flash(id ? `${data.study} saved.` : `${data.study} added.`);
  });

  // ---------- render ----------
  function render() {
    const st = S.get();
    const active = document.activeElement;
    const focusId = active && app.contains(active) && active.id;
    let caret = null;
    try { caret = active && active.selectionStart; } catch (e) { caret = null; }
    const view = { work: viewWork, builds: viewBuilds, kpis: viewKpis, time: viewTime }[st.tab] || viewWork;
    app.innerHTML = `${header(st)}<main class="wrap content" id="main">${ui.flash ? `<div class="flash" role="status">${esc(ui.flash)}</div>` : ""}${view(st)}</main>${footer(st)}`;
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) { el.focus(); try { if (caret != null) el.setSelectionRange(caret, caret); } catch (e) { /* not a text input */ } }
    }
  }

  let flashTimer;
  function flash(msg) {
    ui.flash = msg;
    render();
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { ui.flash = ""; render(); }, 3500);
  }

  function updateTotals() {
    const st = S.get();
    const rows = S.weekRows(st.week, st.person);
    rows.forEach((r) => { const c = document.getElementById(`rt-${r.id}`); if (c) c.textContent = S.round1(S.sum(r.h)); });
    let total = 0;
    S.DAYS.forEach((_, i) => {
      const t = rows.reduce((a, r) => a + (Number(r.h[i]) || 0), 0);
      total += t;
      const c = document.getElementById(`dt-${i}`);
      if (c) { c.textContent = S.round1(t); c.classList.toggle("over-cell", t > 8); }
    });
    const w = document.getElementById("wt");
    if (w) w.textContent = S.round1(total);
  }

  const findBuild = (st, id) => st.builds.find((b) => b.id === id);
  const findRow = (st, id) => S.weekRows(st.week, st.person).find((r) => r.id === id);

  // ---------- events ----------
  app.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || ["FORM", "SELECT", "INPUT"].includes(el.tagName)) return;
    const { action, id, v } = el.dataset;
    switch (action) {
      case "person": S.update((st) => { st.person = v; }); break;
      case "tab": S.update((st) => { st.tab = v; }); window.scrollTo(0, 0); break;
      case "new": openEditor(null); break;
      case "edit": openEditor(id); break;
      case "claim": { let name; S.update((st) => { const b = findBuild(st, id); b.assignedTo = st.person; name = b.study; }); flash(`${name} assigned to you.`); break; }
      case "undo-stage": S.update((st) => {
        const b = findBuild(st, id); const last = S.lastDoneStage(b);
        if (last) { b[last.k] = ""; if (last.k === "completionDate") b.completedBy = ""; }
      }); break;
      case "week": S.update((st) => { st.week = Number(v) === 0 ? D.mondayOf(D.today()) : D.addDays(st.week, Number(v)); }); break;
      case "remove-row": S.update((st) => { const w = st.time[st.week]; w[st.person] = w[st.person].filter((r) => r.id !== id); }); break;
      case "copy-week": S.update((st) => {
        const prev = S.weekRows(D.addDays(st.week, -7), st.person);
        st.time[st.week] = st.time[st.week] || {};
        st.time[st.week][st.person] = prev.map((r) => ({ id: S.newId("r"), ref: r.ref, activity: r.activity, h: [0, 0, 0, 0, 0] }));
      }); break;
      case "clear-demo": if (confirm("Clear all hours in the tracker? Builds stay as they are.")) S.update((st) => { st.time = {}; st.demoHours = false; }); break;
      case "load-examples": S.loadExamples(); flash("Example builds added. They’re labelled EXAMPLE."); break;
      case "remove-examples": S.removeExamples(); flash("Example builds removed."); break;
      case "export-builds": S.exportBuildsCSV(); break;
      case "export-time": S.exportTimeCSV(); break;
      case "export-json": S.exportJSON(); break;
      case "reset": if (confirm("Reset everything to the starting data? This clears all builds, dates and hours saved in this browser.")) S.reset(); break;
    }
  });

  app.addEventListener("input", (e) => {
    const el = e.target;
    const { action, id, i, k } = el.dataset;
    if (action === "hours") {
      const val = el.value === "" ? 0 : Math.max(0, Math.min(16, parseFloat(el.value) || 0));
      S.update((st) => { findRow(st, id).h[Number(i)] = val; }, { silent: true });
      updateTotals();
    } else if (action === "filter" && k === "q") { ui.q = el.value; render(); }
  });

  app.addEventListener("change", (e) => {
    const el = e.target;
    const { action, id, k } = el.dataset;
    if (action === "hours") render();
    else if (action === "assign") S.update((st) => { findBuild(st, id).assignedTo = el.value; });
    else if (action === "activity") S.update((st) => { findRow(st, id).activity = el.value; });
    else if (action === "filter" && k !== "q") { ui[k] = el.value; render(); }
    else if (action === "import-json" && el.files[0]) {
      el.files[0].text().then((t) => {
        try { S.importJSON(t); flash("Backup restored."); }
        catch (err) { alert(err.message || "That file couldn’t be read."); }
      });
    }
  });

  app.addEventListener("submit", (e) => {
    const form = e.target;
    e.preventDefault();
    const fd = new FormData(form);
    if (form.dataset.action === "stage") {
      const date = fd.get("date");
      if (!date) return;
      const cur = S.get().builds.find((x) => x.id === form.dataset.id);
      const prev = S.lastDoneStage(cur);
      if (prev && date < cur[prev.k]) {
        alert(`That date is before “${prev.label}” (${D.fmtDate(cur[prev.k])}). Pick a later date, or fix the earlier date with Edit details.`);
        return;
      }
      let msg = "";
      S.update((st) => {
        const b = findBuild(st, form.dataset.id);
        const k = form.dataset.k;
        b[k] = date;
        if (k === "completionDate") {
          b.completedBy = fd.get("completedBy") || b.assignedTo;
          b.uatTries = fd.get("uatTries") === "" ? null : Number(fd.get("uatTries"));
          b.versions = fd.get("versions") === "" ? null : Number(fd.get("versions"));
          b.sourceAdjustments = fd.get("sourceAdjustments") === "" ? 0 : Number(fd.get("sourceAdjustments"));
          const s = S.schedule(b);
          msg = `${b.study} complete. ${s.detail}.`;
        }
      });
      if (msg) flash(msg);
    } else if (form.dataset.action === "add-row") {
      const ref = fd.get("ref");
      if (!ref) return;
      S.update((st) => {
        st.time[st.week] = st.time[st.week] || {};
        st.time[st.week][st.person] = (st.time[st.week][st.person] || []).concat([{ id: S.newId("r"), ref, activity: fd.get("activity"), h: [0, 0, 0, 0, 0] }]);
      });
    }
  });

  S.subscribe(render);
  render();
})();
