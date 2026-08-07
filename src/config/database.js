const path = require("path");
const fs = require("fs");
const { Sequelize } = require("sequelize");

const configuredPath = process.env.DATABASE_PATH || "database/drilldeck-final.sqlite";
const databasePath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.join(__dirname, "..", "..", configuredPath);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: databasePath,
  logging: false,
});

module.exports = sequelize;
