const {
  sequelize,
  Scenario,
  Step,
  Choice,
  Attempt,
  AttemptAnswer,
  User,
} = require("../models");

function resultLevel(percentage) {
  if (percentage >= 90) return "Mastery";
  if (percentage >= 75) return "Strong";
  if (percentage >= 55) return "Developing";
  return "Review Required";
}

function positiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function historicalScenario(data) {
  const current = data.scenario || {};
  return {
    ...current,
    title: data.scenarioTitle || current.title || "Historical scenario",
    category: data.categorySnapshot || current.category || "Training",
    difficulty: data.difficultySnapshot || current.difficulty || "Medium",
  };
}

function presentAttemptSummary(attempt, includeUser = false) {
  const data = attempt.toJSON();
  return {
    ...data,
    scenario: historicalScenario(data),
    ...(includeUser ? { user: data.user } : {}),
  };
}

function presentAttemptDetail(attempt) {
  const data = attempt.toJSON();
  const answers = (data.answers || [])
    .map((answer) => ({
      id: answer.id,
      stepNumber: answer.stepNumber || answer.step?.orderNumber || 0,
      question: answer.questionText || answer.step?.question || "Decision question",
      selectedText: answer.selectedText || answer.choice?.text || "Recorded choice",
      score: answer.score,
      maxScore: answer.maxScore || 10,
      feedback: answer.feedbackText || answer.choice?.feedback || "",
    }))
    .sort((a, b) => a.stepNumber - b.stepNumber);

  return {
    id: data.id,
    totalScore: data.totalScore,
    maxScore: data.maxScore,
    percentage: data.percentage,
    resultLevel: data.resultLevel,
    xpEarned: data.xpEarned,
    completedAt: data.completedAt,
    scenario: historicalScenario(data),
    user: data.user,
    answers,
  };
}

async function submitAttempt(req, res, next) {
  const body = req.body || {};
  const scenarioId = positiveId(body.scenarioId);
  const answers = body.answers;
  if (!scenarioId) return res.status(400).json({ message: "Invalid scenario ID" });
  if (!Array.isArray(answers)) return res.status(400).json({ message: "Answers must be supplied as a list" });

  const transaction = await sequelize.transaction();
  try {
    const scenario = await Scenario.findByPk(scenarioId, {
      include: [{ model: Step, as: "steps", include: [{ model: Choice, as: "choices" }] }],
      order: [[{ model: Step, as: "steps" }, "orderNumber", "ASC"]],
      transaction,
    });

    if (!scenario || !scenario.isPublished) {
      await transaction.rollback();
      return res.status(404).json({ message: "Published scenario not found" });
    }
    if (answers.length !== scenario.steps.length) {
      await transaction.rollback();
      return res.status(400).json({ message: "Submit one answer for every step" });
    }

    const submittedStepIds = answers.map((answer) => positiveId(answer?.stepId));
    if (submittedStepIds.some((id) => !id) || new Set(submittedStepIds).size !== submittedStepIds.length) {
      await transaction.rollback();
      return res.status(400).json({ message: "Each decision step must be answered exactly once" });
    }

    let totalScore = 0;
    let maxScore = 0;
    const answerRows = [];
    const review = [];

    for (const step of scenario.steps) {
      const submitted = answers.find((answer) => Number(answer.stepId) === step.id);
      const choiceId = submitted ? positiveId(submitted.choiceId) : null;
      const choice = choiceId && step.choices.find((item) => item.id === choiceId);
      if (!choice) {
        await transaction.rollback();
        return res.status(400).json({ message: `Invalid answer for step ${step.orderNumber}` });
      }

      const best = Math.max(...step.choices.map((item) => item.score));
      totalScore += choice.score;
      maxScore += best;
      answerRows.push({
        stepId: step.id,
        choiceId: choice.id,
        stepNumber: step.orderNumber,
        questionText: step.question,
        selectedText: choice.text,
        score: choice.score,
        maxScore: best,
        feedbackText: choice.feedback,
      });
      review.push({
        stepNumber: step.orderNumber,
        question: step.question,
        selectedText: choice.text,
        score: choice.score,
        maxScore: best,
        feedback: choice.feedback,
      });
    }

    const percentage = maxScore ? Number(((totalScore / maxScore) * 100).toFixed(1)) : 0;
    const level = resultLevel(percentage);
    const xpEarned = Math.round(
      totalScore *
        (scenario.difficulty === "Hard" ? 1.8 : scenario.difficulty === "Medium" ? 1.4 : 1)
    );
    const attempt = await Attempt.create(
      {
        userId: req.user.id,
        scenarioId: scenario.id,
        totalScore,
        maxScore,
        percentage,
        resultLevel: level,
        scenarioTitle: scenario.title,
        categorySnapshot: scenario.category,
        difficultySnapshot: scenario.difficulty,
        xpEarned,
      },
      { transaction }
    );

    await AttemptAnswer.bulkCreate(
      answerRows.map((row) => ({ ...row, attemptId: attempt.id })),
      { transaction, validate: true }
    );
    await transaction.commit();

    res.status(201).json({
      id: attempt.id,
      totalScore,
      maxScore,
      percentage,
      resultLevel: level,
      scenarioTitle: scenario.title,
      difficulty: scenario.difficulty,
      xpEarned,
      review,
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    next(error);
  }
}

async function myAttempts(req, res, next) {
  try {
    const attempts = await Attempt.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Scenario,
          as: "scenario",
          attributes: ["id", "title", "category", "difficulty", "imageKey"],
        },
      ],
      order: [["completedAt", "DESC"]],
    });
    res.json(attempts.map((attempt) => presentAttemptSummary(attempt)));
  } catch (error) {
    next(error);
  }
}

async function allAttempts(req, res, next) {
  try {
    const where = {};
    for (const field of ["scenarioId", "userId"]) {
      if (req.query[field] !== undefined) {
        const id = positiveId(req.query[field]);
        if (!id) return res.status(400).json({ message: `${field} must be a positive integer` });
        where[field] = id;
      }
    }
    if (req.query.resultLevel) where.resultLevel = String(req.query.resultLevel).slice(0, 40);

    const attempts = await Attempt.findAll({
      where,
      include: [
        {
          model: Scenario,
          as: "scenario",
          attributes: ["id", "title", "category", "difficulty", "imageKey"],
        },
        { model: User, as: "user", attributes: ["id", "name", "email"] },
      ],
      order: [["completedAt", "DESC"]],
    });
    res.json(attempts.map((attempt) => presentAttemptSummary(attempt, true)));
  } catch (error) {
    next(error);
  }
}

async function getAttemptDetail(req, res, next) {
  try {
    const id = positiveId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid attempt ID" });

    const attempt = await Attempt.findByPk(id, {
      include: [
        {
          model: Scenario,
          as: "scenario",
          attributes: ["id", "title", "category", "difficulty", "imageKey"],
        },
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        {
          model: AttemptAnswer,
          as: "answers",
          include: [
            { model: Step, as: "step", attributes: ["id", "orderNumber", "question"], required: false },
            { model: Choice, as: "choice", attributes: ["id", "text", "feedback"], required: false },
          ],
        },
      ],
    });

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (req.user.role !== "admin" && attempt.userId !== req.user.id) {
      return res.status(403).json({ message: "You cannot view this attempt" });
    }

    res.json(presentAttemptDetail(attempt));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitAttempt,
  myAttempts,
  allAttempts,
  getAttemptDetail,
};
