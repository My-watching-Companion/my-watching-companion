const router = require("express").Router();
const accountController = require("../controllers/app/account");
const discoveryController = require("../controllers/app/discovery");
const errorController = require("../controllers/app/error");
const homeController = require("../controllers/app/home");
const settingsController = require("../controllers/app/settings");
const signController = require("../controllers/app/sign-in-up");
const watchlistsController = require("../controllers/app/watchlists");
const artworksController = require("../controllers/app/artworks");
const { isAuthenticated } = require("../controllers/functions");

// Définition de la route principale
router.get("/", homeController.getHome);

router.get("/signin", signController.getSignin);

router.get("/signup", signController.getSignup);

router.get("/settings", isAuthenticated, settingsController.getSettings);

router.get(
  "/settings/:cat/:sett",
  isAuthenticated,
  settingsController.getSettingsByCatAndPage
);

router.get("/discovery", isAuthenticated, discoveryController.getDiscovery);

router.get(
  "/my-watchlist",
  isAuthenticated,
  watchlistsController.getWatchlists
);

router.get("/account", accountController.getAccount);

router.get("/forgot-password", signController.getForgotPassword);

router.get("/artwork/:id", artworksController.getArtwork);

// Définition de la route erreur 404
router.get("*", errorController.getError);

module.exports = router;
