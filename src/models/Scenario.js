const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Scenario = sequelize.define("Scenario", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  category: { type: DataTypes.STRING(80), allowNull: false },
  difficulty: {
    type: DataTypes.ENUM("Easy", "Medium", "Hard"),
    allowNull: false,
    defaultValue: "Medium",
  },
  description: { type: DataTypes.TEXT, allowNull: false },
  imageKey: { type: DataTypes.STRING(80), allowNull: false, defaultValue: "phishing-email" },
  durationMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 8 },
  learningOutcome: { type: DataTypes.TEXT, allowNull: false, defaultValue: "Practise structured decision-making." },
  skillFocus: { type: DataTypes.STRING(220), allowNull: false, defaultValue: "Decision-making" },
  isPublished: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});

module.exports = Scenario;
