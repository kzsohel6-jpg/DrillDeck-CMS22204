const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Attempt = sequelize.define("Attempt", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  totalScore: { type: DataTypes.INTEGER, allowNull: false },
  maxScore: { type: DataTypes.INTEGER, allowNull: false },
  percentage: { type: DataTypes.FLOAT, allowNull: false },
  resultLevel: { type: DataTypes.STRING(40), allowNull: false },
  scenarioTitle: { type: DataTypes.STRING(150), allowNull: false, defaultValue: "" },
  categorySnapshot: { type: DataTypes.STRING(80), allowNull: false, defaultValue: "" },
  difficultySnapshot: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "Medium" },
  xpEarned: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  completedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

module.exports = Attempt;
