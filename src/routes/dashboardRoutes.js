const router = require("express").Router();
const { traineeDashboard, adminDashboard } = require("../controllers/dashboardController");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate);
router.get("/trainee", requireRole("trainee"), traineeDashboard);
router.get("/admin", requireRole("admin"), adminDashboard);

module.exports = router;
