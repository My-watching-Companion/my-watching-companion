const router = require("express").Router();

// Définition de la route principale
router.get("/", (req, res) => {
  res.render("home");
});

router.get("/connection", (req, res) => {
  res.render("connection");
});

// Définition de la route erreur 404
router.get("*", (req, res) => {
  res.status(404);

  res.render("error");
});

module.exports = router;
