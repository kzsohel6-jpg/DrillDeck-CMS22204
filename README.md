# DrillDeck — Submission-Ready Edition (v5.0.0)

DrillDeck is a complete full-stack decision-training platform built with React, Vite, Node.js, Express, Sequelize and SQLite. Trainees complete realistic scenarios, receive backend-controlled coaching, and keep a permanent SQL performance record. Administrators manage scenario content, publication, trainee accounts and detailed saved answers.

## Completed feature set

### Trainee access
- Secure registration and login with JWT authentication
- 12 illustrated seeded scenarios: 4 Easy, 4 Medium and 4 Hard
- 5 decisions per seeded scenario and 4 choices per decision
- Balanced source answer positions: 15 A, 15 B, 15 C and 15 D
- Randomised choice order whenever a scenario opens
- Hidden scores and feedback until a choice is submitted
- Immediate backend-validated feedback
- Server-side final scoring, result level and XP
- SQLite attempt history that remains after logout and application restart
- Saved question, selected option, feedback and scenario-detail snapshots
- Personal dashboard, category analytics, difficulty progress and attempt review
- Search, category filtering, difficulty filtering and sorting

### Administrator access
- Dedicated administrator dashboard and platform analytics
- Create, read, edit, publish, unpublish and delete eligible scenarios
- Change title, category, difficulty, description, duration, artwork, outcomes and skills
- Add or remove 3–12 decision steps
- Add or remove 4–8 answer options per decision
- Edit every option’s text, score and feedback
- View registered trainees and summary statistics
- View every saved attempt and every selected answer
- Edit trainee names/emails, reset passwords and delete trainee accounts
- Protect scenarios with recorded history from accidental deletion
- Preserve administrator edits after server restart

## Run on Windows

1. Extract the ZIP completely into a normal folder.
2. Open `DrillDeck-SQL-Submission-Ready`.
3. Double-click `start-drilldeck.bat`.
4. Allow the first npm installation to finish; internet is required only for that first installation.
5. Keep the **DrillDeck API** and **DrillDeck Client** windows open.
6. The application opens at `http://localhost:5173`.

The launcher checks Node.js, installs or repairs dependencies, verifies the source, detects port conflicts, starts both services and waits until the correct v5.0.0 frontend and API are ready.

## Final automated live check

After DrillDeck is running, double-click:

```text
run-final-check.bat
```

It performs a production frontend build and a temporary end-to-end test covering:
- live SQLite health;
- frontend and visual assets;
- admin and trainee authentication;
- backend role restrictions;
- admin scenario creation, extra options, editing and publication control;
- dynamic library totals;
- hidden answer keys;
- backend feedback and score calculation;
- SQL attempt, answer and scenario snapshots;
- trainee and administrator dashboards;
- logout/login persistence;
- administrator trainee editing and password reset;
- administrator access to every saved answer;
- protected history and temporary-data cleanup.

A successful run ends with:

```text
ALL LIVE CHECKS PASSED — DrillDeck is ready for demonstration.
```

## Assessment accounts

**Administrator**  
Email: `admin@drilldeck.local`  
Password: `Admin123!`

**Trainee**  
Email: `trainee@drilldeck.local`  
Password: `Trainee123!`

New trainee accounts can also be created through the registration page.

## Manual VS Code commands

```powershell
npm.cmd run setup
npm.cmd run dev
```

Frontend: `http://localhost:5173`  
Backend health: `http://localhost:5000/api/health`

Static verification:

```powershell
npm.cmd run verify
```

Live integration verification while the app is running:

```powershell
npm.cmd run smoke
```

## Data persistence

SQLite data is stored at:

```text
server/database/drilldeck-final.sqlite
```

Signing out removes only the browser session. It does not delete users, scenarios, attempts or answers. Each completed attempt stores snapshots of the question, selected answer, feedback, scenario title, category and difficulty, so historical evidence remains accurate even after an administrator later edits the scenario. Seed data is added only when the scenario table is empty, so administrator changes are not reset during restart.

Use `backup-database.bat` to make a timestamped local backup after you have created presentation evidence.

## Main source locations

```text
client/src/pages/ScenarioManagerPage.jsx    Administrator scenario editor
client/src/pages/AdminTraineesPage.jsx       Administrator trainee and answer records
client/src/pages/ScenarioPlayerPage.jsx      Trainee decision workflow
client/src/pages/HistoryPage.jsx             Persistent trainee history
server/src/controllers/scenarioController.js Scenario CRUD, validation and feedback
server/src/controllers/attemptController.js  Server scoring and history snapshots
server/src/controllers/adminController.js    Trainee account management
server/src/controllers/dashboardController.js Analytics and progress calculations
server/src/models/                           Sequelize relational models
server/src/utils/seedScenarios.json          Initial 12-scenario library
scripts/live-smoke-test.js                   End-to-end live verification
```


