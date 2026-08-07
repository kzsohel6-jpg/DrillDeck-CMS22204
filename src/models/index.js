const sequelize = require("../config/database");
const User = require("./User");
const Scenario = require("./Scenario");
const Step = require("./Step");
const Choice = require("./Choice");
const Attempt = require("./Attempt");
const AttemptAnswer = require("./AttemptAnswer");

User.hasMany(Scenario, { foreignKey: "createdBy", as: "createdScenarios" });
Scenario.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

Scenario.hasMany(Step, { foreignKey: "scenarioId", as: "steps", onDelete: "CASCADE", hooks: true });
Step.belongsTo(Scenario, { foreignKey: "scenarioId" });

Step.hasMany(Choice, { foreignKey: "stepId", as: "choices", onDelete: "CASCADE", hooks: true });
Choice.belongsTo(Step, { foreignKey: "stepId" });

User.hasMany(Attempt, { foreignKey: "userId", as: "attempts", onDelete: "CASCADE", hooks: true });
Attempt.belongsTo(User, { foreignKey: "userId", as: "user" });

Scenario.hasMany(Attempt, { foreignKey: "scenarioId", as: "attempts" });
Attempt.belongsTo(Scenario, { foreignKey: "scenarioId", as: "scenario" });

Attempt.hasMany(AttemptAnswer, {
  foreignKey: "attemptId",
  as: "answers",
  onDelete: "CASCADE",
  hooks: true,
});
AttemptAnswer.belongsTo(Attempt, { foreignKey: "attemptId" });
AttemptAnswer.belongsTo(Step, {
  foreignKey: { name: "stepId", allowNull: true },
  as: "step",
  onDelete: "SET NULL",
});
AttemptAnswer.belongsTo(Choice, {
  foreignKey: { name: "choiceId", allowNull: true },
  as: "choice",
  onDelete: "SET NULL",
});

module.exports = {
  sequelize,
  User,
  Scenario,
  Step,
  Choice,
  Attempt,
  AttemptAnswer,
};
