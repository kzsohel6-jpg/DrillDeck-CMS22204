const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Step = sequelize.define("Step", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  orderNumber: { type: DataTypes.INTEGER, allowNull: false },
  situation: { type: DataTypes.TEXT, allowNull: false },
  question: { type: DataTypes.TEXT, allowNull: false },
});

module.exports = Step;
