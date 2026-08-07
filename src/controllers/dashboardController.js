const { literal } = require("sequelize");
const { User, Scenario, Attempt } = require("../models");

function average(values) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length).toFixed(1));
}

function attemptDifficulty(attempt) {
  return attempt.difficultySnapshot || attempt.scenario?.difficulty || "Medium";
}

function attemptCategory(attempt) {
  return attempt.categorySnapshot || attempt.scenario?.category || "Training";
}

function attemptTitle(attempt) {
  return attempt.scenarioTitle || attempt.scenario?.title || "Historical scenario";
}

function presentRecentAttempt(attempt, includeUser = false) {
  const data = attempt.toJSON();
  return {
    ...data,
    scenario: {
      ...(data.scenario || {}),
      title: data.scenarioTitle || data.scenario?.title || "Historical scenario",
      category: data.categorySnapshot || data.scenario?.category || "Training",
      difficulty: data.difficultySnapshot || data.scenario?.difficulty || "Medium",
    },
    ...(includeUser ? { user: data.user } : {}),
  };
}

async function traineeDashboard(req, res, next) {
  try {
    const [attempts, publishedScenarios] = await Promise.all([
      Attempt.findAll({
        where: { userId: req.user.id },
        include: [{ model: Scenario, as: "scenario", attributes: ["id", "title", "category", "difficulty", "imageKey", "durationMinutes"] }],
        order: [["completedAt", "DESC"]],
      }),
      Scenario.findAll({
        where: { isPublished: true },
        order: [[literal("CASE difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Hard' THEN 3 END"), "ASC"], ["title", "ASC"]],
      }),
    ]);

    const categoryMap = {};
    const difficultyMap = { Easy: [], Medium: [], Hard: [] };
    const completedIds = new Set();

    for (const attempt of attempts) {
      completedIds.add(attempt.scenarioId);
      const category = attemptCategory(attempt);
      const difficulty = attemptDifficulty(attempt);
      categoryMap[category] = categoryMap[category] || [];
      categoryMap[category].push(attempt.percentage);
      difficultyMap[difficulty] = difficultyMap[difficulty] || [];
      difficultyMap[difficulty].push(attempt.percentage);
    }

    const publishedScenarioIds = new Set(publishedScenarios.map((scenario) => scenario.id));
    const completedPublishedIds = new Set(
      [...completedIds].filter((scenarioId) => publishedScenarioIds.has(scenarioId))
    );
    const recommended = publishedScenarios.find((scenario) => !completedIds.has(scenario.id)) || publishedScenarios[0] || null;
    const xp = attempts.reduce((sum, attempt) => {
      if (Number(attempt.xpEarned) > 0) return sum + Number(attempt.xpEarned);
      const multiplier = attemptDifficulty(attempt) === "Hard" ? 1.8 : attemptDifficulty(attempt) === "Medium" ? 1.4 : 1;
      return sum + Math.round(attempt.totalScore * multiplier);
    }, 0);

    const difficultyProgress = ["Easy", "Medium", "Hard"].map((difficulty) => {
      const modeScenarioIds = new Set(
        publishedScenarios.filter((scenario) => scenario.difficulty === difficulty).map((scenario) => scenario.id)
      );
      const total = modeScenarioIds.size;
      const completed = [...completedIds].filter((id) => modeScenarioIds.has(id)).length;
      return {
        difficulty,
        total,
        completed,
        average: average(difficultyMap[difficulty] || []),
        percentage: total ? Math.round((completed / total) * 100) : 0,
      };
    });

    res.json({
      totalAttempts: attempts.length,
      averageScore: average(attempts.map((item) => item.percentage)),
      bestScore: attempts.length ? Math.max(...attempts.map((item) => item.percentage)) : 0,
      completedScenarios: completedPublishedIds.size,
      totalScenarios: publishedScenarios.length,
      xp,
      level: Math.max(1, Math.floor(xp / 250) + 1),
      categoryPerformance: Object.entries(categoryMap).map(([category, scores]) => ({ category, average: average(scores) })),
      difficultyProgress,
      recentAttempts: attempts.slice(0, 5).map((attempt) => presentRecentAttempt(attempt)),
      recommended: recommended ? {
        id: recommended.id,
        title: recommended.title,
        description: recommended.description,
        difficulty: recommended.difficulty,
        category: recommended.category,
        durationMinutes: recommended.durationMinutes,
        imageUrl: `/scenarios/${recommended.imageKey}.svg`,
      } : null,
    });
  } catch (error) {
    next(error);
  }
}

async function adminDashboard(req, res, next) {
  try {
    const [userCount, scenarios, attempts] = await Promise.all([
      User.count({ where: { role: "trainee" } }),
      Scenario.findAll(),
      Attempt.findAll({
        include: [
          { model: Scenario, as: "scenario", attributes: ["id", "title", "difficulty", "category"] },
          { model: User, as: "user", attributes: ["id", "name"] },
        ],
        order: [["completedAt", "DESC"]],
      }),
    ]);

    const scenarioMap = {};
    for (const attempt of attempts) {
      const key = attemptTitle(attempt);
      scenarioMap[key] = scenarioMap[key] || [];
      scenarioMap[key].push(attempt.percentage);
    }

    const difficultyDistribution = ["Easy", "Medium", "Hard"].map((difficulty) => ({
      difficulty,
      count: scenarios.filter((scenario) => scenario.difficulty === difficulty).length,
    }));

    res.json({
      traineeCount: userCount,
      scenarioCount: scenarios.length,
      publishedCount: scenarios.filter((scenario) => scenario.isPublished).length,
      totalAttempts: attempts.length,
      averageScore: average(attempts.map((item) => item.percentage)),
      difficultyDistribution,
      scenarioPerformance: Object.entries(scenarioMap).map(([scenario, scores]) => ({
        scenario,
        average: average(scores),
        attempts: scores.length,
      })).sort((a, b) => b.attempts - a.attempts).slice(0, 8),
      recentAttempts: attempts.slice(0, 8).map((attempt) => presentRecentAttempt(attempt, true)),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { traineeDashboard, adminDashboard };
