const router = require("express").Router();

// Définition de la route principale
router.get("/", (req, res) => {
  res.render("home");
});

// Définition de la route erreur 404
router.get("*", (req, res) => {
  res.status(404);

  res.render("error");
});

module.exports = router;
