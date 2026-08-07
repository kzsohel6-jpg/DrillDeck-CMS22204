const { DataTypes } = require("sequelize");
const { sequelize } = require("../models");

async function ensureColumn(queryInterface, table, description, name, definition) {
  if (!description[name]) {
    await queryInterface.addColumn(table, name, definition);
  }
}

async function ensureSchema() {
  await sequelize.query("PRAGMA foreign_keys = ON");

  const queryInterface = sequelize.getQueryInterface();
  const answers = await queryInterface.describeTable("AttemptAnswers");

  await ensureColumn(queryInterface, "AttemptAnswers", answers, "stepNumber", {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  });
  await ensureColumn(queryInterface, "AttemptAnswers", answers, "maxScore", {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10,
  });
  await ensureColumn(queryInterface, "AttemptAnswers", answers, "questionText", {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "",
  });
  await ensureColumn(queryInterface, "AttemptAnswers", answers, "selectedText", {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "",
  });
  await ensureColumn(queryInterface, "AttemptAnswers", answers, "feedbackText", {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: "",
  });

  const attempts = await queryInterface.describeTable("Attempts");
  const difficultySnapshotWasMissing = !attempts.difficultySnapshot;
  await ensureColumn(queryInterface, "Attempts", attempts, "scenarioTitle", {
    type: DataTypes.STRING(150),
    allowNull: false,
    defaultValue: "",
  });
  await ensureColumn(queryInterface, "Attempts", attempts, "categorySnapshot", {
    type: DataTypes.STRING(80),
    allowNull: false,
    defaultValue: "",
  });
  await ensureColumn(queryInterface, "Attempts", attempts, "difficultySnapshot", {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: "Medium",
  });
  await ensureColumn(queryInterface, "Attempts", attempts, "xpEarned", {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  });

  // Backfill projects created with the earlier schema before administrators
  // start editing scenario content. New attempts always write these snapshots.
  await sequelize.query(`
    UPDATE AttemptAnswers
    SET
      stepNumber = COALESCE((SELECT orderNumber FROM Steps WHERE Steps.id = AttemptAnswers.stepId), stepNumber),
      questionText = CASE
        WHEN questionText = '' THEN COALESCE((SELECT question FROM Steps WHERE Steps.id = AttemptAnswers.stepId), '')
        ELSE questionText
      END,
      selectedText = CASE
        WHEN selectedText = '' THEN COALESCE((SELECT text FROM Choices WHERE Choices.id = AttemptAnswers.choiceId), '')
        ELSE selectedText
      END,
      feedbackText = CASE
        WHEN feedbackText = '' THEN COALESCE((SELECT feedback FROM Choices WHERE Choices.id = AttemptAnswers.choiceId), '')
        ELSE feedbackText
      END,
      maxScore = COALESCE(
        (SELECT MAX(score) FROM Choices WHERE Choices.stepId = AttemptAnswers.stepId),
        maxScore
      )
  `);

  await sequelize.query(`
    UPDATE Attempts
    SET
      scenarioTitle = CASE
        WHEN scenarioTitle = '' THEN COALESCE((SELECT title FROM Scenarios WHERE Scenarios.id = Attempts.scenarioId), 'Historical scenario')
        ELSE scenarioTitle
      END,
      categorySnapshot = CASE
        WHEN categorySnapshot = '' THEN COALESCE((SELECT category FROM Scenarios WHERE Scenarios.id = Attempts.scenarioId), 'Training')
        ELSE categorySnapshot
      END
  `);

  if (difficultySnapshotWasMissing) {
    await sequelize.query(`
      UPDATE Attempts
      SET difficultySnapshot = COALESCE(
        (SELECT difficulty FROM Scenarios WHERE Scenarios.id = Attempts.scenarioId),
        'Medium'
      )
    `);
  } else {
    await sequelize.query(`
      UPDATE Attempts
      SET difficultySnapshot = COALESCE(
        (SELECT difficulty FROM Scenarios WHERE Scenarios.id = Attempts.scenarioId),
        'Medium'
      )
      WHERE difficultySnapshot = '' OR difficultySnapshot IS NULL
    `);
  }

  await sequelize.query(`
    UPDATE Attempts
    SET xpEarned = CASE
      WHEN xpEarned > 0 THEN xpEarned
      WHEN difficultySnapshot = 'Hard' THEN ROUND(totalScore * 1.8)
      WHEN difficultySnapshot = 'Medium' THEN ROUND(totalScore * 1.4)
      ELSE totalScore
    END
  `);
}

module.exports = ensureSchema;
