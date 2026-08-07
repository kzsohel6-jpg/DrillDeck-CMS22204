const bcrypt = require("bcryptjs");
const { sequelize, User, Attempt, AttemptAnswer, Scenario } = require("../models");

function average(values) {
  if (!values.length) return 0;
  return Number((values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length).toFixed(1));
}

function validId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function listTrainees(req, res, next) {
  try {
    const [trainees, attempts] = await Promise.all([
      User.findAll({
        where: { role: "trainee" },
        attributes: ["id", "name", "email", "createdAt", "updatedAt"],
        order: [["name", "ASC"]],
      }),
      Attempt.findAll({
        include: [
          { model: Scenario, as: "scenario", attributes: ["id", "title", "difficulty", "category"] },
        ],
        order: [["completedAt", "DESC"]],
      }),
    ]);

    const attemptsByUser = new Map();
    for (const attempt of attempts) {
      const collection = attemptsByUser.get(attempt.userId) || [];
      collection.push(attempt);
      attemptsByUser.set(attempt.userId, collection);
    }

    const records = trainees.map((trainee) => {
      const traineeAttempts = attemptsByUser.get(trainee.id) || [];
      const completedScenarios = new Set(traineeAttempts.map((attempt) => attempt.scenarioId)).size;
      return {
        ...trainee.toJSON(),
        totalAttempts: traineeAttempts.length,
        completedScenarios,
        averageScore: average(traineeAttempts.map((attempt) => attempt.percentage)),
        bestScore: traineeAttempts.length
          ? Math.max(...traineeAttempts.map((attempt) => Number(attempt.percentage)))
          : 0,
        lastActivity: traineeAttempts[0]?.completedAt || null,
      };
    });

    res.json(records);
  } catch (error) {
    next(error);
  }
}

async function updateTrainee(req, res, next) {
  const id = validId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid trainee ID" });

  const body = req.body || {};
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ message: "Name must contain between 2 and 80 characters" });
  }
  if (email.length > 120 || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }
  if (password && (password.length < 8 || password.length > 128)) {
    return res.status(400).json({ message: "Password must contain between 8 and 128 characters" });
  }

  const transaction = await sequelize.transaction();
  try {
    const trainee = await User.findOne({ where: { id, role: "trainee" }, transaction });
    if (!trainee) {
      await transaction.rollback();
      return res.status(404).json({ message: "Trainee not found" });
    }

    const updates = { name, email };
    if (password) updates.password = await bcrypt.hash(password, 12);
    await trainee.update(updates, { transaction });
    await transaction.commit();

    res.json({
      message: password ? "Trainee account and password updated" : "Trainee account updated",
      user: { id: trainee.id, name, email },
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    next(error);
  }
}

async function resetTraineePassword(req, res, next) {
  const id = validId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid trainee ID" });

  try {
    const trainee = await User.findOne({ where: { id, role: "trainee" } });
    if (!trainee) return res.status(404).json({ message: "Trainee not found" });

    const password = String((req.body || {}).password || "");
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: "Password must contain between 8 and 128 characters" });
    }

    await trainee.update({ password: await bcrypt.hash(password, 12) });
    res.json({ message: "Trainee password reset successfully" });
  } catch (error) {
    next(error);
  }
}

async function deleteTrainee(req, res, next) {
  const id = validId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid trainee ID" });

  const transaction = await sequelize.transaction();
  try {
    const trainee = await User.findOne({
      where: { id, role: "trainee" },
      transaction,
    });
    if (!trainee) {
      await transaction.rollback();
      return res.status(404).json({ message: "Trainee not found" });
    }

    const attempts = await Attempt.findAll({
      where: { userId: trainee.id },
      attributes: ["id"],
      transaction,
    });
    const attemptIds = attempts.map((attempt) => attempt.id);
    if (attemptIds.length) {
      await AttemptAnswer.destroy({ where: { attemptId: attemptIds }, transaction });
      await Attempt.destroy({ where: { id: attemptIds }, transaction });
    }
    await trainee.destroy({ transaction });
    await transaction.commit();

    res.json({ message: "Trainee account and its saved attempts were deleted" });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    next(error);
  }
}

module.exports = {
  listTrainees,
  updateTrainee,
  resetTraineePassword,
  deleteTrainee,
};
