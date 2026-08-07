/*
  DrillDeck final live integration test.
  Run while the backend and frontend are available.
  It creates temporary records, verifies the assessed workflow,
  then removes every temporary record.
*/
const API = process.env.DRILLDECK_API || "http://localhost:5000/api";
const FRONTEND = process.env.DRILLDECK_FRONTEND || "http://localhost:5173";

async function request(path, { token, method = "GET", body, expected } = {}) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const data = await response.json().catch(() => ({}));
  if (expected !== undefined && response.status !== expected) {
    throw new Error(`${method} ${path}: expected ${expected}, received ${response.status} (${data.message || "no message"})`);
  }
  if (expected === undefined && !response.ok) {
    throw new Error(`${method} ${path}: ${response.status} ${data.message || "request failed"}`);
  }
  return data;
}

function qaStep(number, suffix = "original") {
  return {
    situation: `Temporary quality-check situation ${number} (${suffix}).`,
    question: `Which option should be selected for quality-check decision ${number} (${suffix})?`,
    choices: [
      { text: `Gather the facts and follow the approved process ${number}.`, score: 10, feedback: "This is the strongest controlled response." },
      { text: `Act immediately without checking the situation ${number}.`, score: 2, feedback: "This creates avoidable risk." },
      { text: `Ignore the issue and continue as normal ${number}.`, score: 0, feedback: "The issue still requires action." },
      { text: `Pass responsibility to an unrelated person ${number}.`, score: 4, feedback: "Escalation must go to the correct role." },
      { text: `Record the issue but take no further action ${number}.`, score: 5, feedback: "Recording helps, but controlled action is also needed." },
    ],
  };
}

async function main() {
  const stamp = Date.now();
  const originalEmail = `drilldeck.qa.${stamp}@example.com`;
  const updatedEmail = `drilldeck.qa.updated.${stamp}@example.com`;
  const originalPassword = "Quality123!";
  const updatedPassword = "Quality456!";
  let adminToken;
  let testUserId;
  let testScenarioId;
  let originalQuestion;
  let originalSelectedText;

  console.log("\nDrillDeck final live check\n==========================");

  try {
    const health = await request("/health");
    if (health.status !== "ok" || health.database !== "SQLite" || health.version !== "5.0.0") {
      throw new Error("Health route did not confirm the expected DrillDeck 5.0.0 API and SQLite database");
    }
    console.log("PASS  Backend health route and live SQLite query");

    const frontendResponse = await fetch(FRONTEND);
    const frontendHtml = await frontendResponse.text();
    if (!frontendResponse.ok || !frontendHtml.includes('id="root"') || !frontendHtml.includes('name="drilldeck-version" content="5.0.0"')) {
      throw new Error("Vite frontend did not return the DrillDeck application shell");
    }
    for (const asset of ["/brand/drilldeck-logo.svg", "/brand/favicon.svg", "/scenarios/system-failure.svg"]) {
      const assetResponse = await fetch(`${FRONTEND}${asset}`);
      if (!assetResponse.ok) throw new Error(`Frontend asset is unavailable: ${asset}`);
    }
    console.log("PASS  Frontend server, application shell and visual assets");

    const admin = await request("/auth/login", {
      method: "POST",
      body: { email: "admin@drilldeck.local", password: "Admin123!" },
    });
    adminToken = admin.token;
    if (admin.user.role !== "admin") throw new Error("Administrator account did not return the admin role");
    console.log("PASS  Administrator authentication and role");

    const registration = await request("/auth/register", {
      method: "POST",
      body: { name: "Temporary QA Trainee", email: originalEmail, password: originalPassword },
      expected: 201,
    });
    let traineeToken = registration.token;
    testUserId = registration.user.id;
    const baselineSummary = await request("/scenarios/summary", { token: traineeToken });
    console.log("PASS  Trainee registration and secure login session");

    await request("/admin/trainees", { token: traineeToken, expected: 403 });
    await request("/attempts", {
      token: adminToken,
      method: "POST",
      body: { scenarioId: 1, answers: [] },
      expected: 403,
    });
    console.log("PASS  Backend role restrictions for trainee and administrator routes");

    const qaScenario = {
      title: `QA Temporary Scenario ${stamp}`,
      category: "Quality Assurance",
      difficulty: "Medium",
      description: "A temporary published scenario used to test administrator access, trainee scoring and SQL history.",
      imageKey: "system-failure",
      durationMinutes: 5,
      learningOutcome: "Confirm that administrator content management and trainee persistence work end to end.",
      skillFocus: "Testing, Administration, Data integrity",
      isPublished: true,
      steps: [qaStep(1), qaStep(2), qaStep(3)],
    };

    const created = await request("/scenarios", {
      token: adminToken,
      method: "POST",
      body: qaScenario,
      expected: 201,
    });
    testScenarioId = created.id;
    const loadedQa = await request(`/scenarios/${testScenarioId}`, { token: adminToken });
    if (loadedQa.steps.length !== 3 || loadedQa.steps.some((step) => step.choices.length !== 5)) {
      throw new Error("Administrator-created steps or fifth options were not returned correctly");
    }
    if (loadedQa.steps.some((step) => step.choices.some((choice) => typeof choice.score !== "number" || !choice.feedback))) {
      throw new Error("Administrator did not receive editable scores and feedback");
    }
    console.log("PASS  Admin creates, publishes and fully reads a scenario with added options");

    const summary = await request("/scenarios/summary", { token: traineeToken });
    if (
      summary.scenarioCount !== baselineSummary.scenarioCount + 1 ||
      summary.decisionCount !== baselineSummary.decisionCount + 3 ||
      !summary.categories.includes("Quality Assurance")
    ) {
      throw new Error(`Dynamic library summary is incomplete: ${JSON.stringify(summary)}`);
    }
    console.log("PASS  Dynamic scenario counts, decision totals and categories");

    const scenarios = await request("/scenarios", { token: traineeToken });
    const listedQa = scenarios.find((scenario) => scenario.id === testScenarioId);
    if (!listedQa) throw new Error("Published administrator scenario was not visible to the trainee");

    const scenario = await request(`/scenarios/${testScenarioId}`, { token: traineeToken });
    if (!scenario.steps.length || scenario.steps.some((step) => step.choices.length !== 5)) {
      throw new Error("Published scenario is missing steps or added options");
    }
    if (scenario.steps.some((step) => step.choices.some((choice) => "score" in choice || "feedback" in choice))) {
      throw new Error("Trainee scenario payload exposes the hidden answer key");
    }
    console.log("PASS  Trainee receives complete content without hidden scores or feedback");

    const answers = [];
    for (const step of scenario.steps) {
      const choice = step.choices[0];
      const feedback = await request(`/scenarios/${scenario.id}/feedback`, {
        token: traineeToken,
        method: "POST",
        body: { stepId: step.id, choiceId: choice.id },
      });
      if (typeof feedback.score !== "number" || typeof feedback.maxScore !== "number" || !feedback.feedback) {
        throw new Error(`Feedback missing for step ${step.orderNumber}`);
      }
      answers.push({ stepId: step.id, choiceId: choice.id });
    }
    originalQuestion = scenario.steps[0].question;
    originalSelectedText = scenario.steps[0].choices[0].text;
    console.log("PASS  Immediate feedback is validated and returned by the backend");

    const duplicateAnswerPayload = answers.map((answer) => ({ ...answer }));
    duplicateAnswerPayload[1] = { ...duplicateAnswerPayload[0] };
    await request("/attempts", {
      token: traineeToken,
      method: "POST",
      body: { scenarioId: scenario.id, answers: duplicateAnswerPayload },
      expected: 400,
    });
    console.log("PASS  Invalid duplicate step submissions are rejected");

    const submitted = await request("/attempts", {
      token: traineeToken,
      method: "POST",
      body: { scenarioId: scenario.id, answers },
      expected: 201,
    });
    if (!submitted.id || submitted.review.length !== scenario.steps.length || submitted.xpEarned <= 0) {
      throw new Error("Attempt was not saved with complete score, XP and review data");
    }
    console.log("PASS  Trainee score, attempt and answer snapshots saved in SQL");

    const traineeDashboard = await request("/dashboard/trainee", { token: traineeToken });
    if (
      traineeDashboard.totalAttempts < 1 ||
      traineeDashboard.xp < submitted.xpEarned ||
      !traineeDashboard.recentAttempts.some((attempt) => attempt.id === submitted.id)
    ) {
      throw new Error("Trainee dashboard did not include the saved attempt and XP");
    }
    const adminDashboard = await request("/dashboard/admin", { token: adminToken });
    if (!adminDashboard.recentAttempts.some((attempt) => attempt.id === submitted.id)) {
      throw new Error("Administrator dashboard did not include the new trainee attempt");
    }
    console.log("PASS  Trainee and administrator dashboards use the saved SQL attempt");

    await request(`/admin/trainees/${testUserId}`, {
      token: adminToken,
      method: "PUT",
      body: { name: "Updated QA Trainee", email: updatedEmail, password: updatedPassword },
    });
    await request("/auth/login", {
      method: "POST",
      body: { email: originalEmail, password: originalPassword },
      expected: 401,
    });
    const signedInAgain = await request("/auth/login", {
      method: "POST",
      body: { email: updatedEmail, password: updatedPassword },
    });
    traineeToken = signedInAgain.token;
    if (signedInAgain.user.name !== "Updated QA Trainee") throw new Error("Administrator account edit did not persist");
    console.log("PASS  Admin edits trainee details and resets password atomically");

    const editedScenario = {
      ...qaScenario,
      title: `${qaScenario.title} Updated`,
      category: "Edited Quality",
      difficulty: "Hard",
      description: "Updated after a saved trainee attempt to verify historical snapshots.",
      isPublished: false,
      steps: [qaStep(1, "edited"), qaStep(2, "edited"), qaStep(3, "edited")],
    };
    await request(`/scenarios/${testScenarioId}`, {
      token: adminToken,
      method: "PUT",
      body: editedScenario,
    });
    const adminEdited = await request(`/scenarios/${testScenarioId}`, { token: adminToken });
    if (adminEdited.isPublished || adminEdited.title !== editedScenario.title || adminEdited.difficulty !== "Hard" || !adminEdited.steps[0].question.includes("edited")) {
      throw new Error("Administrator scenario edit or unpublish action did not persist");
    }
    const traineeScenariosAfterUnpublish = await request("/scenarios", { token: traineeToken });
    if (traineeScenariosAfterUnpublish.some((item) => item.id === testScenarioId)) {
      throw new Error("Unpublished scenario remained visible to the trainee");
    }
    console.log("PASS  Admin edits all scenario content and controls publication");

    const history = await request("/attempts/my", { token: traineeToken });
    const savedHistory = history.find((attempt) => attempt.id === submitted.id);
    if (!savedHistory) {
      throw new Error("Attempt did not remain available after logout/login and scenario editing");
    }
    if (
      savedHistory.scenario.title !== qaScenario.title ||
      savedHistory.scenario.category !== qaScenario.category ||
      savedHistory.scenario.difficulty !== qaScenario.difficulty
    ) {
      throw new Error("Attempt summary no longer shows the historical scenario details");
    }
    const traineeDetail = await request(`/attempts/${submitted.id}`, { token: traineeToken });
    if (traineeDetail.answers.length !== scenario.steps.length) {
      throw new Error("Saved trainee answers were incomplete after a new login");
    }
    if (traineeDetail.answers[0].question !== originalQuestion || traineeDetail.answers[0].selectedText !== originalSelectedText) {
      throw new Error("Historical answer snapshots changed after the scenario was edited");
    }
    if (
      traineeDetail.scenario.title !== qaScenario.title ||
      traineeDetail.scenario.category !== qaScenario.category ||
      traineeDetail.scenario.difficulty !== qaScenario.difficulty
    ) {
      throw new Error("Historical scenario title, category or difficulty changed after the administrator edit");
    }
    console.log("PASS  Progress and exact answers persist after logout, login and later content edits");

    const traineeRecords = await request("/admin/trainees", { token: adminToken });
    if (!traineeRecords.some((user) => user.id === testUserId && user.totalAttempts === 1 && user.email === updatedEmail)) {
      throw new Error("Administrator trainee records did not include the updated account and saved attempt");
    }
    const allAttempts = await request(`/attempts/all?userId=${testUserId}`, { token: adminToken });
    if (!allAttempts.some((attempt) => attempt.id === submitted.id)) {
      throw new Error("Administrator could not see the trainee attempt");
    }
    const adminDetail = await request(`/attempts/${submitted.id}`, { token: adminToken });
    if (
      adminDetail.answers.length !== scenario.steps.length ||
      adminDetail.answers.some((answer) => !answer.question || !answer.selectedText || !answer.feedback)
    ) {
      throw new Error("Administrator answer detail is incomplete");
    }
    console.log("PASS  Admin sees trainee progress and every saved answer in detail");

    await request(`/scenarios/${testScenarioId}`, {
      token: adminToken,
      method: "DELETE",
      expected: 409,
    });
    console.log("PASS  Scenario history is protected from accidental deletion");

    await request(`/admin/trainees/${testUserId}`, {
      token: adminToken,
      method: "DELETE",
    });
    testUserId = null;
    await request(`/scenarios/${testScenarioId}`, {
      token: adminToken,
      method: "DELETE",
    });
    testScenarioId = null;
    console.log("PASS  Admin account management and complete temporary-data cleanup");

    console.log("\nALL LIVE CHECKS PASSED — DrillDeck is ready for demonstration.\n");
  } catch (error) {
    console.error(`\nFAIL  ${error.message}\n`);
    process.exitCode = 1;
  } finally {
    if (adminToken && testUserId) {
      await request(`/admin/trainees/${testUserId}`, { token: adminToken, method: "DELETE" }).catch(() => {});
      testUserId = null;
    }
    if (adminToken && testScenarioId) {
      await request(`/scenarios/${testScenarioId}`, { token: adminToken, method: "DELETE" }).catch(() => {});
      testScenarioId = null;
    }
  }
}

main();
