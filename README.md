# eSource Build Tracker

A lightweight web app for the eSource team. It shows each person what to do next on their studies, tracks QC to EOS progress against the 2026 goal, and lets everyone allocate their weekly hours to studies and assignments.

This is a **prototype for team review**. It runs entirely in the browser with no server, database or build step.

## What it does

**My next steps.** Each person sees their open studies in order: QC in progress, then ready to start, then studies that still need setup. From each card you can:

- set the QC start visit and visit count,
- start QC,
- log visits as they're QC'd,
- mark the study complete.

An unassigned queue lets people claim the next study.

**All studies.** All 27 studies from the 2026 list, with filters for site, status and owner. You can change the owner inline and export the list to CSV.

**Time allocation.** A Monday–Friday timesheet per person and per week:

- add a row for any study or for admin, training or general build work,
- choose the activity,
- enter hours per day.

Days over 8 hours and weeks over 40 hours are flagged. "Copy last week's rows" sets up a new week quickly.

**Team and goals.** Shows each person's hours against capacity and their open studies, plus a week-by-week runway toward **26 studies QC'd to EOS by Dec 31, 2026** (plan: 2–3 a week). It also lists the build KPIs from the metrics dashboard and the data each one needs.

## Run it

Download or clone the repo and open `index.html` in a browser. That's all.

To serve it locally instead, run:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Put it on GitHub Pages

1. Create a new repository (for example `esource-build-tracker`) and push these files to the `main` branch.
2. In the repo, go to **Settings › Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, and click **Save**.
4. After a minute the site is live at `https://<your-org-or-user>.github.io/esource-build-tracker/`.

The repo has to be public for GitHub Pages to work on a free plan, so don't commit anything you wouldn't want public. GitHub Enterprise can publish Pages privately to your organization.

```bash
git init
git add .
git commit -m "eSource Build Tracker prototype"
git branch -M main
git remote add origin https://github.com/<your-org-or-user>/esource-build-tracker.git
git push -u origin main
```

## Where the data lives

- **Starting data** is in `js/data.js`. It came from:
  - `End_of_Year_Goals_2026_Source.xlsx`: studies, sites, visit counts, owners and QC start dates.
  - `eSource_Clinical_Study_Build_Metrics_Dashboard.xlsx`: the KPI list.
- **Changes people make** are saved in their own browser (`localStorage`). They are **not shared** between people or computers.
- Use **Download backup** and **Restore backup** in the footer to move data between browsers. Use **Export hours CSV** or **Export studies CSV** to get data into Excel.
- The hours in the current week are example data so the demo isn't empty. Use **Clear example hours** to remove them, or empty `demoHours` in `js/data.js`.
- Keep patient information out of this tool. It tracks study and visit metadata only.

## Project layout

```
index.html        Page shell
css/styles.css    Styles (light and dark mode)
js/data.js        Seed data: people, studies, goal, KPIs, example hours
js/store.js       State, saving, date helpers, CSV/JSON export and import
js/app.js         Screens and interactions
```

Everything is plain HTML, CSS and JavaScript, so there are no dependencies to install.

## Next steps toward a team tool

The prototype stores data per browser. To make it a shared tool, replace the save and load functions in `js/store.js` with one of these:

1. **SharePoint list + Power Apps / Power BI.** This fits the Microsoft 365 setup. The screens here work as the spec for the Power App, and the KPI table maps straight to a Power BI report.
2. **SharePoint list via Microsoft Graph.** Keep this web UI and read and write the list with MSAL sign-in. This needs an Entra ID app registration from IT.
3. **A small hosted backend** (for example Azure Static Web Apps with Azure Functions and a database).

To calculate the build KPIs, add these per-study fields:

- protocol, CCGs and blank eCRFs received dates,
- build start, first full draft, UAT start and UAT sign-off dates,
- publish date,
- version count,
- flags for passed UAT first time and post-production change.
