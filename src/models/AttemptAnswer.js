const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const AttemptAnswer = sequelize.define("AttemptAnswer", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  stepNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  score: { type: DataTypes.INTEGER, allowNull: false },
  maxScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
  questionText: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
  selectedText: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
  feedbackText: { type: DataTypes.TEXT, allowNull: false, defaultValue: "" },
});

module.exports = AttemptAnswer;
