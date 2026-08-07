function notFound(req, res) {
  res.status(404).json({ message: "Route not found" });
}

function errorHandler(error, req, res, next) {
  console.error(error);

  if (error.name === "SequelizeValidationError") {
    return res.status(400).json({
      message: error.errors.map((item) => item.message).join(", "),
    });
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({
      message: error.errors?.[0]?.path === "email"
        ? "An account already uses this email"
        : "A record with this title or value already exists",
    });
  }

  if (error.name === "SequelizeForeignKeyConstraintError") {
    return res.status(409).json({ message: "This record is linked to saved history and cannot be removed" });
  }

  return res.status(error.status || 500).json({
    message: error.message || "Unexpected server error",
  });
}

module.exports = { notFound, errorHandler };
