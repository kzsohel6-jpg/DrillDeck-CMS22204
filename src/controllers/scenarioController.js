const { Op } = require("sequelize");
const { sequelize, Scenario, Step, Choice, User, Attempt, AttemptAnswer } = require("../models");

const difficulties = new Set(["Easy", "Medium", "Hard"]);
const imageKeys = new Set([
  "phishing-email",
  "password-reset",
  "slip-hazard",
  "data-request",
  "suspicious-bag",
  "fire-alarm",
  "deescalation",
  "crowd-pressure",
  "ransomware",
  "mass-incident",
  "severe-weather",
  "system-failure",
]);

function text(value) {
  return String(value ?? "").trim();
}

function positiveId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function booleanValue(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}

function validateScenario(body = {}) {
  const title = text(body.title);
  const category = text(body.category);
  const description = text(body.description);
  const learningOutcome = text(body.learningOutcome);
  const skillFocus = text(body.skillFocus);
  const steps = body.steps;

  if (!title || !category || !description) return "Title, category and description are required";
  if (title.length > 150) return "Title must be 150 characters or fewer";
  if (category.length > 80) return "Category must be 80 characters or fewer";
  if (description.length > 3000) return "Description must be 3,000 characters or fewer";
  if (!difficulties.has(body.difficulty || "Medium")) return "Difficulty must be Easy, Medium or Hard";
  if (!learningOutcome) return "Add a learning outcome";
  if (learningOutcome.length > 1500) return "Learning outcome must be 1,500 characters or fewer";
  if (skillFocus.length > 220) return "Skill focus must be 220 characters or fewer";
  if (!Array.isArray(steps) || steps.length < 3) return "Add at least three decision steps";
  if (steps.length > 12) return "A scenario can contain no more than twelve decision steps";

  const duration = Number(body.durationMinutes);
  if (!Number.isInteger(duration) || duration < 3 || duration > 60) {
    return "Duration must be a whole number between 3 and 60 minutes";
  }

  for (const [index, step] of steps.entries()) {
    const situation = text(step?.situation);
    const question = text(step?.question);
    if (!situation || !question) return `Step ${index + 1} is incomplete`;
    if (situation.length > 2500) return `Situation ${index + 1} must be 2,500 characters or fewer`;
    if (question.length > 1000) return `Question ${index + 1} must be 1,000 characters or fewer`;
    if (!Array.isArray(step.choices) || step.choices.length < 4) return `Step ${index + 1} needs at least four choices`;
    if (step.choices.length > 8) return `Step ${index + 1} can contain no more than eight choices`;

    const normalisedChoices = step.choices.map((choice) => ({
      text: text(choice?.text),
      feedback: text(choice?.feedback),
      score: Number(choice?.score),
    }));

    const duplicateTexts = new Set();
    for (const choice of normalisedChoices) {
      if (!choice.text || !choice.feedback || !Number.isFinite(choice.score)) {
        return `Every choice in step ${index + 1} needs text, score and feedback`;
      }
      if (choice.text.length > 1200) return `Choice text in step ${index + 1} must be 1,200 characters or fewer`;
      if (choice.feedback.length > 2000) return `Choice feedback in step ${index + 1} must be 2,000 characters or fewer`;
      if (!Number.isInteger(choice.score) || choice.score < 0 || choice.score > 10) {
        return `Scores in step ${index + 1} must be whole numbers from 0 to 10`;
      }
      const key = choice.text.toLowerCase();
      if (duplicateTexts.has(key)) return `Step ${index + 1} contains a duplicated choice`;
      duplicateTexts.add(key);
    }

    const scores = normalisedChoices.map((choice) => choice.score);
    const highest = Math.max(...scores);
    if (scores.filter((score) => score === highest).length !== 1) {
      return `Step ${index + 1} must have one clear highest-scoring choice`;
    }
  }

  return null;
}

async function addNestedSteps(scenario, steps, transaction) {
  for (const [index, stepData] of steps.entries()) {
    const step = await Step.create(
      {
        scenarioId: scenario.id,
        orderNumber: index + 1,
        situation: text(stepData.situation),
        question: text(stepData.question),
      },
      { transaction }
    );

    await Choice.bulkCreate(
      stepData.choices.map((choice) => ({
        stepId: step.id,
        text: text(choice.text),
        score: Number(choice.score),
        feedback: text(choice.feedback),
      })),
      { transaction, validate: true }
    );
  }
}

function visibleScenarioWhere(user) {
  return user.role === "admin" ? {} : { isPublished: true };
}

async function scenarioSummary(req, res, next) {
  try {
    const scenarios = await Scenario.findAll({
      where: visibleScenarioWhere(req.user),
      attributes: ["id", "category", "difficulty"],
      include: [{ model: Step, as: "steps", attributes: ["id"] }],
      order: [["category", "ASC"]],
    });

    const difficultyCounts = { Easy: 0, Medium: 0, Hard: 0 };
    const categories = new Set();
    let decisionCount = 0;

    for (const scenario of scenarios) {
      difficultyCounts[scenario.difficulty] += 1;
      categories.add(scenario.category);
      decisionCount += scenario.steps.length;
    }

    res.json({
      scenarioCount: scenarios.length,
      decisionCount,
      difficultyCounts,
      categories: [...categories].sort((a, b) => a.localeCompare(b)),
    });
  } catch (error) {
    next(error);
  }
}

async function listScenarios(req, res, next) {
  try {
    const { q = "", category = "", difficulty = "", sortBy = "difficulty", order = "ASC" } = req.query;
    const where = visibleScenarioWhere(req.user);

    if (category) where.category = text(category);
    if (difficulty && difficulties.has(difficulty)) where.difficulty = difficulty;
    if (q) {
      const term = text(q).slice(0, 120);
      where[Op.or] = [
        { title: { [Op.like]: `%${term}%` } },
        { description: { [Op.like]: `%${term}%` } },
        { category: { [Op.like]: `%${term}%` } },
        { skillFocus: { [Op.like]: `%${term}%` } },
      ];
    }

    const allowedSort = ["title", "category", "difficulty", "createdAt", "durationMinutes"];
    const safeSort = allowedSort.includes(sortBy) ? sortBy : "difficulty";
    const safeOrder = String(order).toUpperCase() === "DESC" ? "DESC" : "ASC";

    const sortOrder = safeSort === "difficulty"
      ? [[sequelize.literal("CASE difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Hard' THEN 3 END"), safeOrder], ["title", "ASC"]]
      : [[safeSort, safeOrder], ["title", "ASC"]];

    const scenarios = await Scenario.findAll({
      where,
      include: [
        { model: Step, as: "steps", attributes: ["id"] },
        { model: User, as: "creator", attributes: ["id", "name"] },
      ],
      order: sortOrder,
    });

    res.json(scenarios.map((scenario) => ({
      ...scenario.toJSON(),
      stepCount: scenario.steps.length,
      skills: scenario.skillFocus.split(",").map((item) => item.trim()).filter(Boolean),
      imageUrl: `/scenarios/${scenario.imageKey}.svg`,
      steps: undefined,
    })));
  } catch (error) {
    next(error);
  }
}

async function loadScenario(id) {
  return Scenario.findByPk(id, {
    include: [{ model: Step, as: "steps", include: [{ model: Choice, as: "choices" }] }],
    order: [
      [{ model: Step, as: "steps" }, "orderNumber", "ASC"],
      [{ model: Step, as: "steps" }, { model: Choice, as: "choices" }, "id", "ASC"],
    ],
  });
}

async function getScenario(req, res, next) {
  try {
    const id = positiveId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid scenario ID" });

    const scenario = await loadScenario(id);
    if (!scenario || (!scenario.isPublished && req.user.role !== "admin")) {
      return res.status(404).json({ message: "Scenario not found" });
    }

    const data = scenario.toJSON();
    data.skills = data.skillFocus.split(",").map((item) => item.trim()).filter(Boolean);
    data.imageUrl = `/scenarios/${data.imageKey}.svg`;

    if (req.user.role !== "admin") {
      data.steps = data.steps.map((step) => ({
        id: step.id,
        orderNumber: step.orderNumber,
        situation: step.situation,
        question: step.question,
        choices: step.choices.map((choice) => ({ id: choice.id, text: choice.text })),
      }));
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function getChoiceFeedback(req, res, next) {
  try {
    const body = req.body || {};
    const scenarioId = positiveId(req.params.id);
    const stepId = positiveId(body.stepId);
    const choiceId = positiveId(body.choiceId);
    if (!scenarioId || !stepId || !choiceId) {
      return res.status(400).json({ message: "Scenario, step and choice IDs must be valid" });
    }

    const scenario = await Scenario.findByPk(scenarioId, {
      include: [{ model: Step, as: "steps", include: [{ model: Choice, as: "choices" }] }],
    });

    if (!scenario || !scenario.isPublished) {
      return res.status(404).json({ message: "Published scenario not found" });
    }

    const step = scenario.steps.find((item) => item.id === stepId);
    const choice = step && step.choices.find((item) => item.id === choiceId);
    if (!step || !choice) {
      return res.status(400).json({ message: "That choice does not belong to this scenario step" });
    }

    const maxScore = Math.max(...step.choices.map((item) => item.score));
    res.json({ score: choice.score, maxScore, feedback: choice.feedback });
  } catch (error) {
    next(error);
  }
}

function scenarioFields(body) {
  return {
    title: text(body.title),
    category: text(body.category),
    difficulty: body.difficulty || "Medium",
    description: text(body.description),
    imageKey: imageKeys.has(body.imageKey) ? body.imageKey : "phishing-email",
    durationMinutes: Number(body.durationMinutes),
    learningOutcome: text(body.learningOutcome),
    skillFocus: text(body.skillFocus) || "Decision-making",
    isPublished: booleanValue(body.isPublished),
  };
}

async function createScenario(req, res, next) {
  const validationMessage = validateScenario(req.body);
  if (validationMessage) return res.status(400).json({ message: validationMessage });

  const transaction = await sequelize.transaction();
  try {
    const scenario = await Scenario.create(
      { ...scenarioFields(req.body), createdBy: req.user.id },
      { transaction }
    );
    await addNestedSteps(scenario, req.body.steps, transaction);
    await transaction.commit();
    res.status(201).json({ message: "Scenario created", id: scenario.id });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    next(error);
  }
}

async function updateScenario(req, res, next) {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid scenario ID" });

  const validationMessage = validateScenario(req.body);
  if (validationMessage) return res.status(400).json({ message: validationMessage });

  const transaction = await sequelize.transaction();
  try {
    const scenario = await Scenario.findByPk(id, { transaction });
    if (!scenario) {
      await transaction.rollback();
      return res.status(404).json({ message: "Scenario not found" });
    }

    await scenario.update(scenarioFields(req.body), { transaction });
    const oldSteps = await Step.findAll({
      where: { scenarioId: scenario.id },
      attributes: ["id"],
      transaction,
    });
    const oldStepIds = oldSteps.map((step) => step.id);

    if (oldStepIds.length) {
      const oldChoices = await Choice.findAll({
        where: { stepId: oldStepIds },
        attributes: ["id"],
        transaction,
      });
      const oldChoiceIds = oldChoices.map((choice) => choice.id);

      // Saved answers use text snapshots, so old foreign-key references can be
      // detached safely before content is rebuilt. This also supports databases
      // created by earlier DrillDeck versions whose foreign keys were stricter.
      if (oldChoiceIds.length) {
        await AttemptAnswer.update(
          { choiceId: null },
          { where: { choiceId: oldChoiceIds }, transaction }
        );
      }
      await AttemptAnswer.update(
        { stepId: null },
        { where: { stepId: oldStepIds }, transaction }
      );
      await Choice.destroy({ where: { stepId: oldStepIds }, transaction });
    }

    await Step.destroy({ where: { scenarioId: scenario.id }, transaction });
    await addNestedSteps(scenario, req.body.steps, transaction);

    await transaction.commit();
    res.json({ message: "Scenario updated" });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    next(error);
  }
}

async function deleteScenario(req, res, next) {
  const id = positiveId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid scenario ID" });

  const transaction = await sequelize.transaction();
  try {
    const scenario = await Scenario.findByPk(id, { transaction });
    if (!scenario) {
      await transaction.rollback();
      return res.status(404).json({ message: "Scenario not found" });
    }

    const attemptCount = await Attempt.count({ where: { scenarioId: scenario.id }, transaction });
    if (attemptCount > 0) {
      await transaction.rollback();
      return res.status(409).json({
        message: "This scenario has recorded attempts. Unpublish it instead of deleting its training history.",
      });
    }

    const steps = await Step.findAll({ where: { scenarioId: scenario.id }, attributes: ["id"], transaction });
    const stepIds = steps.map((step) => step.id);
    if (stepIds.length) await Choice.destroy({ where: { stepId: stepIds }, transaction });
    await Step.destroy({ where: { scenarioId: scenario.id }, transaction });
    await scenario.destroy({ transaction });
    await transaction.commit();
    res.json({ message: "Scenario deleted" });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    next(error);
  }
}

module.exports = {
  scenarioSummary,
  listScenarios,
  getScenario,
  getChoiceFeedback,
  createScenario,
  updateScenario,
  deleteScenario,
};
