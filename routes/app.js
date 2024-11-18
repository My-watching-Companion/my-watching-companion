const router = require("express").Router();
const { isAuthenticated, GetUser } = require("./api");

// Définition de la route principale
router.get("/", (req, res) => {
  res.render("home", { selected: "Accueil" });
});

router.get("/signin", (req, res) => {
  res.render("signin", { selected: "Connexion" });
});

router.get("/signup", (req, res) => {
  res.render("signup", { selected: "Inscription" });
});

// Définition de la route erreur 404
router.get("*", (req, res) => {
  res.status(404);

  res.render("error", { selected: "Erreur" });
});

module.exports = router;
