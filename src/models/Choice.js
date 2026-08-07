const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Choice = sequelize.define("Choice", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  text: { type: DataTypes.TEXT, allowNull: false },
  score: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0, max: 10 } },
  feedback: { type: DataTypes.TEXT, allowNull: false },
});

module.exports = Choice;
