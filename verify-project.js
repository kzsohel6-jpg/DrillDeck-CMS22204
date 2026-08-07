const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.join(__dirname, "..");
const seedFile = path.join(root, "server", "src", "utils", "seedScenarios.json");
const seed = JSON.parse(fs.readFileSync(seedFile, "utf8"));
const requiredFiles = [
  "client/src/App.jsx",
  "client/src/pages/LoginPage.jsx",
  "client/src/pages/ScenarioListPage.jsx",
  "client/src/pages/ScenarioPlayerPage.jsx",
  "client/src/pages/ScenarioManagerPage.jsx",
  "client/src/pages/AdminTraineesPage.jsx",
  "client/public/brand/drilldeck-logo.svg",
  "client/public/brand/drilldeck-symbol.svg",
  "client/public/brand/favicon.svg",
  "server/src/server.js",
  "server/src/controllers/attemptController.js",
  "server/src/controllers/adminController.js",
  "server/src/controllers/scenarioController.js",
  "server/src/controllers/dashboardController.js",
  "server/src/utils/ensureSchema.js",
  "server/src/utils/seedScenarios.json",
  "scripts/live-smoke-test.js",
  "run-final-check.bat",
  "README.md",
  "PROJECT_REPORT_DRAFT.md",
  "PRESENTATION_GUIDE.md",
];

const failures = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing file: ${file}`);
}


const rootPackage = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const rootLock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
const serverPackage = JSON.parse(fs.readFileSync(path.join(root, "server", "package.json"), "utf8"));
const clientPackage = JSON.parse(fs.readFileSync(path.join(root, "client", "package.json"), "utf8"));
for (const [label, version] of [
  ["root package", rootPackage.version],
  ["root lock", rootLock.version],
  ["server package", serverPackage.version],
  ["client package", clientPackage.version],
]) {
  if (version !== "5.0.0") failures.push(`${label}: expected version 5.0.0, found ${version}`);
}

function walk(directory, extension) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(fullPath, extension));
    else if (entry.name.endsWith(extension)) files.push(fullPath);
  }
  return files;
}

for (const file of walk(path.join(root, "server"), ".js").concat(walk(path.join(root, "scripts"), ".js"))) {
  try {
    execFileSync(process.execPath, ["--check", file], { stdio: "pipe" });
  } catch (error) {
    failures.push(`Server/script syntax failed: ${path.relative(root, file)} (${String(error.stderr || error.message).trim()})`);
  }
}

if (seed.length !== 12) failures.push(`Expected 12 seeded scenarios, found ${seed.length}`);
const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
const correctPositions = [0, 0, 0, 0];
const scenarioTitles = new Set();
let totalSteps = 0;
let totalChoices = 0;

for (const scenario of seed) {
  if (scenarioTitles.has(scenario.title.toLowerCase())) failures.push(`Duplicate scenario title: ${scenario.title}`);
  scenarioTitles.add(scenario.title.toLowerCase());
  difficultyCounts[scenario.difficulty] = (difficultyCounts[scenario.difficulty] || 0) + 1;
  if (scenario.steps.length !== 5) failures.push(`${scenario.title}: expected 5 seeded decisions`);
  const imagePath = path.join(root, "client", "public", "scenarios", `${scenario.imageKey}.svg`);
  if (!fs.existsSync(imagePath)) failures.push(`${scenario.title}: missing artwork ${scenario.imageKey}.svg`);

  const questions = new Set();
  for (const [stepIndex, step] of scenario.steps.entries()) {
    totalSteps += 1;
    totalChoices += step.choices.length;
    const questionKey = String(step.question || "").trim().toLowerCase();
    if (!questionKey) failures.push(`${scenario.title}, step ${stepIndex + 1}: missing question`);
    if (questions.has(questionKey)) failures.push(`${scenario.title}: duplicate question at step ${stepIndex + 1}`);
    questions.add(questionKey);
    if (!step.situation) failures.push(`${scenario.title}, step ${stepIndex + 1}: missing situation`);
    if (step.choices.length !== 4) failures.push(`${scenario.title}, step ${stepIndex + 1}: expected 4 seeded choices`);

    const choiceTexts = new Set();
    const scores = step.choices.map((choice) => Number(choice.score));
    const max = Math.max(...scores);
    if (scores.filter((score) => score === max).length !== 1) {
      failures.push(`${scenario.title}, step ${stepIndex + 1}: highest score is not unique`);
    } else {
      correctPositions[scores.indexOf(max)] += 1;
    }
    for (const choice of step.choices) {
      const choiceKey = String(choice.text || "").trim().toLowerCase();
      if (!choice.text || !choice.feedback) failures.push(`${scenario.title}, step ${stepIndex + 1}: incomplete choice`);
      if (choiceTexts.has(choiceKey)) failures.push(`${scenario.title}, step ${stepIndex + 1}: duplicate choice text`);
      choiceTexts.add(choiceKey);
      if (!Number.isInteger(choice.score) || choice.score < 0 || choice.score > 10) {
        failures.push(`${scenario.title}, step ${stepIndex + 1}: score outside 0-10`);
      }
    }
  }
}

for (const difficulty of ["Easy", "Medium", "Hard"]) {
  if (difficultyCounts[difficulty] !== 4) failures.push(`Expected 4 ${difficulty} scenarios, found ${difficultyCounts[difficulty]}`);
}

if (correctPositions.some((count) => count !== 15)) {
  failures.push(`Highest-scoring positions must be 15,15,15,15; found ${correctPositions.join(",")}`);
}

for (const file of walk(path.join(root, "client", "public"), ".svg")) {
  const content = fs.readFileSync(file, "utf8");
  if (!/<svg\b/i.test(content) || !/<\/svg>/i.test(content)) {
    failures.push(`Invalid SVG wrapper: ${path.relative(root, file)}`);
  }
}

function requireText(file, snippets) {
  const content = fs.readFileSync(path.join(root, file), "utf8");
  for (const snippet of snippets) {
    if (!content.includes(snippet)) failures.push(`${file}: missing expected implementation '${snippet}'`);
  }
}

requireText("server/src/controllers/attemptController.js", [
  "questionText",
  "selectedText",
  "feedbackText",
  "getAttemptDetail",
  "scenarioTitle",
  "difficultySnapshot",
  "xpEarned",
  "Each decision step must be answered exactly once",
]);
requireText("server/src/controllers/scenarioController.js", [
  "scenarioSummary",
  "user.role === \"admin\"",
  "Step ${index + 1} must have one clear highest-scoring choice",
  "AttemptAnswer.update",
  "choiceId: null",
  "stepId: null",
]);
requireText("server/src/controllers/adminController.js", [
  "listTrainees",
  "updateTrainee",
  "resetTraineePassword",
  "deleteTrainee",
  "password ?",
]);
requireText("server/src/utils/seed.js", ["if (await Scenario.count() > 0) return"]);
requireText("server/src/controllers/dashboardController.js", ["completedPublishedIds", "publishedScenarioIds"]);
requireText("server/src/server.js", ["SELECT 1 AS databaseCheck", "X-Content-Type-Options", "version: \"5.0.0\""]);
requireText("client/src/pages/ScenarioManagerPage.jsx", [
  "addChoice",
  "Maximum 8 choices",
  "Maximum 12 decisions",
]);
requireText("client/src/pages/AdminTraineesPage.jsx", ["Saved SQL attempt", "View details"]);
requireText("client/src/pages/ScenarioPlayerPage.jsx", ["/feedback", "Saving result"]);
requireText("client/src/pages/ScenarioListPage.jsx", ["/scenarios/summary", "published scenarios"]);
requireText("client/vite.config.js", ["strictPort: true"]);
requireText("scripts/live-smoke-test.js", [
  "Historical answer snapshots changed",
  "Historical scenario title, category or difficulty changed",
  "Admin edits trainee details and resets password atomically",
  "Trainee and administrator dashboards use the saved SQL attempt",
  "ALL LIVE CHECKS PASSED",
]);

if (failures.length) {
  console.error("DrillDeck verification failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("DrillDeck static verification passed.");
console.log(`Scenarios: ${seed.length}`);
console.log(`Decisions: ${totalSteps}`);
console.log(`Choices: ${totalChoices}`);
console.log(`Difficulty balance: ${JSON.stringify(difficultyCounts)}`);
console.log(`Highest-scoring positions A-D: ${correctPositions.join(", ")}`);
console.log("Server syntax, assets, admin CRUD, dynamic summary, history snapshots, version alignment and live test coverage are present.");
