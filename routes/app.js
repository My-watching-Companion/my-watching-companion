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

// Home
router.get("/", homeController.getHome);

// Sign in / Sign up
router.get("/signin", signController.getSignin);

router.get("/signup", signController.getSignup);

router.get("/forgot-password", signController.getForgotPassword);

// Settings
router.get("/settings", isAuthenticated, settingsController.getSettings);

router.get(
  "/settings/:cat/:sett",
  isAuthenticated,
  settingsController.getSettingsByCatAndPage
);

// Account
router.get("/account", accountController.getAccount);

// Discovery
router.get("/discovery", isAuthenticated, discoveryController.getDiscovery);

// Watchlists
router.get(
  "/my-watchlists",
  isAuthenticated,
  watchlistsController.getWatchlists
);

router.get("/my-watchlists/:name", watchlistsController.getWatchlistByName);

router.get("/artwork/:id", artworksController.getArtwork);

// Définition de la route erreur 404
router.get("*", errorController.getError);

module.exports = router;
