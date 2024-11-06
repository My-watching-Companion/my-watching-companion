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

router.get("/settings", (req,res)=>{
  res.render("settings", { selected: "Paramètres" })
})

// Définition de la route erreur 404
router.get("*", (req, res) => {
  res.status(404);

  res.render("error");
});

module.exports = router;
