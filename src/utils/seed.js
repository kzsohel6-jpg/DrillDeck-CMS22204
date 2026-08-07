const bcrypt = require("bcryptjs");
const seedScenarios = require("./seedScenarios.json");
const { sequelize, User, Scenario, Step, Choice } = require("../models");

async function createScenarioWithSteps(adminId, scenarioData, transaction) {
  const { steps, ...scenarioFields } = scenarioData;
  const scenario = await Scenario.create(
    {
      ...scenarioFields,
      isPublished: true,
      createdBy: adminId,
    },
    { transaction }
  );

  for (const [index, stepData] of steps.entries()) {
    const step = await Step.create(
      {
        scenarioId: scenario.id,
        orderNumber: index + 1,
        situation: stepData.situation,
        question: stepData.question,
      },
      { transaction }
    );

    await Choice.bulkCreate(
      stepData.choices.map((choice) => ({ ...choice, stepId: step.id })),
      { transaction }
    );
  }
}

async function seedDatabase() {
  const adminEmail = "admin@drilldeck.local";
  const traineeEmail = "trainee@drilldeck.local";

  const [admin] = await User.findOrCreate({
    where: { email: adminEmail },
    defaults: {
      name: "DrillDeck Admin",
      email: adminEmail,
      password: await bcrypt.hash("Admin123!", 12),
      role: "admin",
    },
  });

  await User.findOrCreate({
    where: { email: traineeEmail },
    defaults: {
      name: "Training User",
      email: traineeEmail,
      password: await bcrypt.hash("Trainee123!", 12),
      role: "trainee",
    },
  });

  // Seed the original training library only on a genuinely empty database.
  // This is important: administrator edits, draft status and custom scenarios
  // must remain unchanged after the server restarts.
  if (await Scenario.count() > 0) return;

  await sequelize.transaction(async (transaction) => {
    for (const scenarioData of seedScenarios) {
      await createScenarioWithSteps(admin.id, scenarioData, transaction);
    }
  });
}

module.exports = seedDatabase;
