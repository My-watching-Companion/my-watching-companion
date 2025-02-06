const router = require("express").Router();
const { executeQuery } = require("../db");
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

router.get("/settings", isAuthenticated, (req,res)=>{
  res.render("settings", { selected: "Paramètres", choice: null, user: req.session.user })
})

router.get("/settings/:cat/:sett", isAuthenticated, async(req,res)=>{
  const categories = req.params["cat"]
  const page = req.params["sett"]
  let friends = null
  let allusers = null
  if (categories !== undefined && page !== undefined){
    if(categories === "confidentiality" && page === "friends"){
      friends = await fetch(`http://localhost:3000/api/friends/${req.session.user}`)
                          .then((resp) => resp.json())

      allusers = await fetch(`http://localhost:3000/api/getuserswithoutfriends/${req.session.user}`)
                          .then((resp)=> resp.json())
    }
      res.render("settings", { selected: "Paramètres", choice: `${categories}/${page}`, user: req.session.user, friends: friends, allusers : allusers })
    
  }
})

// Définition de la route erreur 404
router.get("*", (req, res) => {
  res.status(404);

  res.render("error", { selected: "Erreur" });
});

module.exports = router;
