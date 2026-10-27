# eSource Build Tracker

A web app for the eSource team to track study builds. For each build it shows what has to happen next and whether the build is on schedule, and it records the QC measures for the build. Each person can also allocate their weekly hours to builds and other assignments.

This is a **prototype for team review**. It runs entirely in the browser, with no server, database or build step.

## What it tracks for each build

| Area | Fields |
|---|---|
| Study | Study, site, area, standard or custom, total overall visits |
| People | Assigned to, completed by |
| Schedule | Due date, completion date |
| Milestones | Protocol finalization, CCG finalization, CRF finalization, configuration date, acceptance testing start |
| QC | CCGs provided (yes/no), blank eCRFs provided (yes/no), testing rounds to pass, versions before approval, source adjustments, notes |

## Screens

**My builds.** Each person's open builds, with overdue builds first. Each card shows the build steps, the next step, and any missing information. A **one-click button marks the next step done**. When you complete a build, the card asks for "completed by", testing rounds, versions and source adjustments. Unassigned builds can be claimed from the queue.

**All builds.** Every build in one table, with filters for site, person and schedule. Select a study to edit any field. You can also reassign builds inline and export the table to CSV.

**QC and KPIs.** These are calculated automatically from the build data:

- on-time completion and overdue builds,
- days between milestones,
- passed testing on the first try and average testing rounds,
- versions before approval (target under 4),
- builds without CCGs or blank eCRFs (target under 5 without eCRFs),
- source adjustments,
- standard versus custom builds,
- a breakdown by person.

**Time allocation.** A Monday–Friday timesheet per person and week, with daily and weekly capacity checks and a team view.

Schedule status works like this. An open build is **Overdue** after its due date and **Due soon** within 7 days of it. A completed build is **Completed on time** or **Completed late** based on its due date. If no CCGs were provided, the CCG finalization step is skipped.

## Example data

The study list comes from the 2026 goals workbook, with build dates left blank for the team to fill in. To see how the KPIs work before real data exists, click **Load example builds** in the footer. This adds six made-up builds labelled EXAMPLE. Click **Remove example builds** to take them out.

## Files

All files sit at the top level of the repo:

```
index.html   Page shell
styles.css   Styles (light and dark mode)
data.js      People, study list, targets, example builds and hours
store.js     Data model, schedule and KPI calculations, saving, CSV/JSON export
app.js       Screens and interactions
```

To change the team members, targets (such as versions under 4), or the starting study list, edit `data.js`.

## Viewing it

Turn on **Settings › Pages** (branch `main`, folder `/ (root)`), then open `https://<user>.github.io/<repo>/`. Locally, you can double-click `index.html`.

Data is saved in each person's browser and is not shared between people. Use **Download backup** and **Restore backup** to move data between browsers. For hosting on Azure with Microsoft sign-in and shared data, replace `load()` and `save()` in `store.js` with calls to an API. The screens don't need to change.
