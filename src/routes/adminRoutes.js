const router = require("express").Router();
const {
  listTrainees,
  updateTrainee,
  resetTraineePassword,
  deleteTrainee,
} = require("../controllers/adminController");
const { authenticate, requireRole } = require("../middleware/auth");

router.use(authenticate, requireRole("admin"));
router.get("/trainees", listTrainees);
router.put("/trainees/:id", updateTrainee);
router.patch("/trainees/:id/password", resetTraineePassword);
router.delete("/trainees/:id", deleteTrainee);

module.exports = router;
