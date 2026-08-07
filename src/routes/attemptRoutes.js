const router = require("express").Router();
const {
  submitAttempt,
  myAttempts,
  allAttempts,
  getAttemptDetail,
} = require("../controllers/attemptController");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate);
router.post("/", requireRole("trainee"), submitAttempt);
router.get("/my", requireRole("trainee"), myAttempts);
router.get("/all", requireRole("admin"), allAttempts);
router.get("/:id", getAttemptDetail);

module.exports = router;
