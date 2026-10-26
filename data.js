/*
 * Seed data for the eSource Build Tracker.
 * Source: End_of_Year_Goals_2026_Source.xlsx ("Active Studies - QC to EOS")
 *         eSource_Clinical_Study_Build_Metrics_Dashboard.xlsx (KPI tabs)
 * Edit this file to change the starting data. Changes people make in the app
 * are saved in their own browser (localStorage) and can be exported as JSON.
 */
window.ESOURCE_SEED = {
  people: ["KB", "Karina", "Rachel"],

  goal: {
    label: "Active studies QC'd to EOS",
    target: 26,
    due: "2026-12-31",
    plan: "2–3 a week"
  },

  studies: [
    { id: "s01", location: "JCCT", study: "CD388.SQ.3.06/MK-1406-005", area: "Vaccine", period: "Randomization", totalVisits: "9 (plus ARI visits)", qcStartVisit: "Day 15", qcVisits: 6, qcStart: "2026-10-20", owner: "KB", support: "Rachel (training)" },
    { id: "s02", location: "Bellaire", study: "AMGEN 224", area: "Therapeutic", period: "Maintenance", totalVisits: "18", qcStartVisit: "Visit 7", qcVisits: 14, qcStart: "2026-10-21", owner: "KB" },
    { id: "s03", location: "Rothway", study: "ION775-CS2", area: "Therapeutic", period: "Maintenance", totalVisits: "12", qcStartVisit: "Week 24 / Day 169", qcVisits: 7, qcStart: "2026-10-23", owner: "Karina" },
    { id: "s04", location: "Bellaire & Rothway", study: "M25-998", area: "Therapeutic", period: "Randomization", totalVisits: "15" },
    { id: "s05", location: "Rothway", study: "1404-0115-USA018", area: "Therapeutic", period: "Randomization", totalVisits: "20" },
    { id: "s06", location: "Rothway", study: "D7261C00006", area: "Therapeutic", period: "Randomization", totalVisits: "15 (incl. WOCBP PC visits and EDV)" },
    { id: "s07", location: "Rothway", study: "D7961C00001", area: "Therapeutic", period: "Randomization" },
    { id: "s08", location: "JCCT", study: "ARGX-113-25-GRD-3002", area: "Therapeutic", period: "Maintenance" },
    { id: "s09", location: "Rothway", study: "ARGX-113-25-GRD-3002", area: "Therapeutic", period: "Randomization" },
    { id: "s10", location: "Rothway", study: "NN9388-8593", area: "Therapeutic", period: "Randomization" },
    { id: "s11", location: "Rothway", study: "NN9490-8665", area: "Therapeutic", period: "Randomization", totalVisits: "17" },
    { id: "s12", location: "CRC", study: "TAK-079-3001", area: "Therapeutic", period: "Randomization" },
    { id: "s13", location: "CRC", study: "D7261C00004", area: "Therapeutic", period: "Randomization" },
    { id: "s14", location: "CRC", study: "NN9490-8665", area: "Therapeutic", period: "Randomization" },
    { id: "s15", location: "CRC", study: "D8750C00012", area: "Therapeutic", period: "Randomization" },
    { id: "s16", location: "CRC", study: "NN9490-8266", area: "Therapeutic", period: "Randomization" },
    { id: "s17", location: "CRC", study: "Revive REN-012", area: "Therapeutic", period: "Randomization" },
    { id: "s18", location: "JCCT", study: "GC2301", area: "Therapeutic", period: "Randomization" },
    { id: "s19", location: "JCCT", study: "2307CLI EPIC", area: "Therapeutic", period: "Randomization" },
    { id: "s20", location: "Bellaire & Rothway", study: "AMGEN 182", area: "Therapeutic", period: "Maintenance" },
    { id: "s21", location: "Bellaire & Rothway", study: "AMGEN 197", area: "Therapeutic", period: "Maintenance" },
    { id: "s22", location: "Bellaire & Rothway", study: "GSBR-1290-15", area: "Therapeutic", period: "Maintenance", owner: "Karina" },
    { id: "s23", location: "Bellaire & Rothway", study: "GSBR-1290-12", area: "Therapeutic", period: "Maintenance", owner: "Karina" },
    { id: "s24", location: "Rothway", study: "NN9838-7910", area: "Therapeutic", period: "Maintenance" },
    { id: "s25", location: "Rothway", study: "C6511002", area: "Therapeutic", period: "Maintenance" },
    { id: "s26", location: "Rothway", study: "JSR-MC-YDAL", area: "Therapeutic", period: "Maintenance", totalVisits: "7 (including lead-in visits)" },
    { id: "s27", location: "Bellaire", study: "J3R-MC-YDAN", area: "Therapeutic", period: "Maintenance" }
  ],

  // Non-study assignments people can log time against.
  assignments: [
    { id: "a-admin", label: "Team meetings and admin" },
    { id: "a-train", label: "Training and SOP review" },
    { id: "a-build", label: "New study build (general)" }
  ],

  activities: ["QC to EOS", "Build", "UAT", "Training", "Admin"],

  kpis: [
    { cat: "Speed", name: "Cycle time: protocol to build start", target: "", src: "Protocol received and build start dates" },
    { cat: "Speed", name: "Cycle time: CCGs to build start", target: "", src: "CCGs received and build start dates" },
    { cat: "Speed", name: "Build cycle time", target: "", src: "Configuration start and first full draft dates" },
    { cat: "Speed", name: "Time in UAT", target: "", src: "UAT start and sign-off dates" },
    { cat: "Speed", name: "Time to publish (total lead time)", target: "", src: "Protocol, CCG and eCRF received dates; publish date" },
    { cat: "Process", name: "Versions before approved for production", target: "< 4", src: "Version count per build" },
    { cat: "Process", name: "Template / library utilization", target: "", src: "Built from template flag" },
    { cat: "Process", name: "Throughput per builder (internal)", target: "100% by due date", src: "Owner, due date and publish date" },
    { cat: "Quality", name: "Studies built without blank eCRFs", target: "< 5 studies", src: "eCRFs received flag" },
    { cat: "Quality", name: "Studies built without CCGs", target: "", src: "CCGs received flag" },
    { cat: "Quality", name: "First pass yield (UAT)", target: "", src: "Passed UAT first time flag" },
    { cat: "Quality", name: "Post-production changes", target: "", src: "Changes after publish flag" }
  ],

  // Example hours loaded into the current week so the demo isn't empty.
  // Use "Clear demo hours" in the app (or set this to {}) to start blank.
  demoHours: {
    KB: [
      { ref: "s02", activity: "QC to EOS", h: [3, 2, 3, 2, 2] },
      { ref: "s01", activity: "QC to EOS", h: [2, 2, 1, 2, 1] },
      { ref: "a-train", activity: "Training", h: [1, 1, 1, 1, 1] },
      { ref: "a-admin", activity: "Admin", h: [1, 1, 1, 1, 2] }
    ],
    Karina: [
      { ref: "s03", activity: "QC to EOS", h: [3, 3, 2, 3, 2] },
      { ref: "s22", activity: "QC to EOS", h: [2, 2, 3, 2, 2] },
      { ref: "s23", activity: "QC to EOS", h: [1, 2, 2, 1, 2] },
      { ref: "a-admin", activity: "Admin", h: [1, 1, 1, 1, 1] }
    ],
    Rachel: [
      { ref: "s01", activity: "Training", h: [3, 3, 3, 3, 3] },
      { ref: "a-train", activity: "Training", h: [2, 2, 2, 2, 2] }
    ]
  }
};
