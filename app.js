/*
 * eSource Build Tracker: UI.
 * Plain JavaScript, no framework or build step. Renders from Store state on
 * every change; events are handled by delegation on #app using data-action.
 */
(function () {
  const S = window.Store;
  const D = S.dates;
  const app = document.getElementById("app");
  const ui = { q: "", loc: "", status: "", owner: "", flash: "" };

  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;

  // ---------- shared bits ----------
  function belongsTo(s, person) {
    return s.owner === person || (s.support || "").toLowerCase().startsWith(person.toLowerCase());
  }

  function goalStats(st) {
    const completed = st.studies.filter((s) => s.qcDone).length;
    const started = st.studies.filter((s) => s.qcStart).length;
    const t = D.today();
    const daysLeft = Math.max(0, D.daysBetween(t, st.goal.due));
    const weeksLeft = daysLeft / 7;
    const remaining = Math.max(0, st.goal.target - completed);
    const pace = weeksLeft > 0 ? remaining / weeksLeft : remaining;
    return { completed, started, weeksLeft, remaining, pace };
  }

  function chip(status) {
    return `<span class="chip chip-${status}">${esc(S.STATUS_LABEL[status])}</span>`;
  }

  function bar(pct, cls) {
    const w = Math.max(0, Math.min(100, pct));
    return `<div class="bar ${cls || ""}" role="presentation"><span style="width:${w}%"></span></div>`;
  }

  // ---------- header ----------
  function header(st) {
    const tabs = [["work", "My next steps"], ["studies", "All studies"], ["time", "Time allocation"], ["team", "Team and goals"]];
    return `
    <header class="top">
      <div class="wrap top-row">
        <div class="brand">
          <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="7"></rect><path d="M9 16.5l4.5 4.5L23 11"></path></svg>
          <div>
            <div class="brand-name">eSource Build Tracker</div>
            <div class="brand-sub">What needs to happen next, and where the hours go</div>
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

  // ---------- My next steps ----------
  function taskCard(s, st) {
    const status = S.statusOf(s);
    const pct = s.qcVisits ? (s.visitsQcd / s.qcVisits) * 100 : 0;
    const role = s.owner === st.person ? "" : `<span class="tag">Supporting ${esc(s.owner || "")}</span>`;
    let next = "", body = "", actions = "";

    if (status === "needs_setup") {
      next = "Set the QC start visit and how many visits need QC to EOS.";
      body = `
        <form class="setup" data-action="setup" data-id="${s.id}">
          <label>QC start visit<input name="startVisit" id="sv-${s.id}" placeholder="e.g. Visit 7" value="${esc(s.qcStartVisit)}" required></label>
          <label>Visits to QC<input name="visits" id="vq-${s.id}" type="number" min="1" step="1" placeholder="e.g. 12" value="${esc(s.qcVisits || "")}" required></label>
          <button type="submit" class="btn primary">Save setup</button>
        </form>`;
    } else if (status === "ready") {
      next = `Start QC at ${esc(s.qcStartVisit)} (${plural(s.qcVisits, "visit")} to EOS).`;
      actions = `<button type="button" class="btn primary" data-action="start" data-id="${s.id}">Start QC</button>`;
    } else if (status === "in_progress") {
      const left = Math.max(0, s.qcVisits - s.visitsQcd);
      next = left > 0
        ? `QC ${esc(s.qcStartVisit)} to EOS: ${plural(left, "visit")} left.`
        : "All visits QC’d. Mark the study complete.";
      body = `<div class="progress">${bar(pct)}<span>${s.visitsQcd} of ${s.qcVisits} visits QC’d</span></div>`;
      actions = `
        <button type="button" class="btn" data-action="visit" data-id="${s.id}" data-v="-1" ${s.visitsQcd <= 0 ? "disabled" : ""} aria-label="Remove one QC’d visit from ${esc(s.study)}">−1</button>
        <button type="button" class="btn ${left > 0 ? "primary" : ""}" data-action="visit" data-id="${s.id}" data-v="1" ${left <= 0 ? "disabled" : ""}>Log a visit QC’d</button>
        <button type="button" class="btn ${left > 0 ? "" : "primary"}" data-action="complete" data-id="${s.id}">Mark complete</button>`;
    }

    const started = s.qcStart ? `QC started ${D.fmtDate(s.qcStart)}` : "";
    return `
    <article class="task">
      <div class="task-main">
        <div class="task-head">
          <h3>${esc(s.study)}</h3>
          ${chip(status)}
        </div>
        <div class="tags"><span class="tag">${esc(s.location)}</span><span class="tag">${esc(s.period)}</span>${s.area ? `<span class="tag">${esc(s.area)}</span>` : ""}${role}</div>
        <p class="next">${next}</p>
        ${body}
        ${started ? `<p class="meta">${started}${s.support && s.owner === st.person ? `, with ${esc(s.support)}` : ""}</p>` : ""}
      </div>
      ${actions ? `<div class="task-actions">${actions}</div>` : ""}
    </article>`;
  }

  function runway(st) {
    // One cell per week from the first QC start (or this week) to the due date.
    const starts = st.studies.map((s) => s.qcStart).filter(Boolean).sort();
    let w = D.mondayOf(starts[0] || D.today());
    const end = D.mondayOf(st.goal.due);
    const thisWeek = D.mondayOf(D.today());
    const cells = [];
    while (w <= end && cells.length < 60) {
      const done = st.studies.filter((s) => s.qcDone && D.mondayOf(s.qcDone) === w).length;
      const cls = done >= 2 ? "hit" : done === 1 ? "part" : w >= thisWeek ? "future" : "miss";
      cells.push(`<li class="wk ${cls} ${w === thisWeek ? "now" : ""}" title="Week of ${D.fmtDate(w)}: ${plural(done, "study", "studies")} completed"><span class="wk-n">${w > thisWeek && !done ? "" : done}</span><span class="wk-d">${D.fmtDate(w, { month: "numeric", day: "numeric" })}</span></li>`);
      w = D.addDays(w, 7);
    }
    return `<ol class="runway" aria-label="Studies completed per week until the due date">${cells.join("")}</ol>
      <p class="legend"><span class="key hit"></span>2 or more <span class="key part"></span>1 <span class="key miss"></span>none <span class="key future"></span>still to come</p>`;
  }

  function goalCard(st, big) {
    const g = goalStats(st);
    const onPace = g.pace <= 3;
    return `
    <section class="card goal ${big ? "goal-big" : ""}" aria-labelledby="goal-h">
      <h2 id="goal-h">${esc(st.goal.label)}</h2>
      <p class="goal-num"><strong>${g.completed}</strong> of ${st.goal.target} complete, ${g.started - g.completed} in progress</p>
      ${bar((g.completed / st.goal.target) * 100, "thick")}
      <dl class="facts">
        <div><dt>Due</dt><dd>${D.fmtDate(st.goal.due)}</dd></div>
        <div><dt>Weeks left</dt><dd>${S.round1(g.weeksLeft)}</dd></div>
        <div><dt>Plan</dt><dd>${esc(st.goal.plan)}</dd></div>
        <div><dt>Needed now</dt><dd class="${onPace ? "" : "warn"}">${S.round1(g.pace)} a week</dd></div>
      </dl>
      ${runway(st)}
    </section>`;
  }

  function weekHours(st, person) {
    return S.weekRows(st.week, person).reduce((t, r) => t + S.sum(r.h), 0);
  }

  function viewWork(st) {
    const order = { in_progress: 0, ready: 1, needs_setup: 2 };
    const mine = st.studies.filter((s) => belongsTo(s, st.person) && !s.qcDone)
      .sort((a, b) => (order[S.statusOf(a)] - order[S.statusOf(b)]) || String(a.qcStart).localeCompare(String(b.qcStart)));
    const doneMine = st.studies.filter((s) => belongsTo(s, st.person) && s.qcDone).sort((a, b) => b.qcDone.localeCompare(a.qcDone));
    const unassigned = st.studies.filter((s) => !s.owner);
    const hours = weekHours(st, st.person);

    return `
    <div class="split">
      <section class="main-col" aria-labelledby="work-h">
        <div class="section-head">
          <h1 id="work-h">${esc(st.person)}’s next steps</h1>
          <span class="muted">${plural(mine.length, "open study", "open studies")}</span>
        </div>
        ${mine.length ? mine.map((s) => taskCard(s, st)).join("") : `<div class="empty">Nothing assigned right now. Claim a study from the queue below.</div>`}

        ${doneMine.length ? `<details class="card done-list"><summary>${plural(doneMine.length, "study", "studies")} completed</summary>
          <ul>${doneMine.map((s) => `<li><span>${esc(s.study)} <span class="muted">(${esc(s.location)})</span></span><span class="muted">${D.fmtDate(s.qcDone)}</span><button type="button" class="link" data-action="reopen" data-id="${s.id}">Reopen</button></li>`).join("")}</ul></details>` : ""}

        <section class="card queue" aria-labelledby="queue-h">
          <div class="section-head">
            <h2 id="queue-h">Unassigned queue</h2>
            <span class="muted">${plural(unassigned.length, "study", "studies")} without an owner</span>
          </div>
          ${unassigned.slice(0, 6).map((s) => `
            <div class="q-row">
              <div><div class="q-title">${esc(s.study)}</div><div class="muted small">${esc(s.location)}, ${esc(s.period)}${s.totalVisits ? `, total visits ${esc(s.totalVisits)}` : ""}</div></div>
              <button type="button" class="btn" data-action="claim" data-id="${s.id}">Claim</button>
            </div>`).join("")}
          ${unassigned.length > 6 ? `<button type="button" class="link" data-action="tab" data-v="studies">See all ${unassigned.length} in All studies</button>` : ""}
        </section>
      </section>

      <aside class="side-col">
        ${goalCard(st)}
        <section class="card" aria-labelledby="wk-h">
          <h2 id="wk-h">Your hours this week</h2>
          <p class="goal-num"><strong>${S.round1(hours)}</strong> of 40 h allocated</p>
          ${bar((hours / 40) * 100, hours > 40 ? "over thick" : "thick")}
          <button type="button" class="btn primary block" data-action="tab" data-v="time">Allocate time</button>
        </section>
      </aside>
    </div>`;
  }

  // ---------- All studies ----------
  function viewStudies(st) {
    const locs = [...new Set(st.studies.map((s) => s.location))].sort();
    const q = ui.q.trim().toLowerCase();
    const rows = st.studies.filter((s) =>
      (!q || `${s.study} ${s.location} ${s.owner}`.toLowerCase().includes(q)) &&
      (!ui.loc || s.location === ui.loc) &&
      (!ui.status || S.statusOf(s) === ui.status) &&
      (!ui.owner || (ui.owner === "_none" ? !s.owner : s.owner === ui.owner)));

    const opt = (v, l, cur) => `<option value="${esc(v)}" ${v === cur ? "selected" : ""}>${esc(l)}</option>`;
    return `
    <section aria-labelledby="studies-h">
      <div class="section-head">
        <h1 id="studies-h">All studies</h1>
        <button type="button" class="btn" data-action="export-studies">Export studies CSV</button>
      </div>
      <div class="filters">
        <label>Search<input id="f-q" type="search" data-action="filter" data-k="q" value="${esc(ui.q)}" placeholder="Study, site or owner"></label>
        <label>Site<select id="f-loc" data-action="filter" data-k="loc">${opt("", "All sites", ui.loc)}${locs.map((l) => opt(l, l, ui.loc)).join("")}</select></label>
        <label>Status<select id="f-status" data-action="filter" data-k="status">${opt("", "Any status", ui.status)}${Object.entries(S.STATUS_LABEL).map(([k, l]) => opt(k, l, ui.status)).join("")}</select></label>
        <label>Owner<select id="f-owner" data-action="filter" data-k="owner">${opt("", "Anyone", ui.owner)}${opt("_none", "No owner", ui.owner)}${st.people.map((p) => opt(p, p, ui.owner)).join("")}</select></label>
      </div>
      <p class="muted small">${plural(rows.length, "study", "studies")} shown</p>
      <div class="table-box">
        <table>
          <thead><tr><th scope="col">Study</th><th scope="col">Site</th><th scope="col">Period</th><th scope="col">Total visits</th><th scope="col">Owner</th><th scope="col">QC start visit</th><th scope="col">QC progress</th><th scope="col">Status</th></tr></thead>
          <tbody>
            ${rows.map((s) => {
              const status = S.statusOf(s);
              const prog = s.qcVisits ? `${s.visitsQcd} / ${s.qcVisits}` : "—";
              return `<tr>
                <th scope="row">${esc(s.study)}</th>
                <td>${esc(s.location)}</td>
                <td>${esc(s.period)}</td>
                <td>${esc(s.totalVisits) || "—"}</td>
                <td><select id="own-${s.id}" data-action="owner" data-id="${s.id}" aria-label="Owner for ${esc(s.study)}">${opt("", "Unassigned", s.owner)}${st.people.map((p) => opt(p, p, s.owner)).join("")}</select></td>
                <td>${esc(s.qcStartVisit) || "—"}</td>
                <td class="num">${prog}</td>
                <td>${chip(status)}</td>
              </tr>`;
            }).join("") || `<tr><td colspan="8" class="empty-cell">No studies match these filters. Clear a filter to see more.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>`;
  }

  // ---------- Time allocation ----------
  function weekNav(st) {
    const end = D.addDays(st.week, 4);
    const isThis = st.week === D.mondayOf(D.today());
    return `
    <div class="week-nav" role="group" aria-label="Choose week">
      <button type="button" class="btn icon" data-action="week" data-v="-7" aria-label="Previous week">‹</button>
      <span class="week-label">${D.fmtDate(st.week, { month: "short", day: "numeric" })} – ${D.fmtDate(end)}</span>
      <button type="button" class="btn icon" data-action="week" data-v="7" aria-label="Next week">›</button>
      ${isThis ? "" : `<button type="button" class="btn" data-action="week" data-v="0">This week</button>`}
    </div>`;
  }

  function viewTime(st) {
    const rows = S.weekRows(st.week, st.person);
    const used = new Set(rows.map((r) => r.ref));
    const mineStudies = st.studies.filter((s) => belongsTo(s, st.person) && !used.has(s.id));
    const otherStudies = st.studies.filter((s) => !belongsTo(s, st.person) && !used.has(s.id));
    const assigns = st.assignments.filter((a) => !used.has(a.id));
    const dayTotals = S.DAYS.map((_, i) => rows.reduce((t, r) => t + (Number(r.h[i]) || 0), 0));
    const total = S.sum(dayTotals);
    const byAct = {};
    rows.forEach((r) => { byAct[r.activity] = (byAct[r.activity] || 0) + S.sum(r.h); });
    const prevRows = S.weekRows(D.addDays(st.week, -7), st.person);
    const days = S.DAYS.map((d, i) => `${d} ${D.fmtDate(D.addDays(st.week, i), { day: "numeric" })}`);
    const capNote = total > 40
      ? `Over by ${S.round1(total - 40)} h. Move work to another week or flag it to your lead.`
      : total === 40 ? "Fully allocated." : `${S.round1(40 - total)} h open. Claim a study from the queue if you have room.`;

    return `
    <section aria-labelledby="time-h">
      <div class="section-head wrap-row">
        <div>
          <h1 id="time-h">Time allocation for ${esc(st.person)}</h1>
          <p class="muted">Hours per study or assignment, Monday to Friday.</p>
        </div>
        ${weekNav(st)}
      </div>

      ${st.demoLoaded ? `<div class="notice"><span>Some weeks have example hours so you can try things out.</span><button type="button" class="btn" data-action="clear-demo">Clear example hours</button></div>` : ""}

      <div class="table-box">
        <table class="time">
          <thead><tr><th scope="col">Study or assignment</th><th scope="col">Activity</th>${days.map((d) => `<th scope="col" class="num">${d}</th>`).join("")}<th scope="col" class="num">Total</th><th scope="col"><span class="sr">Remove</span></th></tr></thead>
          <tbody>
            ${rows.map((r) => `<tr>
              <th scope="row">${esc(S.refLabel(r.ref))}</th>
              <td><select id="act-${r.id}" data-action="activity" data-id="${r.id}" aria-label="Activity for ${esc(S.refLabel(r.ref))}">${st.activities.map((a) => `<option ${a === r.activity ? "selected" : ""}>${esc(a)}</option>`).join("")}</select></td>
              ${r.h.map((v, i) => `<td class="num"><input id="h-${r.id}-${i}" class="hrs" type="number" inputmode="decimal" min="0" max="16" step="0.5" value="${v || ""}" placeholder="0" data-action="hours" data-id="${r.id}" data-i="${i}" aria-label="${esc(S.refLabel(r.ref))}, ${days[i]} hours"></td>`).join("")}
              <td class="num strong" id="rt-${r.id}">${S.round1(S.sum(r.h))}</td>
              <td><button type="button" class="btn icon ghost" data-action="remove-row" data-id="${r.id}" aria-label="Remove ${esc(S.refLabel(r.ref))}">×</button></td>
            </tr>`).join("") || `<tr><td colspan="9" class="empty-cell">No hours yet this week. Add a study or assignment below${prevRows.length ? ", or copy last week’s rows" : ""}.</td></tr>`}
          </tbody>
          <tfoot><tr><th scope="row" colspan="2">Day total (8 h day)</th>${dayTotals.map((t, i) => `<td class="num strong ${t > 8 ? "over-cell" : ""}" id="dt-${i}">${S.round1(t)}</td>`).join("")}<td class="num strong" id="wt">${S.round1(total)}</td><td></td></tr></tfoot>
        </table>
      </div>

      <form class="add-row" data-action="add-row">
        <label>Add a row
          <select name="ref" id="add-ref" required>
            ${mineStudies.length ? `<optgroup label="My studies">${mineStudies.map((s) => `<option value="${s.id}">${esc(s.study)} (${esc(s.location)})</option>`).join("")}</optgroup>` : ""}
            ${assigns.length ? `<optgroup label="Other assignments">${assigns.map((a) => `<option value="${a.id}">${esc(a.label)}</option>`).join("")}</optgroup>` : ""}
            ${otherStudies.length ? `<optgroup label="Other studies">${otherStudies.map((s) => `<option value="${s.id}">${esc(s.study)} (${esc(s.location)})</option>`).join("")}</optgroup>` : ""}
          </select>
        </label>
        <label>Activity<select name="activity" id="add-act">${st.activities.map((a) => `<option>${esc(a)}</option>`).join("")}</select></label>
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
      </div>
    </section>`;
  }

  // ---------- Team and goals ----------
  function viewTeam(st) {
    const people = st.people.map((p) => {
      const h = weekHours(st, p);
      const open = st.studies.filter((s) => s.owner === p && !s.qcDone);
      const done = st.studies.filter((s) => s.owner === p && s.qcDone).length;
      return `
      <section class="card person">
        <div class="section-head"><h2>${esc(p)}</h2><span class="muted small">${plural(open.length, "open study", "open studies")}, ${done} complete</span></div>
        <p class="small">${S.round1(h)} of 40 h allocated</p>
        ${bar((h / 40) * 100, h > 40 ? "over" : "")}
        <ul class="plain small">${open.map((s) => `<li>${esc(s.study)} <span class="muted">${esc(S.STATUS_LABEL[S.statusOf(s)])}</span></li>`).join("") || `<li class="muted">No open studies</li>`}</ul>
      </section>`;
    }).join("");

    return `
    <section aria-labelledby="team-h">
      <div class="section-head wrap-row">
        <h1 id="team-h">Team and goals</h1>
        ${weekNav(st)}
      </div>
      <div class="grid-people">${people}</div>
      ${goalCard(st, true)}
      <section class="card table-card" aria-labelledby="kpi-h">
        <h2 id="kpi-h">Build KPIs</h2>
        <p class="muted small">From the eSource metrics dashboard. These need build milestone dates per study, which this prototype doesn’t capture yet.</p>
        <div class="table-box flat">
          <table>
            <thead><tr><th scope="col">Category</th><th scope="col">Metric</th><th scope="col">Target</th><th scope="col">Calculated from</th></tr></thead>
            <tbody>${st.kpis.map((k) => `<tr><td class="muted">${esc(k.cat)}</td><th scope="row">${esc(k.name)}</th><td>${esc(k.target) || `<span class="muted">Not set</span>`}</td><td class="muted small">${esc(k.src)}</td></tr>`).join("")}</tbody>
          </table>
        </div>
      </section>
    </section>`;
  }

  // ---------- footer ----------
  function footer() {
    return `
    <footer class="wrap foot">
      <div>
        <strong>Your data</strong>
        <p class="muted small">Saved in this browser only. Export to share or back up.</p>
      </div>
      <div class="foot-actions">
        <button type="button" class="btn" data-action="export-time">Export hours CSV</button>
        <button type="button" class="btn" data-action="export-json">Download backup</button>
        <label class="btn file-btn">Restore backup<input type="file" accept="application/json,.json" data-action="import-json" class="sr"></label>
        <button type="button" class="btn ghost danger" data-action="reset">Reset to starting data</button>
      </div>
    </footer>`;
  }

  // ---------- render ----------
  function render() {
    const st = S.get();
    const active = document.activeElement;
    const focusId = active && active.id;
    let caret = null;
    try { caret = active && active.selectionStart; } catch (e) { caret = null; }

    const view = { work: viewWork, studies: viewStudies, time: viewTime, team: viewTeam }[st.tab] || viewWork;
    app.innerHTML = `${header(st)}<main class="wrap content" id="main">${ui.flash ? `<div class="flash" role="status">${esc(ui.flash)}</div>` : ""}${view(st)}</main>${footer()}`;

    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) {
        el.focus();
        try { if (caret != null) el.setSelectionRange(caret, caret); } catch (e) { /* number inputs */ }
      }
    }
  }

  let flashTimer;
  function flash(msg) {
    ui.flash = msg;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { ui.flash = ""; render(); }, 3500);
  }

  const findStudy = (st, id) => st.studies.find((s) => s.id === id);
  const findRow = (st, id) => S.weekRows(st.week, st.person).find((r) => r.id === id);

  // Live totals while typing hours, without a full redraw (keeps "1." intact).
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

  // ---------- events ----------
  app.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.tagName === "FORM" || el.tagName === "SELECT" || el.tagName === "INPUT") return;
    const { action, id, v } = el.dataset;

    switch (action) {
      case "person": S.update((st) => { st.person = v; }); break;
      case "tab": S.update((st) => { st.tab = v; }); window.scrollTo(0, 0); break;
      case "claim": S.update((st) => { const s = findStudy(st, id); s.owner = st.person; flash(`${s.study} is now yours. Set it up in My next steps.`); }); break;
      case "start": S.update((st) => { findStudy(st, id).qcStart = D.today(); }); break;
      case "visit": S.update((st) => { const s = findStudy(st, id); s.visitsQcd = Math.max(0, Math.min(s.qcVisits, s.visitsQcd + Number(v))); }); break;
      case "complete": S.update((st) => { const s = findStudy(st, id); s.qcDone = D.today(); s.visitsQcd = s.qcVisits || s.visitsQcd; flash(`${s.study} marked complete.`); }); break;
      case "reopen": S.update((st) => { findStudy(st, id).qcDone = null; }); break;
      case "week": S.update((st) => { st.week = Number(v) === 0 ? D.mondayOf(D.today()) : D.addDays(st.week, Number(v)); }); break;
      case "remove-row": S.update((st) => { const w = st.time[st.week]; w[st.person] = w[st.person].filter((r) => r.id !== id); }); break;
      case "copy-week": S.update((st) => {
        const prev = S.weekRows(D.addDays(st.week, -7), st.person);
        st.time[st.week] = st.time[st.week] || {};
        st.time[st.week][st.person] = prev.map((r) => ({ id: S.newId("r"), ref: r.ref, activity: r.activity, h: [0, 0, 0, 0, 0] }));
      }); break;
      case "clear-demo":
        if (confirm("Clear all hours in the tracker? Study progress stays as it is.")) S.update((st) => { st.time = {}; st.demoLoaded = false; });
        break;
      case "export-time": S.exportTimeCSV(); break;
      case "export-studies": S.exportStudiesCSV(); break;
      case "export-json": S.exportJSON(); break;
      case "reset":
        if (confirm("Reset everything to the starting data? This clears all hours and progress saved in this browser.")) S.reset();
        break;
    }
  });

  app.addEventListener("input", (e) => {
    const el = e.target;
    const { action, id, i, k } = el.dataset;
    if (action === "hours") {
      const val = el.value === "" ? 0 : Math.max(0, Math.min(16, parseFloat(el.value) || 0));
      S.update((st) => { findRow(st, id).h[Number(i)] = val; }, { silent: true });
      updateTotals();
    } else if (action === "filter" && k === "q") {
      ui.q = el.value; render();
    }
  });

  app.addEventListener("change", (e) => {
    const el = e.target;
    const { action, id, k } = el.dataset;
    if (action === "hours") render();
    else if (action === "owner") S.update((st) => { findStudy(st, id).owner = el.value; });
    else if (action === "activity") S.update((st) => { findRow(st, id).activity = el.value; });
    else if (action === "filter" && k !== "q") { ui[k] = el.value; render(); }
    else if (action === "import-json" && el.files[0]) {
      el.files[0].text().then((t) => {
        try { S.importJSON(t); flash("Backup restored."); render(); }
        catch (err) { alert(err.message || "That file couldn’t be read."); }
      });
    }
  });

  app.addEventListener("submit", (e) => {
    const form = e.target;
    e.preventDefault();
    const fd = new FormData(form);
    if (form.dataset.action === "setup") {
      const visits = parseInt(fd.get("visits"), 10);
      if (!fd.get("startVisit") || !(visits > 0)) return;
      S.update((st) => { const s = findStudy(st, form.dataset.id); s.qcStartVisit = String(fd.get("startVisit")).trim(); s.qcVisits = visits; });
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
