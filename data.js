/*
 * Starting data for the eSource Build Tracker.
 * Edit this file to change the people, the study list or the example data.
 * Changes people make in the app are saved in their own browser and can be
 * exported (CSV) or backed up (JSON) from the footer.
 *
 * Build fields (all optional except study):
 *   study, location, area
 *   buildType          "Standard" | "Custom"
 *   totalVisits        number, total overall visits in the study
 *   assignedTo         who is building it
 *   completedBy        who completed it
 *   dueDate, completionDate                         yyyy-mm-dd
 *   protocolFinal, ccgFinal, crfFinal, configDate, uatStart   yyyy-mm-dd
 *   ccgs               "yes" | "no"   were CCGs provided?
 *   blankEcrfs         "yes" | "no"   were blank eCRFs provided?
 *   uatTries           number of acceptance-testing rounds needed to pass
 *   versions           number of versions before approval
 *   sourceAdjustments  number of source adjustments
 *   notes
 */
window.ESOURCE_SEED = {
  people: ["KB", "Karina", "Rachel", "Coreforma"],

  targets: {
    maxVersions: 4,          // versions before approval should be under this
    maxNoEcrfBuilds: 5,      // builds without blank eCRFs should be under this
    atRiskDays: 7            // flag open builds due within this many days
  },

  // Study list from End_of_Year_Goals_2026_Source.xlsx. Build dates are blank
  // until the team fills them in.
  builds: [
    { id: "s01", location: "JCCT", study: "CD388.SQ.3.06/MK-1406-005", area: "Vaccine", totalVisits: 9, assignedTo: "KB", notes: "Plus ARI visits" },
    { id: "s02", location: "Bellaire", study: "AMGEN 224", area: "Therapeutic", totalVisits: 18, assignedTo: "KB" },
    { id: "s03", location: "Rothway", study: "ION775-CS2", area: "Therapeutic", totalVisits: 12, assignedTo: "Karina" },
    { id: "s04", location: "Bellaire & Rothway", study: "M25-998", area: "Therapeutic", totalVisits: 15 },
    { id: "s05", location: "Rothway", study: "1404-0115-USA018", area: "Therapeutic", totalVisits: 20 },
    { id: "s06", location: "Rothway", study: "D7261C00006", area: "Therapeutic", totalVisits: 15, notes: "Includes WOCBP PC visits and EDV" },
    { id: "s07", location: "Rothway", study: "D7961C00001", area: "Therapeutic" },
    { id: "s08", location: "JCCT", study: "ARGX-113-25-GRD-3002", area: "Therapeutic" },
    { id: "s09", location: "Rothway", study: "ARGX-113-25-GRD-3002", area: "Therapeutic" },
    { id: "s10", location: "Rothway", study: "NN9388-8593", area: "Therapeutic" },
    { id: "s11", location: "Rothway", study: "NN9490-8665", area: "Therapeutic", totalVisits: 17 },
    { id: "s12", location: "CRC", study: "TAK-079-3001", area: "Therapeutic" },
    { id: "s13", location: "CRC", study: "D7261C00004", area: "Therapeutic" },
    { id: "s14", location: "CRC", study: "NN9490-8665", area: "Therapeutic" },
    { id: "s15", location: "CRC", study: "D8750C00012", area: "Therapeutic" },
    { id: "s16", location: "CRC", study: "NN9490-8266", area: "Therapeutic" },
    { id: "s17", location: "CRC", study: "Revive REN-012", area: "Therapeutic" },
    { id: "s18", location: "JCCT", study: "GC2301", area: "Therapeutic" },
    { id: "s19", location: "JCCT", study: "2307CLI EPIC", area: "Therapeutic" },
    { id: "s20", location: "Bellaire & Rothway", study: "AMGEN 182", area: "Therapeutic" },
    { id: "s21", location: "Bellaire & Rothway", study: "AMGEN 197", area: "Therapeutic" },
    { id: "s22", location: "Bellaire & Rothway", study: "GSBR-1290-15", area: "Therapeutic", assignedTo: "Karina" },
    { id: "s23", location: "Bellaire & Rothway", study: "GSBR-1290-12", area: "Therapeutic", assignedTo: "Karina" },
    { id: "s24", location: "Rothway", study: "NN9838-7910", area: "Therapeutic" },
    { id: "s25", location: "Rothway", study: "C6511002", area: "Therapeutic" },
    { id: "s26", location: "Rothway", study: "JSR-MC-YDAL", area: "Therapeutic", totalVisits: 7, notes: "Includes lead-in visits" },
    { id: "s27", location: "Bellaire", study: "J3R-MC-YDAN", area: "Therapeutic" }
  ],

  // Made-up builds that show how the KPIs work. Load or remove them from the
  // footer ("Load example builds"). They are always labelled EXAMPLE.
  exampleBuilds: [
    { id: "ex1", study: "EXAMPLE-01", location: "JCCT", area: "Therapeutic", buildType: "Standard", totalVisits: 14, assignedTo: "KB", completedBy: "KB", dueDate: "2026-09-25", protocolFinal: "2026-08-03", ccgs: "yes", ccgFinal: "2026-08-10", blankEcrfs: "yes", crfFinal: "2026-08-14", configDate: "2026-08-24", uatStart: "2026-09-08", completionDate: "2026-09-18", uatTries: 1, versions: 2, sourceAdjustments: 0 },
    { id: "ex2", study: "EXAMPLE-02", location: "Rothway", area: "Therapeutic", buildType: "Custom", totalVisits: 22, assignedTo: "Karina", completedBy: "Karina", dueDate: "2026-10-09", protocolFinal: "2026-08-17", ccgs: "no", blankEcrfs: "yes", crfFinal: "2026-08-28", configDate: "2026-09-08", uatStart: "2026-09-29", completionDate: "2026-10-14", uatTries: 3, versions: 5, sourceAdjustments: 2 },
    { id: "ex3", study: "EXAMPLE-03", location: "CRC", area: "Vaccine", buildType: "Standard", totalVisits: 10, assignedTo: "Rachel", completedBy: "KB", dueDate: "2026-10-23", protocolFinal: "2026-09-01", ccgs: "yes", ccgFinal: "2026-09-08", blankEcrfs: "yes", crfFinal: "2026-09-10", configDate: "2026-09-21", uatStart: "2026-10-05", completionDate: "2026-10-16", uatTries: 2, versions: 3, sourceAdjustments: 1 },
    { id: "ex4", study: "EXAMPLE-04", location: "Bellaire", area: "Therapeutic", buildType: "Standard", totalVisits: 16, assignedTo: "KB", dueDate: "2026-10-30", protocolFinal: "2026-09-21", ccgs: "yes", ccgFinal: "2026-09-28", blankEcrfs: "yes", crfFinal: "2026-10-01", configDate: "2026-10-08", uatStart: "2026-10-20" },
    { id: "ex5", study: "EXAMPLE-05", location: "Rothway", area: "Therapeutic", buildType: "Custom", totalVisits: 19, assignedTo: "Karina", dueDate: "2026-11-13", protocolFinal: "2026-10-05", ccgs: "yes", ccgFinal: "2026-10-12", blankEcrfs: "no", crfFinal: "2026-10-14", configDate: "2026-10-19" },
    { id: "ex6", study: "EXAMPLE-06", location: "JCCT", area: "Therapeutic", buildType: "Standard", totalVisits: 8, assignedTo: "Coreforma", dueDate: "2026-10-26", protocolFinal: "2026-10-12" }
  ],

  assignments: [
    { id: "a-admin", label: "Team meetings and admin" },
    { id: "a-train", label: "Training and SOP review" },
    { id: "a-qc", label: "Build QC (general)" }
  ],

  activities: ["Build", "QC", "Acceptance testing", "Training", "Admin"],

  // Example hours for the current week so the timesheet isn't empty.
  demoHours: {
    KB: [
      { ref: "s02", activity: "Build", h: [3, 2, 3, 2, 2] },
      { ref: "s01", activity: "QC", h: [2, 2, 1, 2, 1] },
      { ref: "a-train", activity: "Training", h: [1, 1, 1, 1, 1] },
      { ref: "a-admin", activity: "Admin", h: [1, 1, 1, 1, 2] }
    ],
    Karina: [
      { ref: "s03", activity: "Build", h: [3, 3, 2, 3, 2] },
      { ref: "s22", activity: "QC", h: [2, 2, 3, 2, 2] },
      { ref: "a-admin", activity: "Admin", h: [1, 1, 1, 1, 1] }
    ],
    Rachel: [
      { ref: "s01", activity: "Training", h: [3, 3, 3, 3, 3] },
      { ref: "a-train", activity: "Training", h: [2, 2, 2, 2, 2] }
    ]
  }
};
