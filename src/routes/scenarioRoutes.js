const router = require("express").Router();
const {
  scenarioSummary,
  listScenarios,
  getScenario,
  getChoiceFeedback,
  createScenario,
  updateScenario,
  deleteScenario,
} = require("../controllers/scenarioController");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate);
router.get("/", listScenarios);
router.get("/summary", scenarioSummary);
router.post("/:id/feedback", requireRole("trainee"), getChoiceFeedback);
router.get("/:id", getScenario);
router.post("/", requireRole("admin"), createScenario);
router.put("/:id", requireRole("admin"), updateScenario);
router.delete("/:id", requireRole("admin"), deleteScenario);

module.exports = router;
