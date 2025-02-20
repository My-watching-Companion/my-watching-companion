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

router.get("/settings", isAuthenticated, (req, res) => {
  res.render("settings", {
    selected: "Paramètres",
    choice: null,
    user: req.session.user.username,
  });
});

router.get("/settings/:cat/:sett", isAuthenticated, async (req, res) => {
  const categories = req.params["cat"];
  const page = req.params["sett"];
  let friends = null;
  let allusers = null;
  let nature = null;
  console.log(categories, page)
  if (categories !== undefined && page !== undefined) {
    if (categories === "confidentiality" && page === "friends") {
      friends = await fetch(
        `http://localhost:3000/api/friends/${req.session.user.username}`
      ).then((resp) => resp.json());

      allusers = await fetch(
        `http://localhost:3000/api/getuserswithoutfriends/${req.session.user.username}`
      ).then((resp) => resp.json());
    }else if(categories === "watchlists" && page === "preferences") {
      nature = await fetch("http://localhost:3000/api/getallnature").then((resp) => resp.json());
      console.log(nature)
    }
      res.render("settings", {
        selected: "Paramètres",
        choice: `${categories}/${page}`,
        user: req.session.user.username,
        friends: friends,
        allusers: allusers,
        nature: nature,
      });
    } 
  }
);

router.get("discover", isAuthenticated, async (req, res) => {
  res.render("discover", { selected: "Découvrir" });
});

router.get("/discovery", isAuthenticated, async (req, res) => {
  const user = req.session.user;
  const friends = await fetch(
    `http://localhost:3000/api/friends/${req.session.user}`
  ).then((resp) => resp.json());

  let wloffriends = {};
  
  for (const element of friends.Friends) {
    const watchlists = await fetch(
      `http://localhost:3000/api/users/${element.Username}/watchlists`
    ).then((resp) => resp.json());
    if (watchlists.Watchlist === null) {
      continue;
    }
    else{
      wloffriends[element.Username] = watchlists;   
    }
  }


  res.render("discover", {
    selected: "Découverte",
    friends: friends,
    wloffriends: wloffriends,
  });
});

router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { selected: "Mot de Passe Oublié" });
});

// Définition de la route erreur 404
router.get("*", (req, res) => {
  res.status(404);

  res.render("error", { selected: "Erreur" });
});

module.exports = router;
