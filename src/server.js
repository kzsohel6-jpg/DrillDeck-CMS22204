require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { sequelize } = require("./models");
const ensureSchema = require("./utils/ensureSchema");
const seedDatabase = require("./utils/seed");
const authRoutes = require("./routes/authRoutes");
const scenarioRoutes = require("./routes/scenarioRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "development_only_change_this_secret";
  console.warn("Using a development JWT secret. Add JWT_SECRET to server/.env before deployment.");
}

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((item) => item.trim());

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (req, res) => {
  try {
    await sequelize.query("SELECT 1 AS databaseCheck");
    res.json({
      message: "Welcome to the DrillDeck API",
      application: "DrillDeck",
      version: "5.0.0",
      status: "ok",
      database: "SQLite",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      application: "DrillDeck",
      version: "5.0.0",
      status: "error",
      database: "unavailable",
      message: "Database health check failed",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/scenarios", scenarioRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

const clientDist = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    return res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensureSchema();
    await seedDatabase();
    app.listen(port, () => {
      console.log(`DrillDeck server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Unable to start DrillDeck:", error);
    process.exit(1);
  }
}

start();
