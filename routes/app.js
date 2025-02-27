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
    user: req.session.user,
  });
});

router.get("/settings/:cat/:sett", isAuthenticated, async (req, res) => {
  const categories = req.params["cat"];
  const page = req.params["sett"];
  let friends = null;
  let allusers = null;
  let nature = null;
  if (categories !== undefined && page !== undefined) {
    if (categories === "profile" && page === "modifyprofile") {
    } else if (categories === "confidentiality" && page === "friends") {
    } else if (categories === "watchlists" && page === "preferences") {
      nature = await fetch("http://localhost:3000/api/getallnature").then(
        (resp) => resp.json()
      );
    }
    res.render("settings", {
      selected: "Paramètres",
      choice: `${categories}/${page}`,
      user: req.session.user,
      friends: friends,
      allusers: allusers,
      nature: nature,
    });
  }
});

router.get("/discovery", isAuthenticated, async (req, res) => {
  const user = req.session.user;
  let isfriends = false;
  let iswl = false;
  const friends = await fetch(
    `http://localhost:3000/api/friends/${req.session.user.username}`
  ).then((resp) => resp.json());

  allusers = await fetch(
    `http://localhost:3000/api/getuserswithoutfriends/${req.session.user.username}`
  ).then((resp) => resp.json());

  let wloffriends = {};
  if (friends.Friends.length > 0) {
    isfriends = true;
  }
  for (const element of friends.Friends) {
    const watchlists = await fetch(
      `http://localhost:3000/api/users/${element.Username}/watchlists`
    ).then((resp) => resp.json());
    if (watchlists.Watchlist === null) {
      continue;
    } else {
      wloffriends[element.Username] = watchlists;
    }
  }
  for (const user of Object.keys(wloffriends)) {
    for (const wl of wloffriends[user].Watchlist) {
      if (wl !== null || wl !== undefined || wl.length !== 0) {
        iswl = true;
        break;
      }
    }
  }

  res.render("discover", {
    selected: "Découverte",
    friends: friends,
    wloffriends: wloffriends,
    isfriends: isfriends,
    iswl: iswl,
    user: req.session.user,
    allusers: allusers,
  });
});

router.get("/my-watchlist", isAuthenticated, (req, res) => {
  res.render("my-watchlist", {
    selected: "Ma Watchlist",
    user: req.session.user,
  });
});

router.get("/account", (req, res) => {
  res.render("account", { selected: "Mot de Passe Oublié" });
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
